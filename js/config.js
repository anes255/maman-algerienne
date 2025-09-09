// js/config.js
const config = {
    development: {
        API_BASE_URL: 'http://localhost:5000'
    },
    production: {
        API_BASE_URL: 'https://mamanalgerienne-backend.onrender.com'
    }
};

// Auto-detect environment
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isProduction ? config.production.API_BASE_URL : config.development.API_BASE_URL;


window.API_CONFIG = { API_BASE_URL };
