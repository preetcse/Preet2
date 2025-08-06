// Amarjit Electrical Store - GitHub Database Version
// Simple, reliable, cross-device compatible

class ElectricalStoreApp {
    constructor() {
        // Your password (change this!)
        this.PASSWORD = 'amarjit123';
        
        // GitHub configuration (using your existing repo)
        this.GITHUB_OWNER = 'preetcse';
        this.GITHUB_REPO = 'Preet2';
        this.DATA_FILE = 'store_data.json';
        
        // App state
        this.isLoggedIn = false;
        this.customers = [];
        this.transactions = [];
        this.payments = [];
        
        this.init();
    }

    async init() {
        const sessionLogin = sessionStorage.getItem('currentSession');
        if (sessionLogin === 'active') {
            this.isLoggedIn = true;
            this.showMainApp();
            await this.loadData();
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('googleDriveBtn').addEventListener('click', () => {
            this.handleDataSync();
        });
    }

    async handleLogin() {
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        if (password === this.PASSWORD) {
            sessionStorage.setItem('currentSession', 'active');
            this.isLoggedIn = true;
            this.showMainApp();
            await this.loadData();
        } else {
            errorDiv.classList.remove('hidden');
            document.getElementById('password').value = '';
            setTimeout(() => errorDiv.classList.add('hidden'), 3000);
        }
    }

    async loadData() {
        this.showLoading();
        
        try {
            // Try to load from GitHub first
            await this.loadFromGitHub();
            this.updateCloudStatus(true);
            this.showAlert('Data loaded from cloud successfully!', 'success');
        } catch (error) {
            console.log('Loading from local storage...');
            // Fallback to local storage
            this.loadFromLocal();
            this.updateCloudStatus(false);
        }
        
        this.updateDashboard();
        this.displayCustomers();
        this.hideLoading();
    }

    async loadFromGitHub() {
        const url = `https://api.github.com/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/contents/${this.DATA_FILE}`;
        
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            const content = JSON.parse(atob(data.content));
            
            this.customers = content.customers || [];
            this.transactions = content.transactions || [];
            this.payments = content.payments || [];
            
            // Also save to local storage as backup
            this.saveToLocal();
        } else {
            throw new Error('File not found');
        }
    }

    loadFromLocal() {
        this.customers = JSON.parse(localStorage.getItem('customers') || '[]');
        this.transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        this.payments = JSON.parse(localStorage.getItem('payments') || '[]');
    }

    saveToLocal() {
        localStorage.setItem('customers', JSON.stringify(this.customers));
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        localStorage.setItem('payments', JSON.stringify(this.payments));
    }

    async handleDataSync() {
        if (!this.customers.length && !this.transactions.length && !this.payments.length) {
            this.showAlert('No data to sync. Add some customers first!', 'info');
            return;
        }

        this.showLoading();
        
        try {
            await this.saveToGitHub();
            this.updateCloudStatus(true);
            this.showAlert('Data synced to cloud successfully!', 'success');
        } catch (error) {
            console.error('Sync failed:', error);
            this.showAlert('Sync failed. Data saved locally.', 'warning');
            this.saveToLocal();
        }
        
        this.hideLoading();
    }

    async saveToGitHub() {
        const data = {
            customers: this.customers,
            transactions: this.transactions,
            payments: this.payments,
            lastUpdated: new Date().toISOString()
        };

        const content = btoa(JSON.stringify(data, null, 2));
        
        // First, try to get the current file (to get SHA)
        let sha = null;
        try {
            const getUrl = `https://api.github.com/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/contents/${this.DATA_FILE}`;
            const getResponse = await fetch(getUrl);
            if (getResponse.ok) {
                const existingFile = await getResponse.json();
                sha = existingFile.sha;
            }
        } catch (e) {
            // File doesn't exist yet, that's fine
        }

        // Create/update the file
        const putUrl = `https://api.github.com/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/contents/${this.DATA_FILE}`;
        const putData = {
            message: `Update store data - ${new Date().toLocaleDateString()}`,
            content: content,
            branch: 'main'
        };

        if (sha) {
            putData.sha = sha;
        }

        const response = await fetch(putUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(putData)
        });

        if (!response.ok) {
            throw new Error('Failed to save to GitHub');
        }
    }

    async addCustomer() {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const address = document.getElementById('customerAddress').value.trim();

        if (!name || !phone) {
            this.showAlert('Please fill in customer name and phone number.', 'danger');
            return;
        }

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
            createdDate: new Date().toISOString()
        };

        this.customers.push(customer);
        this.saveToLocal();

        // Clear form and close modal
        document.getElementById('addCustomerForm').reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        modal.hide();

        this.displayCustomers();
        this.updateDashboard();
        this.showAlert('Customer added successfully! Click sync to save to cloud.', 'success');
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
                            <button class="btn btn-sm btn-primary me-1" onclick="app.addSale(${customer.id})">
                                <i class="fas fa-plus"></i> Sale
                            </button>
                            <button class="btn btn-sm btn-success me-1" onclick="app.addPayment(${customer.id})">
                                <i class="fas fa-money-bill"></i> Payment
                            </button>
                            <button class="btn btn-sm btn-outline-info" onclick="app.viewCustomer(${customer.id})">
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
        
        const originalCustomers = this.customers;
        this.customers = filteredCustomers;
        this.displayCustomers();
        this.customers = originalCustomers;
    }

    updateDashboard() {
        document.getElementById('customerCount').textContent = 
            `${this.customers.length} customer${this.customers.length !== 1 ? 's' : ''}`;

        const totalDebt = this.customers.reduce((sum, customer) => sum + customer.totalDebt, 0);
        document.getElementById('totalDebt').textContent = `₹${totalDebt.toFixed(2)} pending`;

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
        } else {
            recentCustomersDiv.innerHTML = '<p class="text-muted">No customers added yet.</p>';
        }
    }

    updateCloudStatus(connected) {
        const btn = document.getElementById('googleDriveBtn');
        const status = document.getElementById('driveStatus');
        
        if (connected) {
            btn.className = 'btn btn-success me-2';
            status.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Sync to Cloud';
        } else {
            btn.className = 'btn btn-outline-primary me-2';
            status.innerHTML = '<i class="fas fa-cloud"></i> Sync to Cloud';
        }
    }

    // Placeholder methods for future features
    addSale(customerId) {
        this.showAlert('Quick Sale feature coming soon!', 'info');
    }

    addPayment(customerId) {
        this.showAlert('Quick Payment feature coming soon!', 'info');
    }

    viewCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            this.showAlert(`Customer: ${customer.name}\nPhone: ${customer.phone}\nDebt: ₹${customer.totalDebt}`, 'info');
        }
    }

    showSection(sectionId) {
        const sections = ['dashboard', 'customers', 'billing', 'reports', 'settings'];
        sections.forEach(section => {
            document.getElementById(section).classList.add('hidden');
        });

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

    showMainApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
    }

    logout() {
        sessionStorage.removeItem('currentSession');
        this.isLoggedIn = false;
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('password').value = '';
    }

    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('hidden');
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        setTimeout(() => {
            if (alert.parentNode) alert.remove();
        }, 4000);
    }
}

// Global functions
function logout() { app.logout(); }
function showSection(section) { app.showSection(section); }
function showAddCustomer() { app.showAddCustomer(); }
function addCustomer() { app.addCustomer(); }
function searchCustomers() { app.searchCustomers(); }

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ElectricalStoreApp();
});
