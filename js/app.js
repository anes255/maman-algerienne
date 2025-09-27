// Complete App.js - Fixed for Admin Integration
(function() {
    'use strict';
    
    // Check if APP_CONFIG is loaded
    if (typeof APP_CONFIG === 'undefined') {
        console.error('APP_CONFIG not loaded! Make sure config.js is included before app.js');
        return;
    }
    
    console.log('✅ APP_CONFIG loaded successfully');
    
    // Main App Class
    class PharmacieGaherApp {
        constructor() {
            this.currentUser = null;
            this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
            this.settings = {
                couleurPrimaire: '#10b981',
                couleurSecondaire: '#059669',
                couleurAccent: '#34d399',
                nomSite: 'Shifa - Parapharmacie',
                fraisLivraison: 300,
                livraisonGratuite: 5000
            };
            this.currentPage = 'home';
            this.isLoading = false;
            
            this.init();
        }
        
        async init() {
            try {
                console.log('🚀 Initializing Pharmacie Gaher App...');
                await this.checkAuth();
                this.initUI();
                await this.showPage('home');
                this.updateCartUI();
                this.initSearch();
                console.log('✅ App initialization complete');
            } catch (error) {
                console.error('❌ App initialization error:', error);
                this.showToast('Erreur de chargement de l\'application', 'error');
            }
        }
        
        async checkAuth() {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await apiCall('/auth/profile');
                    this.currentUser = response;
                    this.updateUserUI();
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('token');
                    this.currentUser = null;
                }
            }
        }
        
        initUI() {
            // Navigation handlers
            const navLinks = document.querySelectorAll('[data-page]');
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = e.currentTarget.getAttribute('data-page');
                    this.showPage(page);
                });
            });
            
            // Search functionality
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.performSearch(e.target.value);
                    }
                });
            }
            
            const searchBtn = document.getElementById('searchBtn');
            if (searchBtn) {
                searchBtn.addEventListener('click', () => {
                    const searchInput = document.getElementById('searchInput');
                    if (searchInput) {
                        this.performSearch(searchInput.value);
                    }
                });
            }
            
            // Cart toggle
            const cartToggle = document.getElementById('cartToggle');
            if (cartToggle) {
                cartToggle.addEventListener('click', () => {
                    this.toggleCartSidebar();
                });
            }
            
            // Mobile menu toggle
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenuBtn && mobileMenu) {
                mobileMenuBtn.addEventListener('click', () => {
                    mobileMenu.classList.toggle('hidden');
                });
            }
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                const mobileMenu = document.getElementById('mobileMenu');
                const mobileMenuBtn = document.getElementById('mobileMenuBtn');
                if (mobileMenu && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                }
            });
            
            // Auth forms
            this.initAuthForms();
        }
        
        initAuthForms() {
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin(e);
                });
            }
            
            const registerForm = document.getElementById('registerForm');
            if (registerForm) {
                registerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleRegister(e);
                });
            }
        }
        
        async showPage(pageName) {
            if (this.isLoading) return;
            
            this.isLoading = true;
            this.currentPage = pageName;
            
            try {
                // Hide all pages
                const pages = document.querySelectorAll('.page');
                pages.forEach(page => page.classList.add('hidden'));
                
                // Show requested page
                const targetPage = document.getElementById(`${pageName}Page`);
                if (targetPage) {
                    targetPage.classList.remove('hidden');
                    
                    // Load page-specific content
                    await this.loadPageContent(pageName);
                    
                    // Update active nav
                    this.updateActiveNav(pageName);
                } else {
                    console.warn(`Page ${pageName} not found`);
                }
            } catch (error) {
                console.error(`Error showing page ${pageName}:`, error);
                this.showToast('Erreur de chargement de la page', 'error');
            } finally {
                this.isLoading = false;
            }
        }
        
        async loadPageContent(pageName) {
            switch (pageName) {
                case 'home':
                    await this.loadHomeContent();
                    break;
                case 'products':
                    await this.loadProductsContent();
                    break;
                case 'cart':
                    this.loadCartContent();
                    break;
                case 'checkout':
                    this.loadCheckoutContent();
                    break;
                case 'admin':
                    if (this.currentUser && this.currentUser.role === 'admin') {
                        await this.loadAdminContent();
                    } else {
                        this.showPage('home');
                        this.showToast('Accès non autorisé', 'error');
                    }
                    break;
            }
        }
        
        async loadHomeContent() {
            try {
                await this.loadFeaturedProducts();
                this.loadHomeStats();
            } catch (error) {
                console.error('Error loading home content:', error);
            }
        }
        
        async loadFeaturedProducts() {
            try {
                const products = await apiCall('/products');
                const featured = products.filter(p => p.featured).slice(0, 6);
                
                const container = document.getElementById('featuredProducts');
                if (container) {
                    container.innerHTML = featured.map(product => 
                        this.createProductCard(product)
                    ).join('');
                }
            } catch (error) {
                console.error('Error loading featured products:', error);
            }
        }
        
        async loadProductsContent() {
            try {
                const products = await apiCall('/products');
                const container = document.getElementById('productsGrid');
                if (container) {
                    container.innerHTML = products.map(product => 
                        this.createProductCard(product)
                    ).join('');
                }
            } catch (error) {
                console.error('Error loading products:', error);
                this.showToast('Erreur de chargement des produits', 'error');
            }
        }
        
        loadCartContent() {
            const container = document.getElementById('cartItems');
            if (container) {
                if (this.cart.length === 0) {
                    container.innerHTML = '<p class="text-center text-gray-500">Votre panier est vide</p>';
                } else {
                    container.innerHTML = this.cart.map(item => 
                        this.createCartItemHtml(item)
                    ).join('');
                }
                this.updateCartSummary();
            }
        }
        
        loadCheckoutContent() {
            // Initialize checkout if checkout.js is loaded
            if (typeof initializeCheckout === 'function') {
                initializeCheckout();
            }
        }
        
        async loadAdminContent() {
            // Initialize admin panel if admin.js is loaded
            if (typeof initializeAdmin === 'function') {
                initializeAdmin();
            }
        }
        
        loadHomeStats() {
            // Update homepage statistics
            const statsContainer = document.getElementById('homeStats');
            if (statsContainer) {
                const stats = {
                    products: this.cart.length,
                    orders: localStorage.getItem('orderCount') || '0',
                    users: '1000+',
                    satisfaction: '98%'
                };
                
                statsContainer.innerHTML = `
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="bg-white p-4 rounded-lg shadow">
                            <div class="text-2xl font-bold text-green-600">${stats.products}</div>
                            <div class="text-sm text-gray-600">Produits au panier</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow">
                            <div class="text-2xl font-bold text-blue-600">${stats.orders}</div>
                            <div class="text-sm text-gray-600">Commandes</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow">
                            <div class="text-2xl font-bold text-purple-600">${stats.users}</div>
                            <div class="text-sm text-gray-600">Clients satisfaits</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow">
                            <div class="text-2xl font-bold text-orange-600">${stats.satisfaction}</div>
                            <div class="text-sm text-gray-600">Satisfaction</div>
                        </div>
                    </div>
                `;
            }
        }
        
        createProductCard(product) {
            const isInCart = this.cart.some(item => item.id === product.id);
            const price = product.prix || product.price || 0;
            
            return `
                <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div class="relative">
                        <img src="${product.image || product.images?.[0] || '/images/default-product.jpg'}" 
                             alt="${product.nom || product.name}" 
                             class="w-full h-48 object-cover">
                        ${product.featured ? '<span class="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 text-xs rounded">Vedette</span>' : ''}
                    </div>
                    <div class="p-4">
                        <h3 class="font-semibold text-gray-800 mb-2">${product.nom || product.name}</h3>
                        <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description || ''}</p>
                        <div class="flex justify-between items-center">
                            <span class="text-lg font-bold text-green-600">${price} DZD</span>
                            <button onclick="app.addToCart('${product.id || product._id}')" 
                                    class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors ${isInCart ? 'opacity-50' : ''}">
                                ${isInCart ? 'Ajouté' : 'Ajouter'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        createCartItemHtml(item) {
            return `
                <div class="flex items-center justify-between border-b pb-4 mb-4">
                    <div class="flex items-center">
                        <img src="${item.image || '/images/default-product.jpg'}" 
                             alt="${item.nom}" 
                             class="w-16 h-16 object-cover rounded">
                        <div class="ml-4">
                            <h4 class="font-semibold">${item.nom}</h4>
                            <p class="text-gray-600">${item.prix} DZD</p>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <button onclick="app.updateCartQuantity('${item.id}', ${item.quantite - 1})" 
                                class="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded">-</button>
                        <span class="mx-3 font-semibold">${item.quantite}</span>
                        <button onclick="app.updateCartQuantity('${item.id}', ${item.quantite + 1})" 
                                class="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded">+</button>
                        <button onclick="app.removeFromCart('${item.id}')" 
                                class="ml-4 text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }
        
        async addToCart(productId) {
            try {
                const products = await apiCall('/products');
                const product = products.find(p => (p.id || p._id) === productId);
                
                if (!product) {
                    this.showToast('Produit non trouvé', 'error');
                    return;
                }
                
                const existingItem = this.cart.find(item => item.id === productId);
                
                if (existingItem) {
                    existingItem.quantite += 1;
                } else {
                    this.cart.push({
                        id: productId,
                        nom: product.nom || product.name,
                        prix: product.prix || product.price,
                        image: product.image || product.images?.[0],
                        quantite: 1
                    });
                }
                
                this.saveCart();
                this.updateCartUI();
                this.showToast('Produit ajouté au panier', 'success');
                
                // Refresh current page to update button states
                if (this.currentPage === 'products' || this.currentPage === 'home') {
                    await this.loadPageContent(this.currentPage);
                }
                
            } catch (error) {
                console.error('Error adding to cart:', error);
                this.showToast('Erreur lors de l\'ajout au panier', 'error');
            }
        }
        
        updateCartQuantity(productId, newQuantity) {
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
                return;
            }
            
            const item = this.cart.find(item => item.id === productId);
            if (item) {
                item.quantite = newQuantity;
                this.saveCart();
                this.updateCartUI();
                if (this.currentPage === 'cart') {
                    this.loadCartContent();
                }
            }
        }
        
        removeFromCart(productId) {
            this.cart = this.cart.filter(item => item.id !== productId);
            this.saveCart();
            this.updateCartUI();
            if (this.currentPage === 'cart') {
                this.loadCartContent();
            }
            this.showToast('Produit retiré du panier', 'info');
        }
        
        saveCart() {
            localStorage.setItem('cart', JSON.stringify(this.cart));
        }
        
        updateCartUI() {
            const cartCount = document.getElementById('cartCount');
            const cartTotal = document.getElementById('cartTotal');
            
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantite, 0);
            const totalPrice = this.cart.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
            
            if (cartCount) {
                cartCount.textContent = totalItems;
                cartCount.classList.toggle('hidden', totalItems === 0);
            }
            
            if (cartTotal) {
                cartTotal.textContent = `${totalPrice} DZD`;
            }
        }
        
        updateCartSummary() {
            const subtotal = this.cart.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
            const shipping = subtotal >= this.settings.livraisonGratuite ? 0 : this.settings.fraisLivraison;
            const total = subtotal + shipping;
            
            const summaryContainer = document.getElementById('cartSummary');
            if (summaryContainer) {
                summaryContainer.innerHTML = `
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="flex justify-between mb-2">
                            <span>Sous-total:</span>
                            <span>${subtotal} DZD</span>
                        </div>
                        <div class="flex justify-between mb-2">
                            <span>Livraison:</span>
                            <span>${shipping === 0 ? 'Gratuite' : shipping + ' DZD'}</span>
                        </div>
                        <div class="border-t pt-2 flex justify-between font-bold">
                            <span>Total:</span>
                            <span>${total} DZD</span>
                        </div>
                        <button onclick="app.showPage('checkout')" 
                                class="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-2 rounded">
                            Passer la commande
                        </button>
                    </div>
                `;
            }
        }
        
        toggleCartSidebar() {
            const sidebar = document.getElementById('cartSidebar');
            if (sidebar) {
                sidebar.classList.toggle('hidden');
                if (!sidebar.classList.contains('hidden')) {
                    this.loadCartContent();
                }
            }
        }
        
        async performSearch(query) {
            if (!query.trim()) return;
            
            try {
                const products = await apiCall('/products');
                const filtered = products.filter(product => 
                    (product.nom || product.name || '').toLowerCase().includes(query.toLowerCase()) ||
                    (product.description || '').toLowerCase().includes(query.toLowerCase())
                );
                
                // Show products page with filtered results
                await this.showPage('products');
                
                const container = document.getElementById('productsGrid');
                if (container) {
                    if (filtered.length === 0) {
                        container.innerHTML = '<p class="text-center text-gray-500 col-span-full">Aucun produit trouvé</p>';
                    } else {
                        container.innerHTML = filtered.map(product => 
                            this.createProductCard(product)
                        ).join('');
                    }
                }
                
                this.showToast(`${filtered.length} produit(s) trouvé(s)`, 'info');
                
            } catch (error) {
                console.error('Search error:', error);
                this.showToast('Erreur lors de la recherche', 'error');
            }
        }
        
        async handleLogin(e) {
            const formData = new FormData(e.target);
            const email = formData.get('email');
            const password = formData.get('password');
            
            try {
                const response = await apiCall('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                
                localStorage.setItem('token', response.token);
                this.currentUser = response.user;
                this.updateUserUI();
                
                // Redirect based on user role
                if (this.currentUser.role === 'admin') {
                    this.showPage('admin');
                } else {
                    this.showPage('home');
                }
                
                this.showToast('Connexion réussie', 'success');
                
            } catch (error) {
                console.error('Login error:', error);
                this.showToast(error.message || 'Erreur de connexion', 'error');
            }
        }
        
        async handleRegister(e) {
            const formData = new FormData(e.target);
            const userData = {
                nom: formData.get('nom'),
                email: formData.get('email'),
                telephone: formData.get('telephone'),
                password: formData.get('password')
            };
            
            try {
                const response = await apiCall('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
                
                localStorage.setItem('token', response.token);
                this.currentUser = response.user;
                this.updateUserUI();
                this.showPage('home');
                this.showToast('Inscription réussie', 'success');
                
            } catch (error) {
                console.error('Register error:', error);
                this.showToast(error.message || 'Erreur d\'inscription', 'error');
            }
        }
        
        logout() {
            localStorage.removeItem('token');
            this.currentUser = null;
            this.updateUserUI();
            this.showPage('home');
            this.showToast('Déconnexion réussie', 'success');
        }
        
        updateUserUI() {
            const loginBtn = document.getElementById('loginBtn');
            const userMenu = document.getElementById('userMenu');
            const userName = document.getElementById('userName');
            
            if (this.currentUser) {
                if (loginBtn) loginBtn.classList.add('hidden');
                if (userMenu) userMenu.classList.remove('hidden');
                if (userName) userName.textContent = this.currentUser.nom || this.currentUser.email;
            } else {
                if (loginBtn) loginBtn.classList.remove('hidden');
                if (userMenu) userMenu.classList.add('hidden');
            }
        }
        
        updateActiveNav(pageName) {
            const navLinks = document.querySelectorAll('[data-page]');
            navLinks.forEach(link => {
                const linkPage = link.getAttribute('data-page');
                if (linkPage === pageName) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
        
        showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
                type === 'success' ? 'bg-green-500' : 
                type === 'error' ? 'bg-red-500' : 
                type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }
        
        // Getter methods for admin integration
        getCart() {
            return this.cart;
        }
        
        getCurrentUser() {
            return this.currentUser;
        }
        
        getSettings() {
            return this.settings;
        }
    }
    
    // Initialize app when DOM is ready
    let app;
    
    function initializeApp() {
        if (typeof APP_CONFIG !== 'undefined') {
            app = new PharmacieGaherApp();
            
            // Make app globally available
            window.app = app;
            
            console.log('✅ Pharmacie Gaher App initialized successfully');
        } else {
            console.error('❌ Cannot initialize app: APP_CONFIG not found');
            setTimeout(initializeApp, 100); // Retry after 100ms
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }
    
})();
