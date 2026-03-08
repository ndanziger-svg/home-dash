// Wake word detection + speech recognition
window.VoiceSystem = {
  isListening: false,
  recognition: null,

  init() {
    this.micBtn = document.getElementById('mic-btn');
    this.voiceOverlay = document.getElementById('voice-overlay');
    this.voiceText = document.getElementById('voice-text');

    // Set up Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        this.voiceText.textContent = transcript;

        if (result.isFinal) {
          this.handleCommand(transcript);
        }
      };

      this.recognition.onend = () => {
        this.stopListening();
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          this.voiceText.textContent = 'Could not understand. Try again.';
          setTimeout(() => this.stopListening(), 1500);
        } else {
          this.stopListening();
        }
      };
    }

    // Mic button - tap to talk
    this.micBtn.addEventListener('click', () => {
      if (this.isListening) {
        this.stopListening();
      } else {
        this.startListening();
      }
    });

    // Try to set up Porcupine wake word (if available)
    this.initWakeWord();
  },

  async initWakeWord() {
    try {
      const configRes = await fetch('/api/config');
      const config = await configRes.json();

      if (!config.picovoiceAccessKey) {
        console.log('Porcupine: No access key configured, using tap-to-talk only');
        return;
      }

      // Porcupine Web SDK would be loaded here
      // For now, using tap-to-talk as the primary method
      // To enable wake word, add Porcupine SDK and configure a custom wake word
      console.log('Porcupine: Wake word support ready (SDK not yet loaded)');
    } catch (err) {
      console.warn('Wake word init failed:', err);
    }
  },

  startListening() {
    if (!this.recognition) {
      window.App.showFeedback('Speech recognition not supported in this browser');
      return;
    }

    this.isListening = true;
    this.micBtn.classList.add('listening');
    this.voiceOverlay.classList.remove('hidden');
    this.voiceText.textContent = 'Listening...';

    try {
      this.recognition.start();
    } catch (err) {
      // May already be started
      console.warn('Recognition start error:', err);
    }
  },

  stopListening() {
    this.isListening = false;
    this.micBtn.classList.remove('listening');
    this.voiceOverlay.classList.add('hidden');

    try {
      this.recognition?.stop();
    } catch { /* ignore */ }
  },

  async handleCommand(transcript) {
    this.voiceText.textContent = transcript;

    // Brief pause so user can see what was heard
    await new Promise(r => setTimeout(r, 800));
    this.stopListening();

    const command = window.VoiceCommands.parse(transcript);
    await window.VoiceCommands.execute(command);
  },
};
