import { Checklist, IndentList, Entry, EntryList, Indent, LineInfo, NestedRecord } from "./types"

export const makeChecklistFromIndents = (indentList: IndentList): Checklist => {
    let someChecklist: Checklist = {}
    // do magic
    let [currentLevel, ...nextToRest] = indentList
    for (let i = 0; i < indentList.length; i++) {
        if (currentLevel.indents > indentList[i].indents) {
            break
        }
        if (currentLevel.indents == indentList[i].indents) {
            if (!nextToRest.length || !indentList[i + 1]) { // we have to check both, or else you might index indentList out-of-bounds in the next statement
                someChecklist[indentList[i].value] = { isChecklist: indentList[i].isChecklist, notes: [], tasks: {} }
            } else if (indentList[i + 1].indents < currentLevel.indents) {
                someChecklist[indentList[i].value] = { isChecklist: indentList[i].isChecklist, notes: [], tasks: {} }
                break
            } else if (indentList[i + 1].indents == currentLevel.indents) {
                someChecklist[indentList[i].value] = { isChecklist: indentList[i].isChecklist, notes: [], tasks: {} }
            } else {
                someChecklist[indentList[i].value] = { isChecklist: indentList[i].isChecklist, notes: [], tasks: makeChecklistFromIndents(indentList.slice(i + 1)) }
            }
        }
    }
    return someChecklist
}
export const insertIntoChain = (checklist_indents: { value: string, line: number, notes: string[] }[]): Record<string, Entry> => {
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
// export const makeChecklistObject = (levels: EntryList[]): Checklist => { // I did it
//     let someChecklist: Checklist = {}
//     for (let entry of levels) {
//         if (entry.subEntries.length) {
//             someChecklist[entry.value] = { notes: [], isChecklist: entry.isChecklist, tasks: makeChecklistObject(entry.subEntries) }
//         } else {
//             someChecklist[entry.value] = { notes: [], isChecklist: entry.isChecklist, tasks: {} }
//         }
//     }
//     return someChecklist
// }
export const getChecklistEntryFromContext = (context: string[], currentChecklist: Record<string, Entry>): Record<string, Entry> => {
    let [first, ...rest] = context
    if (!currentChecklist[first]) {
        return {}
    }
    if (!rest.length) {
        return { [first]: currentChecklist[first] }
    } else {
        return getChecklistEntryFromContext(rest, currentChecklist[first].tasks)
    }
}
export const modifyChecklistEntryFromContext = (context: string[], currentChecklist: Record<string, Entry>, modifyByThis: Entry): Record<string, Entry> => {
    let [first, ...rest] = context
    if (!rest.length) {
        currentChecklist[first] = modifyByThis;
        return currentChecklist
    }
    else {
        if (!currentChecklist[first]) currentChecklist[first] = { isChecklist: false, notes: [], tasks: {} }
        currentChecklist[first].tasks = modifyChecklistEntryFromContext(rest, currentChecklist[first].tasks, modifyByThis)
        return currentChecklist
    }
}
export const replaceChecklistEntryFromContext = (context: string[], currentChecklist: Record<string, Entry>, modifyByThis: { [key: string]: Entry }): Record<string, Entry> => {
    let [first, ...rest] = context
    if (!currentChecklist[first]) {
        return currentChecklist
    } else if (!rest.length) {
        delete currentChecklist[first]
        let someKey = Object.keys(modifyByThis)[0]
        currentChecklist[someKey] = modifyByThis[someKey]
        return currentChecklist
    } else {
        currentChecklist[first].tasks = replaceChecklistEntryFromContext(rest, currentChecklist[first].tasks, modifyByThis)
        return currentChecklist
    }
}
let lineContents = "something else"
const someChecklist = replaceChecklistEntryFromContext(["something"], {}, { [lineContents]: { isChecklist: false, notes: [], tasks: {} } })