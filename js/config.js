// config.js - Configuration for Maman Algerienne website
// Enhanced with better URL detection and fallback handling

const CONFIG = {
  // Site information
  SITE_NAME: 'Maman Algerienne',
  SITE_DESCRIPTION: 'موقع الأمهات الجزائريات - مجتمع للمشاركة والنصائح',
  
  // API Configuration with smart detection
  API_BASE_URL: detectApiUrl(),
  
  // Pagination and limits
  ITEMS_PER_PAGE: 6,
  MAX_SEARCH_RESULTS: 20,
  
  // Cache settings
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Timeout settings
  API_TIMEOUT: 10000, // 10 seconds
  
  // Feature flags
  FEATURES: {
    OFFLINE_MODE: true,
    AUTO_RETRY: true,
    CACHE_ENABLED: true,
    DEBUG_MODE: false
  },
  
  // Social media links
  SOCIAL_MEDIA: {
    email: 'mamanalgeriennepartenariat@gmail.com',
    facebook: '#',
    instagram: '#',
    whatsapp: 'https://wa.me/213XXXXXXXXX'
  },
  
  // Contact information
  CONTACT: {
    email: 'mamanalgeriennepartenariat@gmail.com',
    phone: '+213 XXX XXX XXX',
    address: 'الجزائر'
  }
};

// Smart API URL detection function
function detectApiUrl() {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  console.log('🔍 Detecting API URL for hostname:', hostname);
  
  // Production mappings
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
    // Try common development backend ports
    const devPorts = [5000, 3001, 8000, 8080];
    const currentPort = parseInt(port) || 3000;
    
    // If frontend is on port 3000, backend is likely on 5000
    // If frontend is on port 8080, backend is likely on 5000
    let backendPort = 5000;
    
    if (currentPort === 5173) backendPort = 5000; // Vite dev server
    if (currentPort === 3000) backendPort = 5000; // React dev server
    if (currentPort === 8080) backendPort = 5000; // Vue/other dev server
    
    const apiUrl = `${protocol}//${hostname}:${backendPort}`;
    console.log('🔧 Development API URL detected:', apiUrl);
    return apiUrl;
  }
  
  // Fallback to production backend
  const fallbackUrl = 'https://mamanalgerienne-backend.onrender.com';
  console.log('🔄 Using fallback API URL:', fallbackUrl);
  return fallbackUrl;
}

// Test API connectivity
async function testApiConnectivity(url = CONFIG.API_BASE_URL) {
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
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API connectivity test passed:`, data);
        return { success: true, endpoint, data };
      } else {
        console.warn(`⚠️ API returned ${response.status} for ${endpoint}`);
      }
    } catch (error) {
      console.warn(`❌ API test failed for ${endpoint}:`, error.message);
    }
  }
  
  return { success: false, error: 'All connectivity tests failed' };
}

// Alternative API URLs to try if main fails
const ALTERNATIVE_APIS = [
  'https://mamanalgerienne-backend.onrender.com',
  'https://maman-algerienne-api.herokuapp.com', // If you have a Heroku backup
  'https://api.mamanalgerienne.com' // If you have a custom domain
];

// Function to find working API URL
async function findWorkingApiUrl() {
  console.log('🔍 Searching for working API URL...');
  
  // Test main URL first
  const mainTest = await testApiConnectivity(CONFIG.API_BASE_URL);
  if (mainTest.success) {
    return CONFIG.API_BASE_URL;
  }
  
  // Test alternatives
  for (const altUrl of ALTERNATIVE_APIS) {
    if (altUrl === CONFIG.API_BASE_URL) continue; // Skip if same as main
    
    const altTest = await testApiConnectivity(altUrl);
    if (altTest.success) {
      console.log(`✅ Found working alternative API: ${altUrl}`);
      CONFIG.API_BASE_URL = altUrl; // Update config
      return altUrl;
    }
  }
  
  console.error('❌ No working API URL found');
  return null;
}

// API health monitoring
let lastHealthCheck = 0;
let isApiHealthy = false;

async function checkApiHealth(force = false) {
  const now = Date.now();
  
  // Don't check too frequently unless forced
  if (!force && now - lastHealthCheck < 30000) { // 30 seconds
    return isApiHealthy;
  }
  
  lastHealthCheck = now;
  
  try {
    const result = await testApiConnectivity();
    isApiHealthy = result.success;
    
    // Update status indicator if exists
    const statusEl = document.getElementById('api-status');
    if (statusEl) {
      statusEl.className = `api-status ${isApiHealthy ? 'online' : 'offline'}`;
      statusEl.title = isApiHealthy ? 'API متصل' : 'API غير متصل';
    }
    
    return isApiHealthy;
  } catch (error) {
    console.error('Health check failed:', error);
    isApiHealthy = false;
    return false;
  }
}

// Export configuration
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
  window.testApiConnectivity = testApiConnectivity;
  window.findWorkingApiUrl = findWorkingApiUrl;
  window.checkApiHealth = checkApiHealth;
}

// Auto-detect best API URL on load
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Auto-detecting best API URL...');
    await findWorkingApiUrl();
    await checkApiHealth(true);
  });
} else if (typeof window !== 'undefined') {
  // If script loads after DOM is ready
  setTimeout(async () => {
    console.log('🚀 Auto-detecting best API URL...');
    await findWorkingApiUrl();
    await checkApiHealth(true);
  }, 100);
}

console.log('⚙️ Config loaded:', {
  API_URL: CONFIG.API_BASE_URL,
  HOSTNAME: typeof window !== 'undefined' ? window.location.hostname : 'server',
  FEATURES: CONFIG.FEATURES
});
