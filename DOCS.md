# API Documentation

## Encoder

#### Constructor `new Encoder()`
Encoder takes in typed data and produces a binary buffer
represented as either `Buffer` (Node.js) or `Uint8Array`
(Browser).

### Methods

#### `uint8(number)` → `Encoder`
Stores a `number` as an unsigned 8 bit integer on the buffer.

#### `uint16(number)` → `Encoder`
Stores a `number` as an unsigned 16 bit integer on the buffer.

#### `uint32(number)` → `Encoder`
Stores a `number` as an unsigned 32 bit integer on the buffer.

#### `uint64(number)` → `Encoder`
Stores a `number` as an unsigned 64 bit integer on the buffer.

*Note:* Because JavaScript `Number` type can only accurately
represent 53 bits of precision, encoding a number larger than
 `Number.MAX_SAFE_INTEGER` can lead to inoperability issues.

#### `int8(number)` → `Encoder`
Stores a `number` as a signed 8 bit integer on the buffer.

#### `int16(number)` → `Encoder`
Stores a `number` as a signed 16 bit integer on the buffer.

#### `int32(number)` → `Encoder`
Stores a `number` as a signed 32 bit integer on the buffer.

#### `int64(number)` → `Encoder`
Stores a `number` as a signed 32 bit integer on the buffer.

*Note:* Because JavaScript `Number` type can only accurately
represent 53 bits of precision, encoding a number larger than
 `Number.MAX_SAFE_INTEGER` or smaller than `-Number.MAX_SAFE_INTEGER`
 can lead to inoperability issues.

#### `float32(number)` → `Encoder`
Stores a `number` as a single precision IEEE 754 floating
point on the buffer.

#### `float64(number)` → `Encoder`
Stores a `number` as a double precision IEEE 754 floating
point on the buffer.

#### `bool(boolean)` → `Encoder`
Stores a `boolean` as a single bit on the buffer. Calling
`bool` multiple times in a row will attempt to store the
information on a single byte.

```js
var Encoder = require('bitsparrow').Encoder;

var buffer = new Encoder()
             .bool(true)
             .bool(false)
             .bool(false)
             .bool(false)
             .bool(false)
             .bool(true)
             .bool(true)
             .bool(true)
             .end();

// booleans are stacked as bits on a single byte, right to left.
console.log(buffer[0] === 0b11100001); // -> true
```

#### `size(number)` → `Encoder`
Stores a `number` on the buffer. This will use a variable
amount of bytes depending on the value of `number`, making
it a very powerful and flexible type to send around. BitSparrow
uses `size` internally to prefix `string` and `bytes` as those
can have an arbitrary length. Detailed explanation on how
BitSparrow stores `size` can be found on
[the homepage](http://bitsparrow.io).

*Note:* Because JavaScript `Number` type can only accurately
represent 53 bits of precision, encoding a number larger than
 `Number.MAX_SAFE_INTEGER` will throw an error.

#### `bytes(Buffer | Uint8Array | Array<number>)` → `Encoder`
Stores a `Buffer`, `Uint8Array` or a regular `Array` of
`number`s on the buffer. Note that each number has to be an
unsigned 8 bit integer (values between 0 and 255).

#### `string(string)` → `Encoder`
Stores a `string` as UTF-8 encoded series of bytes on the
buffer.

#### `end()` → `Buffer | Uint8Array`
Finishes encoding, and returns the internal buffer as either
`Buffer` (Node.js) or `Uint8Array` (Browser). The state of
the `Encoder` is then reset.

## Decoder

#### Constructor `new Decoder(Buffer | Uint8Array | Array)`
Decoder takes a reference to a buffer and exposes methods
to read typed data from that buffer.

### methods

#### `uint8()` → `number`
Reads an unsigned 8 bit integer from the buffer, progresses
the internal index and returns a number.

#### `uint16()` → `number`
Reads an unsigned 16 bit integer from the buffer, progresses
the internal index and returns a number.

#### `uint32()` → `number`
Reads an unsigned 32 bit integer from the buffer, progresses
the internal index and returns a number.

#### `uint64()` → `number`
Reads an unsigned 64 bit integer from the buffer, progresses
the internal index and returns a number.

*Note:* Because JavaScript `Number` type can only accurately
represent 53 bits of precision, decoding a number larger than
 `Number.MAX_SAFE_INTEGER` can lead to inoperability issues.

#### `int8()` → `number`
Reads a signed 8 bit integer from the buffer, progresses
the internal index and returns a number.

#### `int16()` → `number`
Reads a signed 16 bit integer from the buffer, progresses
the internal index and returns a number.

#### `int32()` → `number`
Reads a signed 32 bit integer from the buffer, progresses
the internal index and returns a number.

#### `int64()` → `number`
Reads a signed 64 bit integer from the buffer, progresses
the internal index and returns a number.

*Note:* Because JavaScript `Number` type can only accurately
represent 53 bits of precision, decoding a number larger than
 `Number.MAX_SAFE_INTEGER` or smaller than `-Number.MAX_SAFE_INTEGER`
 can lead to inoperability issues.

#### `float32()` → `number`
Reads an IEEE 754 single precision float from the buffer,
progresses the internal index and returns a number.

#### `float64()` → `number`
Reads an IEEE 754 double precision float from the buffer,
progresses the internal index and returns a number.

#### `bool()` → `boolean`
Reads a bit from the buffer, progresses the internal index
and returns a boolean. Calling `bool()` on the `Decoder` multiple
times in a row will read a `boolean` from the same index position
without progressing the index, but instead shifting to read the next
bit. This behavior is symmetric to how the `Encoder` stores the
`bool`s and thus is completely transparent when using the API.

```js
var Decoder = require('bitsparrow').Decoder;

// Reading `booleans` from a single byte.
let decoder = new Decoder([0b11100001]);

console.log(decoder.bool()); // -> true
console.log(decoder.bool()); // -> false
console.log(decoder.bool()); // -> false
console.log(decoder.bool()); // -> false
console.log(decoder.bool()); // -> false
console.log(decoder.bool()); // -> true
console.log(decoder.bool()); // -> true
console.log(decoder.bool()); // -> true

// Ensure we consumed the whole buffer
console.log(decoder.end()); // -> true
```

#### `size()` → `number`
Reads a specialized number type from the buffer, returns it and
progress the index. Detailed explanation on how BitSparrow stores
`size` can be found on [the homepage](http://bitsparrow.io).

#### `bytes()` → `Buffer | Uint8Array | Array<number>`
Reads arbitrary sized binary data from the buffer, returns it and
progresses the internal index.

**Note:** BitSparrow internally prefixes `bytes` with `size` so
you don't have to worry about how many bytes you need to read.

**Note:** The returned type will match (be a slice of) the type
passed into the `Decoder`.

#### `string()` → `string`
Reads an arbitrary sized UTF-8 encoded string from the buffer,
returns it as JavaScript `string` type and progresses the internal
index.

#### `end()` → `boolean`
Returns `true` if the entire buffer has been read, otherwise
returns `false`.
