/**
 * Audio Utilities for Real-Time Voice Chat
 * Handles microphone capture, audio encoding, and playback
 */

export class AudioRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private audioContext: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private processor: ScriptProcessorNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private isRecording: boolean = false;
    private onDataCallback: ((audioData: ArrayBuffer) => void) | null = null;

    /**
     * Start recording audio from microphone
     * @param onData Callback for audio chunks (PCM16 format)
     */
    async start(onData: (audioData: ArrayBuffer) => void): Promise<void> {
        try {
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000 // 16kHz for better compatibility
                } 
            });

            this.audioContext = new AudioContext({ sampleRate: 16000 });
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            
            // Use ScriptProcessorNode for raw audio processing
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            this.onDataCallback = onData;

            this.processor.onaudioprocess = (e) => {
                if (!this.isRecording) return;

                const inputData = e.inputBuffer.getChannelData(0);
                
                // Convert Float32Array to Int16Array (PCM16)
                const pcm16 = this.floatTo16BitPCM(inputData);
                
                // Send to callback
                if (this.onDataCallback) {
                    this.onDataCallback(pcm16.buffer as ArrayBuffer);
                }
            };

            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
            
            this.isRecording = true;
            console.log('🎤 Audio recording started');

        } catch (error) {
            console.error('❌ Failed to start audio recording:', error);
            throw error;
        }
    }

    /**
     * Stop recording
     */
    stop(): void {
        this.isRecording = false;

        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }

        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        console.log('🎤 Audio recording stopped');
    }

    /**
     * Convert Float32Array to Int16Array (PCM16)
     */
    private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array;
    }

    /**
     * Check if currently recording
     */
    isActive(): boolean {
        return this.isRecording;
    }
}

/**
 * Audio Player for streaming responses
 */
export class AudioPlayer {
    private audioContext: AudioContext | null = null;
    private audioQueue: AudioBuffer[] = [];
    private isPlaying: boolean = false;
    private currentSource: AudioBufferSourceNode | null = null;
    private onSpeakingChange: ((speaking: boolean) => void) | null = null;

    constructor(onSpeakingChange?: (speaking: boolean) => void) {
        this.audioContext = new AudioContext();
        this.onSpeakingChange = onSpeakingChange || null;
    }

    /**
     * Play audio chunk
     * @param audioData PCM16 audio data
     */
    async play(audioData: ArrayBuffer): Promise<void> {
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }

        try {
            // Decode audio buffer
            const audioBuffer = await this.audioContext.decodeAudioData(audioData);
            
            // Add to queue
            this.audioQueue.push(audioBuffer);

            // Start playback if not already playing
            if (!this.isPlaying) {
                this.playNext();
            }
        } catch (error) {
            console.error('❌ Failed to decode audio:', error);
        }
    }

    /**
     * Play next audio chunk in queue
     */
    private playNext(): void {
        if (this.audioQueue.length === 0) {
            this.isPlaying = false;
            if (this.onSpeakingChange) {
                this.onSpeakingChange(false);
            }
            return;
        }

        this.isPlaying = true;
        if (this.onSpeakingChange) {
            this.onSpeakingChange(true);
        }

        const buffer = this.audioQueue.shift();
        if (!buffer || !this.audioContext) return;

        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = buffer;
        this.currentSource.connect(this.audioContext.destination);

        this.currentSource.onended = () => {
            this.playNext();
        };

        this.currentSource.start();
    }

    /**
     * Stop playback
     */
    stop(): void {
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource.disconnect();
            this.currentSource = null;
        }
        this.audioQueue = [];
        this.isPlaying = false;

        if (this.onSpeakingChange) {
            this.onSpeakingChange(false);
        }
    }

    /**
     * Check if currently playing
     */
    isSpeaking(): boolean {
        return this.isPlaying;
    }
}

/**
 * Text-to-Speech using Web Speech API (fallback)
 */
export class TextToSpeech {
    private synthesis: SpeechSynthesis;
    private currentUtterance: SpeechSynthesisUtterance | null = null;

    constructor() {
        this.synthesis = window.speechSynthesis;
    }

    /**
     * Speak text with auto-language detection
     */
    speak(text: string, lang: string = 'en-US', onStart?: () => void, onEnd?: () => void): void {
        // Cancel any ongoing speech
        this.cancel();

        // Detect if text is primarily English or French
        const detectedLang = this.detectLanguage(text);
        const voiceLang = detectedLang || lang;

        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.lang = voiceLang;
        this.currentUtterance.rate = 1.0;
        this.currentUtterance.pitch = 1.0;

        // Try to use a natural, human-like voice
        const voices = this.synthesis.getVoices();
        
        // Prefer Google voices or natural-sounding voices
        let selectedVoice = voices.find(v => 
            v.lang.startsWith(voiceLang.split('-')[0]) && 
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium'))
        );
        
        // Fallback to any voice in the right language
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.startsWith(voiceLang.split('-')[0]));
        }
        
        if (selectedVoice) {
            this.currentUtterance.voice = selectedVoice;
            console.log(`🔊 Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
        }

        this.currentUtterance.onstart = () => {
            if (onStart) onStart();
        };

        this.currentUtterance.onend = () => {
            if (onEnd) onEnd();
        };

        this.synthesis.speak(this.currentUtterance);
    }

    /**
     * Detect language of text (simple detection for English vs French)
     */
    private detectLanguage(text: string): string {
        // Common French words
        const frenchWords = /\b(je|tu|il|elle|nous|vous|ils|elles|le|la|les|un|une|des|et|ou|mais|donc|car|est|sont|avoir|être|dans|pour|avec|sur|par|comment|pourquoi|quoi|qui|que)\b/gi;
        const frenchMatches = (text.match(frenchWords) || []).length;
        
        // If significant French content, use French voice
        if (frenchMatches > 3 || (frenchMatches > 0 && text.split(' ').length < 20)) {
            return 'fr-FR';
        }
        
        return 'en-US';
    }

    /**
     * Cancel current speech
     */
    cancel(): void {
        this.synthesis.cancel();
        this.currentUtterance = null;
    }

    /**
     * Check if speaking
     */
    isSpeaking(): boolean {
        return this.synthesis.speaking;
    }
}
