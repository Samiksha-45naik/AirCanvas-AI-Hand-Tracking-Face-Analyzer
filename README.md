# 🎨 AirCanvas AI – Hand Tracking & Facial Expression Analyzer

AirCanvas AI is a real-time computer vision project that allows users to draw in the air using hand gestures while simultaneously detecting facial expressions and sending notifications based on emotions.

This project combines **Hand Tracking**, **Gesture Recognition**, and **Facial Emotion Detection** to create an interactive and intelligent system using AI.

## ✨ Features

- ✋ Real-time Hand Tracking using AI
- 🎨 Air Drawing (draw on screen using finger movements)
- 😀 Facial Expression Detection (happy, sad, angry, etc.)
- 🔔 Emotion-based Notifications
- ⚡ Smooth and responsive gesture control
- 🎥 Works with webcam (no extra hardware required)

## 🧠 Tech Stack
- Python
- OpenCV
- MediaPipe
- TensorFlow / Deep Learning (for emotion detection)

## 🚀 Use Cases
- Virtual drawing / Air canvas
- Gesture-based UI systems
- Emotion-aware applications
- Interactive AI demos and projects
- 
## note
due to large file size only important files have been uploaded.
## 📁 Project Structure
HANDANALYZER/
│
├── client/                     # Frontend (React + Vite)
│   ├── dist/                   # Production build (ignored in Git)
│   ├── node_modules/           # Dependencies (ignored in Git)
│   ├── public/                 # Static assets
│   │   └── favicon.svg
│   │
│   ├── src/                    # Main React source code
│   │   ├── assets/             # Images and static files
│   │   ├── components/         # Reusable UI components
│   │   ├── utils/              # Helper functions
│   │   ├── App.jsx             # Root component
│   │   ├── main.jsx            # Entry point
│   │   ├── index.css           # Global styles
│   │   └── styles.css          # Custom styles
│   │
│   ├── index.html              # HTML template
│   ├── package.json            # Project dependencies
│   ├── package-lock.json
│   ├── vite.config.js          # Vite configuration
│   ├── eslint.config.js        # Linting rules
│   └── .gitignore
│
├── server/                     # Backend (Node.js)
│   ├── node_modules/           # Dependencies (ignored in Git)
│   ├── index.js                # Backend entry point
│   ├── package.json
│   └── package-lock.json
│
├── ai-fire-drawing/            # AI Module (Python)
│   ├── main.py                 # Main AI execution script
│   ├── hand_tracking/          # Hand gesture detection
│   ├── face_detection/         # Facial expression detection
│   ├── drawing/                # Air drawing logic
│   ├── models/                 # Trained models (ignored in Git)
│   ├── requirements.txt        # Python dependencies
│   └── README.md               # AI module documentation
│
├── README.md                   # Main project documentation
└── .gitignore                  # Ignored files

## 🧠 Architecture Overview

This project is divided into three main modules:
- **Frontend (client)**  
  Built with React and Vite, responsible for user interaction and displaying outputs like drawings and notifications.
- **Backend (server)**  
  Developed using Node.js, handles API communication and connects the frontend with the AI module.
- **AI Module (ai-fire-drawing)**  
  Python-based system that performs:
  - Hand Tracking for gesture recognition  
  - Air Drawing using finger movements  
  - Facial Expression Detection for emotion analysis  

All modules work together to provide a real-time AI-powered interactive experience.

## 🔄 Workflow

1. Webcam captures live video input  
2. AI module processes:
   - Hand gestures → for drawing in air  
   - Facial expressions → for emotion detection  
3. Backend manages communication between frontend and AI  
4. Frontend displays the drawing and emotion-based notifications.
   
## ⚙️ Installation & Setup

Follow these steps to run the project locally on your system.

### 📌 Prerequisites

Make sure you have installed:
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)
## 🚀 1. Clone the Repository
```bash
git clone https://github.com/your-username/aircanvas-ai.git
cd aircanvas-ai.

setup frontend (client)
cd server
npm install
npm start

setup backend (server)
cd server
npm install
npm start





