import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Sparkles,
  Send,
  Lightbulb,
  Calculator,
  Search,
  Settings,
  Trash2,
  KeyRound,
  Loader2,
  X,
  Package,
  AlertCircle,
} from "lucide-react";

import "../styles/AIAssistantPage.css";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
};

type Material = {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: number;
  supplier?: string;
};

const GEMINI_MODEL = "gemini-3.6-flash";

const SUGGESTIONS = [
  {
    icon: Calculator,
    text: "Help me calculate materials for a 3-bedroom house wiring project in Uganda",
  },
  {
    icon: Search,
    text: "What is a fair market price for 2.5mm² twin and earth cable per 100m roll?",
  },
  {
    icon: Lightbulb,
    text: "Draft professional terms and conditions for an electrical quotation",
  },
  {
    icon: Sparkles,
    text: "How should I structure labour vs materials on a solar installation quotation?",
  },
  {
    icon: Package,
    text: "Suggest a basic materials list for a small shop electrical installation",
  },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatCurrency(value: number) {
  return `UGX ${Number(value || 0).toLocaleString("en-UG")}`;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      content:
        "Hi — I'm VoltDesk AI. I can help with material estimates, market pricing guidance, quotation wording, and electrical project planning for work in Uganda.\n\nAdd your free Gemini API key in Settings to get started. I'll use your materials price list when it's available.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [draftKey, setDraftKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [keyLoaded, setKeyLoaded] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadKey() {
      try {
        const key =
          (await window.electronAPI?.settings?.getGeminiKey?.()) || "";
        setApiKey(key);
        setDraftKey(key);
      } catch (err) {
        console.warn("Could not load Gemini key:", err);
      } finally {
        setKeyLoaded(true);
      }
    }
    loadKey();
  }, []);

  useEffect(() => {
    async function loadMaterials() {
      try {
        if (!window.electronAPI?.materials?.getAll) return;
        const data = await window.electronAPI.materials.getAll();
        setMaterials(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Could not load materials for AI context:", err);
      }
    }
    loadMaterials();
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const materialsContext = useMemo(() => {
    if (!materials.length) return "";

    const byCategory = new Map<string, Material[]>();
    for (const m of materials) {
      const cat = m.category || "Other";
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      const list = byCategory.get(cat)!;
      if (list.length < 25) list.push(m);
    }

    const lines: string[] = [
      "Current materials price list from VoltDesk (use when estimating; prices in UGX):",
    ];

    for (const [cat, items] of byCategory) {
      lines.push(`\n[${cat}]`);
      for (const item of items) {
        lines.push(
          `- ${item.name} | ${item.unit || "pcs"} | ${formatCurrency(
            Number(item.price) || 0
          )}${item.supplier ? ` | ${item.supplier}` : ""}`
        );
      }
    }

    return lines.join("\n");
  }, [materials]);

  async function saveApiKey() {
    const key = draftKey.trim();
    try {
      if (!window.electronAPI?.settings?.setGeminiKey) {
        throw new Error("Settings API not available. Restart the app.");
      }
      await window.electronAPI.settings.setGeminiKey(key);
      setApiKey(key);
      setShowSettings(false);
      setError(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save API key.");
    }
  }

  async function removeApiKey() {
    try {
      await window.electronAPI?.settings?.setGeminiKey?.("");
      setDraftKey("");
      setApiKey("");
      setShowSettings(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove key.");
    }
  }

  function clearChat() {
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content:
          "Chat cleared. Ask me about materials, estimates, quotations, or electrical work planning.",
        timestamp: Date.now(),
      },
    ]);
    setError(null);
  }

  function buildContents(userText: string, history: ChatMessage[]) {
    const systemText = [
      "You are VoltDesk AI, assistant for Wamara Contractors — an electrical installation, solar, and maintenance company based in Kampala, Uganda.",
      "Be practical, concise, and professional.",
      "Prefer UGX for money. Mention units clearly (pcs, 100m roll, metre, set).",
      "When estimating materials, structure answers as clear lists with quantities and rough totals when possible.",
      "If using the price list, say so. If a price is missing, give a reasonable Uganda market range and label it as an estimate.",
      "Do not invent exact client data. Focus on electrical/solar contracting.",
      materialsContext
        ? `\n${materialsContext}`
        : "\n(No local materials list loaded yet — use general Uganda market knowledge and label estimates clearly.)",
    ].join("\n");

    const contents: { role: string; parts: { text: string }[] }[] = [
      {
        role: "user",
        parts: [
          {
            text:
              systemText +
              "\n\nAcknowledge you understand in one short sentence when I start chatting, but for this message answer the user request only.",
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: "Understood. I'll help with electrical work, pricing in UGX, and quotations using your materials list when available.",
          },
        ],
      },
    ];

    const recent = history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-12);

    for (const msg of recent) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: userText }],
    });

    return contents;
  }

  async function sendMessage(rawText?: string) {
    const text = (rawText ?? input).trim();
    if (!text || isSending) return;

    setError(null);
    setInput("");

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setIsSending(true);

    try {
      if (!window.electronAPI?.ai?.chat) {
        throw new Error(
          "AI bridge not available. Update preload/main and restart the app."
        );
      }

      const contents = buildContents(text, nextHistory);
      const result = await window.electronAPI.ai.chat({
        model: GEMINI_MODEL,
        contents,
      });

      const reply = result?.text?.trim();
      if (!reply) {
        throw new Error("Empty response from Gemini.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: reply,
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: `I couldn't complete that request.\n\n${message}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <div>
          <p className="page-eyebrow">VOLTDESK INTELLIGENCE</p>
          <h1>AI Assistant</h1>
          <p className="page-description">
            Gemini-powered help for estimates, pricing guidance, and quotation
            support — using your materials list when available.
          </p>
        </div>

        <div className="ai-header-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={clearChat}
            title="Clear chat"
          >
            <Trash2 size={16} />
            Clear
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setDraftKey(apiKey);
              setShowSettings(true);
            }}
          >
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      {keyLoaded && !apiKey && (
        <div className="ai-banner warn">
          <AlertCircle size={18} />
          <div>
            <strong>Gemini API key required</strong>
            <p>
              Get a free key from{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
              >
                Google AI Studio
              </a>
              , then paste it in Settings. No credit card needed for the free
              tier.
            </p>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowSettings(true)}
          >
            <KeyRound size={16} />
            Add key
          </button>
        </div>
      )}

      {apiKey && materials.length > 0 && (
        <div className="ai-banner ok">
          <Package size={18} />
          <span>
            Using <strong>{materials.length}</strong> materials from your
            database as pricing context.
          </span>
        </div>
      )}

      <div className="ai-layout">
        <section className="ai-chat-card">
          <div className="ai-chat-header">
            <div className="ai-avatar">
              <Bot size={22} />
            </div>
            <div>
              <h3>VoltDesk AI</h3>
              <span>{isSending ? "Thinking…" : "Ready to help"}</span>
            </div>
            <div className="ai-model-tag">Gemini Flash</div>
          </div>

          <div className="ai-messages" ref={listRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-message ${
                  msg.role === "user" ? "user" : "assistant"
                }`}
              >
                <div className="ai-message-bubble">
                  {msg.content.split("\n").map((line, i) => (
                    <p key={i}>{line || "\u00A0"}</p>
                  ))}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="ai-message assistant">
                <div className="ai-message-bubble thinking">
                  <Loader2 size={16} className="spin" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="ai-inline-error">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="ai-input-area">
            <textarea
              ref={inputRef}
              rows={2}
              placeholder="Ask about materials, estimates, quotations…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={isSending}
            />
            <button
              type="button"
              className="primary-button send-button"
              onClick={() => sendMessage()}
              disabled={isSending || !input.trim()}
            >
              {isSending ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </section>

        <aside className="ai-suggestions">
          <p className="section-eyebrow">TRY ASKING</p>
          {SUGGESTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.text}
                type="button"
                onClick={() => sendMessage(item.text)}
                disabled={isSending}
              >
                <Icon size={18} />
                <span>{item.text}</span>
              </button>
            );
          })}

          <div className="ai-tips">
            <p className="section-eyebrow">TIPS</p>
            <ul>
              <li>
                Mention room count, cable sizes, or solar size for better
                estimates.
              </li>
              <li>
                Ask in plain English — e.g. “list materials for a small shop.”
              </li>
              <li>
                Your materials prices are included automatically when loaded.
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {showSettings && (
        <div
          className="modal-overlay"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="ai-settings-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">CONFIGURATION</p>
                <h2>Gemini API Settings</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowSettings(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="settings-help">
              Create a free API key at{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
              >
                aistudio.google.com/apikey
              </a>
              . The free tier is enough for normal VoltDesk use. The key is
              stored in the app user data folder on this computer only — never
              in source code.
            </p>

            <div className="form-group">
              <label>Gemini API key</label>
              <input
                type="password"
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                placeholder="AIza…"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Model</label>
              <input value={GEMINI_MODEL} disabled />
              <small>Free-tier Flash model via Google AI Studio.</small>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={removeApiKey}
              >
                Remove key
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={saveApiKey}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
