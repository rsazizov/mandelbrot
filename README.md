# Mandelbrot

My bare-bones Mandelbrot set generator that uses the [escape time algorithm](https://en.wikipedia.org/wiki/Mandelbrot_set#Escape_time_algorithm) and web workers :racehorse:.

![Sample](https://raw.githubusercontent.com/rsazizov/mandelbrot/master/docs/fractal11.png)

## Usage

You can play around with it [here](https://rsazizov.github.io/mandelbrot/index.html). Alternatively, clone this repository and start an HTTP server. If you have python 3 installed:

```
python3 -m http.server
```

## Roadmap

- [x] Escape Time Algorithm
- [x] Zooming
- [x] Optimizations
- [x] Histogram Coloring
- [ ] Smooth Coloring
- [x] Hardware Acceleration
