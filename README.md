# Gemini Chat Integration

This Obsidian plugin allows you to send text directly to Google's Gemini AI and receive responses inline in your notes.

## Features

- Send selected text or entire note to Gemini with a hotkey
- Context-aware responses using the entire note as conversation history
- Inline response insertion directly in your note
- Configurable API key and model settings

## Installation

1. Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/)
2. Install BRAT plugin in Obsidian if you haven't already
3. Use BRAT to install this plugin from GitHub

## Setup

1. Open Obsidian Settings > Options > Gemini Chat Integration
2. Enter your API key in the settings
3. Configure your preferred model (default is gemini-2.5-flash-lite)

## Usage

1. Open any note in Obsidian
2. Position your cursor where you want to ask a question
3. Use the command palette to "Send text to Gemini"
4. Type your question after the cursor position
5. The plugin will send the entire note content as context along with your question
6. Gemini's response will be inserted directly below your question

## Configuration

- **API Key**: Your Gemini API key (required)
- **Model**: Choose which Gemini model to use (gemini-2.5-flash-lite, gemini-pro)