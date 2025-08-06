// Amarjit Electrical Store - Cross-Device Application

class ElectricalStoreApp {
    constructor() {
        // Your password (change this!)
        this.PASSWORD = 'amarjit123';
        
        // Google Drive API configuration - REAL CREDENTIALS
        this.CLIENT_ID = '2633417852-d1qhnoi6rlgb191l7h0ohtfoiiduivmb.apps.googleusercontent.com';
        this.API_KEY = 'AIzaSyAHaAwjtqBnoOMuZY_1yFA8X4CBnkf2eYc';
        
        // App state
        this.isLoggedIn = false;
        this.isGoogleDriveConnected = false;
        this.customers = [];
        this.appFolderId = null;
        
        this.init();
    }

    async init() {
        const sessionLogin = sessionStorage.getItem('currentSession');
        if (sessionLogin === 'active') {
            this.isLoggedIn = true;
            this.showMainApp();
            this.checkGoogleDriveConnection();
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('googleDriveBtn').addEventListener('click', () => {
            this.handleGoogleDriveConnection();
        });
    }

    handleLogin() {
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        if (password === this.PASSWORD) {
            sessionStorage.setItem('currentSession', 'active');
            this.isLoggedIn = true;
            this.showMainApp();
            this.loadLocalData();
            this.checkGoogleDriveConnection();
        } else {
            errorDiv.classList.remove('hidden');
            document.getElementById('password').value = '';
            setTimeout(() => errorDiv.classList.add('hidden'), 3000);
        }
    }

    async checkGoogleDriveConnection() {
        this.updateGoogleDriveStatus(false);
    }

    async handleGoogleDriveConnection() {
        this.showLoading();
        
        try {
            await this.initializeGoogleAPI();
            
            const authInstance = gapi.auth2.getAuthInstance();
            if (!authInstance.isSignedIn.get()) {
                await authInstance.signIn();
            }

            this.isGoogleDriveConnected = true;
            this.updateGoogleDriveStatus(true);
            this.showAlert('Google Drive connected successfully! Data will sync automatically.', 'success');
            
        } catch (error) {
            console.error('Google Drive connection failed:', error);
            this.showAlert('Failed to connect to Google Drive. Please try again.', 'danger');
        }
        
        this.hideLoading();
    }

    async initializeGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (typeof gapi === 'undefined') {
                reject('Google API not loaded');
                return;
            }

            gapi.load('auth2:client', async () => {
                try {
                    await gapi.client.init({
                        apiKey: this.API_KEY,
                        clientId: this.CLIENT_ID,
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                        scope: 'https://www.googleapis.com/auth/drive.file'
                    });
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
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
        this.saveLocalData();

        if (this.isGoogleDriveConnected) {
            await this.syncToGoogleDrive();
        }

        document.getElementById('addCustomerForm').reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        modal.hide();

        this.displayCustomers();
        this.updateDashboard();
        this.showAlert('Customer added successfully!', 'success');
    }

    async syncToGoogleDrive() {
        if (!this.isGoogleDriveConnected) return;
        
        try {
            await this.saveToGoogleDrive('customers.json', this.customers);
            this.showAlert('Data synced to Google Drive!', 'info');
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }

    async saveToGoogleDrive(fileName, data) {
        const fileContent = JSON.stringify(data, null, 2);
        
        const metadata = {
            name: fileName,
            parents: ['appDataFolder']
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', new Blob([fileContent], {type: 'application/json'}));

        const accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;

        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: form
        });
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
                            <button class="btn btn-sm btn-primary me-1">
                                <i class="fas fa-plus"></i> Sale
                            </button>
                            <button class="btn btn-sm btn-success me-1">
                                <i class="fas fa-money-bill"></i> Payment
                            </button>
                            <button class="btn btn-sm btn-outline-info">
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

    updateGoogleDriveStatus(connected) {
        const btn = document.getElementById('googleDriveBtn');
        const status = document.getElementById('driveStatus');
        
        if (connected) {
            btn.className = 'btn btn-success me-2';
            status.innerHTML = '<i class="fas fa-check"></i> Drive Connected';
        } else {
            btn.className = 'btn btn-outline-primary me-2';
            status.innerHTML = '<i class="fab fa-google-drive"></i> Connect Drive';
        }
    }

    saveLocalData() {
        localStorage.setItem('customers', JSON.stringify(this.customers));
    }

    loadLocalData() {
        this.customers = JSON.parse(localStorage.getItem('customers') || '[]');
        this.updateDashboard();
        this.displayCustomers();
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
        this.loadLocalData();
    }

    logout() {
        sessionStorage.removeItem('currentSession');
        this.isLoggedIn = false;
        this.isGoogleDriveConnected = false;
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
