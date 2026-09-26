import "fake-indexeddb/auto";
import { beforeEach, expect, it, vi } from "vitest";
import { db } from "./db";
import { DEFAULT_SETTINGS, loadSettings, saveSetting } from "./settings";
const mocks=vi.hoisted(()=>({invoke:vi.fn(),enabled:vi.fn(),disable:vi.fn(),enable:vi.fn(),sync:vi.fn(),reconcile:vi.fn(),geometry:vi.fn(),hide:vi.fn()}));
vi.mock("@tauri-apps/api/core",()=>({isTauri:()=>true,invoke:mocks.invoke}));
vi.mock("@tauri-apps/plugin-autostart",()=>({isEnabled:mocks.enabled,disable:mocks.disable,enable:mocks.enable}));
vi.mock("./native",()=>({syncPopoutLayout:mocks.sync,reconcileAutoHideSetting:mocks.reconcile,timerGeometry:mocks.geometry,hideTimerAutomatically:mocks.hide}));
import {resetPreferences} from "./resetPreferences";
beforeEach(async()=>{
 await db.settings.clear();
 for(const mock of Object.values(mocks))mock.mockReset().mockResolvedValue(undefined);
 mocks.invoke.mockResolvedValue(true);mocks.enabled.mockResolvedValue(false);mocks.geometry.mockResolvedValue({tabVisible:false});
 await saveSetting("popoutRevealShortcut","Ctrl+KeyF");await saveSetting("accentColour","miku");await saveSetting("lastBackupAt","2026-09-26");
});
it("resets successfully when autostart was never enabled (absent Windows registry value)",async()=>{
 mocks.disable.mockRejectedValue(new Error("registry value not found"));
 await resetPreferences();
 expect(mocks.disable).not.toHaveBeenCalled();
 expect(await loadSettings()).toEqual({...DEFAULT_SETTINGS,lastBackupAt:"2026-09-26"});
 expect(mocks.sync).toHaveBeenCalledWith(true);expect(mocks.reconcile).toHaveBeenCalled();
});
it("disables enabled autostart and registers the canonical shortcut",async()=>{
 mocks.enabled.mockResolvedValue(true);
 await resetPreferences();
 expect(mocks.invoke).toHaveBeenCalledWith("set_reveal_shortcut",{shortcut:"Alt+Backquote"});
 expect(mocks.disable).toHaveBeenCalledTimes(1);
});
it("preserves preferences if replacement shortcut registration fails",async()=>{
 mocks.invoke.mockImplementation(async(command:string)=>{if(command==="set_reveal_shortcut")throw new Error("conflict");return true;});
 await expect(resetPreferences()).rejects.toThrow("conflict");
 expect((await loadSettings()).accentColour).toBe("miku");expect(mocks.disable).not.toHaveBeenCalled();
});
it("rolls preferences, autostart and shortcut back when native synchronization fails",async()=>{
 mocks.enabled.mockResolvedValue(true);mocks.sync.mockRejectedValueOnce(new Error("window"));
 await expect(resetPreferences()).rejects.toThrow("window");
 expect((await loadSettings()).accentColour).toBe("miku");
 expect(mocks.enable).toHaveBeenCalled();expect(mocks.invoke).toHaveBeenLastCalledWith("set_reveal_shortcut",{shortcut:"Ctrl+KeyF"});
});
it("can reset on a backend without global shortcuts without claiming a native binding",async()=>{
 mocks.invoke.mockResolvedValue(false);
 await resetPreferences();
 expect((await loadSettings()).popoutRevealShortcut).toBe(DEFAULT_SETTINGS.popoutRevealShortcut);
 expect(mocks.invoke).not.toHaveBeenCalledWith("set_reveal_shortcut",expect.anything());
});
