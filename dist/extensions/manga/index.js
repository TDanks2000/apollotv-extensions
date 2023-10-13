"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mangaPill_1 = __importDefault(require("./mangaPill"));
const mangasee123_1 = __importDefault(require("./mangasee123"));
exports.default = {
    Mangasee123: mangasee123_1.default,
    MangaPill: mangaPill_1.default,
};
