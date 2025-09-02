import type { VehicleResponse, ApiError } from './types';

export async function checkVehicle(
  registration: string,
  workerUrl: string
): Promise<VehicleResponse> {
  if (!workerUrl) {
    throw new Error('Cloudflare Worker URL not configured. Please check settings.');
  }

  if (!registration) {
    throw new Error('Registration number is required');
  }

  const cleanReg = registration.toUpperCase().replace(/\s/g, '');
  
  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ registrationNumber: cleanReg })
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        detail: data.error || data.detail || `HTTP ${response.status}`,
        code: data.code,
        title: data.title
      };
      
      // Handle specific DVLA error cases
      if (response.status === 404) {
        throw new Error('Vehicle not found. Please check the registration number.');
      } else if (response.status === 400) {
        throw new Error('Invalid registration format. Please check and try again.');
      } else if (response.status === 403) {
        throw new Error('API access denied. Please check your DVLA API key.');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait and try again.');
      } else {
        throw new Error(error.detail);
      }
    }

    // Transform the DVLA response to match our interface
    const vehicle: VehicleResponse = {
      registrationNumber: cleanReg,
      taxStatus: data.taxStatus || 'Unknown',
      taxDueDate: data.taxDueDate,
      motStatus: data.motStatus || 'No details held by DVLA',
      motExpiryDate: data.motExpiryDate,
      make: data.make || 'Unknown',
      colour: data.colour || 'Unknown',
      fuelType: data.fuelType || 'Unknown',
      engineCapacity: data.engineCapacity,
      co2Emissions: data.co2Emissions,
      yearOfManufacture: data.yearOfManufacture || new Date().getFullYear()
    };

    return vehicle;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch vehicle data. Please check your connection and try again.');
  }
}

export function formatTaxStatus(status: string): string {
  switch (status) {
    case 'TAXED':
      return 'Taxed';
    case 'UNTAXED':
      return 'Untaxed';
    case 'SORN':
      return 'SORN (Statutory Off Road Notification)';
    default:
      return status;
  }
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}