import { IS_NODE } from './env';

var allocBuffer = IS_NODE && Buffer.allocUnsafe ? Buffer.allocUnsafe : function(size) {
    return new Buffer(size);
};

export default function Vec() {
    this.capacity = 0;
    this.len = 0;
}

Vec.prototype = IS_NODE ? {
    reserve: function(size) {
        var required = this.len + size;
        var cap = this.capacity;

        if (required <= cap) return;

        if (cap === 0) {
            this.capacity = size;
            this.bytes = allocBuffer(size);
            return;
        }

        while (required > cap) cap *= 2;

        var previous = this.bytes;
        this.capacity = cap;
        this.bytes = allocBuffer(cap);
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


    getSlice: function() {
        var slice = allocBuffer(this.len);
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

    getSlice: function() {
        return this.bytes.slice(0, this.len);
    }
};

Vec.prototype.extendFrom = function(bytes) {
    var len = bytes.length;
    var i = 0;

    this.reserve(len);

    while (i < len) this.bytes[this.len++] = bytes[i++];
};

Vec.prototype.clear = function() {
    this.len = 0;
    return this;
};

Vec.withCapacity = function(size) {
    var vec = new Vec();
    vec.reserve(size);
    return vec;
}
