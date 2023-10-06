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
const cheerio_1 = require("cheerio");
const types_1 = require("../../../types");
const metadata = __importStar(require("./extension.json"));
class MangaPill extends types_1.ReadableParser {
    constructor() {
        super(...arguments);
        this.metaData = metadata;
        this.baseUrl = metadata.code.utils.mainURL;
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this.client.get(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
                const $ = (0, cheerio_1.load)(data);
                const results = $("div.container div.my-3.justify-end > div")
                    .map((i, el) => {
                    var _a;
                    return ({
                        id: (_a = $(el).find("a").attr("href")) === null || _a === void 0 ? void 0 : _a.split("/manga/")[1],
                        title: $(el).find("div > a > div").text().trim(),
                        image: $(el).find("a img").attr("data-src"),
                    });
                })
                    .get();
                return {
                    results: results,
                };
            }
            catch (err) {
                //   console.log(err);
                throw new Error(err.message);
            }
        });
    }
    getMediaInfo(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const mangaInfo = {
                id: mangaId,
                title: "",
            };
            try {
                const { data } = yield this.client.get(`${this.baseUrl}/manga/${mangaId}`);
                const $ = (0, cheerio_1.load)(data);
                mangaInfo.title = $("div.container div.my-3 div.flex-col div.mb-3 h1").text().trim();
                mangaInfo.description = $("div.container div.my-3  div.flex-col p.text--secondary")
                    .text()
                    .split("\n")
                    .join(" ");
                mangaInfo.releaseDate = $('div.container div.my-3 div.flex-col div.gap-3.mb-3 div:contains("Year")')
                    .text()
                    .split("Year\n")[1]
                    .trim();
                mangaInfo.genres = $('div.container div.my-3 div.flex-col div.mb-3:contains("Genres")')
                    .text()
                    .split("\n")
                    .filter((genre) => genre !== "Genres" && genre !== "")
                    .map((genre) => genre.trim());
                mangaInfo.chapters = $("div.container div.border-border div#chapters div.grid-cols-1 a")
                    .map((i, el) => {
                    var _a;
                    return ({
                        id: (_a = $(el).attr("href")) === null || _a === void 0 ? void 0 : _a.split("/chapters/")[1],
                        title: $(el).text().trim(),
                        chapter: $(el).text().split("Chapter ")[1],
                    });
                })
                    .get();
                return mangaInfo;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
    getChapterPages(chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this.client.get(`${this.baseUrl}/chapters/${chapterId}`);
                const $ = (0, cheerio_1.load)(data);
                const chapterSelector = $("chapter-page");
                const pages = chapterSelector
                    .map((i, el) => ({
                    img: $(el).find("div picture img").attr("data-src"),
                    page: parseFloat($(el).find(`div[data-summary] > div`).text().split("page ")[1]),
                }))
                    .get();
                return pages;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
}
exports.default = MangaPill;
