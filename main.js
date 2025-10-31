document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            // Use .trim() to remove leading/trailing whitespace
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            // Check for owner credentials
            if (email === 'mahin@mail.com' && password === 'mahin123') {
                window.location.href = 'owner-dashboard.html';
            }
            // Check for staff credentials
            else if (email === 'admin@mail.com' && password === 'admin123') {
                window.location.href = 'dashboard.html';
            }
            // If neither match, show an error
            else {
                alert('Invalid credentials. Please try again.');
            }
        });
    }
});