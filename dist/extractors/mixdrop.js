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
class MixDrop extends types_1.VideoExtractor {
    constructor() {
        super(...arguments);
        this.serverName = "MixDrop";
        this.sources = [];
        this.extract = (videoUrl) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this.client.get(videoUrl.href);
                const formated = eval(/(eval)(\(f.*?)(\n<\/script>)/s.exec(data)[2].replace("eval", ""));
                const [poster, source] = formated
                    .match(/poster="([^"]+)"|wurl="([^"]+)"/g)
                    .map((x) => x.split(`="`)[1].replace(/"/g, ""))
                    .map((x) => (x.startsWith("http") ? x : `https:${x}`));
                this.sources.push({
                    url: source,
                    isM3U8: source.includes(".m3u8"),
                    poster: poster,
                });
                return this.sources;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
}
exports.default = MixDrop;
