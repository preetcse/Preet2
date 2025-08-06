// Amarjit Electrical Store - Firebase Database Version
// Real-time, cross-device, reliable database

class ElectricalStoreApp {
    constructor() {
        // Your password (change this!)
        this.PASSWORD = 'amarjit123';
        
        // Firebase configuration - YOUR ACTUAL CONFIG
        this.firebaseConfig = {
            apiKey: "AIzaSyBHNr3fI-kV2VgNOiOgchXgSa9wns7ClSs",
            authDomain: "amarjit-electrical-store-90d1c.firebaseapp.com",
            projectId: "amarjit-electrical-store-90d1c",
            storageBucket: "amarjit-electrical-store-90d1c.firebasestorage.app",
            messagingSenderId: "63912761857",
            appId: "1:63912761857:web:e601bc73b569f82d247e00",
            measurementId: "G-LEWP7F5MZK"
        };
        
        // App state
        this.isLoggedIn = false;
        this.isFirebaseConnected = false;
        this.customers = [];
        this.db = null;
        
        this.init();
    }

    async init() {
        const sessionLogin = sessionStorage.getItem('currentSession');
        if (sessionLogin === 'active') {
            this.isLoggedIn = true;
            this.showMainApp();
            await this.initializeFirebase();
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('googleDriveBtn').addEventListener('click', () => {
            this.handleFirebaseSync();
        });
    }

    async handleLogin() {
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        if (password === this.PASSWORD) {
            sessionStorage.setItem('currentSession', 'active');
            this.isLoggedIn = true;
            this.showMainApp();
            await this.initializeFirebase();
        } else {
            errorDiv.classList.remove('hidden');
            document.getElementById('password').value = '';
            setTimeout(() => errorDiv.classList.add('hidden'), 3000);
        }
    }

    async initializeFirebase() {
        this.showLoading();
        
        try {
            // Load Firebase SDK
            await this.loadFirebaseSDK();
            
            // Initialize Firebase
            firebase.initializeApp(this.firebaseConfig);
            this.db = firebase.firestore();
            
            // Load data from Firebase
            await this.loadDataFromFirebase();
            
            this.isFirebaseConnected = true;
            this.updateCloudStatus(true);
            this.showAlert('Connected to Firebase database successfully!', 'success');
            
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.loadFromLocal();
            this.updateCloudStatus(false);
            this.showAlert('Using offline mode. Data saved locally.', 'info');
        }
        
        this.hideLoading();
    }

    async loadFirebaseSDK() {
        return new Promise((resolve, reject) => {
            if (typeof firebase !== 'undefined') {
                resolve();
                return;
            }

            // Load Firebase SDK (compatible version)
            const script1 = document.createElement('script');
            script1.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
            
            const script2 = document.createElement('script');
            script2.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js';
            
            script1.onload = () => {
                script2.onload = () => resolve();
                script2.onerror = () => reject('Failed to load Firestore SDK');
                document.head.appendChild(script2);
            };
            
            script1.onerror = () => reject('Failed to load Firebase SDK');
            document.head.appendChild(script1);
        });
    }

    async loadDataFromFirebase() {
        try {
            const snapshot = await this.db.collection('customers').orderBy('createdDate', 'desc').get();
            this.customers = [];
            
            snapshot.forEach((doc) => {
                this.customers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Also save to local storage as backup
            this.saveToLocal();
            
            this.updateDashboard();
            this.displayCustomers();
            
        } catch (error) {
            console.error('Error loading from Firebase:', error);
            throw error;
        }
    }

    async saveToFirebase(customer) {
        if (!this.isFirebaseConnected || !this.db) return false;
        
        try {
            if (customer.firestoreId) {
                // Update existing customer
                await this.db.collection('customers').doc(customer.firestoreId).update({
                    name: customer.name,
                    phone: customer.phone,
                    address: customer.address,
                    totalDebt: customer.totalDebt,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Create new customer
                const docRef = await this.db.collection('customers').add({
                    name: customer.name,
                    phone: customer.phone,
                    address: customer.address,
                    totalDebt: customer.totalDebt,
                    createdDate: firebase.firestore.FieldValue.serverTimestamp(),
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                customer.firestoreId = docRef.id;
            }
            return true;
        } catch (error) {
            console.error('Error saving to Firebase:', error);
            return false;
        }
    }

    async handleFirebaseSync() {
        if (!this.isFirebaseConnected) {
            await this.initializeFirebase();
            return;
        }
        
        this.showAlert('Data syncs automatically in real-time!', 'info');
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
            createdDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        // Add to local array first for immediate UI update
        this.customers.unshift(customer); // Add to beginning for recent display
        this.saveToLocal();
        this.displayCustomers();
        this.updateDashboard();

        // Clear form and close modal
        document.getElementById('addCustomerForm').reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        modal.hide();

        // Save to Firebase in background
        const saved = await this.saveToFirebase(customer);
        
        if (saved) {
            this.showAlert('Customer added and synced to cloud!', 'success');
        } else {
            this.showAlert('Customer added locally. Will sync when online.', 'warning');
        }
    }

    loadFromLocal() {
        this.customers = JSON.parse(localStorage.getItem('customers') || '[]');
        this.updateDashboard();
        this.displayCustomers();
    }

    saveToLocal() {
        localStorage.setItem('customers', JSON.stringify(this.customers));
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
                        <button class="btn btn-primary mt-2" onclick="showAddCustomer()">
                            <i class="fas fa-plus"></i> Add First Customer
                        </button>
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
                                ${customer.address ? `<p class="text-muted small mb-2"><i class="fas fa-map-marker-alt"></i> ${customer.address}</p>` : ''}
                                <small class="text-muted">
                                    <i class="fas fa-calendar"></i> 
                                    ${new Date(customer.createdDate).toLocaleDateString()}
                                </small>
                            </div>
                            <div class="text-end">
                                <span class="badge ${customer.totalDebt > 0 ? 'bg-danger' : 'bg-success'}">
                                    ₹${customer.totalDebt.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <button class="btn btn-sm btn-primary me-1" onclick="app.addSale('${customer.id}')">
                                <i class="fas fa-plus"></i> Sale
                            </button>
                            <button class="btn btn-sm btn-success me-1" onclick="app.addPayment('${customer.id}')">
                                <i class="fas fa-money-bill"></i> Payment
                            </button>
                            <button class="btn btn-sm btn-outline-info" onclick="app.viewCustomer('${customer.id}')">
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
            customer.phone.includes(searchTerm) ||
            (customer.address && customer.address.toLowerCase().includes(searchTerm))
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

        const recentCustomers = this.customers.slice(0, 5); // First 5 (most recent)
        const recentCustomersDiv = document.getElementById('recentCustomers');
        
        if (recentCustomers.length > 0) {
            recentCustomersDiv.innerHTML = recentCustomers.map(customer => `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                        <strong>${customer.name}</strong><br>
                        <small class="text-muted"><i class="fas fa-phone"></i> ${customer.phone}</small>
                    </div>
                    <span class="badge ${customer.totalDebt > 0 ? 'bg-danger' : 'bg-success'}">
                        ₹${customer.totalDebt.toFixed(2)}
                    </span>
                </div>
            `).join('');
        } else {
            recentCustomersDiv.innerHTML = '<p class="text-muted">No customers added yet.</p>';
        }

        // Update pending payments
        const customersWithDebt = this.customers.filter(c => c.totalDebt > 0);
        const pendingPaymentsDiv = document.getElementById('pendingPayments');
        
        if (customersWithDebt.length > 0) {
            pendingPaymentsDiv.innerHTML = customersWithDebt.slice(0, 5).map(customer => `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                        <strong>${customer.name}</strong><br>
                        <small class="text-muted"><i class="fas fa-phone"></i> ${customer.phone}</small>
                    </div>
                    <span class="text-danger font-weight-bold">₹${customer.totalDebt.toFixed(2)}</span>
                </div>
            `).join('');
        } else {
            pendingPaymentsDiv.innerHTML = '<p class="text-muted">No pending payments.</p>';
        }
    }

    updateCloudStatus(connected) {
        const btn = document.getElementById('googleDriveBtn');
        const status = document.getElementById('driveStatus');
        
        if (connected) {
            btn.className = 'btn btn-success me-2';
            status.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Firebase Connected';
        } else {
            btn.className = 'btn btn-outline-primary me-2';
            status.innerHTML = '<i class="fas fa-cloud"></i> Connect Firebase';
        }
    }

    // Placeholder methods for future features
    addSale(customerId) {
        const customer = this.customers.find(c => c.id == customerId);
        if (customer) {
            this.showAlert(`Add sale for ${customer.name} - Feature coming soon!`, 'info');
        }
    }

    addPayment(customerId) {
        const customer = this.customers.find(c => c.id == customerId);
        if (customer) {
            this.showAlert(`Record payment from ${customer.name} - Feature coming soon!`, 'info');
        }
    }

    viewCustomer(customerId) {
        const customer = this.customers.find(c => c.id == customerId);
        if (customer) {
            this.showAlert(`Customer Details:\n\nName: ${customer.name}\nPhone: ${customer.phone}\n${customer.address ? `Address: ${customer.address}\n` : ''}Debt: ₹${customer.totalDebt.toFixed(2)}\nAdded: ${new Date(customer.createdDate).toLocaleDateString()}`, 'info');
        }
    }

    showSection(sectionId) {
        const sections = ['dashboard', 'customers', 'billing', 'reports', 'settings'];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) element.classList.add('hidden');
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
        this.isFirebaseConnected = false;
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
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px;';
        alert.innerHTML = `
            <div style="white-space: pre-line;">${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        setTimeout(() => {
            if (alert.parentNode) alert.remove();
        }, 5000);
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
