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

                    string += String.fromCharCode((cp >> 10) + 0xD800, (cp & 0x3FF) + 0xDC00);
                } else {
                    string += String.fromCharCode(cp);
                }
            }

            return string;
        };

    // Write a JavaScript string to a UTF-8 encoded byte array.
    var encodeString = function(string, bytes, offset) {
        var len = string.length;
        var cp = 0;
        var i = 0;
        var pos = offset;

        while (i < len) {
            cp = string.charCodeAt(i++);

            if (cp < 128) {
                bytes[pos++] = cp;
                continue;
            }

            if (cp < 0x800) {
                // 2 bytes
                bytes[pos++] = (cp >> 6)   | 0xC0;
                bytes[pos++] = (cp & 0x3F) | 0x80;
            } else if (cp < 0xD800 || cp > 0xDFFF) {
                // 3 bytes
                bytes[pos++] = (cp  >> 12) | 0xE0;
                bytes[pos++] = ((cp >> 6)  & 0x3F) | 0x80;
                bytes[pos++] = (cp         & 0x3F) | 0x80;
            } else {
                // 4 bytes - surrogate pair
                cp = (((cp - 0xD800) << 10) | (string.charCodeAt(i++) - 0xDC00)) + 0x10000;
                bytes[pos++] = (cp >> 18)          | 0xF0;
                bytes[pos++] = ((cp >> 12) & 0x3F) | 0x80;
                bytes[pos++] = ((cp >> 6)  & 0x3F) | 0x80;
                bytes[pos++] = (cp         & 0x3F) | 0x80;
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

    function Encoder() {
        // this.data = [];
        this.index = 0;
        this.boolIndex = -1;
        this.boolShift = 0;
    }

    function sizeByteLength(size) {
        if (size > 0x1FFFFFFFFFFFFF) {
            throw new Error("Provided size is too long!");
        }

        return size < 0x80            ? 1
             : size < 0x4000          ? 2
             : size < 0x200000        ? 3
             : size < 0x10000000      ? 4
             : size < 0x800000000     ? 5
             : size < 0x40000000000   ? 6
             : size < 0x2000000000000 ? 7
             :                          8;
    }

    var sizeToBytes = [
        function(pos, size, buf) {},
        function(pos, size, buf) {
            buf[pos] = size;
        },
        function(pos, size, buf) {
            buf[pos    ] = (size >> 8) | 0x80;
            buf[pos + 1] = size;
        },
        function(pos, size, buf) {
            buf[pos    ] = (size >> 16) | 0xC0;
            buf[pos + 1] = size >> 8;
            buf[pos + 2] = size;
        },
        function(pos, size, buf) {
            buf[pos    ] = (size / 0x1000000) | 0xE0;
            buf[pos + 1] = size >> 16;
            buf[pos + 2] = size >> 8;
            buf[pos + 3] = size;
        },
        function(pos, size, buf) {
            buf[pos    ] = (size / 0x100000000) | 0xF0;
            buf[pos + 1] = (size / 0x1000000)   | 0;
            buf[pos + 2] = size >> 16;
            buf[pos + 3] = size >> 8;
            buf[pos + 4] = size;
        },
        function(pos, size, buf) {
            buf[pos    ] = (size / 0x10000000000) | 0xF8;
            buf[pos + 1] = (size / 0x100000000)   | 0;
            buf[pos + 2] = (size / 0x1000000)     | 0;
            buf[pos + 3] = size >> 16;
            buf[pos + 4] = size >> 8;
            buf[pos + 5] = size;
        },
        function(pos, size, buf) {
            buf[pos    ] = (size / 0x1000000000000) | 0xFC;
            buf[pos + 1] = (size / 0x10000000000)   | 0;
            buf[pos + 2] = (size / 0x100000000)     | 0;
            buf[pos + 3] = (size / 0x1000000)       | 0;
            buf[pos + 4] = size >> 16;
            buf[pos + 5] = size >> 8;
            buf[pos + 6] = size;
        },
        function(pos, size, buf) {
            buf[pos    ] = (size / 0x100000000000000) | 0xFE;
            buf[pos + 1] = (size / 0x1000000000000)   | 0;
            buf[pos + 2] = (size / 0x10000000000)     | 0;
            buf[pos + 3] = (size / 0x100000000)       | 0;
            buf[pos + 4] = (size / 0x1000000)         | 0;
            buf[pos + 5] = size >> 16;
            buf[pos + 6] = size >> 8;
            buf[pos + 7] = size;
        }
    ]

    Encoder.prototype = {
        uint8: function(uint8) {
            preallocBytes[this.index++] = uint8;
            return this;
        },

        uint16: IS_NODE ? function(uint16) {
            preallocBytes.writeUInt16BE(uint16, this.index, true);
            this.index += 2;
            return this;
        } : function(uint16) {
            preallocView.setUint16(this.index, uint16);
            this.index += 2;
            return this;
        },

        uint32: IS_NODE ? function(uint32) {
            preallocBytes.writeUInt32BE(uint32, this.index, true);
            this.index += 4;
            return this;
        } : function(uint32) {
            preallocView.setUint32(this.index, uint32);
            this.index += 4;
            return this;
        },

        uint64: IS_NODE ? function(uint64) {
            preallocBytes.writeUInt32BE(brshift32(uint64), this.index, true);
            preallocBytes.writeUInt32BE(uint64, this.index + 4, true);
            this.index += 8;
            return this;
        } : function(uint64) {
            preallocView.setUint32(this.index, brshift32(uint64));
            preallocView.setUint32(this.index + 4, uint64);
            this.index += 8;
            return this;
        },

        int8: function(int8) {
            preallocBytes[this.index++] = int8;
            return this;
        },

        int16: IS_NODE ? function(int16) {
            preallocBytes.writeInt16BE(int16, this.index, true);
            this.index += 2;
            return this;
        } : function(int16) {
            preallocView.setInt16(this.index, int16);
            this.index += 2;
            return this;
        },

        int32: IS_NODE ? function(int32) {
            preallocBytes.writeInt32BE(int32, this.index, true);
            this.index += 4;
            return this;
        } : function(int32) {
            preallocView.setInt32(this.index, int32);
            this.index += 4;
            return this;
        },

        int64: IS_NODE ? function(int64) {
            preallocBytes.writeInt32BE(brshift32(int64), this.index, true);
            var low = int64 % 0x100000000;
            preallocBytes.writeUInt32BE(low < 0 ? low + 0x100000000 : low, this.index + 4, true);
            this.index += 8;
            return this;
        } : function(int64) {
            preallocView.setInt32(this.index, brshift32(int64));
            var low = int64 % 0x100000000;
            preallocView.setUint32(this.index + 4, low < 0 ? low + 0x100000000 : low, this.data, u32arr);
            this.index += 8;
            return this;
        },

        float32: IS_NODE ? function(float32) {
            preallocBytes.writeFloatBE(float32, this.index, true);
            this.index += 4;
            return this;
        } : function(float32) {
            preallocView.setFloat32(this.index, float32);
            this.index += 4;
            return this;
        },

        float64: IS_NODE ? function(float64) {
            preallocBytes.writeDoubleBE(float64, this.index, true);
            this.index += 8;
            return this;
        } : function(float64) {
            preallocView.setFloat64(this.index, float64);
            this.index += 8;
            return this;
        },

        bool: function(bool) {
            var bool_bit = bool ? 1 : 0;
            var index = this.index;

            if (this.boolIndex === index && this.boolShift < 7) {
                preallocBytes[index - 1] |= bool_bit << ++this.boolShift;
                return this;
            }

            preallocBytes[this.index++] = bool_bit;
            this.boolIndex = this.index;
            this.boolShift = 0;

            return this;
        },

        size: function(size) {
            var data = this.data;
            var sbl = sizeByteLength(size);

            sizeToBytes[sbl](this.index, size, preallocBytes);
            this.index += sbl;

            return this;
        },

        bytes: function(bytes) {
            var len = bytes.length;
            var data = this.data;
            this.size(len);

            var i = 0;
            while (i < len) preallocBytes[this.index++] = bytes[i++];

            return this;
        },

        string: function(string) {
            var pos = this.index;
            var sbl = sizeByteLength(string.length * 2);
            var len = encodeString(string, preallocBytes, pos + sbl);

            sizeToBytes[sbl](pos, len, preallocBytes);
            this.index = pos + sbl + len;
            return this;
        },

        end: IS_NODE
            ? function() {
                var data = new Buffer(this.index);
                preallocBytes.copy(data);
                this.index = 0;
                return data;
            }
            : function() {
                var data = preallocBytes.slice(0, this.index);
                this.index = 0;
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
                allowance >>= 1;
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
