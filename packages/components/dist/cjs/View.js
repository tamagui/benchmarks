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
var View_exports = {};
__export(View_exports, {
  View: () => View
});
module.exports = __toCommonJS(View_exports);
var import_core = require("@tamagui/core");
const View = (0, import_core.styled)(import_core.Stack, {
  alignItems: "stretch",
  display: "flex",
  flexBasis: "auto",
  flexDirection: "column",
  flexShrink: 0,
  position: "relative",
  minHeight: "0",
  minWidth: "0"
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  View
});
//# sourceMappingURL=View.js.map
