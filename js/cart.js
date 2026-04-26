// cart.js Cart-specific functionality

// Product data (in a real app, this would come from a database)
const PRODUCTS = {
    1: {
        id: 1,
        name: "Creamy Chocolate Bliss",
        description: "Double chocolate with cream filling hiting the tip of the tongue",
        price: 7.99,
        image: "images/creamy-chocolate-bliss.jpg",
        category: "Specialty"
    },
    2: {
        id: 2,
        name: "Vanilla Glazed Sprinkles",
        description: "Vanilla glazed ring Donut, with rainbow sprinkles",
        price: 7.99,
        image: "images/vanilla-glazed-sprinkles.jpg",
        category: "classic"
    },
    3: {
        id: 3,
        name: "Original Ring Donut",
        description: "Original ring donut with a vanilla glaze, sweet and crunchy",
        price: 7.99,
        image: "images/picture-coming-soon.jpg",
        category: "classic"
    },
    4: {
        id: 4,
        name: "Happy Bliss Box",
        description: "The Happy Bliss Box it's a deligacy to share with friends, family, colleagues or loved ones which create unforgettable moments that you will never forget.",
        price: 46.99,
        image: "images/happy-bliss-box.jpg",
        category: "specialty"
    }
};

// Initialize cart functionality
document.addEventListener('DOMContentLoaded', function() {
    // Update cart count on page load
    updateCartCount();
    
    // Initialize quantity selectors on menu page
    initQuantitySelectors();
    
    // Initialize add to cart buttons
    initAddToCartButtons();
});

// Initialize quantity selectors
function initQuantitySelectors() {
    document.querySelectorAll('.qty-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const isPlus = this.classList.contains('plus');
            const qtyElement = document.querySelector(`.qty-value[data-id="${id}"]`);
            
            if (qtyElement) {
                let qty = parseInt(qtyElement.textContent);
                if (isPlus) {
                    qty++;
                } else if (qty > 1) {
                    qty--;
                }
                qtyElement.textContent = qty;
            }
        });
    });
}

// Initialize add to cart buttons
function initAddToCartButtons() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const product = PRODUCTS[id];
            
            if (!product) {
                showNotification('Product not found', 'error');
                return;
            }
            
            // Get quantity
            const qtyElement = document.querySelector(`.qty-value[data-id="${id}"]`);
            const quantity = qtyElement ? parseInt(qtyElement.textContent) : 1;
            
            // Add to cart
            if (typeof addToCart === 'function') {
                addToCart(product, quantity);
                
                // Reset quantity if on menu page
                if (qtyElement) {
                    qtyElement.textContent = '1';
                }
            } else {
                showNotification('Cart functionality not available', 'error');
            }
        });
    });
}

// Get cart total
function getCartTotal() {
    const cart = JSON.parse(localStorage.getItem('mrCreamyCart')) || [];
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Get cart item count
function getCartItemCount() {
    const cart = JSON.parse(localStorage.getItem('mrCreamyCart')) || [];
    return cart.reduce((count, item) => count + item.quantity, 0);
}

// Update cart count in header
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    const itemCount = getCartItemCount();
    
    cartCountElements.forEach(element => {
        element.textContent = itemCount;
        element.style.display = itemCount > 0 ? 'flex' : 'none';
    });
}

// Check if cart is empty
function isCartEmpty() {
    const cart = JSON.parse(localStorage.getItem('mrCreamyCart')) || [];
    return cart.length === 0;
}

// Get formatted cart for checkout
function getFormattedCart() {
    const cart = JSON.parse(localStorage.getItem('mrCreamyCart')) || [];
    return cart.map(item => ({
        ...item,
        total: item.price * item.quantity
    }));
}

// Export functions for use in other modules
window.PRODUCTS = PRODUCTS;
window.getCartTotal = getCartTotal;
window.getCartItemCount = getCartItemCount;
window.isCartEmpty = isCartEmpty;
window.getFormattedCart = getFormattedCart;