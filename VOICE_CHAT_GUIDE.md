# Voice Chat Setup Guide

## Overview
This guide explains how to set up real-time voice chat with your Norlava avatar using Gemini 2.0 Flash.

## Features
- ✅ Real-time bidirectional voice conversation
- ✅ Speech-to-text and text-to-speech
- ✅ Maintains all existing features (facts, questions, history)
- ✅ WebSocket-based audio streaming
- ✅ Hybrid mode (voice + text)

## Prerequisites
- Gemini API Key with access to Gemini 2.0 Flash
- Modern browser with Web Audio API support
- Microphone access

## Environment Variables

Add these to your `.env` file:

```bash
# Gemini API Key (required)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Use simulated AI for testing
SIMULATED_AI=false
```

## How to Use

### 1. Start the Application

**Backend:**
```bash
npm run server
```

**Frontend:**
```bash
npm run dev
```

### 2. Enable Voice Mode

1. Navigate to any profile page (e.g., `/interact/username`)
2. Click the **"START VOICE"** button in the top-right
3. Grant microphone permissions when prompted
4. Wait for "🟢 LIVE" status indicator

### 3. Have a Conversation

**Voice Input:**
- Simply speak naturally - your audio is streamed in real-time
- The avatar will respond with voice

**Text Input (Hybrid Mode):**
- You can also type messages while in voice mode
- Use the text input at the bottom of the voice overlay

### 4. End Voice Mode

- Click **"END CONNECTION"** or the X button
- Your conversation history is saved automatically

## Architecture

### Frontend (`src/pages/Interact.tsx`)
- **Audio Capture:** Uses `AudioRecorder` class to capture microphone input
- **Audio Processing:** Converts to PCM16 format and sends via WebSocket
- **Text-to-Speech:** Uses Web Speech API for avatar responses
- **Real-time UI:** Updates conversation in real-time

### Backend (`server/index.ts`)
- **WebSocket Handlers:**
  - `start-voice-session` - Initialize Gemini Live session
  - `voice-audio-chunk` - Process incoming audio
  - `voice-text-input` - Handle text in voice mode
  - `end-voice-session` - Cleanup

### Gemini Live Service (`server/services/gemini-live.ts`)
- **Session Management:** Maintains conversation context
- **Streaming:** Real-time response generation
- **Adaptive Learning:** Extracts facts and questions automatically
- **Database Integration:** Saves all interactions

## Technical Details

### Audio Format
- **Sample Rate:** 16kHz
- **Encoding:** PCM16 (16-bit Linear PCM)
- **Channels:** Mono
- **Chunk Size:** 4096 samples

### API Integration
- **Model:** `gemini-2.0-flash-exp`
- **Mode:** Streaming with multimodal support
- **Context:** Includes conversation history + AI persona

### Data Flow
```
User Mic → AudioRecorder → WebSocket → Server
                                         ↓
                                    Gemini API
                                         ↓
                                   Text Response
                                         ↓
Server → WebSocket → Frontend → Text-to-Speech → User
                        ↓
                   UI Update + DB Save
```

## Features Preserved

All existing features work seamlessly in voice mode:

1. **Fact Learning:** Avatar learns facts about itself from conversations
2. **Question Tracking:** Visitor questions are saved for host review
3. **Conversation History:** Full chat history maintained
4. **Training Mode:** Host can see all learning in real-time
5. **Multi-language:** i18n support continues to work

## Troubleshooting

### "Microphone access denied"
- Check browser permissions
- Ensure HTTPS connection (required for getUserMedia)
- Try refreshing the page

### "Failed to initialize voice session"
- Verify `GEMINI_API_KEY` is set correctly
- Check server logs for API errors
- Ensure you have access to Gemini 2.0 Flash

### "No audio playback"
- Check browser audio settings
- Ensure device volume is not muted
- Try a different browser

### "Choppy or delayed audio"
- Check internet connection stability
- Reduce buffer size in `audio-utils.ts` if needed
- Consider upgrading server resources

## Performance Tips

1. **Reduce Latency:**
   - Use smaller audio chunk sizes
   - Deploy server closer to users
   - Enable HTTP/2 on server

2. **Improve Quality:**
   - Use higher sample rate (24kHz)
   - Enable noise suppression
   - Test different voice models

3. **Optimize Costs:**
   - Cache common responses
   - Use token limits
   - Implement rate limiting

## Future Enhancements

- [ ] Audio-to-audio mode (skip TTS)
- [ ] Voice cloning for personalized avatar voice
- [ ] Interrupt detection
- [ ] Background noise cancellation
- [ ] Multi-language voice detection
- [ ] Voice emotion analysis

## Support

For issues or questions, check:
- Server logs: `npm run server` output
- Browser console: F12 → Console
- Network tab: Check WebSocket connection

## License
Part of the Norlava/Voxterna project.
