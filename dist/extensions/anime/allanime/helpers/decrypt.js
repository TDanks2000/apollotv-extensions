"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllAnimeDecryptor = void 0;
class AllAnimeDecryptor {
    static oneDigitSymmetricXOR(password, target) {
        let result = "";
        for (let i = 0; i < target.length; i += 2) {
            let segment = parseInt(target.substr(i, 2), 16);
            result += String.fromCharCode(segment ^ password);
        }
        return result;
    }
    static decryptAllAnime(password, target) {
        const data = this.hexStringToByteArray(target);
        let result = "";
        for (const segment of data) {
            const decryptedSegment = password
                .split("")
                .reduce((acc, char) => acc ^ char.charCodeAt(0), segment);
            result += String.fromCharCode(decryptedSegment);
        }
        return result;
    }
    static hexStringToByteArray(hexString) {
        const result = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
            result[i / 2] = (parseInt(hexString.substr(i, 2), 16) & 0xff) >>> 0;
        }
        return result;
    }
}
exports.AllAnimeDecryptor = AllAnimeDecryptor;
