interface NestedRecord extends Record<string, NestedRecord> { }
interface Entry {
	line: number,
	sub_tasks: Record<string, Entry>		// recursive interface go brr
	notes: string[]
}
interface Topic {
	line: number,
	tasks: Record<string, Entry>
	notes: string[]
}
function createNestedRecord(arr: string[]): Entry {
    if (arr.length === 0) {
        return {line: 5, notes: [], sub_tasks: {}};
    }

    const [first, ...rest] = arr;
    const nestedRecord: Entry = {
        [first]: createNestedRecord(rest), // my brain just don't work like that
    };

    return nestedRecord;
}

const inputArray: string[] = ["this", "is", "an", "object"];
const outputRecord: Entry = createNestedRecord(inputArray);

console.log(JSON.stringify(outputRecord, null, 2));
