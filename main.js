var GeminiPlugin = /** @class */ (function () {
    function GeminiPlugin() {
    }
    
    GeminiPlugin.prototype.onload = function () {
        console.log('Gemini Chat Integration loaded');
        new Notice('Gemini Plugin loaded successfully!');
        
        // Add settings tab
        this.addSettingTab(new GeminiSettingTab(this.app, this));
        
        // Add command
        this.addCommand({
            id: 'send-to-gemini',
            name: 'Send text to Gemini',
            callback: () => {
                new Notice('Gemini command registered!');
            }
        });
    };
    
    GeminiPlugin.prototype.onunload = function () {
        console.log('Gemini Chat Integration unloaded');
    };
    
    return GeminiPlugin;
}());

var GeminiSettingTab = /** @class */ (function () {
    function GeminiSettingTab(app, plugin) {
        this.app = app;
        this.plugin = plugin;
    }
    
    GeminiSettingTab.prototype.display = function () {
        var containerEl = this.containerEl;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Gemini Chat Integration Settings' });
        new Setting(containerEl)
            .setName('API Key')
            .setDesc('Your Gemini API key')
            .addText(function (text) {
                text.setPlaceholder('Enter your API key');
            });
    };
    
    return GeminiSettingTab;
}());

module.exports = GeminiPlugin;