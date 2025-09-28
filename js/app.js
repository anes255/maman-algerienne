// App Configuration - FIXED for cross-device compatibility and correct API URLs
(function() {
    'use strict';
    
    // Global API configuration
    let API_BASE_URL = 'https://mamanalgerienne-backend.onrender.com/api';
    let SERVER_BASE_URL = 'https://mamanalgerienne-backend.onrender.com';
    
    // Initialize API URLs
    async function initializeAppApiUrls() {
        try {
            // Wait for config to be loaded
            if (window.APP_CONFIG) {
                API_BASE_URL = window.APP_CONFIG.API_BASE_URL;
                SERVER_BASE_URL = window.APP_CONFIG.SERVER_BASE_URL;
            } else if (window.API_BASE_URL) {
                API_BASE_URL = window.API_BASE_URL;
                SERVER_BASE_URL = window.SERVER_BASE_URL;
            } else {
                // Auto-detect environment
                const hostname = window.location.hostname;
                console.log('🔍 Detecting API URL for hostname:', hostname);
                
                if (hostname === 'localhost' || hostname === '127.0.0.1') {
                    API_BASE_URL = 'http://localhost:5000/api';
                    SERVER_BASE_URL = 'http://localhost:5000';
                } else {
                    API_BASE_URL = 'https://mamanalgerienne-backend.onrender.com/api';
                    SERVER_BASE_URL = 'https://mamanalgerienne-backend.onrender.com';
                }
            }
            
            console.log('✅ Production API URL detected:', API_BASE_URL);
            console.log('🚀 Initializing Maman Algerienne App...');
            console.log('API URL:', SERVER_BASE_URL);
            
            return true;
        } catch (error) {
            console.error('Failed to initialize app API URLs:', error);
            return false;
        }
    }
    
    // App-specific variables (isolated from global scope)
    let appCurrentPage = 1;
    let appIsLoading = false;

    // DOM Elements
    const loadingSpinner = document.getElementById('loading-spinner');
    const toastContainer = document.getElementById('toast-container');

    // Initialize App
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('🔍 Checking API availability...');
        
        await initializeAppApiUrls();
        
        // Only initialize if we're on the main page (not store page)
        if (!window.location.pathname.includes('store.html')) {
            await initializeApp();
        }
    });

    async function initializeApp() {
        try {
            // Test API connectivity first
            const apiTest = await testApiConnectivity();
            console.log('✅ API is available:', apiTest);
            
            setupEventListeners();
            await loadInitialContent();
            
            // Check if user is logged in
            if (typeof checkAuthStatus === 'function') {
                checkAuthStatus();
            }
            
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('App initialization failed:', error);
            showAppToast('خطأ في تحميل التطبيق', 'error');
        }
    }

    async function testApiConnectivity() {
        try {
            const response = await fetch(`${SERVER_BASE_URL}/health`);
            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                console.log('API health check failed:', response.status);
                return null;
            }
        } catch (error) {
            console.log('API connectivity test failed:', error.message);
            return null;
        }
    }

    async function loadInitialContent() {
        try {
            // Load content in parallel
            await Promise.all([
                loadFeaturedArticles(),
                loadSponsorAds()
            ]);
        } catch (error) {
            console.error('Error loading initial content:', error);
        }
    }

    function setupEventListeners() {
        // Mobile menu toggle - FIXED
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuClose = document.getElementById('mobile-menu-close');
        
        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Mobile menu toggle clicked');
                mobileMenu.classList.add('active');
            });
        }

        if (mobileMenuClose && mobileMenu) {
            mobileMenuClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                mobileMenu.classList.remove('active');
            });
        }

        // Close menu when clicking on overlay
        if (mobileMenu) {
            mobileMenu.addEventListener('click', (e) => {
                if (e.target === mobileMenu) {
                    mobileMenu.classList.remove('active');
                }
            });
        }

        // Search functionality
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', handleSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });
        }

        // Category cards
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                showCategoryArticles(category);
            });
        });

        // Category links in dropdown and footer
        const categoryLinks = document.querySelectorAll('[data-category]');
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = link.dataset.category;
                showCategoryArticles(category);
            });
        });

        // Load more articles button
        const loadMoreBtn = document.getElementById('load-more-articles');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', loadMoreArticles);
        }

        // User dropdown toggle
        const userAvatar = document.getElementById('user-avatar');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (userAvatar && userDropdown) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userDropdown.style.display = 'none';
            });
        }

        // Logout functionality
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof logout === 'function') {
                    logout();
                }
            });
        }
    }

    // Loading Functions
    function showAppLoading() {
        if (loadingSpinner) {
            loadingSpinner.classList.add('show');
        }
        appIsLoading = true;
    }

    function hideAppLoading() {
        if (loadingSpinner) {
            loadingSpinner.classList.remove('show');
        }
        appIsLoading = false;
    }

    // Toast Notifications
    function showAppToast(message, type = 'info') {
        if (!toastContainer) {
            console.log('Toast:', message);
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = getToastIcon(type);
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    function getToastIcon(type) {
        switch (type) {
            case 'success': return 'fas fa-check-circle';
            case 'error': return 'fas fa-exclamation-circle';
            case 'warning': return 'fas fa-exclamation-triangle';
            default: return 'fas fa-info-circle';
        }
    }

    // API Functions - FIXED with proper error handling
    async function appApiRequest(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.log(`API request failed for ${endpoint}:`, `Error: HTTP ${response.status}: ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            console.log(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // Article Functions
    async function loadFeaturedArticles() {
        try {
            showAppLoading();
            const data = await appApiRequest('/articles?featured=true&limit=6');
            displayArticles(data.articles || [], 'featured-articles-grid');
        } catch (error) {
            console.error('Error loading featured articles:', error);
            // Don't show error toast for articles as they're not critical
            displayEmptyArticles('featured-articles-grid');
        } finally {
            hideAppLoading();
        }
    }

    async function loadRecentArticles() {
        try {
            const data = await appApiRequest(`/articles?page=${appCurrentPage}&limit=9`);
            displayArticles(data.articles || [], 'recent-articles-grid');
            
            // Hide load more button if no more articles
            const loadMoreBtn = document.getElementById('load-more-articles');
            if (loadMoreBtn && appCurrentPage >= (data.pagination?.pages || 1)) {
                loadMoreBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading recent articles:', error);
            displayEmptyArticles('recent-articles-grid');
        }
    }

    async function loadMoreArticles() {
        if (appIsLoading) return;
        
        appCurrentPage++;
        await loadRecentArticles();
    }

    async function showCategoryArticles(category) {
        try {
            showAppLoading();
            const data = await appApiRequest(`/articles/category/${encodeURIComponent(category)}`);
            
            // Clear existing articles
            const container = document.getElementById('recent-articles-grid');
            if (container) {
                container.innerHTML = '';
                displayArticles(data.articles || [], 'recent-articles-grid');
            }
            
            // Update section title
            const sectionTitle = document.querySelector('.recent-articles .section-title');
            if (sectionTitle) {
                sectionTitle.textContent = `مقالات ${category}`;
            }
            
            // Scroll to articles section
            const articlesSection = document.querySelector('.recent-articles');
            if (articlesSection) {
                articlesSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Hide load more button for category view
            const loadMoreBtn = document.getElementById('load-more-articles');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Error loading category articles:', error);
            showAppToast(`خطأ في تحميل مقالات ${category}`, 'error');
        } finally {
            hideAppLoading();
        }
    }

    function displayArticles(articles, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (containerId === 'recent-articles-grid' && appCurrentPage === 1) {
            container.innerHTML = '';
        }
        
        if (articles.length === 0) {
            displayEmptyArticles(containerId);
            return;
        }
        
        articles.forEach(article => {
            const articleCard = createArticleCard(article);
            container.appendChild(articleCard);
        });
    }

    function displayEmptyArticles(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--light-text);">
                <i class="fas fa-newspaper" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>لا توجد مقالات بعد</h3>
                <p>ستتم إضافة المقالات قريباً</p>
            </div>
        `;
    }

    function createArticleCard(article) {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.onclick = () => openArticle(article._id);
        
        // Use dynamic server URL for images - FIXED
        const imageUrl = article.images && article.images.length > 0 
            ? `${SERVER_BASE_URL}/uploads/articles/${article.images[0]}`
            : 'https://via.placeholder.com/400x200/d4a574/ffffff?text=ماما+الجزائرية';
        
        const authorAvatar = article.author?.avatar 
            ? `${SERVER_BASE_URL}/uploads/avatars/${article.author.avatar}`
            : 'https://via.placeholder.com/25x25/d4a574/ffffff?text=' + (article.author?.name?.charAt(0) || 'م');
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${escapeHtml(article.title)}" class="article-image" 
                 onerror="this.src='https://via.placeholder.com/400x200/d4a574/ffffff?text=ماما+الجزائرية'">
            <div class="article-content">
                <span class="article-category">${escapeHtml(article.category || 'عام')}</span>
                <h3 class="article-title">${escapeHtml(article.title)}</h3>
                <p class="article-excerpt">${escapeHtml(article.excerpt || article.content?.substring(0, 100) || '')}</p>
                <div class="article-meta">
                    <div class="article-author">
                        <img src="${authorAvatar}" alt="${escapeHtml(article.author?.name || 'كاتب')}" class="author-avatar" 
                             onerror="this.src='https://via.placeholder.com/25x25/d4a574/ffffff?text=${article.author?.name?.charAt(0) || 'م'}'">
                        <span>${escapeHtml(article.author?.name || 'كاتب')}</span>
                    </div>
                    <div class="article-stats">
                        <span><i class="fas fa-eye"></i> ${article.views || 0}</span>
                        <span><i class="fas fa-heart"></i> ${article.likes ? article.likes.length : 0}</span>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }

    // Sponsor Ads Functions - ENHANCED
    async function loadSponsorAds() {
        try {
            console.log('🔗 Loading sponsor ads from:', SERVER_BASE_URL);
            
            // First try to get featured ad posts
            const response = await fetch(`${SERVER_BASE_URL}/api/posts?type=ad&limit=6`);
            
            console.log('📡 Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 Sponsor ads data:', data);
                
                if (data.posts && data.posts.length > 0) {
                    displaySponsorAds(data.posts);
                } else {
                    console.log('No sponsor ads found');
                    // Don't display empty state, just hide the section
                    hideSponsorAdsSection();
                }
            } else {
                console.log('🚨 Error loading sponsor ads:', response.status);
                hideSponsorAdsSection();
            }
        } catch (error) {
            console.error('Error loading sponsor ads:', error);
            hideSponsorAdsSection();
        }
    }

    function displaySponsorAds(posts) {
        const container = document.getElementById('sponsor-ads-container');
        if (!container || posts.length === 0) {
            hideSponsorAdsSection();
            return;
        }
        
        container.innerHTML = '';
        
        posts.slice(0, 6).forEach(post => {
            const adCard = createSponsorAdCard(post);
            container.appendChild(adCard);
        });
    }

    function createSponsorAdCard(post) {
        const card = document.createElement('div');
        card.className = 'sponsor-ad';
        
        // Get ad details
        const adDetails = post.adDetails || {};
        const adLink = adDetails.link || '#';
        const buttonText = adDetails.buttonText || 'اعرف المزيد';
        const isFeatured = adDetails.featured || post.featured;
        
        // Use dynamic server URL for images - FIXED
        const imageUrl = post.images && post.images.length > 0 
            ? `${SERVER_BASE_URL}/uploads/posts/${post.images[0]}`
            : '';
        
        const imageHtml = imageUrl 
            ? `<img src="${imageUrl}" alt="${escapeHtml(post.title)}" class="ad-image" 
                    onerror="this.style.display='none'">`
            : '';
        
        const clickAction = adLink !== '#' 
            ? `onclick="window.open('${escapeHtml(adLink)}', '_blank')"` 
            : `onclick="openPost('${post._id}')"`;
        
        card.innerHTML = `
            <div class="sponsor-badge">إعلان${isFeatured ? ' مميز' : ''}</div>
            <div class="ad-icon">
                <i class="fas fa-${isFeatured ? 'star' : 'bullhorn'}"></i>
            </div>
            ${imageHtml}
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.content.substring(0, 100))}${post.content.length > 100 ? '...' : ''}</p>
            <div ${clickAction} style="cursor: pointer;">
                <button class="btn btn-primary">${escapeHtml(buttonText)}</button>
            </div>
        `;
        
        return card;
    }

    function hideSponsorAdsSection() {
        const section = document.querySelector('.sponsor-ads-section');
        if (section) {
            section.style.display = 'none';
        }
    }

    // Search Function
    async function handleSearch() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput?.value?.trim();
        
        if (!query) {
            showAppToast('يرجى إدخال كلمة البحث', 'warning');
            return;
        }
        
        try {
            showAppLoading();
            const data = await appApiRequest(`/articles?search=${encodeURIComponent(query)}`);
            
            // Clear existing articles
            const container = document.getElementById('recent-articles-grid');
            if (container) {
                container.innerHTML = '';
                
                if (!data.articles || data.articles.length === 0) {
                    container.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                            <i class="fas fa-search" style="font-size: 3rem; color: var(--light-text); margin-bottom: 1rem;"></i>
                            <h3>لا توجد نتائج للبحث</h3>
                            <p>جرب استخدام كلمات مختلفة</p>
                        </div>
                    `;
                } else {
                    displayArticles(data.articles, 'recent-articles-grid');
                }
                
                // Update section title
                const sectionTitle = document.querySelector('.recent-articles .section-title');
                if (sectionTitle) {
                    sectionTitle.textContent = `نتائج البحث عن: ${query}`;
                }
                
                // Scroll to results
                const articlesSection = document.querySelector('.recent-articles');
                if (articlesSection) {
                    articlesSection.scrollIntoView({ behavior: 'smooth' });
                }
                
                // Hide load more button for search results
                const loadMoreBtn = document.getElementById('load-more-articles');
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'none';
                }
            }
            
        } catch (error) {
            console.error('Search error:', error);
            showAppToast('خطأ في البحث', 'error');
        } finally {
            hideAppLoading();
        }
    }

    // Navigation Functions
    function openArticle(articleId) {
        window.location.href = `pages/article.html?id=${articleId}`;
    }

    function openPost(postId) {
        window.location.href = `pages/community.html?post=${postId}`;
    }

    // Utility Functions
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            calendar: 'islamic'
        };
        return date.toLocaleDateString('ar-DZ', options);
    }

    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'م';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'ك';
        }
        return num.toString();
    }

    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Error Handling
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        // Don't show toast for every error to avoid spam
    });

    // Export functions for use in other files (only the ones that need to be global)
    window.apiRequest = appApiRequest;
    window.showToast = showAppToast;
    window.showLoading = showAppLoading;
    window.hideLoading = hideAppLoading;
    window.SERVER_BASE_URL = SERVER_BASE_URL; // Export for use in other files
    window.API_BASE_URL = API_BASE_URL; // Export for use in other files

})();
