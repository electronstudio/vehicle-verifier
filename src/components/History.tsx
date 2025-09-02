import type { Component } from 'solid-js';
import { Show, For } from 'solid-js';
import type { HistoryEntry } from '../lib/types';
import { formatTaxStatus, formatDate } from '../lib/dvla';

interface HistoryProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}

const History: Component<HistoryProps> = (props) => {
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

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

  const confirmClear = () => {
    if (confirm('Are you sure you want to clear all search history?')) {
      props.onClear();
    }
  };

  return (
    <div class="history">
      <div class="history-header">
        <h2>📜 Search History</h2>
        <Show when={props.history.length > 0}>
          <button 
            onClick={confirmClear}
            class="button danger small"
          >
            Clear All
          </button>
        </Show>
      </div>

      <Show
        when={props.history.length > 0}
        fallback={
          <div class="empty-history">
            <div class="empty-icon">🔍</div>
            <h3>No searches yet</h3>
            <p>Your vehicle searches will appear here for quick access.</p>
            <div class="empty-actions">
              <p>Start by taking a photo or entering a registration manually.</p>
            </div>
          </div>
        }
      >
        <div class="history-list">
          <For each={props.history}>
            {(entry) => (
              <div 
                class="history-item"
                onClick={() => props.onSelect(entry)}
                role="button"
                tabIndex={0}
              >
                <div class="history-main">
                  <div class="history-plate">
                    {entry.plate}
                  </div>
                  <div class="history-vehicle">
                    {entry.data.make} • {entry.data.colour} • {entry.data.yearOfManufacture}
                  </div>
                </div>
                
                <div class="history-status">
                  <div class={`status-badge tax-badge ${getTaxStatusClass(entry.data.taxStatus)}`}>
                    Tax: {formatTaxStatus(entry.data.taxStatus)}
                  </div>
                  <div class="mot-status">
                    MOT: {entry.data.motStatus.includes('Valid') ? '✅' : 
                          entry.data.motStatus.includes('No details') ? '❓' : '⚠️'}
                  </div>
                </div>
                
                <div class="history-meta">
                  <div class="history-time">
                    {formatRelativeTime(entry.timestamp)}
                  </div>
                  <div class="history-details">
                    <Show when={entry.data.taxDueDate}>
                      <span class="detail-item">
                        Tax expires: {formatDate(entry.data.taxDueDate)}
                      </span>
                    </Show>
                    <Show when={entry.data.motExpiryDate}>
                      <span class="detail-item">
                        MOT expires: {formatDate(entry.data.motExpiryDate)}
                      </span>
                    </Show>
                  </div>
                </div>

                <div class="history-arrow">→</div>
              </div>
            )}
          </For>
        </div>

        <div class="history-footer">
          <div class="history-stats">
            <span>{props.history.length} search{props.history.length !== 1 ? 'es' : ''}</span>
            <span>•</span>
            <span>Last 50 results shown</span>
          </div>
          <div class="history-info">
            💡 Tap any result to view full details again
          </div>
        </div>
      </Show>
    </div>
  );
};

export default History;