import { expect, it } from "vitest";
import { captureShortcut, shortcutLabel } from "./shortcuts";
const input = { ctrlKey: true, altKey: true, shiftKey: false, metaKey: false };
it("normalizes allowed combinations and rejects unsafe main keys", () => {
  expect(captureShortcut({ ...input, code: "KeyF" })).toBe("Ctrl+Alt+KeyF");
  expect(shortcutLabel("Ctrl+Shift+Slash")).toBe("Ctrl + Shift + /");
  for (const code of ["F0", "F13", "Space", "Numpad7", "ArrowLeft", "Enter", "ControlLeft", "MetaLeft", "Tab", "Escape", "AudioVolumeUp"]) expect(captureShortcut({ ...input, code })).toBeUndefined();
  expect(captureShortcut({ ...input, altKey: false, code: "KeyF" })).toBe("Ctrl+KeyF");
  expect(captureShortcut({ ...input, ctrlKey: false, altKey: false, code: "KeyF" })).toBeUndefined();
  expect(captureShortcut({ ...input, metaKey: true, code: "KeyF" })).toBeUndefined();
  expect(captureShortcut({ ...input, ctrlKey: false, shiftKey: true, code: "Digit7" })).toBe("Alt+Shift+Digit7");
});

it("supports F1-F12 with zero through three modifiers", () => {
  for (let key=1;key<=12;key++) for(let mask=0;mask<8;mask++) {
    const shortcut = captureShortcut({code:`F${key}`,ctrlKey:Boolean(mask&1),altKey:Boolean(mask&2),shiftKey:Boolean(mask&4),metaKey:false});
    expect(shortcut).toBeDefined();
    expect(shortcutLabel(shortcut!)).toContain(`F${key}`);
  }
  expect(shortcutLabel("Ctrl+Alt+Shift+F7")).toBe("Ctrl + Alt + Shift + F7");
});
