"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INFO = exports.MANGA = exports.MOVIE = exports.ANIME = void 0;
const anime_1 = __importDefault(require("./anime"));
exports.ANIME = anime_1.default;
const movie_1 = __importDefault(require("./movie"));
exports.MOVIE = movie_1.default;
const manga_1 = __importDefault(require("./manga"));
exports.MANGA = manga_1.default;
const info_1 = __importDefault(require("./info"));
exports.INFO = info_1.default;
