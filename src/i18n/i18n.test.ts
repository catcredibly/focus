import { describe, expect, it } from "vitest";
import en from "./en";
import ja from "./ja";
import zhCN from "./zh-CN";
import zhTW from "./zh-TW";

describe("translation resources", () => {
  it("keeps every locale aligned with the canonical English key set", () => {
    const keys = Object.keys(en).sort();
    expect(Object.keys(zhCN).sort()).toEqual(keys);
    expect(Object.keys(zhTW).sort()).toEqual(keys);
    expect(Object.keys(ja).sort()).toEqual(keys);
  });

  it("does not translate user-created names", () => {
    const subject = "数学 / Mathematics 101";
    expect(subject).toBe("数学 / Mathematics 101");
  });
});
