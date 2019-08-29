'use strict';

const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

function drawPixel(x, y, color) {
  color = color || 'black';

  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function cardioid(im, re) {
  const q = Math.pow((im - 0.25), 2) + re * re;
  return q * (q + (im - 0.25)) <= 0.25 * re * re;
}

function mandelbrot(ci0, cj0) {
  if (cardioid(ci0, cj0)) {
    return 'black';
  }

  const MAX_ITERS = 1000;
  const THRESHOLD = 2;

  let included = true;

  let fi = 0;
  let fj = 0;

  let nIters = 0;
  for (let i = 0; i < MAX_ITERS; ++i) {
    if (Math.hypot(fi, fj) > THRESHOLD) {
      included = false;
      nIters = i;
      break;
    }

    const tmpfi = fi * fi - fj * fj + ci0;
    fj = 2 * fi * fj + cj0;

    fi = tmpfi;
  }

  if (included) {
    return 'black';
  } else {
    const r = nIters / MAX_ITERS * 255;
    return `rgb(${r}, ${r}, ${r})`;
  }
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function remap(x, inMin, inMax, outMin, outMax) {
  return ((x - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

function limitCalls(f, interval) {

  let lastCalled = Date.now();

  function wrapper(...args) {
    if (Date.now() - lastCalled >= interval) {
      lastCalled = Date.now();
      f(...args);
    }
  }

  return wrapper;
}

function draw(x, y, zoom) {
  const CI_START = -2.5 / zoom + x;
  const CI_END = 1 / zoom + x;

  const CJ_START = -1 / zoom + y;
  const CJ_END = 1 / zoom + y;

  for (let i = 0; i < canvas.width; ++i) {
    for (let j = 0; j < canvas.height; ++j) {
      const it = i / canvas.width;
      const jt = j / canvas.height;

      const ci = lerp(CI_START, CI_END, it);
      const cj = lerp(CJ_START, CJ_END, jt);

      const color = mandelbrot(ci, cj);

      drawPixel(i, j, color);
    }
  }
}

draw = limitCalls(draw, 300);

let zoom = 1;
let x = 0;
let y = 0;

function redraw() {
  draw(x, y, zoom);
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

