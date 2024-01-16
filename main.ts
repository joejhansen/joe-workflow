import { Checklist, Indent, MyPluginSettings } from './Types';
import { doSomethingWithSelection, getAscensionS9SpellLink, getAscensionS9TalentLink, makeChecklistFromIndents, makeIndentListFromEditorRange, makeLowercaseString, makeUppercaseString, mergeChecklists, offsetCursorBy, stringifyChecklist } from './Utils';
import { App, Editor, EditorPosition, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, moment } from 'obsidian';

// Remember to rename these classes and interfaces!

// A record of topic strings, that connect to a record of incomplete task strings, which connect to a record of incomplete subtask-strings,
//		each of which has an array of tuples whose index indicates the order on the top




const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
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
		this.addCommand({ // Roll over last date's incomplete tasks
			// this turned out to be more work than I thought
			// makes a hashmap of the first checklist, then makes a hashmap of the previous date's checklist
			// 		then merges those hashmaps together
			//		then replaces that deleted checklist with the merged one
			// How do you make a hashmap for a checklist, i hear you say?
			// Simply ->
			// 		loop through each line, making a 1D array with each line's information
			// 		feed that 1D array into a recursive function in order to make a hashmap
			// Want to make a checklist?
			//		recursion.
			// Want to modify a checklist? 
			//		recursion.
			// Want to merge two checklists together? 
			// 		recursion.
			// Want to turn a checklist back into a string?
			//		that's actually iterative -- PSYCH! RECURSION AGAIN, FOO!
			// Was choosing to use a hashmap instead of some other structure with recurisve functions a good idea?
			// 		Hell if I know
			//		The syntax is a little wonky, but O(1) lookup with computed property values is nice
			id: "roll-over-last-date's-incomplete-tasks",
			name: "Roll over last date's incomplete tasks",
			editorCallback: (editor: Editor) => {
				const currentPos = editor.getCursor();
				// assume we start left of the first date character
				const date_regex = new RegExp(/^\d{4}-\d{2}-\d{2}$/)
				if (!date_regex.test(editor.getLine(currentPos.line))) { //if the current line isn't a date line, return early
					return
				}
				const endOfCurrentChecklist: number = (function (): number {
					for (let i = currentPos.line + 1; i < editor.lineCount(); i++) {
						let someLine: string = editor.getLine(i)
						if ("\t" !== someLine[0]) {
							return i
						}
					}
					return editor.lineCount();
				})()
				const lastDateLine: number = (function (): number {
					for (let i = currentPos.line-1; i >= 0; i--) {
						if (date_regex.test(editor.getLine(i))) {
							return i
						} else {
							continue
						}
					}
					return -1
				})();
				if (lastDateLine < 0) return // if there's no date line before this one, return early
				const lastChecklistAnchors = { start: lastDateLine, end: currentPos.line - 1 }
				const currentChecklistAnchors = { start: currentPos.line, end: endOfCurrentChecklist }
				const currentDateIndentArray: Indent[] = makeIndentListFromEditorRange(currentChecklistAnchors, editor)
				const currentDateChecklist: Checklist = makeChecklistFromIndents(currentDateIndentArray)
				const lastDateIndentArray: Indent[] = makeIndentListFromEditorRange(lastChecklistAnchors, editor)
				const lastDateChecklist: Checklist = makeChecklistFromIndents(lastDateIndentArray)
				const mergedChecklist: Checklist = mergeChecklists(currentDateChecklist, lastDateChecklist)
				const stringifiedChecklist: string = stringifyChecklist(mergedChecklist);
				editor.setSelection({line: currentPos.line + 1, ch: 0}, { line: endOfCurrentChecklist, ch: editor.getLine(endOfCurrentChecklist).length })
				editor.replaceSelection(stringifiedChecklist)
				return
			},
		});
		this.addCommand({ // Insert red X
			id: "insert-red-x",
			name: "Insert red X",
			editorCallback: (editor: Editor) => {
				editor.replaceRange(
					"❌",
					editor.getCursor()
				);
			},
		});
		this.addCommand({ // Insert tomorrow's date
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
		this.addCommand({ // Insert Nth date from today
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
		this.addCommand({ // Replace selection with uppercase
			id: "replace-selection-with-uppercase",
			name: "Replace selection with uppercase",
			editorCallback: (editor: Editor) => {
				doSomethingWithSelection(editor, makeUppercaseString)
			}
		});
		this.addCommand({ // Replace selection with lowercase
			id: "replace-selection-with-lowercase",
			name: "Replace selection with lowercase",
			editorCallback: (editor: Editor) => {
				doSomethingWithSelection(editor, makeLowercaseString)
			}
		});
		this.addCommand({ // Replace selection with lowercase
			id: "link-to-season-9-spell",
			name: "Link to season 9 spell",
			editorCallback: async (editor: Editor) => {
				let someLink = await getAscensionS9SpellLink(editor.getSelection())
				let someClosure = () => {
					return someLink
				}
				doSomethingWithSelection(editor, someClosure)
			}
		});
		this.addCommand({ // Replace selection with lowercase
			id: "link-to-season-9-talent",
			name: "Link to season 9 talent",
			editorCallback: async (editor: Editor) => {
				let someLink = await getAscensionS9TalentLink(editor.getSelection())
				let someClosure = () => {
					return someLink
				}
				doSomethingWithSelection(editor, someClosure)
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
