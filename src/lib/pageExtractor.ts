export interface PageData {
  title: string;
  url: string;
  text: string;
}

export async function extractPageContent(): Promise<PageData> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.id) {
    throw new Error("No active tab found.");
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => ({
      title: document.title,
      url: document.URL,
      text: document.body.innerText,
    }),
  });

  const data = results[0]?.result;
  if (!data) {
    throw new Error("Could not read page content.");
  }

  return data;
}
