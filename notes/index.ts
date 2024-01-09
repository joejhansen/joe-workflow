import { Editor } from "obsidian"
import * as fs from "fs"
import * as MyTypes from "./types";
import * as MyFunctions from "./functions";
let checklist_indents: [number, number][] = []; //the index is the relative line, 
let simpleList: MyTypes.IndentList = [
    { indents: 1, isChecklist: false, line: 1, value: "this is a topic" },
    { indents: 2, isChecklist: true, line: 2, value: "this is a checklist" },
    { indents: 1, isChecklist: false, line: 3, value: "this is another topic" },
    { indents: 2, isChecklist: true, line: 3, value: "this is another checklist" },
    { indents: 1, isChecklist: false, line: 3, value: "this is another-nother topic" },
]
let complicatedList: MyTypes.IndentList = [
    { indents: 1, isChecklist: false, line: 1, value: "this is a topic" },
    { indents: 2, isChecklist: true, line: 2, value: "this is a checklist" },
    { indents: 1, isChecklist: false, line: 3, value: "this is another topic" },
    { indents: 2, isChecklist: false, line: 4, value: "this is a sub-topic" },
    { indents: 3, isChecklist: false, line: 5, value: "this is a sub-sub-topic" },
    { indents: 4, isChecklist: false, line: 5, value: "this is a sub-sub-sub-topic" },
    { indents: 4, isChecklist: false, line: 5, value: "another sub-sub-sub-topic" },
    { indents: 2, isChecklist: true, line: 6, value: "back up to a checklist" },
    { indents: 3, isChecklist: false, line: 7, value: "down to some notes" },
    { indents: 4, isChecklist: false, line: 7, value: "even more notes!" },
    { indents: 1, isChecklist: false, line: 8, value: "and finally, a topic" },
]
// let recursiveChecklist: Checklist = makeChecklistFromIndents(complicatedList)
let findThisList: MyTypes.IndentList = [
    { indents: 1, isChecklist: false, line: 1, value: "find" },
    { indents: 2, isChecklist: false, line: 1, value: "this" },
    { indents: 3, isChecklist: false, line: 1, value: "deeply" },
    { indents: 4, isChecklist: false, line: 1, value: "nested" },
    { indents: 5, isChecklist: false, line: 1, value: "entry" },
    { indents: 4, isChecklist: false, line: 1, value: "woot" },
    { indents: 3, isChecklist: false, line: 1, value: "but not this one" },
    { indents: 2, isChecklist: false, line: 1, value: "not this" },
]
let context = ["find","this","deeply","nested","other","entry"]
let currTime = Date.now()
let findChecklist = MyFunctions.makeChecklistFromIndents(findThisList)
let thisEntry = MyFunctions.getChecklistEntryFromContext(context, findChecklist)
// console.log(JSON.stringify(thisEntry, null, 2));
let modifiedCHecklist = MyFunctions.modifyChecklistEntryFromContext(context, findChecklist, {isChecklist: true, notes: ["this is a new note!"], tasks: {}})
console.log(JSON.stringify(modifiedCHecklist, null, 2));
