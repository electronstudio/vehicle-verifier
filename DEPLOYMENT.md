# 🚗 UK Vehicle Checker - Deployment Guide

## Quick Start

### 1. Deploy the PWA
Deploy the contents of the `dist/` folder (after running `npm run build`) to any static hosting:
- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Deploy from GitHub repository  
- **GitHub Pages**: Upload `dist` contents to your repository

### 2. Get DVLA API Key
1. Visit [DVLA Developer Portal](https://developer-portal.driver-vehicle-licensing.api.gov.uk)
2. Sign up for a free account
3. Create an application
4. Subscribe to "Vehicle Enquiry Service (VES)"
5. Copy your API key

### 3. Deploy Cloudflare Worker

**IMPORTANT**: Use this simplified worker code (the original had export issues):

```javascript
export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    try {
      // Validate API key
      if (!env.DVLA_API_KEY) {
        return new Response(JSON.stringify({
          error: 'DVLA API key not configured'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      // Parse request
      const { registrationNumber } = await request.json();
      if (!registrationNumber) {
        return new Response(JSON.stringify({
          error: 'Registration number required'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      // Call DVLA API
      const response = await fetch(
        'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
        {
          method: 'POST',
          headers: {
            'x-api-key': env.DVLA_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            registrationNumber: registrationNumber.toUpperCase().replace(/\s/g, '') 
          }),
        }
      );

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Worker error',
        detail: 'Failed to process request'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
```

### Deployment Steps:
1. Go to [Cloudflare Workers](https://workers.cloudflare.com)
2. Sign up for free account
3. Click "Create a Worker"
4. Replace default code with the code above
5. Click "Save and Deploy"
6. Go to Settings → Environment Variables
7. Add variable: `DVLA_API_KEY` = your API key from step 2
8. Copy your Worker URL (ends with `.workers.dev`)

### 4. Configure the App
1. Open your deployed PWA
2. Enter your Cloudflare Worker URL in the setup
3. Start checking vehicles! 🎉

## Development

### Local Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

## Features
- 📱 **PWA** - Installable on mobile devices
- 📷 **Camera OCR** - Automatic license plate recognition  
- ⌨️ **Manual Entry** - Text input with validation
- 💾 **Local Caching** - Configurable cache duration
- 📜 **Search History** - Last 50 searches stored locally
- 🔒 **Privacy First** - All data stays on your device
- 🌙 **Dark Mode** - Automatic system theme detection

## Troubleshooting

### Worker Errors
- **"Unexpected token 'export'"**: Make sure you're using the simplified JavaScript code above, not the TypeScript version
- **"DVLA API key not configured"**: Check your environment variable is set correctly
- **CORS errors**: The worker handles CORS automatically

### OCR Issues
- Ensure good lighting
- Keep license plate parallel to camera
- Try manual entry as fallback

### API Limits
- DVLA API has rate limits
- Use caching to reduce API calls
- Free tier includes reasonable daily limits

## Support
For issues with:
- **DVLA API**: Check [DVLA Developer Portal](https://developer-portal.driver-vehicle-licensing.api.gov.uk)
- **Cloudflare Workers**: Check [Cloudflare Docs](https://developers.cloudflare.com/workers/)
- **This app**: Check the browser console for error messages