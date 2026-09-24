import { expect, it } from "vitest";
import { captureShortcut, shortcutLabel } from "./shortcuts";
const input = { ctrlKey: true, altKey: true, shiftKey: false, metaKey: false };
it("normalizes allowed combinations and rejects unsafe main keys", () => {
  expect(captureShortcut({ ...input, code: "KeyF" })).toBe("Ctrl+Alt+KeyF");
  expect(shortcutLabel("Ctrl+Shift+Slash")).toBe("Ctrl + Shift + /");
  for (const code of ["F1", "F12", "Space", "Numpad7", "ArrowLeft", "Enter", "ControlLeft", "MetaLeft", "Tab", "Escape", "AudioVolumeUp"]) expect(captureShortcut({ ...input, code })).toBeUndefined();
  expect(captureShortcut({ ...input, altKey: false, code: "KeyF" })).toBeUndefined();
  expect(captureShortcut({ ...input, metaKey: true, code: "KeyF" })).toBeUndefined();
  expect(captureShortcut({ ...input, ctrlKey: false, shiftKey: true, code: "Digit7" })).toBe("Alt+Shift+Digit7");
});
