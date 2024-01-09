import { Checklist, Entry, Indent } from "Types"
import { Editor, EditorPosition } from "obsidian"

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
    let stringToCap = someString;
    for (let [index, char] of someString.split('').entries()) {
        const currentCharCode = char.charCodeAt(0)
        if (currentCharCode < 97 || currentCharCode > 122) {
            continue
        } else {
            let splitString = stringToCap.split('')
            splitString[index] = String.fromCharCode(currentCharCode - 32);
            stringToCap = splitString.join('')
        }
    }
    return stringToCap
}
export const makeLowercaseString = (someString: string): string => {
    let stringToCap = someString;
    for (let [index, char] of someString.split('').entries()) {
        const currentCharCode = char.charCodeAt(0)
        if (currentCharCode < 65 || currentCharCode > 90) {
            continue
        } else {
            let splitString = stringToCap.split('')
            splitString[index] = String.fromCharCode(currentCharCode + 32);
            stringToCap = splitString.join('')
        }
    }
    return stringToCap
}
export const doSomethingWithSelection = (editor: Editor, someFunction: (selection: string) => string) => {
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
    for (let key of Object.keys(modifyWith)) {
        if (!modifyThis[key]) {
            modifyThis[key] = modifyWith[key]
        } else {
            modifyThis[key] = {
                isChecklist: (modifyThis[key].isChecklist || modifyWith[key].isChecklist),
                notes: (function (): string[] {
                    let someNotes: string[] = [];
                    for (let note of modifyWith[key].notes) {
                        if (modifyThis[key].notes.includes(note)) {
                            continue
                        } else {
                            someNotes.push(note)
                        }
                    }
                    return [...someNotes, ...modifyThis[key].notes]
                })(),
                tasks: mergeChecklists(modifyThis[key].tasks, modifyWith[key].tasks)
            }
        }
    }
    return modifyThis
}