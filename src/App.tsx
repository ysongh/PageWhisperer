import { useState } from "react";

function App() {
  const [pageContent, setPageContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractPageContent = async () => {
    setLoading(true);
    setError(null);
    setPageContent(null);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) {
        setError("No active tab found.");
        setLoading(false);
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const title = document.title;
          const url = document.URL;
          const text = document.body.innerText;
          return { title, url, text };
        },
      });

      const data = results[0]?.result;
      if (data) {
        setPageContent(
          `Title: ${data.title}\n\nURL: ${data.url}\n\n${data.text}`
        );
      } else {
        setError("Could not read page content.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to read page content."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: 400, height: 500, padding: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <h1 style={{ fontSize: 18, margin: "0 0 12px" }}>PageWhisperer</h1>

      <button
        onClick={extractPageContent}
        disabled={loading}
        style={{
          padding: "8px 16px",
          cursor: loading ? "wait" : "pointer",
          marginBottom: 12,
        }}
      >
        {loading ? "Reading..." : "Read Page Content"}
      </button>

      {error && (
        <p style={{ color: "red", margin: "0 0 8px" }}>{error}</p>
      )}

      {pageContent && (
        <pre
          style={{
            flex: 1,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            background: "#f5f5f5",
            padding: 12,
            borderRadius: 4,
            fontSize: 13,
            margin: 0,
          }}
        >
          {pageContent}
        </pre>
      )}
    </div>
  );
}

export default App;
