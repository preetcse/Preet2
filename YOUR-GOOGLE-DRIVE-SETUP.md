# Your Google Drive Setup - Final Steps

## ✅ What You Have Already
- ✅ **OAuth Client ID**: `2633417852-d1qhnoi6rlgb191l7h0ohtfoiiduivmb.apps.googleusercontent.com`
- ✅ **Project ID**: `amarjit-electrical-store`
- ✅ **Client Secret**: `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`

## 🔧 What You Still Need

### 1. Create API Key (Required)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project**: `amarjit-electrical-store`
3. **Go to APIs & Services > Credentials**
4. **Click "Create Credentials" > "API Key"**
5. **Copy the API Key** (starts with `AIza...`)
6. **Restrict the key**:
   - Click "Restrict Key"
   - Under "API restrictions" → Select "Google Drive API"
   - Click "Save"

### 2. Configure OAuth Domain (Important!)

1. **In Google Cloud Console > APIs & Services > Credentials**
2. **Click on your OAuth 2.0 Client ID**: `2633417852-d1qhnoi6rlgb191l7h0ohtfoiiduivmb`
3. **Add your domain to "Authorized JavaScript origins"**:
   - Add: `https://legendary-preet.ct.ws`
   - Add: `https://preetcse.github.io` (if you're using GitHub Pages)
   - For local testing, also add: `http://localhost:8000`
4. **Click "Save"**

### 3. Enable Google Drive API

1. **Go to APIs & Services > Library**
2. **Search for "Google Drive API"**
3. **Click "Enable"** (if not already enabled)

### 4. Update Your Configuration

**In `app.js`, replace the API key** (around line 19):

```javascript
this.googleDriveConfig = {
    apiKey: 'AIza...YOUR_ACTUAL_API_KEY_HERE', // Paste your API key here
    clientId: '2633417852-d1qhnoi6rlgb191l7h0ohtfoiiduivmb.apps.googleusercontent.com',
    discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    scopes: 'https://www.googleapis.com/auth/drive.file'
};
```

### 5. Create Google Drive Folder

1. **Go to Google Drive**: https://drive.google.com/
2. **Create a new folder** called "Amarjit Store Bills" (or any name)
3. **Open the folder**
4. **Copy the folder ID** from the URL:
   - URL looks like: `https://drive.google.com/drive/folders/1ABC...XYZ`
   - The folder ID is: `1ABC...XYZ`

### 6. Update Folder ID in Code

**In `app.js`, around line 309, replace**:
```javascript
parents: ['YOUR_FOLDER_ID'], // Replace with your folder ID
```

**With**:
```javascript
parents: ['1ABC...XYZ'], // Your actual folder ID
```

## 🧪 Testing Steps

1. **Save all changes to `app.js`**
2. **Upload to your website** (`https://legendary-preet.ct.ws`)
3. **Open the application**
4. **Login with your password**
5. **Click "Connect Services"**
6. **You should see Google OAuth popup**
7. **Grant permissions**
8. **Try adding a customer and recording a sale with image**

## 🎯 Quick Checklist

- [ ] Created API Key in Google Cloud Console
- [ ] Restricted API Key to Google Drive API
- [ ] Added `https://legendary-preet.ct.ws` to OAuth authorized origins
- [ ] Updated `apiKey` in `app.js`
- [ ] Created folder in Google Drive
- [ ] Updated `parents: ['FOLDER_ID']` in `app.js`
- [ ] Uploaded files to your website
- [ ] Tested the complete flow

## 🚨 If You Get Errors

**"Unauthorized domain"**: Add your exact domain to OAuth settings
**"API Key invalid"**: Check if API key is correct and restricted properly
**"Access denied"**: Make sure Google Drive API is enabled

## ✅ Expected Result

Once configured:
- Customer data saves to Firebase ✅
- Bill images upload to Google Drive ✅
- Images appear as links in transaction history ✅
- Full professional system working ✅

Your OAuth setup is already done correctly - you just need the API Key and folder configuration!