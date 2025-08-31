# Obsidian Gemini Assistant

Supercharge your writing in Obsidian with the power of Google's Gemini AI. This plugin acts as your personal writing assistant, helping you proofread, improve, and restyle your text directly within the editor.

## Overview

The Obsidian Gemini Assistant allows you to send selected text (or the sentence right before your cursor) to the Gemini AI for improvements. Whether you need a simple grammar check or a complete stylistic overhaul, you can do it all without leaving your note. The plugin replaces your original text with the AI-improved version, streamlining your writing workflow.

## Features

- **In-Editor Text Improvement**: Correct grammar, enhance sentence structure, and improve word choice on the fly.
- **Two Modes of Operation**: Works on either your selected text or the last sentence before the cursor.
- **Highly Customizable Prompts**: Use the settings to control exactly how the AI improves your text.
- **Improvement Levels**: Choose your desired level of intervention, from a simple grammar fix to a full style enhancement.
- **Adaptive Writing Styles**: Select from a list of predefined writing styles (e.g., Academic, Business, Casual) or create your own library of custom styles for any context.
- **Configurable Hotkey**: Trigger the AI with your own custom key combination.

---

## Getting Started

### 1. Get Your Gemini API Key

To use this plugin, you need a free API key from Google.

1.  Go to **[Google AI Studio](https://aistudio.google.com/)**.
2.  Sign in with your Google account.
3.  Click on **"Get API key"** in the top left menu.
4.  Click **"Create API key in new project"**.
5.  Your new API key will be generated. Copy it to your clipboard.

### 2. Install the Plugin

The easiest way to install is by using the **BRAT** community plugin for Obsidian.

1.  Install **BRAT** from the Community Plugins browser in Obsidian.
2.  Open the command palette and run the command **"BRAT: Add a beta plugin for testing"**.
3.  Paste the URL of this repository into the prompt.
4.  Enable the **"Gemini Chat Integration"** plugin in the "Community Plugins" tab.

---

## How to Use

Using the plugin is simple:

1.  **To improve a specific piece of text**: Highlight the text you want to improve.
2.  **To improve the last sentence you wrote**: Simply place your cursor at the end of the sentence.
3.  **Press `Ctrl+G`** (or your custom trigger key).
4.  A notice will appear saying "Sending text to Gemini for improvement...".
5.  After a moment, your original text will be replaced by the new, improved version from Gemini.

---

## Settings Explained

You can find the settings under **Settings > Community Plugins > Gemini Chat Integration**.

| Setting | Description |
| :--- | :--- |
| **API Key** | Paste your Gemini API key here. The plugin will not work without it. |
| **Model** | Choose which Gemini model to use. Newer models may be more powerful but could have different costs or rate limits. `gemini-2.5-flash-lite` is a good starting point. |
| **Improvement Level** | This dropdown controls the depth of the AI's changes: <br> • **Grammar & Spelling Only**: The AI will only fix objective errors. <br> • **Grammar & Structure**: Fixes errors and improves sentence flow and readability. <br> • **Grammar, Structure, & Style**: The most comprehensive option. It fixes errors, improves structure, and enhances word choice and overall style. |
| **Writing Style** | This powerful setting adapts the AI's response to a specific tone. You can select from predefined styles or create your own (see below). |
| **Trigger Key** | The keyboard shortcut to run the plugin. Defaults to `Ctrl+G`. |

### Custom Writing Styles

This feature allows you to define your own reusable style presets.

-   **To use a style**: Simply select it from the "Writing Style" dropdown.
-   **To create a new style**:
    1.  Scroll down to the **"Custom Writing Styles"** section in the settings.
    2.  Enter a **"New style name"** (e.g., "My Blog Tone").
    3.  In the **"New style prompt"** text box, describe the tone you want the AI to adopt (e.g., "in a friendly, engaging, and slightly humorous tone").
    4.  Click **"Add Custom Style"**.
-   Your new style will now appear in the main "Writing Style" dropdown, ready to be used! You can delete any custom style at any time using the "Delete" button next to it.
