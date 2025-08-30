var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => GeminiPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  apiKey: "",
  // We can keep the model setting for UI consistency, even though we hardcode the actual model name
  model: "models/gemini-2.5-flash-lite",
  triggerKey: "Ctrl+G"
};
var GeminiPlugin = class extends import_obsidian.Plugin {
  // Remove the genAI property as it's no longer used
  // private genAI: GoogleGenerativeAI | null = null;
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new GeminiSettingTab(this.app, this));
    this.addCommand({
      id: "send-to-gemini",
      name: "Send text to Gemini",
      editorCallback: (editor, view) => {
        this.sendToGemini(editor);
      }
    });
    console.log("Gemini Chat Integration loaded");
  }
  onunload() {
    console.log("Gemini Chat Integration unloaded");
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  /**
   * Finds the sentence before the cursor position.
   * A sentence is defined as text ending with '.', '?', or '!', 
   * or the start of the document if no such punctuation is found looking backwards.
   * @param editor The Obsidian editor instance.
   * @returns An object containing the sentence text and its start position, or null if at the very beginning.
   */
  getSentenceBeforeCursor(editor) {
    const cursor = editor.getCursor();
    const lineCount = editor.lineCount();
    if (lineCount === 0 || cursor.line === 0 && cursor.ch === 0) {
      return null;
    }
    let currentLine = cursor.line;
    let currentCh = cursor.ch;
    const allTextUpToCursor = editor.getRange({ line: 0, ch: 0 }, cursor);
    let lastPunctuationIndex = -1;
    const punctuation = [".", "?", "!"];
    for (let i = allTextUpToCursor.length - 1; i >= 0; i--) {
      if (punctuation.includes(allTextUpToCursor[i])) {
        lastPunctuationIndex = i;
        break;
      }
    }
    let sentenceStartIndex = lastPunctuationIndex + 1;
    while (sentenceStartIndex < allTextUpToCursor.length && /\s/.test(allTextUpToCursor[sentenceStartIndex])) {
      sentenceStartIndex++;
    }
    const sentenceText = allTextUpToCursor.substring(sentenceStartIndex, allTextUpToCursor.length);
    if (sentenceText.trim() === "") {
      return null;
    }
    let startPosLine = 0;
    let startPosCh = sentenceStartIndex;
    for (let i = 0; i < sentenceStartIndex; i++) {
      if (allTextUpToCursor[i] === "\n") {
        startPosLine++;
        startPosCh = sentenceStartIndex - i - 1;
      }
    }
    const startPos = { line: startPosLine, ch: startPosCh };
    return {
      text: sentenceText,
      startPos
    };
  }
  /**
   * Sends the identified text (selected or sentence) to the Gemini API via a direct fetch call.
   * @param editor The Obsidian editor instance.
   */
  async sendToGemini(editor) {
    if (!this.settings.apiKey) {
      new import_obsidian.Notice("Please configure your Gemini API key in plugin settings");
      return;
    }
    let textToImprove = "";
    let startPos;
    let endPos;
    const selectedText = editor.getSelection();
    if (selectedText) {
      textToImprove = selectedText;
      startPos = editor.getCursor("from");
      endPos = editor.getCursor("to");
    } else {
      const sentenceInfo = this.getSentenceBeforeCursor(editor);
      if (!sentenceInfo) {
        new import_obsidian.Notice("No sentence found to improve.");
        return;
      }
      textToImprove = sentenceInfo.text;
      startPos = sentenceInfo.startPos;
      endPos = editor.getCursor();
    }
    try {
      new import_obsidian.Notice("Sending text to Gemini for improvement...");
      const prompt = `Act as a professional British English writing assistant. I will provide you with text and you will do the following:

Edit and refine the text for clarity and conciseness. This includes checking for spelling, grammatical, and punctuation errors; re-writing difficult or poorly written sentences; assessing and improving word choice; removing filler words; and ensuring that the text is well-structured and avoids pointless rambling.

Evaluate and improve the tone and word choice of the text. Provide only one response, no other text.

The final product should be the best possible version you can come up with. It should be very pleasing to read and give the impression that someone with a high level of education wrote it.
                      
                      Text: ${textToImprove}`;
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      };
      const modelName = "gemini-2.5-flash-lite-preview-06-17";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.settings.apiKey}`;
      const response = await (0, import_obsidian.requestUrl)({
        url: apiUrl,
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      const data = response.json;
      let improvedText = "";
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const part = candidate.content.parts[0];
          if (part.text) {
            improvedText = part.text.trim();
          }
        }
      }
      if (improvedText) {
        editor.replaceRange(improvedText, startPos, endPos);
        new import_obsidian.Notice("Text improved by Gemini");
      } else {
        new import_obsidian.Notice("Gemini returned an empty response.");
        console.warn("Gemini response was empty or did not contain expected text:", data);
      }
    } catch (error) {
      console.error("Error sending to Gemini:", error);
      new import_obsidian.Notice(`Error: ${error.message}`);
    }
  }
};
var GeminiSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Gemini Chat Integration Settings" });
    new import_obsidian.Setting(containerEl).setName("API Key").setDesc("Your Gemini API key").addText((text) => text.setPlaceholder("Enter your API key").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
      this.plugin.settings.apiKey = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Model").setDesc("Gemini model to use").addDropdown((dropdown) => dropdown.addOption("gemini-2.5-flash-lite", "Gemini 2.5 Flash Lite").addOption("gemini-pro", "Gemini Pro").addOption("gemini-pro-latest", "Gemini Pro Latest").setValue(this.plugin.settings.model).onChange(async (value) => {
      this.plugin.settings.model = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Trigger Key").setDesc("Key combination to trigger the Gemini integration").addText((text) => text.setPlaceholder("Ctrl+G").setValue(this.plugin.settings.triggerKey).onChange(async (value) => {
      this.plugin.settings.triggerKey = value;
      await this.plugin.saveSettings();
    }));
  }
};
