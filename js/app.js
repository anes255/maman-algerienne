// Robust Maman Algerienne App - Complete Fix with Enhanced Error Handling
class MamanAlgerienneApp {
    constructor() {
        this.apiStatus = 'unknown';
        this.retryCount = 0;
        this.maxRetries = 3;
        this.API_BASE_URL = '';
        this.SERVER_BASE_URL = '';
        this.isInitialized = false;
        this.configReady = false;
    }

    // Initialize the application with robust error handling
    async init() {
        try {
            console.log('🚀 Initializing Maman Algerienne App...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Wait for config to be ready with timeout
            await this.waitForConfig();
            
            // Set API URLs from config with fallback
            this.setApiUrls();
            
            console.log('🔍 Using API URL:', this.API_BASE_URL);
            
            // Check API availability
            const apiAvailable = await this.checkApiAvailability();
            
            // Load initial content (even if API is offline, show fallback)
            await this.loadInitialContent(apiAvailable);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('✅ App initialized successfully');
            
        } catch (error) {
            console.error('💥 App initialization failed:', error);
            this.showInitializationError();
        }
    }

    // Set API URLs with multiple fallback options
    setApiUrls() {
        try {
            // Primary: Use config if available
            if (window.CONFIG && window.CONFIG.API_BASE_URL) {
                this.SERVER_BASE_URL = window.CONFIG.SERVER_BASE_URL;
                this.API_BASE_URL = window.CONFIG.API_BASE_URL + (window.CONFIG.API_BASE_URL.includes('/api') ? '' : '/api');
                this.configReady = true;
                return;
            }
            
            // Fallback: Manual detection
            const hostname = window.location.hostname;
            
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                this.SERVER_BASE_URL = 'http://localhost:5000';
                this.API_BASE_URL = 'http://localhost:5000/api';
            } else {
                // Production fallback
                this.SERVER_BASE_URL = 'https://mamanalgerienne-backend.onrender.com';
                this.API_BASE_URL = 'https://mamanalgerienne-backend.onrender.com/api';
            }
            
            console.log('⚠️ Using fallback API URL:', this.API_BASE_URL);
            
        } catch (error) {
            console.error('❌ Error setting API URLs:', error);
            // Ultimate fallback
            this.SERVER_BASE_URL = 'https://mamanalgerienne-backend.onrender.com';
            this.API_BASE_URL = 'https://mamanalgerienne-backend.onrender.com/api';
        }
    }

    // Wait for config to be ready with timeout
    async waitForConfig() {
        const maxWait = 5000; // 5 seconds max wait
        const checkInterval = 100; // Check every 100ms
        let waited = 0;
        
        while (waited < maxWait) {
            if (window.CONFIG && window.CONFIG.API_BASE_URL) {
                console.log('✅ Config ready');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }
        
        console.log('⚠️ Config timeout, using fallback');
    }

    // Enhanced API request with comprehensive error handling
    async apiRequest(endpoint, options = {}) {
        const maxRetries = 3;
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const url = endpoint.startsWith('http') 
                    ? endpoint 
                    : `${this.API_BASE_URL}${endpoint}`;
                    
                const token = localStorage.getItem('authToken');
                
                const defaultOptions = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    },
                    timeout: 10000, // 10 second timeout
                    ...options
                };

                console.log(`🌐 API Request (attempt ${attempt}): ${defaultOptions.method} ${url}`);
                
                // Create abort controller for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);
                
                const response = await fetch(url, {
                    ...defaultOptions,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const contentType = response.headers.get('content-type');
                let data;
                
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    data = await response.text();
                }
                
                console.log(`✅ API Response: ${defaultOptions.method} ${url}`, data);
                return data;
                
            } catch (error) {
                lastError = error;
                console.error(`❌ API Error (attempt ${attempt}): ${error.message}`);
                
                // Don't retry on certain errors
                if (error.name === 'AbortError' || error.message.includes('404')) {
                    break;
                }
                
                // Wait before retry (exponential backoff)
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                    console.log(`⏳ Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError || new Error('API request failed after all retries');
    }

    // Robust API availability check
    async checkApiAvailability() {
        try {
            console.log('🧪 Testing API connectivity...');
            
            // Test multiple endpoints
            const testEndpoints = [
                '/health',
                '/api/test',
                '/test'  // Fallback
            ];
            
            for (const endpoint of testEndpoints) {
                try {
                    const testUrl = `${this.SERVER_BASE_URL}${endpoint}`;
                    console.log(`🔍 Testing: ${testUrl}`);
                    
                    const response = await fetch(testUrl, {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' },
                        timeout: 5000
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('✅ API is available:', data);
                        this.apiStatus = 'online';
                        this.updateApiStatusIndicator(true);
                        return true;
                    }
                } catch (error) {
                    console.log(`⚠️ Endpoint ${endpoint} failed:`, error.message);
                    continue;
                }
            }
            
            throw new Error('All API endpoints failed');
            
        } catch (error) {
            console.warn('⚠️ API not available:', error.message);
            this.apiStatus = 'offline';
            this.updateApiStatusIndicator(false);
            return false;
        }
    }

    // Update API status indicator with Arabic support
    updateApiStatusIndicator(isOnline) {
        const indicator = document.getElementById('api-status');
        if (indicator) {
            indicator.className = `api-status ${isOnline ? 'online' : 'offline'}`;
            // Check if page is in Arabic
            const isArabic = document.documentElement.lang === 'ar';
            indicator.textContent = isOnline 
                ? (isArabic ? 'متصل' : 'En ligne') 
                : (isArabic ? 'غير متصل' : 'Hors ligne');
        }
    }

    // Load initial content with fallback handling
    async loadInitialContent(apiAvailable = null) {
        console.log('📦 Loading initial content...');
        
        // Check API availability if not already done
        if (apiAvailable === null) {
            apiAvailable = await this.checkApiAvailability();
        }
        
        if (!apiAvailable) {
            console.log('⚠️ API offline, showing fallback content');
            this.showOfflineContent();
            return;
        }

        // Load content in parallel with individual error handling
        const contentPromises = [
            this.loadArticles().catch(error => {
                console.error('❌ Articles loading failed:', error);
                return null;
            }),
            this.loadPosts().catch(error => {
                console.error('❌ Posts loading failed:', error);
                return null;
            }),
            this.loadSponsorAds().catch(error => {
                console.error('❌ Sponsor ads loading failed:', error);
                return null;
            })
        ];

        // Wait for all content to attempt loading
        const results = await Promise.allSettled(contentPromises);
        
        // Check if any content loaded successfully
        const hasContent = results.some(result => 
            result.status === 'fulfilled' && result.value !== null
        );
        
        if (!hasContent) {
            console.log('⚠️ No content loaded, showing fallback');
            this.showNoContentMessage();
        }
    }

    // Load articles with enhanced error handling
    async loadArticles() {
        try {
            console.log('📰 Loading articles...');
            
            // Try multiple endpoint variations
            const endpoints = [
                '/articles',
                '/api/articles',
                '/articles?limit=10'
            ];
            
            let articles = null;
            
            for (const endpoint of endpoints) {
                try {
                    articles = await this.apiRequest(endpoint);
                    if (articles) break;
                } catch (error) {
                    console.log(`⚠️ Articles endpoint ${endpoint} failed:`, error.message);
                    continue;
                }
            }
            
            if (!articles) {
                throw new Error('All articles endpoints failed');
            }
            
            // Handle different response formats
            const articlesList = Array.isArray(articles) ? articles : 
                                (articles.articles ? articles.articles : []);
            
            if (articlesList.length > 0) {
                this.displayArticles(articlesList);
                console.log(`✅ Loaded ${articlesList.length} articles`);
                return articlesList;
            } else {
                this.showNoArticlesMessage();
                return [];
            }
            
        } catch (error) {
            console.error('❌ Failed to load articles:', error);
            this.showLoadErrorMessage('articles');
            throw error;
        }
    }

    // Load posts with fallback endpoints
    async loadPosts() {
        try {
            console.log('📝 Loading posts...');
            
            const endpoints = [
                '/posts?limit=6',
                '/api/posts?limit=6',
                '/posts'
            ];
            
            let posts = null;
            
            for (const endpoint of endpoints) {
                try {
                    posts = await this.apiRequest(endpoint);
                    if (posts) break;
                } catch (error) {
                    console.log(`⚠️ Posts endpoint ${endpoint} failed:`, error.message);
                    continue;
                }
            }
            
            if (!posts) {
                console.log('ℹ️ No posts available from any endpoint');
                return [];
            }
            
            const postsList = Array.isArray(posts) ? posts : 
                             (posts.posts ? posts.posts : []);
            
            if (postsList.length > 0) {
                this.displayPosts(postsList);
                console.log(`✅ Loaded ${postsList.length} posts`);
            }
            
            return postsList;
            
        } catch (error) {
            console.error('❌ Failed to load posts:', error);
            return [];
        }
    }

    // Load sponsor ads with multiple fallback strategies
    async loadSponsorAds() {
        try {
            console.log('📢 Loading sponsor ads...');
            
            const endpoints = [
                '/sponsor-ads',
                '/api/sponsor-ads',
                '/posts?type=ad&limit=6',
                '/api/posts?type=ad&limit=6',
                '/posts?featured=true&limit=6',
                '/api/posts?featured=true&limit=6',
                '/articles?featured=true&limit=6'
            ];
            
            for (const endpoint of endpoints) {
                try {
                    const ads = await this.apiRequest(endpoint);
                    
                    if (ads) {
                        const adsList = Array.isArray(ads) ? ads : 
                                       (ads.posts || ads.articles || []);
                        
                        if (adsList.length > 0) {
                            this.displaySponsorAds(adsList);
                            console.log(`✅ Loaded ${adsList.length} sponsor ads from ${endpoint}`);
                            return adsList;
                        }
                    }
                } catch (error) {
                    console.log(`⚠️ Sponsor ads endpoint ${endpoint} failed:`, error.message);
                    continue;
                }
            }
            
            console.log('ℹ️ No sponsor ads available from any endpoint');
            return [];
            
        } catch (error) {
            console.error('❌ Failed to load sponsor ads:', error);
            return [];
        }
    }

    // Display articles with safe HTML handling
    displayArticles(articles) {
        const container = document.getElementById('articles-container');
        const loadingSpinner = document.getElementById('loading-spinner');
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        
        if (!container) {
            console.warn('⚠️ Articles container not found');
            return;
        }

        try {
            const articlesHTML = articles.map(article => {
                // Safe data extraction with fallbacks
                const title = this.sanitizeHtml(article.title || 'عنوان غير متوفر');
                const excerpt = this.sanitizeHtml(article.excerpt || article.description || '');
                const category = this.sanitizeHtml(article.category || 'عام');
                const image = article.image || '/assets/default-article.jpg';
                const id = article._id || article.id || '';
                const featuredBadge = article.featured ? '<span class="featured-badge">مميز</span>' : '';
                const date = this.formatDate(article.createdAt || article.date);
                const readTime = article.readTime || '5';
                
                return `
                    <article class="article-card" data-category="${this.sanitizeAttr(article.category || 'general')}">
                        <div class="article-image">
                            <img src="${this.sanitizeAttr(image)}" 
                                 alt="${this.sanitizeAttr(title)}"
                                 onerror="this.src='/assets/default-article.jpg'"
                                 loading="lazy">
                            ${featuredBadge}
                        </div>
                        <div class="article-content">
                            <span class="article-category">${category}</span>
                            <h3 class="article-title">${title}</h3>
                            <p class="article-excerpt">${excerpt}</p>
                            <div class="article-meta">
                                <span class="article-date">${date}</span>
                                <span class="article-read-time">${readTime} دقيقة قراءة</span>
                            </div>
                            ${id ? `<a href="article.html?id=${this.sanitizeAttr(id)}" class="read-more-btn">اقرأ المزيد</a>` : ''}
                        </div>
                    </article>
                `;
            }).join('');

            container.innerHTML = articlesHTML;
            
        } catch (error) {
            console.error('❌ Error displaying articles:', error);
            this.showLoadErrorMessage('articles');
        }
    }

    // Display posts with error handling
    displayPosts(posts) {
        const container = document.getElementById('posts-container');
        if (!container) {
            console.warn('⚠️ Posts container not found');
            return;
        }

        try {
            const postsHTML = posts.slice(0, 6).map(post => {
                const title = this.sanitizeHtml(post.title || 'عنوان غير متوفر');
                const excerpt = this.sanitizeHtml(post.excerpt || post.description || '');
                const image = post.image || '/assets/default-post.jpg';
                const date = this.formatDate(post.createdAt || post.date);
                
                return `
                    <div class="post-card">
                        <div class="post-image">
                            <img src="${this.sanitizeAttr(image)}" 
                                 alt="${this.sanitizeAttr(title)}"
                                 onerror="this.src='/assets/default-post.jpg'"
                                 loading="lazy">
                        </div>
                        <div class="post-content">
                            <h4 class="post-title">${title}</h4>
                            <p class="post-excerpt">${excerpt}</p>
                            <div class="post-meta">
                                <span class="post-date">${date}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = postsHTML;
            
        } catch (error) {
            console.error('❌ Error displaying posts:', error);
        }
    }

    // Display sponsor ads with error handling
    displaySponsorAds(ads) {
        const container = document.getElementById('sponsor-ads-container');
        if (!container) {
            console.warn('⚠️ Sponsor ads container not found');
            return;
        }

        try {
            const adsHTML = ads.slice(0, 3).map(ad => {
                const title = this.sanitizeHtml(ad.title || 'إعلان');
                const description = this.sanitizeHtml(ad.description || ad.excerpt || '');
                const image = ad.image || '/assets/default-ad.jpg';
                const link = ad.link ? `<a href="${this.sanitizeAttr(ad.link)}" target="_blank" class="ad-link">اعرف المزيد</a>` : '';
                
                return `
                    <div class="sponsor-ad">
                        <div class="ad-image">
                            <img src="${this.sanitizeAttr(image)}" 
                                 alt="${this.sanitizeAttr(title)}"
                                 onerror="this.src='/assets/default-ad.jpg'"
                                 loading="lazy">
                        </div>
                        <div class="ad-content">
                            <h5 class="ad-title">${title}</h5>
                            <p class="ad-description">${description}</p>
                            ${link}
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = adsHTML;
            
        } catch (error) {
            console.error('❌ Error displaying sponsor ads:', error);
        }
    }

    // Show offline content
    showOfflineContent() {
        const articlesContainer = document.getElementById('articles-container');
        const loadingSpinner = document.getElementById('loading-spinner');
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        
        if (articlesContainer) {
            const isArabic = document.documentElement.lang === 'ar';
            
            articlesContainer.innerHTML = `
                <div class="offline-message">
                    <h3>⚠️ ${isArabic ? 'وضع غير متصل' : 'Mode Hors Ligne'}</h3>
                    <p>${isArabic ? 'لا يمكن الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.' : 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet et réessayer.'}</p>
                    <button onclick="location.reload()" class="retry-btn">🔄 ${isArabic ? 'إعادة المحاولة' : 'Réessayer'}</button>
                </div>
            `;
        }
    }

    // Show no articles message
    showNoArticlesMessage() {
        const container = document.getElementById('articles-container');
        const loadingSpinner = document.getElementById('loading-spinner');
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        
        if (container) {
            const isArabic = document.documentElement.lang === 'ar';
            
            container.innerHTML = `
                <div class="no-content-message">
                    <h3>📝 ${isArabic ? 'لا توجد مقالات متاحة' : 'Aucun article disponible'}</h3>
                    <p>${isArabic ? 'ستتوفر المقالات قريباً. ارجعي لاحقاً!' : 'Les articles seront bientôt disponibles. Revenez plus tard!'}</p>
                </div>
            `;
        }
    }

    // Show no content message
    showNoContentMessage() {
        const container = document.getElementById('articles-container');
        const loadingSpinner = document.getElementById('loading-spinner');
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        
        if (container) {
            const isArabic = document.documentElement.lang === 'ar';
            
            container.innerHTML = `
                <div class="no-content-message">
                    <h3>📭 ${isArabic ? 'لا يوجد محتوى' : 'Aucun contenu'}</h3>
                    <p>${isArabic ? 'نعمل على إضافة المحتوى. يرجى المحاولة لاحقاً.' : 'Nous travaillons sur l\'ajout de contenu. Veuillez réessayer plus tard.'}</p>
                    <button onclick="location.reload()" class="retry-btn">🔄 ${isArabic ? 'إعادة تحميل' : 'Recharger'}</button>
                </div>
            `;
        }
    }

    // Show load error message
    showLoadErrorMessage(contentType) {
        const container = document.getElementById('articles-container');
        const loadingSpinner = document.getElementById('loading-spinner');
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        
        if (container && contentType === 'articles') {
            const isArabic = document.documentElement.lang === 'ar';
            
            container.innerHTML = `
                <div class="error-message">
                    <h3>⚠️ ${isArabic ? 'خطأ في التحميل' : 'Erreur de chargement'}</h3>
                    <p>${isArabic ? `لا يمكن تحميل ${contentType === 'articles' ? 'المقالات' : contentType}. يرجى المحاولة لاحقاً.` : `Impossible de charger les ${contentType}. Veuillez réessayer plus tard.`}</p>
                    <button onclick="location.reload()" class="retry-btn">🔄 ${isArabic ? 'إعادة المحاولة' : 'Réessayer'}</button>
                </div>
            `;
        }
    }

    // Show initialization error
    showInitializationError() {
        const body = document.body;
        const isArabic = document.documentElement.lang === 'ar';
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
        `;
        
        errorDiv.innerHTML = `
            <div>
                <h2>💥 ${isArabic ? 'خطأ في تهيئة التطبيق' : 'Erreur d\'initialisation'}</h2>
                <p>${isArabic ? 'فشل في تحميل التطبيق. يرجى إعادة تحميل الصفحة.' : 'Échec du chargement de l\'application. Veuillez recharger la page.'}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; background: #007cba; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🔄 ${isArabic ? 'إعادة تحميل' : 'Recharger'}
                </button>
            </div>
        `;
        
        body.appendChild(errorDiv);
    }

    // Format date helper with Arabic support
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const isArabic = document.documentElement.lang === 'ar';
            
            if (isArabic) {
                return date.toLocaleDateString('ar-DZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } else {
                return date.toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        } catch (error) {
            const isArabic = document.documentElement.lang === 'ar';
            return isArabic ? 'تاريخ غير معروف' : 'Date inconnue';
        }
    }

    // Sanitize HTML to prevent XSS
    sanitizeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Sanitize attributes
    sanitizeAttr(str) {
        if (!str) return '';
        return str.replace(/['"<>&]/g, '');
    }

    // Setup event listeners with error handling
    setupEventListeners() {
        try {
            // Mobile menu toggle
            const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
            const mobileMenu = document.getElementById('mobile-menu');
            
            if (mobileMenuToggle && mobileMenu) {
                mobileMenuToggle.addEventListener('click', () => {
                    mobileMenu.classList.toggle('active');
                });
            }

            // Category filter
            const categoryFilters = document.querySelectorAll('.category-filter');
            categoryFilters.forEach(filter => {
                filter.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.filterByCategory(filter.dataset.category);
                });
            });

            // Search functionality
            const searchForm = document.getElementById('search-form');
            if (searchForm) {
                searchForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const query = document.getElementById('search-input').value;
                    this.searchContent(query);
                });
            }

            // Auth modal close
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.addEventListener('click', (e) => {
                    if (e.target === authModal) {
                        authModal.style.display = 'none';
                    }
                });
            }

            console.log('✅ Event listeners setup complete');
            
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }

    // Filter articles by category
    filterByCategory(category) {
        try {
            const articles = document.querySelectorAll('.article-card');
            
            articles.forEach(article => {
                if (category === 'all' || article.dataset.category === category) {
                    article.style.display = 'block';
                } else {
                    article.style.display = 'none';
                }
            });

            // Update active filter
            document.querySelectorAll('.category-filter').forEach(filter => {
                filter.classList.remove('active');
            });
            
            const activeFilter = document.querySelector(`[data-category="${category}"]`);
            if (activeFilter) {
                activeFilter.classList.add('active');
            }
            
        } catch (error) {
            console.error('❌ Error filtering by category:', error);
        }
    }

    // Search content
    async searchContent(query) {
        if (!query.trim()) return;

        try {
            console.log('🔍 Searching for:', query);
            const results = await this.apiRequest(`/articles?search=${encodeURIComponent(query)}`);
            
            const resultsList = Array.isArray(results) ? results : 
                               (results.articles ? results.articles : []);
            
            if (resultsList.length > 0) {
                this.displayArticles(resultsList);
                console.log(`✅ Found ${resultsList.length} search results`);
            } else {
                this.showNoArticlesMessage();
            }
            
        } catch (error) {
            console.error('❌ Search failed:', error);
            this.showLoadErrorMessage('search results');
        }
    }

    // Health check method for debugging
    async healthCheck() {
        try {
            console.log('🏥 Running health check...');
            
            const health = await this.apiRequest('/health');
            console.log('✅ Health check passed:', health);
            return true;
            
        } catch (error) {
            console.error('❌ Health check failed:', error);
            return false;
        }
    }
}

// Initialize app when DOM is ready with comprehensive error handling
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('🎬 Starting app initialization...');
        
        window.app = new MamanAlgerienneApp();
        await window.app.init();
        
        // Global error handler for unhandled promise rejections
        window.addEventListener('unhandledrejection', function(event) {
            console.error('🚨 Unhandled promise rejection:', event.reason);
            
            // Don't prevent the error from being logged
            // event.preventDefault();
        });
        
        // Global error handler for JavaScript errors
        window.addEventListener('error', function(event) {
            console.error('🚨 Global JavaScript error:', event.error);
        });
        
    } catch (error) {
        console.error('💥 Failed to initialize app:', error);
        
        // Show user-friendly error message
        const body = document.body;
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f44336;
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            text-align: center;
            font-family: Arial, sans-serif;
        `;
        
        const isArabic = document.documentElement.lang === 'ar';
        errorDiv.innerHTML = `
            <h3>💥 ${isArabic ? 'خطأ في التطبيق' : 'Erreur de l\'application'}</h3>
            <p>${isArabic ? 'فشل في تحميل التطبيق' : 'Échec du chargement de l\'application'}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; background: white; color: #f44336; border: none; border-radius: 5px; cursor: pointer;">
                🔄 ${isArabic ? 'إعادة المحاولة' : 'Réessayer'}
            </button>
        `;
        
        body.appendChild(errorDiv);
    }
});

// Handle page visibility changes for API reconnection
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.app && window.app.isInitialized) {
        console.log('👁️ Page became visible, checking API status...');
        window.app.checkApiAvailability();
    }
});

// Export for debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MamanAlgerienneApp;
}
