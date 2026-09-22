import { db, type FocusDatabase } from "./db";
import { CURRENT_YEAR_KEY } from "./data";

export async function setAcademicYearArchived(id: string, archived: boolean, database: FocusDatabase = db) {
  await database.academicYears.update(id, { archived });
}

export async function deleteSubjectCascade(id: string, database: FocusDatabase = db) {
  await database.transaction("rw", database.subjects, database.sessions, async () => {
    await database.sessions.where("subjectId").equals(id).delete();
    await database.subjects.delete(id);
  });
}

export async function deleteAcademicYearCascade(id: string, database: FocusDatabase = db) {
  await database.transaction("rw", database.academicYears, database.subjects, database.sessions, database.settings, async () => {
    const subjectIds = (await database.subjects.where("academicYearId").equals(id).primaryKeys()) as string[];
    if (subjectIds.length) await database.sessions.where("subjectId").anyOf(subjectIds).delete();
    await database.sessions.where("academicYearId").equals(id).delete();
    await database.subjects.where("academicYearId").equals(id).delete();
    await database.academicYears.delete(id);
    if ((await database.settings.get(CURRENT_YEAR_KEY))?.value === id) {
      const replacement = await database.academicYears.filter((year) => !year.archived).first();
      if (replacement) await database.settings.put({ key: CURRENT_YEAR_KEY, value: replacement.id });
      else await database.settings.delete(CURRENT_YEAR_KEY);
    }
  });
}

export async function deleteSession(id: string, database: FocusDatabase = db) {
  await database.sessions.delete(id);
}

export async function deleteSessions(ids: string[], database: FocusDatabase = db) {
  await database.transaction("rw", database.sessions, () => database.sessions.bulkDelete(ids));
}

export async function moveSessions(ids: string[], subjectId: string, database: FocusDatabase = db) {
  await database.transaction("rw", database.academicYears, database.subjects, database.sessions, async () => {
    const subject = await database.subjects.get(subjectId);
    if (!subject || subject.archived) throw new Error("Choose an active Subject.");
    const academicYear = await database.academicYears.get(subject.academicYearId);
    if (!academicYear || academicYear.archived) throw new Error("Choose a Subject in an active Academic Year.");
    await database.sessions.where("id").anyOf(ids).modify({
      subjectId: subject.id,
      subjectName: subject.name,
      academicYearId: academicYear.id,
      academicYearName: academicYear.name,
    });
  });
}

export function canDeleteManagedRecord(archived: boolean, allowDirectActiveDeletion: boolean) {
  return archived || allowDirectActiveDeletion;
}
