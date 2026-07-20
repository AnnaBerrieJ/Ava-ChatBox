"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED = [
  "What is Junkanoo? 🎉",
  "Tell me about Bahamian food 🍽️",
  "Who are famous Bahamians? 🌟",
  "What are the Out Islands? 🏝️",
];

function AvaCharacter({ isTalking }: { isTalking: boolean }) {
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 24px 6px rgba(0,200,200,0.55), 0 0 60px 16px rgba(0,155,119,0.35), 0 0 100px 30px rgba(255,215,0,0.15); }
          50%       { box-shadow: 0 0 40px 14px rgba(0,220,220,0.85), 0 0 90px 30px rgba(0,155,119,0.55), 0 0 140px 50px rgba(255,215,0,0.3); }
        }
        @keyframes ringPulse {
          0%   { transform: translateX(-50%) scale(1);   opacity: 0.7; }
          100% { transform: translateX(-50%) scale(1.55); opacity: 0; }
        }
        @keyframes talkBounce {
          0%, 100% { transform: translateY(0px) scale(1); }
          40%       { transform: translateY(-5px) scale(1.01); }
          70%       { transform: translateY(2px) scale(0.99); }
        }
        .ava-float    { animation: float 3.8s ease-in-out infinite; }
        .ava-talking  { animation: talkBounce 0.45s ease-in-out infinite; }
        .ava-img-wrap {
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid rgba(255,215,0,0.75);
          transition: box-shadow 0.3s ease;
        }
        .ava-img-wrap.idle    { box-shadow: 0 0 20px 4px rgba(0,180,180,0.4), 0 8px 32px rgba(0,0,0,0.35); }
        .ava-img-wrap.talking { animation: glowPulse 0.6s ease-in-out infinite; }
        .ring {
          position: absolute;
          border-radius: 50%;
          border: 3px solid rgba(0,210,200,0.6);
          animation: ringPulse 1.1s ease-out infinite;
        }
      `}</style>

      {isTalking && (
        <>
          <div className="ring" style={{ width: 200, height: 200, top: 0, left: "50%" }} />
          <div className="ring" style={{ width: 200, height: 200, top: 0, left: "50%", animationDelay: "0.37s" }} />
          <div className="ring" style={{ width: 200, height: 200, top: 0, left: "50%", animationDelay: "0.74s" }} />
        </>
      )}

      <div className={`ava-img-wrap ${isTalking ? "talking" : "idle"}`} style={{ width: 192, height: 192, position: "relative", zIndex: 1 }}>
        <div className={isTalking ? "ava-talking" : "ava-float"} style={{ width: "100%", height: "100%" }}>
          <img
            src="/ava-avatar.png"
            alt="Ava"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
          />
        </div>
      </div>

      {isTalking && (
        <div style={{
          marginTop: 10, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.25)", borderRadius: 20,
          padding: "5px 16px", fontSize: 12, color: "white", fontWeight: 600, letterSpacing: 0.5,
        }}>
          Ava is speaking ✨
        </div>
      )}
    </div>
  );
}

function TropicalBackground() {
  return (
    <>
      <div style={{ position: "absolute", top: 24, right: 64, width: 70, height: 70, background: "radial-gradient(circle, #FFE566, #FFA500)", borderRadius: "50%", boxShadow: "0 0 50px rgba(255,200,0,0.5)" }} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <div key={deg} style={{ position: "absolute", top: 56, right: 99, width: 2, height: 26, background: "rgba(255,220,0,0.4)", transformOrigin: "1px 0", transform: `rotate(${deg}deg) translateY(-46px)`, borderRadius: 2 }} />
      ))}
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ position: "absolute", bottom: 0, left: 0, right: 0, width: "100%", height: 100 }}>
        <path d="M0,50 C240,90 480,10 720,50 C960,90 1200,10 1440,50 L1440,100 L0,100 Z" fill="rgba(0,77,122,0.45)" />
        <path d="M0,70 C360,30 720,90 1080,50 C1260,30 1380,70 1440,70 L1440,100 L0,100 Z" fill="rgba(0,50,90,0.35)" />
      </svg>
    </>
  );
}

export default function ChatPage() {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = { role: "user", content: text };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      if (!response.ok) throw new Error();
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk };
          return copy;
        });
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "Sorry, something went wrong. Please try again." };
        return copy;
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #87CEEB 0%, #29ABE2 25%, #0086BF 55%, #005F99 80%, #003D66 100%)", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "'Segoe UI', system-ui, sans-serif", position: "relative", overflow: "hidden" }}>
      <TropicalBackground />

      <div style={{ textAlign: "center", padding: "28px 20px 0", color: "white", position: "relative", zIndex: 1 }}>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900, letterSpacing: 2, textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>Ava</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.88, letterSpacing: 0.5 }}>Your Bahamian Culture Guide 🌺</p>
      </div>

      <div style={{ position: "relative", zIndex: 1, marginTop: 16, marginBottom: 8 }}>
        <AvaCharacter isTalking={isLoading} />
      </div>

      <div style={{ width: "100%", maxWidth: 660, flex: 1, overflowY: "auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12, position: "relative", zIndex: 1 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.92)", paddingTop: 4 }}>
            <p style={{ fontSize: 14, marginBottom: 14 }}>Ask Ava anything about the Bahamas!</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {SUGGESTED.map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.4)", color: "white", borderRadius: 24, padding: "8px 16px", fontSize: 13, cursor: "pointer", backdropFilter: "blur(6px)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                >{q}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
              {msg.role === "assistant" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: "2px solid rgba(255,215,0,0.6)" }}>
                  <img src="/ava-avatar.png" alt="Ava" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                </div>
              )}
              <div style={{ maxWidth: "72%", padding: "12px 16px", borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px", background: msg.role === "user" ? "linear-gradient(135deg, #00897B, #005F99)" : "rgba(255,255,255,0.93)", color: msg.role === "user" ? "white" : "#1a1a1a", fontSize: 14, lineHeight: 1.65, boxShadow: "0 3px 10px rgba(0,0,0,0.18)", whiteSpace: "pre-wrap" }}>
                {msg.content || (isLoading && i === messages.length - 1 ? <span style={{ opacity: 0.5 }}>▌</span> : null)}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} style={{ width: "100%", maxWidth: 660, display: "flex", gap: 10, padding: "14px 16px", background: "rgba(0,0,0,0.25)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.15)", position: "relative", zIndex: 1 }}>
        <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about the Bahamas..." disabled={isLoading}
          style={{ flex: 1, padding: "13px 20px", borderRadius: 32, border: "none", background: "rgba(255,255,255,0.92)", fontSize: 14, outline: "none", color: "#1a1a1a" }} />
        <button type="submit" disabled={!input.trim() || isLoading}
          style={{ padding: "13px 26px", borderRadius: 32, border: "none", background: input.trim() && !isLoading ? "linear-gradient(135deg, #FFD700, #FFA500)" : "rgba(255,255,255,0.2)", color: input.trim() && !isLoading ? "#1a1a1a" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: 14, cursor: input.trim() && !isLoading ? "pointer" : "default", whiteSpace: "nowrap" }}>
          Send ➤
        </button>
      </form>
    </div>
  );
}
