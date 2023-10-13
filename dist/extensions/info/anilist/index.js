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
const gogoanime_1 = __importDefault(require("../../anime/gogoanime"));
const utils_1 = require("../../../utils");
const queries_1 = require("./queries");
const metadata = __importStar(require("./extension.json"));
const manga_1 = require("./manga");
/**
 * Most of this code is from @consumet i have just modifed it a little
 * Its not intended for public use on use on my app (@ApolloTV)
 */
class Anilist extends types_1.MediaProvier {
    constructor(provider, animapped_api_key) {
        super();
        this.metaData = metadata;
        this.baseUrl = metadata.code.utils.mainURL;
        this.anilistGraphqlUrl = metadata.code.utils.apiURL;
        this.animapped_api_url = metadata.code.utils.animappedApiRrl;
        this.kitsuGraphqlUrl = metadata.code.utils.kitsuGraphqlUrl;
        this.fetchDefaultEpisodeList = (Media, dub, id) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            let episodes = [];
            episodes = yield this.findAnime({ english: (_a = Media.title) === null || _a === void 0 ? void 0 : _a.english, romaji: (_b = Media.title) === null || _b === void 0 ? void 0 : _b.romaji }, Media.season, Media.startDate.year, Media.idMal, dub, id, Media.externalLinks);
            return episodes;
        });
        this.findAnime = (title, season, startDate, malId, dub, anilistId, externalLinks) => __awaiter(this, void 0, void 0, function* () {
            var _c, _d, _e;
            title.english = (_c = title.english) !== null && _c !== void 0 ? _c : title.romaji;
            title.romaji = (_d = title.romaji) !== null && _d !== void 0 ? _d : title.english;
            title.english = title.english.toLowerCase();
            title.romaji = title.romaji.toLowerCase();
            if (title.english === title.romaji) {
                return ((_e = (yield this.findAnimeSlug(title.english, season, startDate, malId, dub, anilistId, externalLinks))) !== null && _e !== void 0 ? _e : []);
            }
            const romajiPossibleEpisodes = yield this.findAnimeSlug(title.romaji, season, startDate, malId, dub, anilistId, externalLinks);
            if (romajiPossibleEpisodes) {
                return romajiPossibleEpisodes;
            }
            const englishPossibleEpisodes = yield this.findAnimeSlug(title.english, season, startDate, malId, dub, anilistId, externalLinks);
            return englishPossibleEpisodes !== null && englishPossibleEpisodes !== void 0 ? englishPossibleEpisodes : [];
        });
        this.findAnimeSlug = (title, season, startDate, malId, dub, anilistId, externalLinks) => __awaiter(this, void 0, void 0, function* () {
            var _f, _g, _h;
            const slug = title.replace(/[^0-9a-zA-Z]+/g, " ");
            let possibleAnime;
            let possibleSource = yield this.findMappingId(malId, dub);
            if (!possibleSource)
                possibleAnime = yield this.findAnimeRaw(slug);
            if (!possibleSource && !possibleAnime)
                return [];
            try {
                possibleAnime = yield this.provider.getMediaInfo(possibleSource);
            }
            catch (err) {
                console.error(err);
                possibleAnime = yield this.findAnimeRaw(slug);
            }
            if (!possibleAnime)
                return undefined;
            // To avoid a new request, lets match and see if the anime show found is in sub/dub
            const expectedType = dub ? types_1.SubOrDubOrBoth.DUB : types_1.SubOrDubOrBoth.SUB;
            // Have this as a fallback in the meantime for compatibility
            if (possibleAnime.subOrDub) {
                if (possibleAnime.subOrDub != types_1.SubOrDubOrBoth.BOTH && possibleAnime.subOrDub != expectedType) {
                    return undefined;
                }
            }
            else if (((!possibleAnime.hasDub && dub) || (!possibleAnime.hasSub && !dub)) &&
                !this.provider.metaData.name.toLowerCase().includes("animepahe")) {
                return undefined;
            }
            // if (this.provider instanceof Zoro) {
            //   // Set the correct episode sub/dub request type
            //   possibleAnime.episodes.forEach((_: any, index: number) => {
            //     if (possibleAnime.subOrDub === SubOrSub.BOTH) {
            //       possibleAnime.episodes[index].id = possibleAnime.episodes[index].id.replace(
            //         `$both`,
            //         dub ? '$dub' : '$sub'
            //       );
            //     }
            //   });
            // }
            // if (this.provider instanceof Crunchyroll) {
            //   const nestedEpisodes = Object.keys(possibleAnime.episodes)
            //     .filter((key: any) => key.toLowerCase().includes(dub ? 'dub' : 'sub'))
            //     .sort((first: any, second: any) => {
            //       return (
            //         (possibleAnime.episodes[first]?.[0].season_number ?? 0) -
            //         (possibleAnime.episodes[second]?.[0].season_number ?? 0)
            //       );
            //     })
            //     .map((key: any) => {
            //       const audio = key
            //         .replace(/[0-9]/g, '')
            //         .replace(/(^\w{1})|(\s+\w{1})/g, (letter: string) => letter.toUpperCase());
            //       possibleAnime.episodes[key].forEach((element: any) => (element.type = audio));
            //       return possibleAnime.episodes[key];
            //     });
            //   return nestedEpisodes.flat();
            // }
            // if (this.provider instanceof NineAnime) {
            //   possibleAnime.episodes.forEach((_: any, index: number) => {
            //     if (expectedType == SubOrSub.DUB) {
            //       possibleAnime.episodes[index].id = possibleAnime.episodes[index].dubId;
            //     }
            //     if (possibleAnime.episodes[index].dubId) {
            //       delete possibleAnime.episodes[index].dubId;
            //     }
            //   });
            //   possibleAnime.episodes = possibleAnime.episodes.filter((el: any) => el.id != undefined);
            // }
            const possibleProviderEpisodes = possibleAnime.episodes;
            if (typeof ((_f = possibleProviderEpisodes[0]) === null || _f === void 0 ? void 0 : _f.image) !== "undefined" &&
                typeof ((_g = possibleProviderEpisodes[0]) === null || _g === void 0 ? void 0 : _g.title) !== "undefined" &&
                typeof ((_h = possibleProviderEpisodes[0]) === null || _h === void 0 ? void 0 : _h.description) !== "undefined") {
                return possibleProviderEpisodes;
            }
            const options = {
                headers: { "Content-Type": "application/json" },
                query: (0, queries_1.kitsuSearchQuery)(slug),
            };
            const newEpisodeList = yield this.findKitsuAnime(possibleProviderEpisodes, options, season, startDate);
            return newEpisodeList;
        });
        this.findMappingId = (malId, dub) => __awaiter(this, void 0, void 0, function* () {
            var _j;
            if (!malId)
                return undefined;
            try {
                const { data } = yield axios_1.default.get(`https://raw.githubusercontent.com/bal-mackup/mal-backup/master/mal/anime/${malId.toString()}.json`);
                // find site in sites
                if (!data)
                    return undefined;
                const sitesT = data.Sites;
                let sites = Object.values(sitesT).map((v, i) => {
                    const obj = [...Object.values(Object.values(sitesT)[i])];
                    const pages = obj.map((v) => ({
                        page: v.page,
                        url: v.url,
                        title: v.title,
                    }));
                    return pages;
                });
                sites = sites.flat();
                sites.sort((a, b) => {
                    const targetTitle = data.title.toLowerCase();
                    const firstRating = (0, utils_1.compareTwoStrings)(targetTitle, a.title.toLowerCase());
                    const secondRating = (0, utils_1.compareTwoStrings)(targetTitle, b.title.toLowerCase());
                    // Sort in descending order
                    return secondRating - firstRating;
                });
                const possibleSource = sites.find((s) => {
                    if (s.page.toLowerCase() !== this.provider.metaData.name.toLowerCase())
                        return false;
                    if (this.provider instanceof gogoanime_1.default) {
                        return dub
                            ? s.title.toLowerCase().includes("dub")
                            : !s.title.toLowerCase().includes("dub");
                    }
                    else
                        return true;
                });
                if (possibleSource)
                    return possibleSource.url.split("/").pop();
                if (!this.animapped_api_key)
                    return undefined;
                const { data: animapped_data } = yield axios_1.default.get(`${this.animapped_api_url}/mal/${malId}?api_key=${this.animapped_api_key}`);
                const mappings = animapped_data === null || animapped_data === void 0 ? void 0 : animapped_data.mappings;
                if (!mappings)
                    return undefined;
                const findMappingSite = Object.entries(mappings).find(([key, v]) => {
                    return key === this.provider.metaData.name.toLowerCase();
                });
                if (!findMappingSite || findMappingSite === null)
                    return undefined;
                let findMapping;
                try {
                    findMapping = Object.entries(findMappingSite[1]).find(([key, v]) => {
                        if (this.provider instanceof gogoanime_1.default) {
                            return dub ? key.toLowerCase().includes("dub") : !key.toLowerCase().includes("dub");
                        }
                        else
                            return true;
                    });
                }
                catch (error) {
                    return undefined;
                }
                return ((_j = findMapping === null || findMapping === void 0 ? void 0 : findMapping[1]) === null || _j === void 0 ? void 0 : _j.id) || undefined;
            }
            catch (error) {
                throw new Error(`Anilist Mapping Error: ${error.message}`);
            }
        });
        this.findAnimeRaw = (slug, externalLinks) => __awaiter(this, void 0, void 0, function* () {
            const findAnime = (yield this.provider.search(slug));
            if (findAnime.results.length === 0)
                return undefined;
            // Sort the retrieved info for more accurate results.
            let topRating = 0;
            findAnime.results.sort((a, b) => {
                var _a, _b, _c, _d;
                const targetTitle = slug.toLowerCase();
                let firstTitle;
                let secondTitle;
                if (typeof a.title == "string")
                    firstTitle = a.title;
                else
                    firstTitle = (_b = (_a = a.title.english) !== null && _a !== void 0 ? _a : a.title.romaji) !== null && _b !== void 0 ? _b : "";
                if (typeof b.title == "string")
                    secondTitle = b.title;
                else
                    secondTitle = (_d = (_c = b.title.english) !== null && _c !== void 0 ? _c : b.title.romaji) !== null && _d !== void 0 ? _d : "";
                const firstRating = (0, utils_1.compareTwoStrings)(targetTitle, firstTitle.toLowerCase());
                const secondRating = (0, utils_1.compareTwoStrings)(targetTitle, secondTitle.toLowerCase());
                if (firstRating > topRating) {
                    topRating = firstRating;
                }
                if (secondRating > topRating) {
                    topRating = secondRating;
                }
                // Sort in descending order
                return secondRating - firstRating;
            });
            if (topRating >= 0.7) {
                return yield this.provider.getMediaInfo(findAnime.results[0].id);
            }
            return undefined;
        });
        this.findKitsuAnime = (possibleProviderEpisodes, options, season, startDate) => __awaiter(this, void 0, void 0, function* () {
            const kitsuEpisodes = yield this.client.post(this.kitsuGraphqlUrl, options);
            const episodesList = new Map();
            if (kitsuEpisodes === null || kitsuEpisodes === void 0 ? void 0 : kitsuEpisodes.data.data) {
                const { nodes } = kitsuEpisodes.data.data.searchAnimeByTitle;
                if (nodes) {
                    nodes.forEach((node) => {
                        var _a, _b;
                        if (node.season === season &&
                            node.startDate.trim().split("-")[0] === (startDate === null || startDate === void 0 ? void 0 : startDate.toString())) {
                            const episodes = node.episodes.nodes;
                            for (const episode of episodes) {
                                const i = episode === null || episode === void 0 ? void 0 : episode.number.toString().replace(/"/g, "");
                                let name = undefined;
                                let description = undefined;
                                let thumbnail = undefined;
                                if ((_a = episode === null || episode === void 0 ? void 0 : episode.description) === null || _a === void 0 ? void 0 : _a.en)
                                    description = episode === null || episode === void 0 ? void 0 : episode.description.en.toString().replace(/"/g, "").replace("\\n", "\n");
                                if (episode === null || episode === void 0 ? void 0 : episode.thumbnail)
                                    thumbnail = episode === null || episode === void 0 ? void 0 : episode.thumbnail.original.url.toString().replace(/"/g, "");
                                if (episode) {
                                    if ((_b = episode.titles) === null || _b === void 0 ? void 0 : _b.canonical)
                                        name = episode.titles.canonical.toString().replace(/"/g, "");
                                    episodesList.set(i, {
                                        episodeNum: episode === null || episode === void 0 ? void 0 : episode.number.toString().replace(/"/g, ""),
                                        title: name,
                                        description,
                                        createdAt: episode === null || episode === void 0 ? void 0 : episode.createdAt,
                                        thumbnail,
                                    });
                                    continue;
                                }
                                episodesList.set(i, {
                                    episodeNum: undefined,
                                    title: undefined,
                                    description: undefined,
                                    createdAt: undefined,
                                    thumbnail,
                                });
                            }
                        }
                    });
                }
            }
            const newEpisodeList = [];
            if ((possibleProviderEpisodes === null || possibleProviderEpisodes === void 0 ? void 0 : possibleProviderEpisodes.length) !== 0) {
                possibleProviderEpisodes === null || possibleProviderEpisodes === void 0 ? void 0 : possibleProviderEpisodes.forEach((ep, i) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                    const j = (i + 1).toString();
                    newEpisodeList.push({
                        id: ep.id,
                        title: (_c = (_a = ep.title) !== null && _a !== void 0 ? _a : (_b = episodesList.get(j)) === null || _b === void 0 ? void 0 : _b.title) !== null && _c !== void 0 ? _c : null,
                        image: (_f = (_d = ep.image) !== null && _d !== void 0 ? _d : (_e = episodesList.get(j)) === null || _e === void 0 ? void 0 : _e.thumbnail) !== null && _f !== void 0 ? _f : null,
                        number: ep.number,
                        createdAt: (_j = (_g = ep.createdAt) !== null && _g !== void 0 ? _g : (_h = episodesList.get(j)) === null || _h === void 0 ? void 0 : _h.createdAt) !== null && _j !== void 0 ? _j : null,
                        description: (_m = (_k = ep.description) !== null && _k !== void 0 ? _k : (_l = episodesList.get(j)) === null || _l === void 0 ? void 0 : _l.description) !== null && _m !== void 0 ? _m : null,
                        url: (_o = ep.url) !== null && _o !== void 0 ? _o : null,
                    });
                });
            }
            return newEpisodeList;
        });
        this.provider = provider || new gogoanime_1.default();
        this.animapped_api_key = animapped_api_key !== null && animapped_api_key !== void 0 ? animapped_api_key : "";
        this.Manga = new manga_1.AnilistManga();
    }
    search(query, page = 1, perPage = 15) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistSearchQuery)(query, page, perPage),
            };
            try {
                let { data, status } = yield axios_1.default.post(this.anilistGraphqlUrl, options, {
                    validateStatus: () => true,
                });
                const res = {
                    currentPage: (_c = (_b = (_a = data.data.Page) === null || _a === void 0 ? void 0 : _a.pageInfo) === null || _b === void 0 ? void 0 : _b.currentPage) !== null && _c !== void 0 ? _c : (_d = data.meta) === null || _d === void 0 ? void 0 : _d.currentPage,
                    hasNextPage: (_g = (_f = (_e = data.data.Page) === null || _e === void 0 ? void 0 : _e.pageInfo) === null || _f === void 0 ? void 0 : _f.hasNextPage) !== null && _g !== void 0 ? _g : ((_h = data.meta) === null || _h === void 0 ? void 0 : _h.currentPage) != ((_j = data.meta) === null || _j === void 0 ? void 0 : _j.lastPage),
                    results: (_o = (_m = (_l = (_k = data.data) === null || _k === void 0 ? void 0 : _k.Page) === null || _l === void 0 ? void 0 : _l.media) === null || _m === void 0 ? void 0 : _m.map((item) => {
                        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
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
                            totalEpisodes: (_g = item.episodes) !== null && _g !== void 0 ? _g : ((_h = item.nextAiringEpisode) === null || _h === void 0 ? void 0 : _h.episode) - 1,
                            currentEpisodeCount: (item === null || item === void 0 ? void 0 : item.nextAiringEpisode)
                                ? ((_j = item === null || item === void 0 ? void 0 : item.nextAiringEpisode) === null || _j === void 0 ? void 0 : _j.episode) - 1
                                : item.episodes,
                            type: item.format,
                            releaseDate: item.seasonYear,
                        });
                    })) !== null && _o !== void 0 ? _o : data.data.map((item) => {
                        var _a, _b;
                        return ({
                            id: item.anilistId.toString(),
                            malId: item.mappings["mal"],
                            title: item.title,
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
                            image: (_a = item.coverImage) !== null && _a !== void 0 ? _a : item.bannerImage,
                            cover: item.bannerImage,
                            popularity: item.popularity,
                            description: item.description,
                            rating: item.averageScore,
                            genres: item.genre,
                            color: item.color,
                            totalEpisodes: item.currentEpisode,
                            currentEpisodeCount: (item === null || item === void 0 ? void 0 : item.nextAiringEpisode)
                                ? ((_b = item === null || item === void 0 ? void 0 : item.nextAiringEpisode) === null || _b === void 0 ? void 0 : _b.episode) - 1
                                : item.currentEpisode,
                            type: item.format,
                            releaseDate: item.year,
                        });
                    }),
                };
                return res;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
    advancedSearch({ query, type = "ANIME", page = 1, perPage = 20, format, sort, genres, id, year, status, season, }) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistAdvancedQuery)(),
                variables: {
                    search: query,
                    type: type,
                    page: page,
                    size: perPage,
                    format: format,
                    sort: sort,
                    genres: genres,
                    id: id,
                    year: year ? `${year}%` : undefined,
                    status: status,
                    season: season,
                },
            };
            if (genres) {
                genres.forEach((genre) => {
                    if (!Object.values(types_1.Genres).includes(genre)) {
                        throw new Error(`genre ${genre} is not valid`);
                    }
                });
            }
            try {
                let { data, status } = yield axios_1.default.post(this.anilistGraphqlUrl, options, {
                    validateStatus: () => true,
                });
                if (status >= 500 && !query)
                    throw new Error("No results found");
                const res = {
                    currentPage: (_d = (_c = (_b = (_a = data.data) === null || _a === void 0 ? void 0 : _a.Page) === null || _b === void 0 ? void 0 : _b.pageInfo) === null || _c === void 0 ? void 0 : _c.currentPage) !== null && _d !== void 0 ? _d : (_e = data.meta) === null || _e === void 0 ? void 0 : _e.currentPage,
                    hasNextPage: (_j = (_h = (_g = (_f = data.data) === null || _f === void 0 ? void 0 : _f.Page) === null || _g === void 0 ? void 0 : _g.pageInfo) === null || _h === void 0 ? void 0 : _h.hasNextPage) !== null && _j !== void 0 ? _j : ((_k = data.meta) === null || _k === void 0 ? void 0 : _k.currentPage) != ((_l = data.meta) === null || _l === void 0 ? void 0 : _l.lastPage),
                    totalPages: (_p = (_o = (_m = data.data) === null || _m === void 0 ? void 0 : _m.Page) === null || _o === void 0 ? void 0 : _o.pageInfo) === null || _p === void 0 ? void 0 : _p.lastPage,
                    totalResults: (_s = (_r = (_q = data.data) === null || _q === void 0 ? void 0 : _q.Page) === null || _r === void 0 ? void 0 : _r.pageInfo) === null || _s === void 0 ? void 0 : _s.total,
                    results: [],
                };
                res.results.push(...((_w = (_v = (_u = (_t = data.data) === null || _t === void 0 ? void 0 : _t.Page) === null || _u === void 0 ? void 0 : _u.media) === null || _v === void 0 ? void 0 : _v.map((item) => {
                    var _a, _b, _c, _d, _e, _f, _g;
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
                        image: (_b = (_a = item.coverImage.extraLarge) !== null && _a !== void 0 ? _a : item.coverImage.large) !== null && _b !== void 0 ? _b : item.coverImage.medium,
                        cover: item.bannerImage,
                        popularity: item.popularity,
                        totalEpisodes: (_c = item.episodes) !== null && _c !== void 0 ? _c : ((_d = item.nextAiringEpisode) === null || _d === void 0 ? void 0 : _d.episode) - 1,
                        currentEpisode: (_f = ((_e = item.nextAiringEpisode) === null || _e === void 0 ? void 0 : _e.episode) - 1) !== null && _f !== void 0 ? _f : item.episodes,
                        countryOfOrigin: item.countryOfOrigin,
                        description: item.description,
                        genres: item.genres,
                        rating: item.averageScore,
                        color: (_g = item.coverImage) === null || _g === void 0 ? void 0 : _g.color,
                        type: item.format,
                        releaseDate: item.seasonYear,
                    });
                })) !== null && _w !== void 0 ? _w : (_x = data.data) === null || _x === void 0 ? void 0 : _x.map((item) => {
                    var _a;
                    return ({
                        id: item.anilistId.toString(),
                        malId: item.mappings["mal"],
                        title: item.title,
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
                        image: (_a = item.coverImage) !== null && _a !== void 0 ? _a : item.bannerImage,
                        cover: item.bannerImage,
                        popularity: item.popularity,
                        description: item.description,
                        rating: item.averageScore,
                        genres: item.genre,
                        color: item.color,
                        totalEpisodes: item.currentEpisode,
                        type: item.format,
                        releaseDate: item.year,
                    });
                })));
                return res;
            }
            catch (err) {
                throw new Error(err.message);
            }
        });
    }
    getMediaInfo(id, dub = false) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61, _62, _63, _64, _65, _66, _67, _68, _69, _70, _71, _72, _73, _74, _75, _76, _77, _78, _79, _80, _81, _82, _83, _84, _85, _86, _87, _88, _89, _90, _91, _92, _93, _94, _95, _96, _97, _98, _99, _100, _101, _102, _103;
        return __awaiter(this, void 0, void 0, function* () {
            const animeInfo = {
                id: id,
                title: "",
            };
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                query: (0, queries_1.anilistMediaDetailQuery)(id),
            };
            try {
                let { data, status } = yield axios_1.default.post(this.anilistGraphqlUrl, options, {
                    validateStatus: () => true,
                });
                if (status == 404)
                    throw new Error("Media not found. Perhaps the id is invalid or the anime is not in anilist");
                if (status == 429)
                    throw new Error("You have been ratelimited by anilist. Please try again later");
                if (status >= 500)
                    throw new Error("Anilist seems to be down. Please try again later");
                if (status != 200 && status < 429)
                    throw Error("Media not found. If the problem persists, please contact the developer");
                animeInfo.malId = (_c = (_b = (_a = data.data) === null || _a === void 0 ? void 0 : _a.Media) === null || _b === void 0 ? void 0 : _b.idMal) !== null && _c !== void 0 ? _c : (_d = data === null || data === void 0 ? void 0 : data.mappings) === null || _d === void 0 ? void 0 : _d.mal;
                animeInfo.title = ((_e = data === null || data === void 0 ? void 0 : data.data) === null || _e === void 0 ? void 0 : _e.Media)
                    ? {
                        romaji: (_f = data.data) === null || _f === void 0 ? void 0 : _f.Media.title.romaji,
                        english: (_g = data.data) === null || _g === void 0 ? void 0 : _g.Media.title.english,
                        native: (_h = data.data) === null || _h === void 0 ? void 0 : _h.Media.title.native,
                        userPreferred: (_j = data.data) === null || _j === void 0 ? void 0 : _j.Media.title.userPreferred,
                    }
                    : data.data.title;
                animeInfo.synonyms = (_m = (_l = (_k = data.data) === null || _k === void 0 ? void 0 : _k.Media) === null || _l === void 0 ? void 0 : _l.synonyms) !== null && _m !== void 0 ? _m : data === null || data === void 0 ? void 0 : data.synonyms;
                animeInfo.isLicensed = (_q = (_p = (_o = data.data) === null || _o === void 0 ? void 0 : _o.Media) === null || _p === void 0 ? void 0 : _p.isLicensed) !== null && _q !== void 0 ? _q : undefined;
                animeInfo.isAdult = (_t = (_s = (_r = data.data) === null || _r === void 0 ? void 0 : _r.Media) === null || _s === void 0 ? void 0 : _s.isAdult) !== null && _t !== void 0 ? _t : undefined;
                animeInfo.countryOfOrigin = (_w = (_v = (_u = data.data) === null || _u === void 0 ? void 0 : _u.Media) === null || _v === void 0 ? void 0 : _v.countryOfOrigin) !== null && _w !== void 0 ? _w : undefined;
                if ((_z = (_y = (_x = data.data) === null || _x === void 0 ? void 0 : _x.Media) === null || _y === void 0 ? void 0 : _y.trailer) === null || _z === void 0 ? void 0 : _z.id) {
                    animeInfo.trailer = {
                        id: (_0 = data.data) === null || _0 === void 0 ? void 0 : _0.Media.trailer.id,
                        site: (_2 = (_1 = data.data) === null || _1 === void 0 ? void 0 : _1.Media.trailer) === null || _2 === void 0 ? void 0 : _2.site,
                        thumbnail: (_4 = (_3 = data.data) === null || _3 === void 0 ? void 0 : _3.Media.trailer) === null || _4 === void 0 ? void 0 : _4.thumbnail,
                    };
                }
                animeInfo.image =
                    (_17 = (_16 = (_12 = (_8 = (_7 = (_6 = (_5 = data.data) === null || _5 === void 0 ? void 0 : _5.Media) === null || _6 === void 0 ? void 0 : _6.coverImage) === null || _7 === void 0 ? void 0 : _7.extraLarge) !== null && _8 !== void 0 ? _8 : (_11 = (_10 = (_9 = data.data) === null || _9 === void 0 ? void 0 : _9.Media) === null || _10 === void 0 ? void 0 : _10.coverImage) === null || _11 === void 0 ? void 0 : _11.large) !== null && _12 !== void 0 ? _12 : (_15 = (_14 = (_13 = data.data) === null || _13 === void 0 ? void 0 : _13.Media) === null || _14 === void 0 ? void 0 : _14.coverImage) === null || _15 === void 0 ? void 0 : _15.medium) !== null && _16 !== void 0 ? _16 : data === null || data === void 0 ? void 0 : data.coverImage) !== null && _17 !== void 0 ? _17 : data === null || data === void 0 ? void 0 : data.bannerImage;
                animeInfo.popularity = (_20 = (_19 = (_18 = data.data) === null || _18 === void 0 ? void 0 : _18.Media) === null || _19 === void 0 ? void 0 : _19.popularity) !== null && _20 !== void 0 ? _20 : data === null || data === void 0 ? void 0 : data.popularity;
                animeInfo.color = (_24 = (_23 = (_22 = (_21 = data.data) === null || _21 === void 0 ? void 0 : _21.Media) === null || _22 === void 0 ? void 0 : _22.coverImage) === null || _23 === void 0 ? void 0 : _23.color) !== null && _24 !== void 0 ? _24 : data === null || data === void 0 ? void 0 : data.color;
                animeInfo.cover = (_28 = (_27 = (_26 = (_25 = data.data) === null || _25 === void 0 ? void 0 : _25.Media) === null || _26 === void 0 ? void 0 : _26.bannerImage) !== null && _27 !== void 0 ? _27 : data === null || data === void 0 ? void 0 : data.bannerImage) !== null && _28 !== void 0 ? _28 : animeInfo.image;
                animeInfo.description = (_31 = (_30 = (_29 = data.data) === null || _29 === void 0 ? void 0 : _29.Media) === null || _30 === void 0 ? void 0 : _30.description) !== null && _31 !== void 0 ? _31 : data === null || data === void 0 ? void 0 : data.description;
                switch ((_34 = (_33 = (_32 = data.data) === null || _32 === void 0 ? void 0 : _32.Media) === null || _33 === void 0 ? void 0 : _33.status) !== null && _34 !== void 0 ? _34 : data === null || data === void 0 ? void 0 : data.status) {
                    case "RELEASING":
                        animeInfo.status = types_1.MediaStatus.ONGOING;
                        break;
                    case "FINISHED":
                        animeInfo.status = types_1.MediaStatus.COMPLETED;
                        break;
                    case "NOT_YET_RELEASED":
                        animeInfo.status = types_1.MediaStatus.NOT_YET_AIRED;
                        break;
                    case "CANCELLED":
                        animeInfo.status = types_1.MediaStatus.CANCELLED;
                        break;
                    case "HIATUS":
                        animeInfo.status = types_1.MediaStatus.HIATUS;
                    default:
                        animeInfo.status = types_1.MediaStatus.UNKNOWN;
                }
                animeInfo.releaseDate = (_38 = (_37 = (_36 = (_35 = data.data) === null || _35 === void 0 ? void 0 : _35.Media) === null || _36 === void 0 ? void 0 : _36.startDate) === null || _37 === void 0 ? void 0 : _37.year) !== null && _38 !== void 0 ? _38 : data.year;
                animeInfo.startDate = {
                    year: (_41 = (_40 = (_39 = data === null || data === void 0 ? void 0 : data.data) === null || _39 === void 0 ? void 0 : _39.Media) === null || _40 === void 0 ? void 0 : _40.startDate) === null || _41 === void 0 ? void 0 : _41.year,
                    month: (_44 = (_43 = (_42 = data === null || data === void 0 ? void 0 : data.data) === null || _42 === void 0 ? void 0 : _42.Media) === null || _43 === void 0 ? void 0 : _43.startDate) === null || _44 === void 0 ? void 0 : _44.month,
                    day: (_47 = (_46 = (_45 = data.data) === null || _45 === void 0 ? void 0 : _45.Media) === null || _46 === void 0 ? void 0 : _46.startDate) === null || _47 === void 0 ? void 0 : _47.day,
                };
                animeInfo.endDate = {
                    year: (_50 = (_49 = (_48 = data === null || data === void 0 ? void 0 : data.data) === null || _48 === void 0 ? void 0 : _48.Media) === null || _49 === void 0 ? void 0 : _49.endDate) === null || _50 === void 0 ? void 0 : _50.year,
                    month: (_53 = (_52 = (_51 = data === null || data === void 0 ? void 0 : data.data) === null || _51 === void 0 ? void 0 : _51.Media) === null || _52 === void 0 ? void 0 : _52.endDate) === null || _53 === void 0 ? void 0 : _53.month,
                    day: (_56 = (_55 = (_54 = data === null || data === void 0 ? void 0 : data.data) === null || _54 === void 0 ? void 0 : _54.Media) === null || _55 === void 0 ? void 0 : _55.endDate) === null || _56 === void 0 ? void 0 : _56.day,
                };
                if ((_58 = (_57 = data.data) === null || _57 === void 0 ? void 0 : _57.Media.nextAiringEpisode) === null || _58 === void 0 ? void 0 : _58.airingAt)
                    animeInfo.nextAiringEpisode = {
                        airingTime: (_60 = (_59 = data.data) === null || _59 === void 0 ? void 0 : _59.Media.nextAiringEpisode) === null || _60 === void 0 ? void 0 : _60.airingAt,
                        timeUntilAiring: (_62 = (_61 = data.data) === null || _61 === void 0 ? void 0 : _61.Media.nextAiringEpisode) === null || _62 === void 0 ? void 0 : _62.timeUntilAiring,
                        episode: (_64 = (_63 = data.data) === null || _63 === void 0 ? void 0 : _63.Media.nextAiringEpisode) === null || _64 === void 0 ? void 0 : _64.episode,
                    };
                animeInfo.totalEpisodes =
                    (_67 = (_66 = (_65 = data.data) === null || _65 === void 0 ? void 0 : _65.Media) === null || _66 === void 0 ? void 0 : _66.episodes) !== null && _67 !== void 0 ? _67 : ((_69 = (_68 = data.data) === null || _68 === void 0 ? void 0 : _68.Media.nextAiringEpisode) === null || _69 === void 0 ? void 0 : _69.episode) - 1;
                animeInfo.currentEpisode = ((_72 = (_71 = (_70 = data.data) === null || _70 === void 0 ? void 0 : _70.Media) === null || _71 === void 0 ? void 0 : _71.nextAiringEpisode) === null || _72 === void 0 ? void 0 : _72.episode)
                    ? ((_74 = (_73 = data.data) === null || _73 === void 0 ? void 0 : _73.Media.nextAiringEpisode) === null || _74 === void 0 ? void 0 : _74.episode) - 1
                    : (_76 = (_75 = data.data) === null || _75 === void 0 ? void 0 : _75.Media) === null || _76 === void 0 ? void 0 : _76.episodes;
                animeInfo.rating = (_77 = data.data) === null || _77 === void 0 ? void 0 : _77.Media.averageScore;
                animeInfo.duration = (_78 = data.data) === null || _78 === void 0 ? void 0 : _78.Media.duration;
                animeInfo.genres = (_79 = data.data) === null || _79 === void 0 ? void 0 : _79.Media.genres;
                animeInfo.season = (_80 = data.data) === null || _80 === void 0 ? void 0 : _80.Media.season;
                animeInfo.studios = (_81 = data.data) === null || _81 === void 0 ? void 0 : _81.Media.studios.edges.map((item) => item.node.name);
                animeInfo.subOrDub = dub ? types_1.SubOrDub.DUB : types_1.SubOrDub.SUB;
                animeInfo.type = (_82 = data.data) === null || _82 === void 0 ? void 0 : _82.Media.format;
                animeInfo.recommendations = (_86 = (_85 = (_84 = (_83 = data.data) === null || _83 === void 0 ? void 0 : _83.Media) === null || _84 === void 0 ? void 0 : _84.recommendations) === null || _85 === void 0 ? void 0 : _85.edges) === null || _86 === void 0 ? void 0 : _86.map((item) => {
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
                        episodes: (_r = item.node.mediaRecommendation) === null || _r === void 0 ? void 0 : _r.episodes,
                        image: (_x = (_u = (_t = (_s = item.node.mediaRecommendation) === null || _s === void 0 ? void 0 : _s.coverImage) === null || _t === void 0 ? void 0 : _t.extraLarge) !== null && _u !== void 0 ? _u : (_w = (_v = item.node.mediaRecommendation) === null || _v === void 0 ? void 0 : _v.coverImage) === null || _w === void 0 ? void 0 : _w.large) !== null && _x !== void 0 ? _x : (_z = (_y = item.node.mediaRecommendation) === null || _y === void 0 ? void 0 : _y.coverImage) === null || _z === void 0 ? void 0 : _z.medium,
                        cover: (_7 = (_4 = (_1 = (_0 = item.node.mediaRecommendation) === null || _0 === void 0 ? void 0 : _0.bannerImage) !== null && _1 !== void 0 ? _1 : (_3 = (_2 = item.node.mediaRecommendation) === null || _2 === void 0 ? void 0 : _2.coverImage) === null || _3 === void 0 ? void 0 : _3.extraLarge) !== null && _4 !== void 0 ? _4 : (_6 = (_5 = item.node.mediaRecommendation) === null || _5 === void 0 ? void 0 : _5.coverImage) === null || _6 === void 0 ? void 0 : _6.large) !== null && _7 !== void 0 ? _7 : (_9 = (_8 = item.node.mediaRecommendation) === null || _8 === void 0 ? void 0 : _8.coverImage) === null || _9 === void 0 ? void 0 : _9.medium,
                        rating: (_10 = item.node.mediaRecommendation) === null || _10 === void 0 ? void 0 : _10.meanScore,
                        type: (_11 = item.node.mediaRecommendation) === null || _11 === void 0 ? void 0 : _11.format,
                    });
                });
                animeInfo.characters = (_90 = (_89 = (_88 = (_87 = data.data) === null || _87 === void 0 ? void 0 : _87.Media) === null || _88 === void 0 ? void 0 : _88.characters) === null || _89 === void 0 ? void 0 : _89.edges) === null || _90 === void 0 ? void 0 : _90.map((item) => {
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
                        voiceActors: item.voiceActors.map((voiceActor) => {
                            var _a;
                            return ({
                                id: voiceActor.id,
                                language: voiceActor.languageV2,
                                name: {
                                    first: voiceActor.name.first,
                                    last: voiceActor.name.last,
                                    full: voiceActor.name.full,
                                    native: voiceActor.name.native,
                                    userPreferred: voiceActor.name.userPreferred,
                                },
                                image: (_a = voiceActor.image.large) !== null && _a !== void 0 ? _a : voiceActor.image.medium,
                            });
                        }),
                    });
                });
                animeInfo.relations = (_94 = (_93 = (_92 = (_91 = data.data) === null || _91 === void 0 ? void 0 : _91.Media) === null || _92 === void 0 ? void 0 : _92.relations) === null || _93 === void 0 ? void 0 : _93.edges) === null || _94 === void 0 ? void 0 : _94.map((item) => {
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
                        episodes: item.node.episodes,
                        image: (_b = (_a = item.node.coverImage.extraLarge) !== null && _a !== void 0 ? _a : item.node.coverImage.large) !== null && _b !== void 0 ? _b : item.node.coverImage.medium,
                        color: (_c = item.node.coverImage) === null || _c === void 0 ? void 0 : _c.color,
                        type: item.node.format,
                        cover: (_f = (_e = (_d = item.node.bannerImage) !== null && _d !== void 0 ? _d : item.node.coverImage.extraLarge) !== null && _e !== void 0 ? _e : item.node.coverImage.large) !== null && _f !== void 0 ? _f : item.node.coverImage.medium,
                        rating: item.node.meanScore,
                    });
                });
                if (this.provider instanceof gogoanime_1.default &&
                    !dub &&
                    (animeInfo.status === types_1.MediaStatus.ONGOING ||
                        (0, utils_1.range)({ from: 1940, to: new Date().getFullYear() + 1 }).includes(parseInt(animeInfo.releaseDate)))) {
                    try {
                        animeInfo.episodes = yield this.fetchDefaultEpisodeList({
                            idMal: animeInfo.malId,
                            season: data.data.Media.season,
                            startDate: { year: parseInt(animeInfo.releaseDate) },
                            title: { english: (_95 = animeInfo.title) === null || _95 === void 0 ? void 0 : _95.english, romaji: (_96 = animeInfo.title) === null || _96 === void 0 ? void 0 : _96.romaji },
                        }, dub, id);
                        animeInfo.episodes = (_97 = animeInfo.episodes) === null || _97 === void 0 ? void 0 : _97.map((episode) => {
                            if (!episode.image)
                                episode.image = animeInfo.image;
                            return episode;
                        });
                    }
                    catch (err) {
                        animeInfo.episodes = yield this.fetchDefaultEpisodeList({
                            idMal: animeInfo.malId,
                            season: data.data.Media.season,
                            startDate: { year: parseInt(animeInfo.releaseDate) },
                            title: { english: (_98 = animeInfo.title) === null || _98 === void 0 ? void 0 : _98.english, romaji: (_99 = animeInfo.title) === null || _99 === void 0 ? void 0 : _99.romaji },
                        }, dub, id);
                        animeInfo.episodes = (_100 = animeInfo.episodes) === null || _100 === void 0 ? void 0 : _100.map((episode) => {
                            if (!episode.image)
                                episode.image = animeInfo.image;
                            return episode;
                        });
                        return animeInfo;
                    }
                }
                else
                    animeInfo.episodes = yield this.fetchDefaultEpisodeList({
                        idMal: animeInfo.malId,
                        season: data.data.Media.season,
                        startDate: { year: parseInt(animeInfo.releaseDate) },
                        title: { english: (_101 = animeInfo.title) === null || _101 === void 0 ? void 0 : _101.english, romaji: (_102 = animeInfo.title) === null || _102 === void 0 ? void 0 : _102.romaji },
                        externalLinks: data.data.Media.externalLinks.filter((link) => link.type === "STREAMING"),
                    }, dub, id);
                animeInfo.episodes = (_103 = animeInfo.episodes) === null || _103 === void 0 ? void 0 : _103.map((episode) => {
                    if (!episode.image)
                        episode.image = animeInfo.image;
                    return episode;
                });
                return animeInfo;
            }
            catch (error) {
                console.error(error);
                throw new Error(`Anilist Error: ${error.message}`);
            }
        });
    }
    getMediaSources(episodeId, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return this.provider.getMediaSources(episodeId, ...args);
            }
            catch (error) {
                throw new Error(`Failed to fetch episode sources from ${this.provider.metaData.name}: ${error}`);
            }
        });
    }
    getMediaServers(episodeId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return this.provider.getMediaServers(episodeId);
            }
            catch (err) {
                throw new Error(`Failed to fetch episode servers from ${this.provider.metaData.name}: ${err}`);
            }
        });
    }
}
exports.default = Anilist;
