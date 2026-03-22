import { useEffect, useRef, useState } from "react";
import {
  CLOUD_PROVIDERS,
  LOCAL_MODELS,
  type CloudProviderId,
  type LocalModelId,
  type ProviderMode,
} from "./lib/constants";
import { loadState, saveState } from "./lib/storage";
import { extractPageContent } from "./lib/pageExtractor";
import { summarizeWithCloud } from "./lib/cloudProviders";
import { loadLocalModel, summarizeWithLocal, type MLCEngine } from "./lib/localModel";

function App() {
  const [providerMode, setProviderMode] = useState<ProviderMode>("local");

  // Cloud state
  const [selectedCloud, setSelectedCloud] = useState<CloudProviderId>("gemini");
  const [apiKeys, setApiKeys] = useState<Record<CloudProviderId, string>>({
    gemini: "",
    claude: "",
    chatgpt: "",
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");

  // Local state
  const [selectedLocal, setSelectedLocal] = useState<LocalModelId>(LOCAL_MODELS[0].id);
  const [modelStatus, setModelStatus] = useState("");
  const [modelReady, setModelReady] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const engineRef = useRef<MLCEngine | null>(null);

  // Shared state
  const [pageContent, setPageContent] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load persisted state
  useEffect(() => {
    loadState().then((state) => {
      if (state.providerMode) setProviderMode(state.providerMode);
      if (state.selectedCloud) setSelectedCloud(state.selectedCloud);
      if (state.selectedLocal) setSelectedLocal(state.selectedLocal);
      if (state.apiKeys) setApiKeys(state.apiKeys);
    });
  }, []);

  // --- Mode switching ---

  const handleModeChange = (mode: ProviderMode) => {
    setProviderMode(mode);
    saveState({ providerMode: mode });
    setShowKeyInput(false);
  };

  // --- Cloud handlers ---

  const handleCloudChange = (id: CloudProviderId) => {
    setSelectedCloud(id);
    saveState({ selectedCloud: id });
    if (!apiKeys[id]) {
      setKeyDraft("");
      setShowKeyInput(true);
    } else {
      setShowKeyInput(false);
    }
  };

  const saveApiKey = () => {
    const trimmed = keyDraft.trim();
    if (!trimmed) return;
    const updated = { ...apiKeys, [selectedCloud]: trimmed };
    setApiKeys(updated);
    saveState({ apiKeys: updated });
    setKeyDraft("");
    setShowKeyInput(false);
  };

  // --- Local handlers ---

  const handleLocalChange = (id: LocalModelId) => {
    setSelectedLocal(id);
    saveState({ selectedLocal: id });
    engineRef.current = null;
    setModelReady(false);
    setModelStatus("");
  };

  const handleLoadModel = async () => {
    setLoadingModel(true);
    setModelReady(false);
    setError(null);
    try {
      const engine = await loadLocalModel(selectedLocal, (progress) => {
        setModelStatus(progress.text);
      });
      engineRef.current = engine;
      setModelReady(true);
      setModelStatus("Model ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load model. Make sure your browser supports WebGPU.");
      setModelStatus("");
    } finally {
      setLoadingModel(false);
    }
  };

  // --- Page extraction ---

  const handleExtractPage = async () => {
    setLoading(true);
    setError(null);
    setPageContent(null);
    setSummary(null);
    try {
      const data = await extractPageContent();
      setPageContent(`Title: ${data.title}\nURL: ${data.url}\n\n${data.text}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read page content.");
    } finally {
      setLoading(false);
    }
  };

  // --- Summarize ---

  const handleSummarize = async () => {
    if (!pageContent) return;
    setSummarizing(true);
    setError(null);
    setSummary(null);

    const truncated = pageContent.slice(0, 4000);

    try {
      let result: string;

      if (providerMode === "cloud") {
        const key = apiKeys[selectedCloud];
        if (!key) {
          setShowKeyInput(true);
          setError(`Please enter your API key for ${CLOUD_PROVIDERS.find((p) => p.id === selectedCloud)?.label}.`);
          setSummarizing(false);
          return;
        }
        result = await summarizeWithCloud(selectedCloud, key, truncated);
      } else {
        if (!engineRef.current) {
          setError("Please load a local model first.");
          setSummarizing(false);
          return;
        }
        result = await summarizeWithLocal(engineRef.current, truncated);
      }

      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to summarize content.");
    } finally {
      setSummarizing(false);
    }
  };

  const canSummarize =
    providerMode === "cloud"
      ? !!pageContent && !!apiKeys[selectedCloud]
      : !!pageContent && modelReady;

  const currentCloudLabel = CLOUD_PROVIDERS.find((p) => p.id === selectedCloud)?.label ?? "";
  const currentLocalLabel = LOCAL_MODELS.find((m) => m.id === selectedLocal)?.label ?? "";

  return (
    <div style={{ width: 420, height: 550, padding: 16, overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 18, margin: "0 0 12px" }}>PageWhisperer</h1>

      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: 0, marginBottom: 10 }}>
        {(["cloud", "local"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            style={{
              flex: 1,
              padding: "7px 0",
              fontSize: 13,
              fontWeight: providerMode === mode ? 700 : 400,
              background: providerMode === mode ? "#1976d2" : "#eee",
              color: providerMode === mode ? "#fff" : "#333",
              border: "1px solid #ccc",
              cursor: "pointer",
              borderRadius: mode === "cloud" ? "4px 0 0 4px" : "0 4px 4px 0",
            }}
          >
            {mode === "cloud" ? "Cloud API" : "Local (WebGPU)"}
          </button>
        ))}
      </div>

      {/* Cloud Provider Section */}
      {providerMode === "cloud" && (
        <fieldset style={{ border: "1px solid #ccc", borderRadius: 4, padding: "8px 12px", margin: "0 0 10px" }}>
          <legend style={{ fontSize: 13, fontWeight: 600 }}>Cloud Provider</legend>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {CLOUD_PROVIDERS.map((provider) => (
              <label key={provider.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                <input
                  type="radio"
                  name="cloud-provider"
                  value={provider.id}
                  checked={selectedCloud === provider.id}
                  onChange={() => handleCloudChange(provider.id)}
                />
                {provider.label}
                {selectedCloud === provider.id && apiKeys[provider.id] && (
                  <span style={{ color: "green", fontSize: 11 }}>(active)</span>
                )}
                {selectedCloud === provider.id && !apiKeys[provider.id] && (
                  <span style={{ color: "orange", fontSize: 11 }}>(no key)</span>
                )}
              </label>
            ))}
          </div>

          {showKeyInput && (
            <div style={{ marginTop: 8, padding: 8, background: "#fff8e1", borderRadius: 4, border: "1px solid #ffe082" }}>
              <p style={{ margin: "0 0 6px", fontSize: 12 }}>
                Enter API key for <strong>{currentCloudLabel}</strong>:
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="password"
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveApiKey()}
                  placeholder="Paste API key here"
                  style={{ flex: 1, padding: "5px 8px", fontSize: 12, borderRadius: 4, border: "1px solid #ccc" }}
                />
                <button onClick={saveApiKey} style={{ padding: "5px 10px", fontSize: 12 }}>Save</button>
              </div>
            </div>
          )}

          {apiKeys[selectedCloud] && !showKeyInput && (
            <button
              onClick={() => { setKeyDraft(""); setShowKeyInput(true); }}
              style={{ marginTop: 8, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}
            >
              Update {currentCloudLabel} Key
            </button>
          )}
        </fieldset>
      )}

      {/* Local Model Section */}
      {providerMode === "local" && (
        <fieldset style={{ border: "1px solid #ccc", borderRadius: 4, padding: "8px 12px", margin: "0 0 10px" }}>
          <legend style={{ fontSize: 13, fontWeight: 600 }}>Local LLM Model</legend>
          <select
            value={selectedLocal}
            onChange={(e) => handleLocalChange(e.target.value as LocalModelId)}
            style={{ width: "100%", padding: "6px 8px", fontSize: 13, borderRadius: 4, border: "1px solid #ccc" }}
          >
            {LOCAL_MODELS.map((model) => (
              <option key={model.id} value={model.id}>{model.label}</option>
            ))}
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <button
              onClick={handleLoadModel}
              disabled={loadingModel || modelReady}
              style={{ padding: "6px 14px", fontSize: 13, cursor: loadingModel || modelReady ? "default" : "pointer" }}
            >
              {modelReady ? `${currentLocalLabel} Loaded` : loadingModel ? "Loading..." : "Load Model"}
            </button>
            {modelReady && <span style={{ color: "green", fontSize: 12 }}>Ready</span>}
          </div>
          {modelStatus && !modelReady && (
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#666" }}>{modelStatus}</p>
          )}
        </fieldset>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button
          onClick={handleExtractPage}
          disabled={loading}
          style={{ flex: 1, padding: "8px 12px", fontSize: 13, cursor: loading ? "wait" : "pointer" }}
        >
          {loading ? "Reading..." : "Read Page"}
        </button>
        <button
          onClick={handleSummarize}
          disabled={!canSummarize || summarizing}
          style={{ flex: 1, padding: "8px 12px", fontSize: 13, cursor: !canSummarize || summarizing ? "default" : "pointer" }}
        >
          {summarizing ? "Summarizing..." : "Summarize"}
        </button>
      </div>

      {error && <p style={{ color: "red", margin: "0 0 8px", fontSize: 13 }}>{error}</p>}

      {summary && (
        <div style={{ marginBottom: 8 }}>
          <h3 style={{ fontSize: 14, margin: "0 0 6px" }}>Summary</h3>
          <div style={{ background: "#e8f5e9", padding: 10, borderRadius: 4, fontSize: 13, maxHeight: 160, overflow: "auto", whiteSpace: "pre-wrap" }}>
            {summary}
          </div>
        </div>
      )}

      {pageContent && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: 14, margin: "0 0 6px" }}>Page Content</h3>
          <pre style={{ flex: 1, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f5f5f5", padding: 10, borderRadius: 4, fontSize: 12, margin: 0 }}>
            {pageContent}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
