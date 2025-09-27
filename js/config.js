// js/config.js - Simplified and consistent configuration
(function() {
    'use strict';

    // Get base server URL (without /api)
    function getServerBaseUrl() {
        // Check if we're in production (deployed)
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return 'https://maman-algerienne.onrender.com'; // Your actual Render URL
        }
        
        // Development
        return 'http://localhost:5000';
    }

    // Get API base URL
    function getApiBaseUrl() {
        return getServerBaseUrl() + '/api';
    }

    // Configuration object
    const CONFIG = {
        SERVER_BASE_URL: getServerBaseUrl(),
        API_BASE_URL: getApiBaseUrl(),
        ENVIRONMENT: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'development' : 'production',
        
        // API endpoints
        ENDPOINTS: {
            AUTH: '/auth',
            ARTICLES: '/articles', 
            PRODUCTS: '/products',
            POSTS: '/posts',
            COMMENTS: '/comments',
            ADMIN: '/admin',
            ORDERS: '/orders'
        },
        
        // Upload paths
        UPLOADS: {
            ARTICLES: '/uploads/articles',
            PRODUCTS: '/uploads/products', 
            POSTS: '/uploads/posts',
            AVATARS: '/uploads/avatars'
        },
        
        // Pagination
        DEFAULT_PAGE_SIZE: 10,
        MAX_FILE_SIZE: '10mb',
        
        // Toast settings
        TOAST_DURATION: 5000
    };

    // Helper functions
    CONFIG.getFullImageUrl = function(path, type = 'articles') {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${CONFIG.SERVER_BASE_URL}${CONFIG.UPLOADS[type.toUpperCase()]}/${path}`;
    };

    CONFIG.getApiUrl = function(endpoint) {
        return `${CONFIG.API_BASE_URL}${endpoint}`;
    };

    // Export config globally
    window.APP_CONFIG = CONFIG;

    // For debugging
    console.log('Environment:', CONFIG.ENVIRONMENT);
    console.log('Server URL:', CONFIG.SERVER_BASE_URL);
    console.log('API URL:', CONFIG.API_BASE_URL);

})();
