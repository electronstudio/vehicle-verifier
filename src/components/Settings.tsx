import type { Component } from 'solid-js';
import { createSignal, onMount } from 'solid-js';
import { cache } from '../lib/cache';

const Settings: Component = () => {
  const [workerUrl, setWorkerUrl] = createSignal('');
  const [ocrApiKey, setOcrApiKey] = createSignal('');
  const [cacheExpiry, setCacheExpiry] = createSignal(7);
  const [showSuccess, setShowSuccess] = createSignal(false);
  const [cacheStats, setCacheStats] = createSignal({ count: 0, size: 0 });

  const loadSettings = () => {
    setWorkerUrl(localStorage.getItem('worker_url') || '');
    setOcrApiKey(localStorage.getItem('ocr_api_key') || '');
    setCacheExpiry(parseInt(localStorage.getItem('cache_expiry') || '7'));
    updateCacheStats();
  };

  const updateCacheStats = () => {
    let count = 0;
    let size = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('vehicle_')) {
        count++;
        size += (localStorage.getItem(key) || '').length;
      }
    }
    
    setCacheStats({ count, size });
  };

  const saveWorkerUrl = () => {
    const url = workerUrl().trim();
    localStorage.setItem('worker_url', url);
    showSuccessMessage();
  };

  const saveOcrApiKey = () => {
    const key = ocrApiKey().trim();
    localStorage.setItem('ocr_api_key', key);
    showSuccessMessage();
  };

  const saveCacheExpiry = (days: number) => {
    setCacheExpiry(days);
    localStorage.setItem('cache_expiry', days.toString());
    showSuccessMessage();
  };

  const clearCache = () => {
    cache.clear();
    updateCacheStats();
    showSuccessMessage();
  };

  const clearHistory = () => {
    localStorage.removeItem('history');
    showSuccessMessage();
  };

  const clearAllData = () => {
    const confirmMessage = 'This will clear all cached vehicle data, search history, and settings. Are you sure?';
    if (confirm(confirmMessage)) {
      cache.clear();
      localStorage.removeItem('history');
      localStorage.removeItem('worker_url');
      localStorage.removeItem('ocr_api_key');
      localStorage.removeItem('cache_expiry');
      setWorkerUrl('');
      setOcrApiKey('');
      setCacheExpiry(7);
      updateCacheStats();
      showSuccessMessage();
    }
  };

  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' && urlObj.hostname.endsWith('.workers.dev');
    } catch {
      return false;
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  onMount(() => {
    loadSettings();
  });

  return (
    <div class="settings">
      <div class="settings-header">
        <h2>⚙️ Settings</h2>
      </div>

      {showSuccess() && (
        <div class="success-message">
          ✅ Settings saved successfully!
        </div>
      )}

      <div class="settings-section">
        <h3>🔗 API Configuration</h3>
        <div class="setting-item">
          <label for="worker-url">Cloudflare Worker URL:</label>
          <div class="url-input-group">
            <input 
              id="worker-url"
              type="url" 
              value={workerUrl()}
              onInput={(e) => setWorkerUrl(e.target.value)}
              placeholder="https://your-worker.your-subdomain.workers.dev"
              class={validateUrl(workerUrl()) || !workerUrl() ? '' : 'error'}
            />
            <button 
              onClick={saveWorkerUrl}
              disabled={!validateUrl(workerUrl())}
              class="button secondary"
            >
              Save
            </button>
          </div>
          {workerUrl() && !validateUrl(workerUrl()) && (
            <div class="validation-error">
              Please enter a valid Cloudflare Worker URL
            </div>
          )}
          <div class="setting-help">
            <details>
              <summary>Need help setting up your Worker?</summary>
              <ol>
                <li>Go to <a href="https://workers.cloudflare.com" target="_blank">Cloudflare Workers</a></li>
                <li>Create a new Worker with our provided code</li>
                <li>Add your DVLA API key as an environment variable</li>
                <li>Copy the Worker URL here</li>
              </ol>
            </details>
          </div>
        </div>

        <div class="setting-item">
          <label for="ocr-key">OCR.space API Key:</label>
          <div class="url-input-group">
            <input 
              id="ocr-key"
              type="text" 
              value={ocrApiKey()}
              onInput={(e) => setOcrApiKey(e.target.value)}
              placeholder="K8xxxxxxxxxxxxxxxx"
            />
            <button 
              onClick={saveOcrApiKey}
              disabled={!ocrApiKey().trim()}
              class="button secondary"
            >
              Save
            </button>
          </div>
          <div class="setting-help">
            <details>
              <summary>Need an OCR API key?</summary>
              <ol>
                <li>Go to <a href="https://ocr.space/ocrapi/freekey" target="_blank">OCR.space</a></li>
                <li>Enter your email to get a free API key</li>
                <li>Check your email and copy the key here</li>
              </ol>
            </details>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>💾 Cache Settings</h3>
        <div class="setting-item">
          <label for="cache-expiry">Cache Duration:</label>
          <div class="range-input-group">
            <input 
              id="cache-expiry"
              type="range" 
              min="1" 
              max="30"
              value={cacheExpiry()}
              onInput={(e) => saveCacheExpiry(parseInt(e.target.value))}
            />
            <span class="range-value">{cacheExpiry()} day{cacheExpiry() !== 1 ? 's' : ''}</span>
          </div>
          <div class="setting-help">
            Vehicle data will be cached locally to reduce API calls and improve performance.
          </div>
        </div>

        <div class="setting-item">
          <label>Cache Statistics:</label>
          <div class="cache-stats">
            <div class="stat">
              <span class="stat-label">Cached vehicles:</span>
              <span class="stat-value">{cacheStats().count}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Storage used:</span>
              <span class="stat-value">{formatBytes(cacheStats().size * 2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>🗑️ Data Management</h3>
        <div class="setting-item">
          <div class="action-buttons">
            <button 
              onClick={clearCache}
              class="button secondary"
              title="Clear all cached vehicle data"
            >
              Clear Cache
            </button>
            <button 
              onClick={clearHistory}
              class="button secondary"
              title="Clear search history"
            >
              Clear History
            </button>
            <button 
              onClick={clearAllData}
              class="button danger"
              title="Clear all app data"
            >
              Clear All Data
            </button>
          </div>
          <div class="setting-help">
            Clearing data can free up storage but you'll need to re-fetch vehicle information.
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>ℹ️ About</h3>
        <div class="about-info">
          <p><strong>UK Vehicle Checker</strong></p>
          <p>Version: 1.0.0</p>
          <p>A privacy-focused PWA for checking UK vehicle tax and MOT status.</p>
          
          <div class="privacy-highlights">
            <h4>🔒 Privacy Features:</h4>
            <ul>
              <li>All data stored locally on your device</li>
              <li>No tracking or analytics</li>
              <li>Your API key stays in your own Worker</li>
              <li>Open source and transparent</li>
            </ul>
          </div>

          <div class="links">
            <a href="https://developer-portal.driver-vehicle-licensing.api.gov.uk" target="_blank" rel="noopener">
              DVLA Developer Portal
            </a>
            <a href="https://workers.cloudflare.com" target="_blank" rel="noopener">
              Cloudflare Workers
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;