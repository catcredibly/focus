import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "./db";
import { loadSettings, saveSetting } from "./settings";
import { setPopoutDocked, syncPopoutLayout, toggleTimerAutoHide } from "./native";

const native = vi.hoisted(() => ({ invoke: vi.fn(), geometry: { x: 250, y: 300, width: 400, height: 200, scale: 1, visible: true, tabVisible: false, requested: true, generation: 0, workArea: { x: 0, y: 0, width: 1920, height: 1040 } }, failPosition: false }));
vi.mock("@tauri-apps/api/core", () => ({ isTauri: () => true, invoke: native.invoke }));
beforeEach(async () => {
  await db.settings.clear(); native.failPosition = false;
  vi.stubGlobal("localStorage", { getItem: () => JSON.stringify({ running: true, paused: false, sessionId: "live-session", targetEnd: Date.now() + 3600000 }) });
  Object.assign(native.geometry, { x: 250, y: 300, width: 400, height: 200, visible: true, tabVisible: false, requested: true });
  let tail = Promise.resolve();
  vi.stubGlobal("navigator", { locks: { request: (_name: string, operation: () => Promise<void>) => { const result = tail.catch(() => undefined).then(operation); tail = result; return result; } } });
  native.invoke.mockReset().mockImplementation(async (command: string, args: Record<string, unknown> = {}) => {
    if (command === "get_timer_geometry") return structuredClone(native.geometry);
    if (command === "set_timer_position" && native.failPosition) throw new Error("move failed");
    if (command === "set_timer_position" || command === "set_timer_position_unchecked" || command === "restore_timer_bounds") Object.assign(native.geometry, args);
    if (command === "set_timer_size") Object.assign(native.geometry, args.layout === "compact" ? { width: 320, height: 78 } : { width: 380, height: 190 });
    if (command === "show_timer_auto_hide_tab") Object.assign(native.geometry, { visible: false, tabVisible: true });
    if (command === "cancel_timer_auto_hide") Object.assign(native.geometry, { visible: true, tabVisible: false });
  });
});
describe("serialized native popout transitions", () => {
  it("resizes compact while preserving an auto-hidden window", async () => {
    await saveSetting("popoutLayout", "compact");
    await saveSetting("popoutDockAutoHide", true);
    Object.assign(native.geometry, { visible: false, tabVisible: true });
    await syncPopoutLayout(true);
    expect(native.geometry).toMatchObject({ width: 320, height: 78, visible: false, tabVisible: true });
    expect(native.invoke).toHaveBeenCalledWith("set_timer_size", { size: "medium", layout: "compact" });
  });
  it("does not reopen a closed popout when changing its layout", async () => {
    await saveSetting("popoutLayout", "compact");
    Object.assign(native.geometry, { requested: false, visible: false });
    await syncPopoutLayout(true);
    expect(native.invoke.mock.calls.map(([command]) => command)).toEqual(["sync_popout_session", "get_timer_geometry"]);
  });
  it("restores separate floating bounds after queued dock/undock and stale layout work", async () => {
    await Promise.all([setPopoutDocked(true), setPopoutDocked(false), syncPopoutLayout()]);
    expect(native.geometry).toMatchObject({ x: 250, y: 300, width: 400, height: 200 });
    expect((await loadSettings()).popoutDocked).toBe(false);
  });
  it("does not persist Dock when native placement fails", async () => {
    native.failPosition = true;
    await expect(setPopoutDocked(true)).rejects.toThrow("move failed");
    expect((await loadSettings()).popoutDocked).toBe(false);
    expect(native.geometry).toMatchObject({ x: 250, y: 300, width: 400, height: 200 });
  });
  it("toggles floating auto-hide without moving, resizing or docking the real window", async () => {
    await saveSetting("popoutDockAutoHide", true);
    await toggleTimerAutoHide();
    expect(native.geometry).toMatchObject({ visible: false, tabVisible: true });
    await toggleTimerAutoHide();
    expect(native.geometry).toMatchObject({ x: 250, y: 300, width: 400, height: 200, visible: true, tabVisible: false, requested: true });
    expect((await loadSettings()).popoutDocked).toBe(false);
    expect(native.invoke.mock.calls.some(([command]) => command === "set_timer_position")).toBe(false);
  });
});
