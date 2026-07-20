"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Message    = { role: "user" | "assistant"; content: string };
type AvaState   = "idle" | "talking" | "waving" | "thinking" | "happy" | "lookAround";
type Reaction   = { emoji: string; id: number };

const SUGGESTED = [
  "What is Junkanoo? 🎉",
  "Tell me about Bahamian food 🍽️",
  "Who are famous Bahamians? 🌟",
  "What are the Out Islands? 🏝️",
];

const CLICK_REACTIONS = ["👋🏾", "😄", "🌺", "✨", "💛", "🌊"];
const IDLE_COMMENTS   = [
  "Hey there! 😊",
  "Ask me anything!",
  "Did you know… 🌴",
  "I love the Bahamas ❤️",
  "The ocean is calling 🌊",
];

// ─── Interactive Ava Avatar ────────────────────────────────────────────────────
function AvaAvatar({
  avaState,
  onClickAva,
}: {
  avaState: AvaState;
  onClickAva: () => void;
}) {
  const wrapRef    = useRef<HTMLDivElement>(null);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [bubble, setBubble] = useState<string | null>(null);
  const reactionId = useRef(0);

  // Mouse-tracking: Ava looks at cursor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / window.innerWidth;
      const dy = (e.clientY - cy) / window.innerHeight;
      setTiltX(dy * -10);   // up/down tilt
      setTiltY(dx * 14);    // left/right tilt
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Random idle speech bubbles
  useEffect(() => {
    const show = () => {
      if (Math.random() < 0.4) {
        setBubble(IDLE_COMMENTS[Math.floor(Math.random() * IDLE_COMMENTS.length)]);
        setTimeout(() => setBubble(null), 2800);
      }
    };
    const id = setInterval(show, 8000);
    return () => clearInterval(id);
  }, []);

  const handleClick = () => {
    const emoji = CLICK_REACTIONS[Math.floor(Math.random() * CLICK_REACTIONS.length)];
    const id = reactionId.current++;
    setReactions((prev) => [...prev, { emoji, id }]);
    setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== id)), 1200);
    onClickAva();
  };

  // CSS class for each state
  const stateClass: Record<AvaState, string> = {
    idle:        "ava-idle",
    talking:     "ava-talking",
    waving:      "ava-waving",
    thinking:    "ava-thinking",
    happy:       "ava-happy",
    lookAround:  "ava-lookAround",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", position:"relative", userSelect:"none" }}>
      <style>{`
        /* ── Idle: gentle breathing sway ── */
        @keyframes idle {
          0%,100% { transform: translateY(0px) rotate(0deg) scaleY(1); }
          30%      { transform: translateY(-6px) rotate(-0.8deg) scaleY(1.01); }
          70%      { transform: translateY(-3px) rotate(0.6deg) scaleY(1.005); }
        }
        /* ── Talking: lean-forward head bob ── */
        @keyframes talking {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          25%      { transform: translateY(-9px) rotate(-1.5deg); }
          50%      { transform: translateY(-4px) rotate(1deg); }
          75%      { transform: translateY(-11px) rotate(-0.8deg); }
        }
        /* ── Waving: full-body tilt + bounce ── */
        @keyframes waving {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          20%      { transform: translateY(-18px) rotate(-6deg); }
          40%      { transform: translateY(-22px) rotate(5deg); }
          60%      { transform: translateY(-14px) rotate(-4deg); }
          80%      { transform: translateY(-8px) rotate(2deg); }
        }
        /* ── Thinking: lean back + head tilt ── */
        @keyframes thinking {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(4px) rotate(3deg); }
        }
        /* ── Happy: bounce + wiggle ── */
        @keyframes happy {
          0%,100% { transform: translateY(0px) rotate(0deg) scale(1); }
          20%      { transform: translateY(-24px) rotate(-3deg) scale(1.04); }
          40%      { transform: translateY(-30px) rotate(3deg) scale(1.06); }
          60%      { transform: translateY(-18px) rotate(-2deg) scale(1.03); }
          80%      { transform: translateY(-8px) rotate(1deg) scale(1.01); }
        }
        /* ── Look around: head turns ── */
        @keyframes lookAround {
          0%,100% { transform: rotateY(0deg) translateY(0px); }
          25%      { transform: rotateY(-22deg) translateY(-4px); }
          75%      { transform: rotateY(18deg) translateY(-2px); }
        }
        /* ── Plumbob float ── */
        @keyframes plumbob {
          0%,100% { transform: translateX(-50%) translateY(0px) rotate(45deg); }
          50%      { transform: translateX(-50%) translateY(-8px) rotate(45deg); }
        }
        /* ── Reaction emoji pop ── */
        @keyframes reactionPop {
          0%   { transform: translateY(0) scale(0.5); opacity: 1; }
          60%  { transform: translateY(-50px) scale(1.3); opacity: 1; }
          100% { transform: translateY(-80px) scale(1); opacity: 0; }
        }
        /* ── Speech bubble ── */
        @keyframes bubblePop {
          0%   { transform: scale(0.8); opacity: 0; }
          15%  { transform: scale(1.05); opacity: 1; }
          85%  { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0; }
        }
        /* ── Glow pulse when talking ── */
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 18px 5px rgba(0,200,180,0.45), 0 0 50px 14px rgba(0,155,119,0.25); }
          50%      { box-shadow: 0 0 32px 12px rgba(0,220,200,0.75), 0 0 80px 28px rgba(0,155,119,0.45); }
        }
        @keyframes ringOut {
          0%   { transform: translateX(-50%) scale(1);   opacity: 0.55; }
          100% { transform: translateX(-50%) scale(1.65); opacity: 0; }
        }

        .ava-idle       { animation: idle       3.6s ease-in-out infinite; }
        .ava-talking    { animation: talking    0.45s ease-in-out infinite; }
        .ava-waving     { animation: waving     0.55s ease-in-out 3; }
        .ava-thinking   { animation: thinking   2.2s ease-in-out infinite; }
        .ava-happy      { animation: happy      0.5s ease-in-out 3; }
        .ava-lookAround { animation: lookAround 2.8s ease-in-out 1; }

        .ava-frame {
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid rgba(255,215,0,0.82);
          cursor: pointer;
          transition: box-shadow 0.4s ease;
        }
        .ava-frame:hover { border-color: rgba(255,215,0,1); }
        .ava-frame.talking { animation: glowPulse 0.55s ease-in-out infinite; }
        .ava-frame.idle    { box-shadow: 0 0 18px 4px rgba(0,180,170,0.4), 0 8px 26px rgba(0,0,0,0.28); }

        .plumbob {
          position: absolute;
          top: -44px; left: 50%;
          width: 22px; height: 22px;
          background: linear-gradient(135deg,#00e6b4,#00c49a);
          animation: plumbob 2.6s ease-in-out infinite;
          box-shadow: 0 0 12px rgba(0,230,180,0.7);
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
        }
        .ava-ring {
          position: absolute; top: 0; left: 50%;
          border-radius: 50%;
          border: 2.5px solid rgba(0,210,190,0.5);
          pointer-events: none;
          animation: ringOut 1.3s ease-out infinite;
        }
        .reaction {
          position: absolute; bottom: 60%; left: 50%;
          font-size: 28px;
          pointer-events: none;
          animation: reactionPop 1.1s ease-out forwards;
        }
        .speech-bubble {
          position: absolute;
          bottom: 108%;
          left: 50%; transform: translateX(-50%);
          background: rgba(255,255,255,0.95);
          border-radius: 18px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          animation: bubblePop 2.8s ease forwards;
          pointer-events: none;
          z-index: 10;
        }
        .speech-bubble::after {
          content: "";
          position: absolute;
          bottom: -8px; left: 50%; transform: translateX(-50%);
          border: 8px solid transparent;
          border-top: 8px solid rgba(255,255,255,0.95);
          border-bottom: none;
        }
      `}</style>

      {/* Plumbob */}
      <div className="plumbob" />

      {/* Speech bubble */}
      {bubble && <div className="speech-bubble">{bubble}</div>}

      {/* Talking rings */}
      {avaState === "talking" && [0, 0.42, 0.84].map((d) => (
        <div key={d} className="ava-ring" style={{ width:218, height:218, animationDelay:`${d}s` }} />
      ))}

      {/* Reaction emojis */}
      {reactions.map((r) => (
        <div key={r.id} className="reaction">{r.emoji}</div>
      ))}

      {/* Main avatar with perspective look-at-cursor */}
      <div
        ref={wrapRef}
        style={{
          perspective: "800px",
          zIndex: 1,
        }}
      >
        <div
          style={{
            transform: `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
            transition: "transform 0.12s ease-out",
          }}
        >
          <div
            className={`ava-frame ${avaState === "talking" ? "talking" : "idle"}`}
            style={{ width:210, height:210 }}
            onClick={handleClick}
            title="Click me!"
          >
            <div className={stateClass[avaState]} style={{ width:"100%", height:"100%", transformOrigin:"center bottom" }}>
              <img
                src="/ava-avatar.png"
                alt="Ava"
                style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top center", display:"block", pointerEvents:"none" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Click hint (shown briefly on load) */}
      <div style={{ marginTop:8, fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:0.5 }}>
        click ava · move your mouse
      </div>

      {/* Speaking label */}
      {avaState === "talking" && (
        <div style={{ marginTop:6, background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:20, padding:"4px 14px", fontSize:12, color:"white", fontWeight:600, letterSpacing:0.5 }}>
          Ava is speaking ✨
        </div>
      )}
    </div>
  );
}

// ─── Tropical Background ───────────────────────────────────────────────────────
function TropicalBackground() {
  return (
    <>
      <div style={{ position:"absolute", top:24, right:64, width:72, height:72, background:"radial-gradient(circle,#FFE566,#FFA500)", borderRadius:"50%", boxShadow:"0 0 52px rgba(255,200,0,0.52)" }} />
      {[0,45,90,135,180,225,270,315].map((deg) => (
        <div key={deg} style={{ position:"absolute", top:58, right:100, width:2, height:27, background:"rgba(255,220,0,0.38)", transformOrigin:"1px 0", transform:`rotate(${deg}deg) translateY(-48px)`, borderRadius:2 }} />
      ))}
      <div style={{ position:"absolute", top:58, left:30, display:"flex", opacity:0.72 }}>
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avaState, setAvaState]   = useState<AvaState>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  // Random Sims-like idle behaviour
  useEffect(() => {
    const IDLE_STATES: AvaState[]  = ["waving","thinking","happy","lookAround"];
    const IDLE_DELAYS = [5000, 8000, 6000, 10000];

    const scheduleIdle = () => {
      const wait = 6000 + Math.random() * 6000;
      idleTimer.current = setTimeout(() => {
        if (isLoading) { scheduleIdle(); return; }
        const pick = IDLE_STATES[Math.floor(Math.random() * IDLE_STATES.length)];
        setAvaState(pick);
        setTimeout(() => { setAvaState("idle"); scheduleIdle(); }, 2200);
      }, wait);
    };

    scheduleIdle();
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, [isLoading]);

  const handleClickAva = useCallback(() => {
    if (avaState === "talking") return;
    setAvaState("waving");
    setTimeout(() => setAvaState("idle"), 1800);
  }, [avaState]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = { role:"user", content:text };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setIsLoading(true);
    setAvaState("thinking");

    // Short thinking pause before talking
    await new Promise((r) => setTimeout(r, 600));
    setAvaState("talking");

    setMessages((prev) => [...prev, { role:"assistant", content:"" }]);
    let full = "";
    try {
      const res = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages: updated }),
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
      }
    } catch {
      setMessages((prev) => {
        const c = [...prev];
        c[c.length-1] = { role:"assistant", content:"Sorry, something went wrong. Please try again." };
        return c;
      });
    } finally {
      setIsLoading(false);
      // Happy reaction on finish, then back to idle
      setAvaState("happy");
      setTimeout(() => setAvaState("idle"), 1600);
      inputRef.current?.focus();
    }
  }

  return (
    <div style={{ height:"100vh", background:"linear-gradient(180deg,#87CEEB 0%,#29ABE2 25%,#0086BF 55%,#005F99 80%,#003D66 100%)", display:"flex", flexDirection:"column", alignItems:"center", fontFamily:"'Segoe UI',system-ui,sans-serif", position:"relative", overflow:"hidden" }}>
      <TropicalBackground />

      {/* Header */}
      <div style={{ textAlign:"center", padding:"24px 20px 0", color:"white", position:"relative", zIndex:1 }}>
        <h1 style={{ margin:0, fontSize:32, fontWeight:900, letterSpacing:2, textShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>Ava</h1>
        <p style={{ margin:"3px 0 0", fontSize:13, opacity:0.88 }}>Your Bahamian Culture Guide 🌺</p>
      </div>

      {/* Interactive Avatar */}
      <div style={{ position:"relative", zIndex:1, marginTop:28, marginBottom:8 }}>
        <AvaAvatar avaState={avaState} onClickAva={handleClickAva} />
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
