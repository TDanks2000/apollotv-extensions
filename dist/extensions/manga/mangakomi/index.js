"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const types_1 = require("../../../types");
const metadata = __importStar(require("./extension.json"));
class Mangakomi extends types_1.ReadableParser {
    constructor() {
        super(...arguments);
        this.metaData = metadata;
        this.baseUrl = metadata.code.utils.mainURL;
        this.apiURL = metadata.code.utils.apiURL;
        this.headers = { mode: "no-cors" };
    }
    search(query, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = new URLSearchParams();
            params.append("action", "wp-manga-search-manga");
            params.append("title", query);
            try {
                const { data } = yield this.client.request({
                    url: this.apiURL,
                    method: "POST",
                    headers: Object.assign({ "content-type": "application/x-www-form-urlencoded; charset=UTF-8" }, this.headers),
                    data: params,
                });
                const results = data.data.map((item) => ({
                    id: `manga/${item.url.split("/manga/")[1].replace("/", "")}`,
                    url: item.url,
                    title: item.title,
                }));
                return { results };
            }
            catch (error) {
                console.error(error);
                throw new Error(error.message);
            }
        });
    }
    getMediaInfo(mangaId, ...args) {
        if (!mangaId.includes("http"))
            mangaId = `${this.baseUrl}/${mangaId}`;
        throw new Error("Method not implemented.");
    }
    getChapterPages(chapterId, ...args) {
        throw new Error("Method not implemented.");
    }
}
exports.default = Mangakomi;
// (async () => {
//   const ext = new Mangakomi();
//   const search = await ext.search("One Piece");
//   console.log(search);
// })();
