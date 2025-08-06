# Quick Setup Guide - Fix Google Drive API Errors

## Current Issues
You're seeing these errors because the Google Drive API credentials are not configured yet. The app is trying to connect with placeholder values.

## ✅ Step-by-Step Fix

### 1. Get Google Drive API Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select project**
3. **Enable Google Drive API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### 2. Create Credentials

**API Key:**
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key
4. Click "Restrict Key" and limit to "Google Drive API"

**OAuth 2.0 Client ID:**
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add your domain to "Authorized JavaScript origins":
   - For GitHub Pages: `https://yourusername.github.io`
   - For local testing: `http://localhost:8000`
5. Copy the Client ID

### 3. Update app.js Configuration

Open `app.js` and find this section (around line 19):

```javascript
// Google Drive API configuration
this.googleDriveConfig = {
    apiKey: 'YOUR_GOOGLE_API_KEY', // Replace with your API key
    clientId: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your client ID
    discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    scopes: 'https://www.googleapis.com/auth/drive.file'
};
```

**Replace with your actual values:**
```javascript
this.googleDriveConfig = {
    apiKey: 'AIzaSyC...your-actual-api-key', 
    clientId: '123456789...your-actual-client-id.googleusercontent.com',
    discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    scopes: 'https://www.googleapis.com/auth/drive.file'
};
```

### 4. Create Google Drive Folder

1. **Create a folder** in Google Drive for bill storage
2. **Get folder ID** from URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
3. **Update app.js** around line 309:

```javascript
const metadata = {
    name: `${customerName}_${transactionType}_${Date.now()}_${file.name}`,
    parents: ['YOUR_ACTUAL_FOLDER_ID'], // Replace with your folder ID
    description: `Bill for ${customerName} - ${transactionType}`
};
```

### 5. Test the Application

1. **Refresh the page**
2. **Login with your password**
3. **Click the "Connect Services" button**
4. **Grant permissions** when Google asks
5. **Try adding a customer and recording a sale with image**

## 🚀 Alternative: Skip Google Drive for Now

If you want to use the app without Google Drive temporarily:

1. **The app will work fine** without Google Drive
2. **Customer data** will still sync to Firebase
3. **Sales and payments** will be tracked normally
4. **Bill images** just won't be uploaded (optional feature)

## ⚠️ Current Status

- ✅ **Firebase**: Already connected and working
- ❌ **Google Drive**: Not configured (causes the errors you see)
- ✅ **All other features**: Working perfectly

## 📞 Need Help?

The console errors will disappear once you:
1. Add your real Google API credentials to `app.js`
2. Refresh the page
3. Connect to Google Drive

**The app is fully functional without Google Drive - it's just an optional feature for bill image storage!**