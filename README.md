# Voice Chatbot with React and Node.js

A real-time voice chatbot application that allows users to have natural conversations using speech. The application uses React for the frontend, Node.js for the backend, and integrates with ElevenLabs for speech-to-text/text-to-speech and Google's Gemini AI for intelligent responses.

## Features

- 🎤 Real-time voice input capture
- 🤖 AI-powered responses using Google Gemini
- 🗣️ High-quality text-to-speech using ElevenLabs
- ⚡ Low-latency speech-to-text conversion
- 🎯 Natural and context-aware conversations
- 💻 Modern React frontend with intuitive UI

## Tech Stack

- **Frontend:**
  - React
  - Web Speech API
  - Tailwind CSS for styling
  - Audio recording and playback capabilities

- **Backend:**
  - Node.js
  - Express.js
  - ElevenLabs API for speech services
  - Google Gemini AI for natural language processing

## Prerequisites

Before running the application, make sure you have:

1. Node.js installed (v14 or higher)
2. NPM or Yarn package manager
3. API keys for:
   - ElevenLabs
   - Google Gemini AI

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Samar1011/Voice-chatbot.git
   cd Voice-chatbot
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Create `.env` files in both frontend and backend directories with your API keys:

   Backend `.env`:
   ```
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   GEMINI_API_KEY=your_gemini_api_key
   PORT=3001
   ```

## Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. In a new terminal, start the frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Click the microphone button to start recording
2. Speak your message
3. Click again to stop recording
4. Wait for the AI response
5. The response will be played automatically through text-to-speech

## API Endpoints

- `POST /process-audio`: Processes audio input and returns AI response
- `GET /health`: Health check endpoint
- `GET /`: API information

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- ElevenLabs for providing high-quality speech APIs
- Google Gemini AI for natural language processing
- React and Node.js communities for excellent documentation and tools 