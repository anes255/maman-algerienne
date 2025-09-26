// Configuration Management - Fixed Version with CORRECT URLs
(function() {
    'use strict';

    // Get server base URL dynamically - FIXED
    function getServerBaseUrl() {
        const hostname = window.location.hostname;
        
        // Production environment detection
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return 'https://mamanalgerienne-backend.onrender.com'; // CORRECT backend URL
        }
        
        // Development environment
        return 'http://localhost:5000';
    }

    // Get environment
    function getEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        }
        
        return 'production';
    }

    // Configuration object - FIXED URLs
    const CONFIG = {
        development: {
            API_BASE_URL: 'http://localhost:5000/api',
            SERVER_BASE_URL: 'http://localhost:5000',
            ENVIRONMENT: 'development',
            DEBUG: true,
            UPLOAD_TIMEOUT: 30000, // 30 seconds
            API_TIMEOUT: 10000,    // 10 seconds
            RETRY_ATTEMPTS: 3
        },
        production: {
            API_BASE_URL: 'https://mamanalgerienne-backend.onrender.com/api', // FIXED URL
            SERVER_BASE_URL: 'https://mamanalgerienne-backend.onrender.com', // FIXED URL
            ENVIRONMENT: 'production',
            DEBUG: false,
            UPLOAD_TIMEOUT: 60000, // 60 seconds (longer for slower connections)
            API_TIMEOUT: 15000,    // 15 seconds
            RETRY_ATTEMPTS: 2
        }
    };

    // Get current environment config
    function getCurrentConfig() {
        const env = getEnvironment();
        const config = CONFIG[env];
        
        // Override URLs with dynamic detection
        config.SERVER_BASE_URL = getServerBaseUrl();
        config.API_BASE_URL = getServerBaseUrl() + '/api';
        
        return config;
    }

    // Get API endpoints
    function getApiEndpoints() {
        const baseUrl = getCurrentConfig().API_BASE_URL;
        
        return {
            // Auth endpoints
            AUTH: {
                LOGIN: `${baseUrl}/auth/login`,
                REGISTER: `${baseUrl}/auth/register`,
                ME: `${baseUrl}/auth/me`,
                LOGOUT: `${baseUrl}/auth/logout`,
                FORGOT_PASSWORD: `${baseUrl}/auth/forgot-password`,
                RESET_PASSWORD: `${baseUrl}/auth/reset-password`
            },
            
            // Articles endpoints
            ARTICLES: {
                BASE: `${baseUrl}/articles`,
                FEATURED: `${baseUrl}/articles?featured=true`,
                BY_CATEGORY: (category) => `${baseUrl}/articles/category/${encodeURIComponent(category)}`,
                SEARCH: (query) => `${baseUrl}/articles?search=${encodeURIComponent(query)}`,
                BY_ID: (id) => `${baseUrl}/articles/${id}`
            },
            
            // Posts endpoints
            POSTS: {
                BASE: `${baseUrl}/posts`,
                ADS: `${baseUrl}/posts?type=ad`,
                COMMUNITY: `${baseUrl}/posts?type=community`,
                BY_USER: (userId) => `${baseUrl}/posts/user/${userId}`,
                BY_ID: (id) => `${baseUrl}/posts/${id}`,
                LIKE: (id) => `${baseUrl}/posts/${id}/like`
            },
            
            // Products endpoints
            PRODUCTS: {
                BASE: `${baseUrl}/products`,
                FEATURED: `${baseUrl}/products?featured=true`,
                BY_CATEGORY: (category) => `${baseUrl}/products/category/${encodeURIComponent(category)}`,
                SEARCH: (query) => `${baseUrl}/products?search=${encodeURIComponent(query)}`,
                BY_ID: (id) => `${baseUrl}/products/${id}`
            },
            
            // Comments endpoints
            COMMENTS: {
                BASE: `${baseUrl}/comments`,
                BY_TARGET: (type, id) => `${baseUrl}/comments/${type}/${id}`,
                BY_ID: (id) => `${baseUrl}/comments/${id}`
            },
            
            // Admin endpoints
            ADMIN: {
                DASHBOARD: `${baseUrl}/admin/dashboard`,
                USERS: `${baseUrl}/admin/users`,
                POSTS: `${baseUrl}/admin/posts`,
                ARTICLES: `${baseUrl}/admin/articles`,
                PRODUCTS: `${baseUrl}/admin/products`,
                COMMENTS: `${baseUrl}/admin/comments`,
                SETTINGS: `${baseUrl}/admin/settings`
            },
            
            // Orders endpoints
            ORDERS: {
                BASE: `${baseUrl}/orders`,
                BY_USER: `${baseUrl}/orders/user`,
                BY_ID: (id) => `${baseUrl}/orders/${id}`
            },

            // Health check
            HEALTH: `${getCurrentConfig().SERVER_BASE_URL}/health`
        };
    }

    // Helper function to build URL with query parameters
    function buildUrl(baseUrl, params = {}) {
        const url = new URL(baseUrl);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        return url.toString();
    }

    // API request helper with retry logic
    async function makeApiRequest(url, options = {}, retryCount = 0) {
        const config = getCurrentConfig();
        const maxRetries = config.RETRY_ATTEMPTS;
        
        const defaultOptions = {
            timeout: config.API_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            defaultOptions.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);
            
            console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, {
                ...defaultOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
            
        } catch (error) {
            if (config.DEBUG) {
                console.error(`📡 API Request failed (attempt ${retryCount + 1}):`, error);
            }
            
            // Retry logic for network errors
            if (retryCount < maxRetries && 
                (error.name === 'AbortError' || error.name === 'TypeError')) {
                
                // Exponential backoff
                const delay = Math.pow(2, retryCount) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                
                console.log(`🔄 Retrying API request (${retryCount + 1}/${maxRetries})...`);
                return makeApiRequest(url, options, retryCount + 1);
            }
            
            throw error;
        }
    }

    // Application settings
    const APP_SETTINGS = {
        PAGINATION: {
            DEFAULT_LIMIT: 10,
            MAX_LIMIT: 50
        },
        UPLOAD: {
            MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
            ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            MAX_FILES: 10
        },
        CACHE: {
            ARTICLES_TTL: 5 * 60 * 1000,    // 5 minutes
            POSTS_TTL: 2 * 60 * 1000,       // 2 minutes
            PRODUCTS_TTL: 10 * 60 * 1000    // 10 minutes
        },
        UI: {
            TOAST_DURATION: 5000,
            LOADING_DELAY: 300,
            DEBOUNCE_DELAY: 500
        }
    };

    // Export configuration
    const appConfig = getCurrentConfig();
    const apiEndpoints = getApiEndpoints();

    // Global exports
    window.APP_CONFIG = appConfig;
    window.API_ENDPOINTS = apiEndpoints;
    window.APP_SETTINGS = APP_SETTINGS;
    window.buildUrl = buildUrl;
    window.makeApiRequest = makeApiRequest;
    
    // For debugging
    console.log('🔧 Environment:', appConfig.ENVIRONMENT);
    console.log('🌐 Server URL:', appConfig.SERVER_BASE_URL);
    console.log('🔗 API URL:', appConfig.API_BASE_URL);
    if (appConfig.DEBUG) {
        console.log('📊 Full Config:', appConfig);
        console.log('🔗 API Endpoints:', apiEndpoints);
    }

    // Health check function
    async function checkApiHealth() {
        try {
            const response = await fetch(`${appConfig.SERVER_BASE_URL}/health`);
            const data = await response.json();
            
            if (appConfig.DEBUG) {
                console.log('💓 API Health:', data);
            }
            
            return data.status === 'OK';
        } catch (error) {
            if (appConfig.DEBUG) {
                console.warn('💔 API Health Check Failed:', error);
            }
            return false;
        }
    }

    // Expose health check
    window.checkApiHealth = checkApiHealth;
    
    // Auto health check in development
    if (appConfig.DEBUG && appConfig.ENVIRONMENT === 'development') {
        checkApiHealth();
    }

    // Perform immediate health check for production
    if (appConfig.ENVIRONMENT === 'production') {
        checkApiHealth().then(isHealthy => {
            console.log(isHealthy ? '✅ Backend is healthy' : '⚠️ Backend health check failed');
        });
    }

})();
