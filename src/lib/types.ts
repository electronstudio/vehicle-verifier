export interface VehicleResponse {
  taxStatus: 'TAXED' | 'UNTAXED' | 'SORN';
  taxDueDate?: string;
  motStatus: string;
  motExpiryDate?: string;
  make: string;
  colour: string;
  fuelType: string;
  engineCapacity?: number;
  co2Emissions?: number;
  yearOfManufacture: number;
  registrationNumber: string;
}

export interface Settings {
  workerUrl: string;
  cacheExpiry: number;
  ocrApiKey: string;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export interface HistoryEntry {
  plate: string;
  data: VehicleResponse;
  timestamp: number;
}

export interface AppState {
  workerUrl: string;
  currentPlate: string;
  results: VehicleResponse | null;
  loading: boolean;
  error: string | null;
  history: HistoryEntry[];
  setupComplete: boolean;
  currentView: 'camera' | 'manual' | 'history' | 'settings';
}

export interface OCRResult {
  plate: string | null;
  confidence: number;
}

export interface ApiError {
  status: number;
  code?: string;
  title?: string;
  detail: string;
}