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
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
class VizCloud extends types_1.VideoExtractor {
    constructor() {
        super(...arguments);
        this.serverName = "VizCloud";
        this.sources = [];
        this.host = "https://vidstream.pro";
        this.keys = {
            cipher: "",
            encrypt: "",
            main: "",
            operations: new Map(),
            pre: [],
            post: [],
        };
        this.extract = (videoUrl, vizCloudHelper, apiKey) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const vizID = videoUrl.href.split("/");
            let url;
            if (!vizID.length) {
                throw new Error("Video not found");
            }
            else {
                url = `${vizCloudHelper}/vizcloud?query=${encodeURIComponent((_a = vizID.pop()) !== null && _a !== void 0 ? _a : "")}&apikey=${apiKey}`;
            }
            const { data } = yield this.client.get(url);
            if (!((_b = data.data) === null || _b === void 0 ? void 0 : _b.media))
                throw new Error("Video not found");
            this.sources = [
                ...this.sources,
                ...data.data.media.sources.map((source) => {
                    var _a;
                    return ({
                        url: source.file,
                        quality: "auto",
                        isM3U8: (_a = source.file) === null || _a === void 0 ? void 0 : _a.includes(".m3u8"),
                    });
                }),
            ];
            const main = this.sources[this.sources.length - 1].url;
            const req = yield this.client({
                method: "get",
                url: main,
                headers: { referer: "https://9anime.to" },
            });
            const resolutions = req.data.match(/(RESOLUTION=)(.*)(\s*?)(\s*.*)/g);
            resolutions === null || resolutions === void 0 ? void 0 : resolutions.forEach((res) => {
                const index = main.lastIndexOf("/");
                const quality = res.split("\n")[0].split("x")[1].split(",")[0];
                const url = main.slice(0, index);
                this.sources.push({
                    url: url + "/" + res.split("\n")[1],
                    isM3U8: (url + res.split("\n")[1]).includes(".m3u8"),
                    quality: quality + "p",
                });
            });
            return this.sources;
        });
    }
}
exports.default = VizCloud;
