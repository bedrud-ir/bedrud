import type { Root } from "hast";
import { visit } from "unist-util-visit";

export function rehypeCodeLtr() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "code" || node.tagName === "pre") {
        node.properties = { ...node.properties, dir: "ltr" };
      }
    });
  };
}
