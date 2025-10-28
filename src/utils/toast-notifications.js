// Toast notification system for better error messages
class ToastNotification {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            padding: 16px 24px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            pointer-events: auto;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 400px;
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳'
        };

        const colors = {
            success: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            error: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            warning: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
            info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            loading: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        };

        toast.style.background = colors[type] || colors.info;
        toast.innerHTML = `
            <span style="font-size: 24px;">${icons[type] || icons.info}</span>
            <span>${message}</span>
        `;

        this.container.appendChild(toast);

        // Slide in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                toast.style.transform = 'translateX(400px)';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }

    loading(message) {
        return this.show(message, 'loading', 0); // Don't auto-dismiss
    }
}

// Global toast instance
window.toast = new ToastNotification();
