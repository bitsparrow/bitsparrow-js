var Encoder = (function() {
    var strToSlice = (function() {
        var encoder = new window.TextEncoder('utf-8');

        return function(str) {
            return encoder.encode(str);
        }
    })();

    function Encoder() {
        this.data = [];
    }

    [
        function byte(byte) {
            this.data.push(byte);
            return this;
        },

        function flags(flags) {
            var byte = 0, i, len = Math.max(flags.length, 8);
            for (i = 0; i < len; i++) {
                if (flags[i]) byte = byte | 128 /* 0b10000000 */ >> i;
            }
            return this.byte(byte);
        },

        function size(size) {
            if (size < 128) {
                this.data.push(size);
            } else if (size < 16384) {
                this.data.push(size >> 8 | 128 /* 0b10000000 */);
                this.data.push(size & 0xFF);
            } else {
                this.data.push(size >> 24 | 192 /* 0b11000000 */);
                this.data.push(size >> 16 & 0xFF);
                this.data.push(size >> 8 & 0xFF);
                this.data.push(size & 0xFF);
            }
            return this;
        },

        function string(str) {
            var slice = strToSlice(str),
                len = slice.length,
                data = this.data,
                i;

            if (len > 1073741823 /* 0b00111111111111111111111111111111 */) {
                throw new Error("Provided string is too long!");
            }

            this.size(len);
            for (i = 0; i < len; i++) data.push(slice[i]);

            return this;
        }
    ].forEach(function (method) { this[method.name] = method; }, Encoder.prototype);

    return Encoder;
})();


var Decoder = (function() {
    var sliceToStr = (function() {
        var decoder = new window.TextDecoder('utf-8');

        return function(str) {
            return decoder.decode(str);
        }
    })();

    function Decoder(data) {
        this.data = data;
        this.cursor = 0;
        this.len = data.length;
    }

    [
        function byte() {
            if (this.cursor > this.length) {
                throw new Error("Reading out of bounds");
            }
            var byte = this.data[this.cursor];
            this.cursor += 1;
            return byte;
        },

        function flags() {
            var byte = this.byte(),
                flags = new Array(8);

            for (i = 0; i < 8; i++) {
                flags[i] = !!(byte & 128 /* 0b10000000 */ >> i);
            }
            return flags;
        },

        function size(size) {
            var size = this.byte();

            if ((size & 128) === 0) {
                return size;
            } else {
                var sig = size >> 6;
                // remove signature from the number
                size = size & 63 /* 0b00111111 */;
                if (sig === 2) {
                    return size << 8 | this.byte();
                }
                if (sig === 3) {
                    return size << 24
                         | (this.byte() << 16)
                         | (this.byte() << 8)
                         | this.byte();
                }
                throw new Error("Unknown size signature " + size);
            }
        },

        function string(str) {
            var size = this.size(),
                slice = new Uint8Array(this.data.slice(this.cursor, this.cursor + size));

            this.cursor += size;

            return sliceToStr(slice);
        }
    ].forEach(function (method) { this[method.name] = method; }, Decoder.prototype);

    return Decoder;
})();

if (module.exports != null && exports === module.exports) {
    exports.Encoder = Encoder;
    exports.Decoder = Decoder;
}