import type { CloudProviderId, LocalModelId, ProviderMode } from "./constants";

export interface StoredState {
  providerMode?: ProviderMode;
  selectedCloud?: CloudProviderId;
  selectedLocal?: LocalModelId;
  apiKeys?: Record<CloudProviderId, string>;
}

export function loadState(): Promise<StoredState> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ["providerMode", "selectedCloud", "selectedLocal", "apiKeys"],
      (result) => resolve(result as StoredState)
    );
  });
}

export function saveState(partial: Partial<StoredState>): void {
  chrome.storage.local.set(partial);
}
