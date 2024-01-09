export interface Topic {
    line: number,
    tasks: Record<string, Entry>
    notes: string[]
}
export interface MyPluginSettings {
    mySetting: string;
}
export interface NestedRecord extends Record<string, NestedRecord> { }
export interface Entry {
    tasks: Record<string, Entry>,		// recursive interface go brr
    isChecklist: boolean,
    notes: string[]
}
export interface LineInfo {
    line: number,
    contents: string
}
export interface Checklist extends Record<string, Entry> { }
export interface EntryList {
    value: string,
    line: number,
    isChecklist: boolean,
    subEntries: EntryList[]
}
export interface Indent {
    line: number,
    indents: number,
    value: string,
    isChecklist: boolean
}
type RecursiveArray<T> = T | RecursiveArray<T>[];
// type RecursiveStringArray = StringArray[]
interface User {
    id: number,
    username: string,
    email: string,
    isSubscriber: boolean
}