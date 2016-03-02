var test = require('tape');
var bitsparrow = require('./index');

test('eat own dog food', function (t) {
    t.plan(14);

    var longText = "Sparrow /ˈsper.oʊ/\n\nUnder the classification used in the Handbook of the Birds of the World (HBW) main groupings of the sparrows are the true sparrows (genus Passer), the snowfinches (typically one genus, Montifringilla), and the rock sparrows (Petronia and the pale rockfinch). These groups are similar to each other, and are each fairly homogeneous, especially Passer.[4] Some classifications also include the sparrow-weavers (Plocepasser) and several other African genera (otherwise classified among the weavers, Ploceidae)[4] which are morphologically similar to Passer.[5] According to a study of molecular and skeletal evidence by Jon Fjeldså and colleagues, the cinnamon ibon of the Philippines, previously considered to be a white-eye, is a sister taxon to the sparrows as defined by the HBW. They therefore classify it as its own subfamily within Passeridae.[5]";

    var buffer = new bitsparrow.Encoder()
        .uint8(200)
        .uint16(9001)
        .uint32(1234567890)
        .int8(-42)
        .int16(-30000)
        .int32(-1234567890)
        .string('BitSparrow 🐦')
        .string(longText)
        .size(100)
        .size(10000)
        .size(1000000)
        .size(1073741823)
        .float32(Math.PI)
        .float64(Math.PI)
        .encode();

    var decoder = new bitsparrow.Decoder(buffer);

    t.equal(decoder.uint8(), 200, 'Can decode uint8');
    t.equal(decoder.uint16(), 9001, 'Can decode uint16');
    t.equal(decoder.uint32(), 1234567890, 'Can decode uint 32');
    t.equal(decoder.int8(), -42, 'Can decode int8');
    t.equal(decoder.int16(), -30000, 'Can decode in16');
    t.equal(decoder.int32(), -1234567890, 'Can decode int32');
    t.equal(decoder.string(), 'BitSparrow 🐦', 'Can decode utf8 strings');
    t.equal(decoder.string(), longText, 'Can decode long utf8 strings');
    t.equal(decoder.size(), 100, 'Can decode size < 128');
    t.equal(decoder.size(), 10000, 'Can decode size < 16384');
    t.equal(decoder.size(), 1000000, 'Can decode size > 16384');
    t.equal(decoder.size(), 1073741823, 'Can store size up to 1073741823');

    // account for rounding on float32
    t.ok(Math.abs(decoder.float32() - Math.PI) < 0.00001, 'Can decode float 32');

    // IEEE 754 float64 is the number type in JS, so it should match precisely
    t.equal(decoder.float64(), Math.PI, 'Can decode float 64');
});
