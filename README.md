# Fractometa

Explore `x XOR y` on a grid up to 500 x 500 and highlight prime values by category.

## Modes

- **Filters:** all primes, or any combination of ten categories (twin, cousin, sexy, Mersenne, Fermat, Sophie Germain, safe, Chen, palindromic, emirp). Each category has its own gradient.
- **Munching squares:** animates the level set `x XOR y = t` for t = 0, 1, 2, ...
- **Crystal:** grows the grid from 2 x 2 and shows `(x XOR y) mod size` at each size, up to a max size of 999,999.

## Run

The app uses ES modules, so serve the folder over HTTP:

    npm start

or any static server, for example `python3 -m http.server 8080`.

## Test

    npm test

Requires Node 18 or later.

## Layout

    index.html
    styles.css
    src/
      primes.js       sieve and digit helpers
      categories.js   category definitions and bitmasks
      color.js        gradients and packed color helpers
      modes.js        cell values and colors per mode
      render.js       grid analysis and canvas drawing
      animation.js    frame loop
      ui.js           DOM bindings
      main.js         state, wiring, Fractometa namespace
    tests/

All modules are reachable from `globalThis.Fractometa` after load.
