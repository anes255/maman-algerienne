// app.js - Main application logic for Maman Algerienne website
// Enhanced with better error handling and API availability checking

class MamanAlgerienneApp {
    constructor() {
        this.config = window.CONFIG || {
            API_BASE_URL: this.detectApiUrl(),
            SITE_NAME: 'Maman Algerienne',
            ITEMS_PER_PAGE: 6,
            CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
        };
        
        this.cache = new Map();
        this.apiAvailable = false;
        this.checkingApi = false;
        
        this.init();
    }

    detectApiUrl() {
        const currentDomain = window.location.hostname;
        
        if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
            return 'http://localhost:5000';
        } else if (currentDomain.includes('github.io')) {
            return 'https://mamanalgerienne-backend.onrender.com';
        } else if (currentDomain.includes('onrender.com')) {
            return 'https://mamanalgerienne-backend.onrender.com';
        } else if (currentDomain.includes('netlify.app')) {
            return 'https://mamanalgerienne-backend.onrender.com';
        }
        
        return 'https://mamanalgerienne-backend.onrender.com';
    }

    async init() {
        console.log('🚀 Initializing Maman Algerienne App...');
        console.log('API URL:', this.config.API_BASE_URL);
        
        // Check API availability first
        await this.checkApiAvailability();
        
        // Initialize UI components
        this.setupEventListeners();
        this.setupMobileMenu();
        this.setupCategoryNavigation();
        
        // Load initial content
        await this.loadInitialContent();
        
        console.log('✅ App initialized successfully');
    }

    async checkApiAvailability() {
        if (this.checkingApi) return this.apiAvailable;
        
        this.checkingApi = true;
        
        try {
            console.log('🔍 Checking API availability...');
            const response = await fetch(`${this.config.API_BASE_URL}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                this.apiAvailable = true;
                console.log('✅ API is available:', data);
            } else {
                throw new Error(`API returned ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ API not available:', error.message);
            this.apiAvailable = false;
        }
        
        this.checkingApi = false;
        return this.apiAvailable;
    }

    async apiRequest(endpoint, options = {}) {
        const url = `${this.config.API_BASE_URL}${endpoint}`;
        
        // Check cache first
        const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.config.CACHE_DURATION) {
            return cached.data;
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Cache successful responses
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            
            // Return fallback data for specific endpoints
            return this.getFallbackData(endpoint);
        }
    }

    getFallbackData(endpoint) {
        const fallbackData = {
            '/api/articles': {
                success: true,
                articles: [
                    {
                        _id: 'fallback-1',
                        title: 'نصائح للأمهات الجدد',
                        content: 'مجموعة من النصائح المهمة للأمهات الجديدات...',
                        author: 'فريق الموقع',
                        category: 'الأمومة',
                        image: 'assets/article1.jpg',
                        createdAt: new Date().toISOString()
                    },
                    {
                        _id: 'fallback-2',
                        title: 'وصفات صحية للأطفال',
                        content: 'مجموعة من الوصفات الصحية واللذيذة للأطفال...',
                        author: 'فريق الموقع',
                        category: 'التغذية',
                        image: 'assets/article2.jpg',
                        createdAt: new Date().toISOString()
                    }
                ]
            },
            '/api/posts': {
                success: true,
                posts: [
                    {
                        _id: 'fallback-post-1',
                        title: 'مرحباً بكم في مجتمع الأمهات الجزائريات',
                        content: 'منصة للتواصل وتبادل الخبرات بين الأمهات...',
                        author: 'المديرة',
                        likes: 25,
                        comments: [],
                        createdAt: new Date().toISOString()
                    }
                ]
            },
            '/api/products': {
                success: true,
                products: [
                    {
                        _id: 'fallback-product-1',
                        name: 'منتجات طبيعية للأطفال',
                        description: 'منتجات عضوية وطبيعية للعناية بالأطفال',
                        price: 1500,
                        image: 'assets/product1.jpg',
                        category: 'العناية بالطفل'
                    }
                ]
            }
        };

        return fallbackData[endpoint] || { success: false, message: 'لا توجد بيانات متاحة حالياً' };
    }

    async loadInitialContent() {
        // Load articles for homepage
        await this.loadLatestArticles();
        
        // Load community posts
        await this.loadLatestPosts();
        
        // Load products if on products page
        if (window.location.pathname.includes('products') || document.getElementById('products-container')) {
            await this.loadProducts();
        }
        
        // Load sponsor ads
        await this.loadSponsorAds();
        
        // Update online status
        this.updateApiStatus();
    }

    async loadLatestArticles() {
        const container = document.getElementById('articles-container');
        if (!container) return;

        this.showLoadingState(container);

        try {
            const data = await this.apiRequest('/api/articles');
            
            if (data.success && data.articles && data.articles.length > 0) {
                this.displayArticles(data.articles.slice(0, 6), container);
            } else {
                this.displayEmptyState(container, 'لا توجد مقالات متاحة حالياً', 'articles');
            }
        } catch (error) {
            console.error('Error loading articles:', error);
            this.displayErrorState(container, 'خطأ في تحميل المقالات');
        }
    }

    async loadLatestPosts() {
        const container = document.getElementById('posts-container');
        if (!container) return;

        this.showLoadingState(container);

        try {
            const data = await this.apiRequest('/api/posts');
            
            if (data.success && data.posts && data.posts.length > 0) {
                this.displayPosts(data.posts.slice(0, 4), container);
            } else {
                this.displayEmptyState(container, 'لا توجد منشورات متاحة حالياً', 'posts');
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            this.displayErrorState(container, 'خطأ في تحميل المنشورات');
        }
    }

    async loadProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;

        this.showLoadingState(container);

        try {
            const data = await this.apiRequest('/api/products');
            
            if (data.success && data.products && data.products.length > 0) {
                this.displayProducts(data.products, container);
            } else {
                this.displayEmptyState(container, 'لا توجد منتجات متاحة حالياً', 'products');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.displayErrorState(container, 'خطأ في تحميل المنتجات');
        }
    }

    async loadSponsorAds() {
        const container = document.getElementById('sponsor-ads-container');
        if (!container) return;

        try {
            const data = await this.apiRequest('/api/sponsor-ads');
            
            if (data.success && data.ads && data.ads.length > 0) {
                this.displaySponsorAds(data.ads, container);
            } else {
                this.displayEmptyAds(container);
            }
        } catch (error) {
            console.error('Error loading sponsor ads:', error);
            this.displayEmptyAds(container);
        }
    }

    displayArticles(articles, container) {
        const articlesHtml = articles.map(article => `
            <article class="article-card" data-id="${this.escapeHtml(article._id)}">
                <div class="article-image">
                    <img src="${this.escapeHtml(article.image || 'assets/default-article.jpg')}" 
                         alt="${this.escapeHtml(article.title)}" 
                         onerror="this.src='assets/default-article.jpg'">
                </div>
                <div class="article-content">
                    <div class="article-meta">
                        <span class="category">${this.escapeHtml(article.category || 'عام')}</span>
                        <span class="date">${this.formatDate(article.createdAt)}</span>
                    </div>
                    <h3 class="article-title">${this.escapeHtml(article.title)}</h3>
                    <p class="article-excerpt">${this.escapeHtml(this.truncateText(article.content, 100))}</p>
                    <div class="article-footer">
                        <span class="author">بقلم: ${this.escapeHtml(article.author || 'كاتب مجهول')}</span>
                        <a href="pages/article.html?id=${article._id}" class="read-more">اقرأ المزيد</a>
                    </div>
                </div>
            </article>
        `).join('');

        container.innerHTML = articlesHtml;
    }

    displayPosts(posts, container) {
        const postsHtml = posts.map(post => `
            <div class="post-card" data-id="${this.escapeHtml(post._id)}">
                <div class="post-header">
                    <div class="post-author">
                        <img src="${this.escapeHtml(post.authorAvatar || 'assets/default-avatar.png')}" 
                             alt="${this.escapeHtml(post.author)}" 
                             class="author-avatar"
                             onerror="this.src='assets/default-avatar.png'">
                        <div class="author-info">
                            <h4>${this.escapeHtml(post.author || 'عضو مجهول')}</h4>
                            <span class="post-date">${this.formatDate(post.createdAt)}</span>
                        </div>
                    </div>
                </div>
                <div class="post-content">
                    <h3>${this.escapeHtml(post.title)}</h3>
                    <p>${this.escapeHtml(this.truncateText(post.content, 150))}</p>
                </div>
                <div class="post-actions">
                    <button class="action-btn like-btn" onclick="app.toggleLike('${post._id}')">
                        <i class="fas fa-heart"></i>
                        <span>${post.likes || 0}</span>
                    </button>
                    <button class="action-btn comment-btn" onclick="app.showComments('${post._id}')">
                        <i class="fas fa-comment"></i>
                        <span>${(post.comments && post.comments.length) || 0}</span>
                    </button>
                    <button class="action-btn share-btn" onclick="app.sharePost('${post._id}')">
                        <i class="fas fa-share"></i>
                        <span>مشاركة</span>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = postsHtml;
    }

    displayProducts(products, container) {
        const productsHtml = products.map(product => `
            <div class="product-card" data-id="${this.escapeHtml(product._id)}">
                <div class="product-image">
                    <img src="${this.escapeHtml(product.image || 'assets/default-product.jpg')}" 
                         alt="${this.escapeHtml(product.name)}"
                         onerror="this.src='assets/default-product.jpg'">
                </div>
                <div class="product-info">
                    <h3>${this.escapeHtml(product.name)}</h3>
                    <p class="product-description">${this.escapeHtml(this.truncateText(product.description, 80))}</p>
                    <div class="product-price">${product.price} دج</div>
                    <div class="product-actions">
                        <button class="btn btn-primary" onclick="app.contactForProduct('${product._id}')">
                            تواصل للشراء
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = productsHtml;
    }

    displaySponsorAds(ads, container) {
        const adsHtml = ads.map(ad => `
            <div class="sponsor-ad" data-id="${this.escapeHtml(ad._id)}">
                <a href="${this.escapeHtml(ad.link || '#')}" target="_blank" rel="noopener">
                    <img src="${this.escapeHtml(ad.image)}" alt="${this.escapeHtml(ad.title)}">
                    <div class="ad-overlay">
                        <h4>${this.escapeHtml(ad.title)}</h4>
                        <p>${this.escapeHtml(ad.description)}</p>
                    </div>
                </a>
            </div>
        `).join('');

        container.innerHTML = adsHtml;
    }

    displayEmptyAds(container) {
        container.innerHTML = `
            <div class="sponsor-ads-empty">
                <h3>مساحة إعلانية متاحة</h3>
                <p>هل تريدين الإعلان معنا؟ تواصلي معنا للحصول على عروض خاصة</p>
                <div style="margin-top: 1rem;">
                    <a href="mailto:mamanalgeriennepartenariat@gmail.com" class="btn btn-primary">تواصلي معنا</a>
                </div>
            </div>
        `;
    }

    showLoadingState(container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>جاري التحميل...</p>
            </div>
        `;
    }

    displayEmptyState(container, message, type) {
        const icons = {
            articles: 'fas fa-newspaper',
            posts: 'fas fa-comments',
            products: 'fas fa-shopping-bag'
        };

        container.innerHTML = `
            <div class="empty-state">
                <i class="${icons[type] || 'fas fa-info-circle'}"></i>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="app.refreshContent()">
                    إعادة التحميل
                </button>
            </div>
        `;
    }

    displayErrorState(container, message) {
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="app.refreshContent()">
                    إعادة المحاولة
                </button>
            </div>
        `;
    }

    updateApiStatus() {
        const statusIndicator = document.getElementById('api-status');
        if (statusIndicator) {
            statusIndicator.className = `api-status ${this.apiAvailable ? 'online' : 'offline'}`;
            statusIndicator.title = this.apiAvailable ? 'متصل' : 'غير متصل';
        }
    }

    async refreshContent() {
        // Clear cache
        this.cache.clear();
        
        // Check API availability again
        await this.checkApiAvailability();
        
        // Reload content
        await this.loadInitialContent();
    }

    setupEventListeners() {
        // Contact form submission
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', this.handleContactForm.bind(this));
        }

        // Newsletter subscription
        const newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', this.handleNewsletterSubscription.bind(this));
        }

        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        }
    }

    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuClose = document.getElementById('mobile-menu-close');

        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenu.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        if (mobileMenuClose && mobileMenu) {
            mobileMenuClose.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        if (mobileMenu) {
            mobileMenu.addEventListener('click', (e) => {
                if (e.target === mobileMenu) {
                    mobileMenu.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
    }

    setupCategoryNavigation() {
        const categoryCards = document.querySelectorAll('.category-card');
        const categoryLinks = document.querySelectorAll('[data-category]');
        
        [...categoryCards, ...categoryLinks].forEach(element => {
            element.addEventListener('click', function(e) {
                e.preventDefault();
                const category = this.dataset.category;
                if (category) {
                    window.location.href = `pages/community.html?category=${encodeURIComponent(category)}`;
                }
            });
        });
    }

    async handleContactForm(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            const response = await this.apiRequest('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.success) {
                this.showNotification('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً', 'success');
                e.target.reset();
            } else {
                throw new Error(response.message || 'فشل في إرسال الرسالة');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            this.showNotification('حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى', 'error');
        }
    }

    async handleNewsletterSubscription(e) {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;

        try {
            const response = await this.apiRequest('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.success) {
                this.showNotification('تم الاشتراك في النشرة الإخبارية بنجاح!', 'success');
                e.target.reset();
            } else {
                throw new Error(response.message || 'فشل في الاشتراك');
            }
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            this.showNotification('حدث خطأ في الاشتراك. يرجى المحاولة مرة أخرى', 'error');
        }
    }

    async handleSearch(e) {
        const query = e.target.value.trim();
        if (query.length < 2) return;

        try {
            const response = await this.apiRequest(`/api/search?q=${encodeURIComponent(query)}`);
            this.displaySearchResults(response.results || []);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    async toggleLike(postId) {
        try {
            const response = await this.apiRequest(`/api/posts/${postId}/like`, {
                method: 'POST'
            });

            if (response.success) {
                // Update the like button display
                const likeBtn = document.querySelector(`.like-btn[onclick*="${postId}"] span`);
                if (likeBtn) {
                    likeBtn.textContent = response.likes || 0;
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            this.showNotification('حدث خطأ في التفاعل مع المنشور', 'error');
        }
    }

    contactForProduct(productId) {
        const subject = `استفسار عن المنتج - ${productId}`;
        const body = `مرحباً،\n\nأود الاستفسار عن المنتج ذو الرقم: ${productId}\n\nشكراً لكم`;
        const mailtoLink = `mailto:mamanalgeriennepartenariat@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Utility functions
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-DZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the app when DOM is ready
let app;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new MamanAlgerienneApp();
    });
} else {
    app = new MamanAlgerienneApp();
}

// Export for external access
window.app = app;
