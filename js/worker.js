'use strict';

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function cardioid(im, re) {
  const re2 = re * re;

  const q = Math.pow((im - 0.25), 2) + re2;
  return q * (q + (im - 0.25)) <= 0.25 * re2;
}

function mandelbrot(cre, cim, maxIters, threshold) {
  if (cardioid(cre, cim)) {
    return [maxIters, 0, 0];
  }

  let fre = 0;
  let fim = 0;

  let nIters = 0;

  let fre2 = fre * fre;
  let fim2 = fim * fim;

  for (; nIters < maxIters; ++nIters) {
    fre2 = fre * fre;
    fim2 = fim * fim;

    if (fre2 + fim2 >= 100) break;

    fim = 2 * fre * fim + cim;
    fre = fre2 - fim2 + cre;
  }

  return [nIters, fre2, fim2];
}

function mandelbrotStrip(x, y, width, height,
  totalWidth, totalHeight, mx, my, zoom) {

  const CRE_START = -2.1 / zoom + mx;
  const CRE_END = 0.5 / zoom + mx;

  const CIM_START = -1 / zoom + my;
  const CIM_END = 1 / zoom + my;
  
  const MAX_ITERS = 1000;
  const ESCAPE_RADIUS = 10;

  const iters = [];
  const escapeRadiuses = [];
  let maxIters = 0;

  for (let i = x; i < x + width; ++i) {
    iters.push([]);
    escapeRadiuses.push([]);

    for (let j = y; j < y + height; ++j) {
      const cre = lerp(CRE_START, CRE_END, i / totalWidth);
      const cim = lerp(CIM_START, CIM_END, j / totalHeight);

      const [nIters, fi, fj] = mandelbrot(cre, cim, MAX_ITERS, ESCAPE_RADIUS);
      if (nIters > maxIters) maxIters = nIters;
      
      iters[iters.length - 1][j - y] = nIters;
      escapeRadiuses[escapeRadiuses.length - 1][j - y] = fi + fj;
    }
  }

  return {
    iters,
    maxIters,
    escapeRadiuses
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
