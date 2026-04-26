// main.js - Main JavaScript File

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Mr. Creamy Donut - Main JS Loaded');
    
    // Initialize navigation
    initNavigation();
    
    // Initialize cart functionality
    initCart();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize category filtering
    initCategoryFiltering();
    
    // Initialize newsletter form
    initNewsletterForm();
    
    // Update cart count
    updateCartCount();
});

// Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || 
            (currentPage === '' && linkPage === 'index.html') ||
            (currentPage === '/' && linkPage === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Mobile Menu
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    const body = document.body;
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
            body.classList.toggle('menu-open');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                body.classList.remove('menu-open');
            }
        });
        
        // Close mobile menu when clicking a link
        navLinks.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                body.classList.remove('menu-open');
            }
        });
    }
}

// Cart Functionality
function initCart() {
    const cartIcon = document.getElementById('cartIcon');
    const cartModal = document.getElementById('cartModal');
    const closeCartBtn = document.getElementById('closeCart');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    // Open cart modal
    if (cartIcon) {
        cartIcon.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openCart();
        });
    }
    
    // Close cart modal
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeCart();
        });
    }
    
    // Close cart when clicking outside
    document.addEventListener('click', function(e) {
        if (cartModal && !cartModal.contains(e.target) && e.target !== cartIcon) {
            closeCart();
        }
    });
    
    // Clear cart
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearCart();
        });
    }
    
    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            const cart = getCart();
            if (cart.length === 0) {
                e.preventDefault();
                showNotification('Your cart is empty!', 'error');
                closeCart();
            }
        });
    }
}

// Open cart modal
function openCart() {
    const cartModal = document.getElementById('cartModal');
    const body = document.body;
    
    if (cartModal) {
        renderCart();
        cartModal.classList.add('open');
        body.classList.add('cart-open');
    }
}

// Close cart modal
function closeCart() {
    const cartModal = document.getElementById('cartModal');
    const body = document.body;
    
    if (cartModal) {
        cartModal.classList.remove('open');
        body.classList.remove('cart-open');
    }
}

// Render cart items
function renderCart() {
    const cartBody = document.getElementById('cartBody');
    const cartTotal = document.getElementById('cartTotal');
    const cartCount = document.getElementById('cartCount');
    
    if (!cartBody || !cartTotal) return;
    
    const cart = getCart();
    
    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <p>Add some delicious donuts!</p>
            </div>
        `;
        cartTotal.textContent = 'R0.00';
        if (cartCount) cartCount.textContent = '0';
        return;
    }
    
    let html = '';
    let total = 0;
    let itemCount = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        itemCount += item.quantity;
        
        html += `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">R${item.price.toFixed(2)} each</div>
                    <div class="cart-item-quantity">
                        <button class="cart-item-decrease" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="cart-item-increase" data-id="${item.id}">+</button>
                        <button class="cart-item-remove" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="cart-item-total">R${itemTotal.toFixed(2)}</div>
            </div>
        `;
    });
    
    cartBody.innerHTML = html;
    cartTotal.textContent = `R${total.toFixed(2)}`;
    if (cartCount) cartCount.textContent = itemCount.toString();
    
}

// Attach event listener once, underneath renderCart()
document.addEventListener('DOMContentLoaded', () => {
    const cartBody = document.getElementById('cartBody');
    if (!cartBody) return;

    cartBody.addEventListener('click', function(e) {
        e.stopPropagation();
        const cartItem = e.target.closest('.cart-item');
        if (!cartItem) return;
        
        const itemId = cartItem.getAttribute('data-id');
        
        if (e.target.closest('.cart-item-decrease')) {
            updateCartItemQuantity(itemId, -1);
        } else if (e.target.closest('.cart-item-increase')) {
            updateCartItemQuantity(itemId, 1);
        } else if (e.target.closest('.cart-item-remove')) {
            removeFromCart(itemId);
        }
    });
});


// Get cart from localStorage
function getCart() {
    return JSON.parse(localStorage.getItem('mrCreamyCart')) || [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('mrCreamyCart', JSON.stringify(cart));
}

// Update cart item quantity
function updateCartItemQuantity(itemId, change) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id == itemId);
    
    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
            showNotification('Item removed from cart', 'info');
        } else {
            showNotification('Cart updated', 'success');
        }
        
        saveCart(cart);
        renderCart();
        updateCartCount();
    }
}

// Remove item from cart
function removeFromCart(itemId) {
    let cart = getCart();
    cart = cart.filter(item => item.id != itemId);
    saveCart(cart);
    renderCart();
    updateCartCount();
    showNotification('Item removed from cart', 'info');
}

// Clear entire cart
function clearCart() {
    localStorage.removeItem('mrCreamyCart');
    renderCart();
    updateCartCount();
    showNotification('Cart cleared', 'info');
    closeCart();
}

// Update cart count in header
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const cart = getCart();
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems.toString();
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// Add item to cart (public function)
function addToCart(product, quantity = 1) {
    let cart = getCart();
    const existingItemIndex = cart.findIndex(item => item.id == product.id);
    
    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }
    
    saveCart(cart);
    updateCartCount();
    showNotification(`${product.name} added to cart!`, 'success');
    
    // Update cart modal if open
    const cartModal = document.getElementById('cartModal');
    if (cartModal && cartModal.classList.contains('open')) {
        renderCart();
    }
}

// Category Filtering
function initCategoryFiltering() {
    const categoryTabs = document.querySelectorAll('.category-tab');
    const productCards = document.querySelectorAll('.product-card[data-category]');
    
    if (categoryTabs.length === 0 || productCards.length === 0) return;
    
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active tab
            categoryTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Filter products
            productCards.forEach(card => {
                if (category === 'all' || card.getAttribute('data-category') === category) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Newsletter Form
function initNewsletterForm() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    
    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value;
            
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
            
            // Here you would normally send the email to your newsletter service
            // For demo purposes, we'll just show a success message
            
            showNotification('Thank you for subscribing!', 'success');
            emailInput.value = '';
            
            // In a real implementation:
            // fetch('/api/newsletter/subscribe', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ email: email })
            // })
            // .then(response => response.json())
            // .then(data => {
            //     showNotification('Thank you for subscribing!', 'success');
            //     emailInput.value = '';
            // })
            // .catch(error => {
            //     showNotification('Subscription failed. Please try again.', 'error');
            // });
        });
    });
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.display = 'block';
    }, 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#!') return;
        
        e.preventDefault();
        const targetElement = document.querySelector(href);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    });
});

// Make functions globally available
window.addToCart = addToCart;
window.clearCart = clearCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.showNotification = showNotification;