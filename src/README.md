# Source Code

Shared source code, utilities, and resources used across the studying.works platform.

## Directory Structure

### `auth/`
Authentication and authorization modules:
- **auth-guard.js** - Route guard for protected pages
- **auth-service.js** - Firebase authentication service wrapper

### `services/`
External service integrations:
- **firebase-sync.js** - Firebase synchronization utilities

### `styles/`
Global CSS stylesheets:
- **button-styles.css** - Button component styles
- **global-styles.css** - Global styles and variables
- **loading-animations.css** - Loading animations and spinners

### `utils/`
Utility functions and helpers:
- **dynamic-gradient.js** - Dynamic gradient background animations
- **toast-notifications.js** - Toast notification system

## Usage

All source files are referenced with paths relative to the HTML file location:
- From root: `src/auth/auth-service.js`
- From pages/: `../src/auth/auth-service.js`
- From apps/: `../../src/auth/auth-service.js`

## Development

When adding new shared code:
1. Place it in the appropriate subdirectory based on its purpose
2. Update this README with a description
3. Ensure proper relative path references in HTML files
