// Amarjit Electrical Store - Professional Version
// Complete customer management with Firebase + Google Drive integration

class ElectricalStoreApp {
    constructor() {
        // Configuration
        this.PASSWORD = 'amarjit123'; // Change this in production
        
        // Firebase configuration
        this.firebaseConfig = {
            apiKey: "AIzaSyBHNr3fI-kV2VgNOiOgchXgSa9wns7ClSs",
            authDomain: "amarjit-electrical-store-90d1c.firebaseapp.com",
            projectId: "amarjit-electrical-store-90d1c",
            storageBucket: "amarjit-electrical-store-90d1c.firebasestorage.app",
            messagingSenderId: "63912761857",
            appId: "1:63912761857:web:e601bc73b569f82d247e00",
            measurementId: "G-LEWP7F5MZK"
        };
        
        // Google Drive API configuration
        this.googleDriveConfig = {
            apiKey: 'YOUR_GOOGLE_API_KEY', // Replace with your API key
            clientId: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your client ID
            discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            scopes: 'https://www.googleapis.com/auth/drive.file'
        };
        
        // App state
        this.isLoggedIn = false;
        this.isFirebaseConnected = false;
        this.isGoogleDriveConnected = false;
        this.customers = [];
        this.transactions = [];
        this.db = null;
        this.gapi = null;
        this.currentCustomer = null;
        this.billImages = {};
        
        this.init();
    }

    async init() {
        try {
            const sessionLogin = sessionStorage.getItem('currentSession');
            if (sessionLogin === 'active') {
                this.isLoggedIn = true;
                this.showMainApp();
                await this.initializeServices();
            }
            this.setupEventListeners();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showAlert('Application initialization failed. Please refresh the page.', 'danger');
        }
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Main action buttons
        document.getElementById('googleDriveBtn')?.addEventListener('click', () => {
            this.handleCloudSync();
        });

        // Customer form
        const addCustomerForm = document.getElementById('addCustomerForm');
        if (addCustomerForm) {
            addCustomerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCustomer();
            });
        }

        // Customer filter
        const customerFilter = document.getElementById('customerFilter');
        if (customerFilter) {
            customerFilter.addEventListener('change', () => {
                this.filterCustomers();
            });
        }

        // Sale form
        const saleForm = document.getElementById('saleForm');
        if (saleForm) {
            saleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processSale();
            });
        }

        // Payment form
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processPayment();
            });
        }

        // Bill image upload
        const billImageInput = document.getElementById('billImage');
        if (billImageInput) {
            billImageInput.addEventListener('change', (e) => {
                this.handleBillImagePreview(e);
            });
        }
    }

    async handleLogin() {
        try {
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('loginError');

            if (password === this.PASSWORD) {
                sessionStorage.setItem('currentSession', 'active');
                this.isLoggedIn = true;
                this.showMainApp();
                await this.initializeServices();
            } else {
                if (errorDiv) {
                    errorDiv.classList.remove('hidden');
                    setTimeout(() => errorDiv.classList.add('hidden'), 3000);
                }
                document.getElementById('password').value = '';
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('Login failed. Please try again.', 'danger');
        }
    }

    async initializeServices() {
        this.showLoading();
        
        try {
            // Initialize Firebase
            await this.initializeFirebase();
            
            // Initialize Google Drive API
            await this.initializeGoogleDrive();
            
            // Load all data
            await this.loadAllData();
            
        } catch (error) {
            console.error('Service initialization failed:', error);
            this.loadFromLocal();
            this.showAlert('Using offline mode. Some features may be limited.', 'warning');
        }
        
        this.hideLoading();
    }

    async initializeFirebase() {
        try {
            await this.loadFirebaseSDK();
            firebase.initializeApp(this.firebaseConfig);
            this.db = firebase.firestore();
            this.isFirebaseConnected = true;
            this.updateCloudStatus();
            console.log('Firebase connected successfully');
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            throw error;
        }
    }

    async initializeGoogleDrive() {
        try {
            await this.loadGoogleDriveAPI();
            await this.gapi.load('auth2', () => {
                this.gapi.auth2.init({
                    client_id: this.googleDriveConfig.clientId
                });
            });
            console.log('Google Drive API loaded successfully');
        } catch (error) {
            console.error('Google Drive API initialization failed:', error);
            // Don't throw - Drive API is optional
        }
    }

    async loadFirebaseSDK() {
        return new Promise((resolve, reject) => {
            if (typeof firebase !== 'undefined') {
                resolve();
                return;
            }

            const script1 = document.createElement('script');
            script1.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
            
            const script2 = document.createElement('script');
            script2.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js';
            
            script1.onload = () => {
                script2.onload = () => resolve();
                script2.onerror = () => reject(new Error('Failed to load Firestore SDK'));
                document.head.appendChild(script2);
            };
            
            script1.onerror = () => reject(new Error('Failed to load Firebase SDK'));
            document.head.appendChild(script1);
        });
    }

    async loadGoogleDriveAPI() {
        return new Promise((resolve, reject) => {
            if (typeof gapi !== 'undefined') {
                this.gapi = gapi;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                this.gapi = gapi;
                this.gapi.load('client:auth2', resolve);
            };
            script.onerror = () => reject(new Error('Failed to load Google API'));
            document.head.appendChild(script);
        });
    }

    async loadAllData() {
        if (!this.isFirebaseConnected) {
            this.loadFromLocal();
            return;
        }

        try {
            // Load customers
            const customersSnapshot = await this.db.collection('customers')
                .orderBy('createdDate', 'desc').get();
            
            this.customers = [];
            customersSnapshot.forEach((doc) => {
                this.customers.push({
                    id: doc.id,
                    ...doc.data(),
                    createdDate: doc.data().createdDate?.toDate?.() || new Date(doc.data().createdDate),
                    lastUpdated: doc.data().lastUpdated?.toDate?.() || new Date(doc.data().lastUpdated)
                });
            });

            // Load transactions
            const transactionsSnapshot = await this.db.collection('transactions')
                .orderBy('timestamp', 'desc').get();
            
            this.transactions = [];
            transactionsSnapshot.forEach((doc) => {
                this.transactions.push({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
                });
            });

            // Calculate customer totals
            this.calculateCustomerTotals();
            
            // Save to local as backup
            this.saveToLocal();
            
            // Update UI
            this.updateDashboard();
            this.displayCustomers();
            
        } catch (error) {
            console.error('Error loading data from Firebase:', error);
            this.loadFromLocal();
            throw error;
        }
    }

    calculateCustomerTotals() {
        this.customers.forEach(customer => {
            const customerTransactions = this.transactions.filter(t => t.customerId === customer.id);
            const sales = customerTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
            const payments = customerTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
            customer.totalDebt = sales - payments;
        });
    }

    async saveCustomerToFirebase(customer) {
        if (!this.isFirebaseConnected || !this.db) return false;
        
        try {
            const customerData = {
                name: customer.name,
                phone: customer.phone,
                address: customer.address || '',
                totalDebt: customer.totalDebt || 0,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (customer.id && customer.id.length > 10) {
                // Update existing customer
                await this.db.collection('customers').doc(customer.id).update(customerData);
            } else {
                // Create new customer
                customerData.createdDate = firebase.firestore.FieldValue.serverTimestamp();
                const docRef = await this.db.collection('customers').add(customerData);
                customer.id = docRef.id;
            }
            return true;
        } catch (error) {
            console.error('Error saving customer to Firebase:', error);
            return false;
        }
    }

    async saveTransactionToFirebase(transaction) {
        if (!this.isFirebaseConnected || !this.db) return false;
        
        try {
            const transactionData = {
                customerId: transaction.customerId,
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description || '',
                billImageUrl: transaction.billImageUrl || '',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await this.db.collection('transactions').add(transactionData);
            transaction.id = docRef.id;
            return true;
        } catch (error) {
            console.error('Error saving transaction to Firebase:', error);
            return false;
        }
    }

    async uploadBillToGoogleDrive(file, customerName, transactionType) {
        if (!this.isGoogleDriveConnected) {
            console.warn('Google Drive not connected');
            return null;
        }

        try {
            const metadata = {
                name: `${customerName}_${transactionType}_${Date.now()}_${file.name}`,
                parents: ['YOUR_FOLDER_ID'], // Replace with your folder ID
                description: `Bill for ${customerName} - ${transactionType}`
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
            form.append('file', file);

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({
                    'Authorization': `Bearer ${this.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
                }),
                body: form
            });

            if (response.ok) {
                const result = await response.json();
                return `https://drive.google.com/file/d/${result.id}/view`;
            }
            throw new Error('Upload failed');
        } catch (error) {
            console.error('Error uploading to Google Drive:', error);
            return null;
        }
    }

    async addCustomer() {
        try {
            const name = document.getElementById('customerName').value.trim();
            const phone = document.getElementById('customerPhone').value.trim();
            const address = document.getElementById('customerAddress').value.trim();

            if (!this.validateCustomerData(name, phone)) return;

            const existingCustomer = this.customers.find(c => c.phone === phone);
            if (existingCustomer) {
                this.showAlert('Customer with this phone number already exists.', 'warning');
                return;
            }

            const customer = {
                id: Date.now().toString(),
                name: name,
                phone: phone,
                address: address,
                totalDebt: 0,
                createdDate: new Date(),
                lastUpdated: new Date()
            };

            // Add to local array first
            this.customers.unshift(customer);
            this.saveToLocal();
            this.displayCustomers();
            this.updateDashboard();

            // Clear form and close modal
            document.getElementById('addCustomerForm').reset();
            this.closeModal('addCustomerModal');

            // Save to Firebase
            const saved = await this.saveCustomerToFirebase(customer);
            
            if (saved) {
                this.showAlert('Customer added and synced successfully!', 'success');
            } else {
                this.showAlert('Customer added locally. Will sync when online.', 'warning');
            }
        } catch (error) {
            console.error('Error adding customer:', error);
            this.showAlert('Failed to add customer. Please try again.', 'danger');
        }
    }

    validateCustomerData(name, phone) {
        if (!name || name.length < 2) {
            this.showAlert('Please enter a valid customer name (at least 2 characters).', 'danger');
            return false;
        }

        if (!phone || phone.length < 10) {
            this.showAlert('Please enter a valid phone number (at least 10 digits).', 'danger');
            return false;
        }

        // Check if phone contains only numbers and common separators
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(phone)) {
            this.showAlert('Please enter a valid phone number format.', 'danger');
            return false;
        }

        return true;
    }

    async addSale(customerId) {
        try {
            const customer = this.customers.find(c => c.id == customerId);
            if (!customer) {
                this.showAlert('Customer not found.', 'danger');
                return;
            }

            this.currentCustomer = customer;
            document.getElementById('saleCustomerName').textContent = customer.name;
            document.getElementById('saleAmount').value = '';
            document.getElementById('saleDescription').value = '';
            document.getElementById('billImage').value = '';
            document.getElementById('billPreview').innerHTML = '';
            
            this.openModal('saleModal');
        } catch (error) {
            console.error('Error opening sale modal:', error);
            this.showAlert('Failed to open sale form.', 'danger');
        }
    }

    async processSale() {
        try {
            if (!this.currentCustomer) {
                this.showAlert('No customer selected.', 'danger');
                return;
            }

            const amount = parseFloat(document.getElementById('saleAmount').value);
            const description = document.getElementById('saleDescription').value.trim();
            const billFile = document.getElementById('billImage').files[0];

            if (!amount || amount <= 0) {
                this.showAlert('Please enter a valid sale amount.', 'danger');
                return;
            }

            this.showLoading();

            // Upload bill image to Google Drive if provided
            let billImageUrl = '';
            if (billFile) {
                billImageUrl = await this.uploadBillToGoogleDrive(billFile, this.currentCustomer.name, 'sale');
                if (!billImageUrl) {
                    this.showAlert('Failed to upload bill image, but sale will be recorded.', 'warning');
                }
            }

            // Create transaction
            const transaction = {
                id: Date.now().toString(),
                customerId: this.currentCustomer.id,
                type: 'sale',
                amount: amount,
                description: description,
                billImageUrl: billImageUrl,
                timestamp: new Date()
            };

            // Add to local arrays
            this.transactions.unshift(transaction);
            this.currentCustomer.totalDebt += amount;
            
            // Update customer in customers array
            const customerIndex = this.customers.findIndex(c => c.id === this.currentCustomer.id);
            if (customerIndex !== -1) {
                this.customers[customerIndex] = {...this.currentCustomer};
            }

            this.saveToLocal();
            this.updateDashboard();
            this.displayCustomers();

            // Close modal
            this.closeModal('saleModal');

            // Save to Firebase
            const transactionSaved = await this.saveTransactionToFirebase(transaction);
            const customerSaved = await this.saveCustomerToFirebase(this.currentCustomer);

            if (transactionSaved && customerSaved) {
                this.showAlert(`Sale of ₹${amount} recorded successfully!`, 'success');
            } else {
                this.showAlert('Sale recorded locally. Will sync when online.', 'warning');
            }

            this.hideLoading();
        } catch (error) {
            console.error('Error processing sale:', error);
            this.showAlert('Failed to process sale. Please try again.', 'danger');
            this.hideLoading();
        }
    }

    async addPayment(customerId) {
        try {
            const customer = this.customers.find(c => c.id == customerId);
            if (!customer) {
                this.showAlert('Customer not found.', 'danger');
                return;
            }

            this.currentCustomer = customer;
            document.getElementById('paymentCustomerName').textContent = customer.name;
            document.getElementById('paymentCurrentDebt').textContent = `₹${customer.totalDebt.toFixed(2)}`;
            document.getElementById('paymentAmount').value = '';
            document.getElementById('paymentDescription').value = '';
            
            this.openModal('paymentModal');
        } catch (error) {
            console.error('Error opening payment modal:', error);
            this.showAlert('Failed to open payment form.', 'danger');
        }
    }

    async processPayment() {
        try {
            if (!this.currentCustomer) {
                this.showAlert('No customer selected.', 'danger');
                return;
            }

            const amount = parseFloat(document.getElementById('paymentAmount').value);
            const description = document.getElementById('paymentDescription').value.trim();

            if (!amount || amount <= 0) {
                this.showAlert('Please enter a valid payment amount.', 'danger');
                return;
            }

            if (amount > this.currentCustomer.totalDebt) {
                const confirm = window.confirm(`Payment amount (₹${amount}) is more than current debt (₹${this.currentCustomer.totalDebt.toFixed(2)}). Continue?`);
                if (!confirm) return;
            }

            this.showLoading();

            // Create transaction
            const transaction = {
                id: Date.now().toString(),
                customerId: this.currentCustomer.id,
                type: 'payment',
                amount: amount,
                description: description,
                timestamp: new Date()
            };

            // Add to local arrays
            this.transactions.unshift(transaction);
            this.currentCustomer.totalDebt -= amount;
            
            // Update customer in customers array
            const customerIndex = this.customers.findIndex(c => c.id === this.currentCustomer.id);
            if (customerIndex !== -1) {
                this.customers[customerIndex] = {...this.currentCustomer};
            }

            this.saveToLocal();
            this.updateDashboard();
            this.displayCustomers();

            // Close modal
            this.closeModal('paymentModal');

            // Save to Firebase
            const transactionSaved = await this.saveTransactionToFirebase(transaction);
            const customerSaved = await this.saveCustomerToFirebase(this.currentCustomer);

            if (transactionSaved && customerSaved) {
                this.showAlert(`Payment of ₹${amount} recorded successfully!`, 'success');
            } else {
                this.showAlert('Payment recorded locally. Will sync when online.', 'warning');
            }

            this.hideLoading();
        } catch (error) {
            console.error('Error processing payment:', error);
            this.showAlert('Failed to process payment. Please try again.', 'danger');
            this.hideLoading();
        }
    }

    viewCustomer(customerId) {
        try {
            const customer = this.customers.find(c => c.id == customerId);
            if (!customer) {
                this.showAlert('Customer not found.', 'danger');
                return;
            }

            const customerTransactions = this.transactions.filter(t => t.customerId === customer.id);
            
            // Populate customer details modal
            document.getElementById('viewCustomerName').textContent = customer.name;
            document.getElementById('viewCustomerPhone').textContent = customer.phone;
            document.getElementById('viewCustomerAddress').textContent = customer.address || 'Not provided';
            document.getElementById('viewCustomerDebt').textContent = `₹${customer.totalDebt.toFixed(2)}`;
            document.getElementById('viewCustomerJoined').textContent = customer.createdDate.toLocaleDateString();

            // Populate transaction history
            const transactionsList = document.getElementById('customerTransactions');
            if (customerTransactions.length === 0) {
                transactionsList.innerHTML = '<p class="text-muted">No transactions yet.</p>';
            } else {
                transactionsList.innerHTML = customerTransactions.map(transaction => `
                    <div class="card mb-2">
                        <div class="card-body py-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="badge ${transaction.type === 'sale' ? 'bg-danger' : 'bg-success'}">
                                        ${transaction.type.toUpperCase()}
                                    </span>
                                    <strong class="ms-2">₹${transaction.amount.toFixed(2)}</strong>
                                    ${transaction.description ? `<br><small class="text-muted">${transaction.description}</small>` : ''}
                                    ${transaction.billImageUrl ? `<br><a href="${transaction.billImageUrl}" target="_blank" class="small"><i class="fas fa-file-image"></i> View Bill</a>` : ''}
                                </div>
                                <small class="text-muted">
                                    ${transaction.timestamp.toLocaleDateString()}
                                    ${transaction.timestamp.toLocaleTimeString()}
                                </small>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            this.openModal('customerDetailsModal');
        } catch (error) {
            console.error('Error viewing customer:', error);
            this.showAlert('Failed to load customer details.', 'danger');
        }
    }

    handleBillImagePreview(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('billPreview');
        
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                this.showAlert('Image size should be less than 5MB.', 'warning');
                event.target.value = '';
                preview.innerHTML = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `
                    <div class="mt-2">
                        <img src="${e.target.result}" alt="Bill Preview" style="max-width: 200px; max-height: 200px; border-radius: 5px;">
                        <p class="small text-muted mt-1">${file.name}</p>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    }

    async handleCloudSync() {
        if (!this.isFirebaseConnected) {
            await this.initializeServices();
            return;
        }

        if (!this.isGoogleDriveConnected) {
            await this.connectGoogleDrive();
            return;
        }
        
        this.showAlert('All data syncs automatically in real-time!', 'info');
    }

    async connectGoogleDrive() {
        try {
            this.showLoading();
            
            if (!this.gapi) {
                await this.initializeGoogleDrive();
            }

            await this.gapi.client.init({
                apiKey: this.googleDriveConfig.apiKey,
                clientId: this.googleDriveConfig.clientId,
                discoveryDocs: [this.googleDriveConfig.discoveryDoc],
                scope: this.googleDriveConfig.scopes
            });

            const authInstance = this.gapi.auth2.getAuthInstance();
            if (!authInstance.isSignedIn.get()) {
                await authInstance.signIn();
            }

            this.isGoogleDriveConnected = true;
            this.updateCloudStatus();
            this.showAlert('Google Drive connected successfully!', 'success');
            
        } catch (error) {
            console.error('Google Drive connection failed:', error);
            this.showAlert('Failed to connect to Google Drive. Image uploads will be disabled.', 'warning');
        }
        
        this.hideLoading();
    }

    // ... continuing with remaining methods
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
                <div class="card customer-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="flex-grow-1">
                                <h6 class="card-title mb-1">${this.escapeHtml(customer.name)}</h6>
                                <p class="text-muted mb-1 small">
                                    <i class="fas fa-phone"></i> ${this.escapeHtml(customer.phone)}
                                </p>
                                ${customer.address ? `<p class="text-muted small mb-1"><i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(customer.address)}</p>` : ''}
                                <small class="text-muted">
                                    <i class="fas fa-calendar"></i> 
                                    ${customer.createdDate.toLocaleDateString()}
                                </small>
                            </div>
                            <div class="text-end">
                                <span class="badge ${customer.totalDebt > 0 ? 'bg-danger' : 'bg-success'} fs-6">
                                    ₹${customer.totalDebt.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        
                        <div class="mt-auto">
                            <div class="btn-group w-100" role="group">
                                <button class="btn btn-sm btn-outline-primary" onclick="app.addSale('${customer.id}')" title="Add Sale">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-success" onclick="app.addPayment('${customer.id}')" title="Record Payment">
                                    <i class="fas fa-money-bill"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-info" onclick="app.viewCustomer('${customer.id}')" title="View Details">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    searchCustomers() {
        try {
            this.filterAndDisplayCustomers();
        } catch (error) {
            console.error('Error searching customers:', error);
        }
    }

    filterCustomers() {
        try {
            this.filterAndDisplayCustomers();
        } catch (error) {
            console.error('Error filtering customers:', error);
        }
    }

    filterAndDisplayCustomers() {
        const searchTerm = document.getElementById('customerSearch')?.value.toLowerCase().trim() || '';
        const filterValue = document.getElementById('customerFilter')?.value || 'all';

        let filteredCustomers = [...this.customers];

        // Apply search filter
        if (searchTerm) {
            filteredCustomers = filteredCustomers.filter(customer => 
                customer.name.toLowerCase().includes(searchTerm) ||
                customer.phone.includes(searchTerm) ||
                (customer.address && customer.address.toLowerCase().includes(searchTerm))
            );
        }

        // Apply debt filter
        if (filterValue === 'debt') {
            filteredCustomers = filteredCustomers.filter(customer => customer.totalDebt > 0);
        } else if (filterValue === 'clear') {
            filteredCustomers = filteredCustomers.filter(customer => customer.totalDebt <= 0);
        }

        // Temporarily replace customers for display
        const originalCustomers = this.customers;
        this.customers = filteredCustomers;
        this.displayCustomers();
        this.customers = originalCustomers;
    }

    updateDashboard() {
        try {
            // Update customer count
            const customerCount = document.getElementById('customerCount');
            if (customerCount) {
                customerCount.textContent = `${this.customers.length} customer${this.customers.length !== 1 ? 's' : ''}`;
            }

            // Update total debt
            const totalDebt = this.customers.reduce((sum, customer) => sum + (customer.totalDebt || 0), 0);
            const totalDebtElement = document.getElementById('totalDebt');
            if (totalDebtElement) {
                totalDebtElement.textContent = `₹${totalDebt.toFixed(2)} pending`;
            }

            // Update recent customers
            this.updateRecentCustomers();
            
            // Update pending payments
            this.updatePendingPayments();

            // Update business stats
            this.updateBusinessStats();
            
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    updateRecentCustomers() {
        const recentCustomersDiv = document.getElementById('recentCustomers');
        if (!recentCustomersDiv) return;

        const recentCustomers = this.customers.slice(0, 5);
        
        if (recentCustomers.length > 0) {
            recentCustomersDiv.innerHTML = recentCustomers.map(customer => `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                        <strong>${this.escapeHtml(customer.name)}</strong><br>
                        <small class="text-muted"><i class="fas fa-phone"></i> ${this.escapeHtml(customer.phone)}</small>
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

    updatePendingPayments() {
        const pendingPaymentsDiv = document.getElementById('pendingPayments');
        if (!pendingPaymentsDiv) return;

        const customersWithDebt = this.customers.filter(c => c.totalDebt > 0)
            .sort((a, b) => b.totalDebt - a.totalDebt);
        
        if (customersWithDebt.length > 0) {
            pendingPaymentsDiv.innerHTML = customersWithDebt.slice(0, 5).map(customer => `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                        <strong>${this.escapeHtml(customer.name)}</strong><br>
                        <small class="text-muted"><i class="fas fa-phone"></i> ${this.escapeHtml(customer.phone)}</small>
                    </div>
                    <span class="text-danger fw-bold">₹${customer.totalDebt.toFixed(2)}</span>
                </div>
            `).join('');
        } else {
            pendingPaymentsDiv.innerHTML = '<p class="text-muted">No pending payments.</p>';
        }
    }

    updateBusinessStats() {
        try {
            // Calculate business statistics
            const today = new Date();
            const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            const todayTransactions = this.transactions.filter(t => t.timestamp >= startOfToday);
            const monthTransactions = this.transactions.filter(t => t.timestamp >= startOfMonth);

            const todaySales = todayTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
            const todayPayments = todayTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
            
            const monthSales = monthTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
            const monthPayments = monthTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);

            // Calculate totals for settings page
            const totalSales = this.transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
            const totalPending = this.customers.reduce((sum, c) => sum + (c.totalDebt || 0), 0);

            // Update UI elements if they exist
            const todaySalesElement = document.getElementById('todaySales');
            if (todaySalesElement) todaySalesElement.textContent = `₹${todaySales.toFixed(2)}`;

            const todayPaymentsElement = document.getElementById('todayPayments');
            if (todayPaymentsElement) todayPaymentsElement.textContent = `₹${todayPayments.toFixed(2)}`;

            const monthSalesElement = document.getElementById('monthSales');
            if (monthSalesElement) monthSalesElement.textContent = `₹${monthSales.toFixed(2)}`;

            const monthPaymentsElement = document.getElementById('monthPayments');
            if (monthPaymentsElement) monthPaymentsElement.textContent = `₹${monthPayments.toFixed(2)}`;

            // Update settings page stats
            const settingsCustomerCount = document.getElementById('settingsCustomerCount');
            if (settingsCustomerCount) settingsCustomerCount.textContent = this.customers.length;

            const settingsTotalSales = document.getElementById('settingsTotalSales');
            if (settingsTotalSales) settingsTotalSales.textContent = `₹${totalSales.toFixed(2)}`;

            const settingsPendingAmount = document.getElementById('settingsPendingAmount');
            if (settingsPendingAmount) settingsPendingAmount.textContent = `₹${totalPending.toFixed(2)}`;

        } catch (error) {
            console.error('Error updating business stats:', error);
        }
    }

    updateCloudStatus() {
        const btn = document.getElementById('googleDriveBtn');
        const status = document.getElementById('driveStatus');
        
        if (btn && status) {
            if (this.isFirebaseConnected && this.isGoogleDriveConnected) {
                btn.className = 'btn btn-success me-2';
                status.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> All Connected';
            } else if (this.isFirebaseConnected) {
                btn.className = 'btn btn-warning me-2';
                status.innerHTML = '<i class="fas fa-database"></i> Firebase Only';
            } else {
                btn.className = 'btn btn-outline-primary me-2';
                status.innerHTML = '<i class="fas fa-cloud"></i> Connect Services';
            }
        }
    }

    loadFromLocal() {
        try {
            this.customers = JSON.parse(localStorage.getItem('customers') || '[]');
            this.transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            
            // Convert date strings back to Date objects
            this.customers.forEach(customer => {
                customer.createdDate = new Date(customer.createdDate);
                customer.lastUpdated = new Date(customer.lastUpdated);
            });
            
            this.transactions.forEach(transaction => {
                transaction.timestamp = new Date(transaction.timestamp);
            });

            this.calculateCustomerTotals();
            this.updateDashboard();
            this.displayCustomers();
        } catch (error) {
            console.error('Error loading from local storage:', error);
            this.customers = [];
            this.transactions = [];
        }
    }

    saveToLocal() {
        try {
            localStorage.setItem('customers', JSON.stringify(this.customers));
            localStorage.setItem('transactions', JSON.stringify(this.transactions));
        } catch (error) {
            console.error('Error saving to local storage:', error);
        }
    }

    showSection(sectionId) {
        try {
            const sections = ['dashboard', 'customers', 'billing', 'reports', 'settings'];
            sections.forEach(section => {
                const element = document.getElementById(section);
                if (element) element.classList.add('hidden');
            });

            // Update navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });

            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }

            // Special handling for different sections
            switch(sectionId) {
                case 'customers':
                    this.displayCustomers();
                    break;
                case 'reports':
                    this.generateReports();
                    break;
                case 'settings':
                    this.updateSettingsPage();
                    break;
                default:
                    if (!targetSection) {
                        document.getElementById('dashboard').classList.remove('hidden');
                    }
            }
        } catch (error) {
            console.error('Error showing section:', error);
        }
    }

    generateReports() {
        // This would generate comprehensive reports
        // Implementation would go here
        console.log('Generating reports...');
    }

    updateSettingsPage() {
        const dbStatus = document.getElementById('dbStatus');
        if (dbStatus) {
            if (this.isFirebaseConnected && this.isGoogleDriveConnected) {
                dbStatus.innerHTML = '<span class="text-success"><i class="fas fa-check-circle"></i> All services connected</span>';
            } else if (this.isFirebaseConnected) {
                dbStatus.innerHTML = '<span class="text-warning"><i class="fas fa-exclamation-triangle"></i> Firebase connected, Google Drive disconnected</span>';
            } else {
                dbStatus.innerHTML = '<span class="text-danger"><i class="fas fa-times-circle"></i> Services disconnected - using offline mode</span>';
            }
        }
    }

    openModal(modalId) {
        try {
            const modal = new bootstrap.Modal(document.getElementById(modalId));
            modal.show();
        } catch (error) {
            console.error(`Error opening modal ${modalId}:`, error);
        }
    }

    closeModal(modalId) {
        try {
            const modalElement = document.getElementById(modalId);
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        } catch (error) {
            console.error(`Error closing modal ${modalId}:`, error);
        }
    }

    showMainApp() {
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) loginScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
    }

    logout() {
        try {
            sessionStorage.removeItem('currentSession');
            this.isLoggedIn = false;
            this.isFirebaseConnected = false;
            this.isGoogleDriveConnected = false;
            
            const loginScreen = document.getElementById('loginScreen');
            const mainApp = document.getElementById('mainApp');
            const passwordField = document.getElementById('password');
            
            if (loginScreen) loginScreen.classList.remove('hidden');
            if (mainApp) mainApp.classList.add('hidden');
            if (passwordField) passwordField.value = '';
            
            // Disconnect from Google Drive
            if (this.gapi && this.gapi.auth2) {
                const authInstance = this.gapi.auth2.getAuthInstance();
                if (authInstance && authInstance.isSignedIn.get()) {
                    authInstance.signOut();
                }
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.classList.remove('hidden');
    }

    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.classList.add('hidden');
    }

    showAlert(message, type = 'info') {
        try {
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
            alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px;';
            alert.innerHTML = `
                <div style="white-space: pre-line;">${this.escapeHtml(message)}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            document.body.appendChild(alert);
            setTimeout(() => {
                if (alert.parentNode) alert.remove();
            }, 5000);
        } catch (error) {
            console.error('Error showing alert:', error);
        }
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export data functionality
    exportData() {
        try {
            const data = {
                customers: this.customers,
                transactions: this.transactions,
                exportDate: new Date().toISOString(),
                version: '2.0.0'
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `amarjit_store_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showAlert('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showAlert('Failed to export data.', 'danger');
        }
    }
}

// Global functions for HTML onclick handlers
function logout() { if (window.app) app.logout(); }
function showSection(section) { if (window.app) app.showSection(section); }
function showAddCustomer() { if (window.app) app.openModal('addCustomerModal'); }
function addCustomer() { if (window.app) app.addCustomer(); }
function searchCustomers() { if (window.app) app.searchCustomers(); }
function exportData() { if (window.app) app.exportData(); }

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    try {
        app = new ElectricalStoreApp();
        window.app = app; // Make globally accessible
    } catch (error) {
        console.error('Failed to initialize app:', error);
        document.body.innerHTML = '<div class="alert alert-danger m-3">Failed to load application. Please refresh the page.</div>';
    }
});
