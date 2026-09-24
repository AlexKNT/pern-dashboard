/**
 * Run the design system's contrast check and print one line per pair.
 *
 * `npm run check:contrast` exits non zero when any semantic pair falls below the
 * ratio it promises, so a token that breaks WCAG AA fails the pipeline rather than
 * being spotted by eye. This is the check behind AC-3.
 */

import { runContrastCheck } from "./contrast.ts";

const results = runContrastCheck();
const failures = results.filter((result) => !result.passes);

for (const result of results) {
  const mark = result.passes ? "pass" : "FAIL";
  const ratio = result.ratio.toFixed(2);
  console.log(
    `${mark}  ${result.theme.padEnd(5)} ${ratio.padStart(6)}:1  (min ${result.minimum})  ${result.label}`,
  );
}

console.log("");
console.log(`${results.length} pairs checked, ${failures.length} below the minimum.`);

if (failures.length > 0) {
  console.error("\nContrast failed. Fix the token values in src/index.css, not this check.");
  process.exit(1);
}
