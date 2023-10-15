"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Type = exports.StreamerID = exports.ClassName = exports.Language = exports.Role = void 0;
var Role;
(function (Role) {
    Role["Main"] = "Main";
    Role["Supporting"] = "Supporting";
})(Role || (exports.Role = Role = {}));
var Language;
(function (Language) {
    Language["English"] = "ENGLISH";
    Language["German"] = "GERMAN";
    Language["Japanese"] = "JAPANESE";
})(Language || (exports.Language = Language = {}));
var ClassName;
(function (ClassName) {
    ClassName["Empty"] = "";
    ClassName["TextDanger"] = "text-danger";
    ClassName["TextInfo"] = "text-info";
})(ClassName || (exports.ClassName = ClassName = {}));
var StreamerID;
(function (StreamerID) {
    StreamerID["Allanime"] = "allanime";
})(StreamerID || (exports.StreamerID = StreamerID = {}));
var Type;
(function (Type) {
    Type["Iframe"] = "iframe";
    Type["Player"] = "player";
})(Type || (exports.Type = Type = {}));
