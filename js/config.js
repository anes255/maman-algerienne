// js/config.js - ROBUST VERSION avec gestion des erreurs
(function() {
    'use strict';
    
    // Configuration pour différents environnements
    const CONFIG = {
        development: {
            API_BASE_URL: 'http://localhost:5000/api',
            SERVER_BASE_URL: 'http://localhost:5000',
            ENVIRONMENT: 'development'
        },
        production: {
            API_BASE_URL: 'https://mamanalgerienne-backend.onrender.com/api',
            SERVER_BASE_URL: 'https://mamanalgerienne-backend.onrender.com',
            ENVIRONMENT: 'production'
        }
    };

    // Détecter l'environnement
    function getEnvironment() {
        const hostname = window.location.hostname;
        console.log('🔍 Detecting API URL for hostname:', hostname);
        
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')) {
            return 'development';
        }
        return 'production';
    }

    // Obtenir la configuration actuelle
    function getConfig() {
        const env = getEnvironment();
        const config = CONFIG[env];
        
        console.log('✅ Environment detected:', env);
        console.log('🔧 Using API URL:', config.API_BASE_URL);
        
        return config;
    }

    // Tester la connectivité API avec timeout
    async function testApiConnectivity(url, timeout = 10000) {
        try {
            console.log('🧪 Testing:', url);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API connectivity test passed:', data);
                return { success: true, data };
            } else {
                console.log('❌ API test failed:', response.status, response.statusText);
                return { success: false, status: response.status };
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('⏱️ API test timed out for:', url);
                return { success: false, error: 'timeout' };
            } else if (error.message.includes('ERR_INTERNET_DISCONNECTED') || 
                       error.message.includes('Failed to fetch')) {
                console.log('🌐 Backend appears to be sleeping or unavailable:', url);
                return { success: false, error: 'offline' };
            } else {
                console.log('❌ API test failed for:', url, error.message);
                return { success: false, error: error.message };
            }
        }
    }

    // Réveiller le backend Render.com
    async function wakeUpBackend() {
        console.log('😴 Attempting to wake up backend...');
        
        const backendUrls = [
            'https://mamanalgerienne-backend.onrender.com/health',
            'https://mamanalgerienne-backend.onrender.com/api/test'
        ];
        
        // Essayer de réveiller le backend avec plusieurs tentatives
        for (let i = 0; i < 3; i++) {
            console.log(`🔄 Wake-up attempt ${i + 1}/3`);
            
            for (const url of backendUrls) {
                try {
                    const result = await testApiConnectivity(url, 15000);
                    if (result.success) {
                        console.log('🎉 Backend is now awake!');
                        return url.replace('/health', '').replace('/api/test', '');
                    }
                } catch (error) {
                    console.log('Wake-up failed for:', url);
                }
            }
            
            // Attendre 2 secondes entre les tentatives
            if (i < 2) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        console.log('😴 Backend is still sleeping or unavailable');
        return null;
    }

    // Trouver une URL API fonctionnelle
    async function findWorkingApiUrl() {
        console.log('🔍 Searching for working API URL...');
        
        const urlsToTry = [
            'https://mamanalgerienne-backend.onrender.com/health',
            'https://mamanalgerienne-backend.onrender.com/api/test'
        ];

        // Test rapide d'abord
        for (const url of urlsToTry) {
            const result = await testApiConnectivity(url, 5000);
            if (result.success) {
                const baseUrl = url.replace('/health', '').replace('/api/test', '');
                console.log('✅ Found working API at:', baseUrl);
                return baseUrl;
            }
        }
        
        // Si aucune URL ne fonctionne, essayer de réveiller le backend
        console.log('💤 No immediate response, attempting to wake up backend...');
        showWakeUpMessage();
        
        const wokenUrl = await wakeUpBackend();
        if (wokenUrl) {
            hideWakeUpMessage();
            return wokenUrl;
        }
        
        // Si le réveil échoue, utiliser l'URL par défaut
        console.log('⚠️ Using default URL despite connection issues');
        hideWakeUpMessage();
        showOfflineMessage();
        return 'https://mamanalgerienne-backend.onrender.com';
    }

    // Afficher un message de réveil
    function showWakeUpMessage() {
        let message = document.getElementById('wake-up-message');
        if (!message) {
            message = document.createElement('div');
            message.id = 'wake-up-message';
            message.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--primary-color, #d4a574);
                color: white;
                padding: 2rem;
                border-radius: 10px;
                text-align: center;
                z-index: 10000;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                max-width: 90%;
                width: 400px;
            `;
            
            message.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <i class="fas fa-coffee" style="font-size: 2rem; animation: pulse 1s infinite;"></i>
                </div>
                <h3 style="margin: 0 0 1rem 0;">إيقاظ الخادم...</h3>
                <p style="margin: 0; opacity: 0.9;">
                    الخادم في وضع السكون. جاري إيقاظه...<br>
                    قد يستغرق هذا دقيقة واحدة.
                </p>
                <div style="margin-top: 1rem;">
                    <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
                        <div style="height: 100%; background: white; width: 0%; animation: progress 30s linear infinite;"></div>
                    </div>
                </div>
                <style>
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                    @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
                </style>
            `;
            
            document.body.appendChild(message);
        }
    }

    // Cacher le message de réveil
    function hideWakeUpMessage() {
        const message = document.getElementById('wake-up-message');
        if (message) {
            message.remove();
        }
    }

    // Afficher un message hors ligne
    function showOfflineMessage() {
        let message = document.getElementById('offline-message');
        if (!message) {
            message = document.createElement('div');
            message.id = 'offline-message';
            message.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff6b6b;
                color: white;
                padding: 1rem;
                border-radius: 10px;
                z-index: 10000;
                max-width: 300px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            `;
            
            message.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-wifi" style="opacity: 0.5;"></i>
                    <div>
                        <strong>خادم غير متصل</strong><br>
                        <small>بعض الميزات قد لا تعمل</small>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; margin-left: auto;">×</button>
                </div>
            `;
            
            document.body.appendChild(message);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (message.parentElement) {
                    message.remove();
                }
            }, 10000);
        }
    }

    // Auto-détecter la meilleure URL API
    async function autoDetectApiUrl() {
        console.log('🚀 Auto-detecting best API URL...');
        
        const currentConfig = getConfig();
        
        // Tester d'abord la configuration actuelle
        const healthCheck = await testApiConnectivity(currentConfig.SERVER_BASE_URL + '/health', 8000);
        if (healthCheck.success) {
            console.log('✅ Current config API is working');
            return currentConfig;
        }
        
        // Essayer de trouver une API fonctionnelle
        const workingUrl = await findWorkingApiUrl();
        
        return {
            API_BASE_URL: workingUrl + '/api',
            SERVER_BASE_URL: workingUrl,
            ENVIRONMENT: getEnvironment()
        };
    }

    // Initialiser la configuration
    let currentConfig = null;

    async function initializeConfig() {
        try {
            currentConfig = await autoDetectApiUrl();
            console.log('⚙️ Config loaded:', currentConfig);
            
            // Exporter vers la portée globale
            window.APP_CONFIG = currentConfig;
            window.API_BASE_URL = currentConfig.API_BASE_URL;
            window.SERVER_BASE_URL = currentConfig.SERVER_BASE_URL;
            
            // Déclencher un événement pour notifier que la config est prête
            window.dispatchEvent(new CustomEvent('configReady', { detail: currentConfig }));
            
            return currentConfig;
        } catch (error) {
            console.error('Config initialization failed:', error);
            currentConfig = getConfig();
            window.APP_CONFIG = currentConfig;
            window.API_BASE_URL = currentConfig.API_BASE_URL;
            window.SERVER_BASE_URL = currentConfig.SERVER_BASE_URL;
            return currentConfig;
        }
    }

    // Mode fallback pour fonctionnement hors ligne
    function enableOfflineMode() {
        console.log('🔌 Enabling offline mode...');
        
        // Mock des fonctions principales
        window.mockApiRequest = function(endpoint, options = {}) {
            console.log('📱 Mock API call:', endpoint);
            
            return Promise.resolve({
                articles: [],
                products: [],
                posts: [],
                pagination: { total: 0, pages: 0, current: 1 },
                message: 'Mode hors ligne activé'
            });
        };
        
        // Remplacer les fonctions d'authentification
        window.mockLogin = function(email, password) {
            if (email === 'mamanalgeriennepartenariat@gmail.com' && password === 'anesaya75') {
                localStorage.setItem('token', 'offline-admin-token');
                localStorage.setItem('user', JSON.stringify({
                    id: 'offline-admin',
                    name: 'مدير الموقع (وضع عدم الاتصال)',
                    email: email,
                    isAdmin: true
                }));
                return Promise.resolve({
                    token: 'offline-admin-token',
                    user: { id: 'offline-admin', name: 'مدير الموقع (وضع عدم الاتصال)', email: email, isAdmin: true }
                });
            }
            return Promise.reject(new Error('بيانات خاطئة'));
        };
    }

    // Exporter les fonctions
    window.getApiConfig = () => currentConfig || getConfig();
    window.initializeConfig = initializeConfig;
    window.testApiConnectivity = testApiConnectivity;
    window.wakeUpBackend = wakeUpBackend;
    window.enableOfflineMode = enableOfflineMode;

    // Auto-initialiser si DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeConfig);
    } else {
        initializeConfig();
    }

})();
