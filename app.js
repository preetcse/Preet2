// Amarjit Electrical Store - Main Application
// Google Drive Integration + Simple Authentication

class ElectricalStoreApp {
    constructor() {
        // Simple password (change this to your preferred password)
        this.PASSWORD = 'amarjit123'; // ← Change this to your password
        
        // Google Drive API configuration
        this.CLIENT_ID = 'your-google-client-id-here'; // ← We'll get this from Google Console
        this.API_KEY = 'your-google-api-key-here';     // ← We'll get this from Google Console
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
        
        // App state
        this.isLoggedIn = false;
        this.isGoogleDriveConnected = false;
        this.customers = [];
        this.transactions = [];
        this.payments = [];
        
        this.init();
    }

    async init() {
        // Check if user is already logged in
        const savedLogin = localStorage.getItem('storeLogin');
        if (savedLogin === 'true') {
            this.showMainApp();
            await this.initializeGoogleDrive();
        }

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Google Drive button
        document.getElementById('googleDriveBtn').addEventListener('click', () => {
            this.connectGoogleDrive();
        });
    }

    handleLogin() {
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        if (password === this.PASSWORD) {
            // Correct password
            localStorage.setItem('storeLogin', 'true');
            this.isLoggedIn = true;
            this.showMainApp();
            this.initializeGoogleDrive();
        } else {
            // Wrong password
            errorDiv.classList.remove('hidden');
            document.getElementById('password').value = '';
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 3000);
        }
    }

    logout() {
        localStorage.removeItem('storeLogin');
        localStorage.removeItem('googleTokens');
        this.isLoggedIn = false;
        this.isGoogleDriveConnected = false;
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('password').value = '';
    }

    showMainApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        this.loadLocalData();
        this.updateDashboard();
    }

    async initializeGoogleDrive() {
        // Check if we have stored tokens
        const savedTokens = localStorage.getItem('googleTokens');
        if (savedTokens) {
            this.isGoogleDriveConnected = true;
            this.updateGoogleDriveStatus();
            await this.loadDataFromGoogleDrive();
        }
    }

    async connectGoogleDrive() {
        if (this.isGoogleDriveConnected) {
            // Already connected, just sync data
            await this.syncWithGoogleDrive();
            return;
        }

        // For now, we'll simulate Google Drive connection
        // In the next step, we'll add real Google API integration
        this.simulateGoogleDriveConnection();
    }

    simulateGoogleDriveConnection() {
        // Simulate connection process
        this.showLoading();
        
        setTimeout(() => {
            this.isGoogleDriveConnected = true;
            localStorage.setItem('googleTokens', 'simulated_token');
            this.updateGoogleDriveStatus();
            this.hideLoading();
            this.showAlert('Google Drive connected successfully!', 'success');
        }, 2000);
    }

    updateGoogleDriveStatus() {
        const btn = document.getElementById('googleDriveBtn');
        const status = document.getElementById('driveStatus');
        
        if (this.isGoogleDriveConnected) {
            btn.className = 'btn btn-success me-2';
            status.textContent = 'Drive Connected';
        } else {
            btn.className = 'btn btn-outline-primary me-2';
            status.textContent = 'Connect Drive';
        }
    }

    // Customer Management
    addCustomer() {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const address = document.getElementById('customerAddress').value.trim();

        if (!name || !phone) {
            this.showAlert('Please fill in customer name and phone number.', 'danger');
            return;
        }

        // Check if customer already exists
        const existingCustomer = this.customers.find(c => c.phone === phone);
        if (existingCustomer) {
            this.showAlert('Customer with this phone number already exists.', 'warning');
            return;
        }

        const customer = {
            id: Date.now(),
            name: name,
            phone: phone,
            address: address,
            totalDebt: 0,
            createdDate: new Date().toISOString(),
            lastTransaction: null
        };

        this.customers.push(customer);
        this.saveLocalData();
        
        if (this.isGoogleDriveConnected) {
            this.syncWithGoogleDrive();
        }

        // Clear form and close modal
        document.getElementById('addCustomerForm').reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        modal.hide();

        this.displayCustomers();
        this.updateDashboard();
        this.showAlert('Customer added successfully!', 'success');
    }

    displayCustomers() {
        const customerList = document.getElementById('customerList');
        
        if (this.customers.length === 0) {
            customerList.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-4">
                        <i class="fas fa-users text-muted" style="font-size: 3rem;"></i>
                        <h5 class="text-muted mt-3">No customers yet</h5>
                        <p class="text-muted">Add your first customer to get started.</p>
                    </div>
                </div>
            `;
            return;
        }

        customerList.innerHTML = this.customers.map(customer => `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card customer-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="card-title mb-1">${customer.name}</h6>
                                <p class="text-muted mb-2">
                                    <i class="fas fa-phone"></i> ${customer.phone}
                                </p>
                                ${customer.address ? `<p class="text-muted small mb-2">${customer.address}</p>` : ''}
                            </div>
                            <div class="text-end">
                                <span class="badge ${customer.totalDebt > 0 ? 'bg-danger' : 'bg-success'}">
                                    ₹${customer.totalDebt.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <button class="btn btn-sm btn-primary me-1" 
                                    onclick="app.quickSale(${customer.id})">
                                <i class="fas fa-plus"></i> Sale
                            </button>
                            <button class="btn btn-sm btn-success me-1" 
                                    onclick="app.quickPayment(${customer.id})">
                                <i class="fas fa-money-bill"></i> Payment
                            </button>
                            <button class="btn btn-sm btn-outline-info" 
                                    onclick="app.viewCustomer(${customer.id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    searchCustomers() {
        const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
        const filteredCustomers = this.customers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.phone.includes(searchTerm)
        );
        
        // Temporarily replace customers array for display
        const originalCustomers = this.customers;
        this.customers = filteredCustomers;
        this.displayCustomers();
        this.customers = originalCustomers;
    }

    updateDashboard() {
        // Update customer count
        document.getElementById('customerCount').textContent = 
            `${this.customers.length} customer${this.customers.length !== 1 ? 's' : ''}`;

        // Calculate total debt
        const totalDebt = this.customers.reduce((sum, customer) => sum + customer.totalDebt, 0);
        document.getElementById('totalDebt').textContent = `₹${totalDebt.toFixed(2)} pending`;

        // Show recent customers
        const recentCustomers = this.customers.slice(-5).reverse();
        const recentCustomersDiv = document.getElementById('recentCustomers');
        
        if (recentCustomers.length > 0) {
            recentCustomersDiv.innerHTML = recentCustomers.map(customer => `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                        <strong>${customer.name}</strong><br>
                        <small class="text-muted">${customer.phone}</small>
                    </div>
                    <span class="badge ${customer.totalDebt > 0 ? 'bg-danger' : 'bg-success'}">
                        ₹${customer.totalDebt.toFixed(2)}
                    </span>
                </div>
            `).join('');
        }

        // Show customers with pending payments
        const customersWithDebt = this.customers.filter(c => c.totalDebt > 0);
        const pendingPaymentsDiv = document.getElementById('pendingPayments');
        
        if (customersWithDebt.length > 0) {
            pendingPaymentsDiv.innerHTML = customersWithDebt.map(customer => `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                        <strong>${customer.name}</strong><br>
                        <small class="text-muted">${customer.phone}</small>
                    </div>
                    <span class="debt-amount">₹${customer.totalDebt.toFixed(2)}</span>
                </div>
            `).join('');
        }
    }

    // Data Management
    saveLocalData() {
        localStorage.setItem('customers', JSON.stringify(this.customers));
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        localStorage.setItem('payments', JSON.stringify(this.payments));
    }

    loadLocalData() {
        this.customers = JSON.parse(localStorage.getItem('customers') || '[]');
        this.transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        this.payments = JSON.parse(localStorage.getItem('payments') || '[]');
    }

    async syncWithGoogleDrive() {
        if (!this.isGoogleDriveConnected) return;
        
        this.showLoading();
        
        // Simulate Google Drive sync
        setTimeout(() => {
            this.hideLoading();
            this.showAlert('Data synced with Google Drive!', 'info');
        }, 1500);
    }

    async loadDataFromGoogleDrive() {
        // This will be implemented with real Google Drive API
        console.log('Loading data from Google Drive...');
    }

    // UI Helpers
    showSection(sectionId) {
        // Hide all sections
        const sections = ['dashboard', 'customers', 'billing', 'reports', 'settings'];
        sections.forEach(section => {
            document.getElementById(section).classList.add('hidden');
        });

        // Show requested section
        if (sectionId === 'customers') {
            document.getElementById('customers').classList.remove('hidden');
            this.displayCustomers();
        } else {
            document.getElementById('dashboard').classList.remove('hidden');
        }
    }

    showAddCustomer() {
        const modal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
        modal.show();
    }

    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('hidden');
    }

    showAlert(message, type = 'info') {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 4000);
    }

    // Placeholder methods for future features
    quickSale(customerId) {
        this.showAlert('Quick Sale feature coming soon!', 'info');
    }

    quickPayment(customerId) {
        this.showAlert('Quick Payment feature coming soon!', 'info');
    }

    viewCustomer(customerId) {
        this.showAlert('Customer details view coming soon!', 'info');
    }
}

// Global functions
function logout() {
    app.logout();
}

function showSection(section) {
    app.showSection(section);
}

function showAddCustomer() {
    app.showAddCustomer();
}

function addCustomer() {
    app.addCustomer();
}

function searchCustomers() {
    app.searchCustomers();
}

// Initialize app when page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ElectricalStoreApp();
});
