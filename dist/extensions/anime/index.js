"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gogoanime_1 = __importDefault(require("./gogoanime"));
const animepahe_1 = __importDefault(require("./animepahe"));
const kickassanime_1 = __importDefault(require("./kickassanime"));
const allanime_1 = __importDefault(require("./allanime"));
exports.default = {
    AllAnime: allanime_1.default,
    Gogoanime: gogoanime_1.default,
    AnimePahe: animepahe_1.default,
    Kickassanime: kickassanime_1.default,
};
