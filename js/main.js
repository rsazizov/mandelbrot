'use strict';

const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

const N_WORKERS = 8;
let workers = [];

for (let i = 0; i < N_WORKERS; ++i) {
  workers[i] = new Worker('js/worker.js');
  workers[i].onmessage = onWorkerFinish;
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
let workerResults = [];

function onWorkerFinish(e) {
  workerResults[workerResults.length] = e.data;

  if (workerResults.length != N_WORKERS) {
    return;
  }

  const maxIters = Math.max(...workerResults.map((r) => r.result.maxIters));
  console.log(maxIters);

  for (let workerResult of workerResults) {
    const input = workerResult.input;
    const result = workerResult.result;

    for (let i = 0; i < input.width; ++i) {
      for (let j = 0; j < input.height; ++j) {
        const nIters = result.iters[i][j];
        const hue = nIters / maxIters * 359;

        let color;
        if (nIters == 0) {
          color = 'black';
        } else {
          color = `hsl(${hue}, 50%, 50%)`;
        }

        drawPixel(i + input.x, j + input.y, color);
      }
    }
  }

  workerResults = [];
  drawing = false;
}

function redraw() {
  if (drawing) return;
  drawing = true;

  const REG_WIDTH = canvas.width;
  const REG_HEIGHT = Math.ceil(canvas.height / N_WORKERS);

  for (let i = 0; i < N_WORKERS; ++i) {
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

canvas.addEventListener('wheel', function(wheelEvent) {
  if (wheelEvent.deltaY < 0) {
    zoom *= 1.3;
  } else {
    zoom /= 1.3;
  }

  redraw();
});

let dragging = false;
let dragX = 0;
let dragY = 0;

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

