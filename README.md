# 👓 ReadEase - Assistive Typography & AI Reading Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Accessibility: WCAG AAA Ready](https://img.shields.io/badge/Accessibility-WCAG%20AAA%20Ready-6366f1?style=for-the-badge)](https://www.w3.org/WAI/standards-guidelines/wcag/)

> **ReadEase** is an open-source assistive typography studio and reading workspace built to make digital reading effortless for everyone—including neurodivergent readers, individuals with dyslexia or ADHD, language learners, and people with visual sensitivities.

---

## 🌟 Core Features

| Feature | Description | Why It Helps |
| :--- | :--- | :--- |
| 📖 **Dyslexia Mode** | Activates the `OpenDyslexic` typeface with weighted baselines, generous line height, and custom letter tracking. | Prevents letter rotation/inversion and reduces visual crowding. |
| 🎯 **Bionic Reading** | Dynamically bolds the initial syllables/fixations of words across sentences. | Guides saccadic eye movements, reducing cognitive fatigue and boosting reading speed. |
| 📏 **Interactive Reading Ruler** | A cursor-following focus bar with gentle contrast styling. | Prevents accidental line skipping and aids readers with ADHD or focus difficulties. |
| 🔤 **Typography Engine** | Custom selection of accessibility fonts (`OpenDyslexic`, `Roboto`, `Nunito`, `Comic Sans MS`, `Georgia`). | Allows readers to customize letterforms for maximum visual comfort. |
| 🌐 **Live Multilingual Translation** | Instant AI-powered translation between **English, हिन्दी (Hindi), Español, Français, and Deutsch**. | Enables readers to translate any pasted text into their native language instantly. |
| 🔊 **ElevenLabs AI Speech + Live Highlighter** | Ultra-realistic neural speech with millisecond word timestamps and a vibrant yellow word highlighter. | Reinforces reading comprehension across native languages through multi-sensory audio-visual engagement. |
| ☀️ **Clean White Ergonomic UI** | High-contrast, clean white design with crisp slate typography and gentle warm themes. | Maximum readability with zero glare. |

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Setup Environment
In the root directory, create a `.env` file (or verify your existing one):
```env
PORT=10000
COHERE_API_KEY=your_cohere_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

### 2. Start the Backend Server
```bash
npm install
npm run dev
```
The server will start on `http://localhost:10000`.

### 3. Start the Web Studio Frontend
In a second terminal window (or via root script):
```bash
npm run web:dev
```
Open **`http://localhost:5173`** in your browser.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Alt + S` | Toggle Listen (Play / Pause speech) |
| `Alt + D` | Toggle Dyslexia Mode (OpenDyslexic font) |
| `Alt + B` | Toggle Bionic Reading |

---

## 📄 License
MIT License. Open source and accessible for all readers.