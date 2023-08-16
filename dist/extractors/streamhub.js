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
class StreamHub extends types_1.VideoExtractor {
    constructor() {
        super(...arguments);
        this.serverName = "StreamHub";
        this.sources = [];
        this.extract = (videoUrl) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const result = {
                    sources: [],
                    subtitles: [],
                };
                const { data } = yield this.client.get(videoUrl.href).catch(() => {
                    throw new Error("Video not found");
                });
                const unpackedData = eval(/(eval)(\(f.*?)(\n<\/script>)/s.exec(data)[2].replace("eval", ""));
                const links = (_a = unpackedData.match(new RegExp('sources:\\[\\{src:"(.*?)"'))) !== null && _a !== void 0 ? _a : [];
                const m3u8Content = yield this.client.get(links[1], {
                    headers: {
                        Referer: links[1],
                    },
                });
                result.sources.push({
                    quality: "auto",
                    url: links[1],
                    isM3U8: links[1].includes(".m3u8"),
                });
                if (m3u8Content.data.includes("EXTM3U")) {
                    const videoList = m3u8Content.data.split("#EXT-X-STREAM-INF:");
                    for (const video of videoList !== null && videoList !== void 0 ? videoList : []) {
                        if (!video.includes("m3u8"))
                            continue;
                        const url = video.split("\n")[1];
                        const quality = video
                            .split("RESOLUTION=")[1]
                            .split(",")[0]
                            .split("x")[1];
                        result.sources.push({
                            url: url,
                            quality: `${quality}p`,
                            isM3U8: url.includes(".m3u8"),
                        });
                    }
                }
                return result;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
}
exports.default = StreamHub;
