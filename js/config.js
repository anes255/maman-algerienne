// js/config.js - Robust Environment Configuration
(function() {
    'use strict';
    
    console.log('🔧 Loading config.js...');
    
    // Prevent multiple loading
    if (window.APP_CONFIG) {
        console.log('✅ Config already loaded:', window.APP_CONFIG);
        return;
    }
    
    try {
        // Environment detection
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port;
        
        console.log('🌍 Environment detection:', { hostname, protocol, port });
        
        // Determine if development
        const isDevelopment = hostname === 'localhost' || 
                             hostname === '127.0.0.1' || 
                             hostname === '0.0.0.0' ||
                             port === '3000' ||
                             port === '8080' ||
                             port === '5000';
        
        console.log('🏗️ Is development?', isDevelopment);
        
        // Configuration objects
        const configs = {
            development: {
                API_BASE_URL: 'http://localhost:5000/api',
                SERVER_BASE_URL: 'http://localhost:5000',
                ENVIRONMENT: 'development',
                DEBUG: true
            },
            production: {
                // IMPORTANT: Use your actual backend URL
                API_BASE_URL: 'https://mamanalgerienne-backend.onrender.com/api',
                SERVER_BASE_URL: 'https://mamanalgerienne-backend.onrender.com',
                ENVIRONMENT: 'production', 
                DEBUG: false
            }
        };
        
        // Select appropriate config
        const env = isDevelopment ? 'development' : 'production';
        const config = configs[env];
        
        // Validate config
        if (!config || !config.API_BASE_URL || !config.SERVER_BASE_URL) {
            throw new Error('Invalid configuration generated');
        }
        
        // Export to window
        window.APP_CONFIG = {
            ...config,
            LOADED_AT: new Date().toISOString(),
            HOSTNAME: hostname,
            ENV_DETECTED: env
        };
        
        console.log('✅ Config loaded successfully:', window.APP_CONFIG);
        
        // Dispatch event for other scripts
        if (typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('configLoaded', { 
                detail: window.APP_CONFIG 
            }));
        }
        
    } catch (error) {
        console.error('❌ Failed to load config:', error);
        
        // Fallback config
        window.APP_CONFIG = {
            API_BASE_URL: 'https://mamanalgerienne-backend.onrender.com/api',
            SERVER_BASE_URL: 'https://mamanalgerienne-backend.onrender.com',
            ENVIRONMENT: 'production',
            DEBUG: false,
            ERROR: 'Fallback config used',
            LOADED_AT: new Date().toISOString()
        };
        
        console.log('⚠️ Using fallback config:', window.APP_CONFIG);
    }
    
    // Debug helper
    window.debugConfig = function() {
        console.table(window.APP_CONFIG);
        return window.APP_CONFIG;
    };
    
})();

// Immediate verification
console.log('🔍 Config verification after load:');
console.log('- APP_CONFIG exists:', !!window.APP_CONFIG);
console.log('- API_BASE_URL:', window.APP_CONFIG?.API_BASE_URL);
console.log('- Environment:', window.APP_CONFIG?.ENVIRONMENT);
