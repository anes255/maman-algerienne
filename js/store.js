// Store Management - Complete Version with Order Integration
let storePage = 1;
let storeFilters = {
    category: '',
    sort: 'createdAt',
    featured: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    stock: ''
};
let storeLoading = false;
let selectedProduct = null;
let wishlist = [];
let cart = [];

// Initialize store
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on a store page
    if (window.location.pathname.includes('store.html')) {
        initializeStore();
    }
});

function initializeStore() {
    console.log('Initializing store...');
    setupEventListeners();
    loadProducts();
    loadWishlist();
    loadCart();
    updateCartUI();
    updateWishlistUI();
}

function setupEventListeners() {
    // Filter event listeners
    setupFilterListeners();
    
    // Search functionality
    setupSearchListeners();
    
    // Load more products
    const loadMoreBtn = document.getElementById('load-more-products');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            storePage++;
            loadProducts();
        });
    }

    // Modal close handlers
    setupModalHandlers();
    
    // Cart icon click handler - add if not exists
    setupCartIcon();
}

function setupCartIcon() {
    // Add cart icon to nav if it doesn't exist
    const navActions = document.querySelector('.nav-actions');
    if (navActions && !document.getElementById('cart-icon')) {
        const cartIcon = document.createElement('div');
        cartIcon.id = 'cart-icon';
        cartIcon.className = 'cart-icon';
        cartIcon.style.cssText = `
            position: relative;
            cursor: pointer;
            margin-left: 1rem;
            padding: 0.5rem;
        `;
        cartIcon.innerHTML = `
            <i class="fas fa-shopping-cart" style="font-size: 1.2rem; color: var(--primary-color);"></i>
            <span id="cart-count" class="cart-count" style="
                position: absolute;
                top: -5px;
                right: -5px;
                background: #e74c3c;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                font-weight: bold;
                display: none;
            ">0</span>
        `;
        cartIcon.onclick = () => showCart();
        navActions.insertBefore(cartIcon, navActions.firstChild);
    }
}

function setupFilterListeners() {
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const featuredFilter = document.getElementById('featured-filter');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            storeFilters.category = e.target.value;
            resetAndReload();
        });
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            storeFilters.sort = e.target.value;
            resetAndReload();
        });
    }

    if (featuredFilter) {
        featuredFilter.addEventListener('change', (e) => {
            storeFilters.featured = e.target.value;
            resetAndReload();
        });
    }
}

function setupSearchListeners() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');

    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
}

function setupModalHandlers() {
    // Product modal
    const productModal = document.getElementById('product-modal');
    if (productModal) {
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) {
                closeProductModal();
            }
        });
    }
}

function resetAndReload() {
    storePage = 1;
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        productsGrid.innerHTML = '';
    }
    loadProducts();
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        storeFilters.search = searchInput.value.trim();
        resetAndReload();
    }
}

// Cart Management Functions
function loadCart() {
    const savedCart = localStorage.getItem('mama_cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (error) {
            console.error('Error loading cart:', error);
            cart = [];
        }
    }
}

function saveCart() {
    localStorage.setItem('mama_cart', JSON.stringify(cart));
}

function addToCart(productId, quantity = 1) {
    if (!selectedProduct) return;
    
    if (!selectedProduct.inStock) {
        showStoreToast('المنتج غير متوفر حالياً', 'warning');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > selectedProduct.stockQuantity) {
            showStoreToast(`الكمية المتوفرة فقط ${selectedProduct.stockQuantity}`, 'warning');
            return;
        }
        existingItem.quantity = newQuantity;
    } else {
        if (quantity > selectedProduct.stockQuantity) {
            showStoreToast(`الكمية المتوفرة فقط ${selectedProduct.stockQuantity}`, 'warning');
            return;
        }
        
        const cartItem = {
            id: productId,
            name: selectedProduct.name,
            price: selectedProduct.onSale && selectedProduct.salePrice ? selectedProduct.salePrice : selectedProduct.price,
            originalPrice: selectedProduct.price,
            image: selectedProduct.images[0],
            quantity: quantity,
            inStock: selectedProduct.inStock,
            stockQuantity: selectedProduct.stockQuantity
        };
        cart.push(cartItem);
    }
    
    saveCart();
    updateCartUI();
    showStoreToast('تم إضافة المنتج للسلة', 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    showStoreToast('تم إزالة المنتج من السلة', 'success');
}

function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }
        
        if (newQuantity > item.stockQuantity) {
            showStoreToast(`الكمية المتوفرة فقط ${item.stockQuantity}`, 'warning');
            return;
        }
        
        item.quantity = newQuantity;
        saveCart();
        updateCartUI();
    }
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function showCart() {
    if (cart.length === 0) {
        showStoreToast('السلة فارغة', 'info');
        return;
    }
    
    const modal = document.getElementById('product-modal');
    const modalBody = document.getElementById('modal-body');
    
    if (!modal || !modalBody) return;
    
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    modalBody.innerHTML = `
        <div style="padding: 2rem;">
            <h3 style="text-align: center; margin-bottom: 2rem; color: var(--primary-color);">
                <i class="fas fa-shopping-cart"></i> سلة المشتريات
            </h3>
            
            <div class="cart-items" style="max-height: 400px; overflow-y: auto; margin-bottom: 2rem;">
                ${cart.map(item => `
                    <div class="cart-item" style="
                        display: flex;
                        align-items: center;
                        padding: 1rem;
                        border-bottom: 1px solid var(--border-color);
                        gap: 1rem;
                    ">
                        <img src="http://localhost:5000/uploads/products/${item.image}" 
                             alt="${escapeHtml(item.name)}" 
                             style="width: 60px; height: 60px; object-fit: cover; border-radius: var(--border-radius);"
                             onerror="this.src='https://via.placeholder.com/60x60/d4a574/ffffff?text=منتج'">
                        
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem;">${escapeHtml(item.name)}</h4>
                            <div style="color: var(--primary-color); font-weight: bold;">
                                ${formatPrice(item.price)} دج
                                ${item.price < item.originalPrice ? `<span style="text-decoration: line-through; color: var(--light-text); margin-right: 0.5rem;">${formatPrice(item.originalPrice)} دج</span>` : ''}
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})" 
                                    style="width: 30px; height: 30px; border: 1px solid var(--primary-color); background: white; color: var(--primary-color); border-radius: 50%; cursor: pointer;">-</button>
                            <span style="min-width: 30px; text-align: center; font-weight: bold;">${item.quantity}</span>
                            <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})" 
                                    style="width: 30px; height: 30px; border: 1px solid var(--primary-color); background: white; color: var(--primary-color); border-radius: 50%; cursor: pointer;">+</button>
                            <button onclick="removeFromCart('${item.id}')" 
                                    style="width: 30px; height: 30px; border: 1px solid #dc3545; background: white; color: #dc3545; border-radius: 50%; cursor: pointer; margin-right: 0.5rem;">×</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                background: var(--secondary-color);
                border-radius: var(--border-radius);
                font-size: 1.2rem;
                font-weight: bold;
                margin-bottom: 2rem;
            ">
                <span>المجموع الكلي:</span>
                <span style="color: var(--primary-color);">${formatPrice(totalPrice)} دج</span>
            </div>
            
            <div style="display: flex; gap: 1rem;">
                <button class="btn btn-outline" onclick="closeProductModal()" style="flex: 1;">
                    متابعة التسوق
                </button>
                <button class="btn btn-primary" onclick="proceedToCartCheckout()" style="flex: 2;">
                    <i class="fas fa-credit-card"></i> إتمام الطلب
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function proceedToCartCheckout() {
    if (cart.length === 0) {
        showStoreToast('السلة فارغة', 'warning');
        return;
    }
    
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;
    
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    modalBody.innerHTML = `
        <div style="padding: 2rem;">
            <h3 style="text-align: center; margin-bottom: 2rem; color: var(--primary-color);">
                <i class="fas fa-credit-card"></i> إتمام الطلب
            </h3>
            
            <div class="order-summary" style="
                background: var(--white);
                border: 2px solid var(--primary-color);
                border-radius: var(--border-radius);
                padding: 1.5rem;
                margin-bottom: 2rem;
            ">
                <h4>ملخص الطلب:</h4>
                ${cart.map(item => `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>${escapeHtml(item.name)} × ${item.quantity}</span>
                        <span>${formatPrice(item.price * item.quantity)} دج</span>
                    </div>
                `).join('')}
                <div style="
                    display: flex;
                    justify-content: space-between;
                    font-weight: 700;
                    font-size: 1.2rem;
                    color: var(--primary-color);
                    border-top: 2px solid var(--border-color);
                    padding-top: 0.5rem;
                    margin-top: 0.5rem;
                ">
                    <span>المجموع الكلي:</span>
                    <span>${formatPrice(totalPrice)} دج</span>
                </div>
            </div>
            
            <form class="checkout-form" id="cart-checkout-form" style="
                background: var(--secondary-color);
                padding: 2rem;
                border-radius: var(--border-radius);
                margin-bottom: 2rem;
            ">
                <h4>معلومات العميل:</h4>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-color); font-weight: 500;">الاسم الكامل *</label>
                        <input type="text" id="cart-customer-name" required style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid var(--border-color);
                            border-radius: var(--border-radius);
                            font-family: inherit;
                        ">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-color); font-weight: 500;">رقم الهاتف *</label>
                        <input type="tel" id="cart-customer-phone" required placeholder="0555123456" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid var(--border-color);
                            border-radius: var(--border-radius);
                            font-family: inherit;
                        ">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-color); font-weight: 500;">الولاية *</label>
                        <select id="cart-customer-wilaya" required style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid var(--border-color);
                            border-radius: var(--border-radius);
                            font-family: inherit;
                        ">
                            <option value="">اختر الولاية</option>
                            <option value="01 - أدرار">01 - أدرار</option>
                            <option value="02 - الشلف">02 - الشلف</option>
                            <option value="03 - الأغواط">03 - الأغواط</option>
                            <option value="04 - أم البواقي">04 - أم البواقي</option>
                            <option value="05 - باتنة">05 - باتنة</option>
                            <option value="06 - بجاية">06 - بجاية</option>
                            <option value="07 - بسكرة">07 - بسكرة</option>
                            <option value="08 - بشار">08 - بشار</option>
                            <option value="09 - البليدة">09 - البليدة</option>
                            <option value="10 - البويرة">10 - البويرة</option>
                            <option value="11 - تمنراست">11 - تمنراست</option>
                            <option value="12 - تبسة">12 - تبسة</option>
                            <option value="13 - تلمسان">13 - تلمسان</option>
                            <option value="14 - تيارت">14 - تيارت</option>
                            <option value="15 - تيزي وزو">15 - تيزي وزو</option>
                            <option value="16 - الجزائر">16 - الجزائر</option>
                            <option value="17 - الجلفة">17 - الجلفة</option>
                            <option value="18 - جيجل">18 - جيجل</option>
                            <option value="19 - سطيف">19 - سطيف</option>
                            <option value="20 - سعيدة">20 - سعيدة</option>
                            <option value="21 - سكيكدة">21 - سكيكدة</option>
                            <option value="22 - سيدي بلعباس">22 - سيدي بلعباس</option>
                            <option value="23 - عنابة">23 - عنابة</option>
                            <option value="24 - قالمة">24 - قالمة</option>
                            <option value="25 - قسنطينة">25 - قسنطينة</option>
                            <option value="26 - المدية">26 - المدية</option>
                            <option value="27 - مستغانم">27 - مستغانم</option>
                            <option value="28 - المسيلة">28 - المسيلة</option>
                            <option value="29 - معسكر">29 - معسكر</option>
                            <option value="30 - ورقلة">30 - ورقلة</option>
                            <option value="31 - وهران">31 - وهران</option>
                            <option value="32 - البيض">32 - البيض</option>
                            <option value="33 - إليزي">33 - إليزي</option>
                            <option value="34 - برج بوعريريج">34 - برج بوعريريج</option>
                            <option value="35 - بومرداس">35 - بومرداس</option>
                            <option value="36 - الطارف">36 - الطارف</option>
                            <option value="37 - تندوف">37 - تندوف</option>
                            <option value="38 - تيسمسيلت">38 - تيسمسيلت</option>
                            <option value="39 - الوادي">39 - الوادي</option>
                            <option value="40 - خنشلة">40 - خنشلة</option>
                            <option value="41 - سوق أهراس">41 - سوق أهراس</option>
                            <option value="42 - تيبازة">42 - تيبازة</option>
                            <option value="43 - ميلة">43 - ميلة</option>
                            <option value="44 - عين الدفلى">44 - عين الدفلى</option>
                            <option value="45 - النعامة">45 - النعامة</option>
                            <option value="46 - عين تموشنت">46 - عين تموشنت</option>
                            <option value="47 - غرداية">47 - غرداية</option>
                            <option value="48 - غليزان">48 - غليزان</option>
                            <option value="49 - تيميمون">49 - تيميمون</option>
                            <option value="50 - برج باجي مختار">50 - برج باجي مختار</option>
                            <option value="51 - أولاد جلال">51 - أولاد جلال</option>
                            <option value="52 - بني عباس">52 - بني عباس</option>
                            <option value="53 - عين صالح">53 - عين صالح</option>
                            <option value="54 - عين قزام">54 - عين قزام</option>
                            <option value="55 - توقرت">55 - توقرت</option>
                            <option value="56 - جانت">56 - جانت</option>
                            <option value="57 - المقر">57 - المقر</option>
                            <option value="58 - المنيعة">58 - المنيعة</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-color); font-weight: 500;">البلدية</label>
                        <input type="text" id="cart-customer-city" placeholder="اسم البلدية" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid var(--border-color);
                            border-radius: var(--border-radius);
                            font-family: inherit;
                        ">
                    </div>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-color); font-weight: 500;">العنوان التفصيلي *</label>
                    <textarea id="cart-customer-address" required rows="3" 
                              placeholder="الحي، الشارع، رقم المنزل..." style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 2px solid var(--border-color);
                        border-radius: var(--border-radius);
                        font-family: inherit;
                        resize: vertical;
                    "></textarea>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-color); font-weight: 500;">ملاحظات إضافية</label>
                    <textarea id="cart-customer-notes" rows="2" 
                              placeholder="أي ملاحظات خاصة بطلبكم..." style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 2px solid var(--border-color);
                        border-radius: var(--border-radius);
                        font-family: inherit;
                        resize: vertical;
                    "></textarea>
                </div>
            </form>
            
            <div style="display: flex; gap: 1rem;">
                <button type="button" class="btn btn-outline" onclick="showCart()" style="flex: 1;">
                    العودة للسلة
                </button>
                <button type="button" class="btn btn-primary" onclick="submitCartOrder()" style="flex: 2;">
                    <i class="fas fa-check"></i> تأكيد الطلب
                </button>
            </div>
        </div>
    `;
}

// Send order to backend API - COMPLETED
async function submitCartOrder() {
    const customerInfo = {
        name: document.getElementById('cart-customer-name')?.value.trim(),
        phone: document.getElementById('cart-customer-phone')?.value.trim(),
        wilaya: document.getElementById('cart-customer-wilaya')?.value,
        city: document.getElementById('cart-customer-city')?.value.trim(),
        address: document.getElementById('cart-customer-address')?.value.trim(),
        notes: document.getElementById('cart-customer-notes')?.value.trim()
    };
    
    // Validate required fields
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.wilaya || !customerInfo.address) {
        showStoreToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
        return;
    }
    
    // Validate phone number
    const phoneRegex = /^0[5-7][0-9]{8}$/;
    if (!phoneRegex.test(customerInfo.phone)) {
        showStoreToast('رقم الهاتف غير صحيح. يجب أن يكون 10 أرقام يبدأ بـ 05, 06, أو 07', 'warning');
        return;
    }
    
    if (cart.length === 0) {
        showStoreToast('السلة فارغة', 'warning');
        return;
    }
    
    try {
        showStoreLoading();
        
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Create order data to send to backend
        const orderData = {
            items: cart,
            customerInfo,
            totalPrice
        };
        
        // Send to backend API
        const response = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Show success with order details
            showOrderConfirmation({
                ...orderData,
                orderNumber: data.order?.orderNumber || 'ORD-' + Date.now().toString().slice(-8),
                status: data.order?.status || 'pending'
            });
            
            // Clear cart after successful order
            cart = [];
            saveCart();
            updateCartUI();
            
            showStoreToast('تم إرسال طلبك بنجاح! سنتواصل معك قريباً', 'success');
        } else {
            showStoreToast(data.message || 'حدث خطأ في إرسال الطلب، يرجى المحاولة مرة أخرى', 'error');
        }
        
    } catch (error) {
        console.error('Error submitting cart order:', error);
        showStoreToast('خطأ في الاتصال بالخادم، يرجى المحاولة مرة أخرى', 'error');
    } finally {
        hideStoreLoading();
    }
}

// Show order confirmation
function showOrderConfirmation(orderData) {
    const modal = document.getElementById('product-modal');
    const modalBody = document.getElementById('modal-body');
    
    if (!modal || !modalBody) return;
    
    modalBody.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <div style="color: #28a745; font-size: 4rem; margin-bottom: 1rem;">
                <i class="fas fa-check-circle"></i>
            </div>
            
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">
                تم تأكيد طلبك بنجاح!
            </h3>
            
            <div style="background: var(--secondary-color); padding: 1.5rem; border-radius: var(--border-radius); margin-bottom: 2rem; text-align: right;">
                <p><strong>رقم الطلب:</strong> ${orderData.orderNumber}</p>
                <p><strong>العميل:</strong> ${escapeHtml(orderData.customerInfo.name)}</p>
                <p><strong>الهاتف:</strong> ${escapeHtml(orderData.customerInfo.phone)}</p>
                <p><strong>الولاية:</strong> ${escapeHtml(orderData.customerInfo.wilaya)}</p>
                <p><strong>المجموع:</strong> ${formatPrice(orderData.totalPrice)} دج</p>
                <p><strong>الحالة:</strong> في الانتظار</p>
            </div>
            
            <p style="color: var(--light-text); margin-bottom: 2rem;">
                سيتم التواصل معكم خلال 24 ساعة لتأكيد الطلب وتحديد موعد التسليم
            </p>
            
            <button class="btn btn-primary" onclick="closeProductModal()">العودة للمتجر</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Wishlist Management Functions
function loadWishlist() {
    const savedWishlist = localStorage.getItem('mama_wishlist');
    if (savedWishlist) {
        try {
            wishlist = JSON.parse(savedWishlist);
        } catch (error) {
            console.error('Error loading wishlist:', error);
            wishlist = [];
        }
    }
}

function saveWishlist() {
    localStorage.setItem('mama_wishlist', JSON.stringify(wishlist));
}

function addToWishlist(productId) {
    const index = wishlist.indexOf(productId);
    if (index > -1) {
        wishlist.splice(index, 1);
        showStoreToast('تم إزالة المنتج من المفضلة', 'success');
    } else {
        wishlist.push(productId);
        showStoreToast('تم إضافة المنتج للمفضلة', 'success');
    }
    saveWishlist();
    updateWishlistUI();
}

function updateWishlistUI() {
    // Update heart icons in product cards
    const heartButtons = document.querySelectorAll('[onclick*="addToWishlist"]');
    heartButtons.forEach(button => {
        const productId = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        const isInWishlist = wishlist.includes(productId);
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = isInWishlist ? 'fas fa-heart' : 'far fa-heart';
            button.style.color = isInWishlist ? '#e74c3c' : '';
        }
    });
}

// Product loading and display - COMPLETED
async function loadProducts() {
    if (storeLoading) return;

    try {
        storeLoading = true;
        showStoreLoading();

        console.log('Loading products...');

        // Build query parameters
        const params = new URLSearchParams({
            page: storePage,
            limit: 12,
            sort: storeFilters.sort
        });

        // Add filters
        Object.entries(storeFilters).forEach(([key, value]) => {
            if (value && key !== 'sort') {
                params.append(key, value);
            }
        });

        const response = await fetch(`http://localhost:5000/api/products?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        displayProducts(data.products || []);
        updateProductsPagination(data.pagination);

    } catch (error) {
        console.error('Error loading products:', error);
        displayProducts([]);
        showStoreToast('خطأ في تحميل المنتجات', 'error');
    } finally {
        storeLoading = false;
        hideStoreLoading();
    }
}

function displayProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    if (storePage === 1) {
        productsGrid.innerHTML = '';
    }

    if (products.length === 0 && storePage === 1) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-box-open" style="font-size: 4rem; color: var(--light-text); margin-bottom: 1rem;"></i>
                <h3>لا توجد منتجات</h3>
                <p>لم نجد أي منتجات تطابق معايير البحث</p>
            </div>
        `;
        return;
    }

    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imageUrl = product.images && product.images.length > 0 
        ? `http://localhost:5000/uploads/products/${product.images[0]}`
        : 'https://via.placeholder.com/300x200/d4a574/ffffff?text=منتج';

    const originalPrice = product.price;
    const currentPrice = product.onSale && product.salePrice ? product.salePrice : product.price;
    const discount = product.onSale && product.salePrice 
        ? Math.round(((originalPrice - product.salePrice) / originalPrice) * 100)
        : 0;

    card.innerHTML = `
        <div class="product-image-container" style="position: relative;">
            <img src="${imageUrl}" alt="${escapeHtml(product.name)}" 
                 class="product-image" style="width: 100%; height: 200px; object-fit: cover;"
                 onerror="this.src='https://via.placeholder.com/300x200/d4a574/ffffff?text=منتج'">
            
            ${product.onSale ? `
                <div class="sale-badge" style="
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: #e74c3c;
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    font-weight: bold;
                ">-${discount}%</div>
            ` : ''}
            
            ${product.featured ? `
                <div class="featured-badge" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: var(--primary-color);
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: 15px;
                    font-size: 0.8rem;
                ">مميز</div>
            ` : ''}
            
            <div class="product-actions" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                opacity: 0;
                transition: var(--transition);
                display: flex;
                gap: 0.5rem;
            ">
                <button onclick="viewProduct('${product._id}')" class="btn btn-primary" style="
                    padding: 0.5rem 1rem;
                    font-size: 0.9rem;
                ">عرض</button>
                <button onclick="addToWishlist('${product._id}')" style="
                    width: 40px;
                    height: 40px;
                    border: none;
                    background: white;
                    border-radius: 50%;
                    color: var(--primary-color);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <i class="${wishlist.includes(product._id) ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
        </div>
        
        <div class="product-content" style="padding: 1rem;">
            <h3 class="product-name" style="
                font-size: 1.1rem;
                margin-bottom: 0.5rem;
                color: var(--text-color);
                line-height: 1.3;
            ">${escapeHtml(product.name)}</h3>
            
            <div class="product-rating" style="margin-bottom: 0.5rem;">
                ${generateStarRating(product.rating?.average || 0)}
                <span style="color: var(--light-text); font-size: 0.9rem;">
                    (${product.rating?.count || 0})
                </span>
            </div>
            
            <div class="product-price" style="margin-bottom: 1rem;">
                <span class="current-price" style="
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: var(--primary-color);
                ">${formatPrice(currentPrice)} دج</span>
                
                ${product.onSale && product.salePrice ? `
                    <span class="original-price" style="
                        text-decoration: line-through;
                        color: var(--light-text);
                        margin-right: 0.5rem;
                    ">${formatPrice(originalPrice)} دج</span>
                ` : ''}
            </div>
            
            <div class="product-stock" style="margin-bottom: 1rem;">
                ${product.inStock && product.stockQuantity > 0 ? `
                    <span style="color: #28a745; font-size: 0.9rem;">
                        <i class="fas fa-check-circle"></i> متوفر (${product.stockQuantity})
                    </span>
                ` : `
                    <span style="color: #dc3545; font-size: 0.9rem;">
                        <i class="fas fa-times-circle"></i> غير متوفر
                    </span>
                `}
            </div>
            
            <button onclick="quickAddToCart('${product._id}')" 
                    class="btn btn-primary" 
                    style="width: 100%;"
                    ${!product.inStock || product.stockQuantity <= 0 ? 'disabled' : ''}>
                <i class="fas fa-shopping-cart"></i> 
                ${product.inStock && product.stockQuantity > 0 ? 'أضف للسلة' : 'غير متوفر'}
            </button>
        </div>
    `;

    // Add hover effect for product actions
    const imageContainer = card.querySelector('.product-image-container');
    const actions = card.querySelector('.product-actions');
    
    imageContainer.addEventListener('mouseenter', () => {
        actions.style.opacity = '1';
    });
    
    imageContainer.addEventListener('mouseleave', () => {
        actions.style.opacity = '0';
    });

    return card;
}

function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star" style="color: #ffc107;"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt" style="color: #ffc107;"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star" style="color: #ffc107;"></i>';
    }
    
    return starsHtml;
}

function updateProductsPagination(pagination) {
    const loadMoreBtn = document.getElementById('load-more-products');
    if (loadMoreBtn) {
        if (storePage >= (pagination?.pages || 1)) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }
}

// Product interaction functions
async function viewProduct(productId) {
    try {
        showStoreLoading();
        
        const response = await fetch(`http://localhost:5000/api/products/${productId}`);
        const product = await response.json();
        
        if (response.ok) {
            selectedProduct = product;
            showProductModal(product);
        } else {
            showStoreToast('خطأ في تحميل تفاصيل المنتج', 'error');
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showStoreToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideStoreLoading();
    }
}

function quickAddToCart(productId) {
    // Find product in current loaded products
    const productCards = document.querySelectorAll('.product-card');
    let productData = null;
    
    productCards.forEach(card => {
        const cardProductId = card.querySelector('[onclick*="quickAddToCart"]')
            ?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        
        if (cardProductId === productId) {
            const name = card.querySelector('.product-name').textContent;
            const priceText = card.querySelector('.current-price').textContent;
            const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
            const image = card.querySelector('.product-image').src.split('/').pop();
            const stockText = card.querySelector('.product-stock').textContent;
            const stock = parseInt(stockText.match(/\d+/)?.[0] || '0');
            
            productData = {
                _id: productId,
                name: name,
                price: price,
                images: [image],
                inStock: true,
                stockQuantity: stock
            };
        }
    });
    
    if (productData) {
        selectedProduct = productData;
        addToCart(productId, 1);
    } else {
        // Fallback: load product details
        viewProduct(productId);
    }
}

function showProductModal(product) {
    const modal = document.getElementById('product-modal');
    const modalBody = document.getElementById('modal-body');
    
    if (!modal || !modalBody) return;
    
    const imageUrl = product.images && product.images.length > 0 
        ? `http://localhost:5000/uploads/products/${product.images[0]}`
        : 'https://via.placeholder.com/400x300/d4a574/ffffff?text=منتج';

    const currentPrice = product.onSale && product.salePrice ? product.salePrice : product.price;
    
    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2rem;">
            <div class="product-images">
                <img src="${imageUrl}" alt="${escapeHtml(product.name)}" 
                     style="width: 100%; border-radius: var(--border-radius);"
                     onerror="this.src='https://via.placeholder.com/400x300/d4a574/ffffff?text=منتج'">
            </div>
            
            <div class="product-details">
                <h2 style="color: var(--primary-color); margin-bottom: 1rem;">
                    ${escapeHtml(product.name)}
                </h2>
                
                <div class="product-rating" style="margin-bottom: 1rem;">
                    ${generateStarRating(product.rating?.average || 0)}
                    <span style="color: var(--light-text);">(${product.rating?.count || 0} تقييم)</span>
                </div>
                
                <div class="product-price" style="margin-bottom: 1rem;">
                    <span style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">
                        ${formatPrice(currentPrice)} دج
                    </span>
                    
                    ${product.onSale && product.salePrice ? `
                        <span style="text-decoration: line-through; color: var(--light-text); margin-right: 1rem;">
                            ${formatPrice(product.price)} دج
                        </span>
                        <span style="color: #e74c3c; font-weight: bold;">
                            وفر ${formatPrice(product.price - product.salePrice)} دج
                        </span>
                    ` : ''}
                </div>
                
                <p style="color: var(--light-text); margin-bottom: 1.5rem; line-height: 1.6;">
                    ${escapeHtml(product.description)}
                </p>
                
                <div class="product-stock" style="margin-bottom: 1.5rem;">
                    ${product.inStock && product.stockQuantity > 0 ? `
                        <span style="color: #28a745;">
                            <i class="fas fa-check-circle"></i> متوفر - ${product.stockQuantity} قطعة
                        </span>
                    ` : `
                        <span style="color: #dc3545;">
                            <i class="fas fa-times-circle"></i> غير متوفر حالياً
                        </span>
                    `}
                </div>
                
                ${product.inStock && product.stockQuantity > 0 ? `
                    <div class="quantity-selector" style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">الكمية:</label>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <button onclick="changeQuantity(-1)" style="
                                width: 40px; height: 40px; border: 1px solid var(--primary-color);
                                background: white; color: var(--primary-color); border-radius: 50%;
                                cursor: pointer; display: flex; align-items: center; justify-content: center;
                            ">-</button>
                            <input type="number" id="product-quantity" value="1" min="1" max="${product.stockQuantity}" 
                                   style="width: 80px; padding: 0.5rem; text-align: center; border: 1px solid var(--border-color); border-radius: var(--border-radius);">
                            <button onclick="changeQuantity(1)" style="
                                width: 40px; height: 40px; border: 1px solid var(--primary-color);
                                background: white; color: var(--primary-color); border-radius: 50%;
                                cursor: pointer; display: flex; align-items: center; justify-content: center;
                            ">+</button>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button onclick="addToCartFromModal()" class="btn btn-primary" style="flex: 2;">
                            <i class="fas fa-shopping-cart"></i> أضف للسلة
                        </button>
                        <button onclick="addToWishlist('${product._id}')" style="
                            width: 50px; height: 50px; border: 1px solid var(--primary-color);
                            background: white; color: var(--primary-color); border-radius: 50%;
                            cursor: pointer; display: flex; align-items: center; justify-content: center;
                        ">
                            <i class="${wishlist.includes(product._id) ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                ` : `
                    <button class="btn btn-outline" disabled style="width: 100%;">
                        غير متوفر حالياً
                    </button>
                `}
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function changeQuantity(change) {
    const quantityInput = document.getElementById('product-quantity');
    if (quantityInput) {
        const currentValue = parseInt(quantityInput.value);
        const newValue = currentValue + change;
        const maxValue = parseInt(quantityInput.max);
        
        if (newValue >= 1 && newValue <= maxValue) {
            quantityInput.value = newValue;
        }
    }
}

function addToCartFromModal() {
    const quantityInput = document.getElementById('product-quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    if (selectedProduct) {
        addToCart(selectedProduct._id, quantity);
        closeProductModal();
    }
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    selectedProduct = null;
}

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('ar-DZ').format(price);
}

function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showStoreLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.add('show');
    }
}

function hideStoreLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.remove('show');
    }
}

function showStoreToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getStoreToastIcon(type);
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

function getStoreToastIcon(type) {
    switch (type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        default: return 'fas fa-info-circle';
    }
}

// Export functions for global use
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.addToWishlist = addToWishlist;
window.viewProduct = viewProduct;
window.quickAddToCart = quickAddToCart;
window.showCart = showCart;
window.proceedToCartCheckout = proceedToCartCheckout;
window.submitCartOrder = submitCartOrder;
window.closeProductModal = closeProductModal;
window.changeQuantity = changeQuantity;
window.addToCartFromModal = addToCartFromModal;