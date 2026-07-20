"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import AvatarViewer from "../../components/AvatarViewer";

type Message    = { role: "user" | "assistant"; content: string };
type Expression = "idle" | "happy" | "thinking";
type AppState   = "setup" | "chat";

// Fallback avatar (used until user creates their own)
const DEFAULT_AVATAR = "https://models.readyplayer.me/6460d7b1ff67ebee73b01d2a.glb";
// RPM demo iframe URL
const RPM_IFRAME_URL = "https://demo.readyplayer.me/avatar?frameApi&clearColor=87CEEB";

const SUGGESTED = [
  "What is Junkanoo? 🎉",
  "Tell me about Bahamian food 🍽️",
  "Who are famous Bahamians? 🌟",
  "What are the Out Islands? 🏝️",
];

function detectExpression(text: string): Expression {
  const l = text.toLowerCase();
  if (/wonderful|love|amazing|beautiful|joy|celebrat|excit|great|happy|delicious/.test(l)) return "happy";
  if (/interesting|consider|think|actually|well,|hmm|complex|depends/.test(l))              return "thinking";
  return "idle";
}

// ── Avatar Creator Modal (RPM iframe) ─────────────────────────────────────────
function AvatarCreator({ onDone }: { onDone: (url: string) => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (typeof event.data !== "string") return;
      try {
        const data = JSON.parse(event.data);
        // RPM sends the avatar GLB URL when user finishes
        if (data?.source === "readyplayerme" && data?.eventName === "v1.avatar.exported") {
          const url: string = data.data?.url;
          if (url) onDone(url);
        }
      } catch { /* ignore non-JSON messages */ }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.85)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: "min(96vw, 600px)", background: "#111", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#009B77,#005F99)", padding: "14px 20px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Create Your 3D Avatar</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              Customize, then click <strong>Done</strong> inside the creator
            </div>
          </div>
          <button
            onClick={() => onDone(DEFAULT_AVATAR)}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}
          >
            Skip for now
          </button>
        </div>

        {/* RPM iframe */}
        <iframe
          ref={iframeRef}
          src={RPM_IFRAME_URL}
          style={{ width: "100%", height: 520, border: "none", display: "block" }}
          allow="camera *; microphone *"
          title="Ready Player Me Avatar Creator"
        />
      </div>
    </div>
  );
}

// ── Background ────────────────────────────────────────────────────────────────
function TropicalBackground() {
  return (
    <>
      <div style={{ position:"absolute", top:24, right:64, width:70, height:70, background:"radial-gradient(circle,#FFE566,#FFA500)", borderRadius:"50%", boxShadow:"0 0 50px rgba(255,200,0,0.5)" }} />
      {[0,45,90,135,180,225,270,315].map((deg) => (
        <div key={deg} style={{ position:"absolute", top:56, right:99, width:2, height:26, background:"rgba(255,220,0,0.4)", transformOrigin:"1px 0", transform:`rotate(${deg}deg) translateY(-46px)`, borderRadius:2 }} />
      ))}
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ position:"absolute", bottom:0, left:0, right:0, width:"100%", height:100 }}>
        <path d="M0,50 C240,90 480,10 720,50 C960,90 1200,10 1440,50 L1440,100 L0,100 Z" fill="rgba(0,77,122,0.45)" />
        <path d="M0,70 C360,30 720,90 1080,50 C1260,30 1380,70 1440,70 L1440,100 L0,100 Z" fill="rgba(0,50,90,0.35)" />
      </svg>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [appState, setAppState]     = useState<AppState>("setup");
  const [avatarUrl, setAvatarUrl]   = useState(DEFAULT_AVATAR);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const [expression, setExpression] = useState<Expression>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const handleAvatarDone = useCallback((url: string) => {
    setAvatarUrl(url);
    setAppState("chat");
  }, []);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = { role:"user", content:text };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setIsLoading(true);
    setExpression("thinking");
    setMessages((prev) => [...prev, { role:"assistant", content:"" }]);

    let full = "";
    try {
      const res = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ messages:updated }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body?.getReader();
      const dec    = new TextDecoder();
      if (!reader) throw new Error();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream:true });
        setMessages((prev) => {
          const c = [...prev];
          c[c.length-1] = { role:"assistant", content:full };
          return c;
        });
        setExpression(detectExpression(full));
      }
    } catch {
      setMessages((prev) => {
        const c = [...prev];
        c[c.length-1] = { role:"assistant", content:"Sorry, something went wrong. Please try again." };
        return c;
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setExpression("idle"), 2000);
      inputRef.current?.focus();
    }
  }

  return (
    <div style={{ height:"100vh", background:"linear-gradient(180deg,#87CEEB 0%,#29ABE2 25%,#0086BF 55%,#005F99 80%,#003D66 100%)", display:"flex", flexDirection:"column", alignItems:"center", fontFamily:"'Segoe UI',system-ui,sans-serif", position:"relative", overflow:"hidden" }}>
      <TropicalBackground />

      {/* Avatar Creator Modal */}
      {appState === "setup" && <AvatarCreator onDone={handleAvatarDone} />}

      {/* Header */}
      <div style={{ textAlign:"center", padding:"16px 20px 0", color:"white", position:"relative", zIndex:1 }}>
        <h1 style={{ margin:0, fontSize:30, fontWeight:900, letterSpacing:2, textShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>Ava</h1>
        <p style={{ margin:"3px 0 0", fontSize:12, opacity:0.88 }}>Your Bahamian Culture Guide 🌺</p>
      </div>

      {/* 3D Avatar */}
      <div style={{ width:"100%", maxWidth:420, height:320, position:"relative", zIndex:1, flexShrink:0 }}>
        <AvatarViewer avatarUrl={avatarUrl} isTalking={isLoading} expression={expression} />
        {isLoading && (
          <div style={{ position:"absolute", bottom:12, left:"50%", transform:"translateX(-50%)", background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:20, padding:"4px 14px", fontSize:12, color:"white", fontWeight:600, whiteSpace:"nowrap" }}>
            Ava is speaking ✨
          </div>
        )}
        <button
          onClick={() => setAppState("setup")}
          title="Change avatar"
          style={{ position:"absolute", top:8, right:8, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", color:"white", borderRadius:16, padding:"4px 10px", fontSize:11, cursor:"pointer", backdropFilter:"blur(6px)" }}
        >
          ✏️ Change avatar
        </button>
        <div style={{ position:"absolute", bottom:4, right:8, fontSize:10, color:"rgba(255,255,255,0.35)" }}>drag to rotate</div>
      </div>

      {/* Messages */}
      <div style={{ width:"100%", maxWidth:660, flex:1, overflowY:"auto", padding:"0 16px 12px", display:"flex", flexDirection:"column", gap:10, position:"relative", zIndex:1 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign:"center", color:"rgba(255,255,255,0.92)" }}>
            <p style={{ fontSize:14, marginBottom:12 }}>Ask Ava anything about the Bahamas!</p>
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
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start", alignItems:"flex-end", gap:8 }}>
              {msg.role==="assistant" && (
                <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0, overflow:"hidden", border:"2px solid rgba(255,215,0,0.6)" }}>
                  <img src="/ava-avatar.png" alt="Ava" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
                </div>
              )}
              <div style={{ maxWidth:"72%", padding:"11px 15px", borderRadius:msg.role==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px", background:msg.role==="user"?"linear-gradient(135deg,#00897B,#005F99)":"rgba(255,255,255,0.93)", color:msg.role==="user"?"white":"#1a1a1a", fontSize:14, lineHeight:1.6, boxShadow:"0 3px 10px rgba(0,0,0,0.18)", whiteSpace:"pre-wrap" }}>
                {msg.content || (isLoading && i===messages.length-1 ? <span style={{ opacity:0.5 }}>▌</span> : null)}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} style={{ width:"100%", maxWidth:660, display:"flex", gap:10, padding:"12px 16px", background:"rgba(0,0,0,0.25)", backdropFilter:"blur(12px)", borderTop:"1px solid rgba(255,255,255,0.15)", position:"relative", zIndex:1 }}>
        <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about the Bahamas..." disabled={isLoading}
          style={{ flex:1, padding:"12px 18px", borderRadius:32, border:"none", background:"rgba(255,255,255,0.92)", fontSize:14, outline:"none", color:"#1a1a1a" }} />
        <button type="submit" disabled={!input.trim()||isLoading}
          style={{ padding:"12px 24px", borderRadius:32, border:"none", background:input.trim()&&!isLoading?"linear-gradient(135deg,#FFD700,#FFA500)":"rgba(255,255,255,0.2)", color:input.trim()&&!isLoading?"#1a1a1a":"rgba(255,255,255,0.4)", fontWeight:700, fontSize:14, cursor:input.trim()&&!isLoading?"pointer":"default", whiteSpace:"nowrap" }}>
          Send ➤
        </button>
      </form>
    </div>
  );
}
