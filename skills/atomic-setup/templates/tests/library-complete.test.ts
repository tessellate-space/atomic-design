// atomic:runner-import expect,it
import { checkAtomicLibrary, findMapRoot, initBaseline, report, warningsText } from "{{lib_import}}/atomic-boundaries";

// Boundary checks on the real tree: no data import below containers, a stories file
// for every library component, and every rule at the severity set in .atomic-design.json.
// Known debt lives in the baseline file; it can only shrink.
it("the library follows the atomic design rules", () => {
  const root = findMapRoot(__dirname);
  if (process.env.ATOMIC_BASELINE_INIT) { // setup only, once: records today's violations
    // ATOMIC_BASELINE_INIT=1 baselines every rule; =<rule id> adds one rule added after setup.
    const only = process.env.ATOMIC_BASELINE_INIT;
    console.warn(`baseline written with ${initBaseline(root, undefined, only === "1" ? undefined : only)} entries`);
    return;
  }
  const result = checkAtomicLibrary(root);
  const warnings = warningsText(result);
  if (warnings) console.warn(warnings);
  expect(report(result)).toEqual([]);
});
