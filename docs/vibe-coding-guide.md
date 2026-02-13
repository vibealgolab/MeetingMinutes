# 🤖 The Vibe Coding Manifesto: Building Meeting Minutes AI

Welcome to the future of software development. **Vibe Coding** is a paradigm shift where your primary tool isn't a keyboard, but your **intent**. This guide will show you how to build the "Meeting Minutes AI" app from scratch using only AI agentic coding assistants.

---

## � Table of Contents
1. [What is Vibe Coding?](#-what-is-vibe-coding)
2. [Prerequisites](#-prerequisites)
3. [Phase 1: The Blueprint (Initialization)](#phase-1-the-blueprint-initialization)
4. [Phase 2: The UI Canvas (Design)](#phase-2-the-ui-canvas-design)
5. [Phase 3: The Brain (Gemini AI Integration)](#phase-3-the-brain-gemini-ai-integration)
6. [Phase 4: The Polishing (Iterative Debugging)](#phase-4-the-polishing-iterative-debugging)
7. [Phase 5: The Delivery (Packaging)](#phase-5-the-delivery-packaging)
8. [Expert Vibe-Coding Tips](#-expert-vibe-coding-tips)

---

## 💡 What is Vibe Coding?

Vibe Coding is about **Agentic Programming**. You act as the **Product Manager and Architect**, while the AI performs as the **Senior Lead Developer**. You don't write code; you communicate the "vibe"—the desired outcome, the aesthetic, and the functional logic.

---

## 🛠 Prerequisites

Before starting, ensure you have:
- **Node.js**: The engine that runs React and Electron.
- **VS Code**: Your canvas.
- **An Agentic AI**: (e.g., Antigravity, Claude Engineer, Cursor) that can natively read/write project files.
- **Gemini API Key**: Get it at [aistudio.google.com](https://aistudio.google.com/).

---

## Phase 1: The Blueprint (Initialization)

**Goal**: Create a modern desktop app shell.

**Prompt to your AI Agent:**
> "Create a modern desktop application using **Vite**, **React**, and **Electron**. Use a dark theme by default. Install the following libraries: `lucide-react` for icons, `react-markdown` for showing results, and `@google/generative-ai` for the AI connection. Set up a clean folder structure with `electron/` for main processes and `src/` for the UI."

---

## Phase 2: The UI Canvas (Design)

**Goal**: Create a premium, state-of-the-art interface.

**Prompt to your AI Agent:**
> "Design a premium 'Meeting Minutes AI' dashboard. The layout should be split: 
> - **Left Panel**: Audio player, file upload zone, and language selection.
> - **Right Panel**: A scrollable AI Summary card.
> Apply a **Glassmorphism** style with subtle gradients, rounded corners, and smooth hover animations. Use a deep navy and electric blue color palette. Make sure it looks like a high-end SaaS product, not a simple MVP."

---

## Phase 3: The Brain (Gemini AI Integration)

**Goal**: Make the app actually "think."

**Prompt to your AI Agent:**
> "Implement the AI logic using the **Gemini 2.5 Flash** model. Create a service that uploads an audio file to Gemini and performs two distinct steps:
> 1. **Transcription**: Convert the whole audio to text.
> 2. **Summarization**: Generate structured meeting minutes (Key points, Action Items, Decisions).
> Provide a callback for progress updates (e.g., 'Transcribing...', 'Summarizing...') so the user knows what's happening."

---

## Phase 4: The Polishing (Iterative Debugging)

**Goal**: Fix the inevitable "vibe-breaks" (errors).

**Prompt Example for Errors:**
> "I'm getting an `ENOENT` error when I try to upload external files. I suspect it's because Electron can't access the file path directly. Can you modify the app so it first **imports (copies)** any selected file into a local `Recordings/` folder within the app directory before sending it to Gemini? This will ensure the path is always stable."

---

## Phase 5: The Delivery (Packaging)

**Goal**: Turn your code into a `.exe` file for users.

**Prompt to your AI Agent:**
> "Configure `electron-builder` to package this app for Windows. I need two versions: a **Setup Installer (.exe)** and a **Portable version** that runs without installation. Make sure the 'Recordings' folder is handled correctly so files aren't lost when the app updates."

---

## 🌟 Expert Vibe-Coding Tips

1.  **Be Explicit about Aesthetics**: Use words like "Premium," "Professional," "Sleek," and "Modern." If it looks basic, tell the AI: *"The UI looks too generic. Add micro-interactions and better spacing to make it feel expensive."*
2.  **Iterate on Logic**: If the summary is too short, say: *"The AI summary is too brief. Change the prompt to Gemini to include a detailed breakdown of speaker intentions."*
3.  **Trust but Verify**: Always ask the AI to run `npm run lint` or check the build status to ensure the code is production-ready.

---
*Created with ❤️ for the Vibe Coding Community. Let's build the future together.*
