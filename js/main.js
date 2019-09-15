'use strict';

const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

function updateStatus(s) {
  document.querySelector('#status').innerText = s;
}

function updateProgress(s) {
  document.querySelector('#progress').innerText = s;
}

let workers = [];

function updateWorkers(nWorkers) {
  workers.map((w) => w.terminate());
  workers = [];

  for (let i = 0; i < nWorkers; ++i) {
    workers[i] = new Worker('js/worker.js');
    workers[i].onmessage = onWorkerFinish;
  }
}

function updateSize(size) {
  let [width, height] = size.split('x');
  width = Number.parseInt(width);
  height = Number.parseInt(height);

  canvas.width = width;
  canvas.height = height;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

function remap(x, inMin, inMax, outMin, outMax) {
  return ((x - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

let zoom = 1;
let x = 0;
let y = 0;

let drawing = false;
let time = 0;
let workerResults = [];

function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6);
  const f = 6 * h - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r;
  let g;
  let b;

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  r = Math.round(r * 255);
  g = Math.round(g * 255);
  b = Math.round(b * 255);

  return [r, g, b];
}

function palette(iters, maxIters, r) {
  if (iters == maxIters) {
    // Interior color.
    return [0, 0, 0];
  }

  const v = 5 + 0.6  * Math.log(Math.log(r)) + 0.3;
  const color = hsvToRgb(180 * v / maxIters, 1, 5 * iters / maxIters);

  return color;
}

function onWorkerFinish(e) {
  workerResults[workerResults.length] = e.data;

  updateProgress(`Workers: ${workerResults.length}/${workers.length}`);

  // See if all the workers finished.
  if (workerResults.length != workers.length) {
    return;
  }

  // Draw the result on the canvas.

  const maxIters = Math.max(...workerResults.map((r) => r.result.maxIters));

  const imgData = ctx.createImageData(canvas.width, canvas.height);

  function xyToId(x, y) {
    return canvas.width * y + x;
  }

  for (let workerResult of workerResults) {
    const input = workerResult.input;
    const result = workerResult.result;

    for (let i = 0; i < input.width; ++i) {
      for (let j = 0; j < input.height; ++j) {
        const id = xyToId(input.x + i, input.y + j) * 4;

        const nIters = result.iters[i][j];
        const radius = result.escapeRadiuses[i][j];

        const [r, g, b] = palette(nIters, maxIters, radius);

        imgData.data[id + 0] = r;
        imgData.data[id + 1] = g;
        imgData.data[id + 2] = b;
        imgData.data[id + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  updateStatus('Done in ' + (Date.now() - time) + 'ms');

  workerResults = [];
  drawing = false;
}

function redraw() {
  if (drawing) return;
  updateStatus('Drawing');
  drawing = true;
  time = Date.now();

  const REG_WIDTH = canvas.width;
  const REG_HEIGHT = Math.ceil(canvas.height / workers.length);

  for (let i = 0; i < workers.length; ++i) {
    workers[i].postMessage({
      x: 0,
      y: REG_HEIGHT * i,
      width: REG_WIDTH,
      height: REG_HEIGHT,
      totalWidth: canvas.width,
      totalHeight: canvas.height,
      mx: x,
      my: y,
      zoom: zoom
    });
  }
}

function resetView() {
  zoom = 1;
  x = 0;
  y = 0;
  redraw();
}

let dragging = false;
let dragX = 0;
let dragY = 0;

canvas.addEventListener('wheel', function(wheelEvent) {
  if (wheelEvent.deltaY < 0) {
    zoom *= 1.3;
  } else {
    zoom /= 1.3;
  }

  redraw();
});

canvas.addEventListener('mousemove', function(e) {
  if (dragging) {
    const FRAC_WIDTH = 2.6 / zoom;
    const FRAC_HEIGHT = 2 / zoom;

    x += remap(dragX - e.offsetX, -canvas.width / 2, canvas.width / 2,
      -FRAC_WIDTH / 2, FRAC_WIDTH / 2) / 10;

    y += remap(dragY - e.offsetY, -canvas.height / 2, canvas.height / 2,
      -FRAC_HEIGHT / 2, FRAC_HEIGHT / 2) / 10;
  }
});

canvas.addEventListener('mousedown', function(e) {
  dragging = true;
  dragX = e.offsetX;
  dragY = e.offsetY;
});

canvas.addEventListener('mouseup', function(e) {
  dragging = false;
  redraw();
});

updateWorkers(2);
redraw();

