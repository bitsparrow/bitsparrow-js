(function() {
    'use strict';
    // Simple way to detect if running under Node.js
    var IS_NODE = typeof window !== "object" && typeof global === "object";

    // TextEncoder / TextDecoder fallbacks taken from:
    // https://github.com/feross/buffer/blob/master/index.js
    function utf8ToBytes (string, units) {
      units = units || Infinity
      var codePoint
      var length = string.length
      var leadSurrogate = null
      var bytes = []
      var i = 0

      for (; i < length; i++) {
        codePoint = string.charCodeAt(i)

        // is surrogate component
        if (codePoint > 0xD7FF && codePoint < 0xE000) {
          // last char was a lead
          if (leadSurrogate) {
            // 2 leads in a row
            if (codePoint < 0xDC00) {
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
              leadSurrogate = codePoint
              continue
            } else {
              // valid surrogate pair
              codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
              leadSurrogate = null
            }
          } else {
            // no lead yet

            if (codePoint > 0xDBFF) {
              // unexpected trail
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
              continue
            } else if (i + 1 === length) {
              // unpaired lead
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
              continue
            } else {
              // valid lead
              leadSurrogate = codePoint
              continue
            }
          }
        } else if (leadSurrogate) {
          // valid bmp char, but last char was a lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          leadSurrogate = null
        }

        // encode utf8
        if (codePoint < 0x80) {
          if ((units -= 1) < 0) break
          bytes.push(codePoint)
        } else if (codePoint < 0x800) {
          if ((units -= 2) < 0) break
          bytes.push(
            codePoint >> 0x6 | 0xC0,
            codePoint & 0x3F | 0x80
          )
        } else if (codePoint < 0x10000) {
          if ((units -= 3) < 0) break
          bytes.push(
            codePoint >> 0xC | 0xE0,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          )
        } else if (codePoint < 0x200000) {
          if ((units -= 4) < 0) break
          bytes.push(
            codePoint >> 0x12 | 0xF0,
            codePoint >> 0xC & 0x3F | 0x80,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          )
        } else {
          throw new Error('Invalid code point');
        }
      }

      return bytes;
    }

    function utf8Slice (buf, start, end) {
      var res = ''
      var tmp = ''
      end = Math.min(buf.length, end || Infinity);
      start = start || 0;

      for (var i = start; i < end; i++) {
        if (buf[i] <= 0x7F) {
          res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
          tmp = ''
        } else {
          tmp += '%' + buf[i].toString(16)
        }
      }

      return res + decodeUtf8Char(tmp);
    }

    function decodeUtf8Char (str) {
      try {
        return decodeURIComponent(str);
      } catch (err) {
        return String.fromCharCode(0xFFFD); // UTF 8 invalid char
      }
    }

    var strToSlice = (function() {
        // use fallback if necessary
        if (typeof window !== "object" || window.TextEncoder == null) return utf8ToBytes;

        var encoder = new window.TextEncoder('utf-8');
        return function(str) {
            return encoder.encode(str);
        }
    })();

    var sliceToStr = (function() {
        // use fallback if necessary
        if (typeof window !== "object" || window.TextDecoder == null) return utf8Slice;

        var decoder = new window.TextDecoder('utf-8');
        return function(str) {
            return decoder.decode(str);
        }
    })();

    // Helper buffer and views to easily and cheapily convert types
    var buffer = new ArrayBuffer(8),
        u8arr  = new Uint8Array(buffer),
        u16arr = new Uint16Array(buffer),
        u32arr = new Uint32Array(buffer),
        i8arr  = new Int8Array(buffer),
        i16arr = new Int16Array(buffer),
        i32arr = new Int32Array(buffer),
        f32arr = new Float32Array(buffer),
        f64arr = new Float64Array(buffer);

    var Encoder = (function() {
        function Encoder() {
            this.data = [];
        }

        function writeType(value, data, tarr, bytes) {
            tarr[0] = value;
            while (bytes--) data.push(u8arr[bytes]);
        }

        [
            function uint8(uint8) {
                this.data.push(uint8);
                return this;
            },

            function uint16(uint16) {
                this.data.push(uint16 >> 8, uint16 & 0xFF);
                return this;
            },

            function uint32(uint32) {
                writeType(uint32, this.data, u32arr, 4);
                return this;
            },

            function int8(int8) {
                writeType(int8, this.data, i8arr, 1);
                return this;
            },

            function int16(int16) {
                writeType(int16, this.data, i16arr, 2);
                return this;
            },

            function int32(int32) {
                writeType(int32, this.data, i32arr, 4);
                return this;
            },

            function float32(float32) {
                writeType(float32, this.data, f32arr, 4);
                return this;
            },

            function float64(float64) {
                writeType(float64, this.data, f64arr, 8);
                return this;
            },

            function size(size) {
                if (size > 1073741823 /* 00111111 11111111 11111111 11111111 */) {
                    throw new Error("Provided size is too long!");
                }

                if (size < 128) {
                    // can fit on 7 bits
                    this.data.push(size);
                } else if (size < 16384) {
                    // can fit on 14 bits
                    this.data.push(
                        size >> 8 | 128 /* 10000000 */,
                        size & 0xFF
                    );
                } else {
                    this.uint32(size);

                    // retrospectively attach signature
                    var sigindex = this.data.length - 4;
                    this.data[sigindex] = this.data[sigindex] | 192 /* 11000000 */;
                }
                return this;
            },

            function blob(blob) {
                var len = blob.length,
                    data = this.data,
                    i = 0;

                this.size(len);
                for (i = 0; i < len; i++) data.push(blob[i]);

                return this;
            },

            function string(string) {
                return this.blob(strToSlice(string));
            },

            function encode() {
                if (IS_NODE) {
                    return new Buffer(this.data);
                } else {
                    return new Uint8Array(this.data);
                }
            }
        ].forEach(function (method) { this[method.name] = method; }, Encoder.prototype);

        return Encoder;
    })();


    var Decoder = (function() {
        function Decoder(data) {
            if (data == null || data.length == null) throw new Error("Invalid type");
            this.data = data;
            this.index = 0;
            this.len = data.length;
        }

        function readType(decoder, tarr, bytes) {
            while (bytes--) u8arr[bytes] = decoder.uint8();
            return tarr[0];
        }

        [
            function uint8() {
                if (this.index >= this.length) throw new Error("Reading out of boundary");
                var uint8 = this.data[this.index];
                this.index += 1;
                return uint8;
            },

            function uint16() {
                return (this.uint8() << 8) | this.uint8();
            },

            function uint32() {
                return readType(this, u32arr, 4);
            },

            function int8() {
                return readType(this, i8arr, 1);
            },

            function int16() {
                return readType(this, i16arr, 2);
            },

            function int32() {
                return readType(this, i32arr, 4);
            },

            function float32() {
                return readType(this, f32arr, 4);
            },

            function float64() {
                return readType(this, f64arr, 8);
            },

            function size() {
                var size = this.uint8();

                // 1 byte (no signature)
                if ((size & 128) === 0) return size;

                var sig = size >> 6;
                // remove signature from the first byte
                size = size & 63 /* 00111111 */;

                // 2 bytes (signature is 10)
                if (sig === 2) return size << 8 | this.uint8();

                // 4 bytes (signature is 11)
                var i = 3;
                u8arr[3] = size;
                while (i--) u8arr[i] = this.uint8();
                return u32arr[0];
            },

            function blob() {
                var size = this.size();
                if (this.index + size >= this.length) throw new Error("Reading out of boundary");
                var blob = this.data.slice(this.index, this.index + size);

                this.index += size;

                return blob;
            },

            function string() {
                var blob = this.blob();
                return sliceToStr(new Uint8Array(blob));
            }
        ].forEach(function (method) { this[method.name] = method; }, Decoder.prototype);

        return Decoder;
    })();

    if (module.exports != null && exports === module.exports) {
        exports.Encoder = Encoder;
        exports.Decoder = Decoder;
    } else {
        window.bitsparrow = {
            Encoder: Encoder,
            Decoder: Decoder,
        }
    }
})();