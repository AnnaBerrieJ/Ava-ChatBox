"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Message  = { role: "user" | "assistant"; content: string };
type AvaState = "idle" | "talking" | "waving" | "thinking" | "happy" | "lookAround";
type Reaction = { emoji: string; id: number };

const SUGGESTED = [
  "What is Junkanoo? 🎉",
  "Tell me about Bahamian food 🍽️",
  "Who are famous Bahamians? 🌟",
  "What are the Out Islands? 🏝️",
];
const CLICK_REACTIONS = ["👋🏾","😄","🌺","✨","💛","🌊"];
const IDLE_COMMENTS   = ["Hey there! 😊","Ask me anything!","Did you know… 🌴","I love the Bahamas ❤️","The ocean is calling 🌊"];

// ─── Ava Avatar: real photo + SVG overlays for live animation ─────────────────
function AvaAvatar({ avaState, onClickAva }: { avaState: AvaState; onClickAva: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef     = useRef<HTMLDivElement>(null);
  const lPupilRef    = useRef<SVGCircleElement>(null);
  const rPupilRef    = useRef<SVGCircleElement>(null);
  const lLidRef      = useRef<SVGEllipseElement>(null);
  const rLidRef      = useRef<SVGEllipseElement>(null);

  const [mouthOpen,  setMouthOpen]  = useState(false);
  const [reactions,  setReactions]  = useState<Reaction[]>([]);
  const [bubble,     setBubble]     = useState<string | null>(null);
  const reactionId = useRef(0);

  // ── Cursor tracking: head tilt + pupil movement ──
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current || !imageRef.current) return;
      const r  = containerRef.current.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  * 0.5)) / window.innerWidth;
      const dy = (e.clientY - (r.top  + r.height * 0.4)) / window.innerHeight;

      // Whole image tilts toward cursor (3D perspective)
      imageRef.current.style.transform =
        `perspective(700px) rotateX(${dy * -8}deg) rotateY(${dx * 12}deg)`;

      // Pupils shift (max ±4px from base position)
      const px = (dx * 4).toFixed(1);
      const py = (dy * 4).toFixed(1);
      if (lPupilRef.current) {
        lPupilRef.current.setAttribute("cx", String(74 + parseFloat(px)));
        lPupilRef.current.setAttribute("cy", String(83 + parseFloat(py)));
      }
      if (rPupilRef.current) {
        rPupilRef.current.setAttribute("cx", String(138 + parseFloat(px)));
        rPupilRef.current.setAttribute("cy", String(83 + parseFloat(py)));
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ── Blinking ──
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const blink = () => {
      [lLidRef, rLidRef].forEach(ref => {
        if (ref.current) {
          ref.current.style.transition = "transform 0.07s ease-in";
          ref.current.style.transform  = "scaleY(1)";
        }
      });
      setTimeout(() => {
        [lLidRef, rLidRef].forEach(ref => {
          if (ref.current) {
            ref.current.style.transition = "transform 0.09s ease-out";
            ref.current.style.transform  = "scaleY(0)";
          }
        });
      }, 130);
      t = setTimeout(blink, 2600 + Math.random() * 3800);
    };
    t = setTimeout(blink, 1500);
    return () => clearTimeout(t);
  }, []);

  // ── Mouth animation while talking ──
  useEffect(() => {
    if (avaState !== "talking") { setMouthOpen(false); return; }
    const iv = setInterval(() => setMouthOpen(p => !p), 200);
    return () => clearInterval(iv);
  }, [avaState]);

  // ── Random idle speech bubbles ──
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

  // Body animation class based on state
  const bodyClass = {
    idle:       "ava-idle",
    talking:    "ava-talk",
    waving:     "ava-wave",
    thinking:   "ava-think",
    happy:      "ava-happy",
    lookAround: "ava-idle",
  }[avaState];

  const SIZE = 220;

  return (
    <div ref={containerRef} style={{ position:"relative", display:"flex", flexDirection:"column", alignItems:"center" }}>
      <style>{`
        @keyframes avaIdle  { 0%,100%{transform:translateY(0) scaleY(1)} 50%{transform:translateY(-6px) scaleY(1.01)} }
        @keyframes avaTalk  { 0%,100%{transform:translateY(0) rotate(0deg)} 25%{transform:translateY(-9px) rotate(-1.2deg)} 75%{transform:translateY(-5px) rotate(1deg)} }
        @keyframes avaWave  { 0%,100%{transform:translateY(0) rotate(0deg)} 20%{transform:translateY(-20px) rotate(-5deg)} 50%{transform:translateY(-26px) rotate(5deg)} 80%{transform:translateY(-10px) rotate(-3deg)} }
        @keyframes avaThink { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(4px) rotate(3deg)} }
        @keyframes avaHappy { 0%,100%{transform:translateY(0) scale(1)} 25%{transform:translateY(-26px) scale(1.05)} 50%{transform:translateY(-30px) scale(1.07)} 75%{transform:translateY(-14px) scale(1.02)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 18px 5px rgba(0,200,180,0.45),0 0 50px 14px rgba(0,155,119,0.25)} 50%{box-shadow:0 0 32px 12px rgba(0,220,200,0.75),0 0 80px 28px rgba(0,155,119,0.45)} }
        @keyframes ringOut  { 0%{transform:translateX(-50%) scale(1);opacity:.55} 100%{transform:translateX(-50%) scale(1.7);opacity:0} }
        @keyframes plumbob  { 0%,100%{transform:translateX(-50%) translateY(0) rotate(45deg)} 50%{transform:translateX(-50%) translateY(-8px) rotate(45deg)} }
        @keyframes reactionPop { 0%{transform:translateX(-50%) scale(.5);opacity:1} 70%{transform:translateX(-50%) translateY(-52px) scale(1.3);opacity:1} 100%{transform:translateX(-50%) translateY(-80px);opacity:0} }
        @keyframes bubblePop { 0%{transform:translateX(-50%) scale(.8);opacity:0} 12%{transform:translateX(-50%) scale(1.04);opacity:1} 85%{transform:translateX(-50%) scale(1);opacity:1} 100%{transform:translateX(-50%) scale(.9);opacity:0} }

        .ava-idle  { animation: avaIdle  3.6s ease-in-out infinite; }
        .ava-talk  { animation: avaTalk  0.46s ease-in-out infinite; }
        .ava-wave  { animation: avaWave  0.55s ease-in-out 4; }
        .ava-think { animation: avaThink 2.1s ease-in-out infinite; }
        .ava-happy { animation: avaHappy 0.5s ease-in-out 4; }
      `}</style>

      {/* Plumbob */}
      <div style={{ position:"absolute", top:-46, left:"50%", width:20, height:20, background:"linear-gradient(135deg,#00e6b4,#00c49a)", clipPath:"polygon(50% 0%,100% 50%,50% 100%,0% 50%)", animation:"plumbob 2.8s ease-in-out infinite", boxShadow:"0 0 10px rgba(0,230,180,0.7)" }} />

      {/* Speech bubble */}
      {bubble && (
        <div style={{ position:"absolute", bottom:"108%", left:"50%", background:"white", borderRadius:16, padding:"7px 14px", fontSize:13, fontWeight:600, color:"#1a1a1a", whiteSpace:"nowrap", boxShadow:"0 4px 16px rgba(0,0,0,0.18)", animation:"bubblePop 2.8s ease forwards", pointerEvents:"none", zIndex:10 }}>
          {bubble}
          <div style={{ position:"absolute", bottom:-8, left:"50%", transform:"translateX(-50%)", borderWidth:"8px 8px 0", borderStyle:"solid", borderColor:"white transparent transparent" }} />
        </div>
      )}

      {/* Talking rings */}
      {avaState==="talking" && [0,0.42,0.84].map(d=>(
        <div key={d} style={{ position:"absolute", top:0, left:"50%", width:SIZE+10, height:SIZE+10, borderRadius:"50%", border:"2.5px solid rgba(0,210,190,0.5)", pointerEvents:"none", animation:`ringOut 1.3s ease-out ${d}s infinite` }} />
      ))}

      {/* Reaction emojis */}
      {reactions.map(r=>(
        <div key={r.id} style={{ position:"absolute", top:"30%", left:"50%", fontSize:28, pointerEvents:"none", animation:"reactionPop 1.1s ease-out forwards" }}>{r.emoji}</div>
      ))}

      {/* ── Main avatar: photo + SVG overlay ── */}
      <div
        ref={imageRef}
        className={bodyClass}
        style={{ width:SIZE, height:SIZE, borderRadius:"50%", overflow:"hidden", border:`4px solid rgba(255,215,0,0.85)`, cursor:"pointer", position:"relative", zIndex:1, transition:"transform 0.1s ease-out", boxShadow: avaState==="talking" ? undefined : "0 0 18px 4px rgba(0,180,170,0.4),0 8px 26px rgba(0,0,0,0.28)", animation: avaState==="talking" ? "glowPulse 0.55s ease-in-out infinite" : undefined }}
        onClick={handleClick}
      >
        {/* Ava's actual photo */}
        <img
          src="/ava-avatar.png"
          alt="Ava"
          style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top center", display:"block", pointerEvents:"none" }}
        />

        {/* SVG overlay: moving pupils + blinking eyelids + talking mouth */}
        {/* Coordinates tuned to match Ava's face in the image */}
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", pointerEvents:"none" }}
        >
          {/* ── Left pupil (moves with cursor) ── */}
          <circle ref={lPupilRef} cx="74" cy="83" r="5.5" fill="rgba(8,4,2,0.55)" />

          {/* ── Right pupil ── */}
          <circle ref={rPupilRef} cx="138" cy="83" r="5.5" fill="rgba(8,4,2,0.55)" />

          {/* ── Left eyelid (blink) ── */}
          <ellipse
            ref={lLidRef}
            cx="74" cy="83" rx="13" ry="14"
            fill="#BF8040"
            style={{ transform:"scaleY(0)", transformOrigin:"74px 69px" }}
          />
          {/* Left upper lash cover (hides edge of eyelid) */}
          <path d="M 61,76 Q 74,70 87,76" fill="#1A0F0A" opacity="0" />

          {/* ── Right eyelid (blink) ── */}
          <ellipse
            ref={rLidRef}
            cx="138" cy="83" rx="13" ry="14"
            fill="#BF8040"
            style={{ transform:"scaleY(0)", transformOrigin:"138px 69px" }}
          />

          {/* ── Mouth overlay (talking animation) ── */}
          {mouthOpen && (
            <g>
              {/* Dark interior of open mouth */}
              <path
                d="M 97,128 Q 110,142 123,128 L 122,133 Q 110,147 98,133 Z"
                fill="#4A1F10"
                opacity="0.85"
              />
              {/* Teeth */}
              <path
                d="M 99,128 Q 110,133 121,128 L 120,133 Q 110,138 100,133 Z"
                fill="rgba(255,255,255,0.88)"
              />
            </g>
          )}
        </svg>
      </div>

      <div style={{ marginTop:8, fontSize:11, color:"rgba(255,255,255,0.45)", letterSpacing:0.5 }}>
        {avaState==="talking" ? "Ava is speaking ✨" : "click ava · move your mouse"}
      </div>
    </div>
  );
}

// ─── Background ───────────────────────────────────────────────────────────────
function TropicalBackground() {
  return (
    <>
      <div style={{ position:"absolute", top:24, right:64, width:72, height:72, background:"radial-gradient(circle,#FFE566,#FFA500)", borderRadius:"50%", boxShadow:"0 0 52px rgba(255,200,0,0.52)" }} />
      {[0,45,90,135,180,225,270,315].map(deg=>(
        <div key={deg} style={{ position:"absolute", top:58, right:100, width:2, height:27, background:"rgba(255,220,0,0.38)", transformOrigin:"1px 0", transform:`rotate(${deg}deg) translateY(-48px)`, borderRadius:2 }} />
      ))}
      <div style={{ position:"absolute", top:58, left:30, display:"flex", opacity:0.72 }}>
        {[36,52,36].map((s,i)=>(
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages,setMessages]   = useState<Message[]>([]);
  const [input,setInput]         = useState("");
  const [isLoading,setIsLoading] = useState(false);
  const [avaState,setAvaState]   = useState<AvaState>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  useEffect(()=>{
    const IDLES:AvaState[]=["waving","thinking","happy","lookAround"];
    const schedule=()=>{
      idleTimer.current=setTimeout(()=>{
        if(isLoading){schedule();return;}
        setAvaState(IDLES[Math.floor(Math.random()*IDLES.length)]);
        setTimeout(()=>{setAvaState("idle");schedule();},2400);
      },7000+Math.random()*6000);
    };
    schedule();
    return ()=>{ if(idleTimer.current) clearTimeout(idleTimer.current); };
  },[isLoading]);

  const handleClickAva=useCallback(()=>{
    if(avaState==="talking")return;
    setAvaState("waving");
    setTimeout(()=>setAvaState("idle"),2000);
  },[avaState]);

  async function sendMessage(text:string){
    if(!text.trim()||isLoading)return;
    const userMsg:Message={role:"user",content:text};
    const updated=[...messages,userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);
    setAvaState("thinking");
    await new Promise(r=>setTimeout(r,500));
    setAvaState("talking");
    setMessages(prev=>[...prev,{role:"assistant",content:""}]);
    let full="";
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:updated})});
      if(!res.ok)throw new Error();
      const reader=res.body?.getReader(),dec=new TextDecoder();
      if(!reader)throw new Error();
      while(true){
        const{done,value}=await reader.read();
        if(done)break;
        full+=dec.decode(value,{stream:true});
        setMessages(prev=>{const c=[...prev];c[c.length-1]={role:"assistant",content:full};return c;});
      }
    }catch{
      setMessages(prev=>{const c=[...prev];c[c.length-1]={role:"assistant",content:"Sorry, something went wrong."};return c;});
    }finally{
      setIsLoading(false);
      setAvaState("happy");
      setTimeout(()=>setAvaState("idle"),1800);
      inputRef.current?.focus();
    }
  }

  return(
    <div style={{height:"100vh",background:"linear-gradient(180deg,#87CEEB 0%,#29ABE2 25%,#0086BF 55%,#005F99 80%,#003D66 100%)",display:"flex",flexDirection:"column",alignItems:"center",fontFamily:"'Segoe UI',system-ui,sans-serif",position:"relative",overflow:"hidden"}}>
      <TropicalBackground/>
      <div style={{textAlign:"center",padding:"22px 20px 0",color:"white",position:"relative",zIndex:1}}>
        <h1 style={{margin:0,fontSize:32,fontWeight:900,letterSpacing:2,textShadow:"0 2px 12px rgba(0,0,0,0.3)"}}>Ava</h1>
        <p style={{margin:"3px 0 0",fontSize:13,opacity:0.88}}>Your Bahamian Culture Guide 🌺</p>
      </div>
      <div style={{position:"relative",zIndex:1,marginTop:28,marginBottom:8}}>
        <AvaAvatar avaState={avaState} onClickAva={handleClickAva}/>
      </div>
      <div style={{width:"100%",maxWidth:660,flex:1,overflowY:"auto",padding:"0 16px 12px",display:"flex",flexDirection:"column",gap:12,position:"relative",zIndex:1}}>
        {messages.length===0?(
          <div style={{textAlign:"center",color:"rgba(255,255,255,0.92)",paddingTop:4}}>
            <p style={{fontSize:14,marginBottom:14}}>Ask Ava anything about the Bahamas!</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
              {SUGGESTED.map(q=>(
                <button key={q} onClick={()=>sendMessage(q)}
                  style={{background:"rgba(255,255,255,0.18)",border:"1px solid rgba(255,255,255,0.4)",color:"white",borderRadius:24,padding:"8px 16px",fontSize:13,cursor:"pointer",backdropFilter:"blur(6px)"}}
                  onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.3)")}
                  onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,0.18)")}
                >{q}</button>
              ))}
            </div>
          </div>
        ):messages.map((msg,i)=>(
          <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:8}}>
            {msg.role==="assistant"&&(
              <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,overflow:"hidden",border:"2px solid rgba(255,215,0,0.7)"}}>
                <img src="/ava-avatar.png" alt="Ava" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
              </div>
            )}
            <div style={{maxWidth:"72%",padding:"12px 16px",borderRadius:msg.role==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px",background:msg.role==="user"?"linear-gradient(135deg,#00897B,#005F99)":"rgba(255,255,255,0.93)",color:msg.role==="user"?"white":"#1a1a1a",fontSize:14,lineHeight:1.65,boxShadow:"0 3px 10px rgba(0,0,0,0.18)",whiteSpace:"pre-wrap"}}>
              {msg.content||(isLoading&&i===messages.length-1?<span style={{opacity:0.5}}>▌</span>:null)}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <form onSubmit={e=>{e.preventDefault();sendMessage(input);}} style={{width:"100%",maxWidth:660,display:"flex",gap:10,padding:"14px 16px",background:"rgba(0,0,0,0.25)",backdropFilter:"blur(12px)",borderTop:"1px solid rgba(255,255,255,0.15)",position:"relative",zIndex:1}}>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about the Bahamas..." disabled={isLoading}
          style={{flex:1,padding:"13px 20px",borderRadius:32,border:"none",background:"rgba(255,255,255,0.92)",fontSize:14,outline:"none",color:"#1a1a1a"}}/>
        <button type="submit" disabled={!input.trim()||isLoading}
          style={{padding:"13px 26px",borderRadius:32,border:"none",background:input.trim()&&!isLoading?"linear-gradient(135deg,#FFD700,#FFA500)":"rgba(255,255,255,0.2)",color:input.trim()&&!isLoading?"#1a1a1a":"rgba(255,255,255,0.4)",fontWeight:700,fontSize:14,cursor:input.trim()&&!isLoading?"pointer":"default",whiteSpace:"nowrap"}}>
          Send ➤
        </button>
      </form>
    </div>
  );
}
