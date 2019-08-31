'use strict';

const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

let workers = [];

function updateStatus(s) {
  document.querySelector('#status').innerText = s;
}

function updateProgress(s) {
  document.querySelector('#progress').innerText = s;
}

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

function drawPixel(x, y, color) {
  color = color || 'black';

  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
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

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return [r, g, b];
}

function onWorkerFinish(e) {
  workerResults[workerResults.length] = e.data;

  updateProgress(`${workerResults.length}/${workers.length}`);
  if (workerResults.length != workers.length) {
    return;
  }


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
        const nIters = result.iters[i][j];
        const hue = nIters / maxIters * 360;
        const id = xyToId(input.x + i, input.y + j) * 4;

        const [r, g, b] = hslToRgb(hue, 0.8, 0.5);

        if (nIters > 0) {
          imgData.data[id + 0] = r;
          imgData.data[id + 1] = g;
          imgData.data[id + 2] = b;
          imgData.data[id + 3] = 255;
        } else {
          imgData.data[id + 0] = 0;
          imgData.data[id + 1] = 0;
          imgData.data[id + 2] = 0;
          imgData.data[id + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  updateStatus('Done in ' + (Date.now() - time ));

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
    const FRAC_WIDTH = 3.5 / zoom;
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

