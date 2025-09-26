// App Configuration - Fixed for cross-device compatibility
(function() {
    'use strict';
    
    // Get base server URL (without /api)
    function getServerBaseUrl() {
        // Check if we're in production (deployed)
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return 'https://maman-algerienne.onrender.com'; // Your actual Render URL
        }
        
        // Development
        return 'http://localhost:5000';
    }

    // Get API base URL
    function getApiBaseUrl() {
        return getServerBaseUrl() + '/api';
    }

    const SERVER_BASE_URL = getServerBaseUrl();
    const API_BASE_URL = getApiBaseUrl();
    
    // App-specific variables (isolated from global scope)
    let appCurrentPage = 1;
    let appIsLoading = false;
    let apiAvailable = false; // Track API availability

    // DOM Elements
    const loadingSpinner = document.getElementById('loading-spinner');
    const toastContainer = document.getElementById('toast-container');

    // Initialize App
    document.addEventListener('DOMContentLoaded', function() {
        // Only initialize if we're on the main page (not store page)
        if (!window.location.pathname.includes('store.html')) {
            initializeApp();
        }
    });

    async function initializeApp() {
        console.log('Initializing app...');
        
        // Check API availability first
        await checkApiAvailability();
        
        setupEventListeners();
        
        // Load content based on API availability
        if (apiAvailable) {
            loadFeaturedArticles();
            loadRecentArticles();
            loadAdPosts();
        } else {
            showOfflineContent();
        }
        
        // Check if user is logged in
        if (typeof checkAuthStatus === 'function') {
            checkAuthStatus();
        }
    }

    async function checkApiAvailability() {
        try {
            const response = await fetch(`${SERVER_BASE_URL}/health`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                apiAvailable = true;
                console.log('✅ API is available');
            } else {
                throw new Error('API health check failed');
            }
        } catch (error) {
            console.warn('⚠️ API not available:', error.message);
            apiAvailable = false;
        }
    }

    function showOfflineContent() {
        console.log('Showing offline content...');
        
        // Show placeholder content for featured articles
        const featuredContainer = document.getElementById('featured-articles-grid');
        if (featuredContainer) {
            featuredContainer.innerHTML = createOfflineArticlesHTML();
        }
        
        // Hide sponsor ads section if API is not available
        const sponsorSection = document.querySelector('.sponsor-ads-section');
        if (sponsorSection) {
            sponsorSection.style.display = 'none';
        }
    }

    function createOfflineArticlesHTML() {
        return `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--secondary-color); border-radius: var(--border-radius);">
                <i class="fas fa-wifi" style="font-size: 3rem; color: var(--light-text); margin-bottom: 1rem;"></i>
                <h3>الموقع قيد الصيانة</h3>
                <p>نعمل حالياً على تحسين خدماتنا. يرجى المحاولة لاحقاً.</p>
                <div style="margin-top: 1.5rem;">
                    <button onclick="window.location.reload()" class="btn btn-primary">أعد التحميل</button>
                </div>
            </div>
        `;
    }

    function setupEventListeners() {
        // Mobile menu toggle
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Search functionality
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        const mobileSearchInput = document.getElementById('mobile-search-input');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', handleSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });
        }

        if (mobileSearchInput) {
            mobileSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleMobileSearch();
                }
            });
        }

        // Category cards
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                if (category) {
                    showCategoryArticles(category);
                }
            });
        });

        // Category links in dropdown and footer
        const categoryLinks = document.querySelectorAll('[data-category]');
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = link.dataset.category;
                if (category) {
                    showCategoryArticles(category);
                }
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
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
        
        [logoutBtn, mobileLogoutBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (typeof logout === 'function') {
                        logout();
                    }
                });
            }
        });
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
        if (!toastContainer) return;
        
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

    // API Functions with better error handling
    async function appApiRequest(endpoint, options = {}) {
        if (!apiAvailable) {
            throw new Error('خدمة API غير متاحة حالياً');
        }

        const token = localStorage.getItem('token');
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            timeout: 10000, // 10 second timeout
            ...options
        };
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        try {
            console.log(`Making API request to: ${API_BASE_URL}${endpoint}`);
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            
            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            
            // If it's a network error, mark API as unavailable
            if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
                apiAvailable = false;
            }
            
            throw error;
        }
    }

    // Article Functions
    async function loadFeaturedArticles() {
        try {
            showAppLoading();
            const data = await appApiRequest('/articles?featured=true&limit=6');
            
            if (data.articles && data.articles.length > 0) {
                displayArticles(data.articles, 'featured-articles-grid');
            } else {
                displayNoArticles('featured-articles-grid', 'لا توجد مقالات مميزة حالياً');
            }
        } catch (error) {
            console.error('Error loading featured articles:', error);
            displayNoArticles('featured-articles-grid', 'تعذر تحميل المقالات المميزة');
            showAppToast('خطأ في تحميل المقالات المميزة', 'error');
        } finally {
            hideAppLoading();
        }
    }

    async function loadRecentArticles() {
        try {
            const data = await appApiRequest(`/articles?page=${appCurrentPage}&limit=9`);
            
            if (data.articles && data.articles.length > 0) {
                displayArticles(data.articles, 'recent-articles-grid');
                
                // Hide load more button if no more articles
                const loadMoreBtn = document.getElementById('load-more-articles');
                if (loadMoreBtn && data.pagination && appCurrentPage >= data.pagination.pages) {
                    loadMoreBtn.style.display = 'none';
                }
            } else {
                displayNoArticles('recent-articles-grid', 'لا توجد مقالات حديثة');
            }
        } catch (error) {
            console.error('Error loading recent articles:', error);
            displayNoArticles('recent-articles-grid', 'تعذر تحميل المقالات الحديثة');
            showAppToast('خطأ في تحميل المقالات الحديثة', 'error');
        }
    }

    async function loadMoreArticles() {
        if (appIsLoading || !apiAvailable) return;
        
        appCurrentPage++;
        await loadRecentArticles();
    }

    async function showCategoryArticles(category) {
        if (!apiAvailable) {
            showAppToast('عذراً، البحث غير متاح حالياً', 'warning');
            return;
        }

        try {
            showAppLoading();
            const data = await appApiRequest(`/articles/category/${encodeURIComponent(category)}`);
            
            // Clear existing articles
            const container = document.getElementById('recent-articles-grid');
            if (container) {
                container.innerHTML = '';
            }
            
            if (data.articles && data.articles.length > 0) {
                displayArticles(data.articles, 'recent-articles-grid');
            } else {
                displayNoArticles('recent-articles-grid', `لا توجد مقالات في قسم ${category}`);
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
        if (!container || !articles) return;
        
        if (containerId === 'recent-articles-grid' && appCurrentPage === 1) {
            container.innerHTML = '';
        }
        
        articles.forEach(article => {
            const articleCard = createArticleCard(article);
            container.appendChild(articleCard);
        });
    }

    function displayNoArticles(containerId, message) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-newspaper" style="font-size: 3rem; color: var(--light-text); margin-bottom: 1rem;"></i>
                <h3>${message}</h3>
                <p>تحقق من الاتصال بالإنترنت أو حاول لاحقاً</p>
            </div>
        `;
    }

    function createArticleCard(article) {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.onclick = () => openArticle(article._id);
        
        // Use dynamic server URL for images
        const imageUrl = article.images && article.images.length > 0 
            ? `${SERVER_BASE_URL}/uploads/articles/${article.images[0]}`
            : 'https://via.placeholder.com/400x200/d4a574/ffffff?text=ماما+الجزائرية';
        
        const authorAvatar = article.author && article.author.avatar 
            ? `${SERVER_BASE_URL}/uploads/avatars/${article.author.avatar}`
            : 'https://via.placeholder.com/25x25/d4a574/ffffff?text=' + (article.author?.name?.charAt(0) || 'م');
        
        const authorName = article.author?.name || 'مجهول';
        const views = article.views || 0;
        const likes = article.likes ? article.likes.length : 0;
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${escapeHtml(article.title)}" class="article-image" onerror="this.src='https://via.placeholder.com/400x200/d4a574/ffffff?text=ماما+الجزائرية'">
            <div class="article-content">
                <span class="article-category">${escapeHtml(article.category || 'عام')}</span>
                <h3 class="article-title">${escapeHtml(article.title)}</h3>
                <p class="article-excerpt">${escapeHtml(article.excerpt || article.content?.substring(0, 100) || '')}</p>
                <div class="article-meta">
                    <div class="article-author">
                        <img src="${authorAvatar}" alt="${authorName}" class="author-avatar" onerror="this.src='https://via.placeholder.com/25x25/d4a574/ffffff?text=${authorName.charAt(0) || 'م'}'">
                        <span>${authorName}</span>
                    </div>
                    <div class="article-stats">
                        <span><i class="fas fa-eye"></i> ${formatNumber(views)}</span>
                        <span><i class="fas fa-heart"></i> ${formatNumber(likes)}</span>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }

    // Ad Posts Functions
    async function loadAdPosts() {
        if (!apiAvailable) return;
        
        try {
            const data = await appApiRequest('/posts?type=ad&limit=4');
            
            if (data.posts && data.posts.length > 0) {
                displayAdPosts(data.posts);
            } else {
                // Hide ad section if no ads
                const adSection = document.getElementById('ad-posts-section');
                if (adSection) {
                    adSection.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error loading ad posts:', error);
            // Don't show error for ads as they're not critical
            const adSection = document.getElementById('ad-posts-section');
            if (adSection) {
                adSection.style.display = 'none';
            }
        }
    }

    function displayAdPosts(posts) {
        const container = document.getElementById('ads-grid');
        if (!container || posts.length === 0) {
            // Hide ad section if no ads
            const adSection = document.getElementById('ad-posts-section');
            if (adSection) {
                adSection.style.display = 'none';
            }
            return;
        }
        
        container.innerHTML = '';
        
        posts.forEach(post => {
            const adCard = createAdCard(post);
            container.appendChild(adCard);
        });
    }

    function createAdCard(post) {
        const card = document.createElement('div');
        card.className = 'ad-card';
        
        // Use dynamic server URL for images
        const imageUrl = post.images && post.images.length > 0 
            ? `${SERVER_BASE_URL}/uploads/posts/${post.images[0]}`
            : 'https://via.placeholder.com/400x200/d4a574/ffffff?text=إعلان';
        
        const adDetails = post.adDetails || {};
        const clickAction = adDetails.link 
            ? `onclick="window.open('${escapeHtml(adDetails.link)}', '_blank')"` 
            : `onclick="openPost('${post._id}')"`;
        
        card.innerHTML = `
            <div ${clickAction} style="cursor: pointer;">
                <img src="${imageUrl}" alt="${escapeHtml(post.title)}" class="article-image" onerror="this.src='https://via.placeholder.com/400x200/d4a574/ffffff?text=إعلان'">
                <div class="article-content">
                    <h3 class="article-title">${escapeHtml(post.title)}</h3>
                    <p class="article-excerpt">${escapeHtml(post.content?.substring(0, 100) || '')}...</p>
                    <div class="article-meta">
                        <span class="btn btn-primary">${escapeHtml(adDetails.buttonText || 'اقرأ المزيد')}</span>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }

    // Search Functions
    async function handleSearch() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput?.value?.trim();
        
        if (!query) {
            showAppToast('يرجى إدخال كلمة البحث', 'warning');
            return;
        }

        await performSearch(query);
    }

    async function handleMobileSearch() {
        const searchInput = document.getElementById('mobile-search-input');
        const query = searchInput?.value?.trim();
        
        if (!query) {
            showAppToast('يرجى إدخال كلمة البحث', 'warning');
            return;
        }

        await performSearch(query);
        
        // Close mobile menu
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.remove('active');
        }
    }

    async function performSearch(query) {
        if (!apiAvailable) {
            showAppToast('عذراً، البحث غير متاح حالياً', 'warning');
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
            }
            
            // Update section title
            const sectionTitle = document.querySelector('.recent-articles .section-title');
            if (sectionTitle) {
                sectionTitle.textContent = `نتائج البحث عن: ${query}`;
            }
            
            // Scroll to results
            const resultsSection = document.querySelector('.recent-articles');
            if (resultsSection) {
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Hide load more button for search results
            const loadMoreBtn = document.getElementById('load-more-articles');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
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
        if (articleId) {
            window.location.href = `pages/article.html?id=${articleId}`;
        }
    }

    function openPost(postId) {
        if (postId) {
            window.location.href = `pages/community.html?post=${postId}`;
        }
    }

    // Utility Functions
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                calendar: 'islamic'
            };
            return date.toLocaleDateString('ar-DZ', options);
        } catch (error) {
            return dateString;
        }
    }

    function formatNumber(num) {
        if (typeof num !== 'number') return '0';
        
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

    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        e.preventDefault(); // Prevent the default browser error message
    });

    // Export functions for use in other files
    window.apiRequest = appApiRequest;
    window.showToast = showAppToast;
    window.showLoading = showAppLoading;
    window.hideLoading = hideAppLoading;
    window.SERVER_BASE_URL = SERVER_BASE_URL;
    window.API_AVAILABLE = () => apiAvailable;

})();
