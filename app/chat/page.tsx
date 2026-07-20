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

// ─── SVG Ava Character ────────────────────────────────────────────────────────
function AvaSVG({ avaState, onClickAva }: { avaState: AvaState; onClickAva: () => void }) {
  const svgRef       = useRef<SVGSVGElement>(null);
  const headRef      = useRef<SVGGElement>(null);
  const lPupilRef    = useRef<SVGCircleElement>(null);
  const rPupilRef    = useRef<SVGCircleElement>(null);
  const lEyeLidRef   = useRef<SVGEllipseElement>(null);
  const rEyeLidRef   = useRef<SVGEllipseElement>(null);

  const [mouthOpen,  setMouthOpen]  = useState(false);
  const [reactions,  setReactions]  = useState<Reaction[]>([]);
  const [bubble,     setBubble]     = useState<string | null>(null);
  const reactionId = useRef(0);

  // ── Eye / head cursor tracking (direct DOM, no re-render) ──
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const r  = svgRef.current.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  * 0.5)) / window.innerWidth;
      const dy = (e.clientY - (r.top  + r.height * 0.35)) / window.innerHeight;
      const rx = dy * -9, ry = dx * 13;

      if (headRef.current)
        headRef.current.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)`;

      const px = (dx * 4).toFixed(2), py = (dy * 4).toFixed(2);
      lPupilRef.current?.setAttribute("cx", px);
      lPupilRef.current?.setAttribute("cy", py);
      rPupilRef.current?.setAttribute("cx", px);
      rPupilRef.current?.setAttribute("cy", py);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ── Blinking ──
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const blink = () => {
      [lEyeLidRef, rEyeLidRef].forEach(ref => {
        if (ref.current) { ref.current.style.transform="scaleY(1)"; ref.current.style.transition="transform 0.07s"; }
      });
      setTimeout(() => {
        [lEyeLidRef, rEyeLidRef].forEach(ref => {
          if (ref.current) { ref.current.style.transform="scaleY(0)"; ref.current.style.transition="transform 0.07s"; }
        });
      }, 130);
      t = setTimeout(blink, 2800 + Math.random() * 3500);
    };
    t = setTimeout(blink, 1800);
    return () => clearTimeout(t);
  }, []);

  // ── Talking mouth ──
  useEffect(() => {
    if (avaState !== "talking") { setMouthOpen(false); return; }
    const iv = setInterval(() => setMouthOpen(p => !p), 190);
    return () => clearInterval(iv);
  }, [avaState]);

  // ── Idle speech bubbles ──
  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() < 0.38) {
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

  // ── Per-state animation styles ──
  const bodyAnim = {
    idle:       "ava-body-idle",
    talking:    "ava-body-talk",
    waving:     "ava-body-idle",
    thinking:   "ava-body-think",
    happy:      "ava-body-happy",
    lookAround: "ava-body-idle",
  }[avaState];

  const rArmAnim = avaState === "waving" ? "ava-rarm-wave" :
                   avaState === "happy"   ? "ava-rarm-wave" : "";
  const lArmAnim = avaState === "happy"  ? "ava-larm-wave" : "";
  const hairAnim = avaState === "waving" || avaState === "happy" ? "ava-hair-swing" : "ava-hair-sway";

  return (
    <div style={{ position:"relative", display:"flex", flexDirection:"column", alignItems:"center" }}>
      <style>{`
        @keyframes bodyIdle  { 0%,100%{transform:translateY(0) scaleY(1)} 50%{transform:translateY(-5px) scaleY(1.008)} }
        @keyframes bodyTalk  { 0%,100%{transform:translateY(0) rotate(0deg)} 30%{transform:translateY(-8px) rotate(-1.2deg)} 70%{transform:translateY(-5px) rotate(0.8deg)} }
        @keyframes bodyThink { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(3px) rotate(2.5deg)} }
        @keyframes bodyHappy { 0%,100%{transform:translateY(0) scale(1)} 25%{transform:translateY(-22px) scale(1.04)} 50%{transform:translateY(-28px) scale(1.06)} 75%{transform:translateY(-14px) scale(1.02)} }
        @keyframes rArmWave  { 0%,100%{transform:rotate(0deg)} 20%{transform:rotate(-55deg)} 40%{transform:rotate(-30deg)} 60%{transform:rotate(-60deg)} 80%{transform:rotate(-35deg)} }
        @keyframes lArmWave  { 0%,100%{transform:rotate(0deg)} 30%{transform:rotate(40deg)} 70%{transform:rotate(20deg)} }
        @keyframes hairSway  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(1.5deg)} }
        @keyframes hairSwing { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-4deg)} 75%{transform:rotate(5deg)} }
        @keyframes plumbob   { 0%,100%{transform:translateX(-50%) translateY(0) rotate(45deg)} 50%{transform:translateX(-50%) translateY(-7px) rotate(45deg)} }
        @keyframes reactionPop { 0%{transform:translateX(-50%) translateY(0) scale(.5);opacity:1} 70%{transform:translateX(-50%) translateY(-52px) scale(1.3);opacity:1} 100%{transform:translateX(-50%) translateY(-80px) scale(1);opacity:0} }
        @keyframes bubblePop { 0%{transform:translateX(-50%) scale(.8);opacity:0} 12%{transform:translateX(-50%) scale(1.04);opacity:1} 85%{transform:translateX(-50%) scale(1);opacity:1} 100%{transform:translateX(-50%) scale(.9);opacity:0} }
        @keyframes glowRing  { 0%{transform:translateX(-50%) scale(1);opacity:.55} 100%{transform:translateX(-50%) scale(1.7);opacity:0} }

        .ava-body-idle  { animation: bodyIdle  3.4s ease-in-out infinite; }
        .ava-body-talk  { animation: bodyTalk  0.46s ease-in-out infinite; }
        .ava-body-think { animation: bodyThink 2.1s ease-in-out infinite; }
        .ava-body-happy { animation: bodyHappy 0.52s ease-in-out 4; }
        .ava-rarm-wave  { animation: rArmWave  0.5s ease-in-out 4; transform-origin: 8px 10px; }
        .ava-larm-wave  { animation: lArmWave  0.5s ease-in-out 4; transform-origin: 52px 10px; }
        .ava-hair-sway  { animation: hairSway  3.8s ease-in-out infinite; transform-origin: center top; }
        .ava-hair-swing { animation: hairSwing 0.5s ease-in-out 4; transform-origin: center top; }
      `}</style>

      {/* Plumbob 💎 */}
      <div style={{ position:"absolute", top:-48, left:"50%", width:20, height:20, background:"linear-gradient(135deg,#00e6b4,#00c49a)", clipPath:"polygon(50% 0%,100% 50%,50% 100%,0% 50%)", animation:"plumbob 2.8s ease-in-out infinite", boxShadow:"0 0 10px rgba(0,230,180,0.7)" }} />

      {/* Speech bubble */}
      {bubble && (
        <div style={{ position:"absolute", bottom:"105%", left:"50%", background:"white", borderRadius:16, padding:"7px 14px", fontSize:13, fontWeight:600, color:"#1a1a1a", whiteSpace:"nowrap", boxShadow:"0 4px 16px rgba(0,0,0,0.18)", animation:"bubblePop 2.8s ease forwards", pointerEvents:"none", zIndex:10 }}>
          {bubble}
          <div style={{ position:"absolute", bottom:-8, left:"50%", transform:"translateX(-50%)", borderWidth:"8px 8px 0", borderStyle:"solid", borderColor:"white transparent transparent" }} />
        </div>
      )}

      {/* Talking glow rings */}
      {avaState === "talking" && [0, 0.4, 0.8].map(d => (
        <div key={d} style={{ position:"absolute", top:10, left:"50%", width:224, height:224, borderRadius:"50%", border:"2.5px solid rgba(0,210,190,0.5)", animation:`glowRing 1.3s ease-out ${d}s infinite`, pointerEvents:"none" }} />
      ))}

      {/* Reaction emojis */}
      {reactions.map(r => (
        <div key={r.id} style={{ position:"absolute", top:"40%", left:"50%", fontSize:28, pointerEvents:"none", animation:"reactionPop 1.1s ease-out forwards" }}>{r.emoji}</div>
      ))}

      {/* ── The SVG Character ── */}
      <svg
        ref={svgRef}
        viewBox="0 0 280 420"
        width={240}
        height={360}
        style={{ cursor:"pointer", display:"block" }}
        onClick={handleClick}
      >
        <defs>
          {/* Clip to circle for avatar portrait */}
          <clipPath id="portraitClip">
            <circle cx="140" cy="160" r="120" />
          </clipPath>
        </defs>

        {/* ── Gold border ring ── */}
        <circle cx="140" cy="160" r="122" fill="none" stroke="rgba(255,215,0,0.85)" strokeWidth="5"
          style={{ filter:"drop-shadow(0 0 10px rgba(255,215,0,0.5))" }} />
        {avaState==="talking" && (
          <circle cx="140" cy="160" r="128" fill="none" stroke="rgba(0,210,190,0.4)" strokeWidth="3"
            style={{ filter:"drop-shadow(0 0 14px rgba(0,220,200,0.7))" }} />
        )}

        <g clipPath="url(#portraitClip)">
          {/* ── Background (tropical gradient inside circle) ── */}
          <radialGradient id="bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="100%" stopColor="#29ABE2" />
          </radialGradient>
          <circle cx="140" cy="160" r="120" fill="url(#bg)" />

          {/* ── Body / Dress ── */}
          <g className={bodyAnim}>

            {/* Dress body */}
            <g transform="translate(140,320)">
              {/* Skirt flare */}
              <path d="M -90,-60 Q -110,20 -100,100 L 100,100 Q 110,20 90,-60 Z" fill="#009B77" />
              {/* Bodice */}
              <rect x="-50" y="-120" width="100" height="65" rx="8" fill="#00897B" />
              {/* Dress gold trim top */}
              <rect x="-55" y="-125" width="110" height="10" rx="4" fill="#FFD700" opacity="0.9" />
              {/* Checkerboard trim top */}
              {Array.from({length:11}).map((_,i) => (
                <rect key={i} x={-55+i*10} y="-125" width="10" height="10" fill={i%2===0?"#009B77":"white"} opacity="0.7" />
              ))}
              {/* Shield crest on dress */}
              <path d="M -20,-80 L 20,-80 L 20,-40 Q 0,-25 -20,-40 Z" fill="rgba(255,255,255,0.25)" stroke="#FFD700" strokeWidth="1.5" />
              <text x="0" y="-62" textAnchor="middle" fontSize="16" fill="#FFD700">⚓</text>
              {/* Waist sash */}
              <rect x="-52" y="-58" width="104" height="12" rx="3" fill="#007A6A" />
              {/* Dress bottom gold trim */}
              {Array.from({length:11}).map((_,i) => (
                <rect key={i} x={-100+i*19} y="88" width="19" height="12" fill={i%2===0?"#009B77":"white"} opacity="0.8" />
              ))}
              <rect x="-100" y="86" width="200" height="3" fill="#FFD700" opacity="0.9" />
            </g>

            {/* Neck */}
            <rect x="126" y="218" width="28" height="36" rx="8" fill="#C68642" />

            {/* Left arm (relaxed down) */}
            <g className={lArmAnim} transform="translate(82, 242)">
              <path d="M 0,0 Q -22,30 -18,75" stroke="#C68642" strokeWidth="24" fill="none" strokeLinecap="round" />
              {/* Hand */}
              <ellipse cx="-17" cy="88" rx="13" ry="10" fill="#C68642" />
            </g>

            {/* Right arm (waving) */}
            <g className={rArmAnim} transform="translate(198, 242)">
              <path d="M 0,0 Q 22,30 18,75" stroke="#C68642" strokeWidth="24" fill="none" strokeLinecap="round" />
              {/* Hand */}
              <ellipse cx="17" cy="88" rx="13" ry="10" fill="#C68642" />
            </g>

            {/* ── Head group (tracks cursor via JS) ── */}
            <g ref={headRef} style={{ transformOrigin:"140px 170px", transition:"transform 0.1s ease-out" }}>

              {/* Back hair */}
              <g className={hairAnim}>
                <ellipse cx="140" cy="118" rx="74" ry="85" fill="#1A0F0A" />
                {/* Flowing braids left */}
                <path d="M 72,130 Q 55,170 58,220" stroke="#2C1A10" strokeWidth="14" fill="none" strokeLinecap="round" />
                <path d="M 80,140 Q 60,185 65,235" stroke="#1A0F0A" strokeWidth="11" fill="none" strokeLinecap="round" />
                {/* Flowing braids right */}
                <path d="M 208,130 Q 225,170 222,220" stroke="#2C1A10" strokeWidth="14" fill="none" strokeLinecap="round" />
                <path d="M 200,140 Q 220,185 215,235" stroke="#1A0F0A" strokeWidth="11" fill="none" strokeLinecap="round" />
              </g>

              {/* Head */}
              <ellipse cx="140" cy="135" rx="64" ry="72" fill="#C68642" />

              {/* Ears */}
              <ellipse cx="77" cy="134" rx="11" ry="15" fill="#C68642" />
              <ellipse cx="203" cy="134" rx="11" ry="15" fill="#C68642" />
              <ellipse cx="77" cy="134" rx="7" ry="10" fill="#B5712E" />
              <ellipse cx="203" cy="134" rx="7" ry="10" fill="#B5712E" />

              {/* Gold hoop earrings */}
              <circle cx="77" cy="144" r="7" fill="none" stroke="#FFD700" strokeWidth="3" />
              <circle cx="203" cy="144" r="7" fill="none" stroke="#FFD700" strokeWidth="3" />

              {/* Cheek blush */}
              <ellipse cx="104" cy="152" rx="16" ry="9" fill="rgba(210,90,70,0.18)" />
              <ellipse cx="176" cy="152" rx="16" ry="9" fill="rgba(210,90,70,0.18)" />

              {/* ── Left Eye ── */}
              <g transform="translate(115,126)">
                <ellipse cx="0" cy="0" rx="14" ry="15" fill="white" />
                <circle cx="0" cy="0" r="9" fill="#3D2B1F" />
                <circle cx="3" cy="-3" r="3.5" fill="white" />
                {/* Pupil (moves via JS) */}
                <circle ref={lPupilRef} cx="0" cy="0" r="5.5" fill="#0D0806" />
                {/* Upper lash */}
                <path d="M -14,0 Q -10,-16 14,0" fill="#1A0F0A" />
                {/* Eyelid for blink */}
                <ellipse ref={lEyeLidRef} cx="0" cy="-0.5" rx="14" ry="15" fill="#C68642" style={{ transform:"scaleY(0)", transformOrigin:"0px -15px" }} />
              </g>

              {/* ── Right Eye ── */}
              <g transform="translate(165,126)">
                <ellipse cx="0" cy="0" rx="14" ry="15" fill="white" />
                <circle cx="0" cy="0" r="9" fill="#3D2B1F" />
                <circle cx="3" cy="-3" r="3.5" fill="white" />
                <circle ref={rPupilRef} cx="0" cy="0" r="5.5" fill="#0D0806" />
                <path d="M -14,0 Q -10,-16 14,0" fill="#1A0F0A" />
                <ellipse ref={rEyeLidRef} cx="0" cy="-0.5" rx="14" ry="15" fill="#C68642" style={{ transform:"scaleY(0)", transformOrigin:"0px -15px" }} />
              </g>

              {/* Eyebrows */}
              <path d="M 100 108 Q 115 101 130 108" stroke="#1A0F0A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M 150 108 Q 165 101 180 108" stroke="#1A0F0A" strokeWidth="3.5" fill="none" strokeLinecap="round" />

              {/* Nose */}
              <ellipse cx="140" cy="153" rx="5" ry="3.5" fill="#A0652A" />
              <path d="M 133 150 Q 136 158 140 159 Q 144 158 147 150" stroke="#A0652A" strokeWidth="1.5" fill="none" />

              {/* ── Mouth ── */}
              {mouthOpen ? (
                <g>
                  {/* Upper lip */}
                  <path d="M 122,172 Q 131,167 140,169 Q 149,167 158,172" fill="#9B4A2A" />
                  {/* Open mouth */}
                  <path d="M 122,172 Q 140,192 158,172 L 158,176 Q 140,196 122,176 Z" fill="#5C2D1E" />
                  {/* Teeth */}
                  <path d="M 124,172 Q 140,176 156,172 L 156,178 Q 140,182 124,178 Z" fill="white" />
                </g>
              ) : (
                <g>
                  <path d="M 122,172 Q 131,167 140,169 Q 149,167 158,172" fill="#9B4A2A" />
                  <path d="M 122,172 Q 140,184 158,172" stroke="#C1694F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </g>
              )}

              {/* Front / top hair */}
              <g className={hairAnim}>
                {/* Crown braid part */}
                <path d="M 85,80 Q 140,55 195,80" stroke="#1A0F0A" strokeWidth="22" fill="none" strokeLinecap="round" />
                {/* Side part line */}
                <path d="M 140,58 L 140,85" stroke="#2C1A10" strokeWidth="5" />
                {/* Baby hairs / edge */}
                <path d="M 82,100 Q 78,90 85,83" stroke="#1A0F0A" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M 198,100 Q 202,90 195,83" stroke="#1A0F0A" strokeWidth="5" fill="none" strokeLinecap="round" />
                {/* Braid texture lines */}
                {[0,1,2,3,4].map(i => (
                  <path key={i} d={`M ${100+i*12},75 Q ${106+i*12},70 ${112+i*12},75`} stroke="#2C1A10" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                ))}
              </g>

              {/* Hibiscus flower in hair */}
              <g transform="translate(192, 90)">
                {[0,72,144,216,288].map((deg,i) => (
                  <ellipse key={i} cx={8*Math.cos(deg*Math.PI/180)} cy={8*Math.sin(deg*Math.PI/180)} rx="6" ry="3.5" fill="#FF4D8D" transform={`rotate(${deg})`} />
                ))}
                <circle cx="0" cy="0" r="4" fill="#FFD700" />
              </g>
            </g>
            {/* end head */}
          </g>
          {/* end body anim */}
        </g>
        {/* end clip */}
      </svg>

      <div style={{ marginTop:6, fontSize:11, color:"rgba(255,255,255,0.45)", letterSpacing:0.5 }}>
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

  // Random Sims-like idles
  useEffect(()=>{
    const IDLES:AvaState[]=["waving","thinking","happy","lookAround"];
    const schedule=()=>{
      idleTimer.current=setTimeout(()=>{
        if(isLoading){schedule();return;}
        const s=IDLES[Math.floor(Math.random()*IDLES.length)];
        setAvaState(s);
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

      <div style={{position:"relative",zIndex:1,marginTop:24,marginBottom:8}}>
        <AvaSVG avaState={avaState} onClickAva={handleClickAva}/>
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
