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
class FlameScans extends types_1.ReadableParser {
    constructor() {
        super(...arguments);
        this.metaData = metadata;
        this.baseUrl = metadata.code.utils.mainURL;
        this.apiURL = metadata.code.utils.apiURL;
    }
    search(query, page = 1, perPage = 20) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this.client.get(`${this.baseUrl}/series/?title=${query.replace(/ /g, "%20")}`);
                const $ = (0, cheerio_1.load)(data);
                const searchMangaSelector = ".utao .uta .imgu, .listupd .bs .bsx, .listo .bs .bsx";
                const results = $(searchMangaSelector)
                    .map((i, el) => {
                    var _a, _b, _c;
                    return ({
                        id: (_b = (_a = $(el).find("a").attr("href")) === null || _a === void 0 ? void 0 : _a.split("/series/")[1].replace("/", "")) !== null && _b !== void 0 ? _b : "",
                        title: (_c = $(el).find("a").attr("title")) !== null && _c !== void 0 ? _c : "",
                        image: $(el).find("img").attr("src"),
                    });
                })
                    .get();
                return {
                    results: results,
                };
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
    getMediaInfo(mangaId, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const mangaInfo = {
                id: mangaId,
                title: "",
            };
            try {
                const { data } = yield this.client.get(`${this.baseUrl}/manga/${mangaId}`);
                const $ = (0, cheerio_1.load)(data);
                const seriesTitleSelector = "h1.entry-title";
                const seriesArtistSelector = ".infotable tr:icontains('artist') td:last-child, .tsinfo .imptdt:icontains('artist') i, .fmed b:icontains('artist')+span, span:icontains('artist')";
                const seriesAuthorSelector = ".infotable tr:icontains('author') td:last-child, .tsinfo .imptdt:icontains('author') i, .fmed b:icontains('author')+span, span:icontains('author')";
                const seriesDescriptionSelector = ".desc, .entry-content[itemprop=description]";
                const seriesAltNameSelector = ".alternative > div, .wd-full:icontains('alt') span, .alter, .seriestualt";
                const seriesGenreSelector = "div.gnr a, .mgen a, .seriestugenre a";
                const seriesStatusSelector = ".infotable tr:icontains('status') td:last-child, .tsinfo .imptdt:icontains('status') i, .fmed b:icontains('status')+span span:icontains('status')";
                const seriesThumbnailSelector = ".infomanga > div[itemprop=image] img, .thumb img";
                const seriesChaptersSelector = "div.bxcl li, div.cl li, #chapterlist li, ul li:has(div.chbox):has(div.eph-num)";
                mangaInfo.title = $(seriesTitleSelector).text().trim();
                mangaInfo.altTitles = $(seriesAltNameSelector).text()
                    ? $(seriesAltNameSelector)
                        .first()
                        .text()
                        .split("|")
                        .map((item) => item.replace(/\n/g, " ").trim())
                    : [];
                mangaInfo.description = $(seriesDescriptionSelector).text().trim();
                mangaInfo.headerForImage = { Referer: this.baseUrl };
                mangaInfo.image = $(seriesThumbnailSelector).attr("src");
                mangaInfo.genres = $(seriesGenreSelector)
                    .map((i, el) => $(el).text())
                    .get();
                switch ($(seriesStatusSelector).text().trim()) {
                    case "Completed":
                        mangaInfo.status = types_1.MediaStatus.COMPLETED;
                        break;
                    case "Ongoing":
                        mangaInfo.status = types_1.MediaStatus.ONGOING;
                        break;
                    case "Dropped":
                        mangaInfo.status = types_1.MediaStatus.CANCELLED;
                        break;
                    default:
                        mangaInfo.status = types_1.MediaStatus.UNKNOWN;
                        break;
                }
                mangaInfo.authors = $(seriesAuthorSelector).text().replace("-", "").trim()
                    ? $(seriesAuthorSelector)
                        .text()
                        .split(",")
                        .map((item) => item.trim())
                    : [];
                mangaInfo.artist = $(seriesArtistSelector).text().trim()
                    ? $(seriesArtistSelector).text().trim()
                    : "N/A";
                mangaInfo.chapters = $(seriesChaptersSelector)
                    .map((i, el) => {
                    var _a, _b;
                    return ({
                        id: (_b = (_a = $(el).find("a").attr("href")) === null || _a === void 0 ? void 0 : _a.split("/")[3]) !== null && _b !== void 0 ? _b : "",
                        title: $(el).find(".lch a, .chapternum").text().trim().replace(/\n/g, " "),
                        releasedDate: $(el).find(".chapterdate").text(),
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
    getChapterPages(chapterId, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this.client.get(`${this.baseUrl}/${chapterId}`);
                const $ = (0, cheerio_1.load)(data);
                const pageSelector = "div#readerarea img, #readerarea div.figure_container div.composed_figure";
                const pages = $(pageSelector)
                    .map((i, el) => ({
                    img: $(el).attr("src"),
                    page: i,
                    headerForImage: { Referer: this.baseUrl },
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
exports.default = FlameScans;
// (async () => {
//   const ext = new FlameScans();
//   const search = await ext.search("One Piece");
//   const data = await ext.getMediaInfo(search.results[0].id);
//   console.log(data);
// })();
