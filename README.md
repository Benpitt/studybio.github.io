# studying.works

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Firebase](https://img.shields.io/badge/Firebase-10.8.0-orange.svg)](https://firebase.google.com/)
[![AI Powered](https://img.shields.io/badge/AI-Claude%20Sonnet%204.5-purple.svg)](https://www.anthropic.com/)
[![Status](https://img.shields.io/badge/Status-Active-success.svg)]()
[![Free](https://img.shields.io/badge/Price-FREE-brightgreen.svg)]()

> **Turn study sessions into high scores.** An AI-powered study platform that generates flashcards, tracks progress, and makes learning actually work.

[**Try it live →**](https://studying.works)

---

## What It Does

studying.works helps students learn faster with tools that actually matter:

- **AI flashcard generation** - Paste your notes, get instant study decks
- **Smart spaced repetition** - Algorithm shows you cards when you need them
- **9 different study modes** - Flashcards, quizzes, matching games, speed rounds
- **Community library** - Share and discover study decks
- **Progress tracking** - See your streaks, scores, and improvement

No subscriptions. No paywalls. No ads. Just tools that work.

---

## Core Features

### 🤖 AI Generator
Drop in your lecture notes or a topic name. Claude AI reads it, extracts key concepts, and creates a full flashcard deck in 5-10 seconds. Works for any subject.

### 🎴 Smart Flashcards
Mark cards as hard/medium/easy. The system shows you harder cards more often using spaced repetition - the same technique med students use to memorize thousands of terms.

### 🎮 Gamified Learning
- **Matching Game**: Race against time to pair questions with answers
- **Speed Round**: Answer as many as possible in 60 seconds
- **Audio Quiz**: Text-to-speech reads questions out loud
- **Progress Streaks**: Track daily study habits

### 🌍 Community Library
Browse thousands of flashcard decks made by other students. Find exactly what you need for your class, or upload your own decks to help others.

### 📊 Analytics
Real-time progress tracking shows:
- Study streaks
- Quiz scores over time
- Total cards mastered
- Time spent studying
- Achievement badges

---

## Tech Stack

**Frontend:**
- React 18 (functional components, hooks)
- Tailwind CSS (utility-first styling)
- Vanilla JS (for performance-critical pages)

**Backend & Services:**
- Firebase Authentication (Google Sign-In)
- Cloud Firestore (NoSQL database)
- Firebase Hosting
- Claude AI API (Sonnet 4.5)

**Tools:**
- Web Speech API (audio quiz mode)
- LocalStorage (client-side caching)
- Service Workers (offline support - coming soon)

---

## Quick Start

### For Users
1. Go to [studying.works](https://studying.works)
2. Sign in with Google
3. Click "AI Generator"
4. Paste notes or enter a topic
5. Start studying

### For Developers

**Prerequisites:**
- Node.js (not required, but useful for local dev)
- Firebase account
- Modern browser

**Setup:**

```bash
# Clone the repo
git clone https://github.com/yourusername/studying-works.git
cd studying-works

# No dependencies to install - just open in browser
open index.html

# Or use a local server
python -m http.server 8000
# Visit http://localhost:8000
```

**Firebase Config:**

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Google Authentication
3. Enable Firestore Database
4. Copy your config to `index.html` (replace existing config)
5. Deploy security rules from `firestore.rules`

```bash
# Deploy rules
firebase deploy --only firestore:rules
```

---

## Architecture

```
studying.works/
├── index.html              # Landing & auth
├── dashboard.html          # Main hub
├── ai-flashcards.html      # AI generator
├── custom-flashcards.html  # Deck management
├── community.html          # Share/discover
├── biology-quiz2*.html     # Study modes
├── progress.html           # Analytics
├── assignments.html        # Task manager
│
├── auth-guard.js           # Login protection
├── toast-notifications.js  # User feedback
├── loading-animations.css  # UI polish
│
├── firestore.rules         # Database security
├── sitemap.xml            # SEO
└── robots.txt             # Crawler rules
```

**Key Patterns:**

- **No build step** - Pure HTML/CSS/JS for simplicity
- **Component-based** - Reusable React components where needed
- **Progressive enhancement** - Works without JS for core content
- **Mobile-first** - Responsive design from the ground up

---

## Study Modes

| Mode | Description | Best For |
|------|-------------|----------|
| 🎴 **Flashcards** | Classic flip cards with spaced repetition | Memorization |
| 📝 **Practice Test** | Full exam simulation with timer | Test prep |
| 🎯 **Multiple Choice** | 4-option questions | Quick review |
| ✅ **True/False** | Binary questions | Concept checking |
| 🎮 **Matching Game** | Pair terms with definitions | Active recall |
| ⚡ **Speed Round** | Timed rapid-fire questions | Fact drilling |
| 🔊 **Audio Quiz** | Text-to-speech questions | Auditory learning |
| 📋 **Fill in Blank** | Type missing words | Writing practice |
| ✍️ **Written Answer** | Free-form responses | Essay prep |

---

## AI Generation

The AI generator uses Claude Sonnet 4.5 to create flashcards from:

**Input Options:**
1. **Text/Notes** - Paste lecture notes, textbook excerpts, articles
2. **Topics** - Just enter "Photosynthesis" or "World War 2"
3. **Questions** - Generate quiz questions from text

**How It Works:**
1. User submits content
2. System sends structured prompt to Claude API
3. AI extracts key concepts and creates Q&A pairs
4. Response parsed and formatted as flashcards
5. User reviews and saves to their collection

**Quality Controls:**
- Prompts enforce specific JSON output format
- Validation checks for properly formed cards
- Difficulty levels adjust question complexity
- Card count limits (5-50) prevent overload

---

## Security

**Authentication:**
- Firebase Auth with Google Sign-In
- No passwords stored
- Session tokens managed by Firebase

**Database Rules:**
- Users can only edit their own content
- Community decks are read-only
- Input validation on all writes
- Rate limiting via Firebase quotas

**Data Protection:**
- HTTPS everywhere
- No sensitive data in localStorage
- Regular security audits
- GDPR-compliant data handling

See `firestore.rules` for complete security implementation.

---

## Performance

**Load Times:**
- Initial page: < 1s
- Dashboard: < 500ms (with cached auth)
- AI generation: 5-10s
- Page transitions: Instant

**Optimizations:**
- DNS prefetch for Firebase CDN
- Lazy loading for images
- Minimal JavaScript bundles
- LocalStorage caching
- Optimistic UI updates

---

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| Mobile Safari | iOS 14+ | ✅ Full support |
| Chrome Mobile | 90+ | ✅ Full support |

**Required Features:**
- ES6+ JavaScript
- CSS Grid & Flexbox
- Web Storage API
- Fetch API

---

## Roadmap

**In Progress:**
- [ ] Dark mode toggle
- [ ] Offline mode with service workers
- [ ] Mobile app (React Native)

**Planned:**
- [ ] Deck ratings and reviews
- [ ] Comments on community decks
- [ ] Study groups and collaboration
- [ ] Voice input for flashcard creation
- [ ] PDF upload for AI generation
- [ ] Export decks as PDF/Anki

**Ideas Welcome:**
Open an issue to suggest features or improvements.

---

## Contributing

Pull requests welcome. For major changes, open an issue first.

**Development:**
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

**Code Style:**
- Use Prettier for formatting
- Follow existing patterns
- Comment complex logic
- Test on multiple browsers

---

## Resources Used

**AI & APIs:**
- [Claude AI by Anthropic](https://www.anthropic.com/) - Flashcard generation
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) - Audio quiz mode

**Backend:**
- [Firebase Authentication](https://firebase.google.com/docs/auth) - User management
- [Cloud Firestore](https://firebase.google.com/docs/firestore) - Database
- [Firebase Hosting](https://firebase.google.com/docs/hosting) - Deployment

**UI/UX:**
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Heroicons](https://heroicons.com/) - Icon set (via emoji)
- [Google Fonts](https://fonts.google.com/) - Typography

**Libraries:**
- [React 18](https://react.dev/) - UI components (CDN version)
- [Babel Standalone](https://babeljs.io/docs/babel-standalone) - JSX compilation

---

## License

MIT License - See [LICENSE](LICENSE) for details.

Free to use, modify, and distribute. Attribution appreciated but not required.

---

## Credits

Built with ❤️ for students who want tools that work, not distractions.

**Powered by:**
- Claude AI for intelligent flashcard generation
- Firebase for rock-solid infrastructure
- Open-source tools from the community

This project uses [pyBKT (Python Bayesian Knowledge Tracing)](https://github.com/CAHLR/pyBKT) 
for intelligent spaced repetition learning.

**Citation:**
```
Badrinath, A., Wang, F., Pardos, Z. (2021). 
pyBKT: An Accessible Python Library of Bayesian Knowledge Tracing Models. 
In S. Hsiao, & S. Sahebi (Eds.) Proceedings of the 14th International Conference 
on Educational Data Mining (EDM). Pages 468-474.
```

[BKT Research Paper](https://arxiv.org/abs/2105.00385)
---

## Support

**Found a bug?** Open an issue on GitHub.

**Need help?** Check the [wiki](https://github.com/yourusername/studying-works/wiki) or open a discussion.

**Want to say thanks?** Star the repo ⭐

---

<div align="center">

**[studying.works](https://studying.works)** · **[Docs](https://github.com/yourusername/studying-works/wiki)** · **[Report Bug](https://github.com/yourusername/studying-works/issues)**

Made for students, by someone who knows cramming sucks.

</div>
