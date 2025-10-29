"""
BKT Model Training Script
Trains pyBKT model on review data and exports mastery scores
"""

import json
import pandas as pd
from datetime import datetime

# Installation instructions in comments
# pip install pyBKT

try:
    import pyBKT
    from pyBKT.models import Model
except ImportError:
    print("ERROR: pyBKT not installed")
    print("Install with: pip install pyBKT")
    exit(1)


def load_reviews_from_json(filepath='bkt_reviews.json'):
    """Load BKT review data from JSON export"""
    with open(filepath, 'r') as f:
        reviews = json.load(f)
    
    df = pd.DataFrame(reviews)
    
    # Ensure required columns
    required = ['user_id', 'skill', 'correct', 'timestamp']
    for col in required:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")
    
    # Convert timestamp to datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Sort by user and timestamp
    df = df.sort_values(['user_id', 'timestamp'])
    
    return df


def check_data_quality(df):
    """Check if we have enough data to train"""
    total_reviews = len(df)
    unique_users = df['user_id'].nunique()
    unique_skills = df['skill'].nunique()
    
    print(f"\n📊 Data Quality Check:")
    print(f"   Total reviews: {total_reviews}")
    print(f"   Unique users: {unique_users}")
    print(f"   Unique skills: {unique_skills}")
    
    # Check reviews per skill
    reviews_per_skill = df.groupby('skill').size()
    print(f"\n📈 Reviews per skill:")
    print(reviews_per_skill.describe())
    
    # Warnings
    if total_reviews < 100:
        print("\n⚠️  WARNING: Less than 100 reviews. Need more data for reliable model.")
        return False
    
    if reviews_per_skill.min() < 10:
        print(f"\n⚠️  WARNING: Some skills have <10 reviews. Consider grouping skills.")
    
    return True


def train_bkt_model_per_user(df, num_fits=5):
    """Train individual BKT models for each user"""
    print("\n🧠 Training Per-User BKT Models...")
    print("   This allows each person to have their own learning profile!")

    user_models = {}
    user_params = {}

    for user_id in df['user_id'].unique():
        user_data = df[df['user_id'] == user_id]

        print(f"\n👤 Training model for user: {user_id[:8]}...")
        print(f"   Reviews: {len(user_data)}")

        # Check if user has enough data
        if len(user_data) < 10:
            print(f"   ⚠️  Skipping - need at least 10 reviews per user")
            continue

        # Initialize model for this user
        model = Model(seed=42, num_fits=num_fits)

        # Fit model on this user's data only
        try:
            model.fit(
                data=user_data,
                skills='skill',
                multigs=True,  # Different rates per skill
                forgets=False
            )

            # Get learned parameters for this user
            params = model.params()

            # Store in dict: {skill: {learn, slip, guess, prior}}
            user_skill_params = {}
            for skill in params['skill'].unique():
                skill_params = params[params['skill'] == skill].iloc[0]
                user_skill_params[skill] = {
                    'prior': float(skill_params['prior']),
                    'learn': float(skill_params['learns']),
                    'slip': float(skill_params['slips']),
                    'guess': float(skill_params['guesses'])
                }

            user_models[user_id] = model
            user_params[user_id] = user_skill_params

            print(f"   ✅ Trained on {len(user_skill_params)} skills")

        except Exception as e:
            print(f"   ❌ Error training model: {e}")
            continue

    print(f"\n✅ Trained models for {len(user_models)} users!")

    # Show example parameters
    if user_params:
        example_user = list(user_params.keys())[0]
        print(f"\n📊 Example Parameters for user {example_user[:8]}:")
        print("   P(L0) = Prior knowledge")
        print("   P(T)  = Learning rate")
        print("   P(S)  = Slip rate (know it but get wrong)")
        print("   P(G)  = Guess rate (don't know but get right)")

        for skill, params in list(user_params[example_user].items())[:3]:
            print(f"\n   {skill}:")
            print(f"      P(L0) = {params['prior']:.3f}")
            print(f"      P(T)  = {params['learn']:.3f}")
            print(f"      P(S)  = {params['slip']:.3f}")
            print(f"      P(G)  = {params['guess']:.3f}")

    return user_models, user_params


def calculate_mastery_scores(user_models, df):
    """Calculate current mastery score for each user-skill pair using their personal model"""
    print("\n🎯 Calculating Individual Mastery Scores...")

    mastery = {}

    for user_id in df['user_id'].unique():
        user_data = df[df['user_id'] == user_id]
        mastery[user_id] = {}

        # Skip if no model for this user
        if user_id not in user_models:
            print(f"   ⚠️  No model for user {user_id[:8]}, using default scores")
            for skill in user_data['skill'].unique():
                mastery[user_id][skill] = 0.5
            continue

        model = user_models[user_id]

        for skill in user_data['skill'].unique():
            skill_data = user_data[user_data['skill'] == skill]

            try:
                # Predict mastery after all reviews using THEIR model
                predictions = model.predict(data=skill_data)

                # Get final mastery probability
                final_mastery = predictions['state_predictions'].iloc[-1]
                mastery[user_id][skill] = float(final_mastery)
            except Exception as e:
                print(f"   ⚠️  Error calculating mastery for {skill}: {e}")
                mastery[user_id][skill] = 0.5

    return mastery


def export_mastery_scores(mastery, output_file='mastery_scores.json'):
    """Export mastery scores to JSON for use in app"""
    with open(output_file, 'w') as f:
        json.dump(mastery, f, indent=2)
    
    print(f"\n💾 Mastery scores saved to {output_file}")
    print(f"   Upload this to your app!")


def export_model_params(user_params, output_file='bkt_params.json'):
    """Export per-user model parameters"""
    # Structure: {userId: {skill: {learn, slip, guess, prior}}}

    with open(output_file, 'w') as f:
        json.dump(user_params, f, indent=2)

    print(f"💾 Per-user model parameters saved to {output_file}")
    print(f"   Contains individualized learning profiles for {len(user_params)} users")


def main():
    print("=" * 50)
    print("🎓 BKT Model Training Pipeline")
    print("=" * 50)
    
    # Load data
    print("\n📁 Loading review data...")
    try:
        df = load_reviews_from_json('bkt_reviews.json')
    except FileNotFoundError:
        print("\n❌ ERROR: bkt_reviews.json not found!")
        print("\n📝 To export from browser console:")
        print("   const reviews = JSON.parse(localStorage.getItem('bkt_reviews'));")
        print("   const blob = new Blob([JSON.stringify(reviews)], {type: 'application/json'});")
        print("   const url = URL.createObjectURL(blob);")
        print("   const a = document.createElement('a');")
        print("   a.href = url;")
        print("   a.download = 'bkt_reviews.json';")
        print("   a.click();")
        return
    
    # Check data quality
    if not check_data_quality(df):
        print("\n❌ Not enough data to train model yet.")
        print("   Keep studying! Come back when you have 100+ reviews.")
        return
    
    # Train per-user models
    user_models, user_params = train_bkt_model_per_user(df, num_fits=5)

    # Calculate mastery using individual models
    mastery = calculate_mastery_scores(user_models, df)

    # Export results
    export_mastery_scores(mastery)
    export_model_params(user_params)

    print("\n" + "=" * 50)
    print("✅ Training Complete!")
    print("=" * 50)
    print("\n🎯 What's Different Now:")
    print("   • Each user has their own BKT parameters")
    print("   • Learning rates adapt to individual patterns")
    print("   • Slip/guess rates reflect personal tendencies")
    print("   • TRUE personalized learning!")
    print("\n📤 Next steps:")
    print("   1. The app will automatically sync these from Firebase")
    print("   2. Or manually update in browser console:")
    print("      const params = <paste bkt_params.json>;")
    print("      localStorage.setItem('bkt_user_params', JSON.stringify(params));")
    print("   3. Enable advanced mode to use personalized parameters")
    print("   4. Retrain weekly as you get more data!")


if __name__ == '__main__':
    main()
