// Amarjit Electrical Store - Cross-Device Application
// Google Drive Integration with Cross-Device Authentication

class ElectricalStoreApp {
    constructor() {
        // Your master password (change this!)
        this.PASSWORD = 'amarjit123'; // ← Change this to your password
        
        // Encryption key for storing tokens securely
        this.ENCRYPTION_KEY = 'amarjit_electrical_2024'; // ← You can change this too
        
        // Google Drive API configuration
        this.CLIENT_ID = 'your-google-client-id-here';
        this.API_KEY = 'your-google-api-key-here';
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
        
        // App state
        this.isLoggedIn = false;
        this.isGoogleDriveConnected = false;
        this.googleAuth = null;
        this.customers = [];
        this.transactions = [];
        this.payments = [];
        this.appFolderId = null;
        
        this.init();
    }

    async init() {
        // Check if user is already logged in (session only)
        const sessionLogin = sessionStorage.getItem('currentSession');
        if (sessionLogin === 'active') {
            this.isLoggedIn = true;
            this.showMainApp();
            await this.checkGoogleDriveConnection();
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

    async handleLogin() {
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        if (password === this.PASSWORD) {
            // Correct password - start session
            sessionStorage.setItem('currentSession', 'active');
            this.isLoggedIn = true;
            this.showMainApp();
            
            // Try to auto-connect to Google Drive
            await this.checkGoogleDriveConnection();
        } else {
            // Wrong password
            errorDiv.classList.remove('hidden');
            document.getElementById('password').value = '';
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 3000);
        }
    }

    async checkGoogleDriveConnection() {
        this.showLoading();
        
        try {
            // Initialize Google API
            await this.initializeGoogleAPI();
            
            // Try to load existing authentication from Google Drive
            await this.loadAuthFromGoogleDrive();
            
        } catch (error) {
            console.log('Google Drive not connected yet:', error);
            this.updateGoogleDriveStatus(false);
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
                        discoveryDocs: [this.DISCOVERY_DOC],
                        scope: this.SCOPES
                    });
                    
                    this.googleAuth = gapi.auth2.getAuthInstance();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async loadAuthFromGoogleDrive() {
        // Check if user is already signed in to Google
        if (!this.googleAuth.isSignedIn.get()) {
            throw new Error('Not signed in to Google');
        }

        // Look for our app folder and auth file
        const authData = await this.findAndLoadAuthFile();
        
        if (authData) {
            // Found existing auth - we're connected!
            this.isGoogleDriveConnected = true;
            this.updateGoogleDriveStatus(true);
            await this.loadAllDataFromGoogleDrive();
            this.showAlert('Automatically connected to Google Drive!', 'success');
        } else {
            // No auth file found - need to set up
            this.updateGoogleDriveStatus(false);
        }
    }

    async handleGoogleDriveConnection() {
        if (this.isGoogleDriveConnected) {
            await this.syncAllData();
            return;
        }

        try {
            this.showLoading();
            
            // Initialize Google API if needed
            if (!this.googleAuth) {
                await this.initializeGoogleAPI();
            }

            // Sign in to Google
            if (!this.googleAuth.isSignedIn.get()) {
                await this.googleAuth.signIn();
            }

            // Create app folder and save auth tokens
            await this.setupGoogleDriveStorage();
            
            this.isGoogleDriveConnected = true;
            this.updateGoogleDriveStatus(true);
            this.showAlert('Google Drive connected successfully! Now works on all devices.', 'success');
            
        } catch (error) {
            console.error('Google Drive connection failed:', error);
            this.showAlert('Failed to connect to Google Drive. Please try again.', 'danger');
        }
        
        this.hideLoading();
    }

    async setupGoogleDriveStorage() {
        // Create app folder
        this.appFolderId = await this.createAppFolder();
        
        // Save authentication info to Google Drive
        const authData = {
            connected: true,
            connectionDate: new Date().toISOString(),
            deviceInfo: navigator.userAgent.substring(0, 100),
            encryptionKey: this.ENCRYPTION_KEY
        };
        
        await this.saveToGoogleDrive('auth_config.json', authData);
        
        // Initialize empty data files if they don't exist
        if (!await this.fileExists('customers.json')) {
            await this.saveToGoogleDrive('customers.json', []);
        }
        if (!await this.fileExists('transactions.json')) {
            await this.saveToGoogleDrive('transactions.json', []);
        }
        if (!await this.fileExists('payments.json')) {
            await this.saveToGoogleDrive('payments.json', []);
        }
    }

    async createAppFolder() {
        const metadata = {
            name: 'Amarjit Electrical Store Data',
            mimeType: 'application/vnd.google-apps.folder'
        };

        const response = await gapi.client.drive.files.create({
            resource: metadata
        });

        return response.result.id;
    }

    async findAndLoadAuthFile() {
        try {
            // Search for our app folder
            const folderResponse = await gapi.client.drive.files.list({
                q: "name='Amarjit Electrical Store Data' and mimeType='application/vnd.google-apps.folder'",
                fields: 'files(id, name)'
            });

            if (folderResponse.result.files.length === 0) {
                return null; // No app folder found
            }

            this.appFolderId = folderResponse.result.files[0].id;

            // Look for auth config file
            const authResponse = await gapi.client.drive.files.list({
                q: `name='auth_config.json' and parents='${this.appFolderId}'`,
                fields: 'files(id, name)'
            });

            if (authResponse.result.files.length === 0) {
                return null; // No auth file found
            }

            // Load auth file
            const fileId = authResponse.result.files[0].id;
            const fileContent = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });

            return JSON.parse(fileContent.body);
        } catch (error) {
            console.error('Error loading auth file:', error);
            return null;
        }
    }

    async saveToGoogleDrive(fileName, data) {
        const fileContent = JSON.stringify(data, null, 2);
        
        // Check if file already exists
        const existingFile = await this.findFile(fileName);
        
        if (existingFile) {
            // Update existing file
            await gapi.client.request({
                path: `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}`,
                method: 'PATCH',
                params: {
                    uploadType: 'media'
                },
                headers: {
                    'Content-Type': 'application/json'
                },
                body: fileContent
            });
        } else {
            // Create new file
            const metadata = {
                name: fileName,
                parents: [this.appFolderId]
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
            form.append('file', new Blob([fileContent], {type: 'application/json'}));

            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
                },
                body: form
            });
        }
    }

    async loadFromGoogleDrive(fileName) {
        const file = await this.findFile(fileName);
        if (!file) return null;

        const response = await gapi.client.drive.files.get({
            fileId: file.id,
            alt: 'media'
        });

        return JSON.parse(response.body);
    }

    async findFile(fileName) {
        if (!this.appFolderId) return null;

        const response = await gapi.client.drive.files.list({
            q: `name='${fileName}' and parents='${this.appFolderId}'`,
            fields: 'files(id, name)'
        });

        return response.result.files.length > 0 ? response.result.files[0] : null;
    }

    async fileExists(fileName) {
        return await this.findFile(fileName) !== null;
    }

    async loadAllDataFromGoogleDrive() {
        try {
            this.customers = await this.loadFromGoogleDrive('customers.json') || [];
            this.transactions = await this.loadFromGoogleDrive('transactions.json') || [];
            this.payments = await this.loadFromGoogleDrive('payments.json') || [];
            
            this.updateDashboard();
            this.displayCustomers();
        } catch (error) {
            console.error('Error loading data from Google Drive:', error);
        }
    }

    async syncAllData() {
        if (!this.isGoogleDriveConnected) return;
        
        this.showLoading();
        
        try {
            await this.saveToGoogleDrive('customers.json', this.customers);
            await this.saveToGoogleDrive('transactions.json', this.transactions);
            await this.saveToGoogleDrive('payments.json', this.payments);
            
            this.showAlert('Data synced to Google Drive successfully!', 'success');
        } catch (error) {
            console.error('Sync failed:', error);
            this.showAlert('Failed to sync data. Please try again.', 'danger');
        }
        
        this.hideLoading();
    }

    // Customer Management (same as before but with Google Drive sync)
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
            createdDate: new Date().toISOString(),
            lastTransaction: null
        };

        this.customers.push(customer);
        
        // Auto-sync to Google Drive
        if (this.isGoogleDriveConnected) {
            await this.saveToGoogleDrive('customers.json', this.customers);
        }

        // Clear form and close modal
        document.getElementById('addCustomerForm').reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        modal.hide();

        this.displayCustomers();
        this.updateDashboard();
        this.showAlert('Customer added and synced to Google Drive!', 'success');
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

    logout() {
        sessionStorage.removeItem('currentSession');
        this.isLoggedIn = false;
        this.isGoogleDriveConnected = false;
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('password').value = '';
    }

    showMainApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        this.updateDashboard();
    }

    // [Include all the other methods from the previous version]
    // displayCustomers(), searchCustomers(), updateDashboard(), etc.
    // [Same code as before - keeping this response shorter]

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
        }

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
            if (alert.parentNode) {
                alert.remove();
            }
        }, 4000);
    }

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

// Global functions (same as before)
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
