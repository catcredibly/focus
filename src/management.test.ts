import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { FocusDatabase } from "./db";
import { deleteSession, deleteSubjectIfUnused, setAcademicYearArchived } from "./management";
import { managementViewState } from "./managementViewState";

const opened: Dexie[] = [];
const database = () => { const value = new FocusDatabase(`focus-management-${crypto.randomUUID()}`); opened.push(value); return value; };
afterEach(async () => { await Promise.all(opened.splice(0).map((value) => value.delete())); });

describe("management archive and deletion integrity", () => {
  it("retains management view selections while pages unmount and remount", () => {
    managementViewState.academicYearsArchived=true; managementViewState.subjectsArchived=true; managementViewState.historyStatus="archived";
    expect(managementViewState).toEqual({academicYearsArchived:true,subjectsArchived:true,historyStatus:"archived"});
    managementViewState.academicYearsArchived=false; managementViewState.subjectsArchived=false; managementViewState.historyStatus="active";
  });
  it("moves an Academic Year between Active and Archived without deleting related data", async () => {
    const testDb=database();
    await testDb.academicYears.add({id:"year",name:"Year",archived:false});
    await testDb.subjects.add({id:"subject",academicYearId:"year",name:"Subject",color:"#fff",archived:false});
    await testDb.sessions.add({id:"session",subjectId:"subject",subjectName:"Subject",academicYearId:"year",academicYearName:"Year",startTime:1,endTime:2,focusedDurationSeconds:1,archived:false});
    await setAcademicYearArchived("year",true,testDb);
    expect((await testDb.academicYears.get("year"))?.archived).toBe(true);
    expect(await testDb.subjects.count()).toBe(1); expect(await testDb.sessions.count()).toBe(1);
    await setAcademicYearArchived("year",false,testDb);
    expect((await testDb.academicYears.get("year"))?.archived).toBe(false);
  });

  it("blocks Subject deletion when Sessions would be orphaned", async () => {
    const testDb=database();
    await testDb.subjects.add({id:"subject",academicYearId:"year",name:"Subject",color:"#fff",archived:false});
    await testDb.sessions.add({id:"session",subjectId:"subject",subjectName:"Subject",academicYearId:"year",academicYearName:"Year",startTime:1,endTime:2,focusedDurationSeconds:1,archived:false});
    expect(await deleteSubjectIfUnused("subject",testDb)).toBe(false);
    expect(await testDb.subjects.get("subject")).toBeTruthy();
  });

  it("deletes only confirmed, unreferenced records through deletion helpers", async () => {
    const testDb=database();
    await testDb.subjects.bulkAdd([{id:"one",academicYearId:"year",name:"One",color:"#fff",archived:false},{id:"two",academicYearId:"year",name:"Two",color:"#fff",archived:false}]);
    expect(await deleteSubjectIfUnused("one",testDb)).toBe(true);
    expect((await testDb.subjects.toArray()).map((row)=>row.id)).toEqual(["two"]);
    await testDb.sessions.add({id:"session",subjectId:"two",subjectName:"Two",academicYearId:"year",academicYearName:"Year",startTime:1,endTime:2,focusedDurationSeconds:1,archived:false});
    await deleteSession("session",testDb); expect(await testDb.sessions.count()).toBe(0);
  });
});
