// auth-guard.js - Fixed version to prevent loops
(function() {
    // Check if we're already on index.html (login page)
    const isLoginPage = window.location.pathname.includes('index.html') || 
                        window.location.pathname === '/' ||
                        window.location.pathname === '';

    // If we're on a protected page, check authentication
    if (!isLoginPage) {
        // Check if user is in localStorage AND session is valid
        const userName = localStorage.getItem('userName');
        const userId = localStorage.getItem('userId');
        const sessionTimestamp = localStorage.getItem('sessionTimestamp');
        
        // If no user data OR session is older than 7 days, clear everything and redirect
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        if (!userName || !userId || !sessionTimestamp || (now - parseInt(sessionTimestamp)) > sevenDays) {
            console.log('No valid session found, redirecting to login...');
            localStorage.clear();
            window.location.href = 'index.html';
        } else {
            // Valid session exists, allow access
            console.log('Valid session found for:', userName);
        }
    }
})();
