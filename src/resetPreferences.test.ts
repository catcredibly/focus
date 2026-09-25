import { beforeEach, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({invoke:vi.fn(),reset:vi.fn(),disable:vi.fn(),enable:vi.fn()}));
vi.mock("@tauri-apps/api/core",()=>({isTauri:()=>true,invoke:mocks.invoke}));
vi.mock("@tauri-apps/plugin-autostart",()=>({isEnabled:async()=>true,disable:mocks.disable,enable:mocks.enable}));
vi.mock("./settings",()=>({DEFAULT_SETTINGS:{popoutRevealShortcut:"Alt+Backquote"},loadSettings:async()=>({popoutRevealShortcut:"Ctrl+KeyF"}),saveSetting:vi.fn(),resetAllSettings:mocks.reset}));
import {resetPreferences} from "./resetPreferences";
beforeEach(()=>{for(const mock of Object.values(mocks))mock.mockReset().mockResolvedValue(undefined);});
it("registers the default before resetting preferences",async()=>{
 await resetPreferences();
 expect(mocks.invoke).toHaveBeenCalledWith("set_reveal_shortcut",{shortcut:"Alt+Backquote"});
 expect(mocks.invoke.mock.invocationCallOrder[0]).toBeLessThan(mocks.reset.mock.invocationCallOrder[0]);
 expect(mocks.disable).toHaveBeenCalled();
});
it("does not reset settings if the default shortcut cannot register",async()=>{
 mocks.invoke.mockRejectedValueOnce(new Error("conflict"));
 await expect(resetPreferences()).rejects.toThrow("conflict");
 expect(mocks.reset).not.toHaveBeenCalled();expect(mocks.disable).not.toHaveBeenCalled();
});
it("rolls back startup and shortcut registration if storage fails",async()=>{
 mocks.reset.mockRejectedValueOnce(new Error("storage"));
 await expect(resetPreferences()).rejects.toThrow("storage");
 expect(mocks.enable).toHaveBeenCalled();
 expect(mocks.invoke).toHaveBeenLastCalledWith("set_reveal_shortcut",{shortcut:"Ctrl+KeyF"});
});
