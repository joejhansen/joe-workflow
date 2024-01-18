import { Checklist, Entry, Indent } from "../Types"
import { Editor, EditorPosition } from "obsidian"
import * as http from "node:http"
export const offsetCursorBy = (editor: Editor, offsetBy: EditorPosition): void => {
    const { line, ch } = offsetBy
    const current_pos = editor.getCursor()
    current_pos.ch += ch
    current_pos.line += line
    if (current_pos.line < 0) {
        current_pos.line = 0
    }
    if (current_pos.line > editor.lineCount()) {
        current_pos.line = editor.lineCount()
    }
    if (current_pos.ch < 0) {
        current_pos.ch = 0
    }
    if (current_pos.ch > editor.getLine(current_pos.line).length) {
        current_pos.ch = editor.getLine(current_pos.line).length
    }
    editor.setCursor(current_pos)
}
export const makeUppercaseString = (someString: string): string => {
    return someString.toLocaleUpperCase()
}
export const makeLowercaseString = (someString: string): string => {
    return someString.toLocaleLowerCase()
}
export const doSomethingWithSelection = (editor: Editor, someFunction: (selection: string) => string): void => {
    const selection = editor.getSelection()
    const currentPos = editor.getCursor() // snapshot before replaceSelection moves cursor to the end of the selection regardless
    editor.replaceSelection(someFunction(selection))
    const updatedPos = editor.getCursor()
    const [selectionAnchor, selectionHead] = (function (): [EditorPosition, EditorPosition] {
        if (JSON.stringify(currentPos) == JSON.stringify(updatedPos)) {
            return [{ line: updatedPos.line, ch: updatedPos.ch - selection.length }, updatedPos]
        } else {
            return [updatedPos, currentPos]
        }
    })()
    editor.setSelection(selectionAnchor, selectionHead)
}
export const makeChecklistFromIndents = (indentList: Indent[]): Checklist => {
    // I tried reading this a day after writing it and didn't know what the hell was happening
    // keeping track of linear input while in a recursive environment is like tying your shoes while running on a treadmill 
    // so, comments
    let someChecklist: Checklist = {}
    // do magic
    let [currentLevel, ...nextToRest] = indentList                                  // this ensures that each level and sublevel only gets one pass
    for (let i = 0; i < indentList.length; i++) {                                   // go through the whole list as passed in args, not nextToRest: Indent[] above which is a reference to the 
        // currentLevel and will change differently from the indentList in args 
        if (currentLevel.indents > indentList[i].indents) {                         // if we've gone up a level, that must mean that's the end of this level and we can break out of the loop
            break
        }                                                                           // we could elif, i suppose
        if (currentLevel.indents == indentList[i].indents) {                        // if it's the same level, we're going to add this entry to the current Checklist object
            if (!nextToRest.length || !indentList[i + 1]) {                         // if we're done with the current Indent[] relative to this stack, or if we're done with the whole Indent[] 
                someChecklist[indentList[i].value] = { notes: [], tasks: {} }       // that means there's no subentries under this one, we can store the value in the key and {} as tasks
                // we have to check both on their own and before everything else, or else you might index indentList 
                //      out-of-bounds in the next statement
            } else if (indentList[i + 1].indents < currentLevel.indents) {          // else if the next entry is at a higher level than this one
                someChecklist[indentList[i].value] = { notes: [], tasks: {} }       // same as above, no subentries
                break                                                               // this looks a lot like line -9...
            } else if (indentList[i + 1].indents == currentLevel.indents) {         // else if it's the same level
                someChecklist[indentList[i].value] = { notes: [], tasks: {} }       // no subentries but we need to keep going through the list
            } else {                                                                // else, i guess that means the next indent is a subentry of this one
                someChecklist[indentList[i].value] = {                              // I swear to god, we have to check each of these explicitly or else it explodes
                    notes: [],
                    tasks: makeChecklistFromIndents(indentList.slice(i + 1))        // recursion
                }
            }
        }
    }

    return someChecklist
}
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
        if (!currentChecklist[first]) currentChecklist[first] = { notes: [], tasks: {} } // TODO: fix this so indents will be correct instead of 0
        currentChecklist[first].tasks = modifyChecklistEntryFromContext(rest, currentChecklist[first].tasks, modifyByThis)
        return currentChecklist
    }
}
export const getLineIndents = (someString: string): number => {
    if (!someString.length) {
        return 0
    }
    let indents = 0
    for (let i = 0; i < someString.length; i++) {
        if ("\t" !== someString[i]) {
            break
        } else {
            indents += 1;
        }
    }
    return indents
}
export const isLineChecklist = (someString: string): boolean => {
    if (someString.length < 5) { //- [ ]
        return false
    }
    while ("\t" === someString[0]) {
        someString = someString.slice(1)
    }
    let checklistRegex = new RegExp(/^-\s\[[\s\S]\]/)
    if (checklistRegex.test(someString)) {
        return true
    } else {
        return false
    }
}
export const makeIndentListFromEditorRange = (anchors: { start: number, end: number }, editor: Editor): Indent[] => {
    let someIndentList: Indent[] = []
    for (let i = anchors.start + 1; i < anchors.end; i++) {
        const lineValue = editor.getLine(i);
        someIndentList.push({ indents: getLineIndents(lineValue), isChecklist: isLineChecklist(lineValue), line: i, value: lineValue })
    }
    return someIndentList
}
export const mergeChecklists = (modifyThis: Checklist, modifyWith: Checklist): Checklist => {
    let [shorterChecklist, longerChecklist]: [Checklist, Checklist] = [{}, {}]
    if (JSON.stringify(modifyThis).length > JSON.stringify(modifyWith).length) { //idk man, i'm betting this is only marginally better than just not doing anything at
        shorterChecklist = modifyWith;
        longerChecklist = modifyThis;
    } else {
        shorterChecklist = modifyThis;
        longerChecklist = modifyWith;
    }
    for (let key of Object.keys(shorterChecklist)) {
        if (!longerChecklist[key]) {
            longerChecklist[key] = shorterChecklist[key]
        } else {
            longerChecklist[key] = {
                notes: (function (): string[] {
                    let someNotes: string[] = [];
                    for (let note of shorterChecklist[key].notes) {
                        if (longerChecklist[key].notes.includes(note)) {
                            continue
                        } else {
                            someNotes.push(note)
                        }
                    }
                    return [...someNotes, ...longerChecklist[key].notes]
                })(),
                tasks: mergeChecklists(longerChecklist[key].tasks, shorterChecklist[key].tasks)
            }
        }
    }
    return longerChecklist
}
export const stringifyChecklist = (someChecklist: Checklist): string => {
    let someString = ""
    for (let key of Object.keys(someChecklist)) {
        someString = someString + key + "\n" + stringifyChecklist(someChecklist[key].tasks)
    }
    return someString
}
export const getAscensionS9TalentLink = async (someString: string): Promise<string> => {
    try {
        someString.trim().replace(" ", "%20")
        let someLink: string = await fetch(`http://localhost:3069/AscensionS9Talent/${someString}`)
            .then(function (response) { return response.json() })
            .then(function (json) {
                return json.link
            })
        return someLink
    } catch (e) {
        console.log(`Something fucked up in Obsidian\n${e}`)
        return `https://db.ascension.gg/`
    }
}
export const getAscensionS9SpellLink = async (someString: string): Promise<string> => {
    try {
        someString.trim().replace(" ", "%20")
        let someLink: string = await fetch(`http://localhost:3069/AscensionS9Spell/${someString}`)
            .then(function (response) { return response.json() })
            .then(function (json) {
                return json.link
            })
        return someLink
    } catch (e) {
        console.log(`Something fucked up in Obsidian\n${e}`)
        return `https://db.ascension.gg/`
    }
}
export const removeCompletedTasks = (someChecklist: Checklist): Checklist => {
    let completedRegex = new RegExp(/-\s\[\S\]/)
    for (let key of Object.keys(someChecklist)) {
        if (completedRegex.test(key)) {
            delete someChecklist[key]
        } else {
            removeCompletedTasks(someChecklist[key].tasks)
        }
    }
    return someChecklist
}