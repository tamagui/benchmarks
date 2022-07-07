var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var Dot_exports = {};
__export(Dot_exports, {
  Dot: () => Dot
});
module.exports = __toCommonJS(Dot_exports);
var import_core = require("@tamagui/core");
var import_View = require("./View");
const Dot = (0, import_core.styled)(import_View.View, {
  position: "absolute",
  cursor: "pointer",
  width: "0",
  height: "0",
  borderColor: "transparent",
  borderStyle: "solid",
  borderTopWidth: 0,
  transform: "translate(50%, 50%)"
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Dot
});
//# sourceMappingURL=Dot.js.map
