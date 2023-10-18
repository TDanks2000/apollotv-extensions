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
const mangasee123_1 = __importDefault(require("../../manga/mangasee123"));
const queries_1 = require("./queries");
const metadata = __importStar(require("./extension.json"));
class AnilistManga extends types_1.ReadableParser {
    constructor(provider) {
        super();
        this.metaData = metadata;
        this.baseUrl = metadata.code.utils.mainURL;
        this.anilistGraphqlUrl = metadata.code.utils.apiURL;
        this.animapped_api_url = metadata.code.utils.animappedApiRrl;
        this.kitsuGraphqlUrl = metadata.code.utils.kitsuGraphqlUrl;
        this.search = (query, page = 1, perPage = 20) => __awaiter(this, void 0, void 0, function* () {
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistSearchQuery)(query, page, perPage, "MANGA"),
            };
            try {
                const { data } = yield axios_1.default.post(this.anilistGraphqlUrl, options);
                const res = {
                    currentPage: data.data.Page.pageInfo.currentPage,
                    hasNextPage: data.data.Page.pageInfo.hasNextPage,
                    results: data.data.Page.media.map((item) => {
                        var _a, _b, _c, _d, _e, _f;
                        return ({
                            id: item.id.toString(),
                            malId: item.idMal,
                            title: {
                                romaji: item.title.romaji,
                                english: item.title.english,
                                native: item.title.native,
                                userPreferred: item.title.userPreferred,
                            } || item.title.romaji,
                            status: item.status == "RELEASING"
                                ? types_1.MediaStatus.ONGOING
                                : item.status == "FINISHED"
                                    ? types_1.MediaStatus.COMPLETED
                                    : item.status == "NOT_YET_RELEASED"
                                        ? types_1.MediaStatus.NOT_YET_AIRED
                                        : item.status == "CANCELLED"
                                            ? types_1.MediaStatus.CANCELLED
                                            : item.status == "HIATUS"
                                                ? types_1.MediaStatus.HIATUS
                                                : types_1.MediaStatus.UNKNOWN,
                            image: (_d = (_b = (_a = item.coverImage) === null || _a === void 0 ? void 0 : _a.extraLarge) !== null && _b !== void 0 ? _b : (_c = item.coverImage) === null || _c === void 0 ? void 0 : _c.large) !== null && _d !== void 0 ? _d : (_e = item.coverImage) === null || _e === void 0 ? void 0 : _e.medium,
                            cover: item.bannerImage,
                            popularity: item.popularity,
                            description: item.description,
                            rating: item.averageScore,
                            genres: item.genres,
                            color: (_f = item.coverImage) === null || _f === void 0 ? void 0 : _f.color,
                            totalChapters: item.chapters,
                            volumes: item.volumes,
                            type: item.format,
                            releaseDate: item.seasonYear,
                        });
                    }),
                };
                return res;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
        this.getChapterPages = (chapterId, ...args) => {
            return this.provider.getChapterPages(chapterId, ...args);
        };
        this.findMangaSlug = (provider, title, malId) => __awaiter(this, void 0, void 0, function* () {
            const slug = title.replace(/[^0-9a-zA-Z]+/g, " ");
            let possibleManga;
            if (!malId) {
                possibleManga = yield this.findMangaRaw(provider, slug, title);
            }
            const malAsyncReq = yield this.client.get(`https://raw.githubusercontent.com/bal-mackup/mal-backup/master/mal/manga/${malId}.json`, {
                validateStatus: () => true,
            });
            if (malAsyncReq.status !== 200) {
                possibleManga = yield this.findMangaRaw(provider, slug, title);
            }
            const sitesT = malAsyncReq.data.Sites;
            let sites = Object.values(sitesT).map((v, i) => {
                const obj = [...Object.values(Object.values(sitesT)[i])];
                const pages = obj.map((v) => ({ page: v.page, url: v.url, title: v.title }));
                return pages;
            });
            sites = sites.flat();
            const possibleSource = sites.find((s) => s.page.toLowerCase() === provider.metaData.name.toLowerCase());
            if (possibleSource) {
                possibleManga = yield provider.getMediaInfo(possibleSource.url.split("/").pop());
            }
            else {
                possibleManga = yield this.findMangaRaw(provider, slug, title);
            }
            const possibleProviderChapters = possibleManga.chapters;
            return possibleProviderChapters;
        });
        this.findMangaRaw = (provider, slug, title) => __awaiter(this, void 0, void 0, function* () {
            const findAnime = (yield provider.search(slug));
            if (findAnime.results.length === 0)
                return [];
            // TODO: use much better way than this
            const possibleManga = findAnime.results.find((manga) => title.toLowerCase() == (typeof manga.title === "string" ? manga.title.toLowerCase() : ""));
            if (!possibleManga) {
                return (yield provider.getMediaInfo(findAnime.results[0].id));
            }
            return (yield provider.getMediaInfo(possibleManga.id));
        });
        this.findManga = (provider, title, malId) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            title.english = (_a = title.english) !== null && _a !== void 0 ? _a : title.romaji;
            title.romaji = (_b = title.romaji) !== null && _b !== void 0 ? _b : title.english;
            title.english = title.english.toLowerCase();
            title.romaji = title.romaji.toLowerCase();
            if (title.english === title.romaji)
                return yield this.findMangaSlug(provider, title.english, malId);
            const romajiPossibleEpisodes = this.findMangaSlug(provider, title.romaji, malId);
            if (romajiPossibleEpisodes) {
                return romajiPossibleEpisodes;
            }
            const englishPossibleEpisodes = this.findMangaSlug(provider, title.english, malId);
            return englishPossibleEpisodes;
        });
        this.provider = provider || new mangasee123_1.default();
    }
    getMediaInfo(mangaId, ...args) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __awaiter(this, void 0, void 0, function* () {
            const mangaInfo = {
                id: mangaId,
                title: "",
            };
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistMediaDetailQuery)(mangaId, "MANGA"),
            };
            try {
                const { data } = yield axios_1.default.post(this.anilistGraphqlUrl, options).catch((err) => {
                    throw new Error("Media not found");
                });
                mangaInfo.malId = data.data.Media.idMal;
                mangaInfo.title = {
                    romaji: data.data.Media.title.romaji,
                    english: data.data.Media.title.english,
                    native: data.data.Media.title.native,
                    userPreferred: data.data.Media.title.userPreferred,
                };
                if ((_a = data.data.Media.trailer) === null || _a === void 0 ? void 0 : _a.id) {
                    mangaInfo.trailer = {
                        id: data.data.Media.trailer.id,
                        site: (_b = data.data.Media.trailer) === null || _b === void 0 ? void 0 : _b.site,
                        thumbnail: (_c = data.data.Media.trailer) === null || _c === void 0 ? void 0 : _c.thumbnail,
                    };
                }
                mangaInfo.image =
                    (_e = (_d = data.data.Media.coverImage.extraLarge) !== null && _d !== void 0 ? _d : data.data.Media.coverImage.large) !== null && _e !== void 0 ? _e : data.data.Media.coverImage.medium;
                mangaInfo.popularity = data.data.Media.popularity;
                mangaInfo.color = (_f = data.data.Media.coverImage) === null || _f === void 0 ? void 0 : _f.color;
                mangaInfo.cover = (_g = data.data.Media.bannerImage) !== null && _g !== void 0 ? _g : mangaInfo.image;
                mangaInfo.description = data.data.Media.description;
                switch (data.data.Media.status) {
                    case "RELEASING":
                        mangaInfo.status = types_1.MediaStatus.ONGOING;
                        break;
                    case "FINISHED":
                        mangaInfo.status = types_1.MediaStatus.COMPLETED;
                        break;
                    case "NOT_YET_RELEASED":
                        mangaInfo.status = types_1.MediaStatus.NOT_YET_AIRED;
                        break;
                    case "CANCELLED":
                        mangaInfo.status = types_1.MediaStatus.CANCELLED;
                        break;
                    case "HIATUS":
                        mangaInfo.status = types_1.MediaStatus.HIATUS;
                    default:
                        mangaInfo.status = types_1.MediaStatus.UNKNOWN;
                }
                mangaInfo.releaseDate = data.data.Media.startDate.year;
                mangaInfo.startDate = {
                    year: data.data.Media.startDate.year,
                    month: data.data.Media.startDate.month,
                    day: data.data.Media.startDate.day,
                };
                mangaInfo.endDate = {
                    year: data.data.Media.endDate.year,
                    month: data.data.Media.endDate.month,
                    day: data.data.Media.endDate.day,
                };
                mangaInfo.rating = data.data.Media.averageScore;
                mangaInfo.genres = data.data.Media.genres;
                mangaInfo.season = data.data.Media.season;
                mangaInfo.studios = data.data.Media.studios.edges.map((item) => item.node.name);
                mangaInfo.type = data.data.Media.format;
                mangaInfo.recommendations = data.data.Media.recommendations.edges.map((item) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11;
                    return ({
                        id: (_a = item.node.mediaRecommendation) === null || _a === void 0 ? void 0 : _a.id,
                        malId: (_b = item.node.mediaRecommendation) === null || _b === void 0 ? void 0 : _b.idMal,
                        title: {
                            romaji: (_d = (_c = item.node.mediaRecommendation) === null || _c === void 0 ? void 0 : _c.title) === null || _d === void 0 ? void 0 : _d.romaji,
                            english: (_f = (_e = item.node.mediaRecommendation) === null || _e === void 0 ? void 0 : _e.title) === null || _f === void 0 ? void 0 : _f.english,
                            native: (_h = (_g = item.node.mediaRecommendation) === null || _g === void 0 ? void 0 : _g.title) === null || _h === void 0 ? void 0 : _h.native,
                            userPreferred: (_k = (_j = item.node.mediaRecommendation) === null || _j === void 0 ? void 0 : _j.title) === null || _k === void 0 ? void 0 : _k.userPreferred,
                        },
                        status: ((_l = item.node.mediaRecommendation) === null || _l === void 0 ? void 0 : _l.status) == "RELEASING"
                            ? types_1.MediaStatus.ONGOING
                            : ((_m = item.node.mediaRecommendation) === null || _m === void 0 ? void 0 : _m.status) == "FINISHED"
                                ? types_1.MediaStatus.COMPLETED
                                : ((_o = item.node.mediaRecommendation) === null || _o === void 0 ? void 0 : _o.status) == "NOT_YET_RELEASED"
                                    ? types_1.MediaStatus.NOT_YET_AIRED
                                    : ((_p = item.node.mediaRecommendation) === null || _p === void 0 ? void 0 : _p.status) == "CANCELLED"
                                        ? types_1.MediaStatus.CANCELLED
                                        : ((_q = item.node.mediaRecommendation) === null || _q === void 0 ? void 0 : _q.status) == "HIATUS"
                                            ? types_1.MediaStatus.HIATUS
                                            : types_1.MediaStatus.UNKNOWN,
                        chapters: (_r = item.node.mediaRecommendation) === null || _r === void 0 ? void 0 : _r.chapters,
                        image: (_x = (_u = (_t = (_s = item.node.mediaRecommendation) === null || _s === void 0 ? void 0 : _s.coverImage) === null || _t === void 0 ? void 0 : _t.extraLarge) !== null && _u !== void 0 ? _u : (_w = (_v = item.node.mediaRecommendation) === null || _v === void 0 ? void 0 : _v.coverImage) === null || _w === void 0 ? void 0 : _w.large) !== null && _x !== void 0 ? _x : (_z = (_y = item.node.mediaRecommendation) === null || _y === void 0 ? void 0 : _y.coverImage) === null || _z === void 0 ? void 0 : _z.medium,
                        cover: (_7 = (_4 = (_1 = (_0 = item.node.mediaRecommendation) === null || _0 === void 0 ? void 0 : _0.bannerImage) !== null && _1 !== void 0 ? _1 : (_3 = (_2 = item.node.mediaRecommendation) === null || _2 === void 0 ? void 0 : _2.coverImage) === null || _3 === void 0 ? void 0 : _3.extraLarge) !== null && _4 !== void 0 ? _4 : (_6 = (_5 = item.node.mediaRecommendation) === null || _5 === void 0 ? void 0 : _5.coverImage) === null || _6 === void 0 ? void 0 : _6.large) !== null && _7 !== void 0 ? _7 : (_9 = (_8 = item.node.mediaRecommendation) === null || _8 === void 0 ? void 0 : _8.coverImage) === null || _9 === void 0 ? void 0 : _9.medium,
                        rating: (_10 = item.node.mediaRecommendation) === null || _10 === void 0 ? void 0 : _10.meanScore,
                        type: (_11 = item.node.mediaRecommendation) === null || _11 === void 0 ? void 0 : _11.format,
                    });
                });
                mangaInfo.characters = data.data.Media.characters.edges.map((item) => {
                    var _a, _b;
                    return ({
                        id: (_a = item.node) === null || _a === void 0 ? void 0 : _a.id,
                        role: item.role,
                        name: {
                            first: item.node.name.first,
                            last: item.node.name.last,
                            full: item.node.name.full,
                            native: item.node.name.native,
                            userPreferred: item.node.name.userPreferred,
                        },
                        image: (_b = item.node.image.large) !== null && _b !== void 0 ? _b : item.node.image.medium,
                    });
                });
                mangaInfo.relations = data.data.Media.relations.edges.map((item) => {
                    var _a, _b, _c, _d, _e, _f;
                    return ({
                        id: item.node.id,
                        relationType: item.relationType,
                        malId: item.node.idMal,
                        title: {
                            romaji: item.node.title.romaji,
                            english: item.node.title.english,
                            native: item.node.title.native,
                            userPreferred: item.node.title.userPreferred,
                        },
                        status: item.node.status == "RELEASING"
                            ? types_1.MediaStatus.ONGOING
                            : item.node.status == "FINISHED"
                                ? types_1.MediaStatus.COMPLETED
                                : item.node.status == "NOT_YET_RELEASED"
                                    ? types_1.MediaStatus.NOT_YET_AIRED
                                    : item.node.status == "CANCELLED"
                                        ? types_1.MediaStatus.CANCELLED
                                        : item.node.status == "HIATUS"
                                            ? types_1.MediaStatus.HIATUS
                                            : types_1.MediaStatus.UNKNOWN,
                        chapters: item.node.chapters,
                        image: (_b = (_a = item.node.coverImage.extraLarge) !== null && _a !== void 0 ? _a : item.node.coverImage.large) !== null && _b !== void 0 ? _b : item.node.coverImage.medium,
                        color: (_c = item.node.coverImage) === null || _c === void 0 ? void 0 : _c.color,
                        type: item.node.format,
                        cover: (_f = (_e = (_d = item.node.bannerImage) !== null && _d !== void 0 ? _d : item.node.coverImage.extraLarge) !== null && _e !== void 0 ? _e : item.node.coverImage.large) !== null && _f !== void 0 ? _f : item.node.coverImage.medium,
                        rating: item.node.meanScore,
                    });
                });
                mangaInfo.chapters = yield this.findManga(this.provider, { english: mangaInfo.title.english, romaji: mangaInfo.title.romaji }, mangaInfo.malId);
                mangaInfo.chapters = (_j = (_h = mangaInfo === null || mangaInfo === void 0 ? void 0 : mangaInfo.chapters) === null || _h === void 0 ? void 0 : _h.reverse()) !== null && _j !== void 0 ? _j : [];
                return mangaInfo;
            }
            catch (error) {
                throw Error(error.message);
            }
        });
    }
}
exports.default = AnilistManga;
