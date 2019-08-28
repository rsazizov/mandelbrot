'use strict';

const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

function drawPixel(x, y, color) {
  color = color || 'black';

  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function mandelbrot(ci0, cj0) {
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

function draw() {
  for (let i = 0; i < canvas.width; ++i) {
    for (let j = 0; j < canvas.height; ++j) {
      const ci = lerp(-2.5, 1, i / canvas.width);
      const cj = lerp(-1, 1, j / canvas.height);

      const color = mandelbrot(ci, cj);

      drawPixel(i, j, color);
    }
  }
}

draw();
