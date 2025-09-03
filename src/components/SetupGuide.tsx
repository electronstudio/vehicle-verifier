import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';

interface SetupGuideProps {
  onComplete: (workerUrl: string, ocrApiKey: string) => void;
}

const SetupGuide: Component<SetupGuideProps> = (props) => {
  const [workerUrl, setWorkerUrl] = createSignal('');
  const [ocrApiKey, setOcrApiKey] = createSignal('');
  const [step, setStep] = createSignal(1);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const url = workerUrl().trim();
    const key = ocrApiKey().trim();
    if (url && key) {
      localStorage.setItem('worker_url', url);
      localStorage.setItem('ocr_api_key', key);
      props.onComplete(url, key);
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' && urlObj.hostname.endsWith('.workers.dev');
    } catch {
      return false;
    }
  };

  return (
    <div class="setup-guide">
      <div class="setup-header">
        <h1>🚗 UK Vehicle Checker</h1>
        <p>One-time setup required (takes ~5 minutes)</p>
      </div>

      <div class="setup-steps">
        <div class={`step ${step() >= 1 ? 'active' : ''}`}>
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Get your free DVLA API key</h3>
            <p>Register at the DVLA Developer Portal to get your API key</p>
            <a 
              href="https://register-for-ves.driver-vehicle-licensing.api.gov.uk/"
              target="_blank" 
              class="button primary"
              rel="noopener noreferrer"
            >
              Open DVLA Portal →
            </a>
            <div class="step-details">
              <details>
                <summary>Detailed instructions</summary>
                <ol>
                  <li>Click "Sign up" and create an account</li>
                  <li>Verify your email address</li>
                  <li>Click "Add Application" and fill out the form</li>
                  <li>Subscribe to the "Vehicle Enquiry Service (VES)"</li>
                  <li>Copy your API key for the next step</li>
                </ol>
              </details>
            </div>
            <button 
              class="button secondary" 
              onClick={() => setStep(2)}
            >
              I have my API key →
            </button>
          </div>
        </div>

        <div class={`step ${step() >= 2 ? 'active' : ''}`}>
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Get your OCR.space API key</h3>
            <p>Sign up for free OCR API to read license plates from photos</p>
            <a 
              href="https://ocr.space/ocrapi/freekey" 
              target="_blank" 
              class="button primary"
              rel="noopener noreferrer"
            >
              Get OCR API Key →
            </a>
            <div class="step-details">
              <details>
                <summary>Instructions</summary>
                <ol>
                  <li>Go to the OCR.space API page</li>
                  <li>Enter your email address</li>
                  <li>Check your email for the API key</li>
                  <li>Copy the key for the next step</li>
                </ol>
              </details>
            </div>
            <button 
              class="button secondary" 
              onClick={() => setStep(3)}
            >
              I have my OCR key →
            </button>
          </div>
        </div>

        <div class={`step ${step() >= 3 ? 'active' : ''}`}>
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Deploy your proxy (free)</h3>
            <p>Deploy a Cloudflare Worker to securely proxy API requests</p>
            <a 
              href="https://workers.cloudflare.com" 
              target="_blank" 
              class="button primary"
              rel="noopener noreferrer"
            >
              Open Cloudflare Workers →
            </a>
            <div class="step-details">
              <details>
                <summary>Deployment instructions</summary>
                <ol>
                  <li>Sign up for a free Cloudflare account</li>
                  <li>Go to Workers & Pages → Create application → Create Worker</li>
                  <li>Replace the default code with our worker code:</li>
                  <li>
                    <pre><code>{`export default {
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
            registrationNumber: registrationNumber.toUpperCase().replace(/\\s/g, '') 
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
};`}</code></pre>
                  </li>
                  <li>Click "Save and Deploy"</li>
                  <li>Go to Settings → Environment Variables</li>
                  <li>Add variable: Name="DVLA_API_KEY", Value=your API key</li>
                  <li>Copy your worker URL (ends with .workers.dev)</li>
                </ol>
              </details>
            </div>
            <button 
              class="button secondary" 
              onClick={() => setStep(4)}
            >
              I deployed the worker →
            </button>
          </div>
        </div>

        <div class={`step ${step() >= 4 ? 'active' : ''}`}>
          <div class="step-number">4</div>
          <div class="step-content">
            <h3>Complete Setup</h3>
            <p>Enter your configuration details below</p>
            <form onSubmit={handleSubmit} class="setup-form">
              <div class="form-group">
                <label for="worker-url">Worker URL</label>
                <input 
                  id="worker-url"
                  type="url" 
                  placeholder="https://your-worker-name.your-subdomain.workers.dev"
                  value={workerUrl()}
                  onInput={(e) => setWorkerUrl(e.target.value)}
                  required
                  class={validateUrl(workerUrl()) || !workerUrl() ? '' : 'error'}
                />
                {workerUrl() && !validateUrl(workerUrl()) && (
                  <div class="validation-error">
                    Please enter a valid Cloudflare Worker URL (https://*.workers.dev)
                  </div>
                )}
              </div>
              
              <div class="form-group">
                <label for="ocr-key">OCR.space API Key</label>
                <input 
                  id="ocr-key"
                  type="text" 
                  placeholder="K8xxxxxxxxxxxxxxxx"
                  value={ocrApiKey()}
                  onInput={(e) => setOcrApiKey(e.target.value)}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                class="button primary"
                disabled={!validateUrl(workerUrl()) || !ocrApiKey().trim()}
              >
                Complete Setup 🚀
              </button>
            </form>
          </div>
        </div>
      </div>

      <div class="setup-footer">
        <div class="privacy-notice">
          <h4>🔒 Privacy & Security</h4>
          <ul>
            <li>Your API key stays in your own Cloudflare Worker</li>
            <li>All data is stored locally on your device</li>
            <li>No tracking, analytics, or data collection</li>
            <li>Completely open source</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;