# 🚗 UK Vehicle Checker

A privacy-focused Progressive Web App (PWA) for checking UK vehicle tax and MOT status using license plate recognition.

Vibe coded by Claude.  All errors are his fault!

## 🌐 Try It Now

**[Launch App →](https://electronstudio.github.io/vehicle-verifier/)**

The app runs entirely in your browser - no app store download required!

## ✨ Features

- **📷 Camera OCR** - Take photos of license plates for automatic recognition
- **📂 Photo Library** - Upload existing photos from your device
- **✋ Manual Entry** - Type license plates manually
- **🔍 Real-time Lookup** - Check current tax and MOT status via DVLA API
- **💾 Local Caching** - Store results locally for faster access
- **📜 Search History** - View previously checked vehicles
- **🔒 Privacy First** - All data stays on your device
- **📱 PWA Ready** - Install as an app on your phone
- **🌐 Offline Support** - Works without internet for cached results

## 🚀 Quick Start

1. **Visit**: [https://electronstudio.github.io/vehicle-verifier/](https://electronstudio.github.io/vehicle-verifier/)
2. **Setup**: Follow the one-time setup wizard (takes ~5 minutes)
   - Get free DVLA API key
   - Get free OCR.space API key
   - Deploy Cloudflare Worker (free)
3. **Use**: Take photos of license plates or enter manually

## 🔧 Setup Requirements

The app requires two free API keys:

### DVLA API Key
- Register at [DVLA Developer Portal](https://developer-portal.driver-vehicle-licensing.api.gov.uk)
- Subscribe to "Vehicle Enquiry Service (VES)"
- Free tier available

### OCR.space API Key
- Get free key at [OCR.space](https://ocr.space/ocrapi/freekey)
- 25 requests/day on free tier

### Cloudflare Worker
- Deploy the provided worker code (free tier: 100k requests/day)
- Securely proxies API requests

## 🔒 Privacy & Security

- **Local Storage**: All data stored on your device only
- **No Tracking**: No analytics or data collection
- **Secure Proxy**: Your API keys stay in your own worker
- **Open Source**: Fully transparent code
- **HTTPS Only**: Secure connections throughout

## 📱 Mobile Usage

Perfect for mobile devices:
- Native camera integration
- Touch-friendly interface
- Works offline with cached data
- Install as PWA for app-like experience

---

## 🛠️ Developer Information

This is a SolidJS PWA built with Vite and TypeScript.

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Tech Stack

- **Frontend**: SolidJS + TypeScript
- **Build**: Vite + PWA plugin
- **OCR**: OCR.space API
- **Vehicle Data**: DVLA Vehicle Enquiry Service
- **Proxy**: Cloudflare Workers
- **Hosting**: GitHub Pages

### Project Structure

```
src/
├── components/     # UI components
├── lib/           # Core functionality (OCR, API, cache)
├── style.css      # Global styles
└── App.tsx        # Main application

worker/
└── worker.ts      # Cloudflare Worker code

public/
├── icon-*.png     # PWA icons
└── manifest.json  # PWA manifest
```

### API Integration

The app uses a Cloudflare Worker to proxy DVLA API requests, avoiding CORS issues and keeping API keys secure.

### Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### License

This project is open source - see LICENSE file for details.
