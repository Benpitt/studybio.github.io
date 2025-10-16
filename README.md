# 🎓 Ben's Study Hub - Complete Website

Your personal study sanctuary with adaptive learning, spaced repetition, and gamified practice!

## 📁 File Structure

```
your-repo/
├── index.html              # Landing page (hero entrance)
├── dashboard.html          # Main hub with subjects and stats
├── biology-quiz2.html      # Biology Quiz 2 study app (rename from biology-quiz2-master-final.html)
├── progress.html           # Detailed progress tracking
├── about.html              # About page
└── README.md               # This file
```

## 🚀 Setup Instructions

### Step 1: Download All Files
Download these 5 files from the outputs:
1. `index.html` - Landing page
2. `dashboard.html` - Dashboard
3. `biology-quiz2-master-final.html` - **RENAME THIS to `biology-quiz2.html`**
4. `progress.html` - Progress page
5. `about.html` - About page

### Step 2: Upload to GitHub
1. Go to your GitHub repository
2. Click "Add file" → "Upload files"
3. **IMPORTANT:** Rename `biology-quiz2-master-final.html` to `biology-quiz2.html` before uploading
4. Upload all 5 files
5. Commit changes

### Step 3: Wait & Visit
1. Wait 1-2 minutes for GitHub Pages to build
2. Visit: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME`
3. Your complete study site is live! 🎉

## 🎨 Page Flow

```
index.html (Landing)
    ↓ [Enter Button]
dashboard.html (Main Hub)
    ↓ [Click Biology Card]
biology-quiz2.html (Study App)
```

## ✨ Features

### 🏠 Landing Page (index.html)
- Animated hero section
- Floating particles
- Smooth entrance animation
- Feature preview

### 📊 Dashboard (dashboard.html)
- Quick stats cards (streak, cards, quizzes, accuracy)
- Active subjects with progress
- Today's goal tracker
- Recent achievements
- Quick action buttons

### 🧬 Biology Quiz 2 (biology-quiz2.html)
- **9 Study Modes:**
  1. Smart Flashcards (spaced repetition)
  2. Practice Test (adaptive feedback)
  3. Quiz Builder (custom topics)
  4. Matching Game
  5. Speed Challenge
  6. Compare & Contrast
  7. Mistake Bank
  8. Progress Dashboard
  9. Quick Reference

### 📈 Progress Page (progress.html)
- Visual study calendar
- Topic mastery bars
- Weekly summary
- Achievement showcase
- Study insights
- Next milestone tracker

### ℹ️ About Page (about.html)
- Project information
- Feature highlights
- Tech stack
- Creator info
- Future plans

## 🎯 Key Features

### Spaced Repetition
- Rate cards: Hard (😰), Medium (😐), Easy (😊)
- Hard cards appear 5x more often
- Adaptive learning algorithm

### Progress Tracking
- Study streak counter
- Cards reviewed tracking
- Quiz performance analytics
- Topic mastery visualization

### Gamification
- Achievements & badges
- Study goals
- Competitive elements
- Visual feedback

## 🎨 Design System

### Color Scheme
- **Primary:** Blue-Purple gradient
- **Biology:** Blue → Purple
- **Success:** Green → Teal
- **Warning:** Orange → Red
- **Background:** Dark gradient (gray-900 → blue-900 → purple-900)

### Typography
- **Headers:** Bold, large (text-4xl to text-7xl)
- **Body:** text-white/80 for readability
- **Cards:** Rounded (rounded-2xl to rounded-3xl)

### Animations
- Slide-in on page load
- Hover scale effects
- Pulse animations
- Smooth transitions

## 💾 Data Storage

All data is stored in browser localStorage:
- `studyStreak` - Current study streak
- `cardDifficulty` - Spaced repetition ratings
- `cardHistory` - Card review history
- `mistakeBank` - Wrong answers
- `topicStats` - Performance by topic
- `lastVisit` - Last study date

**Note:** Data is device-specific. Clearing browser data will reset progress.

## 🔮 Future Expansion

To add new subjects:

1. **Create new study page:**
   - Copy `biology-quiz2.html`
   - Rename to `chemistry-quiz1.html`
   - Update question bank

2. **Update dashboard.html:**
   - Add new subject card
   - Link to new file
   - Update stats

3. **Navigation:**
   - All pages automatically have nav
   - Add subject link if needed

## 🛠️ Customization

### Change Site Name
Update in all files:
```html
<span>Study Hub</span>
```

### Change Colors
Search and replace gradient classes:
- `from-blue-600 to-purple-600` → Your colors
- Update in Tailwind classes

### Add More Questions
Edit the `questionBank` array in `biology-quiz2.html`

## 📱 Browser Compatibility
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## 🐛 Troubleshooting

**"Page not found"**
- Ensure files are named exactly as shown
- Wait 2-3 minutes after upload
- Check GitHub Pages is enabled

**"Stats not showing"**
- Take a quiz first to generate data
- Check browser console for errors
- Try clearing cache and reload

**"Navigation broken"**
- Verify all file names match links
- Ensure all files uploaded successfully
- Check for typos in hrefs

## 📊 Stats Overview

- **Total Questions:** 69
- **Study Modes:** 9
- **Topics Covered:** 5
- **Pages:** 5
- **Animations:** Custom CSS
- **Storage:** LocalStorage
- **Framework:** React (CDN)

## 🎓 Created By

**Ben Hocquet**
- Built with React, Tailwind CSS, and Claude AI
- Hosted on GitHub Pages
- 100% Free & Open Source

## 📝 License

Free to use for personal education. Built with ❤️ for learning.

---

## 🚀 Quick Start Checklist

- [ ] Downloaded all 5 files
- [ ] Renamed `biology-quiz2-master-final.html` to `biology-quiz2.html`
- [ ] Uploaded to GitHub
- [ ] Waited 2 minutes
- [ ] Tested landing page
- [ ] Tested navigation
- [ ] Took a practice quiz
- [ ] Checked progress page
- [ ] Shared with friends! 🎉

**Need help?** Review this README or check the code comments!
