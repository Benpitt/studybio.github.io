// Authentication Guard - Redirects to login if not signed in
(function() {
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    // If no user data found, redirect to login
    if (!userId || !userName) {
        console.log('No authentication found - redirecting to login');
        window.location.href = 'index.html';
    } else {
        console.log('User authenticated:', userName);
    }
})();
