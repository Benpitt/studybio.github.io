/**
 * Text-to-Speech Button Component
 * A reusable TTS button that can be added to any page
 * Enhanced with pause/resume, voice selection, and visual feedback
 */

class TTSButton {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.isSpeaking = false;
        this.isPaused = false;
        this.enabled = true;
        this.voices = [];
        this.currentText = '';
        this.currentWord = 0;

        // Options
        this.rate = options.rate || 1.0;
        this.pitch = options.pitch || 1.0;
        this.volume = options.volume || 1.0;
        this.voice = options.voice || null;
        this.buttonClass = options.buttonClass || 'tts-btn';
        this.autoShow = options.autoShow !== false; // Show by default
        this.highlightWords = options.highlightWords !== false;
        this.showControls = options.showControls !== false;

        this.init();
    }

    init() {
        // Check if TTS should be enabled based on learning profile
        if (typeof getPersonalizedSettings !== 'undefined') {
            const settings = getPersonalizedSettings();
            this.enabled = settings && settings.enableTextToSpeech;
        }

        // Load voices
        this.loadVoices();

        // Load saved settings
        this.loadSettings();

        if (this.enabled && this.autoShow) {
            this.createButton();
        }
    }

    loadVoices() {
        // Voices may not be loaded immediately in some browsers
        const loadVoicesWhenAvailable = () => {
            this.voices = this.synth.getVoices();

            if (this.voices.length > 0) {
                // Select a good default voice if none selected
                if (!this.voice) {
                    // Prefer English voices, prioritize high-quality ones
                    const preferredVoice = this.voices.find(v =>
                        v.lang.startsWith('en') && (v.name.includes('Enhanced') || v.name.includes('Premium') || v.name.includes('Google'))
                    ) || this.voices.find(v => v.lang.startsWith('en'));

                    if (preferredVoice) {
                        this.voice = preferredVoice;
                    }
                }
            }
        };

        loadVoicesWhenAvailable();

        // Chrome loads voices asynchronously
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoicesWhenAvailable;
        }
    }

    loadSettings() {
        const ttsSettings = JSON.parse(localStorage.getItem('ttsSettings') || '{}');
        this.rate = ttsSettings.rate || this.rate;
        this.pitch = ttsSettings.pitch || this.pitch;
        this.volume = ttsSettings.volume || this.volume;

        if (ttsSettings.voiceName && this.voices.length > 0) {
            const savedVoice = this.voices.find(v => v.name === ttsSettings.voiceName);
            if (savedVoice) {
                this.voice = savedVoice;
            }
        }
    }

    saveSettings() {
        const settings = {
            rate: this.rate,
            pitch: this.pitch,
            volume: this.volume,
            voiceName: this.voice ? this.voice.name : null
        };
        localStorage.setItem('ttsSettings', JSON.stringify(settings));
    }

    createButton() {
        // Create button container with controls
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'tts-button-container';
        buttonContainer.style.cssText = 'display: inline-flex; align-items: center; gap: 4px;';

        // Main play/pause button
        const button = document.createElement('button');
        button.className = this.buttonClass;
        button.innerHTML = '<i class="fas fa-volume-up"></i>';
        button.setAttribute('aria-label', 'Read aloud');
        button.setAttribute('title', 'Read aloud');

        // Default styling if no custom class
        if (this.buttonClass === 'tts-btn') {
            button.style.cssText = `
                background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
                border: none;
                color: white;
                padding: 8px 12px;
                border-radius: 12px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
            `;

            button.addEventListener('mouseenter', () => {
                button.style.transform = 'scale(1.05)';
                button.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.5)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'scale(1)';
                button.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
            });
        }

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        });

        this.button = button;
        buttonContainer.appendChild(button);

        // Add pause button (shown only when speaking)
        if (this.showControls) {
            const pauseButton = document.createElement('button');
            pauseButton.className = 'tts-pause-btn';
            pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
            pauseButton.setAttribute('aria-label', 'Pause');
            pauseButton.setAttribute('title', 'Pause');
            pauseButton.style.cssText = `
                background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                border: none;
                color: white;
                padding: 8px 12px;
                border-radius: 12px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
                display: none;
            `;

            pauseButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.togglePause();
            });

            this.pauseButton = pauseButton;
            buttonContainer.appendChild(pauseButton);
        }

        this.container.appendChild(buttonContainer);

        return button;
    }

    speak(text, options = {}) {
        if (!this.enabled || !text) return;

        // Clean and prepare text
        this.currentText = this.prepareText(text);

        // Cancel any ongoing speech
        this.synth.cancel();
        this.isPaused = false;

        this.utterance = new SpeechSynthesisUtterance(this.currentText);
        this.utterance.rate = options.rate || this.rate;
        this.utterance.pitch = options.pitch || this.pitch;
        this.utterance.volume = options.volume || this.volume;

        if (this.voice) {
            this.utterance.voice = this.voice;
        }

        // Enhanced callbacks
        this.utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateButtonState();
        };

        this.utterance.onend = () => {
            this.isSpeaking = false;
            this.isPaused = false;
            this.updateButtonState();
        };

        this.utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.isSpeaking = false;
            this.isPaused = false;
            this.updateButtonState();
        };

        // Boundary event for word highlighting
        if (this.highlightWords) {
            this.utterance.onboundary = (event) => {
                if (event.name === 'word') {
                    this.currentWord = event.charIndex;
                    this.highlightCurrentWord();
                }
            };
        }

        this.synth.speak(this.utterance);
    }

    prepareText(text) {
        // Clean up text for better speech quality
        let cleaned = text.trim();

        // Remove multiple spaces
        cleaned = cleaned.replace(/\s+/g, ' ');

        // Handle common abbreviations
        cleaned = cleaned.replace(/\bDr\./g, 'Doctor');
        cleaned = cleaned.replace(/\bMr\./g, 'Mister');
        cleaned = cleaned.replace(/\bMrs\./g, 'Missus');
        cleaned = cleaned.replace(/\be\.g\./g, 'for example');
        cleaned = cleaned.replace(/\bi\.e\./g, 'that is');

        // Handle mathematical expressions (basic)
        cleaned = cleaned.replace(/\+/g, ' plus ');
        cleaned = cleaned.replace(/\-/g, ' minus ');
        cleaned = cleaned.replace(/\×/g, ' times ');
        cleaned = cleaned.replace(/\÷/g, ' divided by ');
        cleaned = cleaned.replace(/\=/g, ' equals ');

        return cleaned;
    }

    highlightCurrentWord() {
        // This can be overridden for custom highlighting behavior
        // Default implementation does nothing
    }

    stop() {
        this.synth.cancel();
        this.isSpeaking = false;
        this.isPaused = false;
        this.updateButtonState();
    }

    pause() {
        if (this.isSpeaking && !this.isPaused) {
            this.synth.pause();
            this.isPaused = true;
            this.updateButtonState();
        }
    }

    resume() {
        if (this.isPaused) {
            this.synth.resume();
            this.isPaused = false;
            this.updateButtonState();
        }
    }

    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    updateButtonState() {
        if (!this.button) return;

        if (this.isSpeaking && !this.isPaused) {
            this.button.innerHTML = '<i class="fas fa-stop"></i>';
            this.button.setAttribute('aria-label', 'Stop reading');
            this.button.setAttribute('title', 'Stop reading');

            if (this.pauseButton) {
                this.pauseButton.style.display = 'block';
                this.pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
                this.pauseButton.setAttribute('aria-label', 'Pause');
            }
        } else if (this.isPaused) {
            this.button.innerHTML = '<i class="fas fa-stop"></i>';
            this.button.setAttribute('aria-label', 'Stop reading');
            this.button.setAttribute('title', 'Stop reading');

            if (this.pauseButton) {
                this.pauseButton.innerHTML = '<i class="fas fa-play"></i>';
                this.pauseButton.setAttribute('aria-label', 'Resume');
            }
        } else {
            this.button.innerHTML = '<i class="fas fa-volume-up"></i>';
            this.button.setAttribute('aria-label', 'Read aloud');
            this.button.setAttribute('title', 'Read aloud');

            if (this.pauseButton) {
                this.pauseButton.style.display = 'none';
            }
        }
    }

    toggle() {
        if (this.isSpeaking) {
            this.stop();
        } else {
            // Get text from parent element
            const textElement = this.container.querySelector('[data-tts-text]') || this.container;
            const text = textElement.getAttribute('data-tts-text') || textElement.textContent;
            this.speak(text);
        }
    }

    setVoice(voice) {
        this.voice = voice;
        this.saveSettings();
    }

    setRate(rate) {
        this.rate = rate;
        this.saveSettings();
    }

    setPitch(pitch) {
        this.pitch = pitch;
        this.saveSettings();
    }

    setVolume(volume) {
        this.volume = volume;
        this.saveSettings();
    }

    getVoices() {
        return this.voices;
    }

    getQualityVoices() {
        // Filter for higher quality voices
        return this.voices.filter(v =>
            v.name.includes('Enhanced') ||
            v.name.includes('Premium') ||
            v.name.includes('Google') ||
            v.name.includes('Microsoft') ||
            !v.name.includes('eSpeak')
        );
    }

    destroy() {
        this.stop();
        if (this.button && this.button.parentNode) {
            this.button.parentNode.removeChild(this.button);
        }
    }

    updateText(text) {
        // If currently speaking, restart with new text
        if (this.isSpeaking) {
            this.stop();
            this.speak(text);
        }
    }
}

// Helper function to easily add TTS to any element
function addTTSButton(element, text, options = {}) {
    // Check if user profile supports TTS
    if (typeof getPersonalizedSettings !== 'undefined') {
        const settings = getPersonalizedSettings();
        if (!settings || !settings.enableTextToSpeech) {
            return null; // Don't create button if not enabled for user
        }
    }

    // Create container for TTS button
    const container = document.createElement('div');
    container.style.cssText = 'display: inline-block; margin-left: 8px; vertical-align: middle;';
    container.setAttribute('data-tts-text', text);

    // Insert after the element
    if (element.nextSibling) {
        element.parentNode.insertBefore(container, element.nextSibling);
    } else {
        element.parentNode.appendChild(container);
    }

    const ttsButton = new TTSButton(container, options);
    return ttsButton;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TTSButton, addTTSButton };
}
