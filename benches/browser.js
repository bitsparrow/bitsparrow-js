/* OPEN index.html from the main folder */
const { Encoder, Decoder } = bitsparrow;

let buffer;

function bench(name, iter) {
    console.log(`Benching ${name}`);

    const maxIterations = 1000000;
    let iterations = maxIterations;

    const start = performance.now();

    while (iterations--) iter();

    const totalNanos = (performance.now() - start) * 1e6;
    const average = totalNanos / maxIterations;
    const iterPerSec = 1e9 / average;


    console.log(`- ${Math.round(average)}ns per iteration (${iterPerSec | 0} ops/sec)`);
    console.log('');
}

// ---- float64 decode ----

buffer = new Encoder().float64(3.141592653589793).end();
bench('decode float64 - BitSparrow', function() {
    return new Decoder(buffer).float64();
});

bench('decode float64 - JSON', function() {
    return JSON.parse("3.141592653589793");
});

buffer = msgpack.encode(3.141592653589793);
bench('decode float64 - msgpack-lite', function() {
    return msgpack.decode(buffer);
});

// ---- float64 encode ----

bench('encode float64 - BitSparrow', function() {
    return new Encoder().float64(3.141592653589793).end();
});

bench('encode float64 - JSON', function() {
    return JSON.stringify(3.141592653589793);
});

bench('encode float64 - msgpack-lite', function() {
    return msgpack.encode(3.141592653589793);
});

// ---- uint32 decode ----

buffer = new Encoder().uint32(0xFFFFFFFF).end();
bench('decode uint32 - BitSparrow', function() {
    return new Decoder(buffer).uint32();
});

bench('decode uint32 - JSON', function() {
    return JSON.parse("4294967295");
});

buffer = msgpack.encode(0xFFFFFFFF);
bench('decode uint32 - msgpack-lite', function() {
    return msgpack.decode(buffer);
});

// ---- uint32 encode ----

bench('encode uint32 - BitSparrow', function() {
    return new Encoder().uint32(0xFFFFFFFF).end();
});

bench('encode uint32 - JSON', function() {
    return JSON.stringify(0xFFFFFFFF);
});

bench('encode uint32 - msgpack-lite', function() {
    return msgpack.encode(0xFFFFFFFF);
});

// ---- string decode ----

buffer = new Encoder().string("BitSparrow 🐦").end();
bench('decode string - BitSparrow', function() {
    return new Decoder(buffer).string();
});

bench('decode string - JSON', function() {
    return JSON.parse("\"BitSparrow 🐦\"");
});

buffer = new msgpack.encode("BitSparrow 🐦");
bench('decode string - msgpack-lite', function() {
    return msgpack.decode(buffer);
});

// ---- string encode ----

bench('encode string - BitSparrow', function() {
    return new Encoder().string("BitSparrow 🐦").end();
});

bench('encode string - JSON', function() {
    return JSON.stringify("BitSparrow 🐦");
});

bench('encode string - msgpack-lite', function() {
    return msgpack.encode("BitSparrow 🐦");
});

// ---- long string decode ----

var longText = "Sparrow /ˈsper.oʊ/\n\nUnder the classification used in \
the Handbook of the Birds of the World (HBW) main groupings of the sparrows \
are the true sparrows (genus Passer), the snowfinches (typically one genus, \
Montifringilla), and the rock sparrows (Petronia and the pale rockfinch). \
These groups are similar to each other, and are each fairly homogeneous, \
especially Passer.[4] Some classifications also include the sparrow-weavers \
(Plocepasser) and several other African genera (otherwise classified among \
the weavers, Ploceidae)[4] which are morphologically similar to Passer.[5] \
According to a study of molecular and skeletal evidence by Jon Fjeldså and \
colleagues, the cinnamon ibon of the Philippines, previously considered to \
be a white-eye, is a sister taxon to the sparrows as defined by the HBW. \
They therefore classify it as its own subfamily within Passeridae.[5]";

buffer = new Encoder().string(longText).end();
bench('decode long string - BitSparrow', function() {
    return new Decoder(buffer).string();
});

buffer = JSON.stringify(longText);
bench('decode long string - JSON', function() {
    return JSON.parse(buffer);
});

buffer = new msgpack.encode(longText);
bench('decode long string - msgpack-lite', function() {
    return msgpack.decode(buffer);
});

// ---- long string encode ----
//
bench('encode long string - BitSparrow', function() {
    return new Encoder().string(longText).end();
});

bench('encode long string - JSON', function() {
    return JSON.stringify(longText);
});

bench('encode long string - msgpack-lite', function() {
    return msgpack.encode(longText);
});
