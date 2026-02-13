# Meeting Minutes AI 🎙️✨

<p align="center">
  <img src="https://github.com/user-attachments/assets/02d62af7-85eb-4eb6-a19e-e25f2502e12b" width="600" alt="meetingminutes">
</p>

Meeting Minutes AI is a professional desktop application that leverages Google's Gemini AI to transcribe and summarize your meetings with high accuracy. 

## Features

- **High-Quality Transcription**: Automatically transcribe your audio recordings using Google Gemini's multimodal capabilities (`gemini-2.5-flash` supported).
- **AI-Powered Summaries**: get concise, structured meeting minutes including key decisions, action items, and structured highlights.
- **Refined Result UI**: Focus on what matters with a toggleable transcript view and side-by-side comparison on wide screens.
- **Audio Management**: Built-in audio player and automatic file import for stable analysis of external recordings.
- **Secure and Private**: Your API key is stored locally, and files are processed securely through your own Google AI Studio credentials.
- **Independent Scrolling**: Study your summary and transcript separately with dedicated scroll areas.

## Getting Started

### Prerequisites

- A [Google AI Studio API Key](https://aistudio.google.com/app/apikey).
- Windows 10 or higher.

### Installation

1. Download the latest installer from the releases page (or use the portable version).
2. Launch the application.
3. On first run, enter your **Google Gemini API Key** in the Settings.
4. Select a preferred AI model (e.g., `gemini-1.5-flash` for speed or `gemini-1.5-pro` for deep analysis).

### Usage

1. **Upload**: Drag and drop an existing audio file (MP3, WAV, WebM) into the workspace.
2. **Record**: Click the 'Record' tab to start a live meeting recording. You can also include system audio.
3. **Analyze**: Select the source audio language and output language, then click **Analyze Meeting**.
4. **Export**: Save your transcript (.txt) and summary (.md) directly to your computer.

## Development

Built with:
- [Electron](https://www.electronjs.org/)
- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [Google Generative AI SDK](https://github.com/google-gemini/generative-ai-js)

## License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Created with ❤️ for global professional productivity.*
