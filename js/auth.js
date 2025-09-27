// Complete Auth.js - Authentication System
(function() {
    'use strict';
    
    console.log('🔐 Initializing authentication system...');
    
    // Auth state
    let authState = {
        currentUser: null,
        isAuthenticated: false,
        token: null
    };
    
    // Initialize authentication system
    function initializeAuth() {
        console.log('🎯 Auth initialization started...');
        
        try {
            loadAuthFromStorage();
            setupAuthUI();
            console.log('✅ Auth system initialized successfully');
        } catch (error) {
            console.error('❌ Auth initialization error:', error);
            showAuthToast('Erreur d\'initialisation de l\'authentification', 'error');
        }
    }
    
    function loadAuthFromStorage() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            try {
                authState.token = token;
                authState.currentUser = JSON.parse(userData);
                authState.isAuthenticated = true;
                
                console.log('👤 User loaded from storage:', authState.currentUser.email);
                
                // Verify token validity
                verifyToken();
            } catch (error) {
                console.error('❌ Error loading auth data:', error);
                clearAuthData();
            }
        }
    }
    
    async function verifyToken() {
        if (!authState.token) return;
        
        try {
            const response = await apiCall('/auth/profile');
            if (response) {
                authState.currentUser = response;
                updateUserData(response);
                console.log('✅ Token verified successfully');
            }
        } catch (error) {
            console.warn('⚠️ Token verification failed:', error);
            clearAuthData();
        }
    }
    
    function setupAuthUI() {
        console.log('🎨 Setting up auth UI...');
        
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        }
        
        // Logout buttons
        const logoutButtons = document.querySelectorAll('[data-logout]');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', handleLogout);
        });
        
        // Update UI based on auth state
        updateAuthUI();
        
        console.log('✅ Auth UI setup complete');
    }
    
    async function handleLogin(e) {
        e.preventDefault();
        
        console.log('🔑 Processing login...');
        
        try {
            showAuthLoading(true);
            
            const formData = new FormData(e.target);
            const credentials = {
                email: formData.get('email'),
                password: formData.get('password')
            };
            
            // Validate credentials
            validateLoginCredentials(credentials);
            
            // Send login request
            const response = await apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            
            // Handle successful login
            await handleAuthSuccess(response, 'Connexion réussie');
            
        } catch (error) {
            console.error('❌ Login error:', error);
            showAuthToast(error.message || 'Erreur de connexion', 'error');
        } finally {
            showAuthLoading(false);
        }
    }
    
    async function handleRegister(e) {
        e.preventDefault();
        
        console.log('📝 Processing registration...');
        
        try {
            showAuthLoading(true);
            
            const formData = new FormData(e.target);
            const userData = {
                nom: formData.get('nom'),
                prenom: formData.get('prenom'),
                email: formData.get('email'),
                telephone: formData.get('telephone'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };
            
            // Validate registration data
            validateRegistrationData(userData);
            
            // Remove confirmPassword before sending
            delete userData.confirmPassword;
            
            // Send registration request
            const response = await apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            // Handle successful registration
            await handleAuthSuccess(response, 'Inscription réussie');
            
        } catch (error) {
            console.error('❌ Registration error:', error);
            showAuthToast(error.message || 'Erreur d\'inscription', 'error');
        } finally {
            showAuthLoading(false);
        }
    }
    
    function handleLogout() {
        console.log('🚪 Processing logout...');
        
        try {
            clearAuthData();
            showAuthToast('Déconnexion réussie', 'success');
            
            // Redirect to home page
            if (window.app && typeof window.app.showPage === 'function') {
                window.app.showPage('home');
            }
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            showAuthToast('Erreur lors de la déconnexion', 'error');
        }
    }
    
    async function handleAuthSuccess(response, message) {
        console.log('✅ Auth success:', message);
        
        // Store auth data
        authState.token = response.token;
        authState.currentUser = response.user;
        authState.isAuthenticated = true;
        
        localStorage.setItem('token', response.token);
        updateUserData(response.user);
        
        // Update UI
        updateAuthUI();
        
        // Show success message
        showAuthToast(message, 'success');
        
        // Redirect based on user role
        setTimeout(() => {
            if (authState.currentUser.role === 'admin') {
                if (window.app && typeof window.app.showPage === 'function') {
                    window.app.showPage('admin');
                }
            } else {
                if (window.app && typeof window.app.showPage === 'function') {
                    window.app.showPage('home');
                }
            }
        }, 1000);
    }
    
    function validateLoginCredentials(credentials) {
        if (!credentials.email || !credentials.password) {
            throw new Error('Veuillez remplir tous les champs');
        }
        
        if (!isValidEmail(credentials.email)) {
            throw new Error('Veuillez saisir une adresse email valide');
        }
        
        if (credentials.password.length < 6) {
            throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }
    }
    
    function validateRegistrationData(userData) {
        const required = ['nom', 'email', 'password', 'confirmPassword'];
        const missing = required.filter(field => !userData[field] || userData[field].trim() === '');
        
        if (missing.length > 0) {
            throw new Error(`Veuillez remplir tous les champs obligatoires: ${missing.join(', ')}`);
        }
        
        if (!isValidEmail(userData.email)) {
            throw new Error('Veuillez saisir une adresse email valide');
        }
        
        if (userData.password.length < 6) {
            throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }
        
        if (userData.password !== userData.confirmPassword) {
            throw new Error('Les mots de passe ne correspondent pas');
        }
        
        if (userData.telephone && !isValidPhone(userData.telephone)) {
            throw new Error('Veuillez saisir un numéro de téléphone valide');
        }
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function isValidPhone(phone) {
        const phoneRegex = /^[0-9+\s-]{8,15}$/;
        return phoneRegex.test(phone);
    }
    
    function updateAuthUI() {
        console.log('🎨 Updating auth UI...');
        
        // Login/logout buttons
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        
        if (authState.isAuthenticated && authState.currentUser) {
            // Show user menu, hide login button
            if (loginBtn) loginBtn.classList.add('hidden');
            if (userMenu) userMenu.classList.remove('hidden');
            if (userName) userName.textContent = authState.currentUser.nom || authState.currentUser.email;
            
            // Show admin menu if user is admin
            updateAdminMenuVisibility();
            
        } else {
            // Show login button, hide user menu
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (userMenu) userMenu.classList.add('hidden');
            
            // Hide admin menu
            hideAdminMenu();
        }
        
        // Update mobile menu
        updateMobileAuthUI();
    }
    
    function updateAdminMenuVisibility() {
        const adminMenuItems = document.querySelectorAll('[data-admin-only]');
        const isAdmin = authState.currentUser && authState.currentUser.role === 'admin';
        
        adminMenuItems.forEach(item => {
            if (isAdmin) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
        
        // Add admin navigation link if user is admin
        if (isAdmin) {
            addAdminNavigationLink();
        }
    }
    
    function addAdminNavigationLink() {
        const nav = document.querySelector('nav .hidden.md\\:flex');
        if (!nav) return;
        
        // Check if admin link already exists
        if (nav.querySelector('[data-page="admin"]')) return;
        
        const adminLink = document.createElement('a');
        adminLink.href = '#';
        adminLink.setAttribute('data-page', 'admin');
        adminLink.className = 'text-gray-700 hover:text-green-600 transition-colors';
        adminLink.innerHTML = '<i class="fas fa-cog mr-1"></i>Admin';
        
        // Insert before search section
        const searchSection = nav.querySelector('div.flex.items-center.space-x-2');
        if (searchSection) {
            nav.insertBefore(adminLink, searchSection);
        }
    }
    
    function hideAdminMenu() {
        const adminMenuItems = document.querySelectorAll('[data-admin-only]');
        adminMenuItems.forEach(item => {
            item.classList.add('hidden');
        });
        
        // Remove admin navigation link
        const adminLink = document.querySelector('[data-page="admin"]');
        if (adminLink) {
            adminLink.remove();
        }
    }
    
    function updateMobileAuthUI() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (!mobileMenu) return;
        
        // Update mobile menu based on auth state
        const mobileLoginBtn = mobileMenu.querySelector('button');
        if (mobileLoginBtn) {
            if (authState.isAuthenticated) {
                mobileLoginBtn.textContent = 'Se déconnecter';
                mobileLoginBtn.onclick = handleLogout;
                mobileLoginBtn.className = 'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-left';
            } else {
                mobileLoginBtn.textContent = 'Se connecter';
                mobileLoginBtn.onclick = () => {
                    if (window.app && typeof window.app.showPage === 'function') {
                        window.app.showPage('login');
                    }
                };
                mobileLoginBtn.className = 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-left';
            }
        }
    }
    
    function updateUserData(userData) {
        localStorage.setItem('userData', JSON.stringify(userData));
        authState.currentUser = userData;
    }
    
    function clearAuthData() {
        console.log('🧹 Clearing auth data...');
        
        authState.currentUser = null;
        authState.isAuthenticated = false;
        authState.token = null;
        
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        
        updateAuthUI();
    }
    
    function showAuthLoading(isLoading) {
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        const registerBtn = document.querySelector('#registerForm button[type="submit"]');
        
        [loginBtn, registerBtn].forEach(btn => {
            if (btn) {
                if (isLoading) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Traitement...';
                } else {
                    btn.disabled = false;
                    btn.innerHTML = btn.getAttribute('data-original-text') || 'Valider';
                }
            }
        });
        
        // Show/hide loading overlay
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.classList.toggle('hidden', !isLoading);
        }
    }
    
    function showAuthToast(message, type = 'info') {
        console.log(`🔔 Auth toast: ${message} (${type})`);
        
        // Use main app toast if available
        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(message, type);
        } else {
            // Fallback toast
            const toast = document.createElement('div');
            toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
                type === 'success' ? 'bg-green-500' : 
                type === 'error' ? 'bg-red-500' : 
                type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 4000);
        }
    }
    
    // Check if user has specific permission
    function hasPermission(permission) {
        if (!authState.isAuthenticated || !authState.currentUser) {
            return false;
        }
        
        // Admin has all permissions
        if (authState.currentUser.role === 'admin') {
            return true;
        }
        
        // Check specific permissions
        const userPermissions = authState.currentUser.permissions || [];
        return userPermissions.includes(permission);
    }
    
    // Require authentication for certain actions
    function requireAuth(callback, redirectPage = 'login') {
        if (!authState.isAuthenticated) {
            showAuthToast('Vous devez être connecté pour effectuer cette action', 'warning');
            if (window.app && typeof window.app.showPage === 'function') {
                window.app.showPage(redirectPage);
            }
            return false;
        }
        
        if (typeof callback === 'function') {
            callback();
        }
        return true;
    }
    
    // Require admin role
    function requireAdmin(callback) {
        if (!authState.isAuthenticated || authState.currentUser.role !== 'admin') {
            showAuthToast('Accès non autorisé', 'error');
            if (window.app && typeof window.app.showPage === 'function') {
                window.app.showPage('home');
            }
            return false;
        }
        
        if (typeof callback === 'function') {
            callback();
        }
        return true;
    }
    
    // Get current user data
    function getCurrentUser() {
        return authState.currentUser;
    }
    
    // Check if user is authenticated
    function isAuthenticated() {
        return authState.isAuthenticated;
    }
    
    // Get auth token
    function getAuthToken() {
        return authState.token;
    }
    
    // Auto-refresh token if needed
    async function refreshToken() {
        if (!authState.token) return false;
        
        try {
            const response = await apiCall('/auth/refresh', {
                method: 'POST'
            });
            
            if (response && response.token) {
                authState.token = response.token;
                localStorage.setItem('token', response.token);
                console.log('✅ Token refreshed successfully');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Token refresh failed:', error);
            clearAuthData();
        }
        
        return false;
    }
    
    // Global exports
    window.initializeAuth = initializeAuth;
    window.handleLogin = handleLogin;
    window.handleRegister = handleRegister;
    window.handleLogout = handleLogout;
    window.getCurrentUser = getCurrentUser;
    window.isAuthenticated = isAuthenticated;
    window.getAuthToken = getAuthToken;
    window.hasPermission = hasPermission;
    window.requireAuth = requireAuth;
    window.requireAdmin = requireAdmin;
    window.refreshToken = refreshToken;
    
    console.log('✅ Auth system loaded successfully');
    
})();
