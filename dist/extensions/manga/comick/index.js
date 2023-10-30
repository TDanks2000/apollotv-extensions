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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../../../types");
const metadata = __importStar(require("./extension.json"));
const utils_1 = require("../../../utils");
class ComicK extends types_1.ReadableParser {
    constructor() {
        super(...arguments);
        this.metaData = metadata;
        this.baseUrl = metadata.code.utils.mainURL;
        this.apiURL = metadata.code.utils.apiURL;
        this.getAllChapters = (mangaId, page, lang = "en") => __awaiter(this, void 0, void 0, function* () {
            if (page <= 0) {
                page = 1;
            }
            const comicId = yield this.getComicId(mangaId);
            const req = yield this._axios().get(`/comic/${comicId}/chapters?page=${page}&lang=${lang}`);
            return req.data.chapters;
        });
    }
    _axios() {
        return axios_1.default.create({
            baseURL: this.apiURL,
            headers: {
                "User-Agent": utils_1.USER_AGENT,
            },
        });
    }
    search(query, page = 1, perPage = 20) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (page < 1)
                throw new Error("Page number must be greater than 1");
            if (perPage > 300)
                throw new Error("Limit must be less than or equal to 300");
            if (perPage * (page - 1) >= 10000)
                throw new Error("not enough results");
            try {
                const req = yield this._axios().get(`/v1.0/search?q=${encodeURIComponent(query)}&limit=${perPage}&page=${page}`);
                const results = {
                    currentPage: page,
                    results: [],
                };
                const data = yield req.data;
                for (const manga of data) {
                    let cover = manga.md_covers ? manga.md_covers[0] : null;
                    if (cover && cover.b2key != undefined) {
                        cover = `https://meo.comick.pictures${cover.b2key}`;
                    }
                    results.results.push({
                        id: manga.slug,
                        title: (_a = manga.title) !== null && _a !== void 0 ? _a : manga.slug,
                        altTitles: manga.md_titles ? manga.md_titles.map((title) => title.title) : [],
                        image: cover,
                    });
                }
                return results;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
    getMediaInfo(mangaId, ...args) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const req = yield this._axios().get(`/comic/${mangaId}`);
                const data = req.data.comic;
                const links = Object.values((_a = data.links) !== null && _a !== void 0 ? _a : []).filter((link) => link !== null);
                const mangaInfo = {
                    id: data.hid,
                    title: data.title,
                    altTitles: data.md_titles ? data.md_titles.map((title) => title.title) : [],
                    description: data.desc,
                    genres: (_b = data.md_comic_md_genres) === null || _b === void 0 ? void 0 : _b.map((genre) => genre.md_genres.name),
                    status: ((_c = data.status) !== null && _c !== void 0 ? _c : 0 === 0) ? types_1.MediaStatus.ONGOING : types_1.MediaStatus.COMPLETED,
                    image: `https://meo.comick.pictures${data.md_covers ? data.md_covers[0].b2key : ""}`,
                    malId: (_d = data.links) === null || _d === void 0 ? void 0 : _d.mal,
                    links: links,
                    chapters: [],
                };
                const allChapters = yield this.getAllChapters(mangaId, 1);
                for (const chapter of allChapters) {
                    (_e = mangaInfo.chapters) === null || _e === void 0 ? void 0 : _e.push({
                        id: chapter.hid,
                        title: (_f = chapter.title) !== null && _f !== void 0 ? _f : chapter.chap,
                        chapterNumber: chapter.chap,
                        volumeNumber: chapter.vol,
                        releaseDate: chapter.created_at,
                    });
                }
                return mangaInfo;
            }
            catch (err) {
                if (err.code == "ERR_BAD_REQUEST")
                    throw new Error(`[${this.metaData.name}] Bad request. Make sure you have entered a valid query.`);
                throw new Error(err.message);
            }
        });
    }
    getChapterPages(chapterId, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this._axios().get(`/chapter/${chapterId}`);
                const pages = [];
                data.chapter.md_images.map((image, index) => {
                    pages.push({
                        img: `https://meo.comick.pictures/${image.b2key}?width=${image.w}`,
                        page: index,
                    });
                });
                return pages;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
    /**
     * @description Fetches the comic HID from the slug
     * @param id Comic slug
     * @returns Promise<string> empty if not found
     */
    getComicId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const req = yield this._axios().get(`/comic/${id}`);
            const data = req.data["comic"];
            return data ? data.hid : "";
        });
    }
}
exports.default = ComicK;
