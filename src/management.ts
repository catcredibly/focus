import { db, type FocusDatabase } from "./db";

export async function setAcademicYearArchived(id: string, archived: boolean, database: FocusDatabase = db) {
  await database.academicYears.update(id, { archived });
}

export async function deleteSubjectIfUnused(id: string, database: FocusDatabase = db) {
  if (await database.sessions.where("subjectId").equals(id).count()) return false;
  await database.subjects.delete(id);
  return true;
}

export async function deleteSession(id: string, database: FocusDatabase = db) {
  await database.sessions.delete(id);
}
