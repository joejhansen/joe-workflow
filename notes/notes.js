"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var checklist_indents = []; //the index is the relative line, 
var makeChecklistObject = function (levels) {
    var someChecklist = {};
    for (var _i = 0, levels_1 = levels; _i < levels_1.length; _i++) {
        var entry = levels_1[_i];
        if (entry.subEntries.length) {
            someChecklist[entry.value] = { notes: [], isChecklist: entry.isChecklist, tasks: makeChecklistObject(entry.subEntries) };
        }
        else {
            someChecklist[entry.value] = { notes: [], isChecklist: entry.isChecklist, tasks: {} };
        }
    }
    return someChecklist;
};
var makeChecklistFromIndents = function (indentList) {
    var someChecklist = {};
    // do magic
    var currentLevel = indentList[0], nextToRest = indentList.slice(1);
    for (var i = 0; i < indentList.length; i++) {
        if (currentLevel.indents > indentList[i].indents) {
            break;
        }
        if (currentLevel.indents == indentList[i].indents) {
            if (!nextToRest.length || !indentList[i + 1]) { // we have to check both, or else you might index indentList out-of-bounds in the next statement
                someChecklist[indentList[i].value] = { isChecklist: indentList[i].isChecklist, notes: [], tasks: {} };
            }
            else if (indentList[i + 1].indents < currentLevel.indents) {
                someChecklist[indentList[i].value] = { isChecklist: indentList[i].isChecklist, notes: [], tasks: {} };
                break;
            }
            else if (indentList[i + 1].indents == currentLevel.indents) {
                someChecklist[indentList[i].value] = { isChecklist: indentList[i].isChecklist, notes: [], tasks: {} };
            }
            else {
                someChecklist[indentList[i].value] = { isChecklist: indentList[i].isChecklist, notes: [], tasks: makeChecklistFromIndents(indentList.slice(i + 1)) };
            }
        }
    }
    return someChecklist;
};
var getChecklistItemFromContext = function (context, currentChecklist) {
    var _a;
    var first = context[0], rest = context.slice(1);
    if (!currentChecklist[first]) {
        return {};
    }
    if (!rest.length) {
        return _a = {}, _a[first] = currentChecklist[first], _a;
    }
    else {
        return getChecklistItemFromContext(rest, currentChecklist[first].tasks);
    }
};
var simpleList = [
    { indents: 1, isChecklist: false, line: 1, value: "this is a topic" },
    { indents: 2, isChecklist: true, line: 2, value: "this is a checklist" },
    { indents: 1, isChecklist: false, line: 3, value: "this is another topic" },
    { indents: 2, isChecklist: true, line: 3, value: "this is another checklist" },
    { indents: 1, isChecklist: false, line: 3, value: "this is another-nother topic" },
];
var complicatedList = [
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
];
// let recursiveChecklist: Checklist = makeChecklistFromIndents(complicatedList)
var findThisList = [
    { indents: 1, isChecklist: false, line: 1, value: "find" },
    { indents: 2, isChecklist: false, line: 1, value: "this" },
    { indents: 3, isChecklist: false, line: 1, value: "deeply" },
    { indents: 4, isChecklist: false, line: 1, value: "nested" },
    { indents: 5, isChecklist: false, line: 1, value: "entry" },
    { indents: 4, isChecklist: false, line: 1, value: "woot" },
    { indents: 3, isChecklist: false, line: 1, value: "but not this one" },
    { indents: 2, isChecklist: false, line: 1, value: "not this" },
];
var context = ["find", "this", "deeply", "nested", "entry"];
var currTime = Date.now();
var findChecklist = makeChecklistFromIndents(findThisList);
var thisEntry = getChecklistItemFromContext(context, findChecklist);
console.log(JSON.stringify(thisEntry, null, 2));
// fs.writeFileSync(`checklistOutput-${currTime}.json`, JSON.stringify(recursiveChecklist))
function insertIntoChain(checklist_indents) {
    var _a;
    if (!checklist_indents.length) {
        return {};
    }
    var first = checklist_indents[0], rest = checklist_indents.slice(1);
    return _a = {},
        _a[first.value] = {
            tasks: insertIntoChain(rest),
            notes: first.notes,
            isChecklist: false,
        },
        _a;
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
