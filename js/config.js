// js/config.js
const CONFIG = {
    development: {
        API_BASE_URL: 'http://localhost:5000/api',
        SERVER_BASE_URL: 'http://localhost:5000',
        ENVIRONMENT: 'development'
    },
    production: {
        API_BASE_URL: 'https://maman-algerienne.onrender.com/api',
        SERVER_BASE_URL: 'https://maman-algerienne.onrender.com',
        ENVIRONMENT: 'production'
    }
};

// Auto-detect environment
function getEnvironment() {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
    }
    return 'production';
}

// Get current config
function getConfig() {
    const env = getEnvironment();
    return CONFIG[env];
}

// Export config
window.APP_CONFIG = getConfig();

// For debugging
console.log('Environment:', getEnvironment());
console.log('Config:', window.APP_CONFIG);
