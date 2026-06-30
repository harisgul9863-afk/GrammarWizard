# GrammarWizard - Testing & APK Build Guide

## 📌 Quick Start Testing

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Gemini API Key** (free from [AI Studio](https://ai.studio))

---

## ✅ Step 1: Local Testing (Web Version)

### 1.1 Clone & Setup
```bash
# Clone the repository
git clone https://github.com/harisgul9863-afk/GrammarWizard.git
cd GrammarWizard

# Install dependencies
npm install
```

### 1.2 Configure Environment
```bash
# Create .env.local file (copy from .env.example)
cp .env.example .env.local

# Edit .env.local and add your Gemini API Key
# Get free key from: https://ai.studio/apikeys
```

**Add this to `.env.local`:**
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
APP_URL=http://localhost:3000
```

### 1.3 Run Development Server
```bash
npm run dev
```

**Expected Output:**
```
Server running on http://localhost:3000
```

Visit `http://localhost:3000` in your browser.

---

## 🧪 Step 2: Test Features

### Test Checklist:
- [ ] **Page Loads** - UI appears without errors (check browser console)
- [ ] **API Connection** - Status badge shows "Gemini 1.5 Flash Connected"
- [ ] **Setup Screen** - Can enter/save API key
- [ ] **Quiz Generation** - Can create quiz from text (test with sample grammar text)
- [ ] **File Upload** - Can upload document/image
- [ ] **Quiz Display** - Questions render correctly with 4 options
- [ ] **Answer Selection** - Can click options and submit
- [ ] **Results** - Shows score and explanations
- [ ] **Download** - Can download results as PDF/ZIP
- [ ] **Responsive** - Works on mobile browser (test in Chrome DevTools)

### Sample Test Text:
```
The present perfect tense is used to describe an action that started in the past 
and continues to the present, or an action that happened at an unspecified time in the past. 
It is formed using "have/has" + past participle. For example: "I have lived here for 5 years."
```

---

## 🏗️ Step 3: Build for Production

### 3.1 Build Static Files
```bash
npm run build
```

**Output Location:** `dist/` folder

### 3.2 Test Production Build
```bash
npm start
```

Visit `http://localhost:3000` and verify everything works.

---

## 📱 Step 4: Convert to APK (3 Methods)

### **Method 1: Capacitor (Easiest - Recommended)**

#### Install Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

#### Initialize Capacitor
```bash
npx cap init
# App name: GrammarWizard
# App ID: com.grammarwizard.app
# Web dir: dist
```

#### Add Android Platform
```bash
npx cap add android
```

#### Build Web Assets
```bash
npm run build
npx cap sync
```

#### Open in Android Studio
```bash
npx cap open android
```

#### Build APK in Android Studio:
1. Click **Build** menu
2. Select **Build Bundle(s) / APK(s)**
3. Select **Build APK(s)**
4. Wait for completion (~2-5 minutes)
5. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

---

### **Method 2: Using React Native (More Control)**

```bash
npx create-expo-app GrammarWizardApp
cd GrammarWizardApp

# Install EAS CLI
npm install -g eas-cli
eas login

# Build APK
eas build --platform android --local
```

---

### **Method 3: Manual Android Studio Setup**

1. **Download Android Studio** from [developer.android.com](https://developer.android.com/studio)
2. **Create New Project** → Empty Activity
3. **Copy** `dist/` contents to `app/src/main/assets/www/`
4. **Modify** `MainActivity.java`:
```java
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/www/index.html");
    }
}
```

5. **Add to `AndroidManifest.xml`:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

6. **Build APK** → Build > Build Bundle(s) / APK(s) > Build APK(s)

---

## 📊 Troubleshooting

### Issue: "GEMINI_API_KEY not found"
**Solution:** 
```bash
# Verify .env.local exists
cat .env.local

# Restart dev server
npm run dev
```

### Issue: Port 3000 already in use
**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Issue: Build fails with TypeScript errors
**Solution:**
```bash
# Type check
npm run lint

# Fix TypeScript issues in src/ files
# Or skip type checking temporarily
npm run build --skip-type-check
```

### Issue: Capacitor APK won't install
**Solution:**
```bash
# Rebuild Gradle
cd android
./gradlew clean build

# Or uninstall existing app first
adb uninstall com.grammarwizard.app
```

---

## ✨ Features to Test on APK

Once APK is installed on Android:

1. ✅ **First Launch** - Setup screen appears
2. ✅ **API Key Storage** - Persists after app restart
3. ✅ **Quiz Generation** - Works with network calls
4. ✅ **File Upload** - Camera/gallery integration
5. ✅ **Offline Mode** - Graceful error handling without internet
6. ✅ **Touch Responsiveness** - All buttons/inputs work
7. ✅ **Screen Rotation** - State preserved on device rotation
8. ✅ **Back Navigation** - Can exit safely
9. ✅ **Performance** - No lag during quiz generation
10. ✅ **Permissions** - Requests camera/storage as needed

---

## 📦 Deployment Options

### Option A: Firebase Hosting (Web)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Option B: Google Play Store (APK)
1. Build release APK: `Build > Build Bundle(s) / APK(s) > Build Bundle`
2. Sign APK with your keystore
3. Upload to [Google Play Console](https://play.google.com/console)
4. Set pricing and availability
5. Submit for review

### Option C: APK Distribution
- Share APK file directly via cloud storage
- Use services like **Firebase App Distribution**
- Host on GitHub Releases

---

## 🎯 Performance Tips

```bash
# Optimize build
npm run build -- --minify

# Analyze bundle size
npm install --save-dev vite-plugin-visualizer

# Test on real device (faster than emulator)
adb install dist/app-debug.apk
```

---

## 📝 Testing Checklist

- [ ] Dependencies installed successfully
- [ ] `.env.local` created with valid API key
- [ ] Dev server starts without errors
- [ ] Web UI loads and renders correctly
- [ ] Can generate quiz from text
- [ ] Can upload and process files
- [ ] API responses are correct
- [ ] Production build completes without errors
- [ ] APK builds successfully in Android Studio
- [ ] APK installs on Android device
- [ ] All features work on Android device
- [ ] No console errors or warnings

---

## 🚀 Next Steps

1. **Test locally** - Follow Step 1-2
2. **Build production** - Follow Step 3
3. **Create APK** - Follow Step 4 (Method 1 Recommended)
4. **Test on device** - Install and verify features
5. **Publish** - Deploy to Play Store or share APK

---

## 📞 Support

For issues:
1. Check browser console: `F12 → Console tab`
2. Check server logs: Terminal where `npm run dev` is running
3. Verify API key is valid at [AI Studio](https://ai.studio/apikeys)
4. Review full Android logs: `adb logcat`

---

**Happy Testing! 🎉**
