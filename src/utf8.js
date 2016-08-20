import { IS_NODE } from './env';

var utf8decoder = typeof TextDecoder === 'function' ? new TextDecoder('utf-8') : null;

// Read a JavaScript UTF-16 String from a UTF-8 encoded array-like buffer.
export var decodeString = IS_NODE
    ? function(buffer, start, len) { return buffer.toString('utf8', start, start + len); }
    : function(buffer, start, len) {
        if (len > 128 && utf8decoder !== null) {
            return utf8decoder.decode(buffer.subarray(start, start + len));
        }
        var string = '';
        var cp = 0;
        var i = start;
        var end = i + len;

        while (i < end) {
            cp = buffer[i++];
            if (cp < 128) {
                string += String.fromCharCode(cp);
                continue;
            }

            if ((cp & 0xE0) === 0xC0) {
                // 2 bytes
                cp = (cp & 0x1F) << 6 |
                     (buffer[i++] & 0x3F);

            } else if ((cp & 0xF0) === 0xE0) {
                // 3 bytes
                cp = (cp & 0x0F)          << 12 |
                     (buffer[i++] & 0x3F) << 6  |
                     (buffer[i++] & 0x3F);

            } else if ((cp & 0xF8) === 0xF0) {
                // 4 bytes
                cp = (cp & 0x07)          << 18 |
                     (buffer[i++] & 0x3F) << 12 |
                     (buffer[i++] & 0x3F) << 6  |
                     (buffer[i++] & 0x3F);
            }

            if (cp >= 0x010000) {
                // A surrogate pair
                cp -= 0x010000;

                string += String.fromCharCode((cp >>> 10) + 0xD800, (cp & 0x3FF) + 0xDC00);
            } else {
                string += String.fromCharCode(cp);
            }
        }

        return string;
    };

// Write a JavaScript string to a UTF-8 encoded byte array.
export function encodeString(string, bytes, offset) {
    var len = string.length|0;
    var cp = 0;
    var i = 0;
    var pos = offset|0;

    while (i < len) {
        cp = string.charCodeAt(i++);

        if (cp < 128) {
            bytes[pos++] = cp;
        } else if (cp < 0x800) {
            // 2 bytes
            bytes[pos++] = 0xC0 | (cp >>> 6);
            bytes[pos++] = 0x80 | (cp & 0x3F);
        } else if (cp < 0xD800 || cp > 0xDFFF) {
            // 3 bytes
            bytes[pos++] = 0xE0 | (cp  >>> 12);
            bytes[pos++] = 0x80 | ((cp >>> 6)  & 0x3F);
            bytes[pos++] = 0x80 | (cp          & 0x3F);
        } else {
            // 4 bytes - surrogate pair
            cp = (((cp - 0xD800) << 10) | (string.charCodeAt(i++) - 0xDC00)) + 0x10000;
            bytes[pos++] = 0xF0 | (cp >>> 18);
            bytes[pos++] = 0x80 | ((cp >>> 12) & 0x3F);
            bytes[pos++] = 0x80 | ((cp >>> 6)  & 0x3F);
            bytes[pos++] = 0x80 | (cp          & 0x3F);
        }
    }

    return pos - offset;
};
