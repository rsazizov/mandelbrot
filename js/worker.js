'use strict';

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function cardioid(im, re) {
  const re2 = re * re;
  
  const q = Math.pow((im - 0.25), 2) + re2;
  return q * (q + (im - 0.25)) <= 0.25 * re2;
}

function mandelbrot(ci0, cj0) {
  if (cardioid(ci0, cj0)) {
    return 0;
  }

  const MAX_ITERS = 1000;
  const THRESHOLD = 4;

  let included = true;
  let maxIters = 0;

  let fi = 0;
  let fj = 0;

  let nIters = 0;
  for (let i = 0; i < MAX_ITERS; ++i) {
    const fi2 = fi * fi;
    const fj2 = fj * fj

    if (fi2 + fj2 >= THRESHOLD) {
      included = false;
      nIters = i;

      if (nIters > maxIters) {
        maxIters = nIters;
      }

      break;
    }

    fj = 2 * fi * fj + cj0;
    fi = fi2 - fj2 + ci0;
  }

  if (included) {
    return 0;
  } else {
    return nIters;
  }
}

function mandelbrotStrip(x, y, width, height,
  totalWidth, totalHeight, mx, my, zoom) {
  const CI_START = -2.5 / zoom + mx;
  const CI_END = 1 / zoom + mx;

  const CJ_START = -1 / zoom + my;
  const CJ_END = 1 / zoom + my;

  const iters = [];
  let maxIters = 0;

  for (let i = x; i < x + width; ++i) {
    iters[iters.length] = [];
    
    for (let j = y; j < y + height; ++j) {
      const it = i / totalWidth;
      const jt = j / totalHeight;

      const ci = lerp(CI_START, CI_END, it);
      const cj = lerp(CJ_START, CJ_END, jt);

      const nIters = mandelbrot(ci, cj);

      if (nIters > maxIters) {
        maxIters = nIters;
      }

      iters[iters.length - 1][j - y] = nIters;
    }
  }

  return {
    iters,
    maxIters
  };
}

onmessage = function(e) {
  const {
    x, y, width, height, totalWidth, totalHeight, mx, my, zoom
  } = e.data;

  const result = mandelbrotStrip(x, y, width, height,
    totalWidth, totalHeight, mx, my, zoom);

  postMessage({result: result, input: e.data});
};
