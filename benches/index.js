const { Encoder, Decoder } = require('../index.js');
const msgpack = require("msgpack-lite");

let buffer;

function bench(name, iter) {
    console.log(`Benching ${name}`);

    const maxIterations = 1000000;
    let iterations = maxIterations;

    const start = process.hrtime();

    while (iterations--) iter();

    const time = process.hrtime(start);
    totalNanos = time[1] + (1e9 * time[0]);
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
