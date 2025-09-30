// ==========================================
// MAMAN ALGERIENNE - COMPLETE APP.JS
// All fixes included
// ==========================================

(function() {
  'use strict';

  console.log('🚀 Initializing Maman Algerienne App...');

  // API Configuration
  const API_BASE_URL = 'https://mamanalgerienne-backend.onrender.com/api';
  
  // App State
  const app = {
    currentPage: 'home',
    currentUser: null,
    cart: [],
    articles: [],
    products: []
  };

  // ==========================================
  // INITIALIZATION
  // ==========================================
  
  function initializeApp() {
    console.log('📱 App initialization started...');
    
    try {
      // Load user from localStorage
      loadUserFromStorage();
      
      // Load cart from localStorage
      loadCartFromStorage();
      
      // Setup navigation
      setupNavigation();
      
      // Setup mobile menu
      setupMobileMenu();
      
      // Update UI
      updateAuthUI();
      updateCartUI();
      
      // Load initial page
      const hash = window.location.hash.slice(1) || 'home';
      showPage(hash);
      
      console.log('✅ App initialized successfully');
      
    } catch (error) {
      console.error('❌ App initialization error:', error);
      showToast('Erreur d\'initialisation', 'error');
    }
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  
  function loadUserFromStorage() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        app.currentUser = JSON.parse(userData);
        app.currentUser.token = token;
        console.log('👤 User loaded:', app.currentUser.email);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }

  function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (app.currentUser) {
      if (loginBtn) loginBtn.classList.add('hidden');
      if (userMenu) userMenu.classList.remove('hidden');
      if (userName) userName.textContent = app.currentUser.name || app.currentUser.email;
    } else {
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (userMenu) userMenu.classList.add('hidden');
    }
  }

  function logout() {
    app.currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI();
    showToast('Déconnexion réussie', 'success');
    showPage('home');
  }

  // ==========================================
  // CART MANAGEMENT
  // ==========================================
  
  function loadCartFromStorage() {
    const cartData = localStorage.getItem('cart');
    if (cartData) {
      try {
        app.cart = JSON.parse(cartData);
        console.log(`🛒 Cart loaded: ${app.cart.length} items`);
      } catch (error) {
        console.error('Error parsing cart:', error);
        app.cart = [];
      }
    }
  }

  function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(app.cart));
  }

  function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartCountMobile = document.getElementById('cartCountMobile');
    
    const count = app.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    if (cartCount) {
      cartCount.textContent = count;
      cartCount.classList.toggle('hidden', count === 0);
    }
    
    if (cartCountMobile) {
      cartCountMobile.textContent = count;
      cartCountMobile.classList.toggle('hidden', count === 0);
    }
  }

  function addToCart(product) {
    const existingItem = app.cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      app.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images ? product.images[0] : null,
        quantity: 1
      });
    }
    
    saveCartToStorage();
    updateCartUI();
    showToast(`${product.name} ajouté au panier`, 'success');
  }

  // ==========================================
  // NAVIGATION
  // ==========================================
  
  function setupNavigation() {
    // Handle hash changes
    window.addEventListener('hashchange', () => {
      const page = window.location.hash.slice(1) || 'home';
      showPage(page);
    });
    
    // Setup navigation links
    document.querySelectorAll('[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        window.location.hash = page;
      });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }
  }

  function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMobileMenu = document.getElementById('closeMobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.remove('hidden');
      });
    }
    
    if (closeMobileMenu && mobileMenu) {
      closeMobileMenu.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    }
    
    // Close menu when clicking outside
    if (mobileMenu) {
      mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) {
          mobileMenu.classList.add('hidden');
        }
      });
    }
  }

  // ==========================================
  // PAGE LOADING - FIXED
  // ==========================================
  
  async function showPage(pageName) {
    console.log('📄 Loading page:', pageName);
    
    app.currentPage = pageName;
    
    const contentArea = document.getElementById('content');
    if (!contentArea) {
      console.error('Content area not found');
      return;
    }
    
    // Close mobile menu if open
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
      mobileMenu.classList.add('hidden');
    }
    
    // Update active nav links
    document.querySelectorAll('[data-page]').forEach(link => {
      const linkPage = link.getAttribute('data-page');
      if (linkPage === pageName) {
        link.classList.add('active', 'text-pink-500');
      } else {
        link.classList.remove('active', 'text-pink-500');
      }
    });
    
    // Route to appropriate page
    switch(pageName) {
      case 'home':
        loadHomePage(contentArea);
        break;
        
      case 'hamli':
      case 'tefli':
      case 'biti':
      case 'cozinti':
      case 'medressati':
      case 'tahwissti':
      case 'sehti':
      case 'dini':
      case 'asmae':
        await loadCategoryPage(pageName, contentArea);
        break;
        
      case 'store':
        await loadStorePage(contentArea);
        break;
        
      case 'community':
        await loadCommunityPage(contentArea);
        break;
        
      case 'cart':
        loadCartPage(contentArea);
        break;
        
      case 'checkout':
        loadCheckoutPage(contentArea);
        break;
        
      case 'admin':
        loadAdminPage(contentArea);
        break;
        
      default:
        load404Page(contentArea);
    }
  }

  // ==========================================
  // HOME PAGE
  // ==========================================
  
  function loadHomePage(container) {
    container.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <section class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-pink-600 mb-4">
            مرحبا بك في مامان الجزائرية
          </h1>
          <p class="text-xl text-gray-600 mb-8">
            دليلك الشامل للأمومة والأسرة
          </p>
        </section>
        
        <section class="mb-12">
          <h2 class="text-2xl font-bold mb-6 text-center">المقالات المميزة</h2>
          <div id="featuredArticles" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center py-8">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
              <p class="mt-4 text-gray-600">Chargement...</p>
            </div>
          </div>
        </section>
        
        <section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          ${getCategoryCards()}
        </section>
      </div>
    `;
    
    loadFeaturedArticles();
  }

  function getCategoryCards() {
    const categories = [
      { id: 'hamli', name: 'حملي', icon: '🤰', color: 'pink' },
      { id: 'tefli', name: 'طفلي', icon: '👶', color: 'blue' },
      { id: 'biti', name: 'بيتي', icon: '🏠', color: 'purple' },
      { id: 'cozinti', name: 'كوزينتي', icon: '🍳', color: 'orange' },
      { id: 'medressati', name: 'مدرستي', icon: '📚', color: 'green' },
      { id: 'tahwissti', name: 'تحويستي', icon: '💄', color: 'red' },
      { id: 'sehti', name: 'صحتي', icon: '🏥', color: 'teal' },
      { id: 'dini', name: 'ديني', icon: '🕌', color: 'indigo' }
    ];
    
    return categories.map(cat => `
      <a href="#${cat.id}" class="bg-gradient-to-br from-${cat.color}-400 to-${cat.color}-600 text-white rounded-lg p-6 text-center hover:shadow-xl transition-all transform hover:scale-105">
        <div class="text-4xl mb-2">${cat.icon}</div>
        <div class="font-bold">${cat.name}</div>
      </a>
    `).join('');
  }

  async function loadFeaturedArticles() {
    try {
      const response = await fetch(`${API_BASE_URL}/articles?featured=true&limit=6`);
      
      if (!response.ok) {
        throw new Error('Failed to load articles');
      }
      
      const data = await response.json();
      const articles = data.articles || [];
      
      const container = document.getElementById('featuredArticles');
      if (!container) return;
      
      if (articles.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">Aucun article disponible</p>';
        return;
      }
      
      container.innerHTML = articles.map(article => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
          ${article.images && article.images.length > 0 ? `
            <img src="${article.images[0]}" alt="${article.title}" class="w-full h-48 object-cover">
          ` : `
            <div class="w-full h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
              <span class="text-6xl">📰</span>
            </div>
          `}
          <div class="p-4">
            <h3 class="font-bold text-lg mb-2 line-clamp-2">${article.title}</h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-3">${article.excerpt || ''}</p>
            <button onclick="window.app.viewArticle('${article._id}')" class="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 w-full">
              Lire l'article
            </button>
          </div>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Error loading featured articles:', error);
      const container = document.getElementById('featuredArticles');
      if (container) {
        container.innerHTML = '<p class="text-center text-red-500 py-8">Erreur de chargement</p>';
      }
    }
  }

  // ==========================================
  // CATEGORY PAGES - FIXED
  // ==========================================
  
  async function loadCategoryPage(category, container) {
    console.log('📚 Loading category:', category);
    
    container.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8 text-center">${getCategoryTitle(category)}</h1>
        <div id="categoryArticles">
          <div class="text-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p class="mt-4 text-gray-600">Chargement des articles...</p>
          </div>
        </div>
      </div>
    `;
    
    try {
      const response = await fetch(`${API_BASE_URL}/articles?category=${category}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to load articles');
      }
      
      const data = await response.json();
      const articles = data.articles || [];
      
      const articlesContainer = document.getElementById('categoryArticles');
      if (!articlesContainer) return;
      
      if (articles.length === 0) {
        articlesContainer.innerHTML = `
          <div class="text-center py-20">
            <p class="text-gray-500 text-xl">Aucun article trouvé dans cette catégorie</p>
          </div>
        `;
        return;
      }
      
      articlesContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${articles.map(article => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              ${article.images && article.images.length > 0 ? `
                <img src="${article.images[0]}" alt="${article.title}" class="w-full h-48 object-cover">
              ` : `
                <div class="w-full h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                  <span class="text-6xl">📰</span>
                </div>
              `}
              <div class="p-4">
                <h3 class="font-bold text-lg mb-2">${article.title}</h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">${article.excerpt || ''}</p>
                <button onclick="window.app.viewArticle('${article._id}')" class="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 w-full">
                  Lire l'article
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      
    } catch (error) {
      console.error('Error loading category:', error);
      const articlesContainer = document.getElementById('categoryArticles');
      if (articlesContainer) {
        articlesContainer.innerHTML = `
          <div class="text-center py-20">
            <p class="text-red-500 text-xl mb-4">Erreur lors du chargement des articles</p>
            <button onclick="window.location.reload()" class="bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600">
              Réessayer
            </button>
          </div>
        `;
      }
    }
  }

  function getCategoryTitle(category) {
    const titles = {
      'hamli': '🤰 حملي - Ma Grossesse',
      'tefli': '👶 طفلي - Mon Enfant',
      'biti': '🏠 بيتي - Ma Maison',
      'cozinti': '🍳 كوزينتي - Ma Cuisine',
      'medressati': '📚 مدرستي - Mon École',
      'tahwissti': '💄 تحويستي - Mes Accessoires',
      'sehti': '🏥 صحتي - Ma Santé',
      'dini': '🕌 ديني - Ma Religion',
      'asmae': '👶 الأسماء - Les Prénoms'
    };
    
    return titles[category] || category;
  }

  // ==========================================
  // STORE PAGE
  // ==========================================
  
  async function loadStorePage(container) {
    container.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8 text-center">🛍️ المتجر</h1>
        <div id="storeProducts">
          <div class="text-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p class="mt-4 text-gray-600">Chargement des produits...</p>
          </div>
        </div>
      </div>
    `;
    
    try {
      const response = await fetch(`${API_BASE_URL}/products?limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      
      const data = await response.json();
      const products = data.products || [];
      
      const productsContainer = document.getElementById('storeProducts');
      if (!productsContainer) return;
      
      if (products.length === 0) {
        productsContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Aucun produit disponible</p>';
        return;
      }
      
      productsContainer.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          ${products.map(product => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              ${product.images && product.images.length > 0 ? `
                <img src="${product.images[0]}" alt="${product.name}" class="w-full h-48 object-cover">
              ` : `
                <div class="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <span class="text-6xl">🛍️</span>
                </div>
              `}
              <div class="p-4">
                <h3 class="font-bold text-lg mb-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-2 line-clamp-2">${product.description || ''}</p>
                <p class="text-pink-600 font-bold text-xl mb-4">${product.price} DZD</p>
                <button onclick="window.app.addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})" class="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 w-full">
                  Ajouter au panier
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      
    } catch (error) {
      console.error('Error loading products:', error);
      const productsContainer = document.getElementById('storeProducts');
      if (productsContainer) {
        productsContainer.innerHTML = '<p class="text-center text-red-500 py-8">Erreur de chargement</p>';
      }
    }
  }

  // ==========================================
  // COMMUNITY PAGE
  // ==========================================
  
  async function loadCommunityPage(container) {
    container.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8 text-center">💬 المجتمع</h1>
        <p class="text-center text-gray-600 mb-8">Bientôt disponible...</p>
      </div>
    `;
  }

  // ==========================================
  // CART & CHECKOUT
  // ==========================================
  
  function loadCartPage(container) {
    if (app.cart.length === 0) {
      container.innerHTML = `
        <div class="container mx-auto px-4 py-20 text-center">
          <p class="text-gray-500 text-xl mb-8">Votre panier est vide</p>
          <a href="#store" class="bg-pink-500 text-white px-6 py-3 rounded hover:bg-pink-600">
            Continuer vos achats
          </a>
        </div>
      `;
      return;
    }
    
    const total = app.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    container.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8">Mon Panier</h1>
        <div class="grid md:grid-cols-3 gap-8">
          <div class="md:col-span-2">
            ${app.cart.map((item, index) => `
              <div class="bg-white rounded-lg shadow p-4 mb-4 flex gap-4">
                ${item.image ? `
                  <img src="${item.image}" alt="${item.name}" class="w-24 h-24 object-cover rounded">
                ` : `
                  <div class="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">🛍️</div>
                `}
                <div class="flex-1">
                  <h3 class="font-bold">${item.name}</h3>
                  <p class="text-pink-600 font-bold">${item.price} DZD</p>
                  <div class="flex items-center gap-2 mt-2">
                    <button onclick="window.app.updateCartQuantity(${index}, -1)" class="bg-gray-200 px-2 py-1 rounded">-</button>
                    <span class="px-4">${item.quantity}</span>
                    <button onclick="window.app.updateCartQuantity(${index}, 1)" class="bg-gray-200 px-2 py-1 rounded">+</button>
                    <button onclick="window.app.removeFromCart(${index})" class="ml-auto text-red-500">🗑️</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="bg-white rounded-lg shadow p-6 h-fit">
            <h2 class="font-bold text-xl mb-4">Résumé</h2>
            <div class="space-y-2 mb-4">
              <div class="flex justify-between">
                <span>Sous-total</span>
                <span>${total} DZD</span>
              </div>
            </div>
            <div class="border-t pt-4 mb-4">
              <div class="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total} DZD</span>
              </div>
            </div>
            <a href="#checkout" class="block bg-pink-500 text-white text-center px-6 py-3 rounded hover:bg-pink-600">
              Passer la commande
            </a>
          </div>
        </div>
      </div>
    `;
  }

  function updateCartQuantity(index, change) {
    if (app.cart[index]) {
      app.cart[index].quantity = Math.max(1, app.cart[index].quantity + change);
      saveCartToStorage();
      updateCartUI();
      showPage('cart');
    }
  }

  function removeFromCart(index) {
    app.cart.splice(index, 1);
    saveCartToStorage();
    updateCartUI();
    showPage('cart');
    showToast('Produit retiré du panier', 'success');
  }

  function loadCheckoutPage(container) {
    container.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8 text-center">Finaliser la commande</h1>
        <p class="text-center text-gray-600">Page de checkout en cours de développement...</p>
      </div>
    `;
  }

  // ==========================================
  // ADMIN PAGE
  // ==========================================
  
  function loadAdminPage(container) {
    if (!app.currentUser || !app.currentUser.isAdmin) {
      container.innerHTML = `
        <div class="container mx-auto px-4 py-20 text-center">
          <p class="text-red-500 text-xl">Accès refusé - Admin uniquement</p>
          <a href="#home" class="mt-4 inline-block bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600">
            Retour à l'accueil
          </a>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8">Panneau d'administration</h1>
        <p class="text-gray-600">Chargement du panneau admin...</p>
      </div>
    `;
    
    // Load admin script dynamically
    loadScript('./js/admin.js');
  }

  // ==========================================
  // 404 PAGE
  // ==========================================
  
  function load404Page(container) {
    container.innerHTML = `
      <div class="container mx-auto px-4 py-20 text-center">
        <h1 class="text-6xl font-bold text-pink-500 mb-4">404</h1>
        <p class="text-xl text-gray-600 mb-8">Page non trouvée</p>
        <a href="#home" class="bg-pink-500 text-white px-6 py-3 rounded hover:bg-pink-600">
          Retour à l'accueil
        </a>
      </div>
    `;
  }

  // ==========================================
  // UTILITIES
  // ==========================================
  
  function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => console.log('✅ Script loaded:', src);
    script.onerror = () => console.error('❌ Failed to load script:', src);
    document.body.appendChild(script);
  }

  function showToast(message, type = 'info') {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  function viewArticle(articleId) {
    console.log('Viewing article:', articleId);
    showToast('Fonction en développement', 'info');
  }

  // ==========================================
  // GLOBAL EXPORTS
  // ==========================================
  
  window.app = {
    showPage,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    viewArticle,
    showToast,
    logout,
    getCart: () => app.cart,
    getCurrentUser: () => app.currentUser
  };

  // ==========================================
  // START APP
  // ==========================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }

  console.log('✅ App.js loaded successfully');

})();
