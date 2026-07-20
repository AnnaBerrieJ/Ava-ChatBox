"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTED = [
  "What is Junkanoo? 🎉",
  "Tell me about Bahamian food 🍽️",
  "Who are famous Bahamians? 🌟",
  "What are the Out Islands? 🏝️",
];

function AvaAvatar({ isTalking }: { isTalking: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 20px 5px rgba(0,200,180,0.5),
                        0 0 50px 15px rgba(0,155,119,0.3),
                        0 0 90px 25px rgba(255,215,0,0.15);
          }
          50% {
            box-shadow: 0 0 35px 12px rgba(0,220,200,0.8),
                        0 0 80px 28px rgba(0,155,119,0.5),
                        0 0 130px 45px rgba(255,215,0,0.25);
          }
        }
        @keyframes ringOut {
          0%   { transform: translateX(-50%) scale(1);    opacity: 0.6; }
          100% { transform: translateX(-50%) scale(1.6);  opacity: 0; }
        }
        @keyframes talkBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25%       { transform: translateY(-6px) rotate(-1deg); }
          75%       { transform: translateY(3px) rotate(1deg); }
        }
        .ava-idle    { animation: float 3.6s ease-in-out infinite; }
        .ava-talking { animation: talkBob 0.4s ease-in-out infinite; }
        .ava-ring {
          position: absolute;
          top: 0; left: 50%;
          border-radius: 50%;
          border: 3px solid rgba(0,210,190,0.55);
          pointer-events: none;
          animation: ringOut 1.2s ease-out infinite;
        }
        .ava-frame {
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid rgba(255,215,0,0.8);
          transition: box-shadow 0.4s ease;
        }
        .ava-frame.idle    { box-shadow: 0 0 18px 4px rgba(0,180,170,0.4), 0 8px 28px rgba(0,0,0,0.3); }
        .ava-frame.talking { animation: glowPulse 0.55s ease-in-out infinite; }
      `}</style>

      {/* Pulsing rings when talking */}
      {isTalking && [0, 0.4, 0.8].map((delay) => (
        <div key={delay} className="ava-ring" style={{ width: 210, height: 210, animationDelay: `${delay}s` }} />
      ))}

      {/* Avatar image */}
      <div className={`ava-frame ${isTalking ? "talking" : "idle"}`} style={{ width: 200, height: 200, zIndex: 1 }}>
        <div className={isTalking ? "ava-talking" : "ava-idle"} style={{ width: "100%", height: "100%" }}>
          <img
            src="/ava-avatar.png"
            alt="Ava"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
          />
        </div>
      </div>

      {/* Speaking label */}
      {isTalking && (
        <div style={{
          marginTop: 12,
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 20,
          padding: "5px 16px",
          fontSize: 12,
          color: "white",
          fontWeight: 600,
          letterSpacing: 0.5,
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
      <div style={{ position:"absolute", top:24, right:64, width:72, height:72, background:"radial-gradient(circle,#FFE566,#FFA500)", borderRadius:"50%", boxShadow:"0 0 52px rgba(255,200,0,0.52)" }} />
      {[0,45,90,135,180,225,270,315].map((deg) => (
        <div key={deg} style={{ position:"absolute", top:58, right:100, width:2, height:27, background:"rgba(255,220,0,0.38)", transformOrigin:"1px 0", transform:`rotate(${deg}deg) translateY(-48px)`, borderRadius:2 }} />
      ))}
      <div style={{ position:"absolute", top:58, left:30, display:"flex", opacity:0.7 }}>
        {[36,52,36].map((s,i) => (
          <div key={i} style={{ width:s, height:s, background:"white", borderRadius:"50%", marginLeft:i>0?-14:0 }} />
        ))}
      </div>
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ position:"absolute", bottom:0, left:0, right:0, width:"100%", height:100 }}>
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
    let full = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body?.getReader();
      const dec    = new TextDecoder();
      if (!reader) throw new Error();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        setMessages((prev) => {
          const c = [...prev];
          c[c.length - 1] = { role: "assistant", content: full };
          return c;
        });
      }
    } catch {
      setMessages((prev) => {
        const c = [...prev];
        c[c.length - 1] = { role: "assistant", content: "Sorry, something went wrong. Please try again." };
        return c;
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div style={{ height:"100vh", background:"linear-gradient(180deg,#87CEEB 0%,#29ABE2 25%,#0086BF 55%,#005F99 80%,#003D66 100%)", display:"flex", flexDirection:"column", alignItems:"center", fontFamily:"'Segoe UI',system-ui,sans-serif", position:"relative", overflow:"hidden" }}>
      <TropicalBackground />

      {/* Header */}
      <div style={{ textAlign:"center", padding:"28px 20px 0", color:"white", position:"relative", zIndex:1 }}>
        <h1 style={{ margin:0, fontSize:34, fontWeight:900, letterSpacing:2, textShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>Ava</h1>
        <p style={{ margin:"4px 0 0", fontSize:13, opacity:0.88 }}>Your Bahamian Culture Guide 🌺</p>
      </div>

      {/* Avatar */}
      <div style={{ position:"relative", zIndex:1, marginTop:18, marginBottom:10 }}>
        <AvaAvatar isTalking={isLoading} />
      </div>

      {/* Messages */}
      <div style={{ width:"100%", maxWidth:660, flex:1, overflowY:"auto", padding:"0 16px 12px", display:"flex", flexDirection:"column", gap:12, position:"relative", zIndex:1 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign:"center", color:"rgba(255,255,255,0.92)", paddingTop:4 }}>
            <p style={{ fontSize:14, marginBottom:14 }}>Ask Ava anything about the Bahamas!</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
              {SUGGESTED.map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  style={{ background:"rgba(255,255,255,0.18)", border:"1px solid rgba(255,255,255,0.4)", color:"white", borderRadius:24, padding:"8px 16px", fontSize:13, cursor:"pointer", backdropFilter:"blur(6px)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background="rgba(255,255,255,0.3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background="rgba(255,255,255,0.18)")}
                >{q}</button>
              ))}
            </div>
          </div>
        ) : messages.map((msg, i) => (
          <div key={i} style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start", alignItems:"flex-end", gap:8 }}>
            {msg.role==="assistant" && (
              <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, overflow:"hidden", border:"2px solid rgba(255,215,0,0.7)" }}>
                <img src="/ava-avatar.png" alt="Ava" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
              </div>
            )}
            <div style={{ maxWidth:"72%", padding:"12px 16px", borderRadius:msg.role==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px", background:msg.role==="user"?"linear-gradient(135deg,#00897B,#005F99)":"rgba(255,255,255,0.93)", color:msg.role==="user"?"white":"#1a1a1a", fontSize:14, lineHeight:1.65, boxShadow:"0 3px 10px rgba(0,0,0,0.18)", whiteSpace:"pre-wrap" }}>
              {msg.content || (isLoading && i===messages.length-1 ? <span style={{ opacity:0.5 }}>▌</span> : null)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} style={{ width:"100%", maxWidth:660, display:"flex", gap:10, padding:"14px 16px", background:"rgba(0,0,0,0.25)", backdropFilter:"blur(12px)", borderTop:"1px solid rgba(255,255,255,0.15)", position:"relative", zIndex:1 }}>
        <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about the Bahamas..." disabled={isLoading}
          style={{ flex:1, padding:"13px 20px", borderRadius:32, border:"none", background:"rgba(255,255,255,0.92)", fontSize:14, outline:"none", color:"#1a1a1a" }} />
        <button type="submit" disabled={!input.trim()||isLoading}
          style={{ padding:"13px 26px", borderRadius:32, border:"none", background:input.trim()&&!isLoading?"linear-gradient(135deg,#FFD700,#FFA500)":"rgba(255,255,255,0.2)", color:input.trim()&&!isLoading?"#1a1a1a":"rgba(255,255,255,0.4)", fontWeight:700, fontSize:14, cursor:input.trim()&&!isLoading?"pointer":"default", whiteSpace:"nowrap" }}>
          Send ➤
        </button>
      </form>
    </div>
  );
}
