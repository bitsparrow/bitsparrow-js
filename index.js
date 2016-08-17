(function() {
    'use strict';

    // Simple way to detect if running under Node.js
    // Setting env variable `BROWSER` to `1` will force Node.js use `Uint8Array`
    // instead of it's own `Buffer` type, emulating the browser behavior.
    var IS_NODE = typeof process === 'object'
               && typeof process.env === 'object'
               && process.env.BROWSER !== '1';

    var BufferType = IS_NODE ? Buffer : Uint8Array;

    // Generic buffer slicing. Calling Buffer.slice or Uint8Array.subarray returns
    // a view without copying underlying data.
    var sliceBuffer = IS_NODE
        ? function(data, start, end) { return data.slice(start, end); }
        : function(data, start, end) { return data.subarray(start, end); };

    var utf8decoder = typeof TextDecoder === 'function' ? new TextDecoder('utf-8') : null;

    // Read a JavaScript UTF-16 String from a UTF-8 encoded array-like buffer.
    var decodeString = IS_NODE
        ? function(buffer, start, len) { return buffer.toString('utf8', start, start + len); }
        : function(buffer, start, len) {
            if (len > 128 && utf8decoder !== null) {
                return utf8decoder.decode(buffer.subarray(start, start + len));
            }
            var string = '';
            var cp = 0;
            var i = start;
            var end = i + len;

            while (i < end) {
                cp = buffer[i++];
                if (cp < 128) {
                    string += String.fromCharCode(cp);
                    continue;
                }

                if ((cp & 0xE0) === 0xC0) {
                    // 2 bytes
                    cp = (cp & 0x1F) << 6 |
                         (buffer[i++] & 0x3F);

                } else if ((cp & 0xF0) === 0xE0) {
                    // 3 bytes
                    cp = (cp & 0x0F)          << 12 |
                         (buffer[i++] & 0x3F) << 6  |
                         (buffer[i++] & 0x3F);

                } else if ((cp & 0xF8) === 0xF0) {
                    // 4 bytes
                    cp = (cp & 0x07)          << 18 |
                         (buffer[i++] & 0x3F) << 12 |
                         (buffer[i++] & 0x3F) << 6  |
                         (buffer[i++] & 0x3F);
                }

                if (cp >= 0x010000) {
                    // A surrogate pair
                    cp -= 0x010000;

                    string += String.fromCharCode((cp >>> 10) + 0xD800, (cp & 0x3FF) + 0xDC00);
                } else {
                    string += String.fromCharCode(cp);
                }
            }

            return string;
        };



    // Write a JavaScript string to a UTF-8 encoded byte array.
    var encodeString = function(string, bytes, offset) {
        var len = string.length|0;
        var cp = 0;
        var i = 0;
        var pos = offset|0;

        while (i < len) {
            cp = string.charCodeAt(i++);

            if (cp < 128) {
                bytes[pos++] = cp;
            } else if (cp < 0x800) {
                // 2 bytes
                bytes[pos++] = 0xC0 | (cp >>> 6);
                bytes[pos++] = 0x80 | (cp & 0x3F);
            } else if (cp < 0xD800 || cp > 0xDFFF) {
                // 3 bytes
                bytes[pos++] = 0xE0 | (cp  >>> 12);
                bytes[pos++] = 0x80 | ((cp >>> 6)  & 0x3F);
                bytes[pos++] = 0x80 | (cp          & 0x3F);
            } else {
                // 4 bytes - surrogate pair
                cp = (((cp - 0xD800) << 10) | (string.charCodeAt(i++) - 0xDC00)) + 0x10000;
                bytes[pos++] = 0xF0 | (cp >>> 18);
                bytes[pos++] = 0x80 | ((cp >>> 12) & 0x3F);
                bytes[pos++] = 0x80 | ((cp >>> 6)  & 0x3F);
                bytes[pos++] = 0x80 | (cp          & 0x3F);
            }
        }

        return pos - offset;
    };

    // Helper buffer and views to easily and cheapily convert types
    var buffer = new ArrayBuffer(8);
    var u8arr  = new Uint8Array(buffer);
    var u16arr = new Uint16Array(buffer);
    var u32arr = new Uint32Array(buffer);
    var i8arr  = new Int8Array(buffer);
    var i16arr = new Int16Array(buffer);
    var i32arr = new Int32Array(buffer);
    var f32arr = new Float32Array(buffer);
    var f64arr = new Float64Array(buffer);

    function readType16(decoder, tarr) {
        var end = decoder.index + 2;
        if (end > decoder.length) throw new Error("Reading out of boundary");
        var data = decoder.data;
        var index = decoder.index;
        decoder.index = end;
        u8arr[1] = data[index];
        u8arr[0] = data[index + 1];
        return tarr[0];
    }

    function readType32(decoder, tarr) {
        var end = decoder.index + 4;
        if (end > decoder.length) throw new Error("Reading out of boundary");
        var data = decoder.data;
        var index = decoder.index;
        decoder.index = end;
        u8arr[3] = data[index];
        u8arr[2] = data[index + 1];
        u8arr[1] = data[index + 2];
        u8arr[0] = data[index + 3];
        return tarr[0];
    }

    function readType64(decoder, tarr) {
        var end = decoder.index + 8;
        if (end > decoder.length) throw new Error("Reading out of boundary");
        var data = decoder.data;
        var index = decoder.index;
        decoder.index = end;
        u8arr[7] = data[index];
        u8arr[6] = data[index + 1];
        u8arr[5] = data[index + 2];
        u8arr[4] = data[index + 3];
        u8arr[3] = data[index + 4];
        u8arr[2] = data[index + 5];
        u8arr[1] = data[index + 6];
        u8arr[0] = data[index + 7];
        return tarr[0];
    }

    // Because JavaScript Number type has enough bits to store 53 bit precision
    // integers, but can only do binary operations on 32 bit *SIGNED* integers,
    // all would-be-bitwise-operations on anything larger than 16 bit *UNSIGNED*
    // integer needs to use floating point arithmetic - sad panda :(.
    function brshift32(n) {
        return Math.floor(n / 0x100000000);
    }

    var prealloc = IS_NODE ? null : new ArrayBuffer(2048);
    var preallocView = IS_NODE ? null : new DataView(prealloc);
    var preallocBytes = IS_NODE ? Buffer.allocUnsafe != null ? Buffer.allocUnsafe(2048) : new Buffer(2048) : new Uint8Array(prealloc);

    function Vector() {
        this.capacity = 0;
        this.len = 0;
    }

    Vector.prototype = IS_NODE ? {
        reserve: function(size) {
            var required = this.len + size;
            var cap = this.capacity;

            if (required <= cap) return;

            if (cap === 0) {
                this.capacity = size;
                this.bytes = new Buffer.allocUnsafe(size)
                return;
            }

            while (required > cap) cap *= 2;

            var previous = this.bytes;
            this.capacity = cap;
            this.bytes = new Buffer.allocUnsafe(cap);
            previous.copy(this.bytes);
        },

        pushU8: function(u8) {
            this.reserve(1);
            this.bytes[this.len++] = u8;
        },

        pushU16: function(u16) {
            this.reserve(2);
            this.bytes.writeUInt16BE(u16, this.len, true);
            this.len += 2;
        },

        pushU32: function(u32) {
            this.reserve(4);
            this.bytes.writeUInt32BE(u32, this.len, true);
            this.len += 4;
        },

        pushI8: function(i8) {
            this.reserve(1);
            this.bytes[this.len++] = i8;
        },

        pushI16: function(i16) {
            this.reserve(2);
            this.bytes.writeInt16BE(i16, this.len, true);
            this.len += 2;
        },

        pushI32: function(i32) {
            this.reserve(4);
            this.bytes.writeInt32BE(i32, this.len, true);
            this.len += 4;
        },

        pushF32: function(f32) {
            this.reserve(4);
            this.bytes.writeFloatBE(f32, this.len, true);
            this.len += 4;
        },

        pushF64: function(f64) {
            this.reserve(8);
            this.bytes.writeDoubleBE(f64, this.len, true);
            this.len += 8;
        },

        extendFrom: function(bytes) {
            var len = bytes.length;
            var i = 0;

            this.reserve(len);

            while (i < len) this.bytes[this.len++] = bytes[i++];
        },

        clear: function() {
            this.len = 0;
            return this;
        },

        getSlice: function() {
            var slice = Buffer.allocUnsafe(this.len);
            this.bytes.copy(slice);
            return slice;
        }
    } : {
        reserve: function(size) {
            var required = this.len + size;
            var cap = this.capacity;

            if (required <= cap) return;

            if (cap === 0) {
                this.capacity = size;
                this.data = new ArrayBuffer(size);
                this.dView = new DataView(this.data);
                this.bytes = new Uint8Array(this.data);
                return;
            }

            while (required > cap) cap *= 2;

            var previous = this.bytes;
            this.capacity = cap;
            this.data = new ArrayBuffer(cap);
            this.dView = new DataView(this.data);
            this.bytes = new Uint8Array(this.data);
            this.bytes.set(previous);
        },

        pushU8: function(u8) {
            this.reserve(1);
            this.bytes[this.len++] = u8;
        },

        pushU16: function(u16) {
            this.reserve(2);
            this.dView.setUint16(this.len, u16);
            this.len += 2;
        },

        pushU32: function(u32) {
            this.reserve(4);
            this.dView.setUint32(this.len, u32);
            this.len += 4;
        },

        pushI8: function(i8) {
            this.reserve(1);
            this.bytes[this.len++] = i8;
        },

        pushI16: function(i16) {
            this.reserve(2);
            this.dView.setInt16(this.len, i16);
            this.len += 2;
        },

        pushI32: function(i32) {
            this.reserve(4);
            this.dView.setInt32(this.len, i32);
            this.len += 4;
        },

        pushF32: function(f32) {
            this.reserve(4);
            this.dView.setFloat32(this.len, f32);
            this.len += 4;
        },

        pushF64: function(f64) {
            this.reserve(8);
            this.dView.setFloat64(this.len, f64);
            this.len += 8;
        },

        extendFrom: function(bytes) {
            var len = bytes.length;
            var i = 0;

            this.reserve(len);

            while (i < len) this.bytes[this.len++] = bytes[i++];
        },

        clear: function() {
            this.len = 0;
            return this;
        },

        getSlice: function() {
            return this.bytes.slice(0, this.len);
        }
    };

    var prealloc = new Vector();
    prealloc.reserve(2048);

    function Encoder() {
        this.data = prealloc === null ? new Vector() : prealloc;
        prealloc = null;
        this.boolIndex = -1;
        this.boolShift = 0;
    }

    function sizeByteLength(size) {
        return size < 0x80             ? 1
             : size < 0x4000           ? 2
             : size < 0x200000         ? 3
             : size < 0x10000000       ? 4
             : size < 0x800000000      ? 5
             : size < 0x40000000000    ? 6
             : size < 0x2000000000000  ? 7
             : size < 0x20000000000000 ? 8
             :                           0;
    }

    var sizeToBytes = [
        function(pos, size, buf) {
            throw new Error("Provided size is too long!");
        },
        function(pos, size, buf) {
            buf[pos] = size;
        },
        function(pos, size, buf) {
            buf[pos    ] = (size >>> 8) | 0x80;
            buf[pos + 1] = size;
        },
        function(pos, size, buf) {
            buf[pos    ] = (size >>> 16) | 0xC0;
            buf[pos + 1] = size >>> 8;
            buf[pos + 2] = size;
        },
        function(pos, size, buf) {
            buf[pos    ] = (size >>> 24) | 0xE0;
            buf[pos + 1] = size >>> 16;
            buf[pos + 2] = size >>> 8;
            buf[pos + 3] = size;
        },
        function(pos, size, buf) {
            buf[pos    ] = (size / 0x100000000) | 0xF0;
            buf[pos + 1] = size >>> 24;
            buf[pos + 2] = size >>> 16;
            buf[pos + 3] = size >>> 8;
            buf[pos + 4] = size;
        },
        function(pos, size, buf) {
            buf[pos    ] = (size / 0x10000000000) | 0xF8;
            buf[pos + 1] = (size / 0x100000000)   | 0;
            buf[pos + 2] = size >>> 24;
            buf[pos + 3] = size >>> 16;
            buf[pos + 4] = size >>> 8;
            buf[pos + 5] = size;
        },
        function(pos, size, buf) {
            buf[pos    ] = (size / 0x1000000000000) | 0xFC;
            buf[pos + 1] = (size / 0x10000000000)   | 0;
            buf[pos + 2] = (size / 0x100000000)     | 0;
            buf[pos + 3] = size >>> 24;
            buf[pos + 4] = size >>> 16;
            buf[pos + 5] = size >>> 8;
            buf[pos + 6] = size;
        },
        function(pos, size, buf) {
            buf[pos    ] = (size / 0x100000000000000) | 0xFE;
            buf[pos + 1] = (size / 0x1000000000000)   | 0;
            buf[pos + 2] = (size / 0x10000000000)     | 0;
            buf[pos + 3] = (size / 0x100000000)       | 0;
            buf[pos + 4] = size >>> 24;
            buf[pos + 5] = size >>> 16;
            buf[pos + 6] = size >>> 8;
            buf[pos + 7] = size;
        }
    ]

    Encoder.prototype = {
        uint8: function(uint8) {
            this.data.pushU8(uint8);
            return this;
        },

        uint16: function(uint16) {
            this.data.pushU16(uint16);
            return this;
        },

        uint32: function(uint32) {
            this.data.pushU32(uint32);
            return this;
        },

        uint64: function(uint64) {
            this.data.pushU32(brshift32(uint64));
            this.data.pushU32(uint64);
            return this;
        },

        int8: function(int8) {
            this.data.pushI8(int8);
            return this;
        },

        int16: function(int16) {
            this.data.pushI16(int16);
            return this;
        },

        int32: function(int32) {
            this.data.pushI32(int32);
            return this;
        },

        int64: function(int64) {
            this.data.pushI32(brshift32(int64));
            var low = int64 % 0x100000000;
            this.data.pushU32(low < 0 ? low + 0x100000000 : low);
            return this;
        },

        float32: function(float32) {
            this.data.pushF32(float32);
            return this;
        },

        float64: function(float64) {
            this.data.pushF64(float64);
            return this;
        },

        bool: function(bool) {
            var bool_bit = bool ? 1 : 0;
            var index = this.data.len;

            if (this.boolIndex === index && this.boolShift < 7) {
                this.data.bytes[index - 1] |= bool_bit << ++this.boolShift;
                return this;
            }

            this.data.pushU8(bool_bit);
            this.boolIndex = this.data.len;
            this.boolShift = 0;

            return this;
        },

        size: function(size) {
            var sbl = sizeByteLength(size);
            this.data.reserve(sbl);

            sizeToBytes[sbl](this.data.len, size, this.data.bytes);
            this.data.len += sbl;

            return this;
        },

        bytes: function(bytes) {
            var len = bytes.length;
            this.size(len);
            this.data.extendFrom(bytes);

            return this;
        },

        string: function(string) {
            var pos = this.data.len;
            var estimate = string.length * 3;
            var sbl = sizeByteLength(estimate);

            this.data.reserve(sbl + estimate);

            var len = encodeString(string, this.data.bytes, pos + sbl);

            sizeToBytes[sbl](pos, len, this.data.bytes);
            this.data.len = pos + sbl + len;
            return this;
        },

        end: function() {
            var data = this.data.getSlice();
            prealloc = this.data.clear();
            this.data = new Vector();
            return data;
        }
    };

    function Decoder(data) {
        if (data == null || (data.length == null && data.constructor !== ArrayBuffer)) throw new Error("Invalid type");
        this.data = data.constructor === BufferType ? data : new BufferType(data);
        this.index = 0;
        this.length = data.length;
        this.boolIndex = -1;
        this.boolShift = 0;
    }

    Decoder.prototype = {
        uint8: function() {
            if (this.index >= this.length) throw new Error("Reading out of boundary");
            return this.data[this.index++];
        },

        uint16: function() {
            return readType16(this, u16arr);
        },

        uint32: function() {
            return readType32(this, u32arr);
        },

        uint64: function() {
            return readType32(this, u32arr) * 0x100000000 + readType32(this, u32arr);
        },

        int8: function() {
            u8arr[0] = this.uint8();
            return i8arr[0];
        },

        int16: function() {
            return readType16(this, i16arr);
        },

        int32: function() {
            return readType32(this, i32arr);
        },

        int64: function() {
            var high = readType32(this, u32arr);
            var low = readType32(this, u32arr);

            if (high > 0x7FFFFFFF) {
                high -= 0xFFFFFFFF;
                low -= 0x100000000;
            }

            return high * 0x100000000 + low;
        },

        float32: function() {
            return readType32(this, f32arr);
        },

        float64: function() {
            return readType64(this, f64arr);
        },

        bool: function() {
            var bits;
            if (this.boolIndex == this.index && this.boolShift < 7) {
                this.boolShift += 1;
                bits = this.data[this.index - 1];
                var bool_bit = 1 << this.boolShift;
                return (bits & bool_bit) == bool_bit;
            }
            var bits = this.uint8();
            this.boolIndex = this.index;
            this.boolShift = 0;
            return (bits & 1) == 1;
        },

        size: function() {
            var size = this.uint8();

            // 1 byte (no signature)
            if ((size & 128) === 0) return size;

            var ext_bytes = 1;
            size ^= 128;

            var allowance = 64;

            while (allowance && (size & allowance)) {
                size ^= allowance;
                allowance >>>= 1;
                ext_bytes += 1;
            }

            while (ext_bytes) {
                ext_bytes -= 1;
                // Use regular math in case we run out of int32 precision
                size = (size * 256) + this.uint8();
            }

            if (size > 0x1FFFFFFFFFFFFF) {
                throw new Error('Decoded size exceeds 53bit precision range!')
            }

            return size;
        },

        bytes: function() {
            var end = this.size() + this.index;
            if (end > this.length) throw new Error("Reading out of boundary");
            var bytes = sliceBuffer(this.data, this.index, end);

            this.index = end;

            return bytes;
        },

        string: function() {
            var len = this.size();
            var end = this.index + len;
            if (end > this.length) throw new Error("Reading out of boundary");
            var string = decodeString(this.data, this.index, len);

            this.index = end;

            return string;
        },

        end: function() {
            return this.index >= this.length;
        }
    };

    if (typeof module !== 'undefined' && module.exports != null && exports === module.exports) {
        exports.Encoder = Encoder;
        exports.Decoder = Decoder;
    } else {
        window.bitsparrow = {
            Encoder: Encoder,
            Decoder: Decoder,
        }
    }
})();
