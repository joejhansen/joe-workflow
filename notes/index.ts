import { Editor } from "obsidian"
import * as fs from "fs"
import * as MyTypes from "./types";
import * as MyFunctions from "./functions";
import { Checklist } from "../Types";
let simpleList: MyTypes.IndentList = [
]
let complicatedList: MyTypes.IndentList = [
]
let findThisList: MyTypes.IndentList = [
]
let context = ["find", "this", "deeply", "nested", "other", "entry"]
let currTime = Date.now()
// console.log(JSON.stringify(thisEntry, null, 2));
// console.log(JSON.stringify(modifiedCHecklist, null, 2));
let someChecklist: Checklist = {
    "\tthis is another topic": {
        "notes": [],
        "tasks": {
            "\t\tcool!": {
                "notes": [],
                "tasks": {},
            }
        },
    },
    "\tWow": {
        "notes": [],
        "tasks": {},
    },
    "\tThis is a checklist": {
        "notes": [],
        "tasks": {
            "\t\t- [ ] This is another": {
                "notes": [],
                "tasks": {},
            }
        },
    },
    "\tHello": {
        "notes": [],
        "tasks": {
            "\t\t- [x] Hello!": {
                "notes": [],
                "tasks": {
                    "\t\t\tHello!!": {
                        "notes": [],
                        "tasks": {},
                    }
                },
            }
        },
    },
    "\tNope": {
        "notes": [],
        "tasks": {},
    }
}

export const stringifyChecklist = (someChecklist: Checklist): string => {
    let someString = ""
    for (let key of Object.keys(someChecklist)) {
        someString = someString+key+"\n"+stringifyChecklist(someChecklist[key].tasks)
    }
    return someString
}
console.log(stringifyChecklist(someChecklist))