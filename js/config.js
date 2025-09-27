// js/config.js - Environment Configuration
const CONFIG = {
    development: {
        API_BASE_URL: 'http://localhost:5000/api',
        SERVER_BASE_URL: 'http://localhost:5000',
        ENVIRONMENT: 'development',
        DEBUG: true
    },
    production: {
        // CORRECT URLs - Backend is on different Render service
        API_BASE_URL: 'https://mamanalgerienne-backend.onrender.com/api',
        SERVER_BASE_URL: 'https://mamanalgerienne-backend.onrender.com',
        ENVIRONMENT: 'production',
        DEBUG: false
    }
};

// Auto-detect environment
function getEnvironment() {
    const hostname = window.location.hostname;
    console.log('Detecting environment. Hostname:', hostname);
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
    }
    return 'production';
}

// Get current config
function getConfig() {
    const env = getEnvironment();
    const config = CONFIG[env];
    
    console.log('Environment detected:', env);
    console.log('Config loaded:', config);
    
    return config;
}

// Export config to window for global access
window.APP_CONFIG = getConfig();

// App initialization - ensure this runs after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('App Configuration Loaded:');
    console.log('- Environment:', window.APP_CONFIG.ENVIRONMENT);
    console.log('- API Base URL:', window.APP_CONFIG.API_BASE_URL);
    console.log('- Server Base URL:', window.APP_CONFIG.SERVER_BASE_URL);
    console.log('- Debug Mode:', window.APP_CONFIG.DEBUG);
});

// Debug helper function
window.debugConfig = function() {
    console.table(window.APP_CONFIG);
    return window.APP_CONFIG;
};

// For debugging
if (window.APP_CONFIG.DEBUG) {
    console.log('🔧 Debug mode enabled');
    console.log('🌍 Environment:', getEnvironment());
    console.log('⚙️ Config:', window.APP_CONFIG);
}
