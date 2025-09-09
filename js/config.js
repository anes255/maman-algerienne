// js/config.js - Complete Mobile & Production Ready Configuration
(function() {
    'use strict';

    // Mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
                           hostname.includes('172.') ||
                           hostname.endsWith('.local');
        
        const isDevelopment = isLocalhost || port === '3000' || port === '8080' || port === '5000';
        
        console.log('Environment Detection:', {
            hostname,
            port,
            protocol,
            isLocalhost,
            isDevelopment,
            isMobile,
            isTablet,
            isTouchDevice
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
            API_BASE_URL: 'http://localhost:5000',
            API_BASE_URL_NETWORK: `http://${window.location.hostname}:5000`
        },
        production: {
            // REPLACE THIS WITH YOUR ACTUAL RENDER BACKEND URL
            API_BASE_URL: 'https://mama-algerienne-backend.onrender.com',
            API_BASE_URL_FALLBACK: 'https://mama-algerienne-api.onrender.com'
        }
    };

    // Get the appropriate API URL
    function getApiUrl() {
        if (env.isDevelopment) {
            return config.development.API_BASE_URL;
        } else {
            return config.production.API_BASE_URL;
        }
    }

    // API Configuration
    const API_CONFIG = {
        API_BASE_URL: getApiUrl(),
        FALLBACK_URL: env.isProduction ? config.production.API_BASE_URL_FALLBACK : config.development.API_BASE_URL_NETWORK,
        ENVIRONMENT: env.isDevelopment ? 'development' : 'production',
        IS_MOBILE: isMobile,
        IS_TABLET: isTablet,
        IS_TOUCH_DEVICE: isTouchDevice,
        
        // Mobile-optimized timeouts
        TIMEOUT: isMobile ? 30000 : 15000, // 30s for mobile, 15s for desktop
        RETRY_ATTEMPTS: isMobile ? 3 : 2,
        RETRY_DELAY: isMobile ? 2000 : 1000,
        
        // Default headers optimized for mobile
        DEFAULT_HEADERS: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    };

    // Enhanced API request function with mobile optimizations
    window.apiRequest = async function(endpoint, options = {}) {
        const url = `${API_CONFIG.API_BASE_URL}${endpoint}`;
        
        // Mobile-optimized fetch configuration
        const config = {
            method: options.method || 'GET',
            headers: {
                ...API_CONFIG.DEFAULT_HEADERS,
                ...options.headers
            },
            // Mobile-specific settings
            mode: 'cors',
            credentials: isMobile ? 'omit' : 'include', // Mobile CORS fix
            cache: 'no-cache',
            ...options
        };

        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Log request details for mobile debugging
        if (isMobile) {
            console.log(`[MOBILE] Making API request to: ${url}`);
            console.log(`[MOBILE] Method: ${config.method}`);
            console.log(`[MOBILE] Headers:`, config.headers);
        } else {
            console.log(`Making API request to: ${url}`);
        }

        let lastError;

        // Retry logic with exponential backoff
        for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
            try {
                // Create abort controller for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    controller.abort();
                    console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Request timed out (attempt ${attempt})`);
                }, API_CONFIG.TIMEOUT);
                
                config.signal = controller.signal;
                
                const response = await fetch(url, config);
                clearTimeout(timeoutId);
                
                console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Response status: ${response.status} (attempt ${attempt})`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (isMobile) {
                    console.log(`[MOBILE] Request successful on attempt ${attempt}`);
                }
                
                return data;
                
            } catch (error) {
                lastError = error;
                console.error(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] API Request failed (attempt ${attempt}):`, error.message);
                
                // Don't retry on certain errors
                if (error.name === 'AbortError' || error.message.includes('404') || error.message.includes('401')) {
                    break;
                }
                
                // Wait before retry (exponential backoff)
                if (attempt < API_CONFIG.RETRY_ATTEMPTS) {
                    const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
                    console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        // Try fallback URL in production
        if (API_CONFIG.ENVIRONMENT === 'production' && API_CONFIG.FALLBACK_URL !== API_CONFIG.API_BASE_URL) {
            console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Trying fallback URL...`);
            try {
                const fallbackUrl = `${API_CONFIG.FALLBACK_URL}${endpoint}`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
                
                const fallbackConfig = { ...config, signal: controller.signal };
                const response = await fetch(fallbackUrl, fallbackConfig);
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Fallback URL successful`);
                    return data;
                }
            } catch (fallbackError) {
                console.error(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Fallback request also failed:`, fallbackError.message);
            }
        }
        
        // All attempts failed
        throw lastError;
    };

    // Health check function with detailed mobile logging
    window.checkApiHealth = async function() {
        try {
            console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Checking API health...`);
            
            if (isMobile) {
                console.log('[MOBILE] Device Info:', {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language,
                    cookieEnabled: navigator.cookieEnabled,
                    onLine: navigator.onLine,
                    connection: navigator.connection ? {
                        effectiveType: navigator.connection.effectiveType,
                        downlink: navigator.connection.downlink,
                        rtt: navigator.connection.rtt
                    } : 'not available'
                });
            }
            
            const health = await window.apiRequest('/health');
            console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] API Health Check SUCCESS:`, health);
            
            // Show success toast
            if (typeof showToast === 'function') {
                showToast('تم الاتصال بالخادم بنجاح', 'success');
            }
            
            return health;
            
        } catch (error) {
            console.error(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] API Health Check FAILED:`, error);
            
            // Show error toast with specific mobile message
            if (typeof showToast === 'function') {
                const message = isMobile ? 
                    'فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت أو المحاولة لاحقاً' :
                    'لا يمكن الاتصال بالخادم. يرجى المحاولة لاحقاً';
                showToast(message, 'error');
            }
            
            return null;
        }
    };

    // Test multiple endpoints
    window.testApiEndpoints = async function() {
        const endpoints = ['/health', '/api/test', '/api/articles', '/api/products', '/api/posts'];
        const results = {};
        
        console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Testing API endpoints...`);
        
        for (const endpoint of endpoints) {
            try {
                console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Testing ${endpoint}...`);
                const response = await window.apiRequest(endpoint);
                results[endpoint] = { status: 'SUCCESS', data: response };
                console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] ✅ ${endpoint} OK`);
            } catch (error) {
                results[endpoint] = { status: 'FAILED', error: error.message };
                console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] ❌ ${endpoint} FAILED:`, error.message);
            }
        }
        
        console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Endpoint test results:`, results);
        return results;
    };

    // Mobile-specific debugging function
    window.debugApiConnection = async function() {
        console.log('=== API DEBUG INFO ===');
        console.log('Environment:', API_CONFIG);
        console.log('Current URL:', window.location.href);
        console.log('Device Type:', {
            isMobile,
            isTablet,
            isTouchDevice,
            userAgent: navigator.userAgent
        });
        
        if (isMobile && navigator.connection) {
            console.log('Network Info:', {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            });
        }
        
        // Test basic connectivity
        try {
            const health = await window.checkApiHealth();
            if (health) {
                console.log('✅ API Connection: SUCCESS');
                console.log('Server Info:', health);
                
                // Test other endpoints
                await window.testApiEndpoints();
            } else {
                console.log('❌ API Connection: FAILED');
            }
        } catch (error) {
            console.log('❌ API Connection: ERROR', error.message);
        }
        
        console.log('=== END DEBUG INFO ===');
    };

    // Direct backend test (for troubleshooting)
    window.testDirectBackend = async function() {
        const testUrl = `${API_CONFIG.API_BASE_URL}/health`;
        console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Testing direct backend access: ${testUrl}`);
        
        try {
            // Try with different modes
            const modes = ['cors', 'no-cors'];
            
            for (const mode of modes) {
                try {
                    console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Trying mode: ${mode}`);
                    const response = await fetch(testUrl, {
                        method: 'GET',
                        mode: mode,
                        cache: 'no-cache'
                    });
                    
                    console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Direct test (${mode}) - Status: ${response.status}`);
                    
                    if (mode === 'cors' && response.ok) {
                        const data = await response.json();
                        console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Direct test SUCCESS:`, data);
                        return data;
                    } else if (mode === 'no-cors') {
                        console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] No-cors mode - Backend is reachable`);
                    }
                } catch (modeError) {
                    console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Mode ${mode} failed:`, modeError.message);
                }
            }
        } catch (error) {
            console.error(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Direct backend test failed:`, error);
        }
    };

    // Export configuration
    window.API_CONFIG = API_CONFIG;
    
    // Auto-run health check on page load
    function initializeApi() {
        console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] API Configuration loaded:`, API_CONFIG);
        
        // Wait a bit for page to load completely
        setTimeout(() => {
            window.checkApiHealth();
        }, isMobile ? 2000 : 1000);
        
        // For mobile, also run debug info
        if (isMobile) {
            setTimeout(() => {
                window.debugApiConnection();
            }, 3000);
        }
    }

    // Initialize based on document state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApi);
    } else {
        initializeApi();
    }

    // Mobile-specific network change detection
    if (isMobile && 'connection' in navigator) {
        navigator.connection.addEventListener('change', () => {
            console.log('[MOBILE] Network connection changed:', {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            });
            
            // Re-test connection on network change
            setTimeout(() => {
                window.checkApiHealth();
            }, 1000);
        });
    }

    // Global error handler for fetch failures
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.message && event.reason.message.includes('fetch')) {
            console.error(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] Unhandled fetch error:`, event.reason);
        }
    });

})();
