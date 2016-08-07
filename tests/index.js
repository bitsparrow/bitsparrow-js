var test = require('tape');
var bitsparrow = require('../index');
var Encoder = bitsparrow.Encoder;
var Decoder = bitsparrow.Decoder;

//var bitsparrow = require('bitsparrow');
var buffer = new Encoder()
                 .uint8(20)
                 .string("Hello World!")
                 .float32(42.1337)
                 .end();

var expected = new Buffer([
    0xc8,0x23,0x29,0x49,0x96,0x02,0xd2,0xd6,0x8a,0xd0,0xb6,0x69,0xfd,
    0x2e,0x0f,0x42,0x69,0x74,0x53,0x70,0x61,0x72,0x72,0x6f,0x77,0x20,
    0xf0,0x9f,0x90,0xa6,0x83,0x69,0x53,0x70,0x61,0x72,0x72,0x6f,0x77,
    0x20,0x2f,0xcb,0x88,0x73,0x70,0x65,0x72,0x2e,0x6f,0xca,0x8a,0x2f,
    0x0a,0x0a,0x55,0x6e,0x64,0x65,0x72,0x20,0x74,0x68,0x65,0x20,0x63,
    0x6c,0x61,0x73,0x73,0x69,0x66,0x69,0x63,0x61,0x74,0x69,0x6f,0x6e,
    0x20,0x75,0x73,0x65,0x64,0x20,0x69,0x6e,0x20,0x74,0x68,0x65,0x20,
    0x48,0x61,0x6e,0x64,0x62,0x6f,0x6f,0x6b,0x20,0x6f,0x66,0x20,0x74,
    0x68,0x65,0x20,0x42,0x69,0x72,0x64,0x73,0x20,0x6f,0x66,0x20,0x74,
    0x68,0x65,0x20,0x57,0x6f,0x72,0x6c,0x64,0x20,0x28,0x48,0x42,0x57,
    0x29,0x20,0x6d,0x61,0x69,0x6e,0x20,0x67,0x72,0x6f,0x75,0x70,0x69,
    0x6e,0x67,0x73,0x20,0x6f,0x66,0x20,0x74,0x68,0x65,0x20,0x73,0x70,
    0x61,0x72,0x72,0x6f,0x77,0x73,0x20,0x61,0x72,0x65,0x20,0x74,0x68,
    0x65,0x20,0x74,0x72,0x75,0x65,0x20,0x73,0x70,0x61,0x72,0x72,0x6f,
    0x77,0x73,0x20,0x28,0x67,0x65,0x6e,0x75,0x73,0x20,0x50,0x61,0x73,
    0x73,0x65,0x72,0x29,0x2c,0x20,0x74,0x68,0x65,0x20,0x73,0x6e,0x6f,
    0x77,0x66,0x69,0x6e,0x63,0x68,0x65,0x73,0x20,0x28,0x74,0x79,0x70,
    0x69,0x63,0x61,0x6c,0x6c,0x79,0x20,0x6f,0x6e,0x65,0x20,0x67,0x65,
    0x6e,0x75,0x73,0x2c,0x20,0x4d,0x6f,0x6e,0x74,0x69,0x66,0x72,0x69,
    0x6e,0x67,0x69,0x6c,0x6c,0x61,0x29,0x2c,0x20,0x61,0x6e,0x64,0x20,
    0x74,0x68,0x65,0x20,0x72,0x6f,0x63,0x6b,0x20,0x73,0x70,0x61,0x72,
    0x72,0x6f,0x77,0x73,0x20,0x28,0x50,0x65,0x74,0x72,0x6f,0x6e,0x69,
    0x61,0x20,0x61,0x6e,0x64,0x20,0x74,0x68,0x65,0x20,0x70,0x61,0x6c,
    0x65,0x20,0x72,0x6f,0x63,0x6b,0x66,0x69,0x6e,0x63,0x68,0x29,0x2e,
    0x20,0x54,0x68,0x65,0x73,0x65,0x20,0x67,0x72,0x6f,0x75,0x70,0x73,
    0x20,0x61,0x72,0x65,0x20,0x73,0x69,0x6d,0x69,0x6c,0x61,0x72,0x20,
    0x74,0x6f,0x20,0x65,0x61,0x63,0x68,0x20,0x6f,0x74,0x68,0x65,0x72,
    0x2c,0x20,0x61,0x6e,0x64,0x20,0x61,0x72,0x65,0x20,0x65,0x61,0x63,
    0x68,0x20,0x66,0x61,0x69,0x72,0x6c,0x79,0x20,0x68,0x6f,0x6d,0x6f,
    0x67,0x65,0x6e,0x65,0x6f,0x75,0x73,0x2c,0x20,0x65,0x73,0x70,0x65,
    0x63,0x69,0x61,0x6c,0x6c,0x79,0x20,0x50,0x61,0x73,0x73,0x65,0x72,
    0x2e,0x5b,0x34,0x5d,0x20,0x53,0x6f,0x6d,0x65,0x20,0x63,0x6c,0x61,
    0x73,0x73,0x69,0x66,0x69,0x63,0x61,0x74,0x69,0x6f,0x6e,0x73,0x20,
    0x61,0x6c,0x73,0x6f,0x20,0x69,0x6e,0x63,0x6c,0x75,0x64,0x65,0x20,
    0x74,0x68,0x65,0x20,0x73,0x70,0x61,0x72,0x72,0x6f,0x77,0x2d,0x77,
    0x65,0x61,0x76,0x65,0x72,0x73,0x20,0x28,0x50,0x6c,0x6f,0x63,0x65,
    0x70,0x61,0x73,0x73,0x65,0x72,0x29,0x20,0x61,0x6e,0x64,0x20,0x73,
    0x65,0x76,0x65,0x72,0x61,0x6c,0x20,0x6f,0x74,0x68,0x65,0x72,0x20,
    0x41,0x66,0x72,0x69,0x63,0x61,0x6e,0x20,0x67,0x65,0x6e,0x65,0x72,
    0x61,0x20,0x28,0x6f,0x74,0x68,0x65,0x72,0x77,0x69,0x73,0x65,0x20,
    0x63,0x6c,0x61,0x73,0x73,0x69,0x66,0x69,0x65,0x64,0x20,0x61,0x6d,
    0x6f,0x6e,0x67,0x20,0x74,0x68,0x65,0x20,0x77,0x65,0x61,0x76,0x65,
    0x72,0x73,0x2c,0x20,0x50,0x6c,0x6f,0x63,0x65,0x69,0x64,0x61,0x65,
    0x29,0x5b,0x34,0x5d,0x20,0x77,0x68,0x69,0x63,0x68,0x20,0x61,0x72,
    0x65,0x20,0x6d,0x6f,0x72,0x70,0x68,0x6f,0x6c,0x6f,0x67,0x69,0x63,
    0x61,0x6c,0x6c,0x79,0x20,0x73,0x69,0x6d,0x69,0x6c,0x61,0x72,0x20,
    0x74,0x6f,0x20,0x50,0x61,0x73,0x73,0x65,0x72,0x2e,0x5b,0x35,0x5d,
    0x20,0x41,0x63,0x63,0x6f,0x72,0x64,0x69,0x6e,0x67,0x20,0x74,0x6f,
    0x20,0x61,0x20,0x73,0x74,0x75,0x64,0x79,0x20,0x6f,0x66,0x20,0x6d,
    0x6f,0x6c,0x65,0x63,0x75,0x6c,0x61,0x72,0x20,0x61,0x6e,0x64,0x20,
    0x73,0x6b,0x65,0x6c,0x65,0x74,0x61,0x6c,0x20,0x65,0x76,0x69,0x64,
    0x65,0x6e,0x63,0x65,0x20,0x62,0x79,0x20,0x4a,0x6f,0x6e,0x20,0x46,
    0x6a,0x65,0x6c,0x64,0x73,0xc3,0xa5,0x20,0x61,0x6e,0x64,0x20,0x63,
    0x6f,0x6c,0x6c,0x65,0x61,0x67,0x75,0x65,0x73,0x2c,0x20,0x74,0x68,
    0x65,0x20,0x63,0x69,0x6e,0x6e,0x61,0x6d,0x6f,0x6e,0x20,0x69,0x62,
    0x6f,0x6e,0x20,0x6f,0x66,0x20,0x74,0x68,0x65,0x20,0x50,0x68,0x69,
    0x6c,0x69,0x70,0x70,0x69,0x6e,0x65,0x73,0x2c,0x20,0x70,0x72,0x65,
    0x76,0x69,0x6f,0x75,0x73,0x6c,0x79,0x20,0x63,0x6f,0x6e,0x73,0x69,
    0x64,0x65,0x72,0x65,0x64,0x20,0x74,0x6f,0x20,0x62,0x65,0x20,0x61,
    0x20,0x77,0x68,0x69,0x74,0x65,0x2d,0x65,0x79,0x65,0x2c,0x20,0x69,
    0x73,0x20,0x61,0x20,0x73,0x69,0x73,0x74,0x65,0x72,0x20,0x74,0x61,
    0x78,0x6f,0x6e,0x20,0x74,0x6f,0x20,0x74,0x68,0x65,0x20,0x73,0x70,
    0x61,0x72,0x72,0x6f,0x77,0x73,0x20,0x61,0x73,0x20,0x64,0x65,0x66,
    0x69,0x6e,0x65,0x64,0x20,0x62,0x79,0x20,0x74,0x68,0x65,0x20,0x48,
    0x42,0x57,0x2e,0x20,0x54,0x68,0x65,0x79,0x20,0x74,0x68,0x65,0x72,
    0x65,0x66,0x6f,0x72,0x65,0x20,0x63,0x6c,0x61,0x73,0x73,0x69,0x66,
    0x79,0x20,0x69,0x74,0x20,0x61,0x73,0x20,0x69,0x74,0x73,0x20,0x6f,
    0x77,0x6e,0x20,0x73,0x75,0x62,0x66,0x61,0x6d,0x69,0x6c,0x79,0x20,
    0x77,0x69,0x74,0x68,0x69,0x6e,0x20,0x50,0x61,0x73,0x73,0x65,0x72,
    0x69,0x64,0x61,0x65,0x2e,0x5b,0x35,0x5d,0x06,0x01,0x02,0x03,0x04,
    0x05,0x06,0x64,0xa7,0x10,0xcf,0x42,0x40,0xf0,0x3f,0xff,0xff,0xff,
    0x40,0x49,0x0f,0xdb,0x40,0x09,0x21,0xfb,0x54,0x44,0x2d,0x18
]);
var longText = "Sparrow /ˈsper.oʊ/\n\nUnder the classification used in the Handbook of the Birds of the World (HBW) main groupings of the sparrows are the true sparrows (genus Passer), the snowfinches (typically one genus, Montifringilla), and the rock sparrows (Petronia and the pale rockfinch). These groups are similar to each other, and are each fairly homogeneous, especially Passer.[4] Some classifications also include the sparrow-weavers (Plocepasser) and several other African genera (otherwise classified among the weavers, Ploceidae)[4] which are morphologically similar to Passer.[5] According to a study of molecular and skeletal evidence by Jon Fjeldså and colleagues, the cinnamon ibon of the Philippines, previously considered to be a white-eye, is a sister taxon to the sparrows as defined by the HBW. They therefore classify it as its own subfamily within Passeridae.[5]";

var bytes = new Buffer([1,2,3,4,5,6]);

test('eat own dog food', function (t) {
    t.plan(17);

    var buffer = new Encoder()
        .uint8(200)
        .uint16(9001)
        .uint32(1234567890)
        .int8(-42)
        .int16(-30000)
        .int32(-1234567890)
        .string('BitSparrow 🐦')
        .string(longText)
        .bytes(bytes)
        .size(100)
        .size(10000)
        .size(1000000)
        .size(1073741823)
        .float32(Math.PI)
        .float64(Math.PI)
        .end();

    t.ok(expected.equals(buffer), 'Encoding matches predefined data');

    var decoder = new Decoder(buffer);

    t.equal(decoder.uint8(), 200, 'Can decode uint8');
    t.equal(decoder.uint16(), 9001, 'Can decode uint16');
    t.equal(decoder.uint32(), 1234567890, 'Can decode uint32');
    t.equal(decoder.int8(), -42, 'Can decode int8');
    t.equal(decoder.int16(), -30000, 'Can decode in16');
    t.equal(decoder.int32(), -1234567890, 'Can decode int32');
    t.equal(decoder.string(), 'BitSparrow 🐦', 'Can decode utf8 strings');
    t.equal(decoder.string(), longText, 'Can decode long utf8 strings');
    t.ok(bytes.equals(decoder.bytes()), 'Can decode byte buffers');
    t.equal(decoder.size(), 100, 'Can decode size < 128');
    t.equal(decoder.size(), 10000, 'Can decode size < 16384');
    t.equal(decoder.size(), 1000000, 'Can decode size > 16384');
    t.equal(decoder.size(), 1073741823, 'Can store size up to 1073741823');

    // account for rounding on float32
    t.ok(Math.abs(decoder.float32() - Math.PI) < 0.00001, 'Can decode float 32');

    // IEEE 754 float64 is the number type in JS, so it should match precisely
    t.equal(decoder.float64(), Math.PI, 'Can decode float 64');
    t.equal(decoder.end(), true, 'Reads till the end');
});

test('stacking bools', function(t) {
    var buffer = new Encoder()
                    .bool(true)
                    .bool(false)
                    .bool(true)
                    .bool(false)
                    .bool(false)
                    .bool(false)
                    .bool(true)
                    .bool(true)
                    .bool(false)
                    .uint8(10)
                    .bool(true)
                    .end();

    t.ok(buffer.equals(new Buffer([parseInt('11000101', 2), 0, 10, 1])), 'Stacking 8 booleans uses 1 byte');
    t.equal(buffer.length, 4, 'Stacking 8 booleans uses 1 byte');

    var decoder = new Decoder(buffer);
    t.equal(decoder.bool(), true);
    t.equal(decoder.bool(), false);
    t.equal(decoder.bool(), true);
    t.equal(decoder.bool(), false);
    t.equal(decoder.bool(), false);
    t.equal(decoder.bool(), false);
    t.equal(decoder.bool(), true);
    t.equal(decoder.bool(), true);
    t.equal(decoder.bool(), false);
    t.equal(decoder.uint8(), 10);
    t.equal(decoder.bool(), true, 'Boolean stack resets on other types');
    t.equal(decoder.end(), true, 'Reads till the end');

    t.end();
});

function roundtrip(t, value, type) {
    var buffer = new Encoder()[type](value).end();
    var decoder = new Decoder(buffer);
    t.equal(decoder[type](), value, 'Roundtrip '+type+' with 0x'+value.toString(16).toUpperCase());
    t.ok(decoder.end(), 'Roundtrip '+type+' in bounds');
}

test('Roundtripping', function(t) {
    roundtrip(t,                     true, 'bool');
    roundtrip(t,                    false, 'bool');
    roundtrip(t,                        0, 'size'); // 1 byte
    roundtrip(t,                     0x7F, 'size'); // 1 byte
    roundtrip(t,                   0x3FFF, 'size'); // 2 bytes
    roundtrip(t,                 0x1FFFFF, 'size'); // 3 bytes
    roundtrip(t,               0x0FFFFFFF, 'size'); // 4 bytes
    roundtrip(t,             0x07FFFFFFFF, 'size'); // 5 bytes
    roundtrip(t,           0x03FFFFFFFFFF, 'size'); // 6 bytes
    roundtrip(t,         0x01FFFFFFFFFFFF, 'size'); // 7 bytes
    roundtrip(t,  Number.MAX_SAFE_INTEGER, 'size'); // 8 bytes
    roundtrip(t,                        0, 'uint8');
    roundtrip(t,                     0xFF, 'uint8');
    roundtrip(t,                        0, 'uint16');
    roundtrip(t,                   0xFFFF, 'uint16');
    roundtrip(t,                        0, 'uint32');
    roundtrip(t,               0xFFFFFFFF, 'uint32');
    roundtrip(t,                        0, 'uint64');
    roundtrip(t,  Number.MAX_SAFE_INTEGER, 'uint64');
    roundtrip(t,                        0, 'int8');
    roundtrip(t,                     0x7F, 'int8');
    roundtrip(t,                    -0x80, 'int8');
    roundtrip(t,                        0, 'int16');
    roundtrip(t,                   0x7FFF, 'int16');
    roundtrip(t,                  -0x8000, 'int16');
    roundtrip(t,                        0, 'int32');
    roundtrip(t,               0x7FFFFFFF, 'int32');
    roundtrip(t,              -0x80000000, 'int32');
    roundtrip(t,                        0, 'int64');
    roundtrip(t,  Number.MAX_SAFE_INTEGER, 'int64');
    roundtrip(t, -Number.MAX_SAFE_INTEGER, 'int64');

    t.end();
});

function sizecheck(t, value, type, len) {
    var buffer = new Encoder()[type](value).end();
    t.equal(buffer.length, len, 'Size check '+type+' with 0x'+value.toString(16).toUpperCase());
}

test('Size checking', function(t) {
    sizecheck(t,                       0, 'size', 1);
    sizecheck(t,                    0x7F, 'size', 1);
    sizecheck(t,                  0x3FFF, 'size', 2);
    sizecheck(t,                0x1FFFFF, 'size', 3);
    sizecheck(t,              0x0FFFFFFF, 'size', 4);
    sizecheck(t,            0x07FFFFFFFF, 'size', 5);
    sizecheck(t,          0x03FFFFFFFFFF, 'size', 6);
    sizecheck(t,        0x01FFFFFFFFFFFF, 'size', 7);
    sizecheck(t, Number.MAX_SAFE_INTEGER, 'size', 8);

    t.end();
});

test('string in bounds', function(t) {
    var buffer = new Encoder().string('Some string').end();
    var decoder = new Decoder(buffer);

    t.equal(decoder.string(), 'Some string');
    t.equal(decoder.end(), true);

    t.end();
})
