/**
 * Global Error Handler
 * Provides user-friendly error messages and logging
 */

import { debugError } from './config.js';

class ErrorHandler {
    constructor() {
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            debugError('Uncaught error:', event.error);
            this.showError('An unexpected error occurred. Refresh the page to continue. If the issue persists, try clearing your browser cache.');
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            debugError('Unhandled promise rejection:', event.reason);

            // Try to provide more specific error messages based on the rejection reason
            if (event.reason && typeof event.reason === 'string') {
                if (event.reason.includes('network') || event.reason.includes('fetch')) {
                    this.showError('Network error detected. Check your internet connection and try again.');
                } else if (event.reason.includes('permission') || event.reason.includes('denied')) {
                    this.showError('Permission denied. Sign out and sign in again to continue.');
                } else {
                    this.showError('Something went wrong. Refresh the page and try again.');
                }
            } else if (event.reason && event.reason.code) {
                // Handle Firebase errors
                this.handleFirebaseError(event.reason);
            } else {
                this.showError('Something went wrong. Refresh the page and try again. If the problem continues, try a different browser.');
            }
        });
    }

    /**
     * Display a user-friendly error message
     */
    showError(message, duration = 5000) {
        // Check if we have the toast notification system
        if (window.toast && typeof window.toast.error === 'function') {
            window.toast.error(message, duration);
            return;
        }

        // Fallback to creating a custom error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: start; gap: 12px;">
                <span style="font-size: 20px;">⚠️</span>
                <div>
                    <div style="font-weight: 600; margin-bottom: 4px;">Error</div>
                    <div style="font-size: 14px; opacity: 0.9;">${message}</div>
                </div>
            </div>
        `;

        document.body.appendChild(errorDiv);

        // Auto-remove after duration
        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => errorDiv.remove(), 300);
        }, duration);
    }

    /**
     * Show a success message
     */
    showSuccess(message, duration = 3000) {
        if (window.toast && typeof window.toast.success === 'function') {
            window.toast.success(message, duration);
            return;
        }

        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        successDiv.innerHTML = `
            <div style="display: flex; align-items: start; gap: 12px;">
                <span style="font-size: 20px;">✓</span>
                <div>
                    <div style="font-weight: 600; margin-bottom: 4px;">Success</div>
                    <div style="font-size: 14px; opacity: 0.9;">${message}</div>
                </div>
            </div>
        `;

        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => successDiv.remove(), 300);
        }, duration);
    }

    /**
     * Handle authentication errors
     */
    handleAuthError(error) {
        debugError('Auth error:', error);

        const errorMessages = {
            'auth/popup-closed-by-user': 'Sign-in was cancelled. Click "Sign in with Google" to try again.',
            'auth/network-request-failed': 'Network error detected. Check your internet connection and refresh the page.',
            'auth/too-many-requests': 'Too many sign-in attempts. Wait a few minutes, then try again.',
            'auth/user-disabled': 'This account has been disabled. Contact support for assistance.',
            'auth/invalid-credential': 'Invalid credentials provided. Make sure you\'re using the correct Google account.',
            'auth/account-exists-with-different-credential': 'An account already exists with the same email. Try signing in with a different method.',
            'default': 'Sign-in failed. Refresh the page and try again.'
        };

        const message = errorMessages[error.code] || errorMessages.default;
        this.showError(message);
    }

    /**
     * Handle Firebase errors
     */
    handleFirebaseError(error) {
        debugError('Firebase error:', error);

        const errorMessages = {
            'permission-denied': 'Permission denied. Your session may have expired - please sign out and sign in again.',
            'unavailable': 'Service temporarily unavailable. Check your internet connection and try again in a moment.',
            'not-found': 'Requested data not found. It may have been deleted or moved.',
            'already-exists': 'This item already exists. Try using a different name or ID.',
            'resource-exhausted': 'Too many requests. Wait a moment and try again.',
            'cancelled': 'Operation was cancelled. Refresh the page and try again.',
            'deadline-exceeded': 'Operation took too long. Check your connection and try again.',
            'unauthenticated': 'Not signed in. Please sign in to continue.',
            'default': 'An error occurred. Refresh the page and try again.'
        };

        const message = errorMessages[error.code] || errorMessages.default;
        this.showError(message);
    }

    /**
     * Handle network errors
     */
    handleNetworkError() {
        this.showError('Network error detected. Check your internet connection, then refresh the page or try again.');
    }

    /**
     * Handle storage errors
     */
    handleStorageError(error) {
        debugError('Storage error:', error);

        if (error.name === 'QuotaExceededError') {
            this.showError('Storage quota exceeded. Clear browser data or use private browsing to free up space.');
        } else {
            this.showError('Storage error occurred. Try clearing your browser cache or using a different browser.');
        }
    }

    /**
     * Handle validation errors
     */
    handleValidationError(message) {
        this.showError(`Validation error: ${message}. Please check your input and try again.`);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Expose globally for easy access
window.errorHandler = errorHandler;
