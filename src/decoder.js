import { IS_NODE }      from './env';
import { decodeString } from './utf8';

export function Decoder(data) {
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

var BufferType = IS_NODE ? Buffer : Uint8Array;

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


// Generic buffer slicing. Calling Buffer.slice or Uint8Array.subarray returns
// a view without copying underlying data.
var sliceBuffer = IS_NODE
    ? function(data, start, end) { return data.slice(start, end); }
    : function(data, start, end) { return data.subarray(start, end); };
