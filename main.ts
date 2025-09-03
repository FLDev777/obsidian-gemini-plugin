import { Plugin, Editor, MarkdownView, Notice, PluginSettingTab, App, Setting, EditorPosition, requestUrl, TextAreaComponent } from 'obsidian';

// Define interfaces for the API request/response based on Google's documentation
interface GeminiPart {
    text: string;
}

interface GeminiContent {
    parts: GeminiPart[];
    role: 'user' | 'model';
}

interface GenerateContentRequest {
    contents: GeminiContent[];
}

interface GeminiGenerateContentResponse {
    candidates: Array<{ content: { parts: Array<{ text?: string; }> } }>;
}

interface SentenceInfo {
  text: string;
  startPos: EditorPosition;
}

// Interface for a user-defined custom style
interface CustomStyle {
  name: string;
  prompt: string;
}

// Updated settings interface
interface GeminiPluginSettings {
  apiKey: string;
  model: string;
  triggerKey: string;
  improvementLevel: 'grammar' | 'structure' | 'style';
  writingStyle: string; // Now stores the name of the selected style
  customStyles: CustomStyle[]; // Array for user-defined styles
}

const DEFAULT_STYLES: Record<string, string> = {
    'Default': '',
    'Academic': 'The tone should be academic.',
    'Business': 'The tone should be professional and suitable for business communication.',
    'Casual': 'The tone should be casual and friendly.',
    'Creative': 'The tone should be creative and engaging.',
    'Technical': 'The tone should be technical and precise.'
};

// Updated default settings
const DEFAULT_SETTINGS: GeminiPluginSettings = {
  apiKey: '',
  model: 'gemini-2.5-flash-lite',
  triggerKey: 'Ctrl+G',
  improvementLevel: 'style',
  writingStyle: 'Default',
  customStyles: [],
}

export default class GeminiPlugin extends Plugin {
  settings: GeminiPluginSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new GeminiSettingTab(this.app, this));
    this.addCommand({
      id: 'send-to-gemini',
      name: 'Send text to Gemini',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.sendToGemini(editor);
      }
    });
    console.log('Gemini Chat Integration loaded');
  }

  onunload() {
    console.log('Gemini Chat Integration unloaded');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private generatePrompt(textToImprove: string): string {
    let prompt = '';

    switch (this.settings.improvementLevel) {
        case 'grammar':
            prompt = 'Please ONLY correct any grammar and spelling errors in the following text.';
            break;
        case 'structure':
            prompt = 'Please ONLY correct grammar and spelling, and improve sentence structure and flow for the following text.';
            break;
        case 'style':
            prompt = 'Please correct grammar and spelling, improve sentence structure, and enhance word choice and writing style for the following text.';
            break;
    }

    const selectedStyle = this.settings.writingStyle;
    let stylePrompt = '';

    // Check if the selected style is a default one
    if (DEFAULT_STYLES[selectedStyle]) {
        stylePrompt = DEFAULT_STYLES[selectedStyle];
    } else {
        // Otherwise, find it in the custom styles
        const customStyle = this.settings.customStyles.find(s => s.name === selectedStyle);
        if (customStyle) {
            stylePrompt = customStyle.prompt;
        }
    }

    if (stylePrompt) {
        prompt += ` ${stylePrompt}`;
    }

    prompt += '\nMaintain the original meaning.';
    prompt += '\nDo not add extra text or explanations, just return the improved text.';
    prompt += `\n\nText: ${textToImprove}`;

    return prompt;
  }

  getSentenceBeforeCursor(editor: Editor): SentenceInfo | null {
    const cursor = editor.getCursor();
    if (editor.lineCount() === 0 || (cursor.line === 0 && cursor.ch === 0)) {
        return null;
    }
    const allTextUpToCursor = editor.getRange({line: 0, ch: 0}, cursor);
    let lastPunctuationIndex = -1;
    const punctuation = ['.', '?', '!'];
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
    if (sentenceText.trim() === '') {
        return null;
    }
    let startPosLine = 0;
    let startPosCh = sentenceStartIndex;
    for (let i = 0; i < sentenceStartIndex; i++) {
        if (allTextUpToCursor[i] === '\n') {
            startPosLine++;
            startPosCh = sentenceStartIndex - i - 1;
        }
    }
    return {
        text: sentenceText,
        startPos: { line: startPosLine, ch: startPosCh }
    };
  }

  async sendToGemini(editor: Editor) {
    if (!this.settings.apiKey) {
      new Notice('Please configure your Gemini API key in plugin settings');
      return;
    }

    let textToImprove: string = '';
    let startPos: EditorPosition;
    let endPos: EditorPosition;
    
    const selectedText = editor.getSelection();
    if (selectedText) {
      textToImprove = selectedText;
      startPos = editor.getCursor('from');
      endPos = editor.getCursor('to');
    } else {
      const sentenceInfo = this.getSentenceBeforeCursor(editor);
      if (!sentenceInfo) {
        new Notice('No sentence found to improve.');
        return;
      }
      textToImprove = sentenceInfo.text;
      startPos = sentenceInfo.startPos;
      endPos = editor.getCursor();
    }

    try {
      new Notice('Sending text to Gemini for improvement...');
      
      const prompt = this.generatePrompt(textToImprove);

      const requestBody: GenerateContentRequest = {
        contents: [ { role: 'user', parts: [ { text: prompt } ] } ]
      };

      const modelName = this.settings.model;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.settings.apiKey}`;

      const response = await requestUrl({
        url: apiUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data: GeminiGenerateContentResponse = response.json;
      
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
        new Notice('Text improved by Gemini');
      } else {
        new Notice('Gemini returned an empty response.');
        console.warn("Gemini response was empty or did not contain expected text:", data);
      }
      
    } catch (error) {
      console.error('Error sending to Gemini:', error);
      new Notice(`Error: ${error.message}`);
    }
  }
}

class GeminiSettingTab extends PluginSettingTab {
  plugin: GeminiPlugin;

  constructor(app: App, plugin: GeminiPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Gemini Chat Integration Settings' });

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Your Gemini API key')
      .addText(text => text
        .setPlaceholder('Enter your API key')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Model')
      .setDesc('Gemini model to use')
      .addDropdown(dropdown => dropdown
        .addOption('gemini-2.5-pro', 'Gemini 2.5 Pro')
        .addOption('gemini-2.5-flash', 'Gemini 2.5 Flash')
        .addOption('gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite')
        .setValue(this.plugin.settings.model)
        .onChange(async (value) => {
          this.plugin.settings.model = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Improvement Level')
      .setDesc('How much the AI should change your text.')
      .addDropdown(dropdown => dropdown
        .addOption('grammar', 'Grammar & Spelling Only')
        .addOption('structure', 'Grammar & Structure')
        .addOption('style', 'Grammar, Structure, & Style')
        .setValue(this.plugin.settings.improvementLevel)
        .onChange(async (value: 'grammar' | 'structure' | 'style') => {
          this.plugin.settings.improvementLevel = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Writing Style')
      .setDesc('The target writing style for the improvement.')
      .addDropdown(dropdown => {
        // Populate with default and custom styles
        Object.keys(DEFAULT_STYLES).forEach(styleName => {
            dropdown.addOption(styleName, styleName);
        });
        this.plugin.settings.customStyles.forEach(style => {
            dropdown.addOption(style.name, style.name);
        });
        dropdown.setValue(this.plugin.settings.writingStyle)
        .onChange(async (value) => {
          this.plugin.settings.writingStyle = value;
          await this.plugin.saveSettings();
        });
      });

    // --- Custom Styles Management UI ---
    containerEl.createEl('h3', { text: 'Custom Writing Styles' });

    this.plugin.settings.customStyles.forEach((style, index) => {
        const setting = new Setting(containerEl)
            .setName(style.name)
            .setDesc(style.prompt)
            .addButton(button => {
                button.setButtonText('Delete')
                    .setCta()
                    .onClick(async () => {
                        this.plugin.settings.customStyles.splice(index, 1);
                        await this.plugin.saveSettings();
                        this.display(); // Refresh the settings tab
                    });
            });
    });

    const newStyleContainer = containerEl.createDiv();
    newStyleContainer.addClass('gemini-new-style-container');

    let newName = '';
    let newPrompt = '';

    new Setting(newStyleContainer)
        .setName('New style name')
        .addText(text => text.onChange(value => newName = value));

    const promptSetting = new Setting(newStyleContainer)
        .setName('New style prompt')
        .setDesc('The instruction for the AI (e.g., \"in a witty and sarcastic tone\").');
    
    const promptTextArea = new TextAreaComponent(promptSetting.controlEl)
        .onChange(value => newPrompt = value);
    promptTextArea.inputEl.rows = 4;
    promptTextArea.inputEl.style.width = '100%';

    new Setting(newStyleContainer)
        .addButton(button => button
            .setButtonText('Add Custom Style')
            .onClick(async () => {
                if (newName && newPrompt) {
                    this.plugin.settings.customStyles.push({ name: newName, prompt: newPrompt });
                    await this.plugin.saveSettings();
                    this.display();
                }
            }));

    new Setting(containerEl)
      .setName('Trigger Key')
      .setDesc('Key combination to trigger the Gemini integration')
      .addText(text => text
        .setPlaceholder('Ctrl+G')
        .setValue(this.plugin.settings.triggerKey)
        .onChange(async (value) => {
          this.plugin.settings.triggerKey = value;
          await this.plugin.saveSettings();
        }));
  }
}