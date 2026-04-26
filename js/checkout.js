/**
 * checkout.js - Checkout page functionality
 * Mr. Creamy Donut - EFT and Cash payment system
 */

// Checkout namespace to avoid conflicts
const checkout = {
    currentStep: 1,
    selectedPayment: 'eft',
    orderData: {},
    orderNumber: null,
    modalCallback: null,

    /**
     * Initialize checkout page
     */
    init: function() {
        if (!window.location.pathname.includes('checkout.html')) return;
        
        console.log('Initializing checkout...');
        
        this.generateOrderNumber();
        this.renderOrderSummary();
        this.initFormValidation();
        this.loadFormData();
        this.updateStepDisplay();
        this.updateConfirmation();
        
        if (isCartEmpty()) {
            this.showNotification('Your cart is empty! Redirecting to menu...', 'warning');
            setTimeout(() => window.location.href = 'menu.html', 2000);
        }
        
        this.addEventListeners();
    },

    /**
     * Generate random order number
     */
    generateOrderNumber: function() {
        const num = Math.floor(10000 + Math.random() * 90000);
        this.orderNumber = `MCD-${num}`;
        const refElement = document.getElementById('paymentReference');
        if (refElement) refElement.textContent = this.orderNumber;
    },

    /**
     * Add event listeners
     */
    addEventListeners: function() {
        const deliveryOption = document.getElementById('deliveryOption');
        if (deliveryOption) {
            deliveryOption.addEventListener('change', () => {
                this.renderOrderSummary();
                this.updateConfirmation();
                this.saveFormData();
            });
        }

        const formInputs = document.querySelectorAll('#shippingForm input, #shippingForm select, #shippingForm textarea');
        formInputs.forEach(input => {
            input.addEventListener('change', () => this.saveFormData());
            input.addEventListener('input', () => {
                // Real-time validation
                if (input.hasAttribute('required')) {
                    this.validateField(input);
                }
            });
        });
    },

    /**
     * Show custom modal
     */
    showModal: function(message, onConfirm) {
        const modal = document.getElementById('confirmationModal');
        const modalMessage = document.getElementById('modalMessage');
        const confirmBtn = document.getElementById('modalConfirmBtn');
        
        modalMessage.textContent = message;
        this.modalCallback = onConfirm;
        
        // Remove old event listener and add new one
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            if (this.modalCallback) {
                this.modalCallback();
            }
            this.closeModal();
        });
        
        modal.style.display = 'flex';
    },

    /**
     * Close custom modal
     */
    closeModal: function() {
        const modal = document.getElementById('confirmationModal');
        modal.style.display = 'none';
        this.modalCallback = null;
    },

    /**
     * Navigation - next step
     */
    next: function() {
        if (this.currentStep === 1 && this.validateStep1()) {
            this.saveFormData();
            this.currentStep = 2;
            this.updateConfirmation();
        } else if (this.currentStep === 2) {
            this.currentStep = 3;
            this.updatePaymentDisplay();
        } else if (this.currentStep === 3 && this.selectedPayment === 'cash') {
            this.processCashOrder();
            return;
        }
        this.updateStepDisplay();
    },

    /**
     * Navigation - previous step
     */
    previous: function() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    },

    /**
     * Select payment method
     */
    selectPayment: function(method) {
        this.selectedPayment = method;
        
        document.getElementById('paymentEft').checked = (method === 'eft');
        document.getElementById('paymentCash').checked = (method === 'cash');

        // Add this line for the new PayPal radio button
        const paypalRadio = document.getElementById('paymentPaypal');
        if (paypalRadio) paypalRadio.checked = (method === 'paypal');

        // Update UI (rest remains the same)
        document.querySelectorAll('.payment-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
        
        this.updatePaymentDisplay();
    },

    /**
     * Update payment display based on selection
     */
    updatePaymentDisplay: function() {
        const eftDetails = document.getElementById('eftDetails');
        const cashDetails = document.getElementById('cashDetails');
        const paypalDetails = document.getElementById('paypalDetails'); // New
        const proofSection = document.getElementById('proofPaymentSection');
        const cashActions = document.getElementById('cashActions');
        
        // Hide all payment detail sections first
        eftDetails.style.display = 'none';
        cashDetails.style.display = 'none';
        if (paypalDetails) paypalDetails.style.display = 'none'; // New
        proofSection.style.display = 'none';
        if (cashActions) cashActions.style.display = 'none';

        if (this.selectedPayment === 'eft') {
            eftDetails.style.display = 'block';
            proofSection.style.display = 'block';
        } else if (this.selectedPayment === 'cash') {
            cashDetails.style.display = 'block';
            // Create cash actions if needed
            if (!cashActions) this.createCashActions();
            else cashActions.style.display = 'block';
        } else if (this.selectedPayment === 'paypal') { // New PayPal condition
            if (paypalDetails) paypalDetails.style.display = 'block';
            // Update the amount shown
            const total = this.calculateTotal();
            document.getElementById('paypalAmount').textContent = `R${total.toFixed(2)}`;
        }
        
        const total = this.calculateTotal();
        document.getElementById('cashAmount').textContent = `R${total.toFixed(2)}`;
    },

    /**
     * Create cash actions buttons (WhatsApp, Email & Cancel for cash orders)
     */
    createCashActions: function() {
        const cashDetails = document.getElementById('cashDetails');
        
        // Remove existing cash actions if any
        const existingActions = document.getElementById('cashActions');
        if (existingActions) existingActions.remove();
        
        // Create actions container
        const actionsDiv = document.createElement('div');
        actionsDiv.id = 'cashActions';
        actionsDiv.className = 'proof-payment-section';
        actionsDiv.style.marginTop = '20px';
        
        actionsDiv.innerHTML = `
            <h3><i class="fas fa-paper-plane"></i> Send Order Details</h3>
            <p style="color: #666; margin-bottom: 20px;">Send your order details to the store to help us prepare faster:</p>
            
            <div class="action-buttons">
                <button class="btn btn-whatsapp" onclick="checkout.sendOrderDetailsWhatsApp()">
                    <i class="fab fa-whatsapp"></i> WhatsApp Order
                </button>
                <button class="btn btn-email" onclick="checkout.sendOrderDetailsEmail()">
                    <i class="fas fa-envelope"></i> Email Order
                </button>
                <button class="btn btn-cancel" onclick="checkout.showCancelModal()">
                    <i class="fas fa-times"></i> Cancel Order
                </button>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 15px;">
                <i class="fas fa-info-circle"></i> This helps us prepare your order faster and ensures accuracy!
            </p>
        `;
        
        // Insert after cash details
        cashDetails.parentNode.insertBefore(actionsDiv, cashDetails.nextSibling);
    },

    /**
     * Show cancel confirmation modal
     */
    showCancelModal: function() {
        this.showModal(
            'Are you sure you want to cancel this order? All your information will be lost.',
            () => this.cancelCashOrder()
        );
    },

    /**
     * Update step display and progress indicators
     */
    updateStepDisplay: function() {
        // Hide all steps
        for (let i = 1; i <= 4; i++) {
            const step = document.getElementById(`step${i}`);
            if (step) step.classList.remove('active');
        }
        
        // Show current step
        const currentStepElement = document.getElementById(`step${this.currentStep}`);
        if (currentStepElement) currentStepElement.classList.add('active');
        
        // Update progress indicators
        for (let i = 1; i <= 4; i++) {
            const indicator = document.querySelector(`.step-marker[data-step="${i}"]`);
            if (indicator) {
                indicator.classList.remove('active', 'completed');
                if (i === this.currentStep) {
                    indicator.classList.add('active');
                } else if (i < this.currentStep) {
                    indicator.classList.add('completed');
                }
            }
        }
    },

    /**
     * Validate step 1 form
     */
    validateStep1: function() {
        const form = document.getElementById('shippingForm');
        const inputs = form.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                this.validateField(input);
                isValid = false;
            }
        });
        
        if (!isValid) {
            this.showNotification('Please fill in all required fields', 'error');
            return false;
        }
        
        const email = document.getElementById('email').value;
        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return false;
        }
        
        const phone = document.getElementById('phone').value;
        if (!this.isValidPhone(phone)) {
            this.showNotification('Please enter a valid phone number', 'error');
            return false;
        }
        
        return true;
    },

    /**
     * Validate individual field
     */
    validateField: function(field) {
        if (!field.value.trim() && field.required) {
            field.classList.add('error');
            field.classList.remove('success');
            return false;
        } else {
            field.classList.remove('error');
            field.classList.add('success');
            return true;
        }
    },

    /**
     * Email validation
     */
    isValidEmail: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    /**
     * Phone validation
     */
    isValidPhone: function(phone) {
        return /^[\+]?[0-9]{10,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
    },

    /**
     * Save form data to localStorage
     */
    saveFormData: function() {
        this.orderData = {
            firstName: document.getElementById('firstName')?.value || '',
            lastName: document.getElementById('lastName')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            address: document.getElementById('address')?.value || '',
            city: document.getElementById('city')?.value || '',
            province: document.getElementById('province')?.value || '',
            zipCode: document.getElementById('zipCode')?.value || '',
            country: document.getElementById('country')?.value || '',
            deliveryOption: document.getElementById('deliveryOption')?.value || 'standard',
            specialInstructions: document.getElementById('specialInstructions')?.value || ''
        };
        localStorage.setItem('checkoutData', JSON.stringify(this.orderData));
    },

    /**
     * Load form data from localStorage
     */
    loadFormData: function() {
        const saved = localStorage.getItem('checkoutData');
        if (saved) {
            this.orderData = JSON.parse(saved);
            Object.keys(this.orderData).forEach(key => {
                const element = document.getElementById(key);
                if (element) element.value = this.orderData[key] || '';
            });
        }
    },

    /**
     * Update confirmation in step 2 - FIXED: Now reads directly from form
     */
    updateConfirmation: function() {
        this.saveFormData();
        
        // Get current form values directly to ensure they're up to date
        const email = document.getElementById('email')?.value || '';
        const phone = document.getElementById('phone')?.value || '';
        const firstName = document.getElementById('firstName')?.value || '';
        const lastName = document.getElementById('lastName')?.value || '';
        const address = document.getElementById('address')?.value || '';
        const city = document.getElementById('city')?.value || '';
        const zipCode = document.getElementById('zipCode')?.value || '';
        const deliveryOption = document.getElementById('deliveryOption')?.value || 'standard';
        
        // Update contact info
        document.getElementById('confirmContact').textContent = `${email} | ${phone}`;
        
        // Update address
        const addressText = `${firstName} ${lastName}, ${address}, ${city}, ${zipCode}`;
        document.getElementById('confirmAddress').textContent = addressText;
        
        // Update delivery option with correct text and price
        let deliveryText = '';
        let deliveryFee = 0;
        
        if (deliveryOption === 'standard') {
            deliveryText = 'Standard Delivery (3h 15min) - R36.00';
            deliveryFee = 36.00;
        } else if (deliveryOption === 'express') {
            deliveryText = 'Express Delivery (1h 45min) - R56.00';
            deliveryFee = 56.00;
        } else if (deliveryOption === 'pickup') {
            deliveryText = 'Store Pickup - Free';
            deliveryFee = 0;
        }
        
        document.getElementById('confirmDelivery').textContent = deliveryText;
        
        // Calculate totals with the correct delivery fee
        const cart = getFormattedCart();
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const grandTotal = subtotal + deliveryFee;
        
        // Update items count
        document.getElementById('confirmItems').textContent = `${cart.length} items`;
        
        // Update totals
        document.getElementById('confirmSubtotal').textContent = `R${subtotal.toFixed(2)}`;
        document.getElementById('confirmDeliveryFee').textContent = `R${deliveryFee.toFixed(2)}`;
        document.getElementById('confirmTotal').textContent = `R${grandTotal.toFixed(2)}`;
        
        // Also update the order summary in the sidebar
        this.renderOrderSummary();
    },

    /**
     * Calculate totals - FIXED: Now reads directly from form
     */
    calculateTotals: function() {
        const cart = getFormattedCart();
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Get current delivery option directly from the form
        const deliveryOption = document.getElementById('deliveryOption')?.value || 'standard';
        
        let deliveryFee = 36.00;
        if (deliveryOption === 'express') {
            deliveryFee = 56.00;
        } else if (deliveryOption === 'pickup') {
            deliveryFee = 0;
        }
        
        const grandTotal = subtotal + deliveryFee;
        
        return { subtotal, deliveryFee, grandTotal };
    },

    /**
     * Calculate just total
     */
    calculateTotal: function() {
        return this.calculateTotals().grandTotal;
    },

    /**
     * Render order summary in sidebar - FIXED: Now reads directly from form
     */
    renderOrderSummary: function() {
        const elements = {
            checkoutItems: document.getElementById('checkoutItems'),
            subtotal: document.getElementById('subtotal'),
            deliveryFee: document.getElementById('deliveryFee'),
            grandTotal: document.getElementById('grandTotal')
        };
        
        if (!elements.checkoutItems) return;
        
        const cart = getFormattedCart();
        
        // Get current delivery option directly from the form
        const deliveryOption = document.getElementById('deliveryOption')?.value || 'standard';
        
        // Calculate delivery fee based on current selection
        let deliveryFee = 36.00;
        if (deliveryOption === 'express') {
            deliveryFee = 56.00;
        } else if (deliveryOption === 'pickup') {
            deliveryFee = 0;
        }
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const grandTotal = subtotal + deliveryFee;
        
        if (cart.length === 0) {
            elements.checkoutItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            elements.subtotal.textContent = 'R0.00';
            elements.deliveryFee.textContent = 'R0.00';
            elements.grandTotal.textContent = 'R0.00';
            return;
        }
        
        let html = '';
        cart.forEach(item => {
            html += `
                <div class="order-item">
                    <div>
                        <strong>${item.name}</strong>
                        <div class="item-details">Qty: ${item.quantity} × R${item.price.toFixed(2)}</div>
                    </div>
                    <div>R${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            `;
        });
        
        elements.checkoutItems.innerHTML = html;
        elements.subtotal.textContent = `R${subtotal.toFixed(2)}`;
        elements.deliveryFee.textContent = `R${deliveryFee.toFixed(2)}`;
        elements.grandTotal.textContent = `R${grandTotal.toFixed(2)}`;
        
        localStorage.setItem('orderTotal', grandTotal.toFixed(2));
    },

    /**
     * Send proof via WhatsApp (for EFT)
     */
    sendViaWhatsApp: function() {
        const phoneNumber = '27782101293';
        const totals = this.calculateTotals();
        
        const message = `Hello! I've made an EFT payment for order #${this.orderNumber}.
        
Name: ${this.orderData.firstName} ${this.orderData.lastName}
Amount: R${totals.grandTotal.toFixed(2)}
Email: ${this.orderData.email}
Phone: ${this.orderData.phone}

Please find proof of payment attached.`;
        
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
        
        document.querySelector('.action-buttons').style.display = 'none';
        document.getElementById('paymentSentBtn').style.display = 'block';
        
        this.showNotification('✅ WhatsApp opened! Please send the proof of payment.', 'success');
    },

    /**
     * Send via Email (for EFT)
     */
    sendViaEmail: function() {
        const email = 'orders@mrcreamydonut.com';
        const totals = this.calculateTotals();
        
        const subject = `Proof of Payment - Order #${this.orderNumber}`;
        const body = `Hello,%0D%0A%0D%0AI've made an EFT payment for order #${this.orderNumber}.%0D%0A%0D%0AName: ${this.orderData.firstName} ${this.orderData.lastName}%0D%0AAmount: R${totals.grandTotal.toFixed(2)}%0D%0AEmail: ${this.orderData.email}%0D%0APhone: ${this.orderData.phone}%0D%0A%0D%0APlease find proof of payment attached.%0D%0A%0D%0AThank you!`;
        
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`;
        
        document.querySelector('.action-buttons').style.display = 'none';
        document.getElementById('paymentSentBtn').style.display = 'block';
        
        this.showNotification('📧 Email client opened! Please send the proof of payment.', 'success');
    },

    /**
     * Send order details via WhatsApp (for cash orders)
     */
    sendOrderDetailsWhatsApp: function() {
        const phoneNumber = '27782101293';
        const totals = this.calculateTotals();
        const cart = getFormattedCart();
        
        let itemsList = '';
        cart.forEach(item => {
            itemsList += `• ${item.name} x${item.quantity} - R${(item.price * item.quantity).toFixed(2)}\n`;
        });
        
        const deliveryOption = document.getElementById('deliveryOption')?.value || 'standard';
        const deliveryType = deliveryOption === 'pickup' ? 'Store Pickup' : 'Delivery';
        const deliveryAddress = deliveryOption === 'pickup' 
            ? 'Customer will collect in store' 
            : `${this.orderData.address}, ${this.orderData.city}`;
        
        const message = `*NEW CASH ORDER* 
        
Order #${this.orderNumber}

 *Customer Details*
Name: ${this.orderData.firstName} ${this.orderData.lastName}
Email: ${this.orderData.email}
Phone: ${this.orderData.phone}
${deliveryOption === 'pickup' ? ' Collection: In-store' : ` Delivery Address: ${deliveryAddress}`}

 *Order Items*
${itemsList}
--------------------------------
Subtotal: R${totals.subtotal.toFixed(2)}
Delivery: R${totals.deliveryFee.toFixed(2)}
*TOTAL: R${totals.grandTotal.toFixed(2)}*

 *Special Instructions*
${this.orderData.specialInstructions || 'None'}

 Please prepare order for ${deliveryType.toLowerCase()}.`;
        
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
        
        this.showNotification(' Order details sent via WhatsApp! The store has been notified.', 'success');
    },

    /**
     * Send order details via Email (for cash orders)
     */
    sendOrderDetailsEmail: function() {
        const email = 'orders@mrcreamydonut.com';
        const totals = this.calculateTotals();
        const cart = getFormattedCart();
        
        let itemsList = '';
        cart.forEach(item => {
            itemsList += `${item.name} x${item.quantity} - R${(item.price * item.quantity).toFixed(2)}%0D%0A`;
        });
        
        const deliveryOption = document.getElementById('deliveryOption')?.value || 'standard';
        const deliveryType = deliveryOption === 'pickup' ? 'Store Pickup' : 'Delivery';
        const deliveryAddress = deliveryOption === 'pickup' 
            ? 'Customer will collect in store' 
            : `${this.orderData.address}, ${this.orderData.city}`;
        
        const subject = `  New Cash Order - #${this.orderNumber}`;
        const body = ` NEW CASH ORDER %0D%0A%0D%0AOrder #${this.orderNumber}%0D%0A%0D%0A CUSTOMER DETAILS%0D%0AName: ${this.orderData.firstName} ${this.orderData.lastName}%0D%0AEmail: ${this.orderData.email}%0D%0APhone: ${this.orderData.phone}%0D%0A${deliveryOption === 'pickup' ? ' Collection: In-store' : ` Delivery Address: ${deliveryAddress}`}%0D%0A%0D%0A ORDER ITEMS%0D%0A${itemsList}%0D%0ASubtotal: R${totals.subtotal.toFixed(2)}%0D%0ADelivery: R${totals.deliveryFee.toFixed(2)}%0D%0ATOTAL: R${totals.grandTotal.toFixed(2)}%0D%0A%0D%0A SPECIAL INSTRUCTIONS%0D%0A${this.orderData.specialInstructions || 'None'}%0D%0A%0D%0A Please prepare order for ${deliveryType.toLowerCase()}.`;
        
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`;
        
        this.showNotification(' Order details sent via Email! The store has been notified.', 'success');
    },

    /**
     * Show cancel confirmation for EFT
     */
    showEFTCancelModal: function() {
        this.showModal(
            'Are you sure you want to cancel this order? All your information will be lost.',
            () => this.cancelEFTOrder()
        );
    },

    /**
     * Cancel EFT order
     */
    cancelEFTOrder: function() {
        localStorage.removeItem('checkoutData');
        localStorage.removeItem('orderTotal');
        
        this.showNotification('❌ Order cancelled. Redirecting to menu...', 'warning');
        
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 2000);
    },

    /**
     * Cancel order (for EFT)
     */
    cancelOrder: function() {
        this.showEFTCancelModal();
    },

    /**
     * Cancel cash order
     */
    cancelCashOrder: function() {
        localStorage.removeItem('checkoutData');
        localStorage.removeItem('orderTotal');
        
        this.showNotification('❌ Order cancelled. Redirecting to menu...', 'warning');
        
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 2000);
    },

    /**
     * Show receipt after payment
     */
    showReceipt: function() {
        document.getElementById('proofPaymentSection').style.display = 'none';
        document.getElementById('paymentNavigation').style.display = 'none';
        document.getElementById('receiptSection').style.display = 'block';
        
        this.populateReceipt();
        this.saveOrder('eft');
        
        this.showNotification('🎉 Payment recorded! Your receipt is ready.', 'success');
    },

    /**
     * Populate receipt with order data
     */
    populateReceipt: function() {
        const totals = this.calculateTotals();
        const now = new Date();
        const cart = getFormattedCart();
        
        const dateStr = now.toLocaleString('en-ZA', { dateStyle: 'full', timeStyle: 'short' });
        const address = `${this.orderData.address}, ${this.orderData.city}, ${this.orderData.zipCode}`;
        
        const deliveryOption = document.getElementById('deliveryOption')?.value || 'standard';
        const deliveryText = {
            'express': 'Express Delivery',
            'pickup': 'Store Pickup',
            'standard': 'Standard Delivery'
        }[deliveryOption];
        
        const paymentText = this.selectedPayment === 'eft' ? 'EFT / Bank Transfer' : 'Cash on Delivery/Pickup';
        
        document.getElementById('receiptDate').textContent = dateStr;
        document.getElementById('receiptOrder').textContent = `#${this.orderNumber}`;
        document.getElementById('receiptCustomer').textContent = `${this.orderData.firstName} ${this.orderData.lastName}`;
        document.getElementById('receiptEmail').textContent = this.orderData.email;
        document.getElementById('receiptPhone').textContent = this.orderData.phone;
        document.getElementById('receiptAddress').textContent = address;
        document.getElementById('receiptDelivery').textContent = deliveryText;
        document.getElementById('receiptPayment').textContent = paymentText;
        
        let itemsHtml = '';
        cart.forEach(item => {
            itemsHtml += `
                <div class="receipt-row">
                    <span>${item.name} x${item.quantity}</span>
                    <span>R${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `;
        });
        document.getElementById('receiptItems').innerHTML = itemsHtml;
        
        document.getElementById('receiptSubtotal').textContent = `R${totals.subtotal.toFixed(2)}`;
        document.getElementById('receiptDeliveryFee').textContent = `R${totals.deliveryFee.toFixed(2)}`;
        document.getElementById('receiptTotal').textContent = `R${totals.grandTotal.toFixed(2)}`;
        
        document.getElementById('receiptNumber').textContent = 'RCP' + Math.floor(100000 + Math.random() * 900000);
    },

    /**
     * Print receipt as PDF
     */
    printReceipt: function() {
        window.print();
        this.showNotification('🖨️ Printing receipt...', 'info');
    },

    /**
     * Download as PDF
     */
    downloadPDF: function() {
        const receipt = document.getElementById('receiptContent');
        const orderNumber = document.getElementById('receiptOrder').textContent;
        
        const receiptClone = receipt.cloneNode(true);
        receiptClone.style.width = '100%';
        receiptClone.style.padding = '20px';
        receiptClone.style.background = 'white';
        receiptClone.style.border = '2px solid #8B4513';
        receiptClone.style.borderRadius = '15px';
        receiptClone.style.margin = '0';
        receiptClone.style.boxSizing = 'border-box';
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Mr. Creamy Donut - Receipt ${orderNumber}</title>
                <style>
                    body {
                        font-family: 'Poppins', Arial, sans-serif;
                        padding: 40px 20px;
                        background: #f5f5f5;
                        display: flex;
                        justify-content: center;
                    }
                    .receipt-container {
                        max-width: 800px;
                        width: 100%;
                        margin: 0 auto;
                    }
                    .receipt {
                        background: white;
                        border: 2px solid #8B4513;
                        border-radius: 15px;
                        padding: 30px;
                        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    }
                    .receipt-header {
                        text-align: center;
                        margin-bottom: 25px;
                        padding-bottom: 20px;
                        border-bottom: 2px dashed #8B4513;
                    }
                    .receipt-header h2 {
                        color: #8B4513;
                        margin: 0 0 5px;
                        font-size: 28px;
                    }
                    .receipt-header p {
                        color: #666;
                        margin: 5px 0;
                    }
                    .receipt-details {
                        margin-bottom: 25px;
                    }
                    .receipt-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid #eee;
                    }
                    .receipt-row.total {
                        font-weight: bold;
                        font-size: 18px;
                        color: #8B4513;
                        border-bottom: none;
                        margin-top: 10px;
                    }
                    .receipt-footer {
                        text-align: center;
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 2px dashed #8B4513;
                        color: #666;
                    }
                    @media print {
                        body { background: white; padding: 0; }
                        .receipt { box-shadow: none; border: 2px solid #8B4513; }
                    }
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
            </head>
            <body>
                <div class="receipt-container">
                    ${receiptClone.outerHTML}
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 500);
                        }, 500);
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        this.showNotification('📄 PDF preview opened. Check your downloads folder.', 'success');
    },

    /**
     * Process cash order
     */
    processCashOrder: function() {
        this.saveOrder('cash');
        
        this.showNotification('✅ Order confirmed! Please have cash ready for delivery/pickup.', 'success');
        
        this.showModal(
            'Would you like to send your order details to the store via WhatsApp or Email? This helps us prepare faster!',
            () => {
                const cashActions = document.getElementById('cashActions');
                if (cashActions) {
                    cashActions.style.display = 'block';
                } else {
                    this.createCashActions();
                }
                
                setTimeout(() => {
                    document.getElementById('cashActions').scrollIntoView({ behavior: 'smooth' });
                    this.showNotification('👆 Choose WhatsApp or Email to send your order details', 'info');
                }, 100);
            }
        );
    },

    /**
     * Show cash receipt
     */
    showCashReceipt: function() {
        document.getElementById('step3').classList.remove('active');
        
        const totals = this.calculateTotals();
        const now = new Date();
        const cart = getFormattedCart();
        
        const dateStr = now.toLocaleString('en-ZA', { dateStyle: 'full', timeStyle: 'short' });
        const receiptNum = 'RCP' + Math.floor(100000 + Math.random() * 900000);
        
        let itemsHtml = '';
        cart.forEach(item => {
            itemsHtml += `
                <div class="receipt-row">
                    <span>${item.name} x${item.quantity}</span>
                    <span>R${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `;
        });
        
        const deliveryOption = document.getElementById('deliveryOption')?.value || 'standard';
        const deliveryType = deliveryOption === 'pickup' ? 'Pickup' : 'Delivery';
        const address = deliveryOption === 'pickup' 
            ? 'In-store Collection' 
            : `${this.orderData.address}, ${this.orderData.city}`;
        
        const receiptHtml = `
            <h2>Order Confirmed!</h2>
            <div class="receipt" id="receiptContent">
                <div class="receipt-header">
                    <h2>🍩 Mr. Creamy Donut</h2>
                    <p>Order Confirmation</p>
                    <p>${dateStr}</p>
                </div>
                
                <div class="receipt-details">
                    <div class="receipt-row"><span>Order Number:</span><span>#${this.orderNumber}</span></div>
                    <div class="receipt-row"><span>Customer:</span><span>${this.orderData.firstName} ${this.orderData.lastName}</span></div>
                    <div class="receipt-row"><span>Email:</span><span>${this.orderData.email}</span></div>
                    <div class="receipt-row"><span>Phone:</span><span>${this.orderData.phone}</span></div>
                    <div class="receipt-row"><span>${deliveryOption === 'pickup' ? 'Collection:' : 'Address:'}</span><span>${address}</span></div>
                    
                    <h3 style="margin: 20px 0 10px; color: #8B4513;">Items</h3>
                    ${itemsHtml}
                    
                    <div class="receipt-row"><span>Subtotal:</span><span>R${totals.subtotal.toFixed(2)}</span></div>
                    <div class="receipt-row"><span>Delivery Fee:</span><span>R${totals.deliveryFee.toFixed(2)}</span></div>
                    <div class="receipt-row total"><span>Total to Pay:</span><span>R${totals.grandTotal.toFixed(2)}</span></div>
                </div>
                
                <div class="receipt-footer">
                    <p>Payment Method: Cash on ${deliveryType}</p>
                    <p>Please have exact amount ready.</p>
                    <p>Thank you for ordering from Mr. Creamy Donut! 🍩</p>
                    <p style="font-size: 12px; margin-top: 10px;">Receipt #: ${receiptNum}</p>
                </div>
            </div>
            
            <div class="receipt-actions">
                <button class="btn btn-whatsapp" onclick="checkout.sendOrderDetailsWhatsApp()">
                    <i class="fab fa-whatsapp"></i> WhatsApp Order
                </button>
                <button class="btn btn-email" onclick="checkout.sendOrderDetailsEmail()">
                    <i class="fas fa-envelope"></i> Email Order
                </button>
                <button class="btn btn-cancel" onclick="checkout.showCancelModal()">
                    <i class="fas fa-times"></i> Cancel Order
                </button>
                <button class="btn btn-brown" onclick="checkout.downloadPDF()">
                    <i class="fas fa-file-pdf"></i> Download PDF
                </button>
                <button class="btn btn-outline btn-pdf" onclick="checkout.printReceipt()">
                    <i class="fas fa-print"></i> Print
                </button>
                <a href="index.html" class="btn btn-outline">
                    <i class="fas fa-home"></i> Home
                </a>
            </div>
        `;
        
        document.querySelector('.checkout-form').innerHTML = receiptHtml;
        this.currentStep = 4;
        this.updateStepDisplay();
        
        this.showNotification('🎉 Order confirmed! Your receipt is ready.', 'success');
    },

    /**
     * Save order to localStorage
     */
    saveOrder: function(paymentMethod) {
        const totals = this.calculateTotals();
        const cart = getFormattedCart();
        
        const order = {
            id: this.orderNumber,
            date: new Date().toISOString(),
            status: paymentMethod === 'eft' ? 'awaiting_payment' : 'confirmed',
            shipping: this.orderData,
            items: cart,
            payment: { method: paymentMethod, amount: totals.grandTotal.toFixed(2) },
            totals: totals
        };
        
        const orders = JSON.parse(localStorage.getItem('mrCreamyOrders')) || [];
        orders.push(order);
        localStorage.setItem('mrCreamyOrders', JSON.stringify(orders));
        
        if (typeof clearCart === 'function') {
            clearCart();
        } else {
            localStorage.removeItem('mrCreamyCart');
        }
        
        localStorage.removeItem('checkoutData');
    },

    /**
     * Show notification
     */
    showNotification: function(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = 'notification ' + type;
        notification.style.display = 'block';
        
        setTimeout(() => notification.style.display = 'none', 3000);
    },

    /**
     * Initialize form validation
     */
    initFormValidation: function() {
        // Already handled in other methods
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => checkout.init());

// Make checkout available globally
window.checkout = checkout;