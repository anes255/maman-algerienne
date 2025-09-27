// App Configuration - Using centralized config
(function() {
    'use strict';
    
    // Wait for config to load, then initialize
    document.addEventListener('DOMContentLoaded', function() {
        // Ensure config is loaded
        if (!window.APP_CONFIG) {
            console.error('APP_CONFIG not loaded! Make sure config.js is included before app.js');
            return;
        }
        
        console.log('App initialized with config:', window.APP_CONFIG);
        
        // Only initialize if we're on the main page (not store page)
        if (!window.location.pathname.includes('store.html')) {
            initializeApp();
        }
    });

    // App-specific variables (isolated from global scope)
    let appCurrentPage = 1;
    let appIsLoading = false;

    // DOM Elements
    const loadingSpinner = document.getElementById('loading-spinner');
    const toastContainer = document.getElementById('toast-container');

    function initializeApp() {
        console.log('Initializing app...');
        setupEventListeners();
        loadFeaturedArticles();
        loadRecentArticles();
        loadAdPosts();
        
        // Check if user is logged in
        if (typeof checkAuthStatus === 'function') {
            checkAuthStatus();
        }
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
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = getToastIcon(type);
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        if (toastContainer) {
            toastContainer.appendChild(toast);
            
            // Remove toast after 5 seconds
            setTimeout(() => {
                toast.remove();
            }, 5000);
        } else {
            console.log(`Toast: ${message}`);
        }
    }

    function getToastIcon(type) {
        switch (type) {
            case 'success': return 'fas fa-check-circle';
            case 'error': return 'fas fa-exclamation-circle';
            case 'warning': return 'fas fa-exclamation-triangle';
            default: return 'fas fa-info-circle';
        }
    }

    // API Functions
    async function appApiRequest(endpoint, options = {}) {
        // Ensure config is available
        if (!window.APP_CONFIG) {
            throw new Error('Configuration not loaded');
        }

        const token = localStorage.getItem('token');
        const url = `${window.APP_CONFIG.API_BASE_URL}${endpoint}`;
        
        console.log('Making API request to:', url);
        
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
            const response = await fetch(url, config);
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers.get('content-type'));
            
            if (!response.ok) {
                throw new Error(`الخادم غير متاح حالياً (${response.status})`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Article Functions
    async function loadFeaturedArticles() {
        try {
            showAppLoading();
            const data = await appApiRequest('/articles?featured=true&limit=6');
            displayArticles(data.articles, 'featured-articles-grid');
        } catch (error) {
            console.error('Error loading featured articles:', error);
            showAppToast('خطأ في تحميل المقالات المميزة', 'error');
        } finally {
            hideAppLoading();
        }
    }

    async function loadRecentArticles() {
        try {
            const data = await appApiRequest(`/articles?page=${appCurrentPage}&limit=9`);
            displayArticles(data.articles, 'recent-articles-grid');
            
            // Hide load more button if no more articles
            const loadMoreBtn = document.getElementById('load-more-articles');
            if (loadMoreBtn && data.pagination && appCurrentPage >= data.pagination.pages) {
                loadMoreBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading recent articles:', error);
            showAppToast('خطأ في تحميل المقالات الحديثة', 'error');
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
                displayArticles(data.articles, 'recent-articles-grid');
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

    function createArticleCard(article) {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.onclick = () => openArticle(article._id);
        
        // Use dynamic server URL for images
        const imageUrl = article.images && article.images.length > 0 
            ? `${window.APP_CONFIG.SERVER_BASE_URL}/uploads/articles/${article.images[0]}`
            : 'https://via.placeholder.com/400x200/d4a574/ffffff?text=ماما+الجزائرية';
        
        const authorAvatar = article.author && article.author.avatar 
            ? `${window.APP_CONFIG.SERVER_BASE_URL}/uploads/avatars/${article.author.avatar}`
            : 'https://via.placeholder.com/25x25/d4a574/ffffff?text=' + (article.author?.name?.charAt(0) || 'م');
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${article.title}" class="article-image" onerror="this.src='https://via.placeholder.com/400x200/d4a574/ffffff?text=ماما+الجزائرية'">
            <div class="article-content">
                <span class="article-category">${article.category}</span>
                <h3 class="article-title">${article.title}</h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-meta">
                    <div class="article-author">
                        <img src="${authorAvatar}" alt="${article.author?.name || 'مؤلف'}" class="author-avatar" onerror="this.src='https://via.placeholder.com/25x25/d4a574/ffffff?text=${article.author?.name?.charAt(0) || 'م'}'">
                        <span>${article.author?.name || 'مؤلف'}</span>
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

    // Ad Posts Functions
    async function loadAdPosts() {
        try {
            const data = await appApiRequest('/posts?type=ad&limit=4');
            displayAdPosts(data.posts);
        } catch (error) {
            console.error('Error loading ad posts:', error);
            // Don't show error for ads as they're not critical
        }
    }

    function displayAdPosts(posts) {
        const container = document.getElementById('ads-grid');
        if (!container || !posts || posts.length === 0) {
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
            ? `${window.APP_CONFIG.SERVER_BASE_URL}/uploads/posts/${post.images[0]}`
            : 'https://via.placeholder.com/400x200/d4a574/ffffff?text=إعلان';
        
        const clickAction = post.adDetails?.link 
            ? `onclick="window.open('${post.adDetails.link}', '_blank')"` 
            : `onclick="openPost('${post._id}')"`;
        
        card.innerHTML = `
            <div ${clickAction} style="cursor: pointer;">
                <img src="${imageUrl}" alt="${post.title}" class="article-image" onerror="this.src='https://via.placeholder.com/400x200/d4a574/ffffff?text=إعلان'">
                <div class="article-content">
                    <h3 class="article-title">${post.title}</h3>
                    <p class="article-excerpt">${post.content.substring(0, 100)}...</p>
                    <div class="article-meta">
                        <span class="btn btn-primary">${post.adDetails?.buttonText || 'اقرأ المزيد'}</span>
                    </div>
                </div>
            </div>
        `;
        
        return card;
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

    // Error Handling
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        showAppToast('حدث خطأ غير متوقع', 'error');
    });

    // Export functions for use in other files (only the ones that need to be global)
    window.apiRequest = appApiRequest;
    window.showToast = showAppToast;
    window.showLoading = showAppLoading;
    window.hideLoading = hideAppLoading;

})();
