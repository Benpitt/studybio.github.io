# 🧠 BKT Data Flow - Complete Guide

## 📊 The BKT Formula (Simple Version)

```
When you answer a card:

1. Calculate probability you know it BEFORE this attempt:
   P(Know) = current mastery score (0.0 to 1.0)

2. Update based on your answer:
   
   IF CORRECT:
     • Probably not a lucky guess (P(G) = 0.2)
     • Update: P(Know) increases
     • Formula: P(Know) = P(Know) + (1 - P(Know)) × 0.1
   
   IF INCORRECT:
     • Probably a slip (P(S) = 0.1)
     • Update: P(Know) decreases  
     • Formula: P(Know) = P(Know) × 0.9

3. Save new mastery score for next time
```

**Example:**
```
Card: "What is mitochondria?"
Current mastery: 0.5 (50%)

You answer CORRECTLY in 3 seconds
→ Fast = confident
→ New mastery = 0.5 + (1 - 0.5) × 0.1 = 0.55 (55%)

Next review scheduled based on mastery:
• <50% = 1 day
• 50-80% = 3-7 days
• >80% = 14+ days
```

---

## 🔥 Current Data Flow (WITH FIREBASE)

```
┌─────────────────────────────────────────────────────────┐
│                   BKT Smart Study                       │
│                  (bkt-study.html)                       │
└─────────────────────────────────────────────────────────┘
                           │
                           │ User answers card
                           ▼
         ┌─────────────────────────────────┐
         │   recordBKTReview() function    │
         │                                 │
         │  Collects:                      │
         │  • userId                       │
         │  • skill (e.g. "biology-dna")   │
         │  • correct (0 or 1)             │
         │  • responseTime (seconds)       │
         │  • timestamp                    │
         │  • cardId                       │
         │  • timeOfDay (hour)             │
         │  • dayOfWeek (0-6)              │
         └─────────────────────────────────┘
                           │
                 ┌─────────┴─────────┐
                 │                   │
                 ▼                   ▼
      ┌──────────────────┐  ┌─────────────────┐
      │   Firebase        │  │  localStorage   │
      │   Firestore       │  │  (backup)       │
      │                   │  │                 │
      │ Collection:       │  │ Key:            │
      │ "bkt_reviews"     │  │ "bkt_reviews"   │
      └──────────────────┘  └─────────────────┘
               │
               │ Stores ALL reviews
               ▼
      ┌──────────────────────────────┐
      │  Firestore Database          │
      │                              │
      │  /bkt_reviews/               │
      │    ├── doc1 {                │
      │    │    userId: "user123"    │
      │    │    skill: "bio-dna"     │
      │    │    correct: 1           │
      │    │    responseTime: 4.2    │
      │    │    timestamp: ...       │
      │    │  }                      │
      │    ├── doc2 { ... }          │
      │    └── doc3 { ... }          │
      └──────────────────────────────┘
               │
               │ Export for training
               ▼
      ┌──────────────────────────────┐
      │  export_firebase_bkt.py      │
      │                              │
      │  Downloads all reviews       │
      │  Saves to bkt_reviews.json   │
      └──────────────────────────────┘
               │
               ▼
      ┌──────────────────────────────┐
      │  train_bkt.py                │
      │                              │
      │  Trains pyBKT model          │
      │  Outputs mastery scores      │
      └──────────────────────────────┘
               │
               ▼
      ┌──────────────────────────────┐
      │  mastery_scores.json         │
      │                              │
      │  {                           │
      │    "user123": {              │
      │      "bio-dna": 0.82,        │
      │      "bio-cells": 0.65       │
      │    }                         │
      │  }                           │
      └──────────────────────────────┘
               │
               │ Import back to app
               ▼
      ┌──────────────────────────────┐
      │  Browser localStorage        │
      │  OR                          │
      │  Firestore collection        │
      │  "user_mastery_scores"       │
      └──────────────────────────────┘
```

---

## 📁 Firestore Structure

### Collection: `bkt_reviews`
```javascript
{
  userId: "abc123",              // String
  skill: "biology-mitochondria", // String (concept name)
  correct: 1,                    // Number (0 or 1)
  responseTime: 4.2,             // Number (seconds)
  timestamp: Timestamp,          // Firestore Timestamp
  cardId: "card_789",            // String
  timeOfDay: 14,                 // Number (0-23)
  dayOfWeek: 2                   // Number (0-6, 0=Sunday)
}
```

### Collection: `user_mastery_scores` (optional, for faster access)
```javascript
{
  userId: "abc123",
  scores: {
    "biology-mitochondria": 0.82,
    "biology-photosynthesis": 0.65,
    "math-algebra": 0.91
  },
  lastUpdated: Timestamp
}
```

---

## 🔧 Setup Instructions

### 1. Firebase Rules (Add to firestore.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // BKT reviews - users can only write their own
    match /bkt_reviews/{review} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                    request.resource.data.userId == request.auth.uid;
    }
    
    // Mastery scores - users can read/write their own
    match /user_mastery_scores/{userId} {
      allow read, write: if request.auth != null && 
                         request.auth.uid == userId;
    }
  }
}
```

### 2. Deploy Rules

```bash
firebase deploy --only firestore:rules
```

### 3. Export Data for Training

```bash
# Install dependencies
pip install firebase-admin

# Get service account key from Firebase Console
# Project Settings > Service Accounts > Generate new private key
# Save as serviceAccountKey.json

# Export reviews
python export_firebase_bkt.py

# Train model
python train_bkt.py
```

---

## 📊 Example Data Flow

**User studies 5 cards:**

```javascript
Review 1: biology-dna, correct=1, time=3.2s
Review 2: biology-dna, correct=1, time=2.8s  
Review 3: biology-rna, correct=0, time=8.5s
Review 4: biology-rna, correct=0, time=7.2s
Review 5: biology-dna, correct=1, time=2.1s
```

**BKT Updates:**

```
biology-dna mastery:
0.50 → 0.55 → 0.60 → 0.65 (getting better!)

biology-rna mastery:
0.50 → 0.45 → 0.40 (struggling, needs more practice)
```

**Next Study Session:**

```
BKT prioritizes weakest skills:
1. biology-rna (0.40 mastery) ← Study first!
2. biology-dna (0.65 mastery) ← Study later
```

---

## 🎯 Benefits of Firebase Storage

✅ **Persistent** - Data saved forever, not lost on browser clear
✅ **Multi-device** - Study on phone, train model on computer
✅ **Scalable** - Can handle thousands of reviews
✅ **Queryable** - Filter by user, skill, date range
✅ **Secure** - Firebase rules protect user data
✅ **Backup** - Still saves to localStorage as fallback

---

## 🔍 Query Examples

```javascript
// Get all reviews for a user
const q = query(
  collection(db, 'bkt_reviews'),
  where('userId', '==', 'user123'),
  orderBy('timestamp', 'desc')
);

// Get reviews for specific skill
const q = query(
  collection(db, 'bkt_reviews'),
  where('skill', '==', 'biology-dna'),
  where('userId', '==', 'user123')
);

// Get recent reviews (last 7 days)
const weekAgo = new Date();
weekAgo.setDate(weekAgo.getDate() - 7);

const q = query(
  collection(db, 'bkt_reviews'),
  where('timestamp', '>=', weekAgo),
  where('userId', '==', 'user123')
);
```

---

## 🚀 Next Steps

1. ✅ Reviews now save to Firebase automatically
2. Study 100+ cards to collect data
3. Run `python export_firebase_bkt.py` to download
4. Run `python train_bkt.py` to train model
5. Import mastery scores back to app
6. Retrain weekly as data grows!
