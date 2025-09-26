// Authentication Management - Fixed Version with CORRECT production URLs
let currentUser = null;

// Get server base URL dynamically - FIXED for production
function getServerBaseUrl() {
    // Check if we're in production (not localhost)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return 'https://mamanalgerienne-backend.onrender.com'; // CORRECT backend URL
    }
    return 'http://localhost:5000'; // Development URL
}

const SERVER_BASE_URL = getServerBaseUrl();
const API_BASE_URL = SERVER_BASE_URL + '/api';

console.log('🔗 Using API URL:', API_BASE_URL); // Debug log

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupMobileAuthMenu();
});

// Setup mobile auth menu
function setupMobileAuthMenu() {
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    const mobileProfileLink = document.getElementById('mobile-profile-link');
    const mobileAdminLink = document.getElementById('mobile-admin-link');

    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    if (mobileProfileLink) {
        mobileProfileLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentUser) {
                showProfile();
            } else {
                showLoginForm();
            }
        });
    }

    if (mobileAdminLink) {
        mobileAdminLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentUser && currentUser.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                alert('Accès administrateur requis');
            }
        });
    }
}

// Check if user is logged in
async function checkAuthStatus() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            currentUser = null;
            updateAuthUI();
            return;
        }

        console.log('🔍 Checking auth status with token...');
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            console.log('✅ User authenticated:', currentUser.email);
            updateAuthUI();
        } else {
            console.log('❌ Auth check failed:', response.status);
            currentUser = null;
            localStorage.removeItem('authToken');
            updateAuthUI();
        }
    } catch (error) {
        console.error('❌ Auth check error:', error);
        currentUser = null;
        localStorage.removeItem('authToken');
        updateAuthUI();
    }
}

// Login function - FIXED with correct API URL
async function login(email, password) {
    try {
        console.log('🚀 Attempting login to:', `${API_BASE_URL}/auth/login`);
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log('📡 Login response status:', response.status);

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Login successful');
            currentUser = data.user;
            localStorage.setItem('authToken', data.token);
            updateAuthUI();
            hideLoginForm();
            showSuccessMessage('Connexion réussie!');
            return { success: true, user: data.user };
        } else {
            console.log('❌ Login failed:', data.message);
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        showErrorMessage('Erreur de connexion: ' + error.message);
        return { success: false, error: error.message };
    }
}

// Register function - FIXED with correct API URL
async function register(userData) {
    try {
        console.log('🚀 Attempting registration to:', `${API_BASE_URL}/auth/register`);
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        console.log('📡 Registration response status:', response.status);

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Registration successful');
            currentUser = data.user;
            localStorage.setItem('authToken', data.token);
            updateAuthUI();
            hideLoginForm();
            showSuccessMessage('Inscription réussie!');
            return { success: true, user: data.user };
        } else {
            console.log('❌ Registration failed:', data.message);
            throw new Error(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('❌ Registration failed:', error.message);
        showErrorMessage('Erreur d\'inscription: ' + error.message);
        return { success: false, error: error.message };
    }
}

// Logout function
function logout() {
    currentUser = null;
    localStorage.removeItem('authToken');
    updateAuthUI();
    showSuccessMessage('Déconnexion réussie!');
    
    // Redirect to home if on protected page
    if (window.location.pathname.includes('admin') || window.location.pathname.includes('profile')) {
        window.location.href = 'index.html';
    }
}

// Update authentication UI
function updateAuthUI() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileBtn = document.getElementById('profile-btn');
    const adminBtn = document.getElementById('admin-btn');
    const userInfo = document.getElementById('user-info');
    
    // Mobile elements
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    const mobileProfileLink = document.getElementById('mobile-profile-link');
    const mobileAdminLink = document.getElementById('mobile-admin-link');

    if (currentUser) {
        // User is logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (profileBtn) profileBtn.style.display = 'inline-block';
        if (userInfo) {
            userInfo.style.display = 'inline-block';
            userInfo.textContent = `Bonjour, ${currentUser.firstName || currentUser.email}`;
        }
        
        // Show admin button only for admin users
        if (adminBtn) {
            adminBtn.style.display = currentUser.role === 'admin' ? 'inline-block' : 'none';
        }
        
        // Mobile UI
        if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
        if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'block';
        if (mobileProfileLink) mobileProfileLink.style.display = 'block';
        if (mobileAdminLink) {
            mobileAdminLink.style.display = currentUser.role === 'admin' ? 'block' : 'none';
        }
    } else {
        // User is not logged in
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        
        // Mobile UI
        if (mobileLoginBtn) mobileLoginBtn.style.display = 'block';
        if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';
        if (mobileProfileLink) mobileProfileLink.style.display = 'none';
        if (mobileAdminLink) mobileAdminLink.style.display = 'none';
    }
}

// Show login form
function showLoginForm() {
    const modal = document.getElementById('auth-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (modal) {
        modal.style.display = 'block';
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
    }
}

// Show register form
function showRegisterForm() {
    const modal = document.getElementById('auth-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (modal) {
        modal.style.display = 'block';
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
    }
}

// Hide login/register form
function hideLoginForm() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Show success message
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-weight: bold;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-weight: bold;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 5000);
}

// Show user profile
function showProfile() {
    if (!currentUser) {
        showLoginForm();
        return;
    }
    
    alert(`Profil: ${currentUser.firstName} ${currentUser.lastName}\nEmail: ${currentUser.email}\nRôle: ${currentUser.role}`);
}

// Export for use in other scripts
window.authManager = {
    login,
    register,
    logout,
    checkAuthStatus,
    getCurrentUser: () => currentUser,
    isLoggedIn: () => !!currentUser,
    isAdmin: () => currentUser && currentUser.role === 'admin'
};
