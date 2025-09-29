// Authentication Management - FIXED VERSION with Config Support
let currentUser = null;

// Helper functions to get API URLs from config
function getApiBaseUrl() {
    return window.APP_CONFIG?.API_BASE_URL || 'https://mamanalgerienne-backend.onrender.com/api';
}

function getServerBaseUrl() {
    return window.APP_CONFIG?.SERVER_BASE_URL || 'https://mamanalgerienne-backend.onrender.com';
}

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Auth: Checking authentication status...');
    console.log('🔐 Auth: API URL:', getApiBaseUrl());
    checkAuthStatus();
});

// Check if user is logged in
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (!token) {
        console.log('🔐 No token found, showing guest menu');
        showGuestMenu();
        return;
    }
    
    // If remember me is false and session expired, logout
    if (!rememberMe) {
        const loginTime = localStorage.getItem('loginTime');
        const currentTime = new Date().getTime();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        
        if (currentTime - loginTime > sessionDuration) {
            console.log('🔐 Session expired, logging out');
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
                console.log('🔐 Using test token for user:', currentUser.name);
                showUserMenu(currentUser);
                return;
            } catch (error) {
                console.error('❌ Error parsing stored user:', error);
                logout();
                return;
            }
        }
    }
    
    // Try to validate with backend
    try {
        console.log('🔐 Validating token with backend...');
        const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            console.log('✅ Token valid, user:', currentUser.name, 'ID:', currentUser._id || currentUser.id);
            
            // Update localStorage with fresh user data
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showUserMenu(data.user);
        } else {
            const errorData = await response.json();
            console.log('❌ Token validation failed:', errorData);
            
            // Handle token errors specifically
            if (errorData.code === 'TOKEN_INVALID' || errorData.code === 'TOKEN_EXPIRED') {
                console.log('Token invalid or expired, clearing and redirecting to login');
                showToast('انتهت صلاحية جلسة العمل، يرجى تسجيل الدخول مرة أخرى', 'warning');
                logout();
            } else {
                logout();
            }
        }
    } catch (error) {
        console.error('❌ Auth check error:', error);
        
        // If backend is down but we have stored user data, use it
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
                console.log('⚠️ Backend unavailable, using cached user data');
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
    
    // Show admin link if user is admin and element exists
    const adminLink = document.getElementById('admin-link');
    if (adminLink && user.isAdmin) {
        adminLink.style.display = 'block';
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

// Login function - FIXED VERSION with proper config usage
async function login(email, password, rememberMe = false) {
    try {
        console.log('🔑 Attempting login for:', email);
        showLoading();
        
        const apiUrl = `${getApiBaseUrl()}/auth/login`;
        console.log('🔑 Login API URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('🔑 Login response status:', response.status);
        
        const data = await response.json();
        console.log('🔑 Login response data:', data);
        
        if (response.ok && data.success) {
            // Store token and user info with proper ID field
            const userData = {
                ...data.user,
                id: data.user._id || data.user.id,
                _id: data.user._id || data.user.id
            };
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('rememberMe', rememberMe.toString());
            localStorage.setItem('loginTime', new Date().getTime().toString());
            
            currentUser = userData;
            
            console.log('✅ Login successful!');
            console.log('✅ User:', userData.name);
            console.log('✅ User ID:', userData._id);
            console.log('✅ Is Admin:', userData.isAdmin);
            console.log('✅ Token stored:', data.token.substring(0, 20) + '...');
            
            showToast('تم تسجيل الدخول بنجاح', 'success');
            
            // Update UI immediately
            showUserMenu(userData);
            
            // Redirect based on user type with a small delay
            setTimeout(() => {
                if (userData.isAdmin) {
                    console.log('🔄 Redirecting to admin page');
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('/pages/')) {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'pages/admin.html';
                    }
                } else {
                    console.log('🔄 Redirecting to home page');
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('/pages/')) {
                        window.location.href = '../index.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }
            }, 1000);
        } else {
            console.log('❌ Login failed:', data.message);
            showToast(data.message || 'خطأ في تسجيل الدخول', 'error');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        showToast('خطأ في الاتصال بالخادم: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Register function - FIXED with config
async function register(userData) {
    try {
        console.log('📝 Attempting registration for:', userData.email);
        showLoading();
        
        const apiUrl = `${getApiBaseUrl()}/auth/register`;
        console.log('📝 Register API URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store with proper ID field
            const userWithId = {
                ...data.user,
                id: data.user._id || data.user.id,
                _id: data.user._id || data.user.id
            };
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(userWithId));
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('loginTime', new Date().getTime().toString());
            
            currentUser = userWithId;
            
            console.log('✅ Registration successful!');
            console.log('✅ User:', userWithId.name);
            console.log('✅ User ID:', userWithId._id);
            
            showToast('تم إنشاء الحساب بنجاح', 'success');
            
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        } else {
            console.log('❌ Registration failed:', data.message);
            showToast(data.message || 'خطأ في إنشاء الحساب', 'error');
        }
    } catch (error) {
        console.error('❌ Register error:', error);
        showToast('خطأ في الاتصال بالخادم: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Logout function
function logout() {
    console.log('👋 Logging out...');
    
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
        alert(message);
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

console.log('✅ Auth.js loaded with config support');
