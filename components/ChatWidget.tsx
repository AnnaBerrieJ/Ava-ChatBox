"use client";

// ChatWidget.tsx
// Drop this anywhere in your Next.js app.
// Usage: <ChatWidget />

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_QUESTIONS = [
  "What is Junkanoo?",
  "Tell me about Bahamian food",
  "Who are famous Bahamians?",
  "What are the Out Islands?",
];

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    // Add a placeholder for the assistant's streaming response
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) throw new Error("API error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #009B77, #005F99)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          zIndex: 1000,
          fontSize: "22px",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {isOpen ? "✕" : "🌴"}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "92px",
            right: "24px",
            width: "360px",
            maxHeight: "520px",
            display: "flex",
            flexDirection: "column",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            overflow: "hidden",
            zIndex: 999,
            fontFamily: "system-ui, sans-serif",
            background: "#fff",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #009B77, #005F99)",
              padding: "16px 20px",
              color: "#fff",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "16px" }}>
              🌺 Bahamas Culture Guide
            </div>
            <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "2px" }}>
              Ask me anything about the Bahamas!
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "#f8f9fa",
            }}
          >
            {messages.length === 0 && (
              <div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#555",
                    marginBottom: "12px",
                    textAlign: "center",
                  }}
                >
                  Start with a question, or try one of these:
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    justifyContent: "center",
                  }}
                >
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      style={{
                        background: "#fff",
                        border: "1px solid #009B77",
                        color: "#009B77",
                        borderRadius: "20px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        cursor: "pointer",
                        transition: "background 0.15s, color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#009B77";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.color = "#009B77";
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius:
                      msg.role === "user"
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg, #009B77, #005F99)"
                        : "#fff",
                    color: msg.role === "user" ? "#fff" : "#222",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content || (isLoading && i === messages.length - 1 ? (
                    <span style={{ opacity: 0.5 }}>▌</span>
                  ) : null)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              gap: "8px",
              padding: "12px",
              borderTop: "1px solid #eee",
              background: "#fff",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the Bahamas..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "24px",
                border: "1px solid #ddd",
                fontSize: "14px",
                outline: "none",
                background: isLoading ? "#f5f5f5" : "#fff",
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background:
                  isLoading || !input.trim()
                    ? "#ccc"
                    : "linear-gradient(135deg, #009B77, #005F99)",
                border: "none",
                cursor: isLoading || !input.trim() ? "default" : "pointer",
                color: "#fff",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
