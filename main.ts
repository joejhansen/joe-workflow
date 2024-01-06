import { App, Editor, EditorPosition, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, moment } from 'obsidian';

// Remember to rename these classes and interfaces!

// A record of topic strings, that connect to a record of incomplete task strings, which connect to a record of incomplete subtask-strings,
//		each of which has an array of tuples whose index indicates the order on the top


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
interface Checklist extends Record<string, Topic> { }
interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}
const checklist_into_hashmap = (current_pos: EditorPosition, editor: Editor): Checklist => {
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
	let topics: [number, number][] = checklist_indents.filter((value) => { value[1] == 1 })
	for (let [current_index, current_topic] of topics.entries()) {
		let [topic_line_num, topic_indent] = current_topic
		checklist[editor.getLine(topic_line_num).replace(`\t`, ``)] = { line: topic_line_num, notes: [], tasks: {} }
		let next_topic_line = (function (): number {
			if (topics[current_index + 1]) {
				return topics[current_index + 1][0]
			} else {
				return next_dateline // see, we used it again
			}
		})()
		for (let i = topic_line_num; i < next_topic_line; i++) {

		}
		// like this
		interface RecursiveObject {
			[key: string]: string | RecursiveObject
		}
		let words = ["this", "is", "an", "object"]
		let some_object: RecursiveObject = {}
		let current_object: RecursiveObject = {}
		for (let [index, word] of words.entries()) {
			current_object = some_object;
			current_object[word] = word;
			some_object = current_object;
		}
		console.log(JSON.stringify(some_object))
	};

	return checklist
}
const incomplete_checklist_into_hashmap = (last_date_line: number, current_pos: EditorPosition, editor: Editor): Checklist => {
	let checklist: Checklist = {};
	const topic_regex = new RegExp(/^\t(\w+\s?)+/) // TODO: change \s tags to " *" tags (without the quote_marks)
	const topic_note_regex = new RegExp(/^\t\t\s*(\w+\s?)+/)
	const incomplete_task_regex = new RegExp(/^\t\t-\s\[\s\]\s*(\w+\s?)+/)
	const task_indent_regex = new RegExp(/^\t\t[^\t][\s\S]*/)
	const incomplete_subtask_regex = new RegExp(/^\t\t\t-\s\[\s\]\s*(\w+\s?)+/)
	const subtask_indent_regex = new RegExp(/^\t\t\t[^\t][\s\S]*/)
	// finds the first topic down a line
	// maybe i'm thinking about this wrong
	// i already have the tablature in the character index of the last starting \t
	// i could assign each line a tuple value of [the_line_#, the_indent_#]
	// if the next line is further indented than the current one
	// 		that means it's a note referencing the current line
	// inversely, if the next line is less indented that the current one
	// 		we assume the current note is finished and go up as many levels as needed
	// I would just have to keep track of what the current note or "topic" is through an array or something that equates index to indent depth
	// Date: 0 indent
	// 		Topic: 1
	// 			Task: 2
	// 				Subtask: 3
	//					AndSoOn: 4
	for (let i = last_date_line + 1; i < current_pos.line; i++) {
		let current_topic = editor.getLine(i)
		if (topic_regex.test(current_topic)) {
			const cleaned_topic = current_topic.replace(`\t`, ``);
			checklist[cleaned_topic] = { line: i, tasks: {}, notes: [] };
			// finds each task in a topic
			for (let j = i + 1; j < current_pos.line; i++) {
				let current_task = editor.getLine(j)
				if (topic_regex.test(current_task)) break
				if (topic_note_regex.test(current_task)) {
					checklist[cleaned_topic].notes.push()
				}
				if (incomplete_task_regex.test(current_task)) {
					const cleaned_task = current_task.replace(`\t`, ``)
					checklist[cleaned_topic].tasks[current_task] = { line: j, sub_tasks: {}, notes: [] };
					// finds each sub-task in a task
					for (let k = j + 1; j < current_pos.line; k++) {
						let current_subtask = editor.getLine(k);
						if (topic_regex.test(current_subtask)) { }
						// TODO: this
					}
				}
			}
		}
	}
	return checklist
}
const offsetCursorBy = (editor: Editor, offsetBy: EditorPosition): void => {
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
const makeUppercaseString = (someString: string): string => {
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
const makeLowercaseString = (someString: string): string => {
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
const doSomethingWithSelection = (editor: Editor, someFunction: (selection: string) => string) => {
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
export class NumberInputModal extends Modal {
	result: string;
	onSubmit: (result: string) => void;

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "Input a number" });

		new Setting(contentEl)
			.setName("Number")
			.addText((text) =>
				text.onChange((value) => {
					this.result = value
				}));

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Submit")
					.setCta()
					.onClick(() => {
						let num_regex = /^\d+$/;
						switch (num_regex.test(this.result)) {
							case true:
								this.close();
								this.onSubmit(this.result);
								break;
							case false:
								break
							default:
								break;
						}

					}));
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {

		await this.loadSettings();
		this.addCommand({
			// this turned out to be more work than I thought
			// makes a hashmap of the first checklist, then makes a hashmap of the previous date's checklist
			// 		then merges those hashmaps together
			//		then deletes your current checklist
			//		then replaces that deleted checklist with the merged one
			// How do you make a hashmap for a checklist, i hear you say?
			// Simply ->
			// 		Bang your head against the wall with regex
			//			it's not that it's hard, it's that it's finnicky
			id: "roll-over-last-date's-incomplete-tasks",
			name: "Roll over last date's incomplete tasks",
			editorCallback: (editor: Editor) => {
				const current_pos = editor.getCursor();
				// assume we start left of the first date character
				const date_regex = new RegExp(/^\d{4}-\d{2}-\d{2}$/)
				const last_date_line: number = (function (): number {
					for (let i = current_pos.line; i < 0; i--) {
						if (date_regex.test(editor.getLine(i))) {
							return i
						} else {
							continue
						}
					}
					return 0
				})();
				let example_topic_lines: Checklist = {
					health: {
						notes: [],
						line: 5,
						tasks: {
							contact_doctor: {
								line: 8,
								sub_tasks: {},
								notes: [],
							}
						}
					},

				}
				// TODO: roll all this up into a function that spits out a Checklist, one for any checklist and one for just incomplete items
				let current_checklist_hashmap = checklist_into_hashmap(current_pos, editor)
				let incomplete_checklist_hashmap = incomplete_checklist_into_hashmap(last_date_line, current_pos, editor)
				// get each un-checked sub-line for each topic
				editor.replaceRange(
					"❌",
					editor.getCursor()
				);
			},
		});
		this.addCommand({
			id: "insert-red-x",
			name: "Insert red X",
			editorCallback: (editor: Editor) => {
				editor.replaceRange(
					"❌",
					editor.getCursor()
				);
			},
		});
		this.addCommand({
			id: "insert-tomorrow's-date",
			name: "Insert tomorrow's date",
			editorCallback: (editor: Editor) => {
				const future_date = new Date(Date.now() + (24 * 60 * 60 * 1000));
				const date_string = `${future_date.getFullYear()}-${future_date.getMonth() + 1 >= 10 ? future_date.getMonth() + 1 : `0${future_date.getMonth() + 1}`}-${future_date.getDate() >= 10 ? future_date.getDate() : `0${future_date.getDate()}`}`
				editor.replaceRange(
					date_string,
					editor.getCursor()
				);
				offsetCursorBy(editor, { line: 0, ch: 10 });
			},
		});
		this.addCommand({
			id: "insert-nth-date-from-today",
			name: "Insert Nth date from today",
			editorCallback: (editor: Editor) => {
				new NumberInputModal(this.app, (result) => {
					const future_date = new Date(Date.now() + (parseInt(result) * 24 * 60 * 60 * 1000));
					const date_string = `${future_date.getFullYear()}-${future_date.getMonth() + 1 >= 10 ? future_date.getMonth() + 1 : `0${future_date.getMonth() + 1}`}-${future_date.getDate() >= 10 ? future_date.getDate() : `0${future_date.getDate()}`}`
					editor.replaceRange(
						date_string,
						editor.getCursor()
					);
					offsetCursorBy(editor, { line: 0, ch: 10 });
				}).open()
			},
		});
		this.addCommand({
			id: "replace-selection-with-uppercase",
			name: "Replace selection with uppercase",
			editorCallback: (editor: Editor) => {
				doSomethingWithSelection(editor, makeUppercaseString)
			}
		});
		this.addCommand({
			id: "replace-selection-with-lowercase",
			name: "Replace selection with lowercase",
			editorCallback: (editor: Editor) => {
				doSomethingWithSelection(editor, makeLowercaseString)
			}
		});
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
