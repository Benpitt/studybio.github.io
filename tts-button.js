/**
 * Text-to-Speech Button Component
 * A reusable TTS button that can be added to any page
 */

class TTSButton {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.isSpeaking = false;
        this.enabled = true;

        // Options
        this.rate = options.rate || 1.0;
        this.pitch = options.pitch || 1.0;
        this.volume = options.volume || 1.0;
        this.voice = options.voice || null;
        this.buttonClass = options.buttonClass || 'tts-btn';
        this.autoShow = options.autoShow !== false; // Show by default

        this.init();
    }

    init() {
        // Check if TTS should be enabled based on learning profile
        if (typeof getPersonalizedSettings !== 'undefined') {
            const settings = getPersonalizedSettings();
            this.enabled = settings && settings.enableTextToSpeech;
        }

        if (this.enabled && this.autoShow) {
            this.createButton();
        }
    }

    createButton() {
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
                border-radius: 8px;
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
        this.container.appendChild(button);

        return button;
    }

    speak(text) {
        if (!this.enabled || !text) return;

        // Cancel any ongoing speech
        this.synth.cancel();

        this.utterance = new SpeechSynthesisUtterance(text);
        this.utterance.rate = this.rate;
        this.utterance.pitch = this.pitch;
        this.utterance.volume = this.volume;

        if (this.voice) {
            this.utterance.voice = this.voice;
        }

        this.utterance.onstart = () => {
            this.isSpeaking = true;
            if (this.button) {
                this.button.innerHTML = '<i class="fas fa-stop"></i>';
                this.button.setAttribute('aria-label', 'Stop reading');
                this.button.setAttribute('title', 'Stop reading');
            }
        };

        this.utterance.onend = () => {
            this.isSpeaking = false;
            if (this.button) {
                this.button.innerHTML = '<i class="fas fa-volume-up"></i>';
                this.button.setAttribute('aria-label', 'Read aloud');
                this.button.setAttribute('title', 'Read aloud');
            }
        };

        this.synth.speak(this.utterance);
    }

    stop() {
        this.synth.cancel();
        this.isSpeaking = false;
        if (this.button) {
            this.button.innerHTML = '<i class="fas fa-volume-up"></i>';
            this.button.setAttribute('aria-label', 'Read aloud');
            this.button.setAttribute('title', 'Read aloud');
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
