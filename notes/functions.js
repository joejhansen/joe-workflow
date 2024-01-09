"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyChecklistEntryFromContext = exports.getChecklistEntryFromContext = exports.makeChecklistObject = exports.insertIntoChain = exports.makeChecklistFromIndents = void 0;
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
                someChecklist[indentList[i].value] = { isChecklist: indentList[i].isChecklist, notes: [], tasks: (0, exports.makeChecklistFromIndents)(indentList.slice(i + 1)) };
            }
        }
    }
    return someChecklist;
};
exports.makeChecklistFromIndents = makeChecklistFromIndents;
var insertIntoChain = function (checklist_indents) {
    var _a;
    if (!checklist_indents.length) {
        return {};
    }
    var first = checklist_indents[0], rest = checklist_indents.slice(1);
    return _a = {},
        _a[first.value] = {
            tasks: (0, exports.insertIntoChain)(rest),
            notes: first.notes,
            isChecklist: false,
        },
        _a;
};
exports.insertIntoChain = insertIntoChain;
var makeChecklistObject = function (levels) {
    var someChecklist = {};
    for (var _i = 0, levels_1 = levels; _i < levels_1.length; _i++) {
        var entry = levels_1[_i];
        if (entry.subEntries.length) {
            someChecklist[entry.value] = { notes: [], isChecklist: entry.isChecklist, tasks: (0, exports.makeChecklistObject)(entry.subEntries) };
        }
        else {
            someChecklist[entry.value] = { notes: [], isChecklist: entry.isChecklist, tasks: {} };
        }
    }
    return someChecklist;
};
exports.makeChecklistObject = makeChecklistObject;
var getChecklistEntryFromContext = function (context, currentChecklist) {
    var _a;
    var first = context[0], rest = context.slice(1);
    if (!currentChecklist[first]) {
        return {};
    }
    if (!rest.length) {
        return _a = {}, _a[first] = currentChecklist[first], _a;
    }
    else {
        return (0, exports.getChecklistEntryFromContext)(rest, currentChecklist[first].tasks);
    }
};
exports.getChecklistEntryFromContext = getChecklistEntryFromContext;
var modifyChecklistEntryFromContext = function (context, currentChecklist, modifyByThis) {
    var first = context[0], rest = context.slice(1);
    console.log(JSON.stringify(context, null, 2));
    if (!rest.length) {
        currentChecklist[first] = modifyByThis;
        return currentChecklist;
    }
    else {
        if (!currentChecklist[first])
            currentChecklist[first] = { isChecklist: false, notes: [], tasks: {} };
        currentChecklist[first].tasks = (0, exports.modifyChecklistEntryFromContext)(rest, currentChecklist[first].tasks, modifyByThis);
        return currentChecklist;
    }
};
exports.modifyChecklistEntryFromContext = modifyChecklistEntryFromContext;
