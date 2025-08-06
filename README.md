# Amarjit Electrical Store - Professional Customer Management System

A comprehensive Progressive Web App (PWA) for managing electrical store customers, sales, payments, and bill storage with real-time Firebase sync and Google Drive integration.

## 🚀 Features

### ✅ Implemented Features
- **Customer Management**: Add, view, search, and manage customer database
- **Sales Tracking**: Record sales with bill image upload to Google Drive
- **Payment Processing**: Track customer payments and outstanding debts
- **Real-time Sync**: Firebase Firestore integration for cross-device data sync
- **Bill Storage**: Upload bill images to Google Drive with automatic linking
- **Offline Support**: Local storage fallback when offline
- **Responsive Design**: Mobile-first PWA design
- **Professional UI**: Modern, clean interface with Bootstrap 5
- **Data Export**: Export customer and transaction data
- **Session Management**: Secure password-based access

### 📊 Dashboard Features
- Live customer count and statistics
- Today's sales and payments tracking
- Monthly business analytics
- Pending payments overview
- Recent customer activity

### 💾 Data Management
- **Firebase Firestore**: Real-time database for customers and transactions
- **Google Drive API**: Secure bill image storage and retrieval
- **Local Storage**: Offline backup and fast loading
- **Data Validation**: Comprehensive input validation and error handling

## 🛠️ Setup Instructions

### Prerequisites
- Firebase project with Firestore enabled
- Google Cloud Console project with Drive API enabled
- Web hosting (GitHub Pages, Netlify, etc.)

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Firestore Database
4. Get your Firebase config from Project Settings > General > Your apps
5. Update the `firebaseConfig` object in `app.js`:

```javascript
this.firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 2. Google Drive API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Drive API
4. Create credentials (API Key and OAuth 2.0 Client ID)
5. Configure OAuth consent screen
6. Add authorized domains for your app

#### Getting API Credentials:

**API Key:**
1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "API Key"
3. Restrict the key to Google Drive API

**OAuth 2.0 Client ID:**
1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add your domain to authorized origins

#### Update Configuration:
```javascript
this.googleDriveConfig = {
    apiKey: 'YOUR_GOOGLE_API_KEY',
    clientId: 'YOUR_GOOGLE_CLIENT_ID',
    discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    scopes: 'https://www.googleapis.com/auth/drive.file'
};
```

### 3. Google Drive Folder Setup

1. Create a folder in Google Drive for bill storage
2. Get the folder ID from the URL: `https://drive.google.com/drive/folders/FOLDER_ID`
3. Update the folder ID in `app.js`:

```javascript
const metadata = {
    name: `${customerName}_${transactionType}_${Date.now()}_${file.name}`,
    parents: ['YOUR_FOLDER_ID'], // Replace with your folder ID
    description: `Bill for ${customerName} - ${transactionType}`
};
```

### 4. Security Configuration

#### Change Default Password:
Update the password in `app.js`:
```javascript
this.PASSWORD = 'your_secure_password'; // Change this!
```

#### Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Update with proper authentication
    }
  }
}
```

### 5. Deployment

1. Upload all files to your web hosting service
2. Ensure HTTPS is enabled (required for PWA features)
3. Test all functionality including:
   - Customer creation
   - Sales recording with image upload
   - Payment processing
   - Data synchronization

## 📱 Usage Guide

### Adding Customers
1. Click "Add Customer" button
2. Fill in required information (name, phone)
3. Optionally add address
4. Customer is automatically synced to Firebase

### Recording Sales
1. Go to Customers section
2. Click the "+" button on a customer card
3. Enter sale amount and description
4. Upload bill image (optional)
5. Sale is recorded and bill uploaded to Google Drive

### Recording Payments
1. Go to Customers section
2. Click the "₹" button on a customer card
3. Enter payment amount
4. Payment reduces customer debt automatically

### Viewing Customer Details
1. Click the "👁" button on any customer card
2. View complete transaction history
3. Access quick sale/payment actions

## 🔧 Customization

### Branding
- Update `manifest.json` for app name and theme colors
- Modify CSS variables in `index.html` for color scheme
- Replace icons and branding elements

### Features
- Add more transaction types in `app.js`
- Implement custom reporting in the Reports section
- Add more customer fields as needed

## 🛡️ Security Considerations

### Production Deployment:
1. **Change the default password** immediately
2. **Secure Firebase rules** with proper authentication
3. **Restrict API keys** to your domain only
4. **Use environment variables** for sensitive config
5. **Enable HTTPS** for all connections

### Data Privacy:
- Customer data is stored in Firebase (Google's secure cloud)
- Bill images are stored in Google Drive with restricted access
- Local storage is used only for caching and offline support

## 📊 Database Structure

### Customers Collection
```javascript
{
  id: "auto-generated",
  name: "Customer Name",
  phone: "1234567890",
  address: "Customer Address",
  totalDebt: 0,
  createdDate: Timestamp,
  lastUpdated: Timestamp
}
```

### Transactions Collection
```javascript
{
  id: "auto-generated",
  customerId: "customer-id",
  type: "sale" | "payment",
  amount: 1000.00,
  description: "Transaction description",
  billImageUrl: "https://drive.google.com/...",
  timestamp: Timestamp
}
```

## 🚀 Performance Optimizations

- **Lazy Loading**: Firebase data loads only when needed
- **Local Caching**: Customer and transaction data cached locally
- **Image Compression**: Consider compressing images before upload
- **Batch Operations**: Multiple Firebase operations batched together

## 🔄 Backup and Recovery

### Data Export
- Use the "Export Data" button to download JSON backup
- Export includes customers, transactions, and metadata
- Regular backups recommended

### Data Import
- Implement custom import functionality if needed
- Consider CSV import for bulk customer data

## 📞 Support

For issues or customization requests:
1. Check browser console for error messages
2. Verify Firebase and Google Drive API configurations
3. Test with different browsers and devices
4. Check network connectivity for sync issues

## 📄 License

This project is created for Amarjit Electrical Store. Modify and use as needed for your business requirements.

---

**Version**: 2.0.0 Professional  
**Last Updated**: 2024  
**Technologies**: HTML5, CSS3, JavaScript ES6, Bootstrap 5, Firebase, Google Drive API