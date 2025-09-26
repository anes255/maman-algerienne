// Main Application Logic - Fixed Version with Correct API Connectivity
class MamanAlgerienneApp {
    constructor() {
        this.apiStatus = 'unknown';
        this.retryCount = 0;
        this.maxRetries = 3;
        this.API_BASE_URL = '';
        this.SERVER_BASE_URL = '';
    }

    // Initialize the application
    async init() {
        console.log('🚀 Initializing Maman Algerienne App...');
        console.log('API URL:', this.getApiBaseUrl());
        
        // Wait for config to be ready
        await this.waitForConfig();
        
        // Set API URLs from config
        this.API_BASE_URL = window.CONFIG.API_BASE_URL + '/api';
        this.SERVER_BASE_URL = window.CONFIG.SERVER_BASE_URL;
        
        console.log('🔍 Checking API availability...');
        await this.checkApiAvailability();
        
        // Load initial content
        await this.loadInitialContent();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ App initialized successfully');
    }

    // Wait for config to be ready
    async waitForConfig() {
        let attempts = 0;
        while (!window.CONFIG || !window.CONFIG.API_BASE_URL) {
            if (attempts > 50) break; // Max 5 seconds wait
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }

    // Get API base URL with fallback
    getApiBaseUrl() {
        // Use config if available
        if (window.CONFIG && window.CONFIG.API_BASE_URL) {
            return window.CONFIG.API_BASE_URL;
        }
        
        // Fallback detection
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        }
        return 'https://mamanalgerienne-backend.onrender.com';
    }

    // Enhanced API request with better error handling
    async apiRequest(endpoint, options = {}) {
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
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // Check API availability
    async checkApiAvailability() {
        try {
            const testUrl = this.getApiBaseUrl() + '/health';
            console.log('🧪 Testing API at:', testUrl);
            
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API is available:', data);
                this.apiStatus = 'online';
                this.updateApiStatusIndicator(true);
                return true;
            } else {
                throw new Error(`API health check failed: ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ API not available:', error.message);
            this.apiStatus = 'offline';
            this.updateApiStatusIndicator(false);
            console.log('Showing offline content...');
            this.showOfflineContent();
            return false;
        }
    }

    // Update API status indicator
    updateApiStatusIndicator(isOnline) {
        const indicator = document.getElementById('api-status');
        if (indicator) {
            indicator.className = `api-status ${isOnline ? 'online' : 'offline'}`;
            indicator.textContent = isOnline ? 'En ligne' : 'Hors ligne';
        }
    }

    // Show offline content
    showOfflineContent() {
        const articlesContainer = document.getElementById('articles-container');
        const loadingSpinner = document.getElementById('loading-spinner');
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        
        if (articlesContainer) {
            articlesContainer.innerHTML = `
                <div class="offline-message">
                    <h3>⚠️ Mode Hors Ligne</h3>
                    <p>Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet et réessayer.</p>
                    <button onclick="location.reload()" class="retry-btn">🔄 Réessayer</button>
                </div>
            `;
        }
    }

    // Load initial content
    async loadInitialContent() {
        if (this.apiStatus !== 'online') {
            console.log('⚠️ API offline, skipping content load');
            return;
        }

        const promises = [
            this.loadArticles(),
            this.loadPosts(),
            this.loadSponsorAds()
        ];

        // Wait for all content to load
        await Promise.allSettled(promises);
    }

    // Load articles
    async loadArticles() {
        try {
            console.log('📰 Loading articles...');
            const articles = await this.apiRequest('/articles');
            
            if (Array.isArray(articles) && articles.length > 0) {
                this.displayArticles(articles);
                console.log(`✅ Loaded ${articles.length} articles`);
            } else {
                this.showNoArticlesMessage();
            }
        } catch (error) {
            console.error('❌ Failed to load articles:', error);
            this.showLoadErrorMessage('articles');
        }
    }

    // Load posts
    async loadPosts() {
        try {
            console.log('📝 Loading posts...');
            const posts = await this.apiRequest('/posts');
            
            if (Array.isArray(posts) && posts.length > 0) {
                this.displayPosts(posts);
                console.log(`✅ Loaded ${posts.length} posts`);
            } else {
                console.log('ℹ️ No posts available');
            }
        } catch (error) {
            console.error('❌ Failed to load posts:', error);
        }
    }

    // Load sponsor ads - Updated to handle 404 gracefully
    async loadSponsorAds() {
        try {
            console.log('📢 Loading sponsor ads...');
            
            // Try multiple possible endpoints
            const possibleEndpoints = [
                '/posts?type=ad&limit=6',
                '/posts?featured=true&limit=6',
                '/articles?featured=true&limit=6'
            ];
            
            for (const endpoint of possibleEndpoints) {
                try {
                    const ads = await this.apiRequest(endpoint);
                    if (Array.isArray(ads) && ads.length > 0) {
                        this.displaySponsorAds(ads);
                        console.log(`✅ Loaded ${ads.length} sponsor ads from ${endpoint}`);
                        return;
                    }
                } catch (error) {
                    console.log(`⚠️ Endpoint ${endpoint} failed:`, error.message);
                    continue;
                }
            }
            
            console.log('ℹ️ No sponsor ads available from any endpoint');
            
        } catch (error) {
            console.error('❌ Failed to load sponsor ads:', error);
        }
    }

    // Display articles
    displayArticles(articles) {
        const container = document.getElementById('articles-container');
        const loadingSpinner = document.getElementById('loading-spinner');
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        
        if (!container) return;

        const articlesHTML = articles.map(article => `
            <article class="article-card" data-category="${article.category || 'general'}">
                <div class="article-image">
                    <img src="${article.image || '/assets/default-article.jpg'}" 
                         alt="${article.title}"
                         onerror="this.src='/assets/default-article.jpg'">
                    ${article.featured ? '<span class="featured-badge">Épinglé</span>' : ''}
                </div>
                <div class="article-content">
                    <span class="article-category">${article.category || 'Général'}</span>
                    <h3 class="article-title">${article.title}</h3>
                    <p class="article-excerpt">${article.excerpt || article.description || ''}</p>
                    <div class="article-meta">
                        <span class="article-date">${this.formatDate(article.createdAt)}</span>
                        <span class="article-read-time">${article.readTime || '5'} min de lecture</span>
                    </div>
                    <a href="article.html?id=${article._id}" class="read-more-btn">Lire la suite</a>
                </div>
            </article>
        `).join('');

        container.innerHTML = articlesHTML;
    }

    // Display posts
    displayPosts(posts) {
        const container = document.getElementById('posts-container');
        if (!container) return;

        const postsHTML = posts.slice(0, 6).map(post => `
            <div class="post-card">
                <div class="post-image">
                    <img src="${post.image || '/assets/default-post.jpg'}" 
                         alt="${post.title}"
                         onerror="this.src='/assets/default-post.jpg'">
                </div>
                <div class="post-content">
                    <h4 class="post-title">${post.title}</h4>
                    <p class="post-excerpt">${post.excerpt || post.description || ''}</p>
                    <div class="post-meta">
                        <span class="post-date">${this.formatDate(post.createdAt)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = postsHTML;
    }

    // Display sponsor ads
    displaySponsorAds(ads) {
        const container = document.getElementById('sponsor-ads-container');
        if (!container) return;

        const adsHTML = ads.slice(0, 3).map(ad => `
            <div class="sponsor-ad">
                <div class="ad-image">
                    <img src="${ad.image || '/assets/default-ad.jpg'}" 
                         alt="${ad.title}"
                         onerror="this.src='/assets/default-ad.jpg'">
                </div>
                <div class="ad-content">
                    <h5 class="ad-title">${ad.title}</h5>
                    <p class="ad-description">${ad.description || ad.excerpt || ''}</p>
                    ${ad.link ? `<a href="${ad.link}" target="_blank" class="ad-link">En savoir plus</a>` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = adsHTML;
    }

    // Show no articles message
    showNoArticlesMessage() {
        const container = document.getElementById('articles-container');
        const loadingSpinner = document.getElementById('loading-spinner');
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        
        if (container) {
            container.innerHTML = `
                <div class="no-content-message">
                    <h3>📝 Aucun article disponible</h3>
                    <p>Les articles seront bientôt disponibles. Revenez plus tard!</p>
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
            container.innerHTML = `
                <div class="error-message">
                    <h3>⚠️ Erreur de chargement</h3>
                    <p>Impossible de charger les ${contentType}. Veuillez réessayer plus tard.</p>
                    <button onclick="location.reload()" class="retry-btn">🔄 Réessayer</button>
                </div>
            `;
        }
    }

    // Format date helper
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Date inconnue';
        }
    }

    // Setup event listeners
    setupEventListeners() {
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
    }

    // Filter articles by category
    filterByCategory(category) {
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
    }

    // Search content
    async searchContent(query) {
        if (!query.trim()) return;

        try {
            console.log('🔍 Searching for:', query);
            const results = await this.apiRequest(`/articles?search=${encodeURIComponent(query)}`);
            
            if (Array.isArray(results)) {
                this.displayArticles(results);
                console.log(`✅ Found ${results.length} search results`);
            }
        } catch (error) {
            console.error('❌ Search failed:', error);
            this.showLoadErrorMessage('search results');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    window.app = new MamanAlgerienneApp();
    await window.app.init();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.app) {
        // Page became visible, check API status
        window.app.checkApiAvailability();
    }
});
