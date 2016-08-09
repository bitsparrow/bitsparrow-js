/* OPEN index.html from the main folder */
const { Encoder, Decoder } = bitsparrow;

let buffer;

function bench(iter) {
    const maxIterations = 1000000;
    let iterations = maxIterations;

    const start = performance.now();

    while (iterations--) iter();

    const totalNanos = (performance.now() - start) * 1e6;
    const average = totalNanos / maxIterations;
    const iterPerSec = 1e9 / average;


    console.log(`Benching ${iter.name}`);
    console.log(`- ${Math.round(average)}ns per iteration (${iterPerSec | 0} ops/sec)`);
    console.log('');
}

// ---- float64 decode ----

buffer = new Encoder().float64(3.141592653589793).end();
bench(function decode_float64() {
    return new Decoder(buffer).float64();
});

bench(function json_parse_float64() {
    return JSON.parse("3.141592653589793");
});

buffer = msgpack.encode(3.141592653589793);
bench(function msgpack_decode_float64() {
    return msgpack.decode(buffer);
});

// ---- float64 encode ----

bench(function encode_float64() {
    return new Encoder().float64(3.141592653589793).end();
});

bench(function json_stringify_float64() {
    return JSON.stringify(3.141592653589793);
});

bench(function msgpack_encode_float64() {
    return msgpack.encode(3.141592653589793);
});

// ---- uint32 decode ----

buffer = new Encoder().uint32(0xFFFFFFFF).end();
bench(function decode_uint32() {
    return new Decoder(buffer).uint32();
});

bench(function json_parse_uint32() {
    return JSON.parse("4294967295");
});

buffer = msgpack.encode(0xFFFFFFFF);
bench(function msgpack_decode_uint32() {
    return msgpack.decode(buffer);
});

// ---- uint32 encode ----

bench(function encode_uint32() {
    return new Encoder().uint32(0xFFFFFFFF).end();
});

bench(function json_stringify_uint32() {
    return JSON.stringify(0xFFFFFFFF);
});

bench(function msgpack_encode_uint32() {
    return msgpack.encode(0xFFFFFFFF);
});

// ---- string decode ----

buffer = new Encoder().string("BitSparrow 🐦").end();
bench(function decode_string() {
    return new Decoder(buffer).string();
});

bench(function json_parse_string() {
    return JSON.parse("\"BitSparrow 🐦\"");
});

buffer = new msgpack.encode("BitSparrow 🐦");
bench(function msgpack_decode_string() {
    return msgpack.decode(buffer);
});

// ---- string encode ----

bench(function encode_string() {
    return new Encoder().string("BitSparrow 🐦").end();
});

bench(function json_stringify_string() {
    return JSON.stringify("BitSparrow 🐦");
});

bench(function msgpack_encode_string() {
    return msgpack.encode("BitSparrow 🐦");
});
