import Dexie, { type Table } from "dexie";
import type { AcademicYear, FocusSession, Subject } from "./types";

class FocusDatabase extends Dexie {
  academicYears!: Table<AcademicYear, string>;
  subjects!: Table<Subject, string>;
  sessions!: Table<FocusSession, string>;

  constructor() {
    super("focus");
    this.version(1).stores({
      academicYears: "id, name, startDate, endDate, archived",
      subjects: "id, academicYearId, name, archived",
      sessions: "id, subjectId, startTime, endTime, archived",
    });
  }
}

export const db = new FocusDatabase();
