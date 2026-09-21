import { db } from "./db";
import type { AcademicYear, FocusSession, Subject } from "./types";

export const CURRENT_YEAR_KEY = "currentAcademicYearId";
export const makeId = () => crypto.randomUUID();

export function formatDuration(totalSeconds: number) {
  const total = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours && minutes) return `${hours} hr ${minutes} min`;
  if (hours) return `${hours} hr`;
  if (minutes) return `${minutes} min`;
  return `${total} sec`;
}

export async function getCurrentAcademicYearId() {
  return (await db.settings.get(CURRENT_YEAR_KEY))?.value ?? "";
}

export async function setCurrentAcademicYear(id: string) {
  const year = await db.academicYears.get(id);
  if (!year || year.archived) throw new Error("Only an active academic year can be current.");
  await db.settings.put({ key: CURRENT_YEAR_KEY, value: id });
}

export async function createSession(input: {
  subject: Subject;
  academicYear: AcademicYear;
  startTime: number;
  endTime: number;
  note?: string;
}) {
  if (!Number.isFinite(input.startTime) || !Number.isFinite(input.endTime) || input.endTime <= input.startTime) {
    throw new Error("End time must be after start time.");
  }
  const session: FocusSession = {
    id: makeId(),
    subjectId: input.subject.id,
    subjectName: input.subject.name,
    academicYearId: input.academicYear.id,
    academicYearName: input.academicYear.name,
    startTime: input.startTime,
    endTime: input.endTime,
    focusedDurationSeconds: Math.round((input.endTime - input.startTime) / 1000),
    note: input.note?.trim() || undefined,
    archived: false,
  };
  await db.sessions.add(session);
  return session;
}
