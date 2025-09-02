import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import type { VehicleResponse } from '../lib/types';
import { formatTaxStatus, formatDate } from '../lib/dvla';

interface ResultsProps {
  data: VehicleResponse | null;
}

const Results: Component<ResultsProps> = (props) => {
  const getTaxStatusClass = (status: string): string => {
    switch (status) {
      case 'TAXED':
        return 'status-success';
      case 'UNTAXED':
        return 'status-danger';
      case 'SORN':
        return 'status-warning';
      default:
        return 'status-unknown';
    }
  };

  const getMOTStatusClass = (status: string): string => {
    if (status.toLowerCase().includes('valid')) {
      return 'status-success';
    } else if (status.toLowerCase().includes('no details') || status.toLowerCase().includes('not available')) {
      return 'status-unknown';
    } else {
      return 'status-warning';
    }
  };

  const isDateExpired = (dateString?: string): boolean => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      return date < new Date();
    } catch {
      return false;
    }
  };

  const getDaysUntilExpiry = (dateString?: string): number | null => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const today = new Date();
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  return (
    <Show when={props.data}>
      {(vehicle) => (
        <div class="results">
          <div class="results-header">
            <h2>🚗 {vehicle().registrationNumber}</h2>
            <div class="vehicle-summary">
              {vehicle().make} • {vehicle().colour} • {vehicle().yearOfManufacture}
            </div>
          </div>

          <div class="status-cards">
            {/* Tax Status Card */}
            <div class={`status-card tax-card ${getTaxStatusClass(vehicle().taxStatus)}`}>
              <div class="status-header">
                <div class="status-icon">💷</div>
                <h3>Tax Status</h3>
              </div>
              <div class="status-value">
                {formatTaxStatus(vehicle().taxStatus)}
              </div>
              <Show when={vehicle().taxDueDate}>
                <div class="status-details">
                  <div class={`expiry-info ${isDateExpired(vehicle().taxDueDate) ? 'expired' : ''}`}>
                    <span class="label">
                      {vehicle().taxStatus === 'TAXED' ? 'Expires:' : 'Due:'}
                    </span>
                    <span class="date">{formatDate(vehicle().taxDueDate)}</span>
                    <Show when={!isDateExpired(vehicle().taxDueDate) && getDaysUntilExpiry(vehicle().taxDueDate) !== null}>
                      <span class="days-remaining">
                        ({getDaysUntilExpiry(vehicle().taxDueDate)} days)
                      </span>
                    </Show>
                    <Show when={isDateExpired(vehicle().taxDueDate)}>
                      <span class="expired-badge">EXPIRED</span>
                    </Show>
                  </div>
                </div>
              </Show>
            </div>

            {/* MOT Status Card */}
            <div class={`status-card mot-card ${getMOTStatusClass(vehicle().motStatus)}`}>
              <div class="status-header">
                <div class="status-icon">🔧</div>
                <h3>MOT Status</h3>
              </div>
              <div class="status-value">
                {vehicle().motStatus}
              </div>
              <Show when={vehicle().motExpiryDate}>
                <div class="status-details">
                  <div class={`expiry-info ${isDateExpired(vehicle().motExpiryDate) ? 'expired' : ''}`}>
                    <span class="label">Expires:</span>
                    <span class="date">{formatDate(vehicle().motExpiryDate)}</span>
                    <Show when={!isDateExpired(vehicle().motExpiryDate) && getDaysUntilExpiry(vehicle().motExpiryDate) !== null}>
                      <span class="days-remaining">
                        ({getDaysUntilExpiry(vehicle().motExpiryDate)} days)
                      </span>
                    </Show>
                    <Show when={isDateExpired(vehicle().motExpiryDate)}>
                      <span class="expired-badge">EXPIRED</span>
                    </Show>
                  </div>
                </div>
              </Show>
            </div>
          </div>

          {/* Vehicle Details Card */}
          <div class="details-card">
            <h3>📋 Vehicle Details</h3>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Make:</span>
                <span class="detail-value">{vehicle().make}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Colour:</span>
                <span class="detail-value">{vehicle().colour}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Fuel Type:</span>
                <span class="detail-value">{vehicle().fuelType}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Year:</span>
                <span class="detail-value">{vehicle().yearOfManufacture}</span>
              </div>
              <Show when={vehicle().engineCapacity}>
                <div class="detail-item">
                  <span class="detail-label">Engine:</span>
                  <span class="detail-value">{vehicle().engineCapacity}cc</span>
                </div>
              </Show>
              <Show when={vehicle().co2Emissions}>
                <div class="detail-item">
                  <span class="detail-label">CO₂ Emissions:</span>
                  <span class="detail-value">{vehicle().co2Emissions}g/km</span>
                </div>
              </Show>
            </div>
          </div>

          {/* Quick Actions */}
          <div class="results-actions">
            <button 
              onClick={() => {
                if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
                  navigator.share({
                    title: `Vehicle Check - ${vehicle().registrationNumber}`,
                    text: `Tax: ${formatTaxStatus(vehicle().taxStatus)}, MOT: ${vehicle().motStatus}`,
                  });
                }
              }}
              class="button secondary"
              style={{ display: (typeof navigator !== 'undefined' && typeof navigator.share === 'function') ? 'block' : 'none' }}
            >
              📤 Share Results
            </button>
          </div>

          {/* Data freshness indicator */}
          <div class="data-info">
            <small>
              ℹ️ Data from DVLA API • Results may be cached for faster loading
            </small>
          </div>
        </div>
      )}
    </Show>
  );
};

export default Results;