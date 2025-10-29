# 🚀 Setup Guide for studying.works

This guide will help you set up studying.works for local development.

## 📋 Prerequisites

- **Web Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Node.js**: Version 14 or higher (optional, for running scripts)
- **Git**: For version control

## 🔧 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Benpitt/studying.works.git
cd studying.works
```

### 2. Install Dependencies (Optional)

If you want to run validation scripts:

```bash
npm install
```

### 3. Run Locally

**Option A: Direct File Opening**
- Simply open `index.html` in your browser
- Note: Some features may not work due to CORS restrictions

**Option B: Local Server (Recommended)**

Using Python:
```bash
python -m http.server 8000
# or
python3 -m http.server 8000
```

Using Node.js:
```bash
npm run serve
# or
npx serve .
```

Then open: http://localhost:8000

### 4. Test the Application

1. Click "Get Started with Google" on the homepage
2. Sign in with your Google account
3. Explore the dashboard and features

## 🔑 Firebase Configuration

The app uses Firebase for authentication and data storage. The Firebase configuration is already set up in the codebase.

### Using Your Own Firebase Project (Optional)

If you want to use your own Firebase project:

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Authentication
3. Enable Firestore Database
4. Update the Firebase config in `config.js`:

```javascript
export const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Firestore Security Rules

Apply these security rules in your Firebase console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /community/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 📁 Project Structure

```
studying.works/
├── index.html              # Landing page
├── dashboard.html          # Main dashboard
├── about.html             # About page
├── privacy.html           # Privacy policy
├── terms.html             # Terms of service
├── auth-service.js        # Authentication service
├── auth-guard.js          # Route protection
├── config.js              # Configuration
├── error-handler.js       # Error handling
├── dynamic-gradient.js    # Dynamic backgrounds
├── firebase-sync.js       # Firebase sync utilities
├── global-styles.css      # Global styles
├── button-styles.css      # Button styles
├── data/                  # Data files
├── scripts/               # Utility scripts
└── dashboard/             # Dashboard components
```

## 🧪 Running Scripts

**Validate Questions Data:**
```bash
npm run validate-questions
```

## 🐛 Troubleshooting

### Authentication Issues

**Problem**: Can't sign in with Google
- **Solution**: Make sure you're using a local server (not opening files directly)
- Check browser console for errors
- Verify Firebase configuration

**Problem**: "Permission denied" errors
- **Solution**: Check Firestore security rules
- Ensure user is properly authenticated

### Data Not Persisting

**Problem**: Data disappears after refresh
- **Solution**: Check browser localStorage settings
- Ensure cookies are enabled
- Check Firebase connection

### CORS Errors

**Problem**: "CORS policy" errors in console
- **Solution**: Use a local server instead of opening files directly
- The file:// protocol doesn't work well with modern web features

## 🔒 Security Notes

- Firebase API keys are safe to expose in client-side code
- Security is enforced by Firestore security rules
- Never commit real user data to the repository
- Keep sensitive configuration in environment variables for production

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

## 💬 Getting Help

- Check existing [GitHub Issues](https://github.com/Benpitt/studying.works/issues)
- Create a new issue with the `question` label
- Review the [Contributing Guide](CONTRIBUTING.md)

## 🎉 You're All Set!

You should now have studying.works running locally. Happy coding! 🎓

---

**Need help?** Open an issue on [GitHub](https://github.com/Benpitt/studying.works/issues) or check the documentation.
