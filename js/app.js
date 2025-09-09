// App Configuration - Fixed to avoid variable conflicts
(function() {
    'use strict';
    
    const API_BASE_URL = 'http://localhost:5000/api';

    // App-specific variables (isolated from global scope)
    let appCurrentPage = 1;
    let appIsLoading = false;

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

    function initializeApp() {
        setupEventListeners();
        setupMobileMenu();
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

        // Mobile search functionality
        const mobileSearchInput = document.getElementById('mobile-search-input');
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
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof logout === 'function') {
                    logout();
                }
            });
        }
        
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof logout === 'function') {
                    logout();
                }
                closeMobileMenu();
            });
        }
    }

    function setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuClose = document.getElementById('mobile-menu-close');

        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', openMobileMenu);
        }

        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', closeMobileMenu);
        }

        // Close mobile menu when clicking outside content
        if (mobileMenu) {
            mobileMenu.addEventListener('click', (e) => {
                if (e.target === mobileMenu) {
                    closeMobileMenu();
                }
            });
        }

        // Close mobile menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('active')) {
                closeMobileMenu();
            }
        });

        // Handle mobile navigation links
        const mobileNavLinks = document.querySelectorAll('.mobile-menu-nav a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Close mobile menu when navigation link is clicked
                setTimeout(closeMobileMenu, 100);
            });
        });
    }

    function openMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
    }

    function closeMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
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
        
        toastContainer.appendChild(toast);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            toast.remove();
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

    // API Functions
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
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'حدث خطأ في الخادم');
            }
            
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
            if (loadMoreBtn && appCurrentPage >= data.pagination.pages) {
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
            container.innerHTML = '';
            
            displayArticles(data.articles, 'recent-articles-grid');
            
            // Update section title
            const sectionTitle = document.querySelector('.recent-articles .section-title');
            if (sectionTitle) {
                sectionTitle.textContent = `مقالات ${category}`;
            }
            
            // Scroll to articles section
            document.querySelector('.recent-articles').scrollIntoView({ behavior: 'smooth' });
            
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
        
        articles.forEach(article => {
            const articleCard = createArticleCard(article);
            container.appendChild(articleCard);
        });
    }

    function createArticleCard(article) {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.onclick = () => openArticle(article._id);
        
        const imageUrl = article.images && article.images.length > 0 
            ? `http://localhost:5000/uploads/articles/${article.images[0]}`
            : 'https://via.placeholder.com/400x200/d4a574/ffffff?text=مامان+الجزائرية';
        
        const authorAvatar = article.author.avatar 
            ? `http://localhost:5000/uploads/avatars/${article.author.avatar}`
            : 'https://via.placeholder.com/25x25/d4a574/ffffff?text=' + (article.author.name.charAt(0) || 'م');
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${article.title}" class="article-image" onerror="this.src='https://via.placeholder.com/400x200/d4a574/ffffff?text=مامان+الجزائرية'">
            <div class="article-content">
                <span class="article-category">${article.category}</span>
                <h3 class="article-title">${article.title}</h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-meta">
                    <div class="article-author">
                        <img src="${authorAvatar}" alt="${article.author.name}" class="author-avatar" onerror="this.src='https://via.placeholder.com/25x25/d4a574/ffffff?text=${article.author.name.charAt(0) || 'م'}'">
                        <span>${article.author.name}</span>
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
        
        const imageUrl = post.images && post.images.length > 0 
            ? `http://localhost:5000/uploads/posts/${post.images[0]}`
            : 'https://via.placeholder.com/400x200/d4a574/ffffff?text=إعلان';
        
        const clickAction = post.adDetails.link 
            ? `onclick="window.open('${post.adDetails.link}', '_blank')"` 
            : `onclick="openPost('${post._id}')"`;
        
        card.innerHTML = `
            <div ${clickAction} style="cursor: pointer;">
                <img src="${imageUrl}" alt="${post.title}" class="article-image" onerror="this.src='https://via.placeholder.com/400x200/d4a574/ffffff?text=إعلان'">
                <div class="article-content">
                    <h3 class="article-title">${post.title}</h3>
                    <p class="article-excerpt">${post.content.substring(0, 100)}...</p>
                    <div class="article-meta">
                        <span class="btn btn-primary">${post.adDetails.buttonText || 'اقرأ المزيد'}</span>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }

    // Search Functions
    async function handleSearch() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput.value.trim();
        
        if (!query) {
            showAppToast('يرجى إدخال كلمة البحث', 'warning');
            return;
        }
        
        await performSearch(query);
    }

    async function handleMobileSearch() {
        const mobileSearchInput = document.getElementById('mobile-search-input');
        const query = mobileSearchInput.value.trim();
        
        if (!query) {
            showAppToast('يرجى إدخال كلمة البحث', 'warning');
            return;
        }
        
        // Close mobile menu
        closeMobileMenu();
        
        // Copy search term to main search input for consistency
        const mainSearchInput = document.getElementById('search-input');
        if (mainSearchInput) {
            mainSearchInput.value = query;
        }
        
        await performSearch(query);
    }

    async function performSearch(query) {
        try {
            showAppLoading();
            const data = await appApiRequest(`/articles?search=${encodeURIComponent(query)}`);
            
            // Clear existing articles
            const container = document.getElementById('recent-articles-grid');
            container.innerHTML = '';
            
            if (data.articles.length === 0) {
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
            document.querySelector('.recent-articles').scrollIntoView({ behavior: 'smooth' });
            
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

    // Auth State Management for Mobile Menu
    function updateMobileAuthState(user) {
        const mobileAuthGuest = document.getElementById('mobile-auth-guest');
        const mobileAuthLogged = document.getElementById('mobile-auth-logged');
        const mobileUserName = document.getElementById('mobile-user-name');
        const mobileUserAvatar = document.getElementById('mobile-user-avatar');
        const mobileProfileLink = document.getElementById('mobile-profile-link');
        const mobileAdminLink = document.getElementById('mobile-admin-link');

        if (user) {
            // User is logged in
            if (mobileAuthGuest) mobileAuthGuest.style.display = 'none';
            if (mobileAuthLogged) mobileAuthLogged.classList.add('show');
            
            if (mobileUserName) mobileUserName.textContent = user.name;
            if (mobileUserAvatar) {
                mobileUserAvatar.src = user.avatar 
                    ? `http://localhost:5000/uploads/avatars/${user.avatar}`
                    : 'https://via.placeholder.com/40x40/d4a574/ffffff?text=' + (user.name.charAt(0) || 'م');
            }
            
            if (mobileProfileLink) {
                mobileProfileLink.href = `pages/profile.html?id=${user._id}`;
            }
            
            if (mobileAdminLink && user.role === 'admin') {
                mobileAdminLink.style.display = 'block';
            }
        } else {
            // User is not logged in
            if (mobileAuthGuest) mobileAuthGuest.style.display = 'flex';
            if (mobileAuthLogged) mobileAuthLogged.classList.remove('show');
            if (mobileAdminLink) mobileAdminLink.style.display = 'none';
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
    window.updateMobileAuthState = updateMobileAuthState;
    window.closeMobileMenu = closeMobileMenu;

})();
