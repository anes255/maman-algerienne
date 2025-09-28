// js/config.js - FIXED VERSION
(function() {
    'use strict';
    
    // Configuration for different environments
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

    // Auto-detect environment based on hostname
    function getEnvironment() {
        const hostname = window.location.hostname;
        console.log('🔍 Detecting API URL for hostname:', hostname);
        
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')) {
            return 'development';
        }
        return 'production';
    }

    // Get current configuration
    function getConfig() {
        const env = getEnvironment();
        const config = CONFIG[env];
        
        console.log('✅ Production API URL detected:', config.API_BASE_URL);
        
        return config;
    }

    // Test API connectivity
    async function testApiConnectivity(url) {
        try {
            console.log('🧪 Testing:', url);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API connectivity test passed:', data);
                return { success: true, data };
            } else {
                console.log('❌ API test failed:', response.status, response.statusText);
                return { success: false, status: response.status };
            }
        } catch (error) {
            console.log('❌ API test failed for /health:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Find working API URL
    async function findWorkingApiUrl() {
        console.log('🔍 Searching for working API URL...');
        
        const urlsToTry = [
            'https://mamanalgerienne-backend.onrender.com/health',
            'https://mamanalgerienne-backend.onrender.com/api/test',
            'https://maman-algerienne.onrender.com/health'
        ];

        for (const url of urlsToTry) {
            const result = await testApiConnectivity(url);
            if (result.success) {
                const baseUrl = url.replace('/health', '').replace('/api/test', '');
                console.log('✅ Found working API at:', baseUrl);
                return baseUrl;
            }
        }
        
        console.log('⚠️ No working API found, using default');
        return 'https://mamanalgerienne-backend.onrender.com';
    }

    // Auto-detect best API URL
    async function autoDetectApiUrl() {
        console.log('🚀 Auto-detecting best API URL...');
        
        const currentConfig = getConfig();
        
        // Test current config first
        const healthCheck = await testApiConnectivity(currentConfig.SERVER_BASE_URL + '/health');
        if (healthCheck.success) {
            console.log('✅ Current config API is working');
            return currentConfig;
        }
        
        // Try to find working API
        const workingUrl = await findWorkingApiUrl();
        
        return {
            API_BASE_URL: workingUrl + '/api',
            SERVER_BASE_URL: workingUrl,
            ENVIRONMENT: getEnvironment()
        };
    }

    // Initialize configuration
    let currentConfig = null;

    async function initializeConfig() {
        try {
            currentConfig = await autoDetectApiUrl();
            console.log('⚙️ Config loaded:', currentConfig);
            
            // Export to global scope
            window.APP_CONFIG = currentConfig;
            window.API_BASE_URL = currentConfig.API_BASE_URL;
            window.SERVER_BASE_URL = currentConfig.SERVER_BASE_URL;
            
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

    // Export functions
    window.getApiConfig = () => currentConfig || getConfig();
    window.initializeConfig = initializeConfig;
    window.testApiConnectivity = testApiConnectivity;

    // Auto-initialize if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeConfig);
    } else {
        initializeConfig();
    }

})();
