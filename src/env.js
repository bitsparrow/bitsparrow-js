// Simple way to detect if running under Node.js
// Setting env variable `BROWSER` to `1` will force Node.js use `Uint8Array`
// instead of it's own `Buffer` type, emulating the browser behavior.
export var IS_NODE = typeof process === 'object'
                  && typeof process.env === 'object'
                  && process.env.BROWSER !== '1';
