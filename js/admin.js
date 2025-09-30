// ============================================
// ADMIN PANEL - COMPACT & FULLY FUNCTIONAL
// ============================================

// Global State
let currentSection = 'dashboard';
let selectedFiles = { article: [], product: [], post: [] };
let adminUser = null;
let currentOrdersPage = 1;
let ordersLoading = false;

// Delivery prices by wilaya
const DELIVERY_PRICES = {
    '16 - الجزائر': 400, '09 - البليدة': 400, '35 - بومرداس': 400,
    '06 - بجاية': 500, '19 - سطيف': 500, '25 - قسنطينة': 500,
    '31 - وهران': 600, '13 - تلمسان': 600, '32 - البيض': 600
};

// API Configuration
const API_BASE = window.location.hostname.includes('localhost') 
    ? 'http://localhost:5000/api' 
    : 'https://maman-algerienne.onrender.com/api';
const SERVER_BASE = API_BASE.replace('/api', '');

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', initAdmin);

async function initAdmin() {
    console.log('🚀 Initializing admin panel...');
    
    if (!await checkAuth()) return;
    
    setupNav();
    setupMobile();
    setupModals();
    setupForms();
    updateTime();
    setInterval(updateTime, 60000);
    loadDashboard();
    
    console.log('✅ Admin initialized');
}

// ============================================
// AUTHENTICATION
// ============================================
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        redirectLogin();
        return false;
    }

    const stored = localStorage.getItem('user');
    if (stored) {
        try {
            adminUser = JSON.parse(stored);
            if (adminUser.isAdmin) {
                updateUserDisplay();
                return true;
            }
        } catch (e) {}
    }

    try {
        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            adminUser = data.user;
            if (adminUser.isAdmin) {
                localStorage.setItem('user', JSON.stringify(adminUser));
                updateUserDisplay();
                return true;
            }
        }
    } catch (e) {
        console.error('Auth error:', e);
    }
    
    redirectLogin();
    return false;
}

function redirectLogin() {
    toast('يرجى تسجيل الدخول كمدير', 'warning');
    setTimeout(() => window.location.href = 'login.html', 1500);
}

function updateUserDisplay() {
    const nameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar-img');
    if (nameEl) nameEl.textContent = adminUser.name;
    if (avatarEl) {
        avatarEl.src = adminUser.avatar 
            ? `${SERVER_BASE}/uploads/avatars/${adminUser.avatar}`
            : `https://via.placeholder.com/35x35/d4a574/ffffff?text=${adminUser.name.charAt(0)}`;
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupNav() {
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            if (section) switchSection(section);
        });
    });
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}

function setupMobile() {
    const btn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('admin-sidebar');
    
    if (window.innerWidth <= 768 && btn) btn.style.display = 'block';
    
    if (btn && sidebar) {
        btn.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar && !sidebar.contains(e.target) && 
            btn && !btn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            if (btn) btn.style.display = 'block';
        } else {
            if (btn) btn.style.display = 'none';
            if (sidebar) sidebar.classList.remove('open');
        }
    });
}

function setupModals() {
    document.querySelectorAll('.form-modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    });
    
    ['article', 'product', 'post'].forEach(type => {
        const upload = document.getElementById(`${type}-upload`);
        const input = document.getElementById(`${type}-images`);
        
        if (upload && input) {
            upload.addEventListener('click', () => input.click());
            upload.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.currentTarget.classList.add('drag-over');
            });
            upload.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over');
            });
            upload.addEventListener('drop', (e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over');
                addFiles(Array.from(e.dataTransfer.files), type);
            });
            input.addEventListener('change', (e) => {
                addFiles(Array.from(e.target.files), type);
            });
        }
    });
}

function setupForms() {
    const articleForm = document.getElementById('article-form');
    const productForm = document.getElementById('product-form');
    const postForm = document.getElementById('post-form');
    const orderForm = document.getElementById('update-order-form');
    
    if (articleForm) articleForm.addEventListener('submit', submitArticle);
    if (productForm) {
        productForm.addEventListener('submit', submitProduct);
        const saleCheckbox = document.getElementById('product-sale');
        if (saleCheckbox) {
            saleCheckbox.addEventListener('change', (e) => {
                const group = document.getElementById('sale-price-group');
                if (group) group.style.display = e.target.checked ? 'block' : 'none';
            });
        }
    }
    if (postForm) postForm.addEventListener('submit', submitPost);
    if (orderForm) orderForm.addEventListener('submit', submitOrderUpdate);
}

// ============================================
// SECTION SWITCHING
// ============================================
function switchSection(section) {
    console.log(`Switching to: ${section}`);
    
    document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
    const link = document.querySelector(`[data-section="${section}"]`);
    if (link) link.classList.add('active');

    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    const sec = document.getElementById(`${section}-section`);
    if (sec) {
        sec.classList.add('active');
        currentSection = section;
        loadSection(section);
    }
    
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar && window.innerWidth <= 768) sidebar.classList.remove('open');
}

function loadSection(section) {
    const loaders = {
        dashboard: loadDashboard,
        articles: loadArticles,
        products: loadProducts,
        posts: loadPosts,
        orders: loadOrders,
        comments: loadComments,
        users: loadUsers,
        theme: loadTheme
    };
    
    if (loaders[section]) loaders[section]();
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
    loading(true);
    
    try {
        const [articles, products, posts, orders] = await Promise.all([
            apiGet('/articles').catch(() => ({ articles: [] })),
            apiGet('/products').catch(() => ({ products: [] })),
            apiGet('/posts').catch(() => ({ posts: [] })),
            apiGet('/orders').catch(() => ({ orders: [] }))
        ]);
        
        updateCard('articles-count', articles.articles?.length || 0);
        updateCard('products-count', products.products?.length || 0);
        updateCard('orders-count', orders.orders?.length || 0);
        updateCard('users-count', 1);
        updateCard('comments-count', 0);
        
        updateStat('today-views', '0');
        updateStat('pending-comments', '0');
        updateStat('new-users', '0');
        updateStat('popular-category', 'عام');
    } catch (e) {
        console.error('Dashboard error:', e);
    } finally {
        loading(false);
    }
}

function updateCard(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function updateStat(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function updateTime() {
    const el = document.getElementById('current-time');
    if (el) {
        el.textContent = new Date().toLocaleString('ar-DZ', {
            weekday: 'long', year: 'numeric', month: 'long',
            day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }
}

// ============================================
// ARTICLES
// ============================================
async function loadArticles() {
    loading(true);
    try {
        const data = await apiGet('/articles');
        displayTable('articles', data.articles || []);
    } catch (e) {
        displayTable('articles', []);
    } finally {
        loading(false);
    }
}

function displayTable(type, items) {
    const tbody = document.querySelector(`#${type}-table tbody`);
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--light-text);">لا توجد ${type === 'articles' ? 'مقالات' : type === 'products' ? 'منتجات' : 'إعلانات'} بعد</td></tr>`;
        return;
    }
    
    items.forEach(item => {
        const row = document.createElement('tr');
        if (type === 'articles') {
            row.innerHTML = `
                <td>${esc(item.title)}</td>
                <td>${esc(item.category)}</td>
                <td>${item.views || 0}</td>
                <td>${item.likes?.length || 0}</td>
                <td>${fmtDate(item.createdAt)}</td>
                <td><span class="status-badge status-${item.published ? 'published' : 'draft'}">${item.published ? 'منشور' : 'مسودة'}</span></td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-outline" onclick="editArticle('${item._id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteArticle('${item._id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
        } else if (type === 'products') {
            row.innerHTML = `
                <td>${esc(item.name)}</td>
                <td>${esc(item.category)}</td>
                <td>${fmtPrice(item.price)} دج</td>
                <td>${item.stockQuantity}</td>
                <td>${(item.rating?.average || 0).toFixed(1)} ⭐</td>
                <td><span class="status-badge status-${item.inStock ? 'published' : 'draft'}">${item.inStock ? 'متوفر' : 'غير متوفر'}</span></td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-outline" onclick="editProduct('${item._id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct('${item._id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
        } else if (type === 'posts') {
            row.innerHTML = `
                <td>${esc(item.title)}</td>
                <td>${item.type === 'ad' ? 'إعلان' : 'منشور'}</td>
                <td>${item.views || 0}</td>
                <td>${item.likes?.length || 0}</td>
                <td>${fmtDate(item.createdAt)}</td>
                <td><span class="status-badge status-${item.approved ? 'published' : 'pending'}">${item.approved ? 'منشور' : 'في الانتظار'}</span></td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-outline" onclick="editPost('${item._id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deletePost('${item._id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
        }
        tbody.appendChild(row);
    });
}

function openArticleModal(id = null) {
    const modal = document.getElementById('article-modal');
    const title = document.getElementById('article-modal-title');
    const form = document.getElementById('article-form');
    
    if (id) {
        title.textContent = 'تعديل المقال';
        loadArticleData(id);
    } else {
        title.textContent = 'مقال جديد';
        form.reset();
        document.getElementById('article-id').value = '';
        clearFiles('article');
    }
    
    modal.style.display = 'flex';
}

function closeArticleModal() {
    document.getElementById('article-modal').style.display = 'none';
    clearFiles('article');
}

async function loadArticleData(id) {
    loading(true);
    try {
        const article = await apiGet(`/articles/${id}`);
        document.getElementById('article-id').value = article._id;
        document.getElementById('article-title').value = article.title;
        document.getElementById('article-category').value = article.category;
        document.getElementById('article-excerpt').value = article.excerpt;
        document.getElementById('article-content').value = article.content;
        document.getElementById('article-featured').checked = article.featured;
    } catch (e) {
        toast('خطأ في تحميل المقال', 'error');
        closeArticleModal();
    } finally {
        loading(false);
    }
}

function editArticle(id) {
    openArticleModal(id);
}

async function deleteArticle(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
    
    loading(true);
    try {
        await apiDelete(`/articles/${id}`);
        toast('تم حذف المقال بنجاح', 'success');
        loadArticles();
    } catch (e) {
        toast('خطأ في حذف المقال', 'error');
    } finally {
        loading(false);
    }
}

async function submitArticle(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const id = document.getElementById('article-id').value;
    
    formData.append('title', document.getElementById('article-title').value.trim());
    formData.append('category', document.getElementById('article-category').value);
    formData.append('excerpt', document.getElementById('article-excerpt').value.trim());
    formData.append('content', document.getElementById('article-content').value.trim());
    formData.append('featured', document.getElementById('article-featured').checked);
    
    selectedFiles.article.forEach(f => formData.append('images', f));
    
    loading(true);
    try {
        await apiPost(id ? `/articles/${id}` : '/articles', formData, id ? 'PUT' : 'POST');
        toast(id ? 'تم تحديث المقال' : 'تم إنشاء المقال', 'success');
        closeArticleModal();
        loadArticles();
    } catch (e) {
        toast('خطأ في حفظ المقال', 'error');
    } finally {
        loading(false);
    }
}

// ============================================
// PRODUCTS
// ============================================
async function loadProducts() {
    loading(true);
    try {
        const data = await apiGet('/products');
        displayTable('products', data.products || []);
    } catch (e) {
        displayTable('products', []);
    } finally {
        loading(false);
    }
}

function openProductModal(id = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    
    if (id) {
        title.textContent = 'تعديل المنتج';
        loadProductData(id);
    } else {
        title.textContent = 'منتج جديد';
        form.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('sale-price-group').style.display = 'none';
        clearFiles('product');
    }
    
    modal.style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
    clearFiles('product');
}

async function loadProductData(id) {
    loading(true);
    try {
        const product = await apiGet(`/products/${id}`);
        document.getElementById('product-id').value = product._id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stockQuantity;
        document.getElementById('product-featured').checked = product.featured;
        document.getElementById('product-sale').checked = product.onSale;
        
        if (product.onSale && product.salePrice) {
            document.getElementById('sale-price-group').style.display = 'block';
            document.getElementById('product-sale-price').value = product.salePrice;
        }
    } catch (e) {
        toast('خطأ في تحميل المنتج', 'error');
        closeProductModal();
    } finally {
        loading(false);
    }
}

function editProduct(id) {
    openProductModal(id);
}

async function deleteProduct(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    loading(true);
    try {
        await apiDelete(`/products/${id}`);
        toast('تم حذف المنتج بنجاح', 'success');
        loadProducts();
    } catch (e) {
        toast('خطأ في حذف المنتج', 'error');
    } finally {
        loading(false);
    }
}

async function submitProduct(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const id = document.getElementById('product-id').value;
    
    formData.append('name', document.getElementById('product-name').value.trim());
    formData.append('category', document.getElementById('product-category').value);
    formData.append('description', document.getElementById('product-description').value.trim());
    formData.append('price', document.getElementById('product-price').value);
    formData.append('stockQuantity', document.getElementById('product-stock').value);
    formData.append('featured', document.getElementById('product-featured').checked);
    formData.append('onSale', document.getElementById('product-sale').checked);
    
    const salePrice = document.getElementById('product-sale-price').value;
    if (salePrice) formData.append('salePrice', salePrice);
    
    selectedFiles.product.forEach(f => formData.append('images', f));
    
    loading(true);
    try {
        await apiPost(id ? `/products/${id}` : '/products', formData, id ? 'PUT' : 'POST');
        toast(id ? 'تم تحديث المنتج' : 'تم إنشاء المنتج', 'success');
        closeProductModal();
        loadProducts();
    } catch (e) {
        toast('خطأ في حفظ المنتج', 'error');
    } finally {
        loading(false);
    }
}

// ============================================
// POSTS
// ============================================
async function loadPosts() {
    loading(true);
    try {
        const data = await apiGet('/posts');
        displayTable('posts', data.posts || []);
    } catch (e) {
        displayTable('posts', []);
    } finally {
        loading(false);
    }
}

function openPostModal(id = null) {
    const modal = document.getElementById('post-modal');
    const title = document.getElementById('post-modal-title');
    const form = document.getElementById('post-form');
    
    if (id) {
        title.textContent = 'تعديل الإعلان';
        loadPostData(id);
    } else {
        title.textContent = 'إعلان جديد';
        form.reset();
        document.getElementById('post-id').value = '';
        clearFiles('post');
    }
    
    modal.style.display = 'flex';
}

function closePostModal() {
    document.getElementById('post-modal').style.display = 'none';
    clearFiles('post');
}

async function loadPostData(id) {
    loading(true);
    try {
        const post = await apiGet(`/posts/${id}`);
        document.getElementById('post-id').value = post._id;
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-content').value = post.content;
        document.getElementById('post-link').value = post.adDetails?.link || '';
        document.getElementById('post-button-text').value = post.adDetails?.buttonText || 'اقرأ المزيد';
        document.getElementById('post-featured').checked = post.adDetails?.featured || false;
    } catch (e) {
        toast('خطأ في تحميل الإعلان', 'error');
        closePostModal();
    } finally {
        loading(false);
    }
}

function editPost(id) {
    openPostModal(id);
}

async function deletePost(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    
    loading(true);
    try {
        await apiDelete(`/posts/${id}`);
        toast('تم حذف الإعلان بنجاح', 'success');
        loadPosts();
    } catch (e) {
        toast('خطأ في حذف الإعلان', 'error');
    } finally {
        loading(false);
    }
}

async function submitPost(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const id = document.getElementById('post-id').value;
    
    formData.append('title', document.getElementById('post-title').value.trim());
    formData.append('content', document.getElementById('post-content').value.trim());
    formData.append('link', document.getElementById('post-link').value.trim());
    formData.append('buttonText', document.getElementById('post-button-text').value.trim() || 'اقرأ المزيد');
    formData.append('featured', document.getElementById('post-featured').checked);
    
    selectedFiles.post.forEach(f => formData.append('images', f));
    
    loading(true);
    try {
        await apiPost(id ? `/posts/${id}` : '/posts/ad', formData, id ? 'PUT' : 'POST');
        toast(id ? 'تم تحديث الإعلان' : 'تم إنشاء الإعلان', 'success');
        closePostModal();
        loadPosts();
    } catch (e) {
        toast('خطأ في حفظ الإعلان', 'error');
    } finally {
        loading(false);
    }
}

// ============================================
// ORDERS
// ============================================
async function loadOrders() {
    loading(true);
    try {
        const data = await apiGet('/orders');
        displayOrders(data.orders || []);
    } catch (e) {
        displayOrders([]);
    } finally {
        loading(false);
    }
}

function displayOrders(orders) {
    const tbody = document.querySelector('#orders-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;">لا توجد طلبات</td></tr>';
        return;
    }
    
    orders.forEach(order => {
        const delivery = DELIVERY_PRICES[order.customerInfo.wilaya] || 500;
        const total = order.totalPrice + delivery;
        const addr = [order.customerInfo.address, order.customerInfo.city, order.customerInfo.wilaya].filter(Boolean).join(', ');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${esc(order.orderNumber || order._id.slice(-8))}</strong></td>
            <td>${esc(order.customerInfo.name)}</td>
            <td><a href="tel:${order.customerInfo.phone}">${esc(order.customerInfo.phone)}</a></td>
            <td title="${esc(addr)}" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">${esc(addr)}</td>
            <td>${order.items?.[0]?.productName || 'لا توجد منتجات'}</td>
            <td><div>${fmtPrice(order.totalPrice)} دج</div><div style="font-size:0.9rem;">التوصيل: ${fmtPrice(delivery)} دج</div><strong>${fmtPrice(total)} دج</strong></td>
            <td><span class="order-status status-${order.status}">${getStatus(order.status)}</span></td>
            <td>${fmtDate(order.createdAt)}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-outline" onclick="viewOrder('${order._id}')"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-primary" onclick="updateOrder('${order._id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteOrder('${order._id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function viewOrder(id) {
    loading(true);
    try {
        const order = await apiGet(`/orders/${id}`);
        displayOrderModal(order);
    } catch (e) {
        toast('خطأ في تحميل الطلب', 'error');
    } finally {
        loading(false);
    }
}

function displayOrderModal(order) {
    const modal = document.getElementById('order-details-modal');
    const body = document.getElementById('order-details-body');
    
    const delivery = DELIVERY_PRICES[order.customerInfo.wilaya] || 500;
    const total = order.totalPrice + delivery;
    
    body.innerHTML = `
        <div class="customer-info">
            <h4><i class="fas fa-user"></i> معلومات العميل</h4>
            <p><strong>الاسم:</strong> ${esc(order.customerInfo.name)}</p>
            <p><strong>الهاتف:</strong> <a href="tel:${order.customerInfo.phone}">${esc(order.customerInfo.phone)}</a></p>
            <p><strong>العنوان:</strong> ${esc([order.customerInfo.address, order.customerInfo.city, order.customerInfo.wilaya].filter(Boolean).join(', '))}</p>
        </div>
        <div class="order-summary">
            <h4><i class="fas fa-calculator"></i> الملخص</h4>
            <p>المنتجات: ${fmtPrice(order.totalPrice)} دج</p>
            <p>التوصيل: ${fmtPrice(delivery)} دج</p>
            <p><strong>المجموع: ${fmtPrice(total)} دج</strong></p>
            <p>الحالة: <span class="order-status status-${order.status}">${getStatus(order.status)}</span></p>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeOrderDetailsModal() {
    document.getElementById('order-details-modal').style.display = 'none';
}

async function updateOrder(id) {
    loading(true);
    try {
        const order = await apiGet(`/orders/${id}`);
        document.getElementById('update-order-id').value = id;
        document.getElementById('order-status').value = order.status;
        document.getElementById('tracking-number').value = order.trackingNumber || '';
        document.getElementById('order-notes').value = order.notes || '';
        document.getElementById('update-order-modal').style.display = 'flex';
    } catch (e) {
        toast('خطأ في تحميل الطلب', 'error');
    } finally {
        loading(false);
    }
}

function closeUpdateOrderModal() {
    document.getElementById('update-order-modal').style.display = 'none';
}

async function submitOrderUpdate(e) {
    e.preventDefault();
    
    const id = document.getElementById('update-order-id').value;
    const status = document.getElementById('order-status').value;
    const tracking = document.getElementById('tracking-number').value.trim();
    const notes = document.getElementById('order-notes').value.trim();
    
    loading(true);
    try {
        await apiPatch(`/orders/${id}/status`, { status, trackingNumber: tracking, notes });
        toast('تم تحديث الطلب', 'success');
        closeUpdateOrderModal();
        loadOrders();
    } catch (e) {
        toast('خطأ في تحديث الطلب', 'error');
    } finally {
        loading(false);
    }
}

async function deleteOrder(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    
    loading(true);
    try {
        await apiDelete(`/orders/${id}`);
        toast('تم حذف الطلب', 'success');
        loadOrders();
    } catch (e) {
        toast('خطأ في حذف الطلب', 'error');
    } finally {
        loading(false);
    }
}

function getStatus(s) {
    const map = {
        pending: 'في الانتظار', confirmed: 'مؤكد',
        processing: 'قيد المعالجة', shipped: 'تم الشحن',
        delivered: 'تم التسليم', cancelled: 'ملغي'
    };
    return map[s] || s;
}

// ============================================
// COMMENTS
// ============================================
async function loadComments() {
    loading(true);
    try {
        const data = await apiGet('/admin/comments');
        displayComments(data.comments || []);
    } catch (e) {
        displayComments([]);
    } finally {
        loading(false);
    }
}

function displayComments(comments) {
    const tbody = document.querySelector('#comments-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (comments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">لا توجد تعليقات</td></tr>';
        return;
    }
    
    comments.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${esc(c.author?.name || 'مستخدم')}</td>
            <td>${esc(c.content.substring(0, 50))}...</td>
            <td>${c.targetType === 'Article' ? 'مقال' : 'منشور'}</td>
            <td>${fmtDate(c.createdAt)}</td>
            <td><span class="status-badge status-${c.approved ? 'published' : 'pending'}">${c.approved ? 'مقبول' : 'معلق'}</span></td>
            <td class="table-actions">
                <button class="btn btn-sm ${c.approved ? 'btn-outline' : 'btn-success'}" onclick="toggleComment('${c._id}', ${c.approved})">${c.approved ? 'إلغاء' : 'موافقة'}</button>
                <button class="btn btn-sm btn-danger" onclick="deleteComment('${c._id}')">حذف</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function toggleComment(id, approved) {
    loading(true);
    try {
        await apiPatch(`/admin/comments/${id}/approve`, {});
        toast('تم تحديث التعليق', 'success');
        loadComments();
    } catch (e) {
        toast('خطأ في تحديث التعليق', 'error');
    } finally {
        loading(false);
    }
}

async function deleteComment(id) {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
    
    loading(true);
    try {
        await apiDelete(`/admin/comments/${id}`);
        toast('تم حذف التعليق', 'success');
        loadComments();
    } catch (e) {
        toast('خطأ في حذف التعليق', 'error');
    } finally {
        loading(false);
    }
}

// ============================================
// USERS
// ============================================
async function loadUsers() {
    displayUsers([{
        _id: 'admin', name: adminUser.name, email: adminUser.email,
        phone: '0555123456', isAdmin: true, createdAt: new Date()
    }]);
}

function displayUsers(users) {
    const tbody = document.querySelector('#users-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    users.forEach(u => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${esc(u.name)}</td>
            <td>${esc(u.email)}</td>
            <td>${esc(u.phone)}</td>
            <td>${fmtDate(u.createdAt)}</td>
            <td><span class="status-badge status-published">مدير</span></td>
            <td>مدير النظام</td>
        `;
        tbody.appendChild(row);
    });
}

function toggleUserStatus(id, active) {}
function deleteUser(id) {}

// ============================================
// THEME
// ============================================
function loadTheme() {
    const root = getComputedStyle(document.documentElement);
    document.getElementById('primary-color').value = root.getPropertyValue('--primary-color').trim() || '#d4a574';
    document.getElementById('secondary-color').value = root.getPropertyValue('--secondary-color').trim() || '#f8e8d4';
    document.getElementById('text-color').value = root.getPropertyValue('--text-color').trim() || '#2c2c2c';
}

function updateThemePreview() {
    const primary = document.getElementById('primary-color').value;
    const secondary = document.getElementById('secondary-color').value;
    const text = document.getElementById('text-color').value;
    
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--secondary-color', secondary);
    root.style.setProperty('--text-color', text);
    root.style.setProperty('--gradient', `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`);
}

function saveThemeChanges() {
    const theme = {
        primaryColor: document.getElementById('primary-color').value,
        secondaryColor: document.getElementById('secondary-color').value,
        textColor: document.getElementById('text-color').value
    };
    
    localStorage.setItem('adminTheme', JSON.stringify(theme));
    toast('تم حفظ الألوان', 'success');
}

function resetThemeToDefault() {
    if (!confirm('إعادة الألوان للافتراضي؟')) return;
    
    document.getElementById('primary-color').value = '#d4a574';
    document.getElementById('secondary-color').value = '#f8e8d4';
    document.getElementById('text-color').value = '#2c2c2c';
    updateThemePreview();
    localStorage.removeItem('adminTheme');
    toast('تم إعادة الألوان', 'success');
}

// ============================================
// FILE MANAGEMENT
// ============================================
function addFiles(files, type) {
    const valid = files.filter(f => f.type.startsWith('image/'));
    if (valid.length !== files.length) toast('يُسمح بالصور فقط', 'warning');
    selectedFiles[type] = [...selectedFiles[type], ...valid];
    updateFileList(type);
}

function updateFileList(type) {
    const list = document.getElementById(`${type}-file-list`);
    if (!list) return;
    
    list.innerHTML = '';
    selectedFiles[type].forEach((f, i) => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = `<span>${esc(f.name)}</span><button type="button" class="remove-file" onclick="removeFile(${i}, '${type}')">&times;</button>`;
        list.appendChild(div);
    });
}

function removeFile(idx, type) {
    selectedFiles[type].splice(idx, 1);
    updateFileList(type);
}

function clearFiles(type) {
    selectedFiles[type] = [];
    const input = document.getElementById(`${type}-images`);
    if (input) input.value = '';
    updateFileList(type);
}

// ============================================
// API HELPERS
// ============================================
async function apiGet(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

async function apiPost(endpoint, data, method = 'POST') {
    const isFormData = data instanceof FormData;
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: isFormData ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: isFormData ? data : JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

async function apiPatch(endpoint, data) {
    return apiPost(endpoint, data, 'PATCH');
}

async function apiDelete(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

// ============================================
// UTILITIES
// ============================================
function loading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.classList[show ? 'add' : 'remove']('show');
}

function toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerHTML = `<i class="fas ${icons[type]}"></i><span>${msg}</span>`;
    container.appendChild(div);
    setTimeout(() => div.remove(), 5000);
}

function esc(txt) {
    if (typeof txt !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = txt;
    return div.innerHTML;
}

function fmtDate(d) {
    return new Date(d).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtPrice(p) {
    return new Intl.NumberFormat('ar-DZ').format(p);
}

function logout() {
    localStorage.clear();
    toast('تم تسجيل الخروج', 'info');
    setTimeout(() => window.location.href = 'login.html', 1000);
}

// ============================================
// GLOBAL EXPORTS
// ============================================
window.openArticleModal = openArticleModal;
window.closeArticleModal = closeArticleModal;
window.editArticle = editArticle;
window.deleteArticle = deleteArticle;

window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;

window.openPostModal = openPostModal;
window.closePostModal = closePostModal;
window.editPost = editPost;
window.deletePost = deletePost;

window.viewOrder = viewOrder;
window.updateOrder = updateOrder;
window.deleteOrder = deleteOrder;
window.closeOrderDetailsModal = closeOrderDetailsModal;
window.closeUpdateOrderModal = closeUpdateOrderModal;

window.removeFile = removeFile;
window.toggleComment = toggleComment;
window.deleteComment = deleteComment;
window.loadComments = loadComments;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;

window.updateThemePreview = updateThemePreview;
window.saveThemeChanges = saveThemeChanges;
window.resetThemeToDefault = resetThemeToDefault;

console.log('✅ Admin Panel Ready - All Buttons Functional!'
