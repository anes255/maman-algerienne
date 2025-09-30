// ============================================================================
// APP.JS - Main Application Logic (Index & Article Pages)
// Fully functional with error handling and mobile support
// ============================================================================

(function() {
    'use strict';
    
    // ==================== CONFIGURATION ====================
    
    function getServerBaseUrl() {
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return 'https://maman-algerienne.onrender.com';
        }
        return 'http://localhost:5000';
    }

    function getApiBaseUrl() {
        return getServerBaseUrl() + '/api';
    }

    const SERVER_BASE_URL = getServerBaseUrl();
    const API_BASE_URL = getApiBaseUrl();
    
    // ==================== STATE ====================
    
    let currentPage = 1;
    let isLoading = false;
    
    // ==================== INITIALIZATION ====================
    
    document.addEventListener('DOMContentLoaded', function() {
        const pathname = window.location.pathname.toLowerCase();
        
        // Skip initialization on admin and store pages
        if (pathname.includes('admin.html') || pathname.includes('store.html')) {
            console.log('App.js: Skipping initialization on', pathname);
            return;
        }
        
        console.log('App.js: Initializing...');
        initializeApp();
    });

    function initializeApp() {
        setupEventListeners();
        loadContent();
        
        if (typeof checkAuthStatus === 'function') {
            checkAuthStatus();
        }
    }

    function loadContent() {
        loadFeaturedArticles();
        loadRecentArticles();
        loadAdPosts();
    }
    
    // ==================== EVENT LISTENERS ====================
    
    function setupEventListeners() {
        // Mobile menu
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
        }

        // Search
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        if (searchBtn) searchBtn.addEventListener('click', handleSearch);
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSearch();
            });
        }

        // Category cards
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                if (category) showCategoryArticles(category);
            });
        });

        // Category links
        document.querySelectorAll('[data-category]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = link.dataset.category;
                if (category) showCategoryArticles(category);
            });
        });

        // Load more button
        const loadMoreBtn = document.getElementById('load-more-articles');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', loadMoreArticles);
        }

        // User dropdown
        const userAvatar = document.getElementById('user-avatar');
        const userDropdown = document.getElementById('user-dropdown');
        if (userAvatar && userDropdown) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
            });
            document.addEventListener('click', () => userDropdown.style.display = 'none');
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof logout === 'function') logout();
            });
        }
    }
    
    // ==================== API FUNCTIONS ====================
    
    async function apiRequest(endpoint, options = {}) {
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
            const contentType = response.headers.get('content-type');
            
            if (!response.ok) {
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Server error');
                }
                
                if (response.status === 404) {
                    return { articles: [], posts: [], products: [], pagination: { total: 0 } };
                }
                
                throw new Error(`Server error (${response.status})`);
            }
            
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return { articles: [], posts: [], products: [], pagination: { total: 0 } };
            
        } catch (error) {
            console.error('API Error:', error);
            
            if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
                return { articles: [], posts: [], products: [], pagination: { total: 0 } };
            }
            
            throw error;
        }
    }
    
    // ==================== ARTICLE FUNCTIONS ====================
    
    async function loadFeaturedArticles() {
        try {
            showLoading();
            const data = await apiRequest('/articles?featured=true&limit=6');
            
            if (data.articles && data.articles.length > 0) {
                displayArticles(data.articles, 'featured-articles-grid');
            } else {
                const section = document.querySelector('.featured-articles');
                if (section) section.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading featured articles:', error);
        } finally {
            hideLoading();
        }
    }

    async function loadRecentArticles() {
        try {
            const data = await apiRequest(`/articles?page=${currentPage}&limit=9`);
            
            if (data.articles && data.articles.length > 0) {
                displayArticles(data.articles, 'recent-articles-grid');
                
                const loadMoreBtn = document.getElementById('load-more-articles');
                if (loadMoreBtn && data.pagination && currentPage >= data.pagination.pages) {
                    loadMoreBtn.style.display = 'none';
                }
            } else if (currentPage === 1) {
                const container = document.getElementById('recent-articles-grid');
                if (container) {
                    container.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                            <i class="fas fa-newspaper" style="font-size: 3rem; color: var(--light-text); margin-bottom: 1rem;"></i>
                            <h3>لا توجد مقالات بعد</h3>
                            <p>سيتم إضافة المقالات قريباً</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error loading recent articles:', error);
        }
    }

    async function loadMoreArticles() {
        if (isLoading) return;
        currentPage++;
        await loadRecentArticles();
    }

    async function showCategoryArticles(category) {
        try {
            showLoading();
            const data = await apiRequest(`/articles/category/${encodeURIComponent(category)}`);
            
            const container = document.getElementById('recent-articles-grid');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (data.articles && data.articles.length > 0) {
                displayArticles(data.articles, 'recent-articles-grid');
            } else {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                        <i class="fas fa-folder-open" style="font-size: 3rem; color: var(--light-text); margin-bottom: 1rem;"></i>
                        <h3>لا توجد مقالات في ${category}</h3>
                        <p>سيتم إضافة مقالات قريباً</p>
                    </div>
                `;
            }
            
            const sectionTitle = document.querySelector('.recent-articles .section-title');
            if (sectionTitle) sectionTitle.textContent = `مقالات ${category}`;
            
            const articlesSection = document.querySelector('.recent-articles');
            if (articlesSection) articlesSection.scrollIntoView({ behavior: 'smooth' });
            
            const loadMoreBtn = document.getElementById('load-more-articles');
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            
        } catch (error) {
            console.error('Error loading category articles:', error);
            showToast(`خطأ في تحميل مقالات ${category}`, 'error');
        } finally {
            hideLoading();
        }
    }

    function displayArticles(articles, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !articles) return;
        
        if (containerId === 'recent-articles-grid' && currentPage === 1) {
            container.innerHTML = '';
        }
        
        articles.forEach(article => {
            const card = createArticleCard(article);
            container.appendChild(card);
        });
    }

    function createArticleCard(article) {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.style.cursor = 'pointer';
        card.onclick = () => window.location.href = `pages/article.html?id=${article._id}`;
        
        const imageUrl = article.images && article.images.length > 0 
            ? `${SERVER_BASE_URL}/uploads/articles/${article.images[0]}`
            : 'https://via.placeholder.com/400x200/d4a574/ffffff?text=ماما+الجزائرية';
        
        const authorName = (article.author && article.author.name) || 'مجهول';
        const authorAvatar = article.author && article.author.avatar 
            ? `${SERVER_BASE_URL}/uploads/avatars/${article.author.avatar}`
            : 'https://via.placeholder.com/25x25/d4a574/ffffff?text=' + authorName.charAt(0);
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${article.title}" class="article-image" 
                 onerror="this.src='https://via.placeholder.com/400x200/d4a574/ffffff?text=ماما+الجزائرية'">
            <div class="article-content">
                <span class="article-category">${article.category}</span>
                <h3 class="article-title">${escapeHtml(article.title)}</h3>
                <p class="article-excerpt">${escapeHtml(article.excerpt)}</p>
                <div class="article-meta">
                    <div class="article-author">
                        <img src="${authorAvatar}" alt="${authorName}" class="author-avatar" 
                             onerror="this.src='https://via.placeholder.com/25x25/d4a574/ffffff?text=${authorName.charAt(0)}'">
                        <span>${escapeHtml(authorName)}</span>
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
    
    // ==================== AD POSTS ====================
    
    async function loadAdPosts() {
        try {
            const data = await apiRequest('/posts?type=ad&limit=4');
            
            if (data.posts && data.posts.length > 0) {
                displayAdPosts(data.posts);
            } else {
                const adSection = document.getElementById('ad-posts-section');
                if (adSection) adSection.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading ad posts:', error);
            const adSection = document.getElementById('ad-posts-section');
            if (adSection) adSection.style.display = 'none';
        }
    }

    function displayAdPosts(posts) {
        const container = document.getElementById('ads-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        posts.forEach(post => {
            const card = createAdCard(post);
            container.appendChild(card);
        });
    }

    function createAdCard(post) {
        const card = document.createElement('div');
        card.className = 'ad-card';
        card.style.cursor = 'pointer';
        
        const imageUrl = post.images && post.images.length > 0 
            ? `${SERVER_BASE_URL}/uploads/posts/${post.images[0]}`
            : 'https://via.placeholder.com/400x200/d4a574/ffffff?text=إعلان';
        
        const buttonText = (post.adDetails && post.adDetails.buttonText) || 'اقرأ المزيد';
        
        if (post.adDetails && post.adDetails.link) {
            card.onclick = () => window.open(post.adDetails.link, '_blank');
        } else {
            card.onclick = () => window.location.href = `pages/community.html?post=${post._id}`;
        }
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${post.title}" class="article-image" 
                 onerror="this.src='https://via.placeholder.com/400x200/d4a574/ffffff?text=إعلان'">
            <div class="article-content">
                <h3 class="article-title">${escapeHtml(post.title)}</h3>
                <p class="article-excerpt">${escapeHtml(post.content.substring(0, 100))}...</p>
                <div class="article-meta">
                    <span class="btn btn-primary">${buttonText}</span>
                </div>
            </div>
        `;
        
        return card;
    }
    
    // ==================== SEARCH ====================
    
    async function handleSearch() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;
        
        const query = searchInput.value.trim();
        
        if (!query) {
            showToast('يرجى إدخال كلمة البحث', 'warning');
            return;
        }
        
        try {
            showLoading();
            const data = await apiRequest(`/articles?search=${encodeURIComponent(query)}`);
            
            const container = document.getElementById('recent-articles-grid');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (data.articles && data.articles.length > 0) {
                displayArticles(data.articles, 'recent-articles-grid');
            } else {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                        <i class="fas fa-search" style="font-size: 3rem; color: var(--light-text); margin-bottom: 1rem;"></i>
                        <h3>لا توجد نتائج للبحث</h3>
                        <p>جرب استخدام كلمات مختلفة</p>
                    </div>
                `;
            }
            
            const sectionTitle = document.querySelector('.recent-articles .section-title');
            if (sectionTitle) sectionTitle.textContent = `نتائج البحث عن: ${query}`;
            
            const articlesSection = document.querySelector('.recent-articles');
            if (articlesSection) articlesSection.scrollIntoView({ behavior: 'smooth' });
            
            const loadMoreBtn = document.getElementById('load-more-articles');
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            
        } catch (error) {
            console.error('Search error:', error);
            showToast('خطأ في البحث', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // ==================== UI UTILITIES ====================
    
    function showLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) spinner.classList.add('show');
        isLoading = true;
    }

    function hideLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) spinner.classList.remove('show');
        isLoading = false;
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `<i class="${icons[type]}"></i><span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => toast.remove(), 5000);
    }

    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ==================== GLOBAL EXPORTS ====================
    
    window.apiRequest = apiRequest;
    window.showToast = showToast;
    window.showLoading = showLoading;
    window.hideLoading = hideLoading;
    window.SERVER_BASE_URL = SERVER_BASE_URL;
    
    console.log('✅ App.js initialized successfully');
    console.log('🌐 Server:', SERVER_BASE_URL);
    
})();
