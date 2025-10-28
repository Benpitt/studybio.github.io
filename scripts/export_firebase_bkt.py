"""
Export BKT reviews from Firebase to JSON for training
"""

import json
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

print("=" * 50)
print("🔥 Firebase BKT Review Exporter")
print("=" * 50)

# Initialize Firebase Admin SDK
print("\n📡 Connecting to Firebase...")
try:
    # Download your service account key from Firebase Console
    # Project Settings > Service Accounts > Generate new private key
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Connected to Firebase!")
except Exception as e:
    print(f"\n❌ Error connecting to Firebase: {e}")
    print("\n📝 Setup instructions:")
    print("1. Go to Firebase Console")
    print("2. Project Settings > Service Accounts")
    print("3. Click 'Generate new private key'")
    print("4. Save as 'serviceAccountKey.json' in this directory")
    exit(1)

# Fetch all BKT reviews
print("\n📥 Fetching BKT reviews from Firestore...")
reviews_ref = db.collection('bkt_reviews')
docs = reviews_ref.stream()

reviews = []
for doc in docs:
    data = doc.to_dict()
    
    # Convert Firestore timestamp to ISO string
    if 'timestamp' in data and data['timestamp']:
        data['timestamp'] = data['timestamp'].isoformat()
    
    reviews.append(data)

print(f"✅ Found {len(reviews)} reviews")

if len(reviews) == 0:
    print("\n⚠️  No reviews found in Firebase!")
    print("   Make sure you've studied some cards in BKT Smart Study first.")
    exit(0)

# Show sample
print("\n📊 Sample review:")
print(json.dumps(reviews[0], indent=2))

# Export to JSON
output_file = 'bkt_reviews.json'
with open(output_file, 'w') as f:
    json.dump(reviews, f, indent=2)

print(f"\n💾 Exported to {output_file}")
print(f"   Total reviews: {len(reviews)}")

# Show stats
users = set(r.get('userId') for r in reviews)
skills = set(r.get('skill') for r in reviews)
correct_count = sum(1 for r in reviews if r.get('correct') == 1)
accuracy = (correct_count / len(reviews) * 100) if reviews else 0

print(f"\n📈 Statistics:")
print(f"   Users: {len(users)}")
print(f"   Skills: {len(skills)}")
print(f"   Overall accuracy: {accuracy:.1f}%")

print("\n" + "=" * 50)
print("✅ Export Complete!")
print("=" * 50)
print("\n📤 Next step: Run train_bkt.py")
