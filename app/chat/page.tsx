"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Message  = { role: "user" | "assistant"; content: string };
type AvaState = "idle" | "talking" | "waving" | "thinking" | "happy";
type Reaction = { emoji: string; id: number };

const SUGGESTED = [
  "What is Junkanoo? 🎉",
  "Tell me about Bahamian food 🍽️",
  "Who are famous Bahamians? 🌟",
  "What are the Out Islands? 🏝️",
];
const CLICK_REACTIONS = ["👋🏾","😄","🌺","✨","💛","🌊"];
const IDLE_COMMENTS   = ["Hey there! 😊","Ask me anything!","Did you know… 🌴","I love the Bahamas ❤️","The ocean is calling 🌊"];

/* ─── Markdown renderer ─── */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1] !== undefined) parts.push(<strong key={match.index}>{match[1]}</strong>);
    else parts.push(<em key={match.index}>{match[2]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (line.startsWith("### ")) return <h4 key={i} style={{margin:"8px 0 2px",fontSize:14,fontWeight:700,lineHeight:1.4}}>{renderInline(line.slice(4))}</h4>;
    if (line.startsWith("## "))  return <h3 key={i} style={{margin:"10px 0 3px",fontSize:15,fontWeight:700,lineHeight:1.4}}>{renderInline(line.slice(3))}</h3>;
    if (line.startsWith("# "))   return <h2 key={i} style={{margin:"10px 0 4px",fontSize:16,fontWeight:800,lineHeight:1.4}}>{renderInline(line.slice(2))}</h2>;
    if (line.trim() === "")      return <div key={i} style={{height:6}} />;
    return <p key={i} style={{margin:0,lineHeight:1.65}}>{renderInline(line)}</p>;
  });
}

/* ─── Beach background ─── */
function BeachBackground() {
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", zIndex:0 }}>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, #87CEEB 0%, #B0E0FF 40%, #E8F4FF 65%, #F5DEB3 75%, #F4A460 82%, #DEB887 100%)" }} />
      <div style={{ position:"absolute", top:36, right:120, width:88, height:88, borderRadius:"50%", background:"radial-gradient(circle, #FFF9C4 0%, #FFE066 40%, #FFA500 100%)", boxShadow:"0 0 60px 20px rgba(255,200,0,0.45), 0 0 120px 40px rgba(255,160,0,0.2)" }} />
      {[
        { top:50, left:"8%",  scale:1.0 },
        { top:30, left:"30%", scale:0.75 },
        { top:38, left:"48%", scale:1.1 },
        { top:55, right:"25%", scale:0.85 },
      ].map((c, i) => (
        <div key={i} style={{ position:"absolute", top:c.top, left:(c as any).left, right:(c as any).right, transform:`scale(${c.scale})`, display:"flex", opacity:0.88 }}>
          <div style={{ width:56, height:34, background:"white", borderRadius:"50%", boxShadow:"inset -4px -4px 8px rgba(0,0,0,0.04)" }} />
          <div style={{ width:76, height:44, background:"white", borderRadius:"50%", marginLeft:-20, marginTop:-10 }} />
          <div style={{ width:48, height:30, background:"white", borderRadius:"50%", marginLeft:-16, marginTop:-2 }} />
        </div>
      ))}
      <div style={{ position:"absolute", bottom:"18%", left:0, right:0, height:"22%", background:"linear-gradient(180deg, #1A9BD4 0%, #0077B6 50%, #005F99 100%)", borderRadius:"60% 60% 0 0 / 20% 20% 0 0" }} />
      <div style={{ position:"absolute", bottom:"26%", left:0, right:0, height:10, background:"linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.35) 70%, transparent 100%)", borderRadius:10 }} />
      <div style={{ position:"absolute", bottom:"31%", left:"10%", right:"20%", height:6, background:"rgba(255,255,255,0.2)", borderRadius:10 }} />
      <svg style={{ position:"absolute", bottom:"17%", left:0, right:0, width:"100%", height:60 }} viewBox="0 0 1440 60" preserveAspectRatio="none">
        <path d="M0,30 C180,0 360,55 540,30 C720,5 900,55 1080,30 C1260,5 1380,40 1440,30 L1440,60 L0,60 Z" fill="rgba(255,255,255,0.18)" />
        <path d="M0,40 C200,15 400,55 600,38 C800,20 1000,52 1200,38 C1320,28 1400,45 1440,40 L1440,60 L0,60 Z" fill="rgba(255,255,255,0.12)" />
      </svg>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"20%", background:"linear-gradient(180deg, #F5DEB3 0%, #DEB887 50%, #C8A56A 100%)" }} />
      {[8,16,24,32].map(b => (
        <div key={b} style={{ position:"absolute", bottom:`${b}%`, left:"5%", right:"5%", height:2, background:"rgba(180,140,80,0.25)", borderRadius:4 }} />
      ))}
      <div style={{ position:"absolute", bottom:"18%", left:0, width:160, height:340 }}>
        <div style={{ position:"absolute", bottom:0, left:52, width:22, height:260, background:"linear-gradient(180deg,#6B4226,#8B5E3C)", borderRadius:"12px 8px 4px 4px", transform:"rotate(-5deg)", transformOrigin:"bottom center" }} />
        {[[-45,0],[-20,-15],[10,-18],[38,-10],[58,5],[-65,12]].map(([rot, yt], i) => (
          <div key={i} style={{ position:"absolute", bottom:230, left:54, width:110, height:22, background:"linear-gradient(90deg,#2D6A2D,#4CAF50)", borderRadius:"0 50% 50% 0", transform:`rotate(${rot}deg) translateY(${yt}px)`, transformOrigin:"left center", opacity:0.9 }} />
        ))}
      </div>
      <div style={{ position:"absolute", bottom:"18%", right:-20, width:140, height:300 }}>
        <div style={{ position:"absolute", bottom:0, right:20, width:20, height:220, background:"linear-gradient(180deg,#6B4226,#8B5E3C)", borderRadius:"8px 12px 4px 4px", transform:"rotate(8deg)", transformOrigin:"bottom center" }} />
        {[[-30,0],[-55,8],[-80,18],[10,-12],[35,-6]].map(([rot, yt], i) => (
          <div key={i} style={{ position:"absolute", bottom:200, right:22, width:100, height:20, background:"linear-gradient(270deg,#2D6A2D,#4CAF50)", borderRadius:"50% 0 0 50%", transform:`rotate(${rot}deg) translateY(${yt}px)`, transformOrigin:"right center", opacity:0.9 }} />
        ))}
      </div>
      <div style={{ position:"absolute", bottom:"19%", left:"22%", width:8, height:90, background:"#C0392B", borderRadius:4 }} />
      <div style={{ position:"absolute", bottom:"30%", left:"14%", width:130, height:50, background:"conic-gradient(#E74C3C 0deg 60deg, #F39C12 60deg 120deg, #E74C3C 120deg 180deg, #F39C12 180deg 240deg, #E74C3C 240deg 300deg, #F39C12 300deg 360deg)", borderRadius:"50% 50% 0 0", opacity:0.9 }} />
      {[[160,140],[220,120],[190,155]].map(([x,y], i) => (
        <svg key={i} style={{ position:"absolute", left:x, top:y }} width="24" height="12" viewBox="0 0 24 12">
          <path d="M0,6 Q6,0 12,6 Q18,0 24,6" fill="none" stroke="rgba(60,60,80,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ))}
    </div>
  );
}

/* ─── Ava Avatar ─── */
function AvaAvatar({ avaState, onClickAva }: { avaState: AvaState; onClickAva: () => void }) {
  const imageRef   = useRef<HTMLDivElement>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [bubble, setBubble]       = useState<string | null>(null);
  const reactionId = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!imageRef.current) return;
      const dx = (e.clientX / window.innerWidth  - 0.75) * 2;
      const dy = (e.clientY / window.innerHeight - 0.5)  * 2;
      imageRef.current.style.transform = `perspective(900px) rotateX(${dy * -5}deg) rotateY(${dx * 10}deg)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() < 0.4) {
        setBubble(IDLE_COMMENTS[Math.floor(Math.random() * IDLE_COMMENTS.length)]);
        setTimeout(() => setBubble(null), 2800);
      }
    }, 9000);
    return () => clearInterval(iv);
  }, []);

  const handleClick = () => {
    const emoji = CLICK_REACTIONS[Math.floor(Math.random() * CLICK_REACTIONS.length)];
    const id = reactionId.current++;
    setReactions(p => [...p, { emoji, id }]);
    setTimeout(() => setReactions(p => p.filter(r => r.id !== id)), 1100);
    onClickAva();
  };

  const bodyClass = ({ idle:"ava-idle", talking:"ava-talk", waving:"ava-wave", thinking:"ava-think", happy:"ava-happy" } as Record<AvaState,string>)[avaState];

  return (
    <div style={{ position:"relative", width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end" }}>
      <style>{`
        @keyframes avaIdle  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes avaTalk  { 0%,100%{transform:translateY(0) rotate(0)} 25%{transform:translateY(-10px) rotate(-1deg)} 75%{transform:translateY(-5px) rotate(1deg)} }
        @keyframes avaWave  { 0%,100%{transform:translateY(0) rotate(0)} 25%{transform:translateY(-22px) rotate(-4deg)} 75%{transform:translateY(-22px) rotate(4deg)} }
        @keyframes avaThink { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(5px) rotate(3deg)} }
        @keyframes avaHappy { 0%,100%{transform:translateY(0) scale(1)} 30%{transform:translateY(-28px) scale(1.04)} 60%{transform:translateY(-32px) scale(1.06)} }
        @keyframes glowPulse { 0%,100%{filter:drop-shadow(0 0 18px rgba(0,220,200,0.7)) drop-shadow(0 8px 32px rgba(0,0,0,0.3))} 50%{filter:drop-shadow(0 0 36px rgba(0,230,210,1)) drop-shadow(0 8px 32px rgba(0,0,0,0.3))} }
        @keyframes reactionPop { 0%{transform:scale(.5);opacity:1} 70%{transform:translateY(-52px) scale(1.3);opacity:1} 100%{transform:translateY(-80px);opacity:0} }
        @keyframes bubblePop { 0%{transform:scale(.8);opacity:0} 12%{transform:scale(1.04);opacity:1} 85%{opacity:1} 100%{transform:scale(.9);opacity:0} }
        @keyframes glowRing { 0%{transform:translateX(-50%) scale(1);opacity:.5} 100%{transform:translateX(-50%) scale(1.65);opacity:0} }
        .ava-idle  { animation: avaIdle  3.6s ease-in-out infinite; }
        .ava-talk  { animation: avaTalk  0.46s ease-in-out infinite; }
        .ava-wave  { animation: avaWave  0.55s ease-in-out 4; }
        .ava-think { animation: avaThink 2.1s ease-in-out infinite; }
        .ava-happy { animation: avaHappy 0.5s ease-in-out 4; }
        .ava-glow  { animation: glowPulse 0.6s ease-in-out infinite; }
      `}</style>

      {bubble && (
        <div style={{ position:"absolute", top:24, right:"108%", background:"white", borderRadius:14, padding:"8px 14px", fontSize:13, fontWeight:600, color:"#1a1a1a", whiteSpace:"nowrap", boxShadow:"0 4px 16px rgba(0,0,0,0.18)", animation:"bubblePop 2.8s ease forwards", zIndex:10 }}>
          {bubble}
          <div style={{ position:"absolute", right:-8, top:"50%", transform:"translateY(-50%)", borderWidth:"8px 0 8px 8px", borderStyle:"solid", borderColor:"transparent transparent transparent white" }} />
        </div>
      )}

      {avaState === "talking" && [0,0.42,0.84].map(d => (
        <div key={d} style={{ position:"absolute", bottom:"18%", left:"50%", width:200, height:200, borderRadius:"50%", border:"2px solid rgba(0,210,190,0.55)", pointerEvents:"none", animation:`glowRing 1.3s ease-out ${d}s infinite` }} />
      ))}

      {reactions.map(r => (
        <div key={r.id} style={{ position:"absolute", top:"28%", left:"50%", fontSize:32, pointerEvents:"none", animation:"reactionPop 1.1s ease-out forwards" }}>{r.emoji}</div>
      ))}

      <div
        ref={imageRef}
        className={`${bodyClass} ${avaState === "talking" ? "ava-glow" : ""}`}
        onClick={handleClick}
        style={{ cursor:"pointer", transition:"transform 0.1s ease-out", width:"100%", display:"flex", alignItems:"flex-end", justifyContent:"center", flex:1 }}
      >
        <img
          src="/ava-avatar.png"
          alt="Ava"
          style={{ maxHeight:"78vh", width:"auto", objectFit:"contain", objectPosition:"bottom center", display:"block", pointerEvents:"none", filter:"drop-shadow(0 12px 28px rgba(0,0,0,0.35))" }}
        />
      </div>

      <div style={{ fontSize:11, color:"rgba(80,50,20,0.55)", letterSpacing:0.5, marginBottom:6 }}>
        {avaState === "talking" ? "Ava is speaking ✨" : "click ava · move your mouse"}
      </div>
    </div>
  );
}


/* ─── Main page ─── */
export default function ChatPage() {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avaState, setAvaState]   = useState<AvaState>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  useEffect(() => {
    const IDLES: AvaState[] = ["waving","thinking","happy"];
    const schedule = () => {
      idleTimer.current = setTimeout(() => {
        if (isLoading) { schedule(); return; }
        setAvaState(IDLES[Math.floor(Math.random() * IDLES.length)]);
        setTimeout(() => { setAvaState("idle"); schedule(); }, 2400);
      }, 7000 + Math.random() * 6000);
    };
    schedule();
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, [isLoading]);

  const handleClickAva = useCallback(() => {
    if (avaState === "talking") return;
    setAvaState("waving");
    setTimeout(() => setAvaState("idle"), 2200);
  }, [avaState]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role:"user", content:text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);
    setAvaState("thinking");
    await new Promise(r => setTimeout(r, 500));
    setAvaState("talking");
    setMessages(prev => [...prev, { role:"assistant", content:"" }]);
    let full = "";
    try {
      const res = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ messages:updated }) });
      if (!res.ok) throw new Error();
      const reader = res.body?.getReader(), dec = new TextDecoder();
      if (!reader) throw new Error();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream:true });
        setMessages(prev => { const c=[...prev]; c[c.length-1]={role:"assistant",content:full}; return c; });
      }
    } catch {
      setMessages(prev => { const c=[...prev]; c[c.length-1]={role:"assistant",content:"API error — check that ANTHROPIC_API_KEY is set in Vercel → Settings → Environment Variables."}; return c; });
    } finally {
      setIsLoading(false);
      setAvaState("happy");
      setTimeout(() => setAvaState("idle"), 1800);
      inputRef.current?.focus();
    }
  }

  return (
    <div style={{ height:"100vh", display:"flex", fontFamily:"'Segoe UI',system-ui,sans-serif", position:"relative", overflow:"hidden" }}>
      <BeachBackground />

      {/* LEFT — chat panel */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", position:"relative", zIndex:1, minWidth:0, padding:"20px 0 0 20px" }}>
        <div style={{ background:"rgba(255,255,255,0.22)", backdropFilter:"blur(14px)", borderRadius:20, padding:"16px 22px", marginBottom:12, marginRight:20, border:"1px solid rgba(255,255,255,0.4)", boxShadow:"0 4px 24px rgba(0,0,0,0.08)" }}>
          <h1 style={{ margin:0, fontSize:26, fontWeight:900, letterSpacing:2, color:"#1a4a2e", textShadow:"0 1px 4px rgba(255,255,255,0.6)" }}>Ava</h1>
          <p style={{ margin:"2px 0 0", fontSize:13, color:"#2d5a3d", opacity:0.9 }}>Your Bahamian Culture Guide 🌺</p>
        </div>

        <div style={{ flex:1, overflowY:"auto", background:"rgba(255,255,255,0.18)", backdropFilter:"blur(14px)", borderRadius:20, padding:"14px 18px", marginRight:20, marginBottom:12, border:"1px solid rgba(255,255,255,0.38)", boxShadow:"0 4px 24px rgba(0,0,0,0.06)", display:"flex", flexDirection:"column", gap:11 }}>
          {messages.length === 0 ? (
            <div style={{ paddingTop:6 }}>
              <p style={{ fontSize:14, marginBottom:14, color:"#1a3a26", fontWeight:500 }}>Ask Ava anything about the Bahamas!</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => sendMessage(q)}
                    style={{ background:"rgba(255,255,255,0.55)", border:"1px solid rgba(255,255,255,0.7)", color:"#1a4a2e", borderRadius:24, padding:"8px 16px", fontSize:13, cursor:"pointer", fontWeight:500, backdropFilter:"blur(4px)", boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}
                    onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,0.8)")}
                    onMouseLeave={e => (e.currentTarget.style.background="rgba(255,255,255,0.55)")}
                  >{q}</button>
                ))}
              </div>
            </div>
          ) : messages.map((msg, i) => (
            <div key={i} style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start", alignItems:"flex-end", gap:8 }}>
              {msg.role === "assistant" && (
                <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, overflow:"hidden", border:"2px solid rgba(255,255,255,0.8)", boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>
                  <img src="/ava-avatar.png" alt="Ava" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
                </div>
              )}
              <div style={{ maxWidth:"74%", padding:"11px 16px", borderRadius:msg.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", background:msg.role==="user"?"linear-gradient(135deg,#00897B,#005F99)":"rgba(255,255,255,0.88)", color:msg.role==="user"?"white":"#1a2a1e", fontSize:14, lineHeight:1.65, boxShadow:"0 3px 12px rgba(0,0,0,0.12)", backdropFilter:msg.role==="assistant"?"blur(8px)":"none", border:msg.role==="assistant"?"1px solid rgba(255,255,255,0.6)":"none" }}>
                {msg.role === "assistant"
                  ? (msg.content ? renderMarkdown(msg.content) : (isLoading && i === messages.length-1 ? <span style={{ opacity:0.5 }}>▌</span> : null))
                  : (msg.content || null)}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          style={{ display:"flex", gap:10, padding:"12px 14px", background:"rgba(255,255,255,0.28)", backdropFilter:"blur(14px)", borderRadius:20, marginRight:20, marginBottom:20, border:"1px solid rgba(255,255,255,0.5)", boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}>
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about the Bahamas…" disabled={isLoading}
            style={{ flex:1, padding:"11px 18px", borderRadius:28, border:"1px solid rgba(255,255,255,0.7)", background:"rgba(255,255,255,0.7)", fontSize:14, outline:"none", color:"#1a3a26", backdropFilter:"blur(4px)" }} />
          <button type="submit" disabled={!input.trim() || isLoading}
            style={{ padding:"11px 24px", borderRadius:28, border:"none", background:input.trim()&&!isLoading?"linear-gradient(135deg,#FFD700,#FF8C00)":"rgba(200,200,200,0.5)", color:input.trim()&&!isLoading?"#1a1a1a":"rgba(80,80,80,0.5)", fontWeight:700, fontSize:14, cursor:input.trim()&&!isLoading?"pointer":"default", whiteSpace:"nowrap", boxShadow:input.trim()&&!isLoading?"0 2px 10px rgba(255,160,0,0.4)":"none" }}>
            Send ➤
          </button>
        </form>
      </div>

      {/* RIGHT — Ava 3D */}
      <div style={{ width:"clamp(240px,34%,420px)", display:"flex", alignItems:"stretch", justifyContent:"center", position:"relative", zIndex:2, flexShrink:0 }}>
        <AvaAvatar avaState={avaState} onClickAva={handleClickAva} />
      </div>
    </div>
  );
}
