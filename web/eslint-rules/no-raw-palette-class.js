/**
 * The project's own lint rule: no raw palette utility class under `web/src`.
 *
 * Every colour in the app comes from a semantic role (`bg-background`,
 * `text-muted-foreground`, `border-sidebar-border`), never from the palette
 * (`bg-zinc-500`, `text-gray-700`). The palette exists so the semantic layer has
 * something to point at, and that is all it is for. The one exception is
 * `web/src/index.css`, where the palette is declared.
 *
 * This turns a convention into something the pipeline enforces, which is what spec
 * 0003's AC-18 asks for.
 */

/** Tailwind's palette families. A class rooted in one of these is a raw palette class. */
const PALETTE_FAMILIES = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
].join("|");

/** Utilities that take a colour. Anything else with a palette looking name is ignored. */
const COLOUR_UTILITIES = [
  "bg",
  "text",
  "border",
  "ring",
  "outline",
  "divide",
  "from",
  "via",
  "to",
  "fill",
  "stroke",
  "decoration",
  "accent",
  "caret",
  "placeholder",
].join("|");

/*
  A palette class, optionally behind one or more variants (`dark:`, `hover:`,
  `md:`), anywhere in a class string. The lookbehind keeps `text-primary-foreground`
  and `bg-card` from matching, because those are semantic roles, not palette steps.
*/
const PALETTE_CLASS = new RegExp(
  String.raw`(?<![A-Za-z0-9_-])(?:[a-z-]+:)*-?(?:${COLOUR_UTILITIES})-(?:${PALETTE_FAMILIES})-(?:\d{2,3})(?:\/\d{1,3})?(?![A-Za-z0-9_-])`,
  "g",
);

/** Every palette class name inside a string, or an empty list. */
function findPaletteClassNames(value) {
  if (typeof value !== "string") return [];
  return value.match(PALETTE_CLASS) ?? [];
}

/** The rule, written in the flat config shape ESLint 9 and later expects. */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Tailwind palette utility classes. Use a semantic role utility instead.",
    },
    schema: [],
    messages: {
      rawPalette:
        "Use a semantic colour role instead of the raw palette class {{className}}. The roles are listed in web/design.md and declared in web/src/index.css.",
    },
  },
  create(context) {
    /** Walk an expression and report every string in it that holds a palette class. */
    function collectStrings(expression, reportNode) {
      if (!expression) return;

      if (expression.type === "Literal" && typeof expression.value === "string") {
        report(reportNode, expression.value);
        return;
      }

      if (expression.type === "TemplateLiteral") {
        for (const quasi of expression.quasis) {
          if (quasi.value && quasi.value.cooked) report(quasi, quasi.value.cooked);
        }
        for (const inner of expression.expressions) collectStrings(inner, reportNode);
        return;
      }

      if (expression.type === "ConditionalExpression") {
        collectStrings(expression.consequent, reportNode);
        collectStrings(expression.alternate, reportNode);
        return;
      }

      if (expression.type === "LogicalExpression") {
        collectStrings(expression.left, reportNode);
        collectStrings(expression.right, reportNode);
        return;
      }

      if (expression.type === "CallExpression") {
        // `cn("...", condition && "...")` and friends: check every argument.
        for (const argument of expression.arguments) collectStrings(argument, reportNode);
        return;
      }

      if (expression.type === "ArrayExpression") {
        for (const element of expression.elements) collectStrings(element, reportNode);
      }
    }

    function report(node, text) {
      for (const className of findPaletteClassNames(text)) {
        context.report({ node, messageId: "rawPalette", data: { className } });
      }
    }

    return {
      JSXAttribute(node) {
        if (!node.name || node.name.name !== "className") return;
        const value = node.value;
        if (!value) return;

        if (value.type === "Literal" && typeof value.value === "string") {
          report(value, value.value);
          return;
        }

        if (value.type === "JSXExpressionContainer") {
          collectStrings(value.expression, value);
        }
      },
      VariableDeclarator(node) {
        // Catches a class string kept in a constant, the other common shape.
        collectStrings(node.init, node.init);
      },
    };
  },
};

/** The plugin object, so `web/eslint.config.js` can register it as `palette`. */
const plugin = {
  meta: { name: "pern-dashboard" },
  rules: { "no-raw-palette-class": rule },
};

export default plugin;
