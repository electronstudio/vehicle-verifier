# Claude Development Notes

This project was built with assistance from Claude AI. This file contains development instructions and context for future Claude sessions.

## Project Overview

UK Vehicle Checker is a Progressive Web App (PWA) built with SolidJS that allows users to:
- Take photos of UK license plates using camera OCR
- Check vehicle tax and MOT status via DVLA API
- Store results locally with caching and history
- Work offline as an installable PWA

## Tech Stack

- **Frontend**: SolidJS + TypeScript + Vite
- **PWA**: Vite PWA plugin with service worker
- **OCR**: OCR.space API (switched from Tesseract.js for better accuracy)
- **API**: DVLA Vehicle Enquiry Service via Cloudflare Worker proxy
- **Hosting**: GitHub Pages at https://electronstudio.github.io/vehicle-verifier/

## Architecture

```
src/
├── components/
│   ├── Camera.tsx          # Native camera integration (iPhone-optimized)
│   ├── SetupGuide.tsx      # One-time API key configuration
│   ├── Settings.tsx        # App settings and cache management
│   ├── Results.tsx         # Vehicle data display
│   ├── History.tsx         # Search history
│   ├── DebugConsole.tsx    # Mobile debugging overlay
│   └── IOSInstallPrompt.tsx # PWA install prompt for iOS
├── lib/
│   ├── ocr.ts             # OCR.space API integration with image resizing
│   ├── dvla.ts            # DVLA API client
│   ├── cache.ts           # localStorage caching system
│   └── types.ts           # TypeScript interfaces
└── App.tsx                # Main app with state management

worker/
└── worker.ts              # Cloudflare Worker for CORS proxy

public/
├── icon-*.png             # PWA icons
└── manifest.webmanifest   # PWA manifest
```

## Key Implementation Details

### Camera Integration
- Uses native iPhone camera via `<input capture="environment">` 
- Separate inputs for camera vs photo library
- Automatic image resizing (max 800KB) for OCR API limits
- Comprehensive error handling and debugging

### OCR Processing
- OCR.space API with automatic image optimization
- UK license plate regex patterns for validation
- GB prefix/suffix removal
- Detailed debug logging for troubleshooting

### PWA Features
- Service worker for offline caching
- iOS install prompt with smart detection
- GitHub Pages deployment with correct base paths
- Auto-update on new versions

### API Setup Requirements
Users need two free API keys:
1. **DVLA API Key**: From developer-portal.driver-vehicle-licensing.api.gov.uk
2. **OCR.space API Key**: From ocr.space/ocrapi/freekey
3. **Cloudflare Worker**: Deploy provided worker code with DVLA key

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Version Management

**IMPORTANT**: Always increment version number in `src/components/Settings.tsx` before git push!

Current version follows semantic versioning:
- Major: Significant feature additions or breaking changes
- Minor: New features or improvements  
- Patch: Bug fixes and small improvements

## GitHub Pages Deployment

- Automatic deployment via GitHub Actions (`.github/workflows/deploy.yml`)
- Base path configured for `/vehicle-verifier/` subdirectory
- PWA manifest and icons use production paths

## Mobile Optimization

- iOS Safari camera integration
- Touch-friendly interface
- PWA install prompts
- Offline functionality
- Debug console for mobile testing

## Privacy & Security

- All user data stored locally (localStorage)
- API keys secured in user's own Cloudflare Worker
- No tracking or analytics
- HTTPS-only connections
- Open source transparency

## Common Issues & Solutions

### OCR Failures
- Check image size (auto-resize to <800KB)
- Verify OCR.space API key validity
- Ensure proper JPEG encoding with filename

### Camera Issues on iOS
- Use `capture="environment"` for camera input
- Separate inputs for camera vs photo library
- Add webkit-playsinline attribute if using video

### PWA Installation
- Ensure icons use correct base path for GitHub Pages
- Test manifest.webmanifest accessibility
- Verify service worker registration

### API CORS Issues
- Use Cloudflare Worker proxy for DVLA API
- Ensure worker has correct environment variables
- Check CORS headers in worker response

## Testing Notes

- Test on actual iOS devices for camera functionality
- Verify PWA install flow on mobile
- Test offline functionality after installation
- Check debug console output for troubleshooting

## Deployment Checklist

1. Increment version number in Settings.tsx
2. Test build locally with `npm run build`
3. Commit and push to trigger GitHub Actions deployment
4. Verify deployment at https://electronstudio.github.io/vehicle-verifier/
5. Test PWA functionality on mobile devices

## Future Improvements

- Add more UK license plate format support
- Implement additional vehicle data sources
- Add dark mode theme
- Improve OCR accuracy with preprocessing
- Add vehicle history export functionality