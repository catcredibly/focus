export type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  archived: boolean;
};

export type Subject = {
  id: string;
  academicYearId: string;
  name: string;
  color: string;
  archived: boolean;
};

export type FocusSession = {
  id: string;
  subjectId: string;
  startTime: number;
  endTime: number;
  archived: boolean;
};
