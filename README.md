# BitSparrow in JavaScript

![](https://api.travis-ci.org/bitsparrow/bitsparrow-js.svg)

**[Homepage](http://bitsparrow.io/) -**
**[API Documentation](https://github.com/bitsparrow/bitsparrow-js/blob/master/DOCS.md) -**
**[npm](https://www.npmjs.com/package/bitsparrow)**

## Encoding

```js
var Encoder = require('bitsparrow').Encoder;

var buffer = new Encoder()
             .uint8(100)
             .string("Foo")
             .end();

console.log(buffer); // Uint8Array | Buffer [0x64,0x03,0x46,0x6f,0x6f]
```

The type of the buffer used by BitSparrow changes depending on
the environment - when used within Node.js it becomes a `Buffer`,
otherwise the more generic `Uint8Array` is used.

When piping data through a WebSocket in the Browser, set the
`binary` mode to use `ArrayBuffer` over `Blob`, and create the
`Uint8Array` view on top of it:

```js
var bitsparrow = require('bitsparrow');

var socket = new WebSocket('ws://example.com/');
socket.binaryType = 'arraybuffer';

socket.onmessage = function(event) {
    var decoder = new bitsparrow.Decoder(event.data);
    // Read the data ...
}

socket.onpen = function() {
    var encoder = new bitsparrow.Encoder().string('Hello World');
    // Send internal `ArrayBuffer` from `Uint8Array`
    socket.send(encoder.end().buffer);
}
```

## Decoding

```js
var Decoder = require('bitsparrow').Decoder;

var buffer = new Uint8Array([0x64,0x03,0x46,0x6f,0x6f]);
var decoder = new Decoder(buffer);

console.log(decoder.uint8()); // -> 100
console.log(decoder.string()); // -> "Foo"
console.log(decoder.end()); // -> true
```

Decoder takes a reference to the buffer and allows you to
retrieve the values in order they were encoded. Calling the
`end` method is optional, it will return `true` if you have
read the entire buffer, which can be handy if you are reading
multiple messages stacked on a single buffer.

## Performance

he two goals for this implementation are:

- The binary buffer should be smaller than JSON text when sent over the wire.
- The binary buffer should be _faster_ to decode than the JSON text.

Saving time over the wire only to lose it when trying to read the data would
be counterproductive. The goal here is to leverage, limited as they are,
JavaScript's binary interfaces to provide an interchange layer that's carefully
crafted for the absolute best performance possible.

You can run benchmarks with:

- Run `npm run bench` in the terminal.
- Open `index.html` in a browser with console open (Note: Firefox versions
without electrolysis will hang until the benchmark finishes running).

Most notably, dealing with numeric types such as `float64` and `uint32` is
much faster than even the native JSON implementation in V8 since neither
decoder nor the encoder touches the binary internals of those formats,
[endianness](https://en.wikipedia.org/wiki/Endianness) excluded.

# The MIT License (MIT)

Copyright (c) 2016 BitSparrow

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
