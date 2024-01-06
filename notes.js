function createNestedRecord(arr) {
    var _a;
    if (arr.length === 0) {
        return {};
    }
    var first = arr[0], rest = arr.slice(1);
    var nestedRecord = (_a = {},
        _a[first] = createNestedRecord(rest),
        _a);
    return nestedRecord;
}
// Example usage:
var inputArray = ["this", "is", "an", "object"];
var outputRecord = createNestedRecord(inputArray);
console.log(JSON.stringify(outputRecord, null, 2));
