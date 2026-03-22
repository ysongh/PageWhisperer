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
import { analyzeWithCloud } from "./lib/cloudProviders";
import { loadLocalModel, analyzeWithLocal, type MLCEngine } from "./lib/localModel";
import type { ArticleBiasReport } from "./lib/types";

type Tab = "summary" | "coverage" | "history";

const LEAN_LABELS: Record<string, string> = {
  "far-left": "Far left",
  "lean-left": "Lean left",
  "center": "Center",
  "lean-right": "Lean right",
  "far-right": "Far right",
};

const BIAS_DIMENSION_LABELS: { key: keyof ArticleBiasReport["biasDimensions"]; label: string }[] = [
  { key: "emotionalTone", label: "Emotional tone" },
  { key: "sourceDiversity", label: "Source diversity" },
  { key: "framing", label: "Framing" },
  { key: "omissionRisk", label: "Omission risk" },
  { key: "factualGrounding", label: "Factual grounding" },
];

function App() {
  const [providerMode, setProviderMode] = useState<ProviderMode>("local");
  const [activeTab, setActiveTab] = useState<Tab>("summary");

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
  const [report, setReport] = useState<ArticleBiasReport | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadState().then((state) => {
      if (state.providerMode) setProviderMode(state.providerMode);
      if (state.selectedCloud) setSelectedCloud(state.selectedCloud);
      if (state.selectedLocal) setSelectedLocal(state.selectedLocal);
      if (state.apiKeys) setApiKeys(state.apiKeys);
    });
  }, []);

  // --- Mode & provider handlers ---

  const handleModeChange = (mode: ProviderMode) => {
    setProviderMode(mode);
    saveState({ providerMode: mode });
    setShowKeyInput(false);
  };

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

  // --- Analyze page ---

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    setReport(null);

    try {
      const pageData = await extractPageContent();
      const content = `Title: ${pageData.title}\nURL: ${pageData.url}\n\n${pageData.text}`;
      const truncated = content.slice(0, 4000);

      let result: ArticleBiasReport;

      if (providerMode === "cloud") {
        const key = apiKeys[selectedCloud];
        if (!key) {
          setShowKeyInput(true);
          setShowSettings(true);
          setError(`Please enter your API key for ${CLOUD_PROVIDERS.find((p) => p.id === selectedCloud)?.label}.`);
          setAnalyzing(false);
          return;
        }
        result = await analyzeWithCloud(selectedCloud, key, truncated);
      } else {
        if (!engineRef.current) {
          setError("Please load a local model first.");
          setShowSettings(true);
          setAnalyzing(false);
          return;
        }
        result = await analyzeWithLocal(engineRef.current, truncated);
      }

      setReport(result);
      setActiveTab("summary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze page content.");
    } finally {
      setAnalyzing(false);
    }
  };

  const canAnalyze =
    providerMode === "cloud"
      ? !!apiKeys[selectedCloud]
      : modelReady;

  const currentCloudLabel = CLOUD_PROVIDERS.find((p) => p.id === selectedCloud)?.label ?? "";
  const currentLocalLabel = LOCAL_MODELS.find((m) => m.id === selectedLocal)?.label ?? "";

  // --- Render ---

  return (
    <div style={{ width: 380, minHeight: 500, fontFamily: "system-ui, -apple-system, sans-serif", background: "#fff", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>PageWhisperer</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: "2px 6px", color: "#666" }}
          title="Settings"
        >
          {showSettings ? "\u2715" : "\u2699"}
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #eee", background: "#fafafa" }}>
          {/* Mode Toggle */}
          <div style={{ display: "flex", gap: 0, marginBottom: 10 }}>
            {(["cloud", "local"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                style={{
                  flex: 1, padding: "6px 0", fontSize: 12, fontWeight: providerMode === mode ? 700 : 400,
                  background: providerMode === mode ? "#1976d2" : "#eee", color: providerMode === mode ? "#fff" : "#333",
                  border: "1px solid #ccc", cursor: "pointer",
                  borderRadius: mode === "cloud" ? "4px 0 0 4px" : "0 4px 4px 0",
                }}
              >
                {mode === "cloud" ? "Cloud API" : "Local (WebGPU)"}
              </button>
            ))}
          </div>

          {providerMode === "cloud" && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {CLOUD_PROVIDERS.map((p) => (
                  <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                    <input type="radio" name="cloud" checked={selectedCloud === p.id} onChange={() => handleCloudChange(p.id)} />
                    {p.label}
                    {selectedCloud === p.id && (
                      <span style={{ fontSize: 10, color: apiKeys[p.id] ? "green" : "orange" }}>
                        ({apiKeys[p.id] ? "active" : "no key"})
                      </span>
                    )}
                  </label>
                ))}
              </div>
              {showKeyInput && (
                <div style={{ marginTop: 8, padding: 8, background: "#fff8e1", borderRadius: 4, border: "1px solid #ffe082" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11 }}>API key for <strong>{currentCloudLabel}</strong>:</p>
                  <div style={{ display: "flex", gap: 4 }}>
                    <input type="password" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveApiKey()} placeholder="Paste API key" style={{ flex: 1, padding: "4px 6px", fontSize: 11, borderRadius: 3, border: "1px solid #ccc" }} />
                    <button onClick={saveApiKey} style={{ padding: "4px 8px", fontSize: 11 }}>Save</button>
                  </div>
                </div>
              )}
              {apiKeys[selectedCloud] && !showKeyInput && (
                <button onClick={() => { setKeyDraft(""); setShowKeyInput(true); }} style={{ marginTop: 6, padding: "2px 6px", fontSize: 10, cursor: "pointer" }}>
                  Update {currentCloudLabel} Key
                </button>
              )}
            </>
          )}

          {providerMode === "local" && (
            <>
              <select value={selectedLocal} onChange={(e) => handleLocalChange(e.target.value as LocalModelId)} style={{ width: "100%", padding: "5px 6px", fontSize: 12, borderRadius: 3, border: "1px solid #ccc" }}>
                {LOCAL_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <button onClick={handleLoadModel} disabled={loadingModel || modelReady} style={{ padding: "4px 10px", fontSize: 12, cursor: loadingModel || modelReady ? "default" : "pointer" }}>
                  {modelReady ? `${currentLocalLabel} Loaded` : loadingModel ? "Loading..." : "Load Model"}
                </button>
                {modelReady && <span style={{ color: "green", fontSize: 11 }}>Ready</span>}
              </div>
              {modelStatus && !modelReady && <p style={{ margin: "4px 0 0", fontSize: 10, color: "#666" }}>{modelStatus}</p>}
            </>
          )}
        </div>
      )}

      {/* Analyze Button */}
      <div style={{ padding: "10px 16px" }}>
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || analyzing}
          style={{
            width: "100%", padding: "10px 0", fontSize: 14, fontWeight: 600,
            background: canAnalyze && !analyzing ? "#1976d2" : "#ccc",
            color: "#fff", border: "none", borderRadius: 6, cursor: canAnalyze && !analyzing ? "pointer" : "default",
          }}
        >
          {analyzing ? "Analyzing..." : "Analyze This Page"}
        </button>
        {error && <p style={{ color: "red", margin: "8px 0 0", fontSize: 12 }}>{error}</p>}
      </div>

      {/* Report */}
      {report && (
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>

          {/* Outlet Header */}
          <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #eee" }}>
            <div style={{ width: 36, height: 36, borderRadius: 4, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#555", flexShrink: 0 }}>
              {report.outlet.outlet.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{report.outlet.outlet}</div>
              <div style={{ fontSize: 11, color: "#888" }}>
                {LEAN_LABELS[report.outlet.lean] ?? report.outlet.lean} / Allsides rating
              </div>
            </div>
          </div>

          {/* Political Lean Slider */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee" }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5, color: "#555" }}>
              Political Lean — This Article
            </div>
            <div style={{ position: "relative", height: 6, background: "linear-gradient(to right, #2196f3, #9c27b0, #f44336)", borderRadius: 3 }}>
              <div style={{
                position: "absolute", top: -5, width: 16, height: 16, borderRadius: "50%", background: "#333", border: "2px solid #fff",
                left: `calc(${report.politicalLeanScore}% - 8px)`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#999", marginTop: 6 }}>
              <span>Left</span><span>Center</span><span>Right</span>
            </div>
          </div>

          {/* Bias Dimensions */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee" }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5, color: "#555" }}>
              Bias Dimensions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {BIAS_DIMENSION_LABELS.map(({ key, label }) => {
                const value = report.biasDimensions[key];
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 110, fontSize: 12, color: "#444" }}>{label}</div>
                    <div style={{ flex: 1, height: 8, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        width: `${value}%`, height: "100%", borderRadius: 4,
                        background: value > 70 ? "#f44336" : value > 40 ? "#ff9800" : "#4caf50",
                      }} />
                    </div>
                    <div style={{ width: 32, fontSize: 11, color: "#666", textAlign: "right" }}>{value}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flagged Phrases */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee" }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5, color: "#555" }}>
              Flagged Phrases
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {report.flaggedPhrases.map((phrase, i) => (
                <span key={i} style={{
                  background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: 12,
                  padding: "3px 10px", fontSize: 11, color: "#e65100",
                }}>
                  {phrase}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#bbb", marginTop: 6 }}>tap a phrase to highlight</div>
          </div>

          {/* Bottom Tabs */}
          <div style={{ borderTop: "1px solid #eee", marginTop: "auto" }}>
            <div style={{ display: "flex" }}>
              {([
                { id: "summary" as Tab, label: "AI\nsummary" },
                { id: "coverage" as Tab, label: "Coverage\ncompare" },
                { id: "history" as Tab, label: "My\nhistory" },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1, padding: "10px 0", fontSize: 11, textAlign: "center",
                    background: activeTab === tab.id ? "#f5f5f5" : "#fff",
                    border: "none", borderTop: activeTab === tab.id ? "2px solid #1976d2" : "2px solid transparent",
                    cursor: "pointer", fontWeight: activeTab === tab.id ? 600 : 400,
                    color: activeTab === tab.id ? "#1976d2" : "#999",
                    whiteSpace: "pre-line", lineHeight: 1.3,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: "12px 16px", minHeight: 80 }}>
              {activeTab === "summary" && (
                <div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: "#333" }}>
                    {renderHighlightedSummary(report.summary.text, report.summary.highlights)}
                  </div>
                </div>
              )}
              {activeTab === "coverage" && (
                <div style={{ fontSize: 12, color: "#999", textAlign: "center", padding: 20 }}>
                  Coverage comparison coming soon
                </div>
              )}
              {activeTab === "history" && (
                <div style={{ fontSize: 12, color: "#999", textAlign: "center", padding: 20 }}>
                  Analysis history coming soon
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderHighlightedSummary(text: string, highlights: ArticleBiasReport["summary"]["highlights"]) {
  if (!highlights.length) return text;

  const HIGHLIGHT_COLORS: Record<string, string> = {
    "charged-language": "#fff3e0",
    "source-count": "#e3f2fd",
    "omission": "#fce4ec",
    "framing": "#f3e5f5",
  };

  // Build segments
  type Segment = { text: string; highlight?: ArticleBiasReport["summary"]["highlights"][number] };
  const segments: Segment[] = [];
  let remaining = text;

  // Sort highlights by their position in text
  const sorted = [...highlights]
    .map((h) => ({ ...h, index: text.indexOf(h.phrase) }))
    .filter((h) => h.index >= 0)
    .sort((a, b) => a.index - b.index);

  let cursor = 0;
  for (const h of sorted) {
    if (h.index < cursor) continue;
    if (h.index > cursor) {
      segments.push({ text: remaining.slice(0, h.index - cursor) });
    }
    segments.push({ text: h.phrase, highlight: h });
    cursor = h.index + h.phrase.length;
    remaining = text.slice(cursor);
  }
  if (remaining) segments.push({ text: remaining });

  return segments.map((seg, i) =>
    seg.highlight ? (
      <span
        key={i}
        title={seg.highlight.detail ?? seg.highlight.kind}
        style={{
          background: HIGHLIGHT_COLORS[seg.highlight.kind] ?? "#fff9c4",
          borderRadius: 2,
          padding: "1px 2px",
          cursor: "help",
        }}
      >
        {seg.text}
      </span>
    ) : (
      <span key={i}>{seg.text}</span>
    )
  );
}

export default App;
