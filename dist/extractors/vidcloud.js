"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_js_1 = __importDefault(require("crypto-js"));
const types_1 = require("../types");
const utils_1 = require("../utils");
class VidCloud extends types_1.VideoExtractor {
    constructor() {
        super(...arguments);
        this.serverName = "VidCloud";
        this.sources = [];
        this.host = "https://dokicloud.one";
        this.host2 = "https://rabbitstream.net";
        this.extract = (videoUrl, isAlternative = false) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = {
                sources: [],
                subtitles: [],
            };
            try {
                const id = (_a = videoUrl.href.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split("?")[0];
                const options = {
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        Referer: videoUrl.href,
                        "User-Agent": utils_1.USER_AGENT,
                    },
                };
                let res = undefined;
                let sources = undefined;
                res = yield this.client.get(`${isAlternative ? this.host2 : this.host}/ajax/embed-4/getSources?id=${id}`, options);
                if (!(0, utils_1.isJson)(res.data.sources)) {
                    let { data: key } = yield this.client.get("https://github.com/enimax-anime/key/blob/e4/key.txt");
                    key = (0, utils_1.substringBefore)((0, utils_1.substringAfter)(key, '"blob-code blob-code-inner js-file-line">'), "</td>");
                    if (!key) {
                        key = yield (yield this.client.get("https://raw.githubusercontent.com/enimax-anime/key/e4/key.txt")).data;
                    }
                    const sourcesArray = res.data.sources.split("");
                    let extractedKey = "";
                    for (const index of key) {
                        for (let i = index[0]; i < index[1]; i++) {
                            extractedKey += res.data.sources[i];
                            sourcesArray[i] = "";
                        }
                    }
                    key = extractedKey;
                    res.data.sources = sourcesArray.join("");
                    const decryptedVal = crypto_js_1.default.AES.decrypt(res.data.sources, key).toString(crypto_js_1.default.enc.Utf8);
                    sources = (0, utils_1.isJson)(decryptedVal)
                        ? JSON.parse(decryptedVal)
                        : res.data.sources;
                }
                this.sources = sources.map((s) => ({
                    url: s.file,
                    isM3U8: s.file.includes(".m3u8"),
                }));
                result.sources.push(...this.sources);
                result.sources = [];
                this.sources = [];
                for (const source of sources) {
                    const { data } = yield this.client.get(source.file, options);
                    const urls = data
                        .split("\n")
                        .filter((line) => line.includes(".m3u8"));
                    const qualities = data
                        .split("\n")
                        .filter((line) => line.includes("RESOLUTION="));
                    const TdArray = qualities.map((s, i) => {
                        const f1 = s.split("x")[1];
                        const f2 = urls[i];
                        return [f1, f2];
                    });
                    for (const [f1, f2] of TdArray) {
                        this.sources.push({
                            url: f2,
                            quality: f1,
                            isM3U8: f2.includes(".m3u8"),
                        });
                    }
                    result.sources.push(...this.sources);
                }
                result.sources.push({
                    url: sources[0].file,
                    isM3U8: sources[0].file.includes(".m3u8"),
                    quality: "auto",
                });
                result.subtitles = res.data.tracks.map((s) => ({
                    url: s.file,
                    lang: s.label ? s.label : "Default (maybe)",
                }));
                return result;
            }
            catch (err) {
                throw err;
            }
        });
    }
}
exports.default = VidCloud;
