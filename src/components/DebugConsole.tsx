import type { Component } from 'solid-js';
import { createSignal, onMount } from 'solid-js';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

const DebugConsole: Component = () => {
  const [logs, setLogs] = createSignal<LogEntry[]>([]);
  const [isVisible, setIsVisible] = createSignal(false);

  onMount(() => {
    // Only show debug console in development or when explicitly enabled
    const showDebug = localStorage.getItem('debug_console') === 'true' || 
                     window.location.hostname === 'localhost' ||
                     window.location.search.includes('debug=true');
    
    if (showDebug) {
      setIsVisible(true);
      
      // Intercept console methods
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.log = (...args) => {
        originalLog(...args);
        addLog('log', args.join(' '));
      };
      
      console.error = (...args) => {
        originalError(...args);
        addLog('error', args.join(' '));
      };
      
      console.warn = (...args) => {
        originalWarn(...args);
        addLog('warn', args.join(' '));
      };
    }
  });

  const addLog = (level: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-20), { timestamp, level, message }]); // Keep last 20 logs
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const toggleDebug = () => {
    const newValue = !isVisible();
    setIsVisible(newValue);
    localStorage.setItem('debug_console', newValue.toString());
    if (newValue) {
      window.location.reload(); // Reload to start intercepting logs
    }
  };

  return (
    <div class="debug-console">
      <button 
        onClick={toggleDebug}
        class="debug-toggle"
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          'z-index': '9999',
          'background': '#333',
          'color': 'white',
          'border': 'none',
          'padding': '5px 10px',
          'border-radius': '3px',
          'font-size': '12px'
        }}
      >
        {isVisible() ? 'Hide Debug' : 'Show Debug'}
      </button>
      
      {isVisible() && (
        <div 
          class="debug-panel"
          style={{
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            'max-height': '200px',
            'background': 'rgba(0,0,0,0.9)',
            'color': 'white',
            'font-family': 'monospace',
            'font-size': '11px',
            'overflow-y': 'auto',
            'z-index': '9998',
            'border-top': '1px solid #333',
            'padding': '10px'
          }}
        >
          <div style={{ 'margin-bottom': '10px' }}>
            <button 
              onClick={clearLogs}
              style={{
                'background': '#666',
                'color': 'white',
                'border': 'none',
                'padding': '2px 6px',
                'border-radius': '2px',
                'font-size': '10px'
              }}
            >
              Clear
            </button>
          </div>
          <div>
            {logs().map((log) => (
              <div 
                style={{
                  'margin-bottom': '2px',
                  'color': log.level === 'error' ? '#ff6b6b' : 
                          log.level === 'warn' ? '#ffd93d' : '#74c0fc'
                }}
              >
                <span style={{ 'opacity': '0.7' }}>[{log.timestamp}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugConsole;