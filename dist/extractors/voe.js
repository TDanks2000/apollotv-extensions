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
class Voe extends types_1.VideoExtractor {
    constructor() {
        super(...arguments);
        this.serverName = "voe";
        this.sources = [];
        this.domains = ["voe.sx"];
        this.extract = (videoUrl) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this.client.get(videoUrl.href);
                const links = data.match(/'hls': ?'(http.*?)',/);
                const quality = data.match(/'video_height': ?([0-9]+),/)[1];
                this.sources.push({
                    quality: quality,
                    url: links[1],
                    isM3U8: links[1].includes(".m3u8"),
                });
                return this.sources;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
}
exports.default = Voe;
