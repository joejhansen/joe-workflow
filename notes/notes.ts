import { Editor } from "obsidian"
import * as fs from "fs"

interface NestedRecord extends Record<string, NestedRecord> { }
interface Entry {
    tasks: Record<string, Entry>,		// recursive interface go brr
    isChecklist: boolean,
    notes: string[]
}
interface LineInfo {
    line: number,
    contents: string
}
interface Checklist extends Record<string, Entry> { }
let checklist_indents: [number, number][] = []; //the index is the relative line, 
interface EntryList {
    value: string,
    line: number,
    isChecklist: boolean,
    subEntries: EntryList[]
}

const makeChecklistObject = (levels: EntryList[]): Checklist => { // I did it
    let someChecklist: Checklist = {}
    for (let entry of levels) {
        if (entry.subEntries.length) {
            someChecklist[entry.value] = { notes: [], isChecklist: entry.isChecklist, tasks: makeChecklistObject(entry.subEntries) }
        } else {
            someChecklist[entry.value] = { notes: [], isChecklist: entry.isChecklist, tasks: {} }
        }
    }
    return someChecklist
}
interface Indent {
    line: number,
    indents: number,
    value: string,
    isChecklist: boolean
}
type IndentList = Indent[]
const makeChecklistFromIndents = (indentList: IndentList): Checklist => {
    let someChecklist: Checklist = {}
    // do magic
    let [currentLevel, ...nextToRest] = indentList
    for (let i = 0; i < indentList.length; i++) {
        if (currentLevel.indents > indentList[i].indents){
            break
        }
        if (currentLevel.indents == indentList[i].indents) {
            if (!nextToRest.length || !indentList[i + 1]) { // we have to check both, or else you might index indentList out-of-bounds in the next statement
                someChecklist[indentList[i].value] = { isChecklist: indentList[i].isChecklist, notes: [], tasks: {} }
            } else if (indentList[i + 1].indents < currentLevel.indents) {
                someChecklist[indentList[i].value] = { isChecklist: indentList[i].isChecklist, notes: [], tasks: {} }
                break
            } else if(indentList[i + 1].indents == currentLevel.indents){
                someChecklist[indentList[i].value] = { isChecklist: indentList[i].isChecklist, notes: [], tasks: {} }
            }else {
                someChecklist[indentList[i].value] = { isChecklist: indentList[i].isChecklist, notes: [], tasks: makeChecklistFromIndents(indentList.slice(i + 1)) }
            }
        }
    }
    return someChecklist
}
let simpleList: IndentList = [
    { indents: 1, isChecklist: false, line: 1, value: "this is a topic" },
    { indents: 2, isChecklist: true, line: 2, value: "this is a checklist" },
    { indents: 1, isChecklist: false, line: 3, value: "this is another topic" },
    { indents: 2, isChecklist: true, line: 3, value: "this is another checklist" },
    { indents: 1, isChecklist: false, line: 3, value: "this is another-nother topic" },
]
let complicatedList: IndentList = [
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
let recursiveChecklist: Checklist = makeChecklistFromIndents(complicatedList)
let currTime = Date.now()
fs.writeFileSync(`checklistOutput-${currTime}.json`,JSON.stringify(recursiveChecklist))
function insertIntoChain(checklist_indents: { value: string, line: number, notes: string[] }[]): Record<string, Entry> {
    if (!checklist_indents.length) {
        return {}
    }
    let [first, ...rest] = checklist_indents
    return {
        [first.value]: {
            tasks: insertIntoChain(rest),
            notes: first.notes,
            isChecklist: false,
        }
    }
}

// const inputArray: string[] = ["this", "is", "an", "object"];
// let inputType: { value: string, line: number, notes: string[] }[] = [];
// const strings: string[] = ["this", "is", "an", "object"];
// const notes: string[][] = [["recurisve"], ["thinking"], ["is"], ["hard"]]
// for (let i = 0; i < strings.length; i++) {
//     inputType.push({ value: strings[i], line: i, notes: notes[i] })
// }
// const outputRecord: Record<string, Entry> = insertIntoChain(inputType);

// console.log(JSON.stringify(outputRecord, null, 2));

// let coolerEntryList: EntryList[] = [{ value: "This is a top-level Topic", line: 4, isChecklist: false, subEntries: [{ value: "This is a checklist item", line: 5, isChecklist: true, subEntries: [{ value: "This is a subEntry beneath the checklist", line: 6, isChecklist: false, subEntries: [] }] }] }, { value: "This is another topic", line: 7, isChecklist: false, subEntries: [{ value: "this is another checklist", line: 8, isChecklist: true, subEntries: [] }] }, { value: "this is a topic without subEntries", line: 9, isChecklist: false, subEntries: [] }]
// let simpleEntryList: EntryList[] = [{ value: "This is a top-level Topic", line: 4, isChecklist: false, subEntries: [{ value: "This is a checklist item", line: 5, isChecklist: true, subEntries: [] }] }]
// let coolChecklist: Checklist = makeChecklistObject(coolerEntryList)
// console.log(JSON.stringify(coolChecklist, null, 2));

