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
            this.showError('An unexpected error occurred. Please refresh the page.');
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            debugError('Unhandled promise rejection:', event.reason);
            this.showError('Something went wrong. Please try again.');
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
            'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/invalid-credential': 'Invalid credentials. Please try again.',
            'default': 'Sign-in failed. Please try again.'
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
            'permission-denied': 'Permission denied. Please sign in again.',
            'unavailable': 'Service temporarily unavailable. Please try again.',
            'not-found': 'Data not found.',
            'already-exists': 'This item already exists.',
            'default': 'An error occurred. Please try again.'
        };

        const message = errorMessages[error.code] || errorMessages.default;
        this.showError(message);
    }

    /**
     * Handle network errors
     */
    handleNetworkError() {
        this.showError('Network error. Please check your internet connection.');
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
