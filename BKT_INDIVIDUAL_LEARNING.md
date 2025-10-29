# BKT Individual Learning System

## Overview

The BKT (Bayesian Knowledge Tracing) system now uses **fully individualized learning models**. Each user has their own personalized BKT parameters that adapt to how THEY specifically learn.

## What Changed?

### Before (Shared Parameters)
- ❌ All users used the same learning rate (0.1)
- ❌ All users had the same slip rate (0.1) and guess rate (0.2)
- ❌ BKT parameters were shared across everyone or per-skill only
- ❌ The system couldn't distinguish between fast and slow learners

### After (Individual Parameters)
- ✅ Each user has their own learning rate based on their improvement patterns
- ✅ Slip rates reflect individual careless mistake tendencies
- ✅ Guess rates adapt to each person's lucky guess patterns
- ✅ **TRUE personalized learning** - the system adapts to how YOU learn

## How It Works

### 1. Data Collection (Per User)
Every review is recorded with the user's ID:
```javascript
{
  userId: "user123",           // Your unique ID
  skill: "biology-dna",
  correct: 1,
  timestamp: "2025-01-15T10:30:00",
  responseTime: 5.2,
  // ... more data
}
```

### 2. Model Training (Per User)
The training script (`train_bkt.py`) now trains a separate model for each user:

```python
# Train individual models
for user_id in all_users:
    user_data = reviews[reviews['user_id'] == user_id]
    model = train_bkt_model(user_data)  # Train on THIS user only

    # Learn personalized parameters
    user_params[user_id] = {
        'skill-1': {
            'learn': 0.15,   # This user learns fast
            'slip': 0.08,    # Rarely makes careless mistakes
            'guess': 0.18    # Moderate lucky guesses
        },
        'skill-2': { ... }
    }
```

### 3. Adaptive Learning (Per User)
When you study, the app uses YOUR parameters:

```javascript
// Look up YOUR learning rate for this skill
const myParams = allUserParams[myUserId][skill];
const learningRate = myParams.learn;  // YOUR rate, not average

// Update mastery using YOUR personal learning profile
if (correct) {
    newMastery = currentMastery + (1 - currentMastery) * learningRate;
}
```

## Parameter Meanings

### Learning Rate (P(T))
- **High (0.2-0.3)**: You learn quickly from each practice
- **Medium (0.1-0.2)**: Average learning speed
- **Low (0.05-0.1)**: You need more repetitions to master concepts

### Slip Rate (P(S))
- **High (0.2-0.3)**: You often know the answer but make careless mistakes
- **Medium (0.1-0.2)**: Occasional slips
- **Low (0.05-0.1)**: Very consistent - if you know it, you get it right

### Guess Rate (P(G))
- **High (0.25-0.3)**: You're good at educated guesses
- **Medium (0.15-0.25)**: Average guessing ability
- **Low (0.05-0.15)**: You need to truly know it to get it right

## Data Structure

### Storage Format
```json
{
  "user123": {
    "biology-dna": {
      "prior": 0.3,
      "learn": 0.15,
      "slip": 0.08,
      "guess": 0.18
    },
    "math-algebra": {
      "prior": 0.5,
      "learn": 0.12,
      "slip": 0.15,
      "guess": 0.20
    }
  },
  "user456": {
    "biology-dna": {
      "prior": 0.2,
      "learn": 0.08,
      "slip": 0.12,
      "guess": 0.25
    }
  }
}
```

### localStorage Keys
- **`bkt_user_params`**: Per-user BKT parameters (new format)
- ~~`bkt_advanced_params`~~: Deprecated (old shared format)
- ~~`bkt_mode`~~: Deprecated (no longer needed)

### Firebase Collections
- **`users/{userId}/data/bktUserParams`**: Your personalized parameters
- **`bkt_reviews`**: All reviews with userId field
- **`users/{userId}/data/bktMastery`**: Your current mastery scores

## How to Train Your Model

### Option 1: Quick Train (Browser)
1. Go to BKT Analytics page
2. Click "Train Advanced BKT" button
3. System calculates YOUR parameters from YOUR review history
4. Parameters saved automatically

### Option 2: Full Training (Python + pyBKT)
1. Export reviews from Firebase:
   ```bash
   python export_firebase_bkt.py
   ```

2. Train per-user models:
   ```bash
   python train_bkt.py
   ```

3. Outputs:
   - `bkt_params.json` - Per-user parameters
   - `mastery_scores.json` - Updated mastery scores

4. Parameters automatically sync to Firebase

## Benefits of Individual Learning

1. **Faster Mastery Detection**: System knows YOUR learning speed
2. **Better Recommendations**: Cards prioritized based on YOUR patterns
3. **Accurate Progress**: Mastery scores reflect YOUR understanding, not averages
4. **Adaptive Difficulty**: Adjusts to YOUR slip/guess patterns
5. **Personalized Feedback**: Encouragement tailored to YOUR learning style

## Minimum Data Requirements

- **Quick Train**: 20+ reviews recommended per skill
- **Full pyBKT Training**: 50+ reviews per user across all skills
- **Reliable Parameters**: 100+ reviews per user

The system falls back to default parameters until enough individual data is collected.

## Privacy & Security

- All user data is isolated by Firebase UID
- Firestore rules enforce user-level access control
- No user can access another user's parameters or reviews
- Parameters are stored per-user, ensuring true privacy

## Technical Details

### Files Modified
1. **`train_bkt.py`**: Now trains separate models per user
2. **`bkt-study.html`**: Loads per-user parameters from `bkt_user_params`
3. **`bkt-analytics.html`**: Quick-train saves in per-user format
4. **`export_firebase_bkt.py`**: Normalizes field names for Python

### Migration from Old System
The system automatically handles both formats:
- If `bkt_user_params` exists → use personalized parameters
- If only old format exists → fall back to defaults
- No manual migration needed

### Console Logging
Watch for these messages in browser console:
- `🎯 Using YOUR personalized BKT for {skill}` - Personal params loaded
- `📊 Using default BKT parameters for {skill}` - Need more training data

## Example: Two Different Learners

### User A (Fast Learner)
```json
{
  "biology-dna": {
    "learn": 0.25,    // Masters concepts quickly
    "slip": 0.05,     // Very consistent
    "guess": 0.10     // Needs to know it
  }
}
```
→ Reaches 90% mastery in ~5 correct answers

### User B (Careful Learner)
```json
{
  "biology-dna": {
    "learn": 0.08,    // Learns more gradually
    "slip": 0.20,     // Makes careless mistakes
    "guess": 0.25     // Good at educated guesses
  }
}
```
→ Reaches 90% mastery in ~15 correct answers

**Same skill, different paths!** The system adapts to each person.

## Future Enhancements

- **Forgetting Models**: Track how quickly YOU forget concepts over time
- **Time-of-Day Factors**: Learn when YOU study most effectively
- **Context-Aware**: Adjust parameters based on question type
- **Multi-User Insights**: Compare your learning speed (anonymously) with others
- **Adaptive Scheduling**: Optimal review timing based on YOUR patterns

---

**The key insight**: Everyone learns differently. The BKT system now recognizes and adapts to YOUR unique learning profile! 🎯
