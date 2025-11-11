/**
 * Learning Profile Utilities
 * Manages learning profile data stored in local storage
 * All data is stored locally and never uploaded to any server
 */

// Get the user's learning profile from local storage
function getLearningProfile() {
    try {
        const profileData = localStorage.getItem('learningProfile');
        if (profileData) {
            return JSON.parse(profileData);
        }
        return null;
    } catch (error) {
        console.error('Error reading learning profile:', error);
        return null;
    }
}

// Save learning profile to local storage
function saveLearningProfile(profile) {
    try {
        localStorage.setItem('learningProfile', JSON.stringify(profile));
        return true;
    } catch (error) {
        console.error('Error saving learning profile:', error);
        return false;
    }
}

// Delete learning profile
function deleteLearningProfile() {
    try {
        localStorage.removeItem('learningProfile');
        return true;
    } catch (error) {
        console.error('Error deleting learning profile:', error);
        return false;
    }
}

// Check if user has completed the learning profile quiz
function hasLearningProfile() {
    return getLearningProfile() !== null;
}

// Get learning style (visual, auditory, kinesthetic, mixed)
function getLearningStyle() {
    const profile = getLearningProfile();
    return profile?.learningStyle || null;
}

// Check if user has a specific challenge
function hasChallenge(challengeType) {
    const profile = getLearningProfile();
    if (!profile || !profile.challenges) return false;
    return profile.challenges.some(c => c.type === challengeType);
}

// Get challenge level (mild, moderate, high)
function getChallengeLevel(challengeType) {
    const profile = getLearningProfile();
    if (!profile || !profile.challenges) return null;
    const challenge = profile.challenges.find(c => c.type === challengeType);
    return challenge?.level || null;
}

// Get all challenges
function getChallenges() {
    const profile = getLearningProfile();
    return profile?.challenges || [];
}

// Recommendations based on profile
function getRecommendations() {
    const profile = getLearningProfile();
    if (!profile) return null;

    const recommendations = {
        studyModes: [],
        features: [],
        tips: []
    };

    // Learning style recommendations
    switch (profile.learningStyle) {
        case 'visual':
            recommendations.studyModes.push('flashcards', 'matching', 'diagrams');
            recommendations.features.push('color-coding', 'visual-aids', 'mind-maps');
            recommendations.tips.push('Use color-coded notes and visual flashcards');
            recommendations.tips.push('Try the matching game for visual memory');
            break;
        case 'auditory':
            recommendations.studyModes.push('audio-quiz', 'read-aloud', 'discussion');
            recommendations.features.push('text-to-speech', 'audio-playback', 'verbal-explanations');
            recommendations.tips.push('Use text-to-speech to hear questions read aloud');
            recommendations.tips.push('Try discussing concepts out loud');
            break;
        case 'kinesthetic':
            recommendations.studyModes.push('practice-test', 'speed-challenge', 'interactive');
            recommendations.features.push('hands-on', 'interactive-exercises', 'physical-breaks');
            recommendations.tips.push('Take short breaks to move around while studying');
            recommendations.tips.push('Try the speed challenge for active learning');
            break;
        case 'mixed':
            recommendations.studyModes.push('flashcards', 'practice-test', 'audio-quiz');
            recommendations.features.push('variety', 'multi-modal');
            recommendations.tips.push('Use a variety of study methods for best results');
            break;
    }

    // Challenge-based recommendations
    const challenges = profile.challenges || [];

    challenges.forEach(challenge => {
        switch (challenge.type) {
            case 'focus':
                recommendations.features.push('distraction-free-mode', 'focus-timer', 'break-reminders');
                recommendations.tips.push('Enable distraction-free mode for better focus');
                recommendations.tips.push('Use shorter study sessions with breaks');
                if (challenge.level === 'high' || challenge.level === 'moderate') {
                    recommendations.tips.push('Try the Pomodoro technique: 25 min study, 5 min break');
                }
                break;
            case 'reading':
                recommendations.features.push('text-to-speech', 'larger-fonts', 'dyslexia-friendly-fonts');
                recommendations.tips.push('Use text-to-speech to listen to questions');
                recommendations.tips.push('Adjust font size in settings for easier reading');
                break;
            case 'processing':
                recommendations.features.push('untimed-mode', 'extra-time');
                recommendations.tips.push('Take your time - no rush!');
                break;
            case 'memory':
                recommendations.features.push('review-mode', 'flashcards');
                recommendations.tips.push('Review challenging cards more frequently');
                break;
            case 'organization':
                recommendations.features.push('study-planner', 'task-lists', 'reminders');
                recommendations.tips.push('Use study reminders to stay on track');
                recommendations.tips.push('Organize cards into clear categories');
                break;
            case 'timeManagement':
                recommendations.features.push('time-tracker', 'session-goals', 'progress-tracking');
                recommendations.tips.push('Set time limits for study sessions');
                recommendations.tips.push('Track your progress to stay motivated');
                break;
        }
    });

    return recommendations;
}

// Check if a study mode is recommended for the user
function isRecommendedMode(modeName) {
    const recommendations = getRecommendations();
    if (!recommendations) return false;
    return recommendations.studyModes.includes(modeName);
}

// Check if a feature is recommended for the user
function isRecommendedFeature(featureName) {
    const recommendations = getRecommendations();
    if (!recommendations) return false;
    return recommendations.features.includes(featureName);
}

// Get RECOMMENDED settings based on profile (not auto-applied)
function getRecommendedSettings() {
    const profile = getLearningProfile();
    if (!profile) return null;

    const settings = {
        // UI Preferences
        enableTextToSpeech: profile.learningStyle === 'auditory' || hasChallenge('reading'),
        showVisualAids: profile.learningStyle === 'visual',
        enableBreakReminders: hasChallenge('focus') || profile.learningStyle === 'kinesthetic',

        // Distraction settings
        distractionFreeMode: getChallengeLevel('focus') === 'high' || getChallengeLevel('focus') === 'moderate',
        reduceAnimations: hasChallenge('focus'),
        hideTimers: hasChallenge('timeManagement') && getChallengeLevel('timeManagement') === 'high',

        // Content settings
        largerFonts: hasChallenge('reading'),
        extraTime: hasChallenge('processing'),
        untimedMode: getChallengeLevel('processing') === 'high',

        // Learning approach
        enableBreakReminders: hasChallenge('focus') || profile.learningStyle === 'kinesthetic',

        // Recommended modes
        recommendedModes: getRecommendations()?.studyModes || []
    };

    return settings;
}

// Get user's CONFIRMED preferences (what they've actually chosen to enable)
function getUserPreferences() {
    try {
        const prefs = localStorage.getItem('userPreferences');
        if (prefs) {
            return JSON.parse(prefs);
        }
        // Return default preferences (nothing enabled)
        return {
            enableTextToSpeech: false,
            showVisualAids: false,
            enableBreakReminders: false,
            distractionFreeMode: false,
            reduceAnimations: false,
            hideTimers: false,
            largerFonts: false,
            extraTime: false,
            untimedMode: false,
            enableBreakReminders: false
        };
    } catch (error) {
        console.error('Error reading user preferences:', error);
        return null;
    }
}

// Save user's confirmed preferences
function saveUserPreferences(preferences) {
    try {
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
        return true;
    } catch (error) {
        console.error('Error saving user preferences:', error);
        return false;
    }
}

// Update a specific preference
function updatePreference(key, value) {
    const prefs = getUserPreferences() || {};
    prefs[key] = value;
    return saveUserPreferences(prefs);
}

// Get personalized settings - NOW returns only what user has confirmed
function getPersonalizedSettings() {
    return getUserPreferences();
}

// Get challenge descriptions in user-friendly language
function getChallengeDescription(challengeType) {
    const descriptions = {
        focus: {
            title: 'Focus Support',
            description: 'Reduced distractions and focus-friendly features',
            icon: 'fa-crosshairs'
        },
        reading: {
            title: 'Reading Support',
            description: 'Text-to-speech and enhanced readability',
            icon: 'fa-book-open'
        },
        processing: {
            title: 'Processing Support',
            description: 'Extra time and untimed mode',
            icon: 'fa-brain'
        },
        memory: {
            title: 'Memory Support',
            description: 'Review tools and flashcards',
            icon: 'fa-lightbulb'
        },
        organization: {
            title: 'Organization Tools',
            description: 'Planning and organizational aids',
            icon: 'fa-list-check'
        },
        timeManagement: {
            title: 'Time Management',
            description: 'Time tracking and session management',
            icon: 'fa-clock'
        }
    };
    return descriptions[challengeType] || { title: challengeType, description: '', icon: 'fa-circle-info' };
}

// Get learning style info
function getLearningStyleInfo(style = null) {
    const targetStyle = style || getLearningStyle();
    const styles = {
        visual: {
            title: 'Visual Learner',
            description: 'You learn best through seeing - diagrams, charts, and visual materials',
            icon: 'fa-eye',
            color: 'blue'
        },
        auditory: {
            title: 'Auditory Learner',
            description: 'You learn best through listening - audio and verbal explanations',
            icon: 'fa-ear-listen',
            color: 'purple'
        },
        kinesthetic: {
            title: 'Kinesthetic Learner',
            description: 'You learn best through doing - hands-on and interactive activities',
            icon: 'fa-hand',
            color: 'green'
        },
        mixed: {
            title: 'Multi-Modal Learner',
            description: 'You benefit from a variety of learning approaches',
            icon: 'fa-layer-group',
            color: 'orange'
        }
    };
    return styles[targetStyle] || null;
}

// Text-to-Speech functionality
class TextToSpeechManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.enabled = false;
        this.voice = null;
        this.rate = 1.0;
        this.pitch = 1.0;
        this.volume = 1.0;

        this.init();
    }

    init() {
        // Check if user has explicitly enabled text-to-speech in their preferences
        const userPreferences = getUserPreferences();
        this.enabled = userPreferences?.enableTextToSpeech || false;

        // Load saved preferences
        const ttsSettings = JSON.parse(localStorage.getItem('ttsSettings') || '{}');
        this.rate = ttsSettings.rate || 1.0;
        this.pitch = ttsSettings.pitch || 1.0;
        this.volume = ttsSettings.volume || 1.0;
    }

    speak(text, options = {}) {
        if (!this.enabled || !text) return;

        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || this.rate;
        utterance.pitch = options.pitch || this.pitch;
        utterance.volume = options.volume || this.volume;

        if (this.voice) {
            utterance.voice = this.voice;
        }

        if (options.onEnd) {
            utterance.onend = options.onEnd;
        }

        this.synth.speak(utterance);
    }

    stop() {
        this.synth.cancel();
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stop();
        }
        return this.enabled;
    }

    setVoice(voice) {
        this.voice = voice;
    }

    getVoices() {
        return this.synth.getVoices();
    }

    saveSettings() {
        localStorage.setItem('ttsSettings', JSON.stringify({
            rate: this.rate,
            pitch: this.pitch,
            volume: this.volume
        }));
    }
}

// Create global TTS instance
let ttsManager = null;

function getTTSManager() {
    if (!ttsManager) {
        ttsManager = new TextToSpeechManager();
    }
    return ttsManager;
}

// Break Reminder functionality
class BreakReminderManager {
    constructor() {
        this.enabled = false;
        this.studyInterval = 25 * 60 * 1000; // 25 minutes in milliseconds
        this.breakDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.startTime = null;
        this.reminderTimer = null;
        this.notificationShown = false;

        this.init();
    }

    init() {
        // Check if user has explicitly enabled break reminders in their preferences
        const userPreferences = getUserPreferences();
        this.enabled = userPreferences?.enableBreakReminders || false;

        // Load saved settings
        const breakSettings = JSON.parse(localStorage.getItem('breakReminderSettings') || '{}');
        this.studyInterval = breakSettings.studyInterval || (25 * 60 * 1000);
        this.breakDuration = breakSettings.breakDuration || (5 * 60 * 1000);

        if (this.enabled) {
            this.start();
        }
    }

    start() {
        if (!this.enabled || this.reminderTimer) return;

        this.startTime = Date.now();
        this.notificationShown = false;

        // Set timer for the study interval
        this.reminderTimer = setTimeout(() => {
            this.showBreakReminder();
        }, this.studyInterval);
    }

    stop() {
        if (this.reminderTimer) {
            clearTimeout(this.reminderTimer);
            this.reminderTimer = null;
        }
        this.notificationShown = false;
    }

    reset() {
        this.stop();
        if (this.enabled) {
            this.start();
        }
    }

    showBreakReminder() {
        if (this.notificationShown) return;
        this.notificationShown = true;

        // Create break reminder notification
        const notification = document.createElement('div');
        notification.id = 'break-reminder-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.5s ease-out;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: start; gap: 12px;">
                <div style="font-size: 2rem;">☕</div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 4px;">Time for a break!</div>
                    <div style="opacity: 0.9; font-size: 0.9rem; margin-bottom: 12px;">
                        You've been studying for ${this.studyInterval / 60000} minutes. Take a ${this.breakDuration / 60000}-minute break to recharge.
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button id="take-break-btn" style="
                            background: white;
                            color: #667eea;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 0.9rem;
                        ">Take Break</button>
                        <button id="dismiss-break-btn" style="
                            background: rgba(255,255,255,0.2);
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 0.9rem;
                        ">Continue</button>
                    </div>
                </div>
                <button id="close-break-btn" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                    opacity: 0.7;
                ">&times;</button>
            </div>
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Add event listeners
        const takeBreakBtn = notification.querySelector('#take-break-btn');
        const dismissBtn = notification.querySelector('#dismiss-break-btn');
        const closeBtn = notification.querySelector('#close-break-btn');

        const removeNotification = () => {
            notification.style.animation = 'slideInRight 0.3s ease-in reverse';
            setTimeout(() => notification.remove(), 300);
        };

        takeBreakBtn.addEventListener('click', () => {
            removeNotification();
            this.startBreakTimer();
        });

        dismissBtn.addEventListener('click', () => {
            removeNotification();
            this.reset(); // Start another study session
        });

        closeBtn.addEventListener('click', () => {
            removeNotification();
            this.reset();
        });

        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (document.getElementById('break-reminder-notification')) {
                removeNotification();
                this.reset();
            }
        }, 30000);
    }

    startBreakTimer() {
        // Show break timer
        const breakTimer = document.createElement('div');
        breakTimer.id = 'break-timer';
        breakTimer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 700;
            animation: slideInRight 0.5s ease-out;
        `;

        let secondsLeft = this.breakDuration / 1000;

        const updateTimer = () => {
            const minutes = Math.floor(secondsLeft / 60);
            const seconds = secondsLeft % 60;
            breakTimer.textContent = `🌟 Break time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            secondsLeft--;

            if (secondsLeft < 0) {
                breakTimer.remove();
                this.showBreakEndNotification();
                this.reset(); // Start another study session
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        breakTimer.addEventListener('click', () => {
            clearInterval(interval);
            breakTimer.remove();
            this.reset();
        });

        document.body.appendChild(breakTimer);
    }

    showBreakEndNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 700;
            animation: slideInRight 0.5s ease-out;
        `;
        notification.textContent = '✨ Break over! Ready to continue studying?';
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease-in reverse';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.start();
        } else {
            this.stop();
        }
    }

    updateSettings(studyMinutes, breakMinutes) {
        this.studyInterval = studyMinutes * 60 * 1000;
        this.breakDuration = breakMinutes * 60 * 1000;
        this.saveSettings();
        this.reset();
    }

    saveSettings() {
        localStorage.setItem('breakReminderSettings', JSON.stringify({
            studyInterval: this.studyInterval,
            breakDuration: this.breakDuration
        }));
    }
}

// Create global break reminder instance
let breakReminderManager = null;

function getBreakReminderManager() {
    if (!breakReminderManager) {
        breakReminderManager = new BreakReminderManager();
    }
    return breakReminderManager;
}

// Apply personalization to the page
function applyPersonalization() {
    const settings = getPersonalizedSettings();
    if (!settings) return;

    const style = document.createElement('style');
    style.id = 'personalization-styles';

    let css = '';

    // Larger fonts for reading challenges
    if (settings.largerFonts) {
        css += `
            body { font-size: 18px !important; }
            .flashcard-text, .question-text, .answer-text {
                font-size: 1.25em !important;
                line-height: 1.6 !important;
            }
            p { font-size: 1.1em !important; }
            h1 { font-size: 2.5em !important; }
            h2 { font-size: 2em !important; }
            h3 { font-size: 1.75em !important; }
        `;
    }

    // Visual enhancements for visual learners
    if (settings.showVisualAids) {
        css += `
            .quiz-option, .flashcard, .answer-choice {
                border-left: 4px solid transparent;
                transition: all 0.3s ease;
            }
            .quiz-option:nth-child(1) { border-left-color: #ef4444; }
            .quiz-option:nth-child(2) { border-left-color: #3b82f6; }
            .quiz-option:nth-child(3) { border-left-color: #10b981; }
            .quiz-option:nth-child(4) { border-left-color: #f59e0b; }
            .quiz-option:nth-child(5) { border-left-color: #a855f7; }

            .correct-answer {
                background: linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, transparent 100%) !important;
                border-left-color: #10b981 !important;
                border-left-width: 6px !important;
            }
            .incorrect-answer {
                background: linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, transparent 100%) !important;
                border-left-color: #ef4444 !important;
                border-left-width: 6px !important;
            }
        `;
    }

    // Distraction-free mode
    if (settings.distractionFreeMode) {
        css += `
            @keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); } }
            @keyframes gradient-flow { 0%, 100% { background-position: 0% 50%; } }
            @keyframes pulse { 0%, 100% { opacity: 1; } }
            .animate-slide-in { animation: none !important; }
            .shimmer { display: none !important; }
        `;
    }

    // Reduce animations
    if (settings.reduceAnimations) {
        css += `
            *, *::before, *::after {
                animation-duration: 0.01s !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01s !important;
            }
        `;
    }

    style.textContent = css;

    // Remove old personalization styles if they exist
    const oldStyle = document.getElementById('personalization-styles');
    if (oldStyle) {
        oldStyle.remove();
    }

    document.head.appendChild(style);
}

// Apply personalization when the page loads
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            applyPersonalization();
            // Initialize break reminders if enabled
            getBreakReminderManager();
        });
    } else {
        applyPersonalization();
        // Initialize break reminders if enabled
        getBreakReminderManager();
    }
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getLearningProfile,
        saveLearningProfile,
        deleteLearningProfile,
        hasLearningProfile,
        getLearningStyle,
        hasChallenge,
        getChallengeLevel,
        getChallenges,
        getRecommendations,
        isRecommendedMode,
        isRecommendedFeature,
        getPersonalizedSettings,
        getRecommendedSettings,
        getUserPreferences,
        saveUserPreferences,
        updatePreference,
        getChallengeDescription,
        getLearningStyleInfo,
        getTTSManager,
        TextToSpeechManager,
        getBreakReminderManager,
        BreakReminderManager,
        applyPersonalization
    };
}
