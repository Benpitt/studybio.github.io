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


def train_bkt_model(df, num_fits=5):
    """Train BKT model on review data"""
    print("\n🧠 Training BKT Model...")
    
    # Initialize model
    model = Model(seed=42, num_fits=num_fits)
    
    # Fit model
    # multigs=True allows different learning rates per skill
    model.fit(
        data=df,
        skills='skill',
        multigs=True,
        forgets=False  # Set to True if you want to model forgetting
    )
    
    print("✅ Model trained!")
    
    # Get learned parameters
    params = model.params()
    
    print("\n📊 Learned Parameters (per skill):")
    print("   P(L0) = Prior knowledge")
    print("   P(T)  = Learning rate")
    print("   P(S)  = Slip rate (know it but get wrong)")
    print("   P(G)  = Guess rate (don't know but get right)")
    
    for skill in params['skill'].unique():
        skill_params = params[params['skill'] == skill].iloc[0]
        print(f"\n   {skill}:")
        print(f"      P(L0) = {skill_params['prior']:.3f}")
        print(f"      P(T)  = {skill_params['learns']:.3f}")
        print(f"      P(S)  = {skill_params['slips']:.3f}")
        print(f"      P(G)  = {skill_params['guesses']:.3f}")
    
    return model, params


def calculate_mastery_scores(model, df):
    """Calculate current mastery score for each user-skill pair"""
    print("\n🎯 Calculating Mastery Scores...")
    
    mastery = {}
    
    for user in df['user_id'].unique():
        user_data = df[df['user_id'] == user]
        mastery[user] = {}
        
        for skill in user_data['skill'].unique():
            skill_data = user_data[user_data['skill'] == skill]
            
            # Predict mastery after all reviews
            predictions = model.predict(data=skill_data)
            
            # Get final mastery probability
            final_mastery = predictions['state_predictions'].iloc[-1]
            mastery[user][skill] = float(final_mastery)
    
    return mastery


def export_mastery_scores(mastery, output_file='mastery_scores.json'):
    """Export mastery scores to JSON for use in app"""
    with open(output_file, 'w') as f:
        json.dump(mastery, f, indent=2)
    
    print(f"\n💾 Mastery scores saved to {output_file}")
    print(f"   Upload this to your app!")


def export_model_params(params, output_file='bkt_params.json'):
    """Export model parameters"""
    params_dict = params.to_dict('records')
    
    with open(output_file, 'w') as f:
        json.dump(params_dict, f, indent=2)
    
    print(f"💾 Model parameters saved to {output_file}")


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
    
    # Train model
    model, params = train_bkt_model(df, num_fits=5)
    
    # Calculate mastery
    mastery = calculate_mastery_scores(model, df)
    
    # Export results
    export_mastery_scores(mastery)
    export_model_params(params)
    
    print("\n" + "=" * 50)
    print("✅ Training Complete!")
    print("=" * 50)
    print("\n📤 Next steps:")
    print("   1. Upload mastery_scores.json to your app")
    print("   2. Update localStorage in browser:")
    print("      localStorage.setItem('bkt_mastery_scores', <paste contents>)")
    print("   3. Retrain weekly as you get more data!")


if __name__ == '__main__':
    main()
