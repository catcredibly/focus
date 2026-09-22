import { db } from "../db";
import { saveSetting } from "../settings";
import { backupFilename, createBackup } from "./backup";
import { saveTextFile } from "./files";

export async function exportFullBackup() {
  const backup = await createBackup();
  const saved = await saveTextFile(backupFilename(), JSON.stringify(backup, null, 2), "json");
  if (saved) await saveSetting("lastBackupAt", new Date().toISOString(), db);
  return saved;
}
