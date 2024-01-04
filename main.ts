import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, moment } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}
const offsetCursorBy = (editor: Editor, offsetBy: number): void => {
	const current_pos = editor.getCursor()
	current_pos.ch += offsetBy
	if (current_pos.ch < 0) {
		current_pos.ch = 0
		editor.setCursor(current_pos)
	} else {
		editor.setCursor(current_pos)
	}

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
						let num_regex = /\d/;
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
				offsetCursorBy(editor, 10);
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
					offsetCursorBy(editor, 10);
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
