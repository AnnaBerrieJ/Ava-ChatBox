"use client";

// app/chat/page.tsx
// Full-page Bahamian culture chat experience with animated avatar "Ava"

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

// ─── Animated SVG Avatar ──────────────────────────────────────────────────────

function AvaCharacter({ isTalking }: { isTalking: boolean }) {
  return (
    <div style={{ position: "relative", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.3))" }}>
      <style>{`
        @keyframes talkMouth {
          0%   { transform: scaleY(0.15); }
          40%  { transform: scaleY(1);    }
          70%  { transform: scaleY(0.4);  }
          100% { transform: scaleY(0.9);  }
        }
        @keyframes blink {
          0%, 85%, 100% { transform: scaleY(1);    }
          90%            { transform: scaleY(0.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-8px); }
        }
        .ava-float { animation: float 3.5s ease-in-out infinite; }
        .ava-eyes  { animation: blink 4s ease-in-out infinite; }
        .ava-mouth-inner {
          transform-origin: 100px 144px;
          transform: scaleY(0);
        }
        .ava-mouth-inner.talking {
          animation: talkMouth 0.28s ease-in-out infinite alternate;
        }
        .ava-teeth {
          transform-origin: 100px 142px;
          transform: scaleY(0);
        }
        .ava-teeth.talking {
          animation: talkMouth 0.28s ease-in-out infinite alternate;
        }
      `}</style>

      <div className="ava-float">
        <svg
          viewBox="0 0 200 250"
          width="200"
          height="250"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ── Glow halo ── */}
          <circle cx="100" cy="130" r="85" fill="rgba(255,255,255,0.07)" />

          {/* ── Body ── */}
          <ellipse cx="100" cy="232" rx="60" ry="28" fill="#00796B" />
          <rect x="58" y="192" width="84" height="48" rx="14" fill="#00897B" />

          {/* ── Collar ── */}
          <path
            d="M 68 192 Q 100 208 132 192"
            stroke="#004D40"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* ── Neck ── */}
          <rect x="84" y="162" width="32" height="34" rx="8" fill="#C68642" />

          {/* ── Head ── */}
          <circle cx="100" cy="120" r="62" fill="#C68642" />

          {/* ── Hair ── */}
          <ellipse cx="100" cy="63" rx="60" ry="20" fill="#2C1810" />
          <ellipse cx="46"  cy="92" rx="16" ry="32" fill="#2C1810" />
          <ellipse cx="154" cy="92" rx="16" ry="32" fill="#2C1810" />
          <ellipse cx="100" cy="58" rx="50" ry="14" fill="#3D2314" />

          {/* ── Hibiscus flower in hair ── */}
          {[0, 72, 144, 216, 288].map((deg, i) => (
            <ellipse
              key={i}
              cx={154 + 10 * Math.cos((deg * Math.PI) / 180)}
              cy={70 + 10 * Math.sin((deg * Math.PI) / 180)}
              rx="7"
              ry="4"
              fill="#FF4D8D"
              transform={`rotate(${deg}, 154, 70)`}
            />
          ))}
          <circle cx="154" cy="70" r="5" fill="#FFD700" />

          {/* ── Ear studs ── */}
          <circle cx="38"  cy="120" r="5" fill="#C68642" />
          <circle cx="162" cy="120" r="5" fill="#C68642" />
          <circle cx="38"  cy="120" r="3" fill="#FFD700" />
          <circle cx="162" cy="120" r="3" fill="#FFD700" />

          {/* ── Eyes (whites) ── */}
          <ellipse cx="78"  cy="112" rx="13" ry="14" fill="white" />
          <ellipse cx="122" cy="112" rx="13" ry="14" fill="white" />

          {/* ── Pupils + blink ── */}
          <g className="ava-eyes">
            <circle cx="80"  cy="113" r="9" fill="#2C1810" />
            <circle cx="124" cy="113" r="9" fill="#2C1810" />
            {/* Shine */}
            <circle cx="83"  cy="110" r="3" fill="white" />
            <circle cx="127" cy="110" r="3" fill="white" />
          </g>

          {/* ── Eyebrows ── */}
          <path
            d="M 64 96 Q 78 90 92 96"
            stroke="#2C1810"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 108 96 Q 122 90 136 96"
            stroke="#2C1810"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* ── Nose ── */}
          <ellipse cx="100" cy="128" rx="6" ry="4" fill="#A0652A" />

          {/* ── Cheek blush ── */}
          <ellipse cx="62"  cy="132" rx="10" ry="6" fill="rgba(220,100,80,0.25)" />
          <ellipse cx="138" cy="132" rx="10" ry="6" fill="rgba(220,100,80,0.25)" />

          {/* ── Mouth ── */}
          {/* Upper lip */}
          <path
            d="M 82 143 Q 91 138 100 140 Q 109 138 118 143"
            fill="#A0522D"
          />
          {/* Lower lip */}
          <path
            d="M 82 143 Q 100 156 118 143"
            fill="#C1694F"
          />
          {/* Inner mouth (animated when talking) */}
          <ellipse
            className={`ava-mouth-inner${isTalking ? " talking" : ""}`}
            cx="100"
            cy="144"
            rx="16"
            ry="7"
            fill="#5C2D1E"
          />
          {/* Teeth */}
          <ellipse
            className={`ava-teeth${isTalking ? " talking" : ""}`}
            cx="100"
            cy="142"
            rx="13"
            ry="4"
            fill="white"
          />

          {/* ── Smile dimples ── */}
          <path
            d="M 70 136 Q 66 142 70 148"
            stroke="#A0652A"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 130 136 Q 134 142 130 148"
            stroke="#A0652A"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* ── Gold necklace ── */}
          <path
            d="M 70 180 Q 100 196 130 180"
            stroke="#FFD700"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="100" cy="194" r="5"  fill="#FFD700" />
          <circle cx="85"  cy="190" r="3"  fill="#FFD700" />
          <circle cx="115" cy="190" r="3"  fill="#FFD700" />
        </svg>
      </div>
    </div>
  );
}

// ─── Decorative background elements ──────────────────────────────────────────

function TropicalBackground() {
  return (
    <>
      {/* Sun */}
      <div
        style={{
          position: "absolute",
          top: 28,
          right: 72,
          width: 72,
          height: 72,
          background: "radial-gradient(circle, #FFE566, #FFA500)",
          borderRadius: "50%",
          boxShadow: "0 0 48px rgba(255,200,0,0.55)",
        }}
      />
      {/* Sun rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <div
          key={deg}
          style={{
            position: "absolute",
            top: 60,
            right: 104,
            width: 2,
            height: 28,
            background: "rgba(255,220,0,0.45)",
            transformOrigin: "1px 0",
            transform: `rotate(${deg}deg) translateY(-48px)`,
            borderRadius: 2,
          }}
        />
      ))}

      {/* Cloud left */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 32,
          display: "flex",
          gap: -8,
          opacity: 0.75,
        }}
      >
        {[40, 56, 40].map((s, i) => (
          <div
            key={i}
            style={{
              width: s,
              height: s,
              background: "white",
              borderRadius: "50%",
              marginLeft: i > 0 ? -16 : 0,
            }}
          />
        ))}
      </div>

      {/* Wave shapes at bottom */}
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
          height: 120,
        }}
      >
        <path
          d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"
          fill="rgba(0,77,122,0.5)"
        />
        <path
          d="M0,80 C360,40 720,100 1080,60 C1260,40 1380,80 1440,80 L1440,120 L0,120 Z"
          fill="rgba(0,60,100,0.4)"
        />
      </svg>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      if (!response.ok) throw new Error("API error");

      const reader  = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: copy[copy.length - 1].content + chunk,
          };
          return copy;
        });
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return copy;
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #87CEEB 0%, #29ABE2 25%, #0086BF 55%, #005F99 80%, #003D66 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <TropicalBackground />

      {/* ── Header ── */}
      <div
        style={{
          textAlign: "center",
          padding: "36px 20px 0",
          color: "white",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: 2,
            textShadow: "0 2px 12px rgba(0,0,0,0.3)",
          }}
        >
          Ava
        </h1>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 14,
            opacity: 0.9,
            letterSpacing: 0.5,
          }}
        >
          Your Bahamian Culture Guide 🌺
        </p>
      </div>

      {/* ── Avatar ── */}
      <div style={{ position: "relative", zIndex: 1, marginTop: 12 }}>
        <AvaCharacter isTalking={isLoading} />

        {/* Talking indicator */}
        {isLoading && (
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(255,255,255,0.9)",
              borderRadius: 20,
              padding: "4px 14px",
              fontSize: 12,
              color: "#005F99",
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            Ava is speaking...
          </div>
        )}
      </div>

      {/* ── Chat messages ── */}
      <div
        style={{
          width: "100%",
          maxWidth: 660,
          flex: 1,
          overflowY: "auto",
          padding: "0 16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.92)",
              paddingTop: 8,
            }}
          >
            <p style={{ fontSize: 14, marginBottom: 16 }}>
              Ask Ava anything about the Bahamas!
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
              }}
            >
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.45)",
                    color: "white",
                    borderRadius: 24,
                    padding: "9px 18px",
                    fontSize: 13,
                    cursor: "pointer",
                    backdropFilter: "blur(6px)",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.3)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.18)")
                  }
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                gap: 8,
              }}
            >
              {msg.role === "assistant" && (
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #C68642, #A0652A)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                  }}
                >
                  🌺
                </div>
              )}
              <div
                style={{
                  maxWidth: "72%",
                  padding: "12px 16px",
                  borderRadius:
                    msg.role === "user"
                      ? "20px 20px 4px 20px"
                      : "20px 20px 20px 4px",
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg, #00897B, #005F99)"
                      : "rgba(255,255,255,0.93)",
                  color: msg.role === "user" ? "white" : "#1a1a1a",
                  fontSize: 14,
                  lineHeight: 1.65,
                  boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content ||
                  (isLoading && i === messages.length - 1 ? (
                    <span style={{ opacity: 0.5 }}>▌</span>
                  ) : null)}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        style={{
          width: "100%",
          maxWidth: 660,
          display: "flex",
          gap: 10,
          padding: "14px 16px",
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          position: "relative",
          zIndex: 1,
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
            padding: "13px 20px",
            borderRadius: 32,
            border: "none",
            background: "rgba(255,255,255,0.92)",
            fontSize: 14,
            outline: "none",
            color: "#1a1a1a",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          style={{
            padding: "13px 26px",
            borderRadius: 32,
            border: "none",
            background:
              input.trim() && !isLoading
                ? "linear-gradient(135deg, #FFD700, #FFA500)"
                : "rgba(255,255,255,0.2)",
            color: input.trim() && !isLoading ? "#1a1a1a" : "rgba(255,255,255,0.4)",
            fontWeight: 700,
            fontSize: 14,
            cursor: input.trim() && !isLoading ? "pointer" : "default",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          Send ➤
        </button>
      </form>
    </div>
  );
}
