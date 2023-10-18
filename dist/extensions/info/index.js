"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const anilist_1 = __importDefault(require("./anilist"));
const manga_1 = require("./anilist/manga");
exports.default = { Anilist: anilist_1.default, AnilistManga: manga_1.AnilistManga };
