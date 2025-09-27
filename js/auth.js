// Authentication Management - FULLY FIXED VERSION
let currentUser = null;

// Get API base URL dynamically
function getApiBaseUrl() {
    if (window.APP_CONFIG) {
        return window.APP_CONFIG.API_BASE_URL;
    }
    
    // Fallback detection
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    return 'https://mamanalgerienne-backend.onrender.com/api';
}

// Get server base URL dynamically  
function getServerBaseUrl() {
    if (window.APP_CONFIG) {
        return window.APP_CONFIG.SERVER_BASE_URL;
    }
    
    // Fallback detection
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    return 'https://mamanalgerienne-backend.onrender.com';
}

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
});

// Check if user is logged in
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (!token) {
        showGuestMenu();
        return;
    }
    
    // If remember me is false and session expired, logout
    if (!rememberMe) {
        const loginTime = localStorage.getItem('loginTime');
        const currentTime = new Date().getTime();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        
        if (currentTime - loginTime > sessionDuration) {
            logout();
            return;
        }
    }
    
    // For test token, use stored user data
    if (token === 'test-admin-token') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
                showUserMenu(currentUser);
                return;
            } catch (error) {
                console.error('Error parsing stored user:', error);
                logout();
                return;
            }
        }
    }
    
    // Try to validate with backend
    try {
        const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
                currentUser = data.user;
                showUserMenu(data.user);
            } else {
                logout();
            }
        } else {
            logout();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        
        // If backend is down but we have stored user data, use it
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
                showUserMenu(currentUser);
            } catch (parseError) {
                logout();
            }
        } else {
            logout();
        }
    }
}

// Show guest menu
function showGuestMenu() {
    const guestMenu = document.getElementById('user-menu-guest');
    const loggedMenu = document.getElementById('user-menu-logged');
    
    if (guestMenu) guestMenu.style.display = 'flex';
    if (loggedMenu) loggedMenu.style.display = 'none';

    // Mobile menu
    const mobileGuestMenu = document.getElementById('mobile-auth-guest');
    const mobileLoggedMenu = document.getElementById('mobile-auth-logged');
    
    if (mobileGuestMenu) mobileGuestMenu.style.display = 'flex';
    if (mobileLoggedMenu) mobileLoggedMenu.classList.remove('show');
}

// Show user menu
function showUserMenu(user) {
    const guestMenu = document.getElementById('user-menu-guest');
    const loggedMenu = document.getElementById('user-menu-logged');
    const userName = document.getElementById('user-name');
    const userAvatarImg = document.getElementById('user-avatar-img');
    
    if (guestMenu) guestMenu.style.display = 'none';
    if (loggedMenu) loggedMenu.style.display = 'block';
    
    if (userName) userName.textContent = user.name;
    
    if (userAvatarImg) {
        const avatarUrl = user.avatar 
            ? `${getServerBaseUrl()}/uploads/avatars/${user.avatar}`
            : `https://via.placeholder.com/35x35/d4a574/ffffff?text=${user.name.charAt(0)}`;
        userAvatarImg.src = avatarUrl;
        userAvatarImg.onerror = function() {
            this.src = `https://via.placeholder.com/35x35/d4a574/ffffff?text=${user.name.charAt(0)}`;
        };
    }

    // Mobile menu
    const mobileGuestMenu = document.getElementById('mobile-auth-guest');
    const mobileLoggedMenu = document.getElementById('mobile-auth-logged');
    const mobileUserName = document.getElementById('mobile-user-name');
    const mobileUserAvatar = document.getElementById('mobile-user-avatar');
    
    if (mobileGuestMenu) mobileGuestMenu.style.display = 'none';
    if (mobileLoggedMenu) mobileLoggedMenu.classList.add('show');
    if (mobileUserName) mobileUserName.textContent = user.name;
    if (mobileUserAvatar) {
        const avatarUrl = user.avatar 
            ? `${getServerBaseUrl()}/uploads/avatars/${user.avatar}`
            : `https://via.placeholder.com/40x40/d4a574/ffffff?text=${user.name.charAt(0)}`;
        mobileUserAvatar.src = avatarUrl;
    }
    
    // Show admin link if user is admin and element exists
    const adminLink = document.getElementById('admin-link');
    const mobileAdminLink = document.getElementById('mobile-admin-link');
    if (user.isAdmin) {
        if (adminLink) adminLink.style.display = 'block';
        if (mobileAdminLink) mobileAdminLink.style.display = 'block';
    }

    // Setup navigation links
    setTimeout(() => {
        setupNavigationLinks();
    }, 100);
}

// Setup navigation links
function setupNavigationLinks() {
    const profileLink = document.getElementById('profile-link');
    const myPostsLink = document.getElementById('my-posts-link');
    const mobileProfileLink = document.getElementById('mobile-profile-link');
    
    if (profileLink) {
        profileLink.onclick = function(e) {
            e.preventDefault();
            if (!isLoggedIn()) {
                showToast('يجب تسجيل الدخول أولاً', 'warning');
                return;
            }
            const currentPath = window.location.pathname;
            if (currentPath.includes('/pages/')) {
                window.location.href = 'profile.html';
            } else {
                window.location.href = 'pages/profile.html';
            }
        };
    }
    
    if (mobileProfileLink) {
        mobileProfileLink.onclick = function(e) {
            e.preventDefault();
            if (!isLoggedIn()) {
                showToast('يجب تسجيل الدخول أولاً', 'warning');
                return;
            }
            const currentPath = window.location.pathname;
            if (currentPath.includes('/pages/')) {
                window.location.href = 'profile.html';
            } else {
                window.location.href = 'pages/profile.html';
            }
        };
    }
    
    if (myPostsLink) {
        myPostsLink.onclick = function(e) {
            e.preventDefault();
            if (!isLoggedIn()) {
                showToast('يجب تسجيل الدخول أولاً', 'warning');
                return;
            }
            const currentPath = window.location.pathname;
            if (currentPath.includes('/pages/')) {
                window.location.href = 'my-posts.html';
            } else {
                window.location.href = 'pages/my-posts.html';
            }
        };
    }
}

// Login function - COMPLETELY FIXED VERSION
async function login(email, password, rememberMe = false) {
    try {
        showLoading();
        
        console.log('🔐 Attempting login with:', { email, rememberMe });
        
        const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('📡 Login response status:', response.status);
        console.log('📡 Response headers:', [...response.headers.entries()]);
        
        // Get response text first
        const responseText = await response.text();
        console.log('📡 Raw response:', responseText);
        
        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('❌ Failed to parse response as JSON:', jsonError);
            console.error('❌ Response text:', responseText);
            showToast('خطأ في استجابة الخادم', 'error');
            return;
        }
        
        console.log('📡 Parsed response:', data);
        
        // Check if login was successful
        if (response.ok && data.success) {
            console.log('✅ Login successful');
            
            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('rememberMe', rememberMe.toString());
            localStorage.setItem('loginTime', new Date().getTime().toString());
            
            currentUser = data.user;
            showToast(data.message || 'تم تسجيل الدخول بنجاح', 'success');
            
            console.log('👤 User logged in:', data.user);
            console.log('🔑 Is Admin:', data.user.isAdmin);
            
            // Update UI immediately
            showUserMenu(data.user);
            
            // Redirect based on user type with a small delay
            setTimeout(() => {
                if (data.user.isAdmin) {
                    console.log('➡️ Redirecting to admin page');
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('/pages/')) {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'pages/admin.html';
                    }
                } else {
                    console.log('➡️ Redirecting to home page');
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('/pages/')) {
                        window.location.href = '../index.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }
            }, 1000);
        } else {
            // Handle error response
            console.log('❌ Login failed');
            const errorMessage = data.message || 'خطأ في تسجيل الدخول';
            showToast(errorMessage, 'error');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        
        // More specific error messages
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showToast('خطأ في الاتصال بالخادم، تأكد من الاتصال بالإنترنت', 'error');
        } else {
            showToast('خطأ في الاتصال بالخادم', 'error');
        }
    } finally {
        hideLoading();
    }
}

// Register function - FIXED VERSION
async function register(userData) {
    try {
        showLoading();
        
        console.log('🔐 Attempting registration with:', userData);
        
        const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        console.log('📡 Register response status:', response.status);
        
        // Get response text first
        const responseText = await response.text();
        console.log('📡 Raw response:', responseText);
        
        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('❌ Failed to parse response as JSON:', jsonError);
            showToast('خطأ في استجابة الخادم', 'error');
            return;
        }
        
        if (response.ok && data.success) {
            console.log('✅ Registration successful');
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('loginTime', new Date().getTime().toString());
            
            currentUser = data.user;
            showToast(data.message || 'تم إنشاء الحساب بنجاح', 'success');
            
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        } else {
            const errorMessage = data.message || 'خطأ في إنشاء الحساب';
            showToast(errorMessage, 'error');
        }
    } catch (error) {
        console.error('❌ Register error:', error);
        showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('loginTime');
    
    currentUser = null;
    showGuestMenu();
    showToast('تم تسجيل الخروج بنجاح', 'info');
    
    // Redirect to home if on protected page
    const protectedPages = ['admin.html', 'profile.html', 'my-posts.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/pages/')) {
            window.location.href = '../index.html';
        } else {
            window.location.href = 'index.html';
        }
    }
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check if user is admin
function isAdmin() {
    return currentUser && currentUser.isAdmin;
}

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null && localStorage.getItem('token') !== null;
}

// Require authentication
function requireAuth() {
    if (!isLoggedIn()) {
        showToast('يجب تسجيل الدخول أولاً', 'warning');
        const currentPath = window.location.pathname;
        if (currentPath.includes('/pages/')) {
            window.location.href = 'login.html';
        } else {
            window.location.href = 'pages/login.html';
        }
        return false;
    }
    return true;
}

// Require admin access
function requireAdmin() {
    if (!requireAuth()) return false;
    
    if (!isAdmin()) {
        showToast('هذه الصفحة مخصصة للمديرين فقط', 'error');
        const currentPath = window.location.pathname;
        if (currentPath.includes('/pages/')) {
            window.location.href = '../index.html';
        } else {
            window.location.href = 'index.html';
        }
        return false;
    }
    return true;
}

// Form validation helpers
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function validatePassword(password) {
    return password.length >= 6;
}

// Utility functions
function showLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.add('show');
    }
}

function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.remove('show');
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
        // If no toast container, show alert as fallback
        console.log(`TOAST ${type.toUpperCase()}: ${message}`);
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        default: return 'fas fa-info-circle';
    }
}

// Theme management for all pages
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('siteTheme');
    if (savedTheme) {
        try {
            const theme = JSON.parse(savedTheme);
            applyTheme(theme);
        } catch (error) {
            console.error('Error loading saved theme:', error);
        }
    }
}

function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--secondary-color', theme.secondaryColor);
    root.style.setProperty('--text-color', theme.textColor);
    root.style.setProperty('--gradient', `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`);
}

// Load theme on all pages
document.addEventListener('DOMContentLoaded', function() {
    loadSavedTheme();
});

// Also load theme immediately for faster loading
loadSavedTheme();

// Export functions for global use
window.login = login;
window.register = register;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.isAdmin = isAdmin;
window.isLoggedIn = isLoggedIn;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;
window.checkAuthStatus = checkAuthStatus;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.validatePassword = validatePassword;
