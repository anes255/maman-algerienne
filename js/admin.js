// Complete Admin.js - Fixed for API Integration
(function() {
    'use strict';
    
    console.log('🔧 Initializing admin panel...');
    
    // Admin state
    let adminState = {
        currentSection: 'dashboard',
        products: [],
        orders: [],
        users: [],
        isLoading: false
    };
    
    // Initialize admin panel
    async function initializeAdmin() {
        console.log('🎯 Admin panel initialization started...');
        
        try {
            // Check if user is admin
            const user = window.app?.getCurrentUser();
            if (!user || user.role !== 'admin') {
                console.warn('❌ Access denied: User is not admin');
                window.app?.showPage('home');
                window.app?.showToast('Accès non autorisé', 'error');
                return;
            }
            
            console.log('✅ Admin access confirmed');
            
            // Initialize UI event listeners
            initializeAdminUI();
            
            // Load initial data
            await loadDashboardData();
            
            // Switch to dashboard by default
            switchAdminSection('dashboard');
            
            console.log('✅ Admin panel initialized successfully');
            
        } catch (error) {
            console.error('❌ Admin initialization error:', error);
            showAdminToast('Erreur d\'initialisation du panel admin', 'error');
        }
    }
    
    function initializeAdminUI() {
        console.log('🎨 Setting up admin UI...');
        
        // Section navigation
        const sectionLinks = document.querySelectorAll('[data-admin-section]');
        sectionLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-admin-section');
                switchAdminSection(section);
            });
        });
        
        // Product form handler
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', handleProductSubmit);
        }
        
        // Image preview handler
        const productImage = document.getElementById('productImage');
        if (productImage) {
            productImage.addEventListener('change', previewImage);
        }
        
        // Modal close handlers
        const closeModalBtns = document.querySelectorAll('[data-close-modal]');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', closeProductModal);
        });
        
        // Click outside modal to close
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('productModal');
            if (modal && e.target === modal) {
                closeProductModal();
            }
        });
        
        console.log('✅ Admin UI initialized');
    }
    
    async function loadDashboardData() {
        console.log('📊 Loading dashboard data...');
        
        try {
            adminState.isLoading = true;
            showLoadingState(true);
            
            // Load all data concurrently
            const [products, orders] = await Promise.all([
                loadProducts().catch(err => {
                    console.warn('Products load failed:', err);
                    return [];
                }),
                loadOrders().catch(err => {
                    console.warn('Orders load failed:', err);
                    return [];
                })
            ]);
            
            adminState.products = products;
            adminState.orders = orders;
            
            // Update dashboard stats
            updateDashboardStats();
            
            console.log(`✅ Dashboard data loaded: ${products.length} products, ${orders.length} orders`);
            
        } catch (error) {
            console.error('❌ Dashboard data loading error:', error);
            showAdminToast('Erreur de chargement des données', 'error');
        } finally {
            adminState.isLoading = false;
            showLoadingState(false);
        }
    }
    
    async function loadProducts() {
        console.log('📦 Loading products...');
        
        try {
            const response = await apiCall('/admin/products');
            console.log(`✅ Loaded ${response.length} products from API`);
            return response || [];
        } catch (error) {
            console.warn('⚠️ API products load failed, trying localStorage fallback:', error);
            
            // Fallback to localStorage
            const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
            console.log(`📁 Loaded ${localProducts.length} products from localStorage`);
            return localProducts;
        }
    }
    
    async function loadOrders() {
        console.log('📋 Loading orders...');
        
        try {
            const response = await apiCall('/admin/orders');
            console.log(`✅ Loaded ${response.length} orders from API`);
            return response || [];
        } catch (error) {
            console.warn('⚠️ API orders load failed, trying localStorage fallback:', error);
            
            // Fallback to localStorage
            const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            console.log(`📁 Loaded ${localOrders.length} orders from localStorage`);
            return localOrders;
        }
    }
    
    function switchAdminSection(sectionName) {
        console.log(`🔄 Switching to admin section: ${sectionName}`);
        
        adminState.currentSection = sectionName;
        
        // Hide all sections
        const sections = document.querySelectorAll('.admin-section');
        sections.forEach(section => section.classList.add('hidden'));
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            
            // Load section-specific data
            loadSectionData(sectionName);
            
            // Update active nav
            updateActiveAdminNav(sectionName);
        } else {
            console.warn(`⚠️ Section ${sectionName} not found`);
        }
    }
    
    async function loadSectionData(sectionName) {
        console.log(`📄 Loading data for section: ${sectionName}`);
        
        try {
            switch (sectionName) {
                case 'dashboard':
                    updateDashboardStats();
                    break;
                    
                case 'products':
                    await loadProductsSection();
                    break;
                    
                case 'orders':
                    await loadOrdersSection();
                    break;
                    
                case 'users':
                    await loadUsersSection();
                    break;
                    
                case 'settings':
                    loadSettingsSection();
                    break;
            }
        } catch (error) {
            console.error(`❌ Error loading section ${sectionName}:`, error);
            showAdminToast(`Erreur de chargement de la section ${sectionName}`, 'error');
        }
    }
    
    function updateDashboardStats() {
        const statsContainer = document.getElementById('dashboardStats');
        if (!statsContainer) return;
        
        const stats = {
            totalProducts: adminState.products.length,
            totalOrders: adminState.orders.length,
            totalRevenue: adminState.orders.reduce((sum, order) => sum + (order.total || 0), 0),
            pendingOrders: adminState.orders.filter(order => order.status === 'pending').length
        };
        
        statsContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Produits</p>
                            <p class="text-2xl font-bold text-gray-900">${stats.totalProducts}</p>
                        </div>
                        <div class="bg-blue-100 p-3 rounded-full">
                            <i class="fas fa-box-open text-blue-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Commandes</p>
                            <p class="text-2xl font-bold text-gray-900">${stats.totalOrders}</p>
                        </div>
                        <div class="bg-green-100 p-3 rounded-full">
                            <i class="fas fa-shopping-cart text-green-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Revenus</p>
                            <p class="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()} DZD</p>
                        </div>
                        <div class="bg-yellow-100 p-3 rounded-full">
                            <i class="fas fa-coins text-yellow-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">En attente</p>
                            <p class="text-2xl font-bold text-gray-900">${stats.pendingOrders}</p>
                        </div>
                        <div class="bg-red-100 p-3 rounded-full">
                            <i class="fas fa-clock text-red-600"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async function loadProductsSection() {
        console.log('📦 Loading products section...');
        
        const container = document.getElementById('productsTableBody');
        if (!container) {
            console.warn('⚠️ Products table body not found');
            return;
        }
        
        if (adminState.products.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        Aucun produit trouvé
                    </td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = adminState.products.map(product => `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-6 py-4">
                    <img src="${product.image || product.images?.[0] || '/images/default-product.jpg'}" 
                         alt="${product.nom || product.name}" 
                         class="w-12 h-12 object-cover rounded">
                </td>
                <td class="px-6 py-4 font-medium">${product.nom || product.name}</td>
                <td class="px-6 py-4">${product.prix || product.price} DZD</td>
                <td class="px-6 py-4">${product.stock || 0}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs rounded-full ${product.featured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${product.featured ? 'Vedette' : 'Normal'}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex space-x-2">
                        <button onclick="openEditProductModal('${product.id || product._id}')" 
                                class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="toggleFeatured('${product.id || product._id}')" 
                                class="text-yellow-600 hover:text-yellow-800">
                            <i class="fas fa-star"></i>
                        </button>
                        <button onclick="deleteProduct('${product.id || product._id}')" 
                                class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    async function loadOrdersSection() {
        console.log('📋 Loading orders section...');
        
        const container = document.getElementById('ordersTableBody');
        if (!container) {
            console.warn('⚠️ Orders table body not found');
            return;
        }
        
        if (adminState.orders.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        Aucune commande trouvée
                    </td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = adminState.orders.map(order => `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-6 py-4 font-medium">${order.numeroCommande || order.id}</td>
                <td class="px-6 py-4">${order.client?.prenom} ${order.client?.nom}</td>
                <td class="px-6 py-4">${order.total || 0} DZD</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs rounded-full ${getOrderStatusClass(order.status)}">
                        ${getOrderStatusText(order.status)}
                    </span>
                </td>
                <td class="px-6 py-4">${formatDate(order.createdAt || order.dateCommande)}</td>
                <td class="px-6 py-4">
                    <div class="flex space-x-2">
                        <button onclick="viewOrderDetails('${order.id || order._id}')" 
                                class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-eye"></i>
                        </button>
                        <select onchange="updateOrderStatus('${order.id || order._id}', this.value)" 
                                class="text-sm border rounded px-2 py-1">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>En attente</option>
                            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmée</option>
                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Expédiée</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Livrée</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Annulée</option>
                        </select>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    async function loadUsersSection() {
        console.log('👥 Loading users section...');
        // Implementation for users management
        const container = document.getElementById('usersTableBody');
        if (container) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        Gestion des utilisateurs - En développement
                    </td>
                </tr>
            `;
        }
    }
    
    function loadSettingsSection() {
        console.log('⚙️ Loading settings section...');
        // Implementation for settings management
        const container = document.getElementById('settingsForm');
        if (container) {
            const settings = window.app?.getSettings() || {};
            
            container.innerHTML = `
                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Nom du site</label>
                        <input type="text" value="${settings.nomSite || ''}" 
                               class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Frais de livraison (DZD)</label>
                        <input type="number" value="${settings.fraisLivraison || 0}" 
                               class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Livraison gratuite à partir de (DZD)</label>
                        <input type="number" value="${settings.livraisonGratuite || 0}" 
                               class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                    </div>
                    <button type="submit" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                        Sauvegarder
                    </button>
                </div>
            `;
        }
    }
    
    // Product management functions
    function openAddProductModal() {
        console.log('➕ Opening add product modal...');
        
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const title = document.getElementById('modalTitle');
        
        if (modal && form && title) {
            title.textContent = 'Ajouter un produit';
            form.reset();
            form.removeAttribute('data-edit-id');
            modal.classList.remove('hidden');
        }
    }
    
    function openEditProductModal(productId) {
        console.log(`✏️ Opening edit product modal for: ${productId}`);
        
        const product = adminState.products.find(p => (p.id || p._id) === productId);
        if (!product) {
            console.warn('⚠️ Product not found for editing');
            return;
        }
        
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const title = document.getElementById('modalTitle');
        
        if (modal && form && title) {
            title.textContent = 'Modifier le produit';
            
            // Fill form with product data
            form.querySelector('#productName').value = product.nom || product.name || '';
            form.querySelector('#productDescription').value = product.description || '';
            form.querySelector('#productPrice').value = product.prix || product.price || '';
            form.querySelector('#productStock').value = product.stock || '';
            form.querySelector('#productCategory').value = product.categorie || product.category || '';
            form.querySelector('#productFeatured').checked = product.featured || false;
            
            form.setAttribute('data-edit-id', productId);
            modal.classList.remove('hidden');
        }
    }
    
    function closeProductModal() {
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    async function handleProductSubmit(e) {
        e.preventDefault();
        
        console.log('💾 Handling product submit...');
        
        try {
            const formData = new FormData(e.target);
            const editId = e.target.getAttribute('data-edit-id');
            
            const productData = {
                nom: formData.get('name'),
                description: formData.get('description'),
                prix: parseFloat(formData.get('price')),
                stock: parseInt(formData.get('stock')),
                categorie: formData.get('category'),
                featured: formData.has('featured')
            };
            
            // Handle image
            const imageFile = formData.get('image');
            if (imageFile && imageFile.size > 0) {
                productData.image = await convertImageToBase64(imageFile);
            }
            
            let result;
            if (editId) {
                // Update existing product
                result = await apiCall(`/admin/products/${editId}`, {
                    method: 'PUT',
                    body: JSON.stringify(productData)
                });
                console.log('✅ Product updated successfully');
            } else {
                // Create new product
                result = await apiCall('/admin/products', {
                    method: 'POST',
                    body: JSON.stringify(productData)
                });
                console.log('✅ Product created successfully');
            }
            
            // Refresh products data
            adminState.products = await loadProducts();
            await loadProductsSection();
            
            closeProductModal();
            showAdminToast(editId ? 'Produit modifié avec succès' : 'Produit ajouté avec succès', 'success');
            
        } catch (error) {
            console.error('❌ Product submit error:', error);
            showAdminToast('Erreur lors de la sauvegarde du produit', 'error');
        }
    }
    
    async function toggleFeatured(productId) {
        console.log(`⭐ Toggling featured status for: ${productId}`);
        
        try {
            const product = adminState.products.find(p => (p.id || p._id) === productId);
            if (!product) return;
            
            const updatedProduct = { ...product, featured: !product.featured };
            
            await apiCall(`/admin/products/${productId}`, {
                method: 'PUT',
                body: JSON.stringify(updatedProduct)
            });
            
            // Refresh products data
            adminState.products = await loadProducts();
            await loadProductsSection();
            
            showAdminToast('Statut vedette mis à jour', 'success');
            
        } catch (error) {
            console.error('❌ Toggle featured error:', error);
            showAdminToast('Erreur lors de la mise à jour', 'error');
        }
    }
    
    async function deleteProduct(productId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
            return;
        }
        
        console.log(`🗑️ Deleting product: ${productId}`);
        
        try {
            await apiCall(`/admin/products/${productId}`, {
                method: 'DELETE'
            });
            
            // Refresh products data
            adminState.products = await loadProducts();
            await loadProductsSection();
            
            showAdminToast('Produit supprimé avec succès', 'success');
            
        } catch (error) {
            console.error('❌ Delete product error:', error);
            showAdminToast('Erreur lors de la suppression', 'error');
        }
    }
    
    // Order management functions
    function viewOrderDetails(orderId) {
        console.log(`👁️ Viewing order details: ${orderId}`);
        
        const order = adminState.orders.find(o => (o.id || o._id) === orderId);
        if (!order) {
            console.warn('⚠️ Order not found');
            return;
        }
        
        // Create and show order details modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Détails de la commande ${order.numeroCommande || order.id}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <h4 class="font-medium mb-2">Informations client</h4>
                        <p><strong>Nom:</strong> ${order.client?.prenom} ${order.client?.nom}</p>
                        <p><strong>Email:</strong> ${order.client?.email}</p>
                        <p><strong>Téléphone:</strong> ${order.client?.telephone}</p>
                        <p><strong>Adresse:</strong> ${order.client?.adresse}</p>
                        <p><strong>Wilaya:</strong> ${order.client?.wilaya}</p>
                    </div>
                    
                    <div>
                        <h4 class="font-medium mb-2">Articles commandés</h4>
                        <div class="space-y-2">
                            ${(order.articles || []).map(article => `
                                <div class="flex justify-between border-b pb-2">
                                    <span>${article.nom} x${article.quantite}</span>
                                    <span>${article.prix * article.quantite} DZD</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-medium mb-2">Résumé</h4>
                        <div class="space-y-1">
                            <div class="flex justify-between">
                                <span>Sous-total:</span>
                                <span>${order.sousTotal || 0} DZD</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Frais de livraison:</span>
                                <span>${order.fraisLivraison || 0} DZD</span>
                            </div>
                            <div class="flex justify-between font-bold">
                                <span>Total:</span>
                                <span>${order.total || 0} DZD</span>
                            </div>
                        </div>
                    </div>
                    
                    ${order.commentaires ? `
                        <div>
                            <h4 class="font-medium mb-2">Commentaires</h4>
                            <p class="text-gray-600">${order.commentaires}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    async function updateOrderStatus(orderId, newStatus) {
        console.log(`📋 Updating order ${orderId} status to: ${newStatus}`);
        
        try {
            await apiCall(`/admin/orders/${orderId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            
            // Update local state
            const order = adminState.orders.find(o => (o.id || o._id) === orderId);
            if (order) {
                order.status = newStatus;
            }
            
            showAdminToast('Statut de commande mis à jour', 'success');
            
        } catch (error) {
            console.error('❌ Update order status error:', error);
            showAdminToast('Erreur lors de la mise à jour du statut', 'error');
        }
    }
    
    // Utility functions
    function previewImage(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                if (preview) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="w-32 h-32 object-cover rounded">`;
                }
            };
            reader.readAsDataURL(file);
        }
    }
    
    async function convertImageToBase64(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }
    
    function updateActiveAdminNav(sectionName) {
        const navLinks = document.querySelectorAll('[data-admin-section]');
        navLinks.forEach(link => {
            const linkSection = link.getAttribute('data-admin-section');
            if (linkSection === sectionName) {
                link.classList.add('bg-green-100', 'text-green-800');
            } else {
                link.classList.remove('bg-green-100', 'text-green-800');
            }
        });
    }
    
    function showLoadingState(isLoading) {
        const loadingEl = document.getElementById('adminLoading');
        if (loadingEl) {
            loadingEl.classList.toggle('hidden', !isLoading);
        }
    }
    
    function showAdminToast(message, type = 'info') {
        console.log(`🔔 Admin toast: ${message} (${type})`);
        
        // Use main app toast if available
        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(message, type);
        } else {
            // Fallback toast
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
    }
    
    function getOrderStatusClass(status) {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'shipped': return 'bg-purple-100 text-purple-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    
    function getOrderStatusText(status) {
        switch (status) {
            case 'pending': return 'En attente';
            case 'confirmed': return 'Confirmée';
            case 'shipped': return 'Expédiée';
            case 'delivered': return 'Livrée';
            case 'cancelled': return 'Annulée';
            default: return 'Inconnu';
        }
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Date invalide';
        }
    }
    
    // Global exports for HTML onclick handlers
    window.initializeAdmin = initializeAdmin;
    window.switchAdminSection = switchAdminSection;
    window.openAddProductModal = openAddProductModal;
    window.openEditProductModal = openEditProductModal;
    window.closeProductModal = closeProductModal;
    window.toggleFeatured = toggleFeatured;
    window.deleteProduct = deleteProduct;
    window.viewOrderDetails = viewOrderDetails;
    window.updateOrderStatus = updateOrderStatus;
    window.previewImage = previewImage;
    
    console.log('✅ Admin panel script loaded successfully');
    
})();
