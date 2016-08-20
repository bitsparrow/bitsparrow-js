import { IS_NODE }      from './env';
import { encodeString } from './utf8';
import Vec              from './vec';

export function Encoder() {
    this.data = prealloc === null ? new Vec() : prealloc;
    prealloc = null;
    this.boolIndex = -1;
    this.boolShift = 0;
}

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
        this.data = new Vec();
        return data;
    }
};


function brshift32(n) {
    return Math.floor(n / 0x100000000);
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
];

var prealloc = Vec.withCapacity(2048);
