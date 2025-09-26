// Configuration Management - Fixed Version for Production API Connectivity
(function() {
    'use strict';

    // Dynamic API URL detection based on environment
    function detectApiUrl() {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        console.log('🔍 Detecting API URL for hostname:', hostname);
        
        // Production mappings - FIXED URLs
        const productionMappings = {
            'anes255.github.io': 'https://mamanalgerienne-backend.onrender.com',
            'maman-algerienne.onrender.com': 'https://mamanalgerienne-backend.onrender.com',
            'mamanalgerienne.netlify.app': 'https://mamanalgerienne-backend.onrender.com',
            'mamanalgerienne.vercel.app': 'https://mamanalgerienne-backend.onrender.com'
        };
        
        // Check for exact production matches
        if (productionMappings[hostname]) {
            const apiUrl = productionMappings[hostname];
            console.log('✅ Production API URL detected:', apiUrl);
            return apiUrl;
        }
        
        // Development/localhost detection
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            const apiUrl = `${protocol}//${hostname}:5000`;
            console.log('🔧 Development API URL detected:', apiUrl);
            return apiUrl;
        }
        
        // Fallback to production backend for any unknown domain
        const fallbackUrl = 'https://mamanalgerienne-backend.onrender.com';
        console.log('🔄 Using fallback API URL:', fallbackUrl);
        return fallbackUrl;
    }

    // Test API connectivity
    async function testApiConnectivity(url = window.CONFIG.API_BASE_URL) {
        const testEndpoints = ['/health', '/api/test'];
        
        for (const endpoint of testEndpoints) {
            try {
                console.log(`🧪 Testing: ${url}${endpoint}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(`${url}${endpoint}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ API connectivity test passed:', data);
                    return { success: true, endpoint, data };
                } else {
                    console.log(`❌ API test failed for ${endpoint}: HTTP ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ API test failed for ${endpoint}:`, error.message);
            }
        }
        
        return { success: false };
    }

    // Enhanced fetch with better error handling
    async function apiRequest(endpoint, options = {}) {
        const url = endpoint.startsWith('http') 
            ? endpoint 
            : `${window.CONFIG.API_BASE_URL}${endpoint}`;
            
        const token = localStorage.getItem('authToken');
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };

        try {
            console.log(`🌐 API Request: ${defaultOptions.method} ${url}`);
            
            const response = await fetch(url, defaultOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ API Response: ${defaultOptions.method} ${url}`, data);
            return data;
            
        } catch (error) {
            console.error(`❌ API Error: ${defaultOptions.method} ${url}`, error);
            throw error;
        }
    }

    // Auto-detect and set the best API URL
    async function initializeApiConfig() {
        console.log('🚀 Auto-detecting best API URL...');
        
        const detectedUrl = detectApiUrl();
        
        // Test connectivity
        console.log('🔍 Searching for working API URL...');
        const connectivityTest = await testApiConnectivity(detectedUrl);
        
        if (connectivityTest.success) {
            console.log('✅ API URL confirmed working:', detectedUrl);
            window.CONFIG.API_BASE_URL = detectedUrl;
            window.CONFIG.SERVER_BASE_URL = detectedUrl;
        } else {
            console.log('⚠️ Primary API URL failed, using fallback');
            const fallbackUrl = 'https://mamanalgerienne-backend.onrender.com';
            window.CONFIG.API_BASE_URL = fallbackUrl;
            window.CONFIG.SERVER_BASE_URL = fallbackUrl;
        }
        
        // Update API endpoints with final URL
        window.CONFIG.ENDPOINTS = getApiEndpoints();
        
        console.log('⚙️ Config loaded:', window.CONFIG);
        return window.CONFIG;
    }

    // Get API endpoints configuration
    function getApiEndpoints() {
        const baseUrl = window.CONFIG.API_BASE_URL;
        
        return {
            // Health and testing
            HEALTH: `${baseUrl}/health`,
            TEST: `${baseUrl}/api/test`,
            
            // Auth endpoints  
            AUTH: {
                LOGIN: `${baseUrl}/api/auth/login`,
                REGISTER: `${baseUrl}/api/auth/register`,
                ME: `${baseUrl}/api/auth/me`,
                LOGOUT: `${baseUrl}/api/auth/logout`,
                FORGOT_PASSWORD: `${baseUrl}/api/auth/forgot-password`,
                RESET_PASSWORD: `${baseUrl}/api/auth/reset-password`
            },
            
            // Content endpoints - Using available routes from backend
            ARTICLES: {
                BASE: `${baseUrl}/api/articles`,
                FEATURED: `${baseUrl}/api/articles?featured=true`,
                BY_CATEGORY: (category) => `${baseUrl}/api/articles?category=${encodeURIComponent(category)}`,
                SEARCH: (query) => `${baseUrl}/api/articles?search=${encodeURIComponent(query)}`,
                BY_ID: (id) => `${baseUrl}/api/articles/${id}`
            },
            
            // Posts endpoints - Using available routes from backend
            POSTS: {
                BASE: `${baseUrl}/api/posts`,
                BY_TYPE: (type) => `${baseUrl}/api/posts?type=${encodeURIComponent(type)}`,
                FEATURED: `${baseUrl}/api/posts?featured=true`,
                SEARCH: (query) => `${baseUrl}/api/posts?search=${encodeURIComponent(query)}`,
                BY_ID: (id) => `${baseUrl}/api/posts/${id}`
            },
            
            // Admin endpoints
            ADMIN: {
                DASHBOARD: `${baseUrl}/api/admin/dashboard`,
                USERS: `${baseUrl}/api/admin/users`,
                ANALYTICS: `${baseUrl}/api/admin/analytics`
            },
            
            // Upload endpoints
            UPLOAD: {
                IMAGE: `${baseUrl}/api/upload/image`,
                AVATAR: `${baseUrl}/api/upload/avatar`
            }
        };
    }

    // Initialize global CONFIG object
    window.CONFIG = {
        // Will be set by initializeApiConfig()
        API_BASE_URL: '',
        SERVER_BASE_URL: '',
        ENDPOINTS: {},
        
        // Static configuration
        ENVIRONMENT: window.location.hostname === 'localhost' ? 'development' : 'production',
        DEBUG: window.location.hostname === 'localhost',
        UPLOAD_TIMEOUT: 60000,
        API_TIMEOUT: 15000,
        RETRY_ATTEMPTS: 3,
        
        // Utility functions
        apiRequest,
        testApiConnectivity,
        initializeApiConfig
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApiConfig);
    } else {
        initializeApiConfig();
    }

    console.log('🔧 Config module loaded');

})();
