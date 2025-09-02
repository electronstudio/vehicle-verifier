import type { Component } from 'solid-js';
import { createSignal, onMount, Show } from 'solid-js';

const IOSInstallPrompt: Component = () => {
  const [showPrompt, setShowPrompt] = createSignal(false);

  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  const isInStandaloneMode = () => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true;
  };

  const hasBeenPromptedBefore = () => {
    return localStorage.getItem('ios-install-prompted') === 'true';
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-prompted', 'true');
  };

  const installLater = () => {
    setShowPrompt(false);
    // Don't set the flag, so it can show again on next visit
  };

  onMount(() => {
    // Wait a bit after app loads to show prompt
    setTimeout(() => {
      if (isIOS() && !isInStandaloneMode() && !hasBeenPromptedBefore()) {
        console.log('iOS detected, not in standalone mode, showing install prompt');
        setShowPrompt(true);
      } else {
        console.log('Install prompt conditions not met:', {
          isIOS: isIOS(),
          isStandalone: isInStandaloneMode(),
          hasBeenPrompted: hasBeenPromptedBefore()
        });
      }
    }, 3000); // Show after 3 seconds
  });

  return (
    <Show when={showPrompt()}>
      <div class="ios-install-overlay">
        <div class="ios-install-dialog">
          <div class="install-header">
            <h3>📱 Install UK Vehicle Checker</h3>
            <p>Get the best experience by installing this app to your home screen!</p>
          </div>
          
          <div class="install-steps">
            <div class="step">
              <div class="step-icon">1️⃣</div>
              <div class="step-text">
                Tap the <strong>Share</strong> button <span class="share-icon">⬆️</span> at the bottom of Safari
              </div>
            </div>
            
            <div class="step">
              <div class="step-icon">2️⃣</div>
              <div class="step-text">
                Scroll down and tap <strong>"Add to Home Screen"</strong> 📱
              </div>
            </div>
            
            <div class="step">
              <div class="step-icon">3️⃣</div>
              <div class="step-text">
                Tap <strong>"Add"</strong> to install the app
              </div>
            </div>
          </div>
          
          <div class="install-benefits">
            <h4>🌟 Benefits:</h4>
            <ul>
              <li>💨 Faster loading</li>
              <li>📱 Native app experience</li>
              <li>🌐 Works offline</li>
              <li>🔒 No browser distractions</li>
            </ul>
          </div>
          
          <div class="install-actions">
            <button 
              onClick={installLater} 
              class="button secondary"
            >
              Maybe Later
            </button>
            <button 
              onClick={dismissPrompt} 
              class="button primary"
            >
              Got It!
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .ios-install-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 1rem;
        }

        .ios-install-dialog {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          max-width: 400px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .install-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .install-header h3 {
          margin: 0 0 0.5rem 0;
          color: #1e40af;
          font-size: 1.3rem;
        }

        .install-header p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .install-steps {
          margin-bottom: 1.5rem;
        }

        .step {
          display: flex;
          align-items: flex-start;
          margin-bottom: 1rem;
          gap: 0.75rem;
        }

        .step-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .step-text {
          font-size: 0.9rem;
          line-height: 1.4;
          color: #374151;
        }

        .share-icon {
          display: inline-block;
          background: #007aff;
          color: white;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 0.8rem;
          margin: 0 2px;
        }

        .install-benefits {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .install-benefits h4 {
          margin: 0 0 0.5rem 0;
          color: #1e40af;
          font-size: 1rem;
        }

        .install-benefits ul {
          margin: 0;
          padding-left: 1rem;
          list-style: none;
        }

        .install-benefits li {
          font-size: 0.85rem;
          color: #4b5563;
          margin-bottom: 0.25rem;
        }

        .install-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        .install-actions .button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .install-actions .button.secondary {
          background: #f3f4f6;
          color: #6b7280;
        }

        .install-actions .button.secondary:hover {
          background: #e5e7eb;
        }

        .install-actions .button.primary {
          background: #1e40af;
          color: white;
        }

        .install-actions .button.primary:hover {
          background: #1d4ed8;
        }

        @media (max-width: 480px) {
          .ios-install-dialog {
            padding: 1rem;
            margin: 0.5rem;
          }
          
          .install-actions {
            flex-direction: column;
          }
          
          .install-actions .button {
            width: 100%;
          }
        }
      `}</style>
    </Show>
  );
};

export default IOSInstallPrompt;