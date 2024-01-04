import { App, Editor, EditorPosition, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, moment } from 'obsidian';

// Remember to rename these classes and interfaces!

// A record of topic strings, that connect to a record of incomplete task strings, which connect to a record of incomplete subtask-strings,
//		each of which has an array of tuples whose index indicates the order on the top

interface Subtask {
	line: number,
	notes: string[]
}
interface Task {
	line: number,
	sub_tasks: Record<string, Subtask>
	notes: string[]
}
interface Topic {
	line: number,
	tasks: Record<string, Task>
	notes: string[]
}
interface Checklist extends Record<string, Topic> { }
interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
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
		// This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// });
		// // Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// // This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-sample-modal-simple',
		// 	name: 'Open sample modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });
		// // This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });
		// // This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });
		this.addCommand({
			//this turned out to be more work than I thought
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
				let checklist: Checklist = {};
				const topic_regex = new RegExp(/^\t(\w+\s?)+/) // TODO: change \s tags to " *" tags (without the quote_marks)
				const topic_note_regex = new RegExp(/^\t\t\s*(\w+\s?)+/)
				const incomplete_task_regex = new RegExp(/^\t\t-\s\[\s\]\s*(\w+\s?)+/)
				const task_indent_regex = new RegExp(/^\t\t[^\t][\s\S]*/)
				const incomplete_subtask_regex = new RegExp(/^\t\t\t-\s\[\s\]\s*(\w+\s?)+/)
				const subtask_indent_regex = new RegExp(/^\t\t\t[^\t][\s\S]*/)
				// finds the first topic down a line
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
								for (let k = j+1; j< current_pos.line; k++){
									let current_subtask = editor.getLine(k);
									if(topic_regex.test(current_subtask || task))
								}
							}
						}
					}
				}

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
