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
var Box_exports = {};
__export(Box_exports, {
  Box: () => Box
});
module.exports = __toCommonJS(Box_exports);
var import_core = require("@tamagui/core");
var import_View = require("./View");
const Box = (0, import_core.styled)(import_View.View, {
  alignSelf: "flex-start",
  backgroundColor: "transparent",
  variants: {
    color: {
      0: {
        backgroundColor: "#14171A"
      },
      1: {
        backgroundColor: "#AAB8C2"
      },
      2: {
        backgroundColor: "#E6ECF0"
      },
      3: {
        backgroundColor: "#FFAD1F"
      },
      4: {
        backgroundColor: "#F45D22"
      },
      5: {
        backgroundColor: "#E0245E"
      }
    },
    layout: {
      column: {
        flexDirection: "column"
      },
      row: {
        flexDirection: "row"
      }
    },
    outer: {
      true: {
        padding: "4px"
      }
    },
    fixed: {
      true: {
        width: "6px",
        height: "6px"
      }
    }
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Box
});
//# sourceMappingURL=Box.js.map
