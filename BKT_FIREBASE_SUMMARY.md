# 🎯 BKT Firebase Integration - Summary

## What Changed

✅ **Data now saves to Firebase Firestore** instead of just localStorage
✅ **Still has localStorage backup** in case Firebase fails
✅ **New Firestore rules** added for security
✅ **Export script** to download data for training
✅ **Complete data flow** documented

---

## Files Updated

1. **bkt-study.html**
   - Added Firebase SDK imports
   - `recordBKTReview()` now saves to Firestore
   - Still has localStorage fallback

2. **firestore.rules**
   - Added `bkt_reviews` collection rules
   - Added `user_mastery_scores` collection rules

3. **NEW: export_firebase_bkt.py**
   - Downloads all reviews from Firebase
   - Saves to `bkt_reviews.json` for training

4. **NEW: BKT_DATA_FLOW.md**
   - Complete visual guide
   - Shows exactly where data goes
   - Explains BKT formula

---

## Data Storage

### Before (localStorage only)
```
Browser localStorage
└── bkt_reviews: [...]
└── bkt_mastery_scores: {...}
```
❌ Lost if you clear browser
❌ Can't access from other devices
❌ Can't query or analyze

### After (Firebase + localStorage)
```
Firebase Firestore
├── bkt_reviews/
│   ├── doc1: {userId, skill, correct, ...}
│   ├── doc2: {userId, skill, correct, ...}
│   └── doc3: {userId, skill, correct, ...}
└── user_mastery_scores/
    └── userId: {scores: {...}}

Browser localStorage (backup)
├── bkt_reviews: [...]
└── bkt_mastery_scores: {...}
```
✅ Persistent forever
✅ Multi-device sync
✅ Queryable and analyzable
✅ Still works offline

---

## How to Use

### 1. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

Or manually in Firebase Console:
1. Go to Firestore Database > Rules
2. Copy contents of `firestore.rules`
3. Click Publish

### 2. Study with BKT

Just use the app normally! Data automatically saves to Firebase.

### 3. Export Data for Training

```bash
# Install dependencies
pip install firebase-admin

# Get service account key
# Firebase Console > Project Settings > Service Accounts
# Click "Generate new private key"
# Save as serviceAccountKey.json

# Export reviews
python export_firebase_bkt.py

# This creates: bkt_reviews.json
```

### 4. Train Model

```bash
python train_bkt.py

# This creates: mastery_scores.json
```

### 5. Import Scores (Optional)

```javascript
// In browser console on bkt-study.html
const mastery = {...}; // paste contents of mastery_scores.json
localStorage.setItem('bkt_mastery_scores', JSON.stringify(mastery));
location.reload();
```

---

## Where Data is Stored

```
Every time you answer a card in BKT Smart Study:

1. JavaScript calls recordBKTReview()
2. Saves to Firebase Firestore collection "bkt_reviews"
3. Also saves to localStorage as backup
4. Updates mastery score locally

When you want to train model:

1. Run export_firebase_bkt.py
2. Downloads all reviews from Firestore
3. Saves to bkt_reviews.json
4. Run train_bkt.py on that JSON file
5. Generates mastery_scores.json
6. (Optional) Import back to app
```

---

## BKT Formula (Simple)

```javascript
// Current implementation (simplified Bayesian update)
function updateMasteryScore(skill, correct) {
    const currentScore = getMasteryScore(skill); // 0.0 - 1.0
    const learningRate = 0.1;  // P(T) - how fast you learn
    const slipRate = 0.1;      // P(S) - careless mistakes
    const guessRate = 0.2;     // P(G) - lucky guesses
    
    let newScore;
    if (correct) {
        // Got it right - probably know it
        newScore = currentScore + (1 - currentScore) * learningRate;
    } else {
        // Got it wrong - probably don't know it
        newScore = currentScore * (1 - slipRate);
    }
    
    return Math.max(0, Math.min(1, newScore));
}
```

When you train the **real pyBKT model** with 1000+ reviews, it will learn the optimal values for P(T), P(S), P(G) for each skill!

---

## Benefits

🔥 **Never lose data** - Stored in cloud
📊 **Better analytics** - Query all your reviews
🎯 **Train better models** - More data = better ML
🔒 **Secure** - Firebase rules protect your data
📱 **Multi-device** - Study on phone, train on computer
🚀 **Scalable** - Can handle millions of reviews

---

## Next Steps

1. ✅ Upload `bkt-study.html` to your site
2. ✅ Deploy `firestore.rules` to Firebase
3. 📚 Study 100+ cards to collect data
4. 🐍 Run export and training scripts
5. 🎉 Enjoy smarter spaced repetition!
