import { Checklist, Entry, EntryList, Indent, LineInfo, NestedRecord, MyPluginSettings, Topic } from "Types"
import { Editor, EditorPosition } from "obsidian"

export const checklist_into_hashmap = (current_pos: EditorPosition, editor: Editor): Checklist => {
    // look for the next \n
    const newline_regex = new RegExp(/\n/)
    let next_dateline = (function (): number {
        for (let i = current_pos.line; i <= editor.lineCount(); i++) {
            if (newline_regex.test(editor.getLine(i))) {
                return i
            }
        }
        return editor.lineCount()
    })()
    // categorize each line
    // index is line # relative to the list
    let checklist_indents: [number, number][] = [];
    for (let i = current_pos.line; i <= next_dateline; i++) {
        let current_line = editor.getLine(current_pos.line);
        let indent_num = 0;
        while ("\t" == current_line[0]) { // weird
            indent_num += 1;
            current_line = current_line.slice(1)
        }
        checklist_indents.push([i, indent_num])
    }
    //
    let checklist: Checklist = {};



    return checklist
}
// export const incomplete_checklist_into_hashmap = (last_date_line: number, current_pos: EditorPosition, editor: Editor): Checklist => {
// 	let checklist: Checklist = {};
// 	const topic_regex = new RegExp(/^\t(\w+\s?)+/) // TODO: change \s tags to " *" tags (without the quote_marks)
// 	const topic_note_regex = new RegExp(/^\t\t\s*(\w+\s?)+/)
// 	const incomplete_task_regex = new RegExp(/^\t\t-\s\[\s\]\s*(\w+\s?)+/)
// 	const task_indent_regex = new RegExp(/^\t\t[^\t][\s\S]*/)
// 	const incomplete_subtask_regex = new RegExp(/^\t\t\t-\s\[\s\]\s*(\w+\s?)+/)
// 	const subtask_indent_regex = new RegExp(/^\t\t\t[^\t][\s\S]*/)
// 	// finds the first topic down a line
// 	// maybe i'm thinking about this wrong
// 	// i already have the tablature in the character index of the last starting \t
// 	// i could assign each line a tuple value of [the_line_#, the_indent_#]
// 	// if the next line is further indented than the current one
// 	// 		that means it's a note referencing the current line
// 	// inversely, if the next line is less indented that the current one
// 	// 		we assume the current note is finished and go up as many levels as needed
// 	// I would just have to keep track of what the current note or "topic" is through an array or something that equates index to indent depth
// 	// Date: 0 indent
// 	// 		Topic: 1
// 	// 			Task: 2
// 	// 				Subtask: 3
// 	//					AndSoOn: 4
// 	for (let i = last_date_line + 1; i < current_pos.line; i++) {
// 		let current_topic = editor.getLine(i)
// 		if (topic_regex.test(current_topic)) {
// 			const cleaned_topic = current_topic.replace(`\t`, ``);
// 			checklist[cleaned_topic] = { line: i, tasks: {}, notes: [] };
// 			// finds each task in a topic
// 			for (let j = i + 1; j < current_pos.line; i++) {
// 				let current_task = editor.getLine(j)
// 				if (topic_regex.test(current_task)) break
// 				if (topic_note_regex.test(current_task)) {
// 					checklist[cleaned_topic].notes.push()
// 				}
// 				if (incomplete_task_regex.test(current_task)) {
// 					const cleaned_task = current_task.replace(`\t`, ``)
// 					checklist[cleaned_topic].tasks[current_task] = { line: j, sub_tasks: {}, notes: [] };
// 					// finds each sub-task in a task
// 					for (let k = j + 1; j < current_pos.line; k++) {
// 						let current_subtask = editor.getLine(k);
// 						if (topic_regex.test(current_subtask)) { }
// 						// TODO: this
// 					}
// 				}
// 			}
// 		}
// 	}
// 	return checklist
// }
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
export const makeChecklistObject = (levels: EntryList[]): Checklist => { // I did it
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