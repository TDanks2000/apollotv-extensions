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
const types_1 = require("../../../types");
const utils_1 = require("../../../utils");
const crypto_js_1 = __importDefault(require("crypto-js"));
const metadata = __importStar(require("./extension.json"));
class Kickassanime extends types_1.MediaProvier {
    constructor() {
        super(...arguments);
        this.metaData = metadata;
        this.baseUrl = metadata.code.utils.mainURL;
        this.apiURL = metadata.code.utils.apiURL;
        this.isDubAvailableSeparately = true;
        this.headers = {
            "User-Agent": utils_1.USER_AGENT,
            "Content-type": "application/json",
            referer: `${this.baseUrl}/`,
            origin: this.baseUrl,
        };
        this.getImageUrl = (poster, type = "poster") => {
            var _a;
            try {
                return `${this.baseUrl}/image/${type}/${(_a = poster.hq) !== null && _a !== void 0 ? _a : poster.sm}.${poster.formats.includes("webp") ? "webp" : poster.formats[0]}`;
            }
            catch (err) {
                return "";
            }
        };
    }
    search(query, page = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            const searchResult = {
                currentPage: page,
                hasNextPage: false,
                results: [],
            };
            try {
                const { data } = yield this.client.request({
                    method: "POST",
                    url: `${this.baseUrl}/api/search`,
                    headers: this.headers,
                    data: JSON.stringify({
                        query,
                    }),
                });
                data.forEach((item) => {
                    searchResult.results.push({
                        id: item.slug,
                        url: `${this.baseUrl}/${item.slug}`,
                        title: item.title,
                        image: this.getImageUrl(item.poster),
                        releaseDate: item.year.toString(),
                    });
                });
            }
            catch (error) {
                console.error(error);
            }
            return searchResult;
        });
    }
    getMediaInfo(id, subOrDub = types_1.SubOrDub.SUB) {
        return __awaiter(this, void 0, void 0, function* () {
            const animeInfo = {
                id: "",
                title: "",
                url: `${this.baseUrl}${id}`,
                genres: [],
                episodes: [],
            };
            try {
                const { data } = yield this.client
                    .get(`${this.baseUrl}/api/show/${id}`, {
                    headers: this.headers,
                })
                    .catch((err) => {
                    throw new Error(err);
                });
                animeInfo.id = data.slug;
                animeInfo.url = `${this.baseUrl}/${data.slug}`;
                animeInfo.title = data.title;
                animeInfo.genres = data.genres;
                animeInfo.episodeDuration = data.episode_duration;
                animeInfo.cover = this.getImageUrl(data.banner, "banner");
                animeInfo.image = this.getImageUrl(data.poster);
                animeInfo.releaseDate = data.year.toString();
                animeInfo.description = data.synopsis.split("\n").join("");
                animeInfo.season = data.season;
                const episodeBase = (subOrDub) => `${this.baseUrl}/api/show/${id}/episodes?lang=${subOrDub === "sub" ? "ja-JP" : "en-US"}`;
                const { data: episodeData } = yield this.client.get(episodeBase(subOrDub));
                if (episodeData.pages.length) {
                    animeInfo.episodes = yield this.loadAllEps(episodeData, episodeBase(subOrDub));
                }
            }
            catch (error) {
                throw new Error(error.message);
            }
            return animeInfo;
        });
    }
    getMediaSources(episodeId, showId, server = "bird") {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const servers = yield this.getMediaServers(showId, episodeId);
                const serverItem = servers.find((item) => item.name.toLowerCase() === server) || servers[0];
                if (!serverItem)
                    throw new Error("Server not found");
                const name = serverItem.name.toLowerCase();
                const url = new URL(serverItem.url);
                const isBirb = name === "bird";
                const usesMid = name === "duck";
                let { data: order } = yield this.client.get("https://raw.githubusercontent.com/enimax-anime/gogo/main/KAA.json");
                order = order[name];
                const { data: playerHTML } = yield this.client.get(url.toString(), {
                    headers: {
                        "User-Agent": utils_1.USER_AGENT,
                    },
                });
                const cid = playerHTML.split("cid:")[1].split("'")[1].trim();
                const metaData = crypto_js_1.default.enc.Hex.parse(cid).toString(crypto_js_1.default.enc.Utf8);
                const sigArray = [];
                let key = "";
                try {
                    const res = yield this.client.get(`https://raw.githubusercontent.com/enimax-anime/kaas/${name}/key.txt`);
                    if (res.status === 404) {
                        throw new Error("Not found");
                    }
                    else {
                        key = yield res.data;
                    }
                }
                catch (err) {
                    const { data: duckKey } = yield this.client.get(`https://raw.githubusercontent.com/enimax-anime/kaas/duck/key.txt`);
                    key = duckKey;
                }
                const signatureItems = {
                    SIG: playerHTML.split("signature:")[1].split("'")[1].trim(),
                    USERAGENT: utils_1.USER_AGENT,
                    IP: metaData.split("|")[0],
                    ROUTE: metaData.split("|")[1].replace("player.php", "source.php"),
                    KEY: key,
                    TIMESTAMP: Math.floor(Date.now() / 1000),
                    MID: url.searchParams.get(usesMid ? "mid" : "id"),
                };
                for (const item of order) {
                    sigArray.push(signatureItems[item]);
                }
                const sig = crypto_js_1.default.SHA1(sigArray.join("")).toString(crypto_js_1.default.enc.Hex);
                let { data: result } = yield this.client.get(`${url.origin}${signatureItems.ROUTE}?${!usesMid ? "id" : "mid"}=${signatureItems.MID}${isBirb ? "" : "&e=" + signatureItems.TIMESTAMP}&s=${sig}`, {
                    headers: {
                        referer: `${url.origin}${signatureItems.ROUTE.replace("source.php", "player.php")}?${!usesMid ? "id" : "mid"}=${signatureItems.MID}`,
                        "User-Agent": utils_1.USER_AGENT,
                    },
                });
                result = result.data;
                const finalResult = JSON.parse(crypto_js_1.default.AES.decrypt(result.split(":")[0], crypto_js_1.default.enc.Utf8.parse(signatureItems.KEY), {
                    mode: crypto_js_1.default.mode.CBC,
                    iv: crypto_js_1.default.enc.Hex.parse(result.split(":")[1]),
                    keySize: 256,
                }).toString(crypto_js_1.default.enc.Utf8));
                let hlsURL = "", dashURL = "";
                if (finalResult.hls) {
                    hlsURL = finalResult.hls.startsWith("//") ? `https:${finalResult.hls}` : finalResult.hls;
                    const hasSubtitles = ((_a = finalResult.subtitles) === null || _a === void 0 ? void 0 : _a.length) > 0;
                    return {
                        sources: [
                            {
                                type: "HLS",
                                name: "HLS",
                                url: hlsURL,
                            },
                        ],
                        subtitles: !hasSubtitles
                            ? []
                            : finalResult.subtitles.map((sub) => ({
                                label: `${sub.name} - ${serverItem.name}`,
                                file: sub.src.startsWith("//") ? `https:${sub.src}` : new URL(sub.src, url).href,
                            })),
                        intro: {
                            start: (_c = (_b = finalResult.skip) === null || _b === void 0 ? void 0 : _b.intro) === null || _c === void 0 ? void 0 : _c.start,
                            end: (_e = (_d = finalResult.skip) === null || _d === void 0 ? void 0 : _d.intro) === null || _e === void 0 ? void 0 : _e.end,
                        },
                    };
                }
                if (finalResult.dash) {
                    dashURL = finalResult.dash.startsWith("//")
                        ? `https:${finalResult.dash}`
                        : finalResult.dash;
                    const hasSubtitles = ((_f = finalResult.subtitles) === null || _f === void 0 ? void 0 : _f.length) > 0;
                    return {
                        sources: [
                            {
                                type: "dash",
                                name: "DASH",
                                url: dashURL,
                            },
                        ],
                        subtitles: !hasSubtitles
                            ? []
                            : finalResult.subtitles.map((sub) => ({
                                label: `${sub.name} - ${serverItem.name}`,
                                file: sub.src.startsWith("//") ? `https:${sub.src}` : new URL(sub.src, url).href,
                            })),
                        intro: {
                            start: (_h = (_g = finalResult.skip) === null || _g === void 0 ? void 0 : _g.intro) === null || _h === void 0 ? void 0 : _h.start,
                            end: (_k = (_j = finalResult.skip) === null || _j === void 0 ? void 0 : _j.intro) === null || _k === void 0 ? void 0 : _k.end,
                        },
                    };
                }
                throw new Error("No sources found");
            }
            catch (error) {
                console.error(error);
                throw new Error(error.message);
            }
        });
    }
    getMediaServers(showId, episodeId) {
        var _a, e_1, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this.client.get(`${this.apiURL}/show/${showId}/episode/${episodeId}`, {
                    headers: {
                        "User-Agent": utils_1.USER_AGENT,
                    },
                });
                const servers = [];
                try {
                    for (var _d = true, _e = __asyncValues(data.servers), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                        _c = _f.value;
                        _d = false;
                        const server = _c;
                        servers.push({
                            name: server.shortName,
                            url: server.src,
                        });
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return servers;
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    }
    loadAllEps(episode, url) {
        var _a, e_2, _b, _c, _d, e_3, _e, _f, _g, e_4, _h, _j;
        return __awaiter(this, void 0, void 0, function* () {
            const returnData = [];
            const promises = [];
            try {
                try {
                    for (var _k = true, _l = __asyncValues(episode.result), _m; _m = yield _l.next(), _a = _m.done, !_a; _k = true) {
                        _c = _m.value;
                        _k = false;
                        const item = _c;
                        returnData.push(this.formatEpisode(item));
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (!_k && !_a && (_b = _l.return)) yield _b.call(_l);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                if (episode.pages.length === 0)
                    return returnData;
                for (let i = 0; i < episode.pages.length; i++) {
                    if (i === 0)
                        continue;
                    promises.push(this.client.get(`${url}&page=${episode.pages[i].number}`));
                }
                const results = yield Promise.all(promises);
                try {
                    for (var _o = true, results_1 = __asyncValues(results), results_1_1; results_1_1 = yield results_1.next(), _d = results_1_1.done, !_d; _o = true) {
                        _f = results_1_1.value;
                        _o = false;
                        const result = _f;
                        const { data } = result;
                        try {
                            for (var _p = true, _q = (e_4 = void 0, __asyncValues(data.result)), _r; _r = yield _q.next(), _g = _r.done, !_g; _p = true) {
                                _j = _r.value;
                                _p = false;
                                const item = _j;
                                returnData.push(this.formatEpisode(item));
                            }
                        }
                        catch (e_4_1) { e_4 = { error: e_4_1 }; }
                        finally {
                            try {
                                if (!_p && !_g && (_h = _q.return)) yield _h.call(_q);
                            }
                            finally { if (e_4) throw e_4.error; }
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (!_o && !_d && (_e = results_1.return)) yield _e.call(results_1);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
            catch (error) {
                throw new Error(error.message);
            }
            return returnData;
        });
    }
    formatEpisode(episode) {
        return {
            id: `ep-${episode.episode_number}-${episode.slug}`,
            title: episode.title,
            number: episode.episode_number,
            image: this.getImageUrl(episode.thumbnail),
            duration: episode.duration_ms,
        };
    }
}
exports.default = Kickassanime;
/**
 * THANK YOU ENIMAX FOR FIGURING MOST OF THIS OUT
 */
