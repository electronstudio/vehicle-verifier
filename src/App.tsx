import type { Component } from 'solid-js';
import { Show, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { AppState, HistoryEntry, VehicleResponse } from './lib/types';
import { cache } from './lib/cache';
import { extractPlate } from './lib/ocr';
import { checkVehicle } from './lib/dvla';
import SetupGuide from './components/SetupGuide';
import Camera from './components/Camera';
import Results from './components/Results';
import Settings from './components/Settings';
import History from './components/History';
import DebugConsole from './components/DebugConsole';
import './style.css';

// Initialize state from localStorage
const initialState: AppState = {
  workerUrl: localStorage.getItem('worker_url') || '',
  currentPlate: '',
  results: null,
  loading: false,
  error: null,
  history: JSON.parse(localStorage.getItem('history') || '[]'),
  setupComplete: !!localStorage.getItem('worker_url') && !!localStorage.getItem('ocr_api_key'),
  currentView: 'camera'
};

const [state, setState] = createStore(initialState);
const [currentView, setCurrentView] = createSignal<AppState['currentView']>('camera');

// Clear expired cache on app start
cache.clearExpired();

const addToHistory = (plate: string, data: VehicleResponse) => {
  const entry: HistoryEntry = {
    plate,
    data,
    timestamp: Date.now()
  };
  
  const newHistory = [entry, ...state.history].slice(0, 50); // Keep last 50
  setState('history', newHistory);
  localStorage.setItem('history', JSON.stringify(newHistory));
};

const handleImageCapture = async (blob: Blob) => {
  setState('loading', true);
  setState('error', null);
  setState('results', null);
  
  try {
    // Extract plate from image
    const ocrApiKey = localStorage.getItem('ocr_api_key');
    if (!ocrApiKey) {
      throw new Error('OCR API key not configured. Please check settings.');
    }
    
    const ocrResult = await extractPlate(blob, ocrApiKey);
    if (!ocrResult.plate) {
      throw new Error('Could not read license plate. Please try again or enter manually.');
    }
    
    setState('currentPlate', ocrResult.plate);
    
    // Check cache first
    let data = cache.get(ocrResult.plate);
    
    if (!data) {
      // Fetch from API
      data = await checkVehicle(ocrResult.plate, state.workerUrl);
      cache.set(ocrResult.plate, data);
      addToHistory(ocrResult.plate, data);
    }
    
    setState('results', data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    setState('error', errorMessage);
  } finally {
    setState('loading', false);
  }
};

const handleManualEntry = async (plate: string) => {
  if (!plate.trim()) {
    setState('error', 'Please enter a registration number');
    return;
  }

  setState('loading', true);
  setState('error', null);
  setState('results', null);
  
  try {
    const cleanPlate = plate.toUpperCase().replace(/\s/g, '');
    setState('currentPlate', cleanPlate);
    
    // Check cache first
    let data = cache.get(cleanPlate);
    
    if (!data) {
      // Fetch from API
      data = await checkVehicle(cleanPlate, state.workerUrl);
      cache.set(cleanPlate, data);
      addToHistory(cleanPlate, data);
    }
    
    setState('results', data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    setState('error', errorMessage);
  } finally {
    setState('loading', false);
  }
};

const handleHistorySelect = (entry: HistoryEntry) => {
  setState('currentPlate', entry.plate);
  setState('results', entry.data);
  setState('error', null);
  setCurrentView('camera');
};

const SetupGuideComponent: Component = () => (
  <SetupGuide 
    onComplete={(workerUrl: string, _ocrApiKey: string) => {
      setState('workerUrl', workerUrl);
      setState('setupComplete', true);
    }} 
  />
);

const MainApp: Component = () => {
  let manualInputRef!: HTMLInputElement;

  const handleManualSubmit = (e: Event) => {
    e.preventDefault();
    const plate = manualInputRef.value.trim();
    if (plate) {
      handleManualEntry(plate);
      manualInputRef.value = '';
    }
  };

  return (
    <div class="app">
      <nav class="nav">
        <button 
          class={currentView() === 'camera' ? 'active' : ''}
          onClick={() => setCurrentView('camera')}
        >
          📷 Camera
        </button>
        <button 
          class={currentView() === 'manual' ? 'active' : ''}
          onClick={() => setCurrentView('manual')}
        >
          ⌨️ Manual
        </button>
        <button 
          class={currentView() === 'history' ? 'active' : ''}
          onClick={() => setCurrentView('history')}
        >
          📜 History
        </button>
        <button 
          class={currentView() === 'settings' ? 'active' : ''}
          onClick={() => setCurrentView('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>
      
      <Show when={currentView() === 'camera'}>
        <Camera onCapture={handleImageCapture} />
      </Show>
      
      <Show when={currentView() === 'manual'}>
        <div class="manual-entry">
          <h2>Enter Registration</h2>
          <form onSubmit={handleManualSubmit}>
            <input 
              ref={manualInputRef!}
              type="text" 
              placeholder="e.g. AB12 CDE"
              maxLength={8}
              autocomplete="off"
            />
            <button type="submit" disabled={state.loading}>
              Check Vehicle
            </button>
          </form>
        </div>
      </Show>
      
      <Show when={currentView() === 'history'}>
        <History 
          history={state.history} 
          onSelect={handleHistorySelect}
          onClear={() => {
            setState('history', []);
            localStorage.removeItem('history');
          }}
        />
      </Show>
      
      <Show when={currentView() === 'settings'}>
        <Settings />
      </Show>
      
      <Show when={state.loading}>
        <div class="loading">
          <div class="spinner"></div>
          <p>Processing...</p>
        </div>
      </Show>
      
      <Show when={state.error}>
        <div class="error">{state.error}</div>
      </Show>
      
      <Results data={state.results} />
    </div>
  );
};

const App: Component = () => {
  return (
    <>
      <Show
        when={state.setupComplete}
        fallback={<SetupGuideComponent />}
      >
        <MainApp />
      </Show>
      <DebugConsole />
    </>
  );
};

export default App;
