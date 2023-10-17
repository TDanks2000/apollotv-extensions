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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../../../types");
const metadata = __importStar(require("./extension.json"));
const decrypt_1 = require("./helpers/decrypt");
const extractors_1 = require("../../../extractors");
var AllAnimeServer;
(function (AllAnimeServer) {
    AllAnimeServer["AllAnime"] = "AllAnime";
})(AllAnimeServer || (AllAnimeServer = {}));
class AllAnime extends types_1.MediaProvier {
    constructor() {
        super(...arguments);
        this.metaData = metadata;
        this.baseUrl = metadata.code.utils.mainURL;
        this.apiURL = metadata.code.utils.apiURL;
        this.ytAnimeCoversHost = "https://wp.youtube-anime.com/aln.youtube-anime.com";
        this.idRegex = RegExp("${hostUrl}/manga/(\\w+)");
        this.epNumRegex = RegExp("/[sd]ub/(\\d+)");
        this.idHash = "9d7439c90f203e534ca778c4901f9aa2d3ad42c06243ab2c5e6b79612af32028";
        this.episodeInfoHash = "c8f3ac51f598e630a1d09d7f7fb6924cff23277f354a23e473b962a367880f7d";
        this.searchHash = "06327bc10dd682e1ee7e07b6db9c16e9ad2fd56c1b769e47513128cd5c9fc77a";
        this.videoServerHash = "5f1a64b73793cc2234a389cf3a8f93ad82de7043017dd551f38f65b89daa65e0";
    }
    search(query, page = 1, ...args) {
        var _a, e_1, _b, _c;
        var _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            const searchResult = {
                currentPage: page,
                hasNextPage: false,
                results: [],
            };
            const variables = `{"search":{"query":"${query}"},"translationType":"sub"}`;
            try {
                const data = yield this.graphqlQuery(variables, this.searchHash);
                const edges = (_e = (_d = data === null || data === void 0 ? void 0 : data.data) === null || _d === void 0 ? void 0 : _d.shows) === null || _e === void 0 ? void 0 : _e.edges;
                if (!edges)
                    return searchResult;
                try {
                    for (var _g = true, edges_1 = __asyncValues(edges), edges_1_1; edges_1_1 = yield edges_1.next(), _a = edges_1_1.done, !_a; _g = true) {
                        _c = edges_1_1.value;
                        _g = false;
                        const item = _c;
                        searchResult.results.push({
                            id: item._id,
                            title: {
                                english: item.englishName,
                                native: item.nativeName,
                                romaji: item.name,
                                userPreferred: item.name,
                            },
                            image: item.thumbnail,
                            rating: item.score,
                            releaseDate: (_f = item.airedStart.year) === null || _f === void 0 ? void 0 : _f.toString(),
                            type: item.type,
                        });
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_g && !_a && (_b = edges_1.return)) yield _b.call(edges_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return searchResult;
            }
            catch (error) {
                throw new Error(`AllAnime Search Error: ${error.message}`);
            }
        });
    }
    getMediaInfo(animeId, dub = false, ...args) {
        var _a, e_2, _b, _c;
        var _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        return __awaiter(this, void 0, void 0, function* () {
            const variables = `{"_id":"${animeId}"}`;
            const animeInfo = {
                id: animeId,
                title: "",
                url: `${this.baseUrl}${animeId}`,
                genres: [],
                totalEpisodes: 0,
            };
            try {
                const data = yield this.graphqlQuery(variables, this.idHash);
                const anime = (_d = data === null || data === void 0 ? void 0 : data.data) === null || _d === void 0 ? void 0 : _d.show;
                animeInfo.title = {
                    english: anime === null || anime === void 0 ? void 0 : anime.englishName,
                    native: anime === null || anime === void 0 ? void 0 : anime.nativeName,
                    romaji: anime === null || anime === void 0 ? void 0 : anime.name,
                    userPreferred: anime === null || anime === void 0 ? void 0 : anime.name,
                };
                animeInfo.url = `${this.baseUrl}/${animeId}`;
                animeInfo.genres = anime === null || anime === void 0 ? void 0 : anime.genres;
                animeInfo.totalEpisodes = parseInt(anime === null || anime === void 0 ? void 0 : anime.episodeCount);
                animeInfo.image = anime === null || anime === void 0 ? void 0 : anime.thumbnail;
                animeInfo.cover = anime === null || anime === void 0 ? void 0 : anime.banner;
                animeInfo.rating = anime === null || anime === void 0 ? void 0 : anime.score;
                animeInfo.releaseDate = (_f = (_e = anime === null || anime === void 0 ? void 0 : anime.airedStart) === null || _e === void 0 ? void 0 : _e.year) === null || _f === void 0 ? void 0 : _f.toString();
                animeInfo.type = anime === null || anime === void 0 ? void 0 : anime.type;
                animeInfo.description = anime === null || anime === void 0 ? void 0 : anime.description;
                switch (anime === null || anime === void 0 ? void 0 : anime.status) {
                    case "Ongoing":
                        animeInfo.status = types_1.MediaStatus.ONGOING;
                        break;
                    case "Completed":
                        animeInfo.status = types_1.MediaStatus.COMPLETED;
                        break;
                    case "Upcoming":
                        animeInfo.status = types_1.MediaStatus.NOT_YET_AIRED;
                        break;
                    default:
                        animeInfo.status = types_1.MediaStatus.UNKNOWN;
                        break;
                }
                animeInfo.endDate = anime === null || anime === void 0 ? void 0 : anime.airedEnd;
                animeInfo.startDate = anime === null || anime === void 0 ? void 0 : anime.airedStart;
                const epCount = dub === true ? anime === null || anime === void 0 ? void 0 : anime.availableEpisodes.dub : anime === null || anime === void 0 ? void 0 : anime.availableEpisodes.sub;
                const episodeVars = `{"showId":"${animeId}","episodeNumStart":0,"episodeNumEnd":${epCount}}`;
                const episodeInfo = yield this.graphqlQuery(episodeVars, this.episodeInfoHash);
                animeInfo.episodes = [];
                if (((_h = (_g = episodeInfo === null || episodeInfo === void 0 ? void 0 : episodeInfo.data) === null || _g === void 0 ? void 0 : _g.episodeInfos) === null || _h === void 0 ? void 0 : _h.length) >= 0) {
                    animeInfo.hasDub = ((_j = episodeInfo === null || episodeInfo === void 0 ? void 0 : episodeInfo.data) === null || _j === void 0 ? void 0 : _j.episodeInfos[0].vidInforsdub) !== null;
                    animeInfo.hasSub = ((_k = episodeInfo === null || episodeInfo === void 0 ? void 0 : episodeInfo.data) === null || _k === void 0 ? void 0 : _k.episodeInfos[0].vidInforssub) !== null;
                    try {
                        for (var _t = true, _u = __asyncValues((_l = episodeInfo === null || episodeInfo === void 0 ? void 0 : episodeInfo.data) === null || _l === void 0 ? void 0 : _l.episodeInfos), _v; _v = yield _u.next(), _a = _v.done, !_a; _t = true) {
                            _c = _v.value;
                            _t = false;
                            const episode = _c;
                            const images = (_m = episode.thumbnails) === null || _m === void 0 ? void 0 : _m.map((image) => !(image === null || image === void 0 ? void 0 : image.includes("http")) ? `${this.ytAnimeCoversHost}${image}` : image);
                            (_o = animeInfo.episodes) === null || _o === void 0 ? void 0 : _o.push({
                                id: `${animeId}/${episode.episodeIdNum}`,
                                title: episode.notes,
                                number: episode.episodeIdNum,
                                image: images[0],
                                releaseDate: dub === true
                                    ? (_q = (_p = episode.uploadDates) === null || _p === void 0 ? void 0 : _p.dub) === null || _q === void 0 ? void 0 : _q.toString()
                                    : (_s = (_r = episode.uploadDates) === null || _r === void 0 ? void 0 : _r.sub) === null || _s === void 0 ? void 0 : _s.toString(),
                                hasDub: episode.vidInforsdub !== null,
                                haSDub: episode.vidInforssub !== null,
                            });
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (!_t && !_a && (_b = _u.return)) yield _b.call(_u);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
                return animeInfo;
            }
            catch (error) {
                throw new Error(`AllAnime Info Error: ${error.message}`);
            }
        });
    }
    getMediaSources(episodeId, server = "default", dub = false) {
        var _a, e_3, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (!episodeId || !episodeId.includes("/"))
                throw new Error(`Please provide a valid episode ID in the format "<animeId>/<episodeNumber>."`);
            try {
                const servers = yield this.getMediaServers(episodeId, dub);
                let urls;
                switch (server) {
                    case types_1.StreamingServers.Mp4Upload:
                        urls = servers.find((server) => server.name.toLowerCase().includes("mp4upload")).url;
                        return {
                            sources: yield new extractors_1.Mp4Upload().extract(new URL(urls)),
                        };
                    case types_1.StreamingServers.streamlare:
                        urls = servers.find((server) => server.name.toLowerCase().includes("streamlare")).url;
                        const resp = yield new extractors_1.StreamLare().extract(new URL(urls));
                        if (!resp)
                            throw new Error("No source avaliable");
                        return resp;
                    default:
                        urls = servers.filter((server) => server.url.startsWith("--"));
                        const toReturn = {
                            sources: [],
                        };
                        try {
                            for (var _d = true, urls_1 = __asyncValues(urls), urls_1_1; urls_1_1 = yield urls_1.next(), _a = urls_1_1.done, !_a; _d = true) {
                                _c = urls_1_1.value;
                                _d = false;
                                const url = _c;
                                if (url.url.startsWith("--")) {
                                    url.url = decrypt_1.AllAnimeDecryptor.oneDigitSymmetricXOR(56, url.url.replace("--", ""));
                                }
                                if (url.url.startsWith("/")) {
                                    try {
                                        const { data } = yield axios_1.default.get(this.to_clock_json(`https://blog.allanime.day${url.url}`));
                                        data.links.forEach((link) => {
                                            toReturn.sources.push({
                                                url: link.link,
                                                isM3U8: (link === null || link === void 0 ? void 0 : link.hls) === true,
                                                isDASH: (link === null || link === void 0 ? void 0 : link.dash) === true,
                                                quality: link === null || link === void 0 ? void 0 : link.resolutionStr,
                                            });
                                        });
                                    }
                                    catch (error) {
                                        continue;
                                    }
                                }
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (!_d && !_a && (_b = urls_1.return)) yield _b.call(urls_1);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                        return toReturn;
                }
            }
            catch (error) {
                console.error(error);
                throw new Error(`AllAnime Sources Error: ${error.message}`);
            }
        });
    }
    getMediaServers(episodeId, dub = false) {
        var _a, e_4, _b, _c;
        var _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            if (!episodeId.includes("/"))
                throw new Error(`Please provide a valid episode ID in the format "<animeId>/<episodeNumber>."`);
            const videoServers = [];
            const animeId = episodeId.split("/")[0];
            const episodeNumber = episodeId.split("/")[1];
            const variables = `{"showId":"${animeId}","translationType":"${dub === true ? "dub" : "sub"}","episodeString":"${episodeNumber}"}`;
            try {
                const data = yield this.graphqlQuery(variables, this.videoServerHash);
                const sources = (_e = (_d = data === null || data === void 0 ? void 0 : data.data) === null || _d === void 0 ? void 0 : _d.episode) === null || _e === void 0 ? void 0 : _e.sourceUrls;
                if (!sources)
                    return [];
                try {
                    for (var _f = true, sources_1 = __asyncValues(sources), sources_1_1; sources_1_1 = yield sources_1.next(), _a = sources_1_1.done, !_a; _f = true) {
                        _c = sources_1_1.value;
                        _f = false;
                        const source = _c;
                        let serverName = source.sourceName;
                        let sourceNum = 2;
                        while (videoServers.some((server) => server.name === serverName)) {
                            serverName = `${source.sourceName} (${sourceNum})`;
                            sourceNum++;
                        }
                        videoServers.push({
                            name: serverName,
                            url: source.sourceUrl,
                            type: source.type,
                        });
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (!_f && !_a && (_b = sources_1.return)) yield _b.call(sources_1);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
                return videoServers;
            }
            catch (error) {
                throw new Error(`Error parsing Servers: ${error.message}`);
            }
        });
    }
    to_clock_json(url) {
        return url.replace("clock", "clock.json");
    }
    graphqlQuery(variables, persistHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const extensions = `{"persistedQuery":{"version":1,"sha256Hash":"${persistHash}"}}`;
            const url = `${this.apiURL}?variables=${variables}&extensions=${extensions}`;
            const headers = {
                Origin: "https://allanime.to",
            };
            try {
                const response = yield axios_1.default.get(url, {
                    headers,
                });
                return response.data;
            }
            catch (error) {
                throw new Error(`Error making GraphQL query:, ${error.message}`);
            }
        });
    }
}
exports.default = AllAnime;
