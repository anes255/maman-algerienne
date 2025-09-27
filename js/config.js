// Enhanced Config.js with better error handling and server detection
(function() {
    'use strict';
    
    // Detect environment and set API URLs
    function getApiConfig() {
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
        
        if (isLocal) {
            return {
                BASE_URL: 'http://localhost:5000/api',
                SERVER_URL: 'http://localhost:5000',
                ENVIRONMENT: 'development'
            };
        } else {
            return {
                BASE_URL: 'https://parapharmacie-gaher.onrender.com/api',
                SERVER_URL: 'https://parapharmacie-gaher.onrender.com',
                ENVIRONMENT: 'production'
            };
        }
    }
    
    // Create global APP_CONFIG
    window.APP_CONFIG = getApiConfig();
    
    // Enhanced API call function with better error handling
    async function apiCall(endpoint, options = {}) {
        const url = `${APP_CONFIG.BASE_URL}${endpoint}`;
        const maxRetries = 3;
        let lastError;
        
        // Default options
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };
        
        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            defaultOptions.headers['x-auth-token'] = token;
        }
        
        console.log(`🔄 API Call: ${options.method || 'GET'} ${url}`);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 API Call Attempt ${attempt}: ${options.method || 'GET'} ${url}`);
                
                const response = await fetch(url, defaultOptions);
                
                console.log(`📡 Response: ${response.status}`);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({
                        message: `HTTP ${response.status}: ${response.statusText}`
                    }));
                    
                    console.log(`❌ HTTP Error ${response.status}:`, errorData);
                    
                    if (attempt < maxRetries && response.status >= 500) {
                        console.log(`🔄 Retrying in ${2000 * attempt}ms...`);
                        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                        continue;
                    }
                    
                    throw new Error(errorData.message || `HTTP ${response.status}`);
                }
                
                const data = await response.json();
                console.log('✅ API Success');
                return data;
                
            } catch (error) {
                lastError = error;
                console.error(`💥 API Call Error (Attempt ${attempt}):`, error.message);
                
                if (attempt < maxRetries && (error.name === 'TypeError' || error.message.includes('fetch'))) {
                    console.log(`🔄 Retrying in ${2000 * attempt}ms...`);
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                    continue;
                }
                
                break;
            }
        }
        
        throw lastError || new Error('API call failed after all retries');
    }
    
    // Test server connectivity
    async function testServerConnection() {
        try {
            const response = await fetch(`${APP_CONFIG.SERVER_URL}/api/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                console.log('✅ Server connection successful');
                return true;
            } else {
                console.warn('⚠️ Server responded with error:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Server connection failed:', error.message);
            return false;
        }
    }
    
    // Utility functions
    function buildApiUrl(endpoint) {
        return `${APP_CONFIG.BASE_URL}${endpoint}`;
    }
    
    function buildServerUrl(endpoint) {
        return `${APP_CONFIG.SERVER_URL}${endpoint}`;
    }
    
    // Demo mode for when server is down
    let isDemoMode = false;
    
    function enableDemoMode() {
        isDemoMode = true;
        console.log('🔧 Demo mode enabled - using local storage');
    }
    
    function getDemoProducts() {
        return JSON.parse(localStorage.getItem('demoProducts') || '[]');
    }
    
    function saveDemoProduct(product) {
        const products = getDemoProducts();
        const existingIndex = products.findIndex(p => p.id === product.id);
        
        if (existingIndex >= 0) {
            products[existingIndex] = product;
        } else {
            products.push(product);
        }
        
        localStorage.setItem('demoProducts', JSON.stringify(products));
        return product;
    }
    
    function deleteDemoProduct(id) {
        const products = getDemoProducts();
        const filtered = products.filter(p => p.id !== id);
        localStorage.setItem('demoProducts', JSON.stringify(filtered));
        return true;
    }
    
    function clearDemoData() {
        localStorage.removeItem('demoProducts');
        localStorage.removeItem('demoOrders');
        console.log('🧹 Demo data cleared');
    }
    
    // Enhanced API wrapper that falls back to demo mode
    async function safeApiCall(endpoint, options = {}) {
        try {
            if (isDemoMode) {
                return handleDemoApiCall(endpoint, options);
            }
            
            return await apiCall(endpoint, options);
        } catch (error) {
            console.warn(`API call failed, checking if demo mode should be enabled:`, error.message);
            
            // If server connection fails, enable demo mode
            if (error.message.includes('fetch') || error.message.includes('connection')) {
                enableDemoMode();
                return handleDemoApiCall(endpoint, options);
            }
            
            throw error;
        }
    }
    
    function handleDemoApiCall(endpoint, options = {}) {
        console.log(`🔧 Demo API Call: ${options.method || 'GET'} ${endpoint}`);
        
        // Simulate different endpoints
        if (endpoint === '/products' && (!options.method || options.method === 'GET')) {
            return Promise.resolve(getDemoProducts());
        }
        
        if (endpoint === '/admin/products' && (!options.method || options.method === 'GET')) {
            return Promise.resolve(getDemoProducts());
        }
        
        if (endpoint === '/admin/products' && options.method === 'POST') {
            const product = JSON.parse(options.body);
            product.id = 'demo_' + Date.now();
            return Promise.resolve(saveDemoProduct(product));
        }
        
        if (endpoint.startsWith('/admin/products/') && options.method === 'PUT') {
            const id = endpoint.split('/').pop();
            const product = JSON.parse(options.body);
            product.id = id;
            return Promise.resolve(saveDemoProduct(product));
        }
        
        if (endpoint.startsWith('/admin/products/') && options.method === 'DELETE') {
            const id = endpoint.split('/').pop();
            deleteDemoProduct(id);
            return Promise.resolve({ message: 'Product deleted successfully' });
        }
        
        if (endpoint === '/orders' && options.method === 'POST') {
            const order = JSON.parse(options.body);
            order.id = 'demo_order_' + Date.now();
            const orders = JSON.parse(localStorage.getItem('demoOrders') || '[]');
            orders.push(order);
            localStorage.setItem('demoOrders', JSON.stringify(orders));
            return Promise.resolve(order);
        }
        
        if (endpoint === '/admin/orders' && (!options.method || options.method === 'GET')) {
            const orders = JSON.parse(localStorage.getItem('demoOrders') || '[]');
            return Promise.resolve(orders);
        }
        
        // Default demo response
        return Promise.resolve({ success: true, message: 'Demo mode response' });
    }
    
    // Initialize and test connection
    async function initializeAPI() {
        console.log('🚀 Initializing API...');
        console.log('📍 Environment:', APP_CONFIG.ENVIRONMENT);
        console.log('🔗 API Base URL:', APP_CONFIG.BASE_URL);
        
        const isConnected = await testServerConnection();
        
        if (!isConnected && APP_CONFIG.ENVIRONMENT === 'development') {
            console.warn('⚠️ Server not available, enabling demo mode');
            enableDemoMode();
        }
    }
    
    // Global exports
    window.apiCall = safeApiCall;
    window.buildApiUrl = buildApiUrl;
    window.buildServerUrl = buildServerUrl;
    window.testServerConnection = testServerConnection;
    window.initializeAPI = initializeAPI;
    window.isDemoMode = () => isDemoMode;
    window.clearDemoData = clearDemoData;
    
    // Initialize API on load
    document.addEventListener('DOMContentLoaded', () => {
        initializeAPI();
    });
    
    console.log('✅ Config loaded - API URL:', APP_CONFIG.BASE_URL);
    
})();
