diff --git a/config-template.js b/config-template.js
--- a/config-template.js
+++ b/config-template.js
@@ -0,0 +1,90 @@
+// Configuration Template for Amarjit Electrical Store
+// Copy this file to config.js and update with your actual values
+
+const CONFIG = {
+    // Application Settings
+    APP_PASSWORD: 'amarjit123', // CHANGE THIS IMMEDIATELY!
+    
+    // Firebase Configuration
+    // Get this from Firebase Console > Project Settings > General > Your apps
+    FIREBASE_CONFIG: {
+        apiKey: "YOUR_FIREBASE_API_KEY",
+        authDomain: "YOUR_PROJECT.firebaseapp.com",
+        projectId: "YOUR_PROJECT_ID", 
+        storageBucket: "YOUR_PROJECT.firebasestorage.app",
+        messagingSenderId: "YOUR_SENDER_ID",
+        appId: "YOUR_APP_ID",
+        measurementId: "YOUR_MEASUREMENT_ID"
+    },
+    
+    // Google Drive API Configuration
+    // Get this from Google Cloud Console > APIs & Services > Credentials
+    GOOGLE_DRIVE_CONFIG: {
+        apiKey: 'YOUR_GOOGLE_API_KEY',
+        clientId: 'YOUR_GOOGLE_CLIENT_ID.googleusercontent.com',
+        discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
+        scopes: 'https://www.googleapis.com/auth/drive.file'
+    },
+    
+    // Google Drive Folder ID for bill storage
+    // Create a folder in Google Drive and get ID from URL
+    GOOGLE_DRIVE_FOLDER_ID: 'YOUR_FOLDER_ID',
+    
+    // App Settings
+    APP_SETTINGS: {
+        // Maximum file size for bill uploads (in bytes)
+        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
+        
+        // Supported image formats
+        SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
+        
+        // Default currency symbol
+        CURRENCY_SYMBOL: '₹',
+        
+        // Date format for display
+        DATE_FORMAT: 'en-IN',
+        
+        // Auto-save interval (milliseconds)
+        AUTO_SAVE_INTERVAL: 30000, // 30 seconds
+        
+        // Session timeout (milliseconds)
+        SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24 hours
+    }
+};
+
+// Export for use in main application
+if (typeof module !== 'undefined' && module.exports) {
+    module.exports = CONFIG;
+}
+
+// Setup Instructions:
+// 
+// 1. FIREBASE SETUP:
+//    - Go to https://console.firebase.google.com/
+//    - Create project or use existing
+//    - Enable Firestore Database
+//    - Go to Project Settings > General > Your apps
+//    - Copy the config object values above
+// 
+// 2. GOOGLE DRIVE API SETUP:
+//    - Go to https://console.cloud.google.com/
+//    - Enable Google Drive API
+//    - Create API Key (restrict to Drive API)
+//    - Create OAuth 2.0 Client ID (Web application)
+//    - Add your domain to authorized origins
+//    - Copy the values above
+//
+// 3. GOOGLE DRIVE FOLDER:
+//    - Create a folder in Google Drive for bills
+//    - Copy folder ID from URL: drive.google.com/drive/folders/FOLDER_ID
+//    - Update GOOGLE_DRIVE_FOLDER_ID above
+//
+// 4. SECURITY:
+//    - Change APP_PASSWORD immediately
+//    - Restrict API keys to your domain
+//    - Set up proper Firebase security rules
+//
+// 5. DEPLOYMENT:
+//    - Upload to web hosting (GitHub Pages, Netlify, etc.)
+//    - Ensure HTTPS is enabled
+//    - Test all functionality
