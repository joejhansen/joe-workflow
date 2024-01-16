export interface MyPluginSettings {
    mySetting: string;
}
export interface Entry {
    indents: number,
    tasks: Record<string, Entry>,		// recursive interface go brr
    isChecklist: boolean,
    notes: string[]
}
export interface Checklist extends Record<string, Entry> { }
export interface Indent {
    line: number,
    indents: number,
    value: string,
    isChecklist: boolean
}