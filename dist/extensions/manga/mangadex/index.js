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
const ascii_url_encoder_1 = require("ascii-url-encoder");
const utils_1 = require("../../../utils");
class MangaDex extends types_1.ReadableParser {
    constructor() {
        super(...arguments);
        this.metaData = metadata;
        this.baseUrl = metadata.code.utils.mainURL;
        this.apiURL = metadata.code.utils.apiURL;
        this.getAllChapters = (mangaId, offset, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (((_a = res === null || res === void 0 ? void 0 : res.data) === null || _a === void 0 ? void 0 : _a.offset) + 96 >= ((_b = res === null || res === void 0 ? void 0 : res.data) === null || _b === void 0 ? void 0 : _b.total)) {
                return [];
            }
            const response = yield this.client.get(`${this.apiURL}/manga/${mangaId}/feed?offset=${offset}&limit=96&order[volume]=desc&order[chapter]=desc&translatedLanguage[]=en`);
            return [...response.data.data, ...(yield this.getAllChapters(mangaId, offset + 96, response))];
        });
        this.getCoverImage = (coverId) => __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.client.get(`${this.apiURL}/cover/${coverId}`);
            const fileName = data.data.attributes.fileName;
            return fileName;
        });
    }
    search(query, page = 1, perPage = 20) {
        return __awaiter(this, void 0, void 0, function* () {
            if (page <= 0)
                throw new Error("Page number must be greater than 0");
            if (perPage > 100)
                throw new Error("Limit must be less than or equal to 100");
            if (perPage * (page - 1) >= 10000)
                throw new Error("not enough results");
            try {
                const res = yield this.client.get(`${this.apiURL}/manga?limit=${perPage}&title=${(0, ascii_url_encoder_1.encode)(query)}&limit=${perPage}&offset=${perPage * (page - 1)}&order[relevance]=desc`);
                if (res.data.result == "ok") {
                    const results = {
                        currentPage: page,
                        results: [],
                    };
                    for (const manga of res.data.data) {
                        results.results.push({
                            id: manga.id,
                            title: Object.values(manga.attributes.title)[0],
                            altTitles: manga.attributes.altTitles,
                            description: Object.values(manga.attributes.description)[0],
                            status: manga.attributes.status,
                            releaseDate: manga.attributes.year,
                            contentRating: manga.attributes.contentRating,
                            lastVolume: manga.attributes.lastVolume,
                            lastChapter: manga.attributes.lastChapter,
                        });
                    }
                    return results;
                }
                else {
                    throw new Error(res.data.message);
                }
            }
            catch (err) {
                if (err.code == "ERR_BAD_REQUEST") {
                    throw new Error("Bad request. Make sure you have entered a valid query.");
                }
                throw new Error(err.message);
            }
        });
    }
    getMediaInfo(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this.client.get(`${this.apiURL}/manga/${mangaId}`);
                const mangaInfo = {
                    id: data.data.id,
                    title: data.data.attributes.title.en,
                    altTitles: data.data.attributes.altTitles,
                    description: data.data.attributes.description,
                    genres: data.data.attributes.tags
                        .filter((tag) => tag.attributes.group === "genre")
                        .map((tag) => tag.attributes.name.en),
                    themes: data.data.attributes.tags
                        .filter((tag) => tag.attributes.group === "theme")
                        .map((tag) => tag.attributes.name.en),
                    status: (0, utils_1.capitalizeFirstLetter)(data.data.attributes.status),
                    releaseDate: data.data.attributes.year,
                    chapters: [],
                };
                const allChapters = yield this.getAllChapters(mangaId, 0);
                for (const chapter of allChapters) {
                    (_a = mangaInfo.chapters) === null || _a === void 0 ? void 0 : _a.push({
                        id: chapter.id,
                        title: chapter.attributes.title ? chapter.attributes.title : chapter.attributes.chapter,
                        chapterNumber: chapter.attributes.chapter,
                        volumeNumber: chapter.attributes.volume,
                        pages: chapter.attributes.pages,
                    });
                }
                const findCoverArt = data.data.relationships.find((rel) => rel.type === "cover_art");
                const coverArt = yield this.getCoverImage(findCoverArt === null || findCoverArt === void 0 ? void 0 : findCoverArt.id);
                mangaInfo.image = `${this.baseUrl}/covers/${mangaInfo.id}/${coverArt}`;
                return mangaInfo;
            }
            catch (err) {
                if (err.code == "ERR_BAD_REQUEST")
                    throw new Error(`[${this.metaData.name}] Bad request. Make sure you have entered a valid query.`);
                throw new Error(err.message);
            }
        });
    }
    getChapterPages(chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield this.client.get(`${this.apiURL}/at-home/server/${chapterId}`);
                const pages = [];
                for (const id of res.data.chapter.data) {
                    pages.push({
                        img: `${res.data.baseUrl}/data/${res.data.chapter.hash}/${id}`,
                        page: parseInt((0, utils_1.substringBefore)(id, "-").replace(/[^0-9.]/g, "")),
                    });
                }
                return pages;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
}
exports.default = MangaDex;
// (async () => {
//   const ext = new MangaDex();
//   const search = await ext.search("One Piece");
//   const data = await ext.getMediaInfo(search.results[0].id);
//   console.log(data);
// })();
