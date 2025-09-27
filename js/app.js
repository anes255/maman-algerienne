// App Configuration - FIXED VERSION with Correct Backend URL
(function() {
    'use strict';
    
    // Get base server URL (without /api) - FIXED
    function getServerBaseUrl() {
        // Check if we're in production (deployed)
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            // FIXED: Use correct backend URL
            return 'https://mamanalgerienne-backend.onrender.com';
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
    
    console.log('🚀 Initializing Maman Algerienne App...');
    console.log('API URL:', API_BASE_URL);
    
    // App-specific variables (isolated from global scope)
    let appCurrentPage = 1;
    let appIsLoading = false;

    // DOM Elements
    const loadingSpinner = document.getElementById('loading-spinner');
    const toastContainer = document.getElementById('toast-container');

    // Initialize App
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM loaded, initializing app...');
        
        // Only initialize if we're on the main page (not store page)
        if (!window.location.pathname.includes('store.html')) {
            initializeApp();
        }
    });

    async function initializeApp() {
        try {
            console.log('🔍 Checking API availability...');
            
            // Test API connectivity first
            const isApiAvailable = await testApiConnectivity();
            if (isApiAvailable) {
                console.log('✅ API is available:', isApiAvailable);
            } else {
                console.log('⚠️ API not available, continuing with limited functionality');
            }
            
            setupEventListeners();
            await loadInitialContent();
            
            // Check if user is logged in
            if (typeof checkAuthStatus === 'function') {
                checkAuthStatus();
            }
            
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing app:', error);
            showAppToast('خطأ في تحميل التطبيق', 'error');
        }
    }

    // Test API connectivity
    async function testApiConnectivity() {
        try {
            const response = await fetch(`${SERVER_BASE_URL}/health`, {
                method: 'GET',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API connectivity test passed:', data);
                return data;
            } else {
                console.log('❌ API test failed with status:', response.status);
                return false;
            }
        } catch (error) {
            console.log('❌ API connectivity test failed:', error.message);
            return false;
        }
    }

    // Load initial content
    async function loadInitialContent() {
        try {
            await Promise.all([
                loadFeaturedArticles(),
                loadRecentArticles(),
                loadSponsorAds()
            ]);
        } catch (error) {
            console.error('Error loading initial content:', error);
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

    // Enhanced API Functions
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
            console.log(`🌐 API Request: ${API_BASE_URL}${endpoint}`);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            
            if (!response.ok) {
                // Try to get error message from response
                const errorText = await response.text();
                let errorMessage = 'حدث خطأ في الخادم';
                
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // If response is not JSON, check for common HTTP errors
                    if (response.status === 404) {
                        errorMessage = 'المسار غير موجود';
                    } else if (response.status === 500) {
                        errorMessage = 'خطأ في الخادم';
                    }
                }
                
                console.log(`API request failed for ${endpoint}: Error: HTTP ${response.status}: ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
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
            
            if (data.articles && data.articles.length > 0) {
                displayArticles(data.articles, 'featured-articles-grid');
            } else {
                console.log('No featured articles found');
            }
        } catch (error) {
            console.error('Error loading featured articles:', error);
            // Don't show error for featured articles as they're not critical
            hideEmptySection('featured-articles-section');
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
                console.log('No recent articles found');
                hideEmptySection('recent-articles-section');
            }
        } catch (error) {
            console.error('Error loading recent articles:', error);
            hideEmptySection('recent-articles-section');
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
                
                if (data.articles && data.articles.length > 0) {
                    displayArticles(data.articles, 'recent-articles-grid');
                } else {
                    container.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                            <i class="fas fa-folder-open" style="font-size: 3rem; color: var(--light-text); margin-bottom: 1rem;"></i>
                            <h3>لا توجد مقالات في هذا القسم</h3>
                            <p>ستتم إضافة المحتوى قريباً</p>
                        </div>
                    `;
                }
                
                // Update section title
                const sectionTitle = document.querySelector('.recent-articles .section-title');
                if (sectionTitle) {
                    sectionTitle.textContent = `مقالات ${category}`;
                }
                
                // Scroll to articles section
                document.querySelector('.recent-articles')?.scrollIntoView({ behavior: 'smooth' });
                
                // Hide load more button for category view
                const loadMoreBtn = document.getElementById('load-more-articles');
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'none';
                }
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
        if (!container) {
            console.log(`Container ${containerId} not found`);
            return;
        }
        
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
            ? `${SERVER_BASE_URL}/uploads/articles/${article.images[0]}`
            : 'https://via.placeholder.com/400x200/d4a574/ffffff?text=ماما+الجزائرية';
        
        const authorAvatar = article.author?.avatar 
            ? `${SERVER_BASE_URL}/uploads/avatars/${article.author.avatar}`
            : `https://via.placeholder.com/25x25/d4a574/ffffff?text=${(article.author?.name?.charAt(0) || 'م')}`;
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${article.title}" class="article-image" onerror="this.src='https://via.placeholder.com/400x200/d4a574/ffffff?text=ماما+الجزائرية'">
            <div class="article-content">
                <span class="article-category">${article.category || 'عام'}</span>
                <h3 class="article-title">${article.title}</h3>
                <p class="article-excerpt">${article.excerpt || article.content?.substring(0, 100) + '...' || ''}</p>
                <div class="article-meta">
                    <div class="article-author">
                        <img src="${authorAvatar}" alt="${article.author?.name || 'مجهول'}" class="author-avatar" onerror="this.src='https://via.placeholder.com/25x25/d4a574/ffffff?text=${(article.author?.name?.charAt(0) || 'م')}'">
                        <span>${article.author?.name || 'مجهول'}</span>
                    </div>
                    <div class="article-stats">
                        <span><i class="fas fa-eye"></i> ${article.views || 0}</span>
                        <span><i class="fas fa-heart"></i> ${article.likes?.length || 0}</span>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }

    // Sponsor Ads Functions
    async function loadSponsorAds() {
        try {
            console.log('🔗 Loading sponsor ads from:', `${API_BASE_URL}/posts?type=ad&limit=6`);
            const response = await fetch(`${API_BASE_URL}/posts?type=ad&limit=6`);
            
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
            
            const data = await response.json();
            console.log('📋 Sponsor ads data:', data);
            
            if (data.posts && data.posts.length > 0) {
                displaySponsorAds(data.posts);
            } else {
                console.log('No sponsor ads found');
                hideEmptySection('sponsor-ads-section');
            }
        } catch (error) {
            console.error('🚨 Error loading sponsor ads:', error);
            hideEmptySection('sponsor-ads-section');
        }
    }

    function displaySponsorAds(posts) {
        const container = document.getElementById('sponsor-ads-grid');
        if (!container) {
            console.log('Sponsor ads container not found');
            return;
        }
        
        container.innerHTML = '';
        
        posts.forEach(post => {
            const adCard = createSponsorAdCard(post);
            container.appendChild(adCard);
        });
    }

    function createSponsorAdCard(post) {
        const card = document.createElement('div');
        card.className = 'sponsor-ad-card';
        
        // Use dynamic server URL for images
        const imageUrl = post.images && post.images.length > 0 
            ? `${SERVER_BASE_URL}/uploads/posts/${post.images[0]}`
            : 'https://via.placeholder.com/400x200/d4a574/ffffff?text=إعلان';
        
        const clickAction = post.adDetails?.link 
            ? `onclick="window.open('${post.adDetails.link}', '_blank')"` 
            : `onclick="openPost('${post._id}')"`;
        
        card.innerHTML = `
            <div ${clickAction} style="cursor: pointer;">
                <img src="${imageUrl}" alt="${post.title}" class="article-image" onerror="this.src='https://via.placeholder.com/400x200/d4a574/ffffff?text=إعلان'">
                <div class="article-content">
                    <h3 class="article-title">${post.title}</h3>
                    <p class="article-excerpt">${post.content?.substring(0, 100) || ''}...</p>
                    <div class="article-meta">
                        <span class="btn btn-primary">${post.adDetails?.buttonText || 'اقرأ المزيد'}</span>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }

    // Hide empty sections
    function hideEmptySection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'none';
        }
    }

    // Search Function
    async function handleSearch() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;
        
        const query = searchInput.value.trim();
        
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
                
                if (data.articles && data.articles.length === 0) {
                    container.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                            <i class="fas fa-search" style="font-size: 3rem; color: var(--light-text); margin-bottom: 1rem;"></i>
                            <h3>لا توجد نتائج للبحث</h3>
                            <p>جرب استخدام كلمات مختلفة</p>
                        </div>
                    `;
                } else if (data.articles) {
                    displayArticles(data.articles, 'recent-articles-grid');
                }
                
                // Update section title
                const sectionTitle = document.querySelector('.recent-articles .section-title');
                if (sectionTitle) {
                    sectionTitle.textContent = `نتائج البحث عن: ${query}`;
                }
                
                // Scroll to results
                document.querySelector('.recent-articles')?.scrollIntoView({ behavior: 'smooth' });
                
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
            day: 'numeric'
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
    window.SERVER_BASE_URL = SERVER_BASE_URL; // Export for use in other files

})();
