// ==========================================
// ADMIN PANEL - COMPLETE & MOBILE FRIENDLY
// All CRUD operations fixed
// ==========================================

(function() {
  'use strict';

  console.log('🔧 Initializing Admin Panel...');

  const API_BASE_URL = 'https://mamanalgerienne-backend.onrender.com/api';
  
  let adminState = {
    currentTab: 'articles',
    editingItem: null,
    token: localStorage.getItem('token')
  };

  // ==========================================
  // INITIALIZATION
  // ==========================================
  
  function initializeAdmin() {
    console.log('📊 Admin panel starting...');
    
    const contentArea = document.getElementById('content');
    if (!contentArea) return;
    
    contentArea.innerHTML = getAdminHTML();
    
    setupAdminListeners();
    loadTab('articles');
    
    console.log('✅ Admin panel initialized');
  }

  // ==========================================
  // ADMIN HTML - MOBILE RESPONSIVE
  // ==========================================
  
  function getAdminHTML() {
    return `
      <div class="min-h-screen bg-gray-50">
        <!-- Mobile Header -->
        <div class="bg-pink-600 text-white p-4 md:hidden">
          <h1 class="text-xl font-bold">Admin Panel</h1>
        </div>
        
        <div class="container mx-auto px-2 md:px-4 py-4 md:py-8">
          <!-- Desktop Header -->
          <div class="hidden md:block mb-8">
            <h1 class="text-3xl font-bold text-gray-800">Panneau d'Administration</h1>
            <p class="text-gray-600">Gérer les articles, produits et publicités</p>
          </div>
          
          <!-- Tabs - Mobile Responsive -->
          <div class="bg-white rounded-lg shadow mb-4 md:mb-6 overflow-x-auto">
            <div class="flex border-b min-w-max md:min-w-0">
              <button onclick="window.adminPanel.loadTab('articles')" 
                class="admin-tab px-3 md:px-6 py-3 md:py-4 font-semibold text-sm md:text-base whitespace-nowrap" 
                data-tab="articles">
                <span class="hidden md:inline">📝</span> Articles
              </button>
              <button onclick="window.adminPanel.loadTab('products')" 
                class="admin-tab px-3 md:px-6 py-3 md:py-4 font-semibold text-sm md:text-base whitespace-nowrap" 
                data-tab="products">
                <span class="hidden md:inline">🛍️</span> Produits
              </button>
              <button onclick="window.adminPanel.loadTab('ads')" 
                class="admin-tab px-3 md:px-6 py-3 md:py-4 font-semibold text-sm md:text-base whitespace-nowrap" 
                data-tab="ads">
                <span class="hidden md:inline">📢</span> Publicités
              </button>
              <button onclick="window.adminPanel.loadTab('orders')" 
                class="admin-tab px-3 md:px-6 py-3 md:py-4 font-semibold text-sm md:text-base whitespace-nowrap" 
                data-tab="orders">
                <span class="hidden md:inline">📦</span> Commandes
              </button>
            </div>
          </div>
          
          <!-- Content Area -->
          <div id="adminContent" class="bg-white rounded-lg shadow p-3 md:p-6">
            <div class="text-center py-8">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
              <p class="mt-4 text-gray-600">Chargement...</p>
            </div>
          </div>
        </div>
        
        <!-- Mobile Action Button -->
        <button id="mobileAddBtn" 
          class="md:hidden fixed bottom-6 right-6 bg-pink-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl z-50">
          +
        </button>
      </div>
    `;
  }

  // ==========================================
  // SETUP LISTENERS
  // ==========================================
  
  function setupAdminListeners() {
    // Mobile add button
    const mobileAddBtn = document.getElementById('mobileAddBtn');
    if (mobileAddBtn) {
      mobileAddBtn.addEventListener('click', () => {
        showAddForm(adminState.currentTab);
      });
    }
  }

  // ==========================================
  // LOAD TAB
  // ==========================================
  
  async function loadTab(tabName) {
    console.log('📑 Loading tab:', tabName);
    
    adminState.currentTab = tabName;
    adminState.editingItem = null;
    
    // Update active tab
    document.querySelectorAll('.admin-tab').forEach(tab => {
      const isActive = tab.getAttribute('data-tab') === tabName;
      tab.classList.toggle('border-b-2', isActive);
      tab.classList.toggle('border-pink-500', isActive);
      tab.classList.toggle('text-pink-600', isActive);
      tab.classList.toggle('text-gray-600', !isActive);
    });
    
    const contentArea = document.getElementById('adminContent');
    if (!contentArea) return;
    
    contentArea.innerHTML = `
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
        <p class="mt-4 text-gray-600">Chargement...</p>
      </div>
    `;
    
    try {
      switch(tabName) {
        case 'articles':
          await loadArticlesTab(contentArea);
          break;
        case 'products':
          await loadProductsTab(contentArea);
          break;
        case 'ads':
          await loadAdsTab(contentArea);
          break;
        case 'orders':
          await loadOrdersTab(contentArea);
          break;
      }
    } catch (error) {
      console.error('Error loading tab:', error);
      contentArea.innerHTML = `
        <div class="text-center py-8">
          <p class="text-red-500 mb-4">Erreur de chargement</p>
          <button onclick="window.adminPanel.loadTab('${tabName}')" 
            class="bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600">
            Réessayer
          </button>
        </div>
      `;
    }
  }

  // ==========================================
  // ARTICLES TAB
  // ==========================================
  
  async function loadArticlesTab(container) {
    try {
      const response = await fetch(`${API_BASE_URL}/articles?limit=50`, {
        headers: {
          'Authorization': `Bearer ${adminState.token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load articles');
      
      const data = await response.json();
      const articles = data.articles || [];
      
      container.innerHTML = `
        <div class="mb-4 md:mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h2 class="text-xl md:text-2xl font-bold">Articles (${articles.length})</h2>
          <button onclick="window.adminPanel.showAddForm('article')" 
            class="hidden md:block bg-pink-500 text-white px-4 md:px-6 py-2 md:py-3 rounded hover:bg-pink-600 whitespace-nowrap">
            + Nouvel Article
          </button>
        </div>
        
        <div class="overflow-x-auto -mx-3 md:mx-0">
          <table class="w-full min-w-max md:min-w-0">
            <thead class="bg-gray-50 text-xs md:text-sm">
              <tr>
                <th class="px-2 md:px-4 py-2 md:py-3 text-left">Titre</th>
                <th class="px-2 md:px-4 py-2 md:py-3 text-left hidden md:table-cell">Catégorie</th>
                <th class="px-2 md:px-4 py-2 md:py-3 text-left hidden lg:table-cell">Date</th>
                <th class="px-2 md:px-4 py-2 md:py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="text-xs md:text-sm">
              ${articles.map(article => `
                <tr class="border-b hover:bg-gray-50">
                  <td class="px-2 md:px-4 py-2 md:py-3">
                    <div class="font-medium line-clamp-2">${article.title}</div>
                    <div class="md:hidden text-gray-500 text-xs">${article.category}</div>
                  </td>
                  <td class="px-2 md:px-4 py-2 md:py-3 hidden md:table-cell">${article.category}</td>
                  <td class="px-2 md:px-4 py-2 md:py-3 hidden lg:table-cell">${new Date(article.createdAt).toLocaleDateString()}</td>
                  <td class="px-2 md:px-4 py-2 md:py-3 text-right">
                    <button onclick='window.adminPanel.editItem("article", ${JSON.stringify(article).replace(/'/g, "\\'")})'
                      class="text-blue-600 hover:text-blue-800 mr-2 text-sm md:text-base">
                      ✏️
                    </button>
                    <button onclick="window.adminPanel.deleteItem('article', '${article._id}')"
                      class="text-red-600 hover:text-red-800 text-sm md:text-base">
                      🗑️
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        ${articles.length === 0 ? `
          <div class="text-center py-12">
            <p class="text-gray-500 mb-4">Aucun article</p>
            <button onclick="window.adminPanel.showAddForm('article')" 
              class="bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600">
              Créer le premier article
            </button>
          </div>
        ` : ''}
      `;
      
    } catch (error) {
      console.error('Error loading articles:', error);
      throw error;
    }
  }

  // ==========================================
  // PRODUCTS TAB
  // ==========================================
  
  async function loadProductsTab(container) {
    try {
      const response = await fetch(`${API_BASE_URL}/products?limit=50`, {
        headers: {
          'Authorization': `Bearer ${adminState.token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load products');
      
      const data = await response.json();
      const products = data.products || [];
      
      container.innerHTML = `
        <div class="mb-4 md:mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h2 class="text-xl md:text-2xl font-bold">Produits (${products.length})</h2>
          <button onclick="window.adminPanel.showAddForm('product')" 
            class="hidden md:block bg-pink-500 text-white px-4 md:px-6 py-2 md:py-3 rounded hover:bg-pink-600 whitespace-nowrap">
            + Nouveau Produit
          </button>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          ${products.map(product => `
            <div class="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              ${product.images && product.images.length > 0 ? `
                <img src="${product.images[0]}" alt="${product.name}" class="w-full h-32 md:h-48 object-cover">
              ` : `
                <div class="w-full h-32 md:h-48 bg-gray-200 flex items-center justify-center text-3xl md:text-4xl">
                  🛍️
                </div>
              `}
              <div class="p-3 md:p-4">
                <h3 class="font-bold mb-1 md:mb-2 line-clamp-2 text-sm md:text-base">${product.name}</h3>
                <p class="text-pink-600 font-bold mb-2 md:mb-3 text-sm md:text-lg">${product.price} DZD</p>
                <div class="flex gap-2">
                  <button onclick='window.adminPanel.editItem("product", ${JSON.stringify(product).replace(/'/g, "\\'")})'
                    class="flex-1 bg-blue-500 text-white px-2 md:px-3 py-1 md:py-2 rounded hover:bg-blue-600 text-xs md:text-sm">
                    Éditer
                  </button>
                  <button onclick="window.adminPanel.deleteItem('product', '${product._id}')"
                    class="bg-red-500 text-white px-2 md:px-3 py-1 md:py-2 rounded hover:bg-red-600 text-xs md:text-sm">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        ${products.length === 0 ? `
          <div class="text-center py-12">
            <p class="text-gray-500 mb-4">Aucun produit</p>
            <button onclick="window.adminPanel.showAddForm('product')" 
              class="bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600">
              Créer le premier produit
            </button>
          </div>
        ` : ''}
      `;
      
    } catch (error) {
      console.error('Error loading products:', error);
      throw error;
    }
  }

  // ==========================================
  // ADS TAB (Posts with type="ad")
  // ==========================================
  
  async function loadAdsTab(container) {
    try {
      const response = await fetch(`${API_BASE_URL}/posts?type=ad&limit=50`, {
        headers: {
          'Authorization': `Bearer ${adminState.token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load ads');
      
      const data = await response.json();
      const ads = data.posts || [];
      
      container.innerHTML = `
        <div class="mb-4 md:mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h2 class="text-xl md:text-2xl font-bold">Publicités (${ads.length})</h2>
          <button onclick="window.adminPanel.showAddForm('ad')" 
            class="hidden md:block bg-pink-500 text-white px-4 md:px-6 py-2 md:py-3 rounded hover:bg-pink-600 whitespace-nowrap">
            + Nouvelle Publicité
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          ${ads.map(ad => `
            <div class="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              ${ad.images && ad.images.length > 0 ? `
                <img src="${ad.images[0]}" alt="Ad" class="w-full h-32 md:h-48 object-cover">
              ` : `
                <div class="w-full h-32 md:h-48 bg-gray-200 flex items-center justify-center text-3xl md:text-4xl">
                  📢
                </div>
              `}
              <div class="p-3 md:p-4">
                <p class="mb-2 md:mb-3 line-clamp-3 text-sm md:text-base">${ad.content || 'No content'}</p>
                <div class="flex gap-2">
                  <button onclick='window.adminPanel.editItem("ad", ${JSON.stringify(ad).replace(/'/g, "\\'")})'
                    class="flex-1 bg-blue-500 text-white px-2 md:px-3 py-1 md:py-2 rounded hover:bg-blue-600 text-xs md:text-sm">
                    Éditer
                  </button>
                  <button onclick="window.adminPanel.deleteItem('ad', '${ad._id}')"
                    class="bg-red-500 text-white px-2 md:px-3 py-1 md:py-2 rounded hover:bg-red-600 text-xs md:text-sm">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        ${ads.length === 0 ? `
          <div class="text-center py-12">
            <p class="text-gray-500 mb-4">Aucune publicité</p>
            <button onclick="window.adminPanel.showAddForm('ad')" 
              class="bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600">
              Créer la première publicité
            </button>
          </div>
        ` : ''}
      `;
      
    } catch (error) {
      console.error('Error loading ads:', error);
      throw error;
    }
  }

  // ==========================================
  // ORDERS TAB
  // ==========================================
  
  async function loadOrdersTab(container) {
    container.innerHTML = `
      <div class="text-center py-12">
        <h2 class="text-2xl font-bold mb-4">Commandes</h2>
        <p class="text-gray-500">Fonctionnalité en développement...</p>
      </div>
    `;
  }

  // ==========================================
  // SHOW ADD/EDIT FORM - MOBILE RESPONSIVE
  // ==========================================
  
  function showAddForm(type) {
    const isEdit = adminState.editingItem !== null;
    const item = adminState.editingItem || {};
    
    let formHTML = '';
    
    switch(type) {
      case 'article':
        formHTML = getArticleForm(item, isEdit);
        break;
      case 'product':
        formHTML = getProductForm(item, isEdit);
        break;
      case 'ad':
        formHTML = getAdForm(item, isEdit);
        break;
    }
    
    const modal = document.createElement('div');
    modal.id = 'adminModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center z-50 p-0 md:p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="bg-white w-full md:max-w-2xl md:rounded-lg shadow-xl min-h-screen md:min-h-0 md:max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b px-4 md:px-6 py-3 md:py-4 flex justify-between items-center z-10">
          <h3 class="text-lg md:text-xl font-bold">
            ${isEdit ? 'Modifier' : 'Ajouter'} ${type === 'article' ? 'un article' : type === 'product' ? 'un produit' : 'une publicité'}
          </h3>
          <button onclick="window.adminPanel.closeModal()" class="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>
        <div class="p-4 md:p-6">
          ${formHTML}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // ==========================================
  // FORM TEMPLATES
  // ==========================================
  
  function getArticleForm(item = {}, isEdit = false) {
    return `
      <form id="adminForm" class="space-y-4" onsubmit="window.adminPanel.submitForm(event, 'article', ${isEdit})">
        <div>
          <label class="block text-sm font-medium mb-1">Titre *</label>
          <input type="text" name="title" value="${item.title || ''}" required
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 text-sm md:text-base">
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">Catégorie *</label>
          <select name="category" required
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 text-sm md:text-base">
            <option value="">Sélectionner...</option>
            <option value="حملي" ${item.category === 'حملي' ? 'selected' : ''}>حملي</option>
            <option value="طفلي" ${item.category === 'طفلي' ? 'selected' : ''}>طفلي</option>
            <option value="بيتي" ${item.category === 'بيتي' ? 'selected' : ''}>بيتي</option>
            <option value="كوزينتي" ${item.category === 'كوزينتي' ? 'selected' : ''}>كوزينتي</option>
            <option value="مدرستي" ${item.category === 'مدرستي' ? 'selected' : ''}>مدرستي</option>
            <option value="تحويستي" ${item.category === 'تحويستي' ? 'selected' : ''}>تحويستي</option>
            <option value="صحتي" ${item.category === 'صحتي' ? 'selected' : ''}>صحتي</option>
            <option value="ديني" ${item.category === 'ديني' ? 'selected' : ''}>ديني</option>
            <option value="الاسماء" ${item.category === 'الاسماء' ? 'selected' : ''}>الاسماء</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">Extrait *</label>
          <textarea name="excerpt" rows="3" required
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 text-sm md:text-base">${item.excerpt || ''}</textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">Contenu *</label>
          <textarea name="content" rows="6" required
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 text-sm md:text-base">${item.content || ''}</textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">Images</label>
          <input type="file" name="images" multiple accept="image/*"
            class="w-full px-3 py-2 border rounded text-sm md:text-base">
          <p class="text-xs text-gray-500 mt-1">Max 5 images</p>
        </div>
        
        <div class="flex items-center gap-2">
          <input type="checkbox" name="featured" ${item.featured ? 'checked' : ''} id="featured"
            class="rounded">
          <label for="featured" class="text-sm">Article mis en avant</label>
        </div>
        
        <div class="flex flex-col-reverse md:flex-row gap-3 pt-4">
          <button type="button" onclick="window.adminPanel.closeModal()"
            class="w-full md:w-auto px-6 py-2 md:py-3 border rounded hover:bg-gray-50 text-sm md:text-base">
            Annuler
          </button>
          <button type="submit"
            class="w-full md:w-auto px-6 py-2 md:py-3 bg-pink-500 text-white rounded hover:bg-pink-600 text-sm md:text-base">
            ${isEdit ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </form>
    `;
  }

  function getProductForm(item = {}, isEdit = false) {
    return `
      <form id="adminForm" class="space-y-4" onsubmit="window.adminPanel.submitForm(event, 'product', ${isEdit})">
        <div>
          <label class="block text-sm font-medium mb-1">Nom du produit *</label>
          <input type="text" name="name" value="${item.name || ''}" required
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 text-sm md:text-base">
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">Description *</label>
          <textarea name="description" rows="3" required
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 text-sm md:text-base">${item.description || ''}</textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">Prix (DZD) *</label>
          <input type="number" name="price" value="${item.price || ''}" required min="0" step="0.01"
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 text-sm md:text-base">
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">Catégorie *</label>
          <input type="text" name="category" value="${item.category || ''}" required
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 text-sm md:text-base">
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">Quantité en stock</label>
          <input type="number" name="stockQuantity" value="${item.stockQuantity || 0}" min="0"
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 text-sm md:text-base">
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">Images</label>
          <input type="file" name="images" multiple accept="image/*"
            class="w-full px-3 py-2 border rounded text-sm md:text-base">
          <p class="text-xs text-gray-500 mt-1">Max 5 images</p>
        </div>
        
        <div class="flex items-center gap-2">
          <input type="checkbox" name="featured" ${item.featured ? 'checked' : ''} id="featured"
            class="rounded">
          <label for="featured" class="text-sm">Produit mis en avant</label>
        </div>
        
        <div class="flex flex-col-reverse md:flex-row gap-3 pt-4">
          <button type="button" onclick="window.adminPanel.closeModal()"
            class="w-full md:w-auto px-6 py-2 md:py-3 border rounded hover:bg-gray-50 text-sm md:text-base">
            Annuler
          </button>
          <button type="submit"
            class="w-full md:w-auto px-6 py-2 md:py-3 bg-pink-500 text-white rounded hover:bg-pink-600 text-sm md:text-base">
            ${isEdit ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </form>
    `;
  }

  function getAdForm(item = {}, isEdit = false) {
    return `
      <form id="adminForm" class="space-y-4" onsubmit="window.adminPanel.submitForm(event, 'ad', ${isEdit})">
        <div>
          <label class="block text-sm font-medium mb-1">Contenu *</label>
          <textarea name="content" rows="4" required
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 text-sm md:text-base">${item.content || ''}</textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">Lien (optionnel)</label>
          <input type="url" name="link" value="${item.link || ''}"
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 text-sm md:text-base"
            placeholder="https://...">
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">Images</label>
          <input type="file" name="images" multiple accept="image/*"
            class="w-full px-3 py-2 border rounded text-sm md:text-base">
          <p class="text-xs text-gray-500 mt-1">Max 5 images</p>
        </div>
        
        <div class="flex flex-col-reverse md:flex-row gap-3 pt-4">
          <button type="button" onclick="window.adminPanel.closeModal()"
            class="w-full md:w-auto px-6 py-2 md:py-3 border rounded hover:bg-gray-50 text-sm md:text-base">
            Annuler
          </button>
          <button type="submit"
            class="w-full md:w-auto px-6 py-2 md:py-3 bg-pink-500 text-white rounded hover:bg-pink-600 text-sm md:text-base">
            ${isEdit ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </form>
    `;
  }

  // ==========================================
  // SUBMIT FORM - FIXED API CALLS
  // ==========================================
  
  async function submitForm(event, type, isEdit) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi...';
      
      let url, method;
      
      if (isEdit) {
        const id = adminState.editingItem._id;
        method = 'PUT';
        
        switch(type) {
          case 'article':
            url = `${API_BASE_URL}/articles/${id}`;
            break;
          case 'product':
            url = `${API_BASE_URL}/products/${id}`;
            break;
          case 'ad':
            url = `${API_BASE_URL}/posts/${id}`;
            break;
        }
      } else {
        method = 'POST';
        
        switch(type) {
          case 'article':
            url = `${API_BASE_URL}/articles`;
            break;
          case 'product':
            url = `${API_BASE_URL}/products`;
            break;
          case 'ad':
            url = `${API_BASE_URL}/posts`;
            formData.append('type', 'ad'); // Important for ads
            break;
        }
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${adminState.token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'envoi');
      }
      
      showToast(isEdit ? 'Mis à jour avec succès' : 'Créé avec succès', 'success');
      closeModal();
      loadTab(adminState.currentTab);
      
    } catch (error) {
      console.error('Submit error:', error);
      showToast(error.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  // ==========================================
  // EDIT ITEM
  // ==========================================
  
  function editItem(type, item) {
    console.log('Editing:', type, item);
    adminState.editingItem = item;
    showAddForm(type);
  }

  // ==========================================
  // DELETE ITEM
  // ==========================================
  
  async function deleteItem(type, id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      return;
    }
    
    try {
      let url;
      
      switch(type) {
        case 'article':
          url = `${API_BASE_URL}/articles/${id}`;
          break;
        case 'product':
          url = `${API_BASE_URL}/products/${id}`;
          break;
        case 'ad':
          url = `${API_BASE_URL}/posts/${id}`;
          break;
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminState.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }
      
      showToast('Supprimé avec succès', 'success');
      loadTab(adminState.currentTab);
      
    } catch (error) {
      console.error('Delete error:', error);
      showToast(error.message, 'error');
    }
  }

  // ==========================================
  // UTILITIES
  // ==========================================
  
  function closeModal() {
    const modal = document.getElementById('adminModal');
    if (modal) {
      modal.remove();
    }
    adminState.editingItem = null;
  }

  function showToast(message, type = 'info') {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 md:px-6 py-2 md:py-3 rounded-lg shadow-lg z-50 text-sm md:text-base max-w-sm`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // ==========================================
  // GLOBAL EXPORTS
  // ==========================================
  
  window.adminPanel = {
    loadTab,
    showAddForm,
    submitForm,
    editItem,
    deleteItem,
    closeModal
  };

  // ==========================================
  // AUTO-INIT
  // ==========================================
  
  initializeAdmin();

  console.log('✅ Admin panel loaded successfully');

})();
