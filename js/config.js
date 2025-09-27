// js/config.js - FIXED VERSION with CORRECT backend URL
const CONFIG = {
    development: {
        API_BASE_URL: 'http://localhost:5000/api',
        SERVER_BASE_URL: 'http://localhost:5000',
        ENVIRONMENT: 'development'
    },
    production: {
        // FIXED: Correct backend URL
        API_BASE_URL: 'https://mamanalgerienne-backend.onrender.com/api',
        SERVER_BASE_URL: 'https://mamanalgerienne-backend.onrender.com',
        ENVIRONMENT: 'production'
    }
};

// Enhanced API connectivity testing
let testedApiUrls = new Set();
let currentApiUrl = null;

// Auto-detect environment
function getEnvironment() {
    const hostname = window.location.hostname;
    console.log('🔍 Detecting environment for hostname:', hostname);
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        console.log('🏠 Development environment detected');
        return 'development';
    }
    
    // Production environment
    console.log('🌍 Production environment detected');
    return 'production';
}

// Test API connectivity
async function testApiConnectivity(url) {
    if (testedApiUrls.has(url)) {
        console.log('🔄 Already tested:', url);
        return false;
    }
    
    testedApiUrls.add(url);
    console.log('🧪 Testing:', url);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${url}/health`, {
            method: 'GET',
            signal: controller.signal,
            cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API connectivity test passed:', data);
            currentApiUrl = url;
            return data;
        } else {
            console.log('❌ API test failed with status:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ API test failed for /health:', error.message);
        return false;
    }
}

// Search for working API URL
async function findWorkingApiUrl() {
    console.log('🔍 Searching for working API URL...');
    
    const env = getEnvironment();
    const primaryConfig = CONFIG[env];
    
    // Test primary URL first
    const primaryResult = await testApiConnectivity(primaryConfig.SERVER_BASE_URL);
    if (primaryResult) {
        console.log('✅ Primary API URL working:', primaryConfig.SERVER_BASE_URL);
        return primaryConfig;
    }
    
    // If in production and primary fails, try alternative URLs
    if (env === 'production') {
        const alternativeUrls = [
            'https://mamanalgerienne-backend.onrender.com',
            'https://maman-algerienne.onrender.com'
        ];
        
        for (const url of alternativeUrls) {
            if (url !== primaryConfig.SERVER_BASE_URL) {
                const result = await testApiConnectivity(url);
                if (result) {
                    console.log('✅ Alternative API URL working:', url);
                    return {
                        API_BASE_URL: url + '/api',
                        SERVER_BASE_URL: url,
                        ENVIRONMENT: env
                    };
                }
            }
        }
    }
    
    console.log('⚠️ No working API URL found, using primary config');
    return primaryConfig;
}

// Auto-detect best API URL
async function detectApiUrl() {
    console.log('🚀 Auto-detecting best API URL...');
    
    try {
        const config = await findWorkingApiUrl();
        window.APP_CONFIG = config;
        
        console.log('⚙️ Config loaded:', config);
        
        // Trigger custom event for other scripts
        window.dispatchEvent(new CustomEvent('configLoaded', { 
            detail: config 
        }));
        
        return config;
    } catch (error) {
        console.error('❌ Error detecting API URL:', error);
        
        // Fallback to environment-based config
        const env = getEnvironment();
        const fallbackConfig = CONFIG[env];
        window.APP_CONFIG = fallbackConfig;
        
        console.log('🔄 Using fallback config:', fallbackConfig);
        return fallbackConfig;
    }
}

// Get current config (immediate)
function getConfig() {
    if (window.APP_CONFIG) {
        return window.APP_CONFIG;
    }
    
    // Immediate fallback
    const env = getEnvironment();
    return CONFIG[env];
}

// Initialize immediately
const immediateConfig = getConfig();
window.APP_CONFIG = immediateConfig;

// Also do async detection
detectApiUrl();

// For debugging
console.log('Environment:', getEnvironment());
console.log('Immediate Config:', immediateConfig);

// Export for global use
window.getConfig = getConfig;
window.detectApiUrl = detectApiUrl;
window.testApiConnectivity = testApiConnectivity;
