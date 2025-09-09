// js/config.js - Mobile & Production Ready Configuration
(function() {
    'use strict';

    // Environment detection that works on mobile
    function detectEnvironment() {
        const hostname = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        // More robust environment detection
        const isLocalhost = hostname === 'localhost' || 
                           hostname === '127.0.0.1' || 
                           hostname === '0.0.0.0' ||
                           hostname.includes('192.168.') ||
                           hostname.includes('10.0.') ||
                           hostname.includes('172.');
        
        const isDevelopment = isLocalhost || port === '3000' || port === '8080';
        
        console.log('Environment Detection:', {
            hostname,
            port,
            protocol,
            isLocalhost,
            isDevelopment
        });
        
        return {
            isDevelopment,
            isProduction: !isDevelopment,
            hostname,
            port,
            protocol
        };
    }

    const env = detectEnvironment();

    // Configuration object
    const config = {
        development: {
            // Local development URLs
            API_BASE_URL: 'http://localhost:5000',
            // Alternative for network access during development
            API_BASE_URL_NETWORK: `http://${window.location.hostname}:5000`
        },
        production: {
            // REPLACE THIS WITH YOUR ACTUAL RENDER BACKEND URL
            API_BASE_URL: 'https://mama-algerienne-backend.onrender.com',
            // Fallback URLs in case of issues
            API_BASE_URL_FALLBACK: 'https://mama-algerienne-api.onrender.com'
        }
    };

    // Get the appropriate API URL
    function getApiUrl() {
        if (env.isDevelopment) {
            // In development, try localhost first, then network IP
            return config.development.API_BASE_URL;
        } else {
            // In production, use the Render URL
            return config.production.API_BASE_URL;
        }
    }

    // API Configuration
    const API_CONFIG = {
        API_BASE_URL: getApiUrl(),
        FALLBACK_URL: env.isProduction ? config.production.API_BASE_URL_FALLBACK : config.development.API_BASE_URL_NETWORK,
        ENVIRONMENT: env.isDevelopment ? 'development' : 'production',
        
        // Request timeout for mobile networks
        TIMEOUT: 15000, // 15 seconds
        
        // Retry configuration for mobile
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
        
        // Default headers for mobile compatibility
        DEFAULT_HEADERS: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    // Enhanced API request function with mobile optimizations
    window.apiRequest = async function(endpoint, options = {}) {
        const url = `${API_CONFIG.API_BASE_URL}${endpoint}`;
        
        const config = {
            method: options.method || 'GET',
            headers: {
                ...API_CONFIG.DEFAULT_HEADERS,
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        console.log(`Making API request to: ${url}`);
        console.log('Request config:', config);

        try {
            // Add timeout for mobile networks
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
            
            config.signal = controller.signal;
            
            const response = await fetch(url, config);
            clearTimeout(timeoutId);
            
            console.log(`API Response (${response.status}):`, response);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('API Request failed:', error);
            
            // Try fallback URL in production
            if (API_CONFIG.ENVIRONMENT === 'production' && API_CONFIG.FALLBACK_URL !== API_CONFIG.API_BASE_URL) {
                console.log('Trying fallback URL...');
                try {
                    const fallbackUrl = `${API_CONFIG.FALLBACK_URL}${endpoint}`;
                    const response = await fetch(fallbackUrl, config);
                    
                    if (response.ok) {
                        return await response.json();
                    }
                } catch (fallbackError) {
                    console.error('Fallback request also failed:', fallbackError);
                }
            }
            
            throw error;
        }
    };

    // Health check function
    window.checkApiHealth = async function() {
        try {
            console.log('Checking API health...');
            const health = await window.apiRequest('/health');
            console.log('API Health Check:', health);
            return health;
        } catch (error) {
            console.error('API Health Check failed:', error);
            
            // Show user-friendly error
            if (typeof showToast === 'function') {
                showToast('لا يمكن الاتصال بالخادم. يرجى المحاولة لاحقاً', 'error');
            }
            
            return null;
        }
    };

    // Mobile debug function
    window.debugApiConnection = async function() {
        console.log('=== API DEBUG INFO ===');
        console.log('Environment:', API_CONFIG);
        console.log('Current URL:', window.location.href);
        console.log('User Agent:', navigator.userAgent);
        
        try {
            const health = await window.checkApiHealth();
            if (health) {
                console.log('✅ API Connection: SUCCESS');
                console.log('Server Info:', health);
            } else {
                console.log('❌ API Connection: FAILED');
            }
        } catch (error) {
            console.log('❌ API Connection: ERROR', error.message);
        }
        
        console.log('=== END DEBUG INFO ===');
    };

    // Test different API endpoints
    window.testApiEndpoints = async function() {
        const endpoints = ['/health', '/api/test', '/api/articles', '/api/products'];
        
        console.log('Testing API endpoints...');
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Testing ${endpoint}...`);
                const response = await window.apiRequest(endpoint);
                console.log(`✅ ${endpoint}:`, response);
            } catch (error) {
                console.log(`❌ ${endpoint}:`, error.message);
            }
        }
    };

    // Export configuration
    window.API_CONFIG = API_CONFIG;
    
    // Auto-run health check on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(window.checkApiHealth, 1000);
        });
    } else {
        setTimeout(window.checkApiHealth, 1000);
    }

    console.log('API Configuration loaded:', API_CONFIG);
})();
