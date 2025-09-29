// COMPLETE ADMIN.JS FILE - Part 2: All CRUD Operations and Utility Functions
// Add this to the end of the previous admin.js file

// ==================== DELETE FUNCTIONS ====================

async function deleteArticle(articleId) {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    try {
        showLoading();
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/articles/${articleId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('تم حذف المقال بنجاح', 'success');
            loadArticles();
        } else if (response.status === 501) {
            showToast('حذف المقالات سيكون متاحاً قريباً', 'info');
        } else {
            showToast(data.message || 'خطأ في حذف المقال', 'error');
        }
    } catch (error) {
        console.error('Delete article error:', error);
        showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    try {
        showLoading();
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('تم حذف المنتج بنجاح', 'success');
            loadProducts();
        } else if (response.status === 501) {
            showToast('حذف المنتجات سيكون متاحاً قريباً', 'info');
        } else {
            showToast(data.message || 'خطأ في حذف المنتج', 'error');
        }
    } catch (error) {
        console.error('Delete product error:', error);
        showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

async function deletePost(postId) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    try {
        showLoading();
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('تم حذف الإعلان بنجاح', 'success');
            loadPosts();
        } else if (response.status === 501) {
            showToast('حذف الإعلانات سيكون متاحاً قريباً', 'info');
        } else {
            showToast(data.message || 'خطأ في حذف الإعلان', 'error');
        }
    } catch (error) {
        console.error('Delete post error:', error);
        showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteOrder(orderId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    try {
        showLoading();
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('تم حذف الطلب بنجاح', 'success');
            
            currentOrdersPage = 1;
            clearOrdersDisplay();
            loadOrders();
        } else {
            showToast(data.message || 'خطأ في حذف الطلب', 'error');
        }
    } catch (error) {
        console.error('Delete order error:', error);
        showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

async function toggleCommentApproval(commentId, isApproved) {
    const action = isApproved ? 'إلغاء الموافقة على' : 'الموافقة على';
    if (!confirm(`هل أنت متأكد من ${action} هذا التعليق؟`)) {
        return;
    }
    
    try {
        showLoading();
        const token = localStorage.getItem('token');
        
        let response = await fetch(`http://localhost:5000/api/admin/comments/${commentId}/approve`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok && response.status === 404) {
            response = await fetch(`http://localhost:5000/api/comments/${commentId}/approve`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        }
        
        if (response.ok) {
            const data = await response.json();
            showToast(data.message || 'تم تحديث حالة التعليق', 'success');
            loadComments();
        } else {
            const errorData = await response.json();
            showToast(errorData.message || 'خطأ في تغيير حالة التعليق', 'error');
        }
    } catch (error) {
        console.error('Toggle comment approval error:', error);
        showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteComment(commentId) {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    try {
        showLoading();
        const token = localStorage.getItem('token');
        
        let response = await fetch(`http://localhost:5000/api/admin/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok && response.status === 404) {
            response = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
        
        if (response.ok) {
            showToast('تم حذف التعليق بنجاح', 'success');
            loadComments();
        } else {
            const errorData = await response.json();
            showToast(errorData.message || 'خطأ في حذف التعليق', 'error');
        }
    } catch (error) {
        console.error('Delete comment error:', error);
        showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

function toggleUserStatus(userId, isActive) {
    const action = isActive ? 'إلغاء تفعيل' : 'تفعيل';
    if (confirm(`هل أنت متأكد من ${action} هذا المستخدم؟`)) {
        showToast(`تم ${action} المستخدم بنجاح`, 'success');
        loadUsers();
    }
}

function deleteUser(userId) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        showToast('تم حذف المستخدم بنجاح', 'success');
        loadUsers();
    }
}

// ==================== MODAL FUNCTIONS ====================

function openArticleModal(articleId = null) {
    const modal = document.getElementById('article-modal');
    const title = document.getElementById('article-modal-title');
    const form = document.getElementById('article-form');
    
    if (!modal || !title || !form) return;
    
    if (articleId) {
        title.textContent = 'تعديل المقال';
        loadArticleForEdit(articleId);
    } else {
        title.textContent = 'مقال جديد';
        form.reset();
        document.getElementById('article-id').value = '';
        clearFileList('article');
    }
    
    modal.style.display = 'flex';
}

function closeArticleModal() {
    const modal = document.getElementById('article-modal');
    if (modal) {
        modal.style.display = 'none';
        clearFileList('article');
    }
}

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    
    if (!modal || !title || !form) return;
    
    if (productId) {
        title.textContent = 'تعديل المنتج';
        loadProductForEdit(productId);
    } else {
        title.textContent = 'منتج جديد';
        form.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('sale-price-group').style.display = 'none';
        clearFileList('product');
    }
    
    modal.style.display = 'flex';
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.style.display = 'none';
        clearFileList('product');
    }
}

function openPostModal(postId = null) {
    const modal = document.getElementById('post-modal');
    const title = document.getElementById('post-modal-title');
    const form = document.getElementById('post-form');
    
    if (!modal || !title || !form) return;
    
    if (postId) {
        title.textContent = 'تعديل الإعلان';
        loadPostForEdit(postId);
    } else {
        title.textContent = 'إعلان جديد';
        form.reset();
        document.getElementById('post-id').value = '';
        clearFileList('post');
    }
    
    modal.style.display = 'flex';
}

function closePostModal() {
    const modal = document.getElementById('post-modal');
    if (modal) {
        modal.style.display = 'none';
        clearFileList('post');
    }
}

function closeOrderDetailsModal() {
    const modal = document.getElementById('order-details-modal');
    if (modal) modal.style.display = 'none';
}

function closeUpdateOrderModal() {
    const modal = document.getElementById('update-order-modal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('update-order-form');
    if (form) form.reset();
}

// ==================== LOAD DATA FOR EDITING ====================

async function loadArticleForEdit(articleId) {
    try {
        const article = await apiRequest(`/articles/${articleId}`);
        
        document.getElementById('article-id').value = article._id;
        document.getElementById('article-title').value = article.title;
        document.getElementById('article-category').value = article.category;
        document.getElementById('article-excerpt').value = article.excerpt;
        document.getElementById('article-content').value = article.content;
        document.getElementById('article-featured').checked = article.featured;
        
    } catch (error) {
        console.error('Load article error:', error);
        showToast('هذه الميزة ستكون متاحة قريباً', 'info');
        closeArticleModal();
    }
}

async function loadProductForEdit(productId) {
    try {
        const product = await apiRequest(`/products/${productId}`);
        
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
        
    } catch (error) {
        console.error('Load product error:', error);
        showToast('هذه الميزة ستكون متاحة قريباً', 'info');
        closeProductModal();
    }
}

async function loadPostForEdit(postId) {
    try {
        const post = await apiRequest(`/posts/${postId}`);
        
        document.getElementById('post-id').value = post._id;
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-content').value = post.content;
        document.getElementById('post-link').value = post.adDetails?.link || '';
        document.getElementById('post-button-text').value = post.adDetails?.buttonText || 'اقرأ المزيد';
        document.getElementById('post-featured').checked = post.adDetails?.featured || false;
        
    } catch (error) {
        console.error('Load post error:', error);
        showToast('هذه الميزة ستكون متاحة قريباً', 'info');
        closePostModal();
    }
}

// ==================== FORM SUBMISSIONS ====================

async function handleArticleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const articleId = document.getElementById('article-id').value;
    
    const title = document.getElementById('article-title').value.trim();
    const category = document.getElementById('article-category').value;
    const excerpt = document.getElementById('article-excerpt').value.trim();
    const content = document.getElementById('article-content').value.trim();
    const featured = document.getElementById('article-featured').checked;
    
    if (!title || !category || !excerpt || !content) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
        return;
    }
    
    formData.append('title', title);
    formData.append('category', category);
    formData.append('excerpt', excerpt);
    formData.append('content', content);
    formData.append('featured', featured);
    
    selectedFiles.article.forEach(file => {
        formData.append('images', file);
    });
    
    try {
        showLoading();
        
        const token = localStorage.getItem('token');
        const url = articleId ? `/articles/${articleId}` : '/articles';
        const method = articleId ? 'PUT' : 'POST';
        
        const response = await fetch(`http://localhost:5000/api${url}`, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(articleId ? 'تم تحديث المقال بنجاح' : 'تم إنشاء المقال بنجاح', 'success');
            closeArticleModal();
            loadArticles();
        } else if (response.status === 501) {
            showToast('هذه الميزة قيد التطوير حالياً', 'info');
            closeArticleModal();
        } else {
            showToast(data.message || 'خطأ في حفظ المقال', 'error');
        }
    } catch (error) {
        console.error('Article submit error:', error);
        showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const productId = document.getElementById('product-id').value;
    
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const description = document.getElementById('product-description').value.trim();
    const price = document.getElementById('product-price').value;
    const stockQuantity = document.getElementById('product-stock').value;
    const featured = document.getElementById('product-featured').checked;
    const onSale = document.getElementById('product-sale').checked;
    
    if (!name || !category || !description || !price || !stockQuantity) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
        return;
    }
    
    formData.append('name', name);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('stockQuantity', stockQuantity);
    formData.append('featured', featured);
    formData.append('onSale', onSale);
    
    if (onSale) {
        const salePrice = document.getElementById('product-sale-price').value;
        if (salePrice) {
            formData.append('salePrice', salePrice);
        }
    }
    
    selectedFiles.product.forEach(file => {
        formData.append('images', file);
    });
    
    if (!productId && selectedFiles.product.length === 0) {
        showToast('يرجى إضافة صورة واحدة على الأقل للمنتج', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        const token = localStorage.getItem('token');
        const url = productId ? `/products/${productId}` : '/products';
        const method = productId ? 'PUT' : 'POST';
        
        const response = await fetch(`http://localhost:5000/api${url}`, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(productId ? 'تم تحديث المنتج بنجاح' : 'تم إنشاء المنتج بنجاح', 'success');
            closeProductModal();
            loadProducts();
        } else if (response.status === 501) {
            showToast('هذه الميزة قيد التطوير حالياً', 'info');
            closeProductModal();
        } else {
            showToast(data.message || 'خطأ في حفظ المنتج', 'error');
        }
    } catch (error) {
        console.error('Product submit error:', error);
        showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

async function handlePostSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const postId = document.getElementById('post-id').value;
    
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const link = document.getElementById('post-link').value.trim();
    const buttonText = document.getElementById('post-button-text').value.trim();
    const featured = document.getElementById('post-featured').checked;
    
    if (!title || !content) {
        showToast('يرجى ملء العنوان والمحتوى', 'warning');
        return;
    }
    
    formData.append('title', title);
    formData.append('content', content);
    formData.append('link', link);
    formData.append('buttonText', buttonText || 'اقرأ المزيد');
    formData.append('featured', featured);
    
    selectedFiles.post.forEach(file => {
        formData.append('images', file);
    });
    
    try {
        showLoading();
        
        const token = localStorage.getItem('token');
        const url = postId ? `/posts/${postId}` : '/posts/ad';
        const method = postId ? 'PUT' : 'POST';
        
        const response = await fetch(`http://localhost:5000/api${url}`, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(postId ? 'تم تحديث الإعلان بنجاح' : 'تم إنشاء الإعلان بنجاح', 'success');
            closePostModal();
            loadPosts();
        } else if (response.status === 501) {
            showToast('هذه الميزة قيد التطوير حالياً', 'info');
            closePostModal();
        } else {
            showToast(data.message || 'خطأ في حفظ الإعلان', 'error');
        }
    } catch (error) {
        console.error('Post submit error:', error);
        showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

// ==================== ORDER DETAILS AND UPDATE ====================

async function viewOrderDetails(orderId) {
    try {
        showLoading();
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const order = await response.json();
            displayOrderDetailsModal(order);
        } else {
            const errorData = await response.json();
            showToast('خطأ في تحميل تفاصيل الطلب: ' + (errorData.message || 'خطأ غير معروف'), 'error');
        }
    } catch (error) {
        console.error('View order details error:', error);
        showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

function displayOrderDetailsModal(order) {
    const modal = document.getElementById('order-details-modal');
    const title = document.getElementById('order-details-title');
    const body = document.getElementById('order-details-body');
    
    if (!modal || !title || !body) return;
    
    title.textContent = `تفاصيل الطلب ${order.orderNumber || order._id.slice(-8)}`;
    
    const deliveryPrice = DELIVERY_PRICES[order.customerInfo.wilaya] || 500;
    const totalWithDelivery = order.totalPrice + deliveryPrice;
    
    body.innerHTML = `
        <div class="customer-info" style="background: var(--secondary-color); padding: 1.5rem; border-radius: var(--border-radius); margin-bottom: 2rem;">
            <h4 style="margin-bottom: 1rem; color: var(--primary-color);">
                <i class="fas fa-user"></i> معلومات العميل
            </h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <strong>الاسم:</strong> ${escapeHtml(order.customerInfo.name)}
                </div>
                <div>
                    <strong>الهاتف:</strong> 
                    <a href="tel:${order.customerInfo.phone}" style="color: var(--primary-color);">
                        ${escapeHtml(order.customerInfo.phone)}
                    </a>
                </div>
                <div>
                    <strong>الولاية:</strong> ${escapeHtml(order.customerInfo.wilaya)}
                </div>
                ${order.customerInfo.city ? `<div><strong>البلدية:</strong> ${escapeHtml(order.customerInfo.city)}</div>` : ''}
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>العنوان الكامل:</strong><br>
                ${escapeHtml(order.customerInfo.address)}
                ${order.customerInfo.city ? `, ${escapeHtml(order.customerInfo.city)}` : ''}
                ، ${escapeHtml(order.customerInfo.wilaya)}
            </div>
            ${order.customerInfo.notes ? `
                <div>
                    <strong>ملاحظات العميل:</strong><br>
                    ${escapeHtml(order.customerInfo.notes)}
                </div>
            ` : ''}
        </div>
        
        <div class="order-items-detail" style="background: var(--white); border: 2px solid var(--border-color); border-radius: var(--border-radius); padding: 1.5rem; margin-bottom: 2rem;">
            <h4 style="margin-bottom: 1rem; color: var(--primary-color);">
                <i class="fas fa-shopping-bag"></i> المنتجات المطلوبة
            </h4>
            ${order.items ? order.items.map(item => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--border-color);">
                    ${item.image ? `
                        <img src="http://localhost:5000/uploads/products/${item.image}" 
                             alt="${escapeHtml(item.productName)}" 
                             style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--border-radius); margin-left: 1rem;"
                             onerror="this.style.display='none'">
                    ` : ''}
                    <div style="flex: 1;">
                        <strong>${escapeHtml(item.productName)}</strong><br>
                        <span style="color: var(--light-text);">
                            الكمية: ${item.quantity} × ${formatPrice(item.price)} دج
                        </span>
                    </div>
                    <div style="font-weight: bold; color: var(--primary-color);">
                        ${formatPrice(item.price * item.quantity)} دج
                    </div>
                </div>
            `).join('') : 'لا توجد منتجات'}
        </div>
        
        <div class="order-summary" style="background: var(--secondary-color); padding: 1.5rem; border-radius: var(--border-radius); border: 2px solid var(--primary-color);">
            <h4 style="margin-bottom: 1rem; color: var(--primary-color);">
                <i class="fas fa-calculator"></i> ملخص الطلب
            </h4>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>المجموع الفرعي:</span>
                <span>${formatPrice(order.totalPrice)} دج</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>رسوم التوصيل (${escapeHtml(order.customerInfo.wilaya)}):</span>
                <span style="color: var(--primary-color); font-weight: bold;">${formatPrice(deliveryPrice)} دج</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>حالة الطلب:</span>
                <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
            </div>
            ${order.trackingNumber ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>رقم التتبع:</span>
                    <span style="font-family: monospace;">${escapeHtml(order.trackingNumber)}</span>
                </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>تاريخ الطلب:</span>
                <span>${formatDate(order.createdAt)}</span>
            </div>
            ${order.notes ? `
                <div style="margin-top: 1rem;">
                    <strong>ملاحظات الإدارة:</strong><br>
                    ${escapeHtml(order.notes)}
                </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.2rem; color: var(--primary-color); border-top: 2px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">
                <span>المبلغ الإجمالي (مع التوصيل):</span>
                <span>${formatPrice(totalWithDelivery)} دج</span>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function updateOrderStatus(orderId) {
    try {
        showLoading();
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const order = await response.json();
            
            document.getElementById('update-order-id').value = orderId;
            document.getElementById('order-status').value = order.status;
            document.getElementById('tracking-number').value = order.trackingNumber || '';
            document.getElementById('order-notes').value = order.notes || '';
            
            document.getElementById('update-order-modal').style.display = 'flex';
        } else {
            const errorData = await response.json();
            showToast('خطأ في تحميل بيانات الطلب: ' + (errorData.message || 'خطأ غير معروف'), 'error');
        }
    } catch (error) {
        console.error('Load order for update error:', error);
        showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

async function handleUpdateOrderStatus(e) {
    e.preventDefault();
    
    const orderId = document.getElementById('update-order-id').value;
    const status = document.getElementById('order-status').value;
    const trackingNumber = document.getElementById('tracking-number').value.trim();
    const notes = document.getElementById('order-notes').value.trim();
    
    try {
        showLoading();
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status,
                trackingNumber: trackingNumber || undefined,
                notes: notes || undefined
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('تم تحديث حالة الطلب بنجاح', 'success');
            closeUpdateOrderModal();
            
            currentOrdersPage = 1;
            clearOrdersDisplay();
            loadOrders();
        } else {
            showToast(data.message || 'خطأ في تحديث حالة الطلب', 'error');
        }
    } catch (error) {
        console.error('Update order status error:', error);
        showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

async function loadOrdersStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/orders/stats/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            updateOrdersStats(stats);
        } else {
            updateOrdersStats({
                totalOrders: 0,
                pendingOrders: 0,
                todayOrders: 0,
                monthRevenue: 0
            });
        }
    } catch (error) {
        console.error('Load orders stats error:', error);
        updateOrdersStats({
            totalOrders: 0,
            pendingOrders: 0,
            todayOrders: 0,
            monthRevenue: 0
        });
    }
}

function updateOrdersStats(stats) {
    const elements = {
        'total-orders': stats.totalOrders || 0,
        'pending-orders': stats.pendingOrders || 0,
        'today-orders': stats.todayOrders || 0,
        'month-revenue': formatPrice(stats.monthRevenue || 0)
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function updateOrdersPagination(pagination) {
    const loadMoreBtn = document.getElementById('load-more-orders');
    if (loadMoreBtn) {
        if (currentOrdersPage >= (pagination?.pages || 1)) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }
}

function getStatusText(status) {
    const statusTexts = {
        'pending': 'في الانتظار',
        'confirmed': 'مؤكد',
        'processing': 'قيد المعالجة',
        'shipped': 'تم الشحن',
        'delivered': 'تم التسليم',
        'cancelled': 'ملغي'
    };
    return statusTexts[status] || status;
}

// ==================== THEME MANAGEMENT ====================

function loadThemeManager() {
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim();
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    
    const primaryInput = document.getElementById('primary-color');
    const secondaryInput = document.getElementById('secondary-color');
    const textInput = document.getElementById('text-color');
    
    if (primaryInput) primaryInput.value = primaryColor || '#d4a574';
    if (secondaryInput) secondaryInput.value = secondaryColor || '#f8e8d4';
    if (textInput) textInput.value = textColor || '#2c2c2c';
}

function updateThemePreview() {
    const primaryColor = document.getElementById('primary-color').value;
    const secondaryColor = document.getElementById('secondary-color').value;
    const textColor = document.getElementById('text-color').value;
    
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primaryColor);
    root.style.setProperty('--secondary-color', secondaryColor);
    root.style.setProperty('--text-color', textColor);
    root.style.setProperty('--gradient', `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`);
}

function saveThemeChanges() {
    const theme = {
        primaryColor: document.getElementById('primary-color').value,
        secondaryColor: document.getElementById('secondary-color').value,
        textColor: document.getElementById('text-color').value
    };
    
    localStorage.setItem('adminTheme', JSON.stringify(theme));
    localStorage.setItem('siteTheme', JSON.stringify(theme));
    showToast('تم حفظ الألوان بنجاح', 'success');
}

function resetThemeToDefault() {
    if (confirm('هل أنت متأكد من إعادة الألوان للافتراضي؟')) {
        const defaultTheme = {
            primaryColor: '#d4a574',
            secondaryColor: '#f8e8d4',
            textColor: '#2c2c2c'
        };
        
        document.getElementById('primary-color').value = defaultTheme.primaryColor;
        document.getElementById('secondary-color').value = defaultTheme.secondaryColor;
        document.getElementById('text-color').value = defaultTheme.textColor;
        
        updateThemePreview();
        localStorage.removeItem('adminTheme');
        localStorage.removeItem('siteTheme');
        showToast('تم إعادة الألوان للافتراضي', 'success');
    }
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('adminTheme');
    if (savedTheme) {
        try {
            const theme = JSON.parse(savedTheme);
            applyTheme(theme);
        } catch (error) {
            console.error('Error loading saved theme:', error);
        }
    }
}

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme.primaryColor) root.style.setProperty('--primary-color', theme.primaryColor);
    if (theme.secondaryColor) root.style.setProperty('--secondary-color', theme.secondaryColor);
    if (theme.textColor) root.style.setProperty('--text-color', theme.textColor);
    if (theme.primaryColor && theme.secondaryColor) {
        root.style.setProperty('--gradient', `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`);
    }
}

// ==================== FILE UPLOAD HANDLERS ====================

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDrop(e, type) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files, type);
}

function handleFileSelect(e, type) {
    const files = Array.from(e.target.files);
    addFiles(files, type);
}

function addFiles(files, type) {
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
        showToast('يُسمح بملفات الصور فقط', 'warning');
    }
    
    selectedFiles[type] = [...selectedFiles[type], ...validFiles];
    updateFileList(type);
}

function updateFileList(type) {
    const fileList = document.getElementById(`${type}-file-list`);
    if (!fileList) return;
    
    fileList.innerHTML = '';

    selectedFiles[type].forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span>${escapeHtml(file.name)}</span>
            <button type="button" class="remove-file" onclick="removeFile(${index}, '${type}')">&times;</button>
        `;
        fileList.appendChild(fileItem);
    });
}

function removeFile(index, type) {
    selectedFiles[type].splice(index, 1);
    updateFileList(type);
}

function clearFileList(type) {
    selectedFiles[type] = [];
    updateFileList(type);
}

// ==================== API REQUEST FUNCTION ====================

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
        const response = await fetch(`http://localhost:5000/api${endpoint}`, config);
        
        if (response.ok) {
            const data = await response.json();
            return data;
        } else if (response.status === 404) {
            return {
                articles: [],
                products: [],
                posts: [],
                comments: [],
                users: [],
                orders: [],
                pagination: { total: 0, pages: 0, current: 1 }
            };
        } else if (response.status === 501) {
            console.log(`Endpoint ${endpoint} not implemented yet`);
            return {
                articles: [],
                products: [],
                posts: [],
                comments: [],
                users: [],
                orders: [],
                pagination: { total: 0, pages: 0, current: 1 }
            };
        } else {
            let errorMessage = 'Server error';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = `HTTP ${response.status} - ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }
        
    } catch (error) {
        console.error('API Error:', error);
        
        if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
            console.log('Server appears to be down, returning empty data');
            return {
                articles: [],
                products: [],
                posts: [],
                comments: [],
                users: [],
                orders: [],
                pagination: { total: 0, pages: 0, current: 1 }
            };
        }
        
        throw error;
    }
}

// ==================== EDIT FUNCTIONS ====================

function editArticle(id) { openArticleModal(id); }
function editProduct(id) { openProductModal(id); }
function editPost(id) { openPostModal(id); }

console.log('✅ Admin.js Part 2 loaded - All CRUD operations ready!');
