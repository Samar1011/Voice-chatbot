const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { GoogleGenAI } = require('@google/genai');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

console.log('Starting server initialization...');

const app = express();
const port = 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

console.log('Configuring middleware...');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

console.log('Initializing APIs...');

// API Keys and Configuration
const GEMINI_API_KEY = 'AIzaSyD-WrqBfeJu4tNXY7GVC2rrpTgp097XAQ0';
const ELEVENLABS_API_KEY = 'sk_36bd4ce3943a4ff5866c49c402cf9922591ca0e7b708c3b8';
const ELEVENLABS_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';
const ELEVENLABS_TTS_MODEL = 'eleven_flash_v2_5';
const ELEVENLABS_STT_MODEL = 'scribe_v1';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Validate base64 audio data
function isValidBase64(str) {
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch (err) {
    return false;
  }
}

// Clean up temporary files
function cleanupTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
}

// Verify API keys on startup
async function verifyAPIKeys() {
  console.log('Verifying API keys...');
  
  // Verify ElevenLabs API key
  try {
    const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/models', {
      headers: {
        'Accept': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });
    if (!elevenLabsResponse.ok) {
      throw new Error('ElevenLabs API key verification failed');
    }
    await elevenLabsResponse.json();
    console.log('ElevenLabs API key verified successfully');
  } catch (error) {
    console.error('ElevenLabs API key verification failed:', error.message);
  }

  // Verify Gemini API key
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Test message"
    });
    console.log('Gemini API key verified successfully');
  } catch (error) {
    console.error('Gemini API key verification failed:', error.message);
  }
}

console.log('Setting up routes...');

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'Voice Chatbot API is running',
    endpoints: {
      '/': 'This help message',
      '/health': 'Health check endpoint',
      '/process-audio': 'POST endpoint for processing audio'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok' });
});

app.post('/process-audio', async (req, res) => {
  console.log('Received audio processing request');
  let tempFilePath = null;
  
  try {
    const { audio } = req.body;
    
    // Validate audio data
    if (!audio) {
      throw new Error('No audio data received');
    }
    
    if (!isValidBase64(audio)) {
      throw new Error('Invalid audio data format. Expected base64 encoded string.');
    }

    // Step 1: Convert audio to text using ElevenLabs Speech-to-Text
    console.log('Converting speech to text...');
    const audioBuffer = Buffer.from(audio, 'base64');
    
    // Save audio buffer to temporary file
    tempFilePath = path.join(uploadsDir, `audio_${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, audioBuffer);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath));
    formData.append('model_id', ELEVENLABS_STT_MODEL);

    const transcriptionResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: formData
    }).catch(error => {
      console.error('Error in speech-to-text request:', error);
      throw new Error('Failed to connect to ElevenLabs STT service: ' + error.message);
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('Speech-to-text error:', errorText);
      throw new Error(`Failed to transcribe audio: ${errorText}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    if (!transcriptionData.text) {
      throw new Error('No transcription received from ElevenLabs');
    }
    
    const transcription = transcriptionData.text;
    console.log('Transcription:', transcription);

    // Step 2: Get response from Gemini
    console.log('Getting AI response...');
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `You are a helpful and friendly AI assistant. Please respond to the following message in a concise and natural way: ${transcription}`
      });
      const botReply = response.text;
      console.log('Bot reply:', botReply);

      // Step 3: Convert bot reply to speech using ElevenLabs
      console.log('Converting text to speech...');
      const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: botReply,
          model_id: ELEVENLABS_TTS_MODEL,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      }).catch(error => {
        console.error('Error in text-to-speech request:', error);
        throw new Error('Failed to connect to ElevenLabs TTS service: ' + error.message);
      });

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error('Text-to-speech error:', errorText);
        throw new Error(`Failed to convert text to speech: ${errorText}`);
      }

      const responseBuffer = await ttsResponse.buffer();
      const audioBase64 = responseBuffer.toString('base64');
      console.log('Audio response generated successfully');

      res.json({
        transcription,
        botReply,
        audioResponse: audioBase64
      });
    } catch (error) {
      console.error('Error in Gemini or TTS processing:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      error: 'Error processing request',
      details: error.message 
    });
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

// Start server after verifying API keys
verifyAPIKeys().then(() => {
  const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('Server error:', error);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
}); 