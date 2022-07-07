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
var Button_exports = {};
__export(Button_exports, {
  Button: () => Button
});
module.exports = __toCommonJS(Button_exports);
var import_core = require("@tamagui/core");
const Button = (0, import_core.styled)(import_core.Stack, {
  tag: "button",
  alignItems: "center",
  flexShrink: 0,
  justifyContent: "center",
  backgroundColor: "white",
  borderColor: "#999",
  borderWidth: 1,
  borderRadius: 3,
  height: 25,
  paddingLeft: 10,
  paddingRight: 10,
  variants: {
    disabled: {
      true: {
        backgroundColor: "gray",
        shadowColor: "gray",
        pointerEvents: "none"
      }
    },
    active: {
      true: {
        backgroundColor: "gray"
      }
    },
    size: {
      1: {
        borderRadius: "2",
        height: 25,
        paddingHorizontal: 10
      },
      2: {
        borderRadius: "3",
        height: 35,
        paddingHorizontal: 15
      }
    },
    blue: {
      true: {
        backgroundColor: "blue",
        borderColor: "gray"
      }
    },
    red: {
      true: {
        backgroundColor: "red",
        borderColor: "gray"
      }
    }
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Button
});
//# sourceMappingURL=Button.js.map
