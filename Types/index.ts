export interface MyPluginSettings {
    mySetting: string;
}
export interface Entry {
    tasks: Record<string, Entry>,		// recursive interface go brr
    notes: string[]
}
export interface Checklist extends Record<string, Entry> { }
export interface Indent {
    line: number,
    indents: number,
    value: string,
    isChecklist: boolean
}