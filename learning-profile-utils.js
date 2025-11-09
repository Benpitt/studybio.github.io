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
                recommendations.features.push('untimed-mode', 'step-by-step', 'extra-time');
                recommendations.tips.push('Take your time - no rush!');
                recommendations.tips.push('Review explanations step-by-step');
                break;
            case 'memory':
                recommendations.features.push('spaced-repetition', 'review-mode', 'flashcards');
                recommendations.tips.push('Enable spaced repetition for better retention');
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

// Get personalized settings for the study interface
function getPersonalizedSettings() {
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
        enableSpacedRepetition: hasChallenge('memory'),
        showStepByStep: hasChallenge('processing'),
        frequentBreaks: hasChallenge('focus') || profile.learningStyle === 'kinesthetic',

        // Recommended modes
        recommendedModes: getRecommendations()?.studyModes || []
    };

    return settings;
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
            description: 'Extra time and step-by-step guidance',
            icon: 'fa-brain'
        },
        memory: {
            title: 'Memory Support',
            description: 'Spaced repetition and review tools',
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
        const profile = getLearningProfile();
        this.enabled = profile?.learningStyle === 'auditory' || hasChallenge('reading');

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
        getChallengeDescription,
        getLearningStyleInfo,
        getTTSManager,
        TextToSpeechManager
    };
}
