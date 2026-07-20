"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

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

/* helper — capsule oriented along Z then rotated into place */
function cap(rx: number, ry: number, len: number, mat: THREE.Material) {
  const g = new THREE.CapsuleGeometry(Math.min(rx, ry), len, 8, 18);
  return new THREE.Mesh(g, mat);
}

function AvaAvatar({ avaState, onClickAva }: { avaState: AvaState; onClickAva: () => void }) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const stateRef  = useRef<AvaState>("idle");
  const animIdRef = useRef<number>(0);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [bubble, setBubble]       = useState<string | null>(null);
  const reactionId = useRef(0);

  stateRef.current = avaState;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ── Renderer ── */
    const scene = new THREE.Scene();
    const W = mount.clientWidth  || 380;
    const H = mount.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(44, W / H, 0.1, 100);
    // Pull back enough to see full body (feet at ~-1.6, head at ~1.5)
    camera.position.set(0, 0.1, 5.2);
    camera.lookAt(0, 0.0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(2, 5, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0x00ffe0, 0.75);
    rim.position.set(-4, 2, -2); scene.add(rim);
    const bot = new THREE.DirectionalLight(0x4488ff, 0.25);
    bot.position.set(0, -3, 3); scene.add(bot);

    /* ── Materials ── */
    const C  = (hex: number, r = 0.28, m = 0.12) =>
      new THREE.MeshStandardMaterial({ color: hex, roughness: r, metalness: m });
    const teal     = C(0x00b8a2);
    const midTeal  = C(0x009888, 0.35, 0.1);
    const darkTeal = C(0x006b5c, 0.4,  0.1);
    const deepTeal = C(0x004d42, 0.5,  0.1);
    const skin     = C(0x00ccb4, 0.45, 0.05);
    const hair     = C(0x002e28, 0.9,  0.0);
    const beltMat  = C(0x111111, 0.3,  0.7);
    const gold     = C(0xb8860b, 0.2,  0.9);
    const packMat  = C(0x009080, 0.55, 0.1);

    /* ── Character group ── */
    const char = new THREE.Group();
    scene.add(char);

    // ─ HEAD ─
    const headGrp = new THREE.Group();
    headGrp.position.set(0, 1.52, 0);
    char.add(headGrp);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 36, 36), skin);
    headGrp.add(head);

    // Hair — smooth cap covering top+back
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.275, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.56), hair);
    headGrp.add(hairCap);

    // Bun / updo at back-top
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 20), hair);
    bun.position.set(0, 0.22, -0.2);
    headGrp.add(bun);

    // A few locs framing the face (front sides only)
    for (let i = 0; i < 4; i++) {
      const side = i < 2 ? 1 : -1;
      const fwd  = i % 2 === 0 ? 0.05 : 0.1;
      const loc  = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.22, 6, 8), hair);
      loc.position.set(side * 0.22, -0.18, fwd);
      loc.rotation.z = side * 0.15;
      headGrp.add(loc);
    }

    // Ears
    const earL = new THREE.Mesh(new THREE.SphereGeometry(0.053, 14, 14), skin);
    earL.position.set(0.275, 0.02, 0); headGrp.add(earL);
    const earR = earL.clone(); earR.position.set(-0.275, 0.02, 0); headGrp.add(earR);

    // Earrings (small gold drops)
    const erL = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 10), gold);
    erL.position.set(0.29, -0.06, 0); headGrp.add(erL);
    const erR = erL.clone(); erR.position.set(-0.29, -0.06, 0); headGrp.add(erR);

    // ─ NECK ─
    const neck = cap(0.075, 0.075, 0.1, skin);
    neck.position.set(0, 1.26, 0);
    char.add(neck);

    // ─ TORSO — tapered using LatheGeometry ─
    const profile = [
      new THREE.Vector2(0.14, 0),    // waist bottom
      new THREE.Vector2(0.16, 0.12),
      new THREE.Vector2(0.22, 0.28), // chest width
      new THREE.Vector2(0.23, 0.42),
      new THREE.Vector2(0.22, 0.52), // shoulder narrow
      new THREE.Vector2(0.20, 0.58),
    ];
    const torsoGeo = new THREE.LatheGeometry(profile, 28);
    const torso = new THREE.Mesh(torsoGeo, teal);
    torso.position.set(0, 0.82, 0);
    torso.rotation.y = Math.PI / 28; // align seam to back
    char.add(torso);

    // Shoulder spheres (small, close to body)
    const shL = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 18), teal);
    shL.position.set(0.24, 1.28, 0); char.add(shL);
    const shR = shL.clone(); shR.position.set(-0.24, 1.28, 0); char.add(shR);

    // ─ ARMS CROSSED — upper arms angled down-inward ─
    // Left upper arm
    const lUp = cap(0.065, 0.065, 0.28, teal);
    lUp.position.set(0.3, 1.14, 0.05);
    lUp.rotation.z = -Math.PI / 2.4;
    lUp.rotation.x =  0.15;
    char.add(lUp);

    // Right upper arm
    const rUp = cap(0.065, 0.065, 0.28, teal);
    rUp.position.set(-0.3, 1.14, 0.05);
    rUp.rotation.z =  Math.PI / 2.4;
    rUp.rotation.x =  0.15;
    char.add(rUp);

    // Forearms — crossing horizontally in front of torso
    const lFore = cap(0.055, 0.055, 0.34, skin);
    lFore.position.set(0.05, 0.98, 0.2);
    lFore.rotation.z = Math.PI / 2;
    lFore.rotation.y =  0.1;
    char.add(lFore);

    const rFore = cap(0.055, 0.055, 0.34, skin);
    rFore.position.set(-0.05, 0.93, 0.2);
    rFore.rotation.z = Math.PI / 2;
    rFore.rotation.y = -0.1;
    char.add(rFore);

    // Hands (small spheres at ends of forearms)
    const lHnd = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 12), skin);
    lHnd.position.set(-0.22, 0.93, 0.22); char.add(lHnd);
    const rHnd = lHnd.clone(); rHnd.position.set(0.22, 0.98, 0.22); char.add(rHnd);

    // ─ WAVE ARM (left, swings up on "waving") ─
    const waveGrp = new THREE.Group();
    waveGrp.position.set(0.24, 1.28, 0);

    const wUpper = cap(0.065, 0.065, 0.28, teal);
    wUpper.position.y = -0.14; waveGrp.add(wUpper);
    const wFore = cap(0.055, 0.055, 0.28, skin);
    wFore.position.y = -0.42; waveGrp.add(wFore);
    const wHnd = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 12), skin);
    wHnd.position.y = -0.58; waveGrp.add(wHnd);

    waveGrp.visible = false;
    char.add(waveGrp);

    // ─ HIPS ─
    const hipProfile = [
      new THREE.Vector2(0.18, 0),
      new THREE.Vector2(0.22, 0.1),
      new THREE.Vector2(0.21, 0.2),
      new THREE.Vector2(0.16, 0.28),
    ];
    const hips = new THREE.Mesh(new THREE.LatheGeometry(hipProfile, 24), darkTeal);
    hips.position.set(0, 0.56, 0);
    char.add(hips);

    // Belt
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.05, 24), beltMat);
    belt.position.set(0, 0.815, 0); char.add(belt);
    const bBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.042, 0.035), gold);
    bBuckle.position.set(0, 0.815, 0.217); char.add(bBuckle);

    // ─ LEGS ─
    for (const [x, sign] of [[0.1, 1], [-0.1, -1]] as [number, number][]) {
      // Thigh
      const thigh = cap(0.1, 0.1, 0.38, darkTeal);
      thigh.position.set(x * sign, 0.3, 0); char.add(thigh);
      // Shin
      const shin = cap(0.082, 0.082, 0.36, darkTeal);
      shin.position.set(x * sign, -0.08, 0); char.add(shin);
      // Cuff
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.06, 18), midTeal);
      cuff.position.set(x * sign, -0.27, 0); char.add(cuff);
      // Boot
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.1, 0.27), deepTeal);
      boot.position.set(x * sign, -0.36, 0.035); char.add(boot);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.162, 0.028, 0.275), beltMat);
      sole.position.set(x * sign, -0.414, 0.035); char.add(sole);
    }

    // ─ BACKPACK ─
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.38, 0.12), packMat);
    pack.position.set(0, 1.02, -0.28); char.add(pack);
    const packLid = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.1), packMat);
    packLid.position.set(0, 1.24, -0.27); char.add(packLid);
    for (const x of [0.09, -0.09]) {
      const strap = cap(0.028, 0.028, 0.48, midTeal);
      strap.position.set(x, 1.0, -0.14); char.add(strap);
    }

    // ─ Position character ─
    char.position.y = -0.58;  // shift down so full body fits in frame

    /* ── Mouse ── */
    let mX = 0, mY = 0;
    const onMouse = (e: MouseEvent) => {
      mX = (e.clientX / window.innerWidth  - 0.75) * 2;
      mY = (e.clientY / window.innerHeight - 0.5)  * 2;
    };
    window.addEventListener("mousemove", onMouse);

    /* ── Animation loop ── */
    let f = 0, wavePhase = 0;
    const loop = () => {
      f++;
      const t = f * 0.016;
      const state = stateRef.current;
      const breathe = Math.sin(t * 0.85) * 0.025;

      char.position.y = -0.58 + breathe;
      char.rotation.y = Math.sin(t * 0.22) * 0.03 + mX * 0.05;
      char.rotation.x = 0;
      char.rotation.z = 0;

      // Head follows cursor
      headGrp.rotation.y = mX * 0.2;
      headGrp.rotation.x = mY * -0.1;
      headGrp.rotation.z = 0;

      waveGrp.visible = state === "waving";

      if (state === "talking") {
        char.position.y = -0.58 + breathe + Math.sin(t * 7) * 0.013;
      } else if (state === "thinking") {
        headGrp.rotation.z = 0.14 + Math.sin(t * 0.6) * 0.12;
      } else if (state === "happy") {
        char.position.y = -0.58 + Math.abs(Math.sin(t * 5)) * 0.1;
        char.rotation.z = Math.sin(t * 5) * 0.035;
      } else if (state === "waving") {
        waveGrp.rotation.z = Math.PI * 0.15 + Math.sin(wavePhase) * 0.65;
        waveGrp.rotation.x = -0.2;
        wavePhase += 0.18;
      } else {
        wavePhase = 0;
      }

      renderer.render(scene, camera);
      animIdRef.current = requestAnimationFrame(loop);
    };
    animIdRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener("mousemove", onMouse);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  /* ── Idle speech bubbles ── */
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

  return (
    <div style={{ position:"relative", width:"100%", height:"100%" }}>
      <style>{`
        @keyframes reactionPop { 0%{transform:scale(.5);opacity:1} 70%{transform:translateY(-52px) scale(1.3);opacity:1} 100%{transform:translateY(-80px);opacity:0} }
        @keyframes bubblePop   { 0%{transform:scale(.8);opacity:0} 12%{transform:scale(1.04);opacity:1} 85%{opacity:1} 100%{transform:scale(.9);opacity:0} }
        @keyframes plumbob     { 0%,100%{transform:translateX(-50%) translateY(0) rotate(45deg)} 50%{transform:translateX(-50%) translateY(-8px) rotate(45deg)} }
        @keyframes glowRing    { 0%{transform:translateX(-50%) scale(1);opacity:.5} 100%{transform:translateX(-50%) scale(1.6);opacity:0} }
      `}</style>

      <div style={{ position:"absolute", top:14, left:"50%", width:20, height:20, background:"linear-gradient(135deg,#00e6b4,#00c49a)", clipPath:"polygon(50% 0%,100% 50%,50% 100%,0% 50%)", animation:"plumbob 2.8s ease-in-out infinite", boxShadow:"0 0 12px rgba(0,230,180,0.7)", zIndex:10 }} />

      {bubble && (
        <div style={{ position:"absolute", top:54, right:"105%", background:"white", borderRadius:14, padding:"7px 13px", fontSize:13, fontWeight:600, color:"#1a1a1a", whiteSpace:"nowrap", boxShadow:"0 4px 16px rgba(0,0,0,0.2)", animation:"bubblePop 2.8s ease forwards", zIndex:10 }}>
          {bubble}
          <div style={{ position:"absolute", right:-8, top:"50%", transform:"translateY(-50%)", borderWidth:"8px 0 8px 8px", borderStyle:"solid", borderColor:"transparent transparent transparent white" }} />
        </div>
      )}

      {avaState === "talking" && [0, 0.42, 0.84].map(d => (
        <div key={d} style={{ position:"absolute", bottom:"14%", left:"50%", width:180, height:180, borderRadius:"50%", border:"2px solid rgba(0,210,190,0.5)", pointerEvents:"none", animation:`glowRing 1.3s ease-out ${d}s infinite` }} />
      ))}

      {reactions.map(r => (
        <div key={r.id} style={{ position:"absolute", top:"30%", left:"50%", fontSize:32, pointerEvents:"none", animation:"reactionPop 1.1s ease-out forwards" }}>{r.emoji}</div>
      ))}

      <div ref={mountRef} style={{ width:"100%", height:"100%", cursor:"pointer" }} onClick={handleClick} />

      <div style={{ position:"absolute", bottom:8, left:0, right:0, textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:0.5 }}>
        {avaState === "talking" ? "Ava is speaking ✨" : "click ava · move your mouse"}
      </div>
    </div>
  );
}

function TropicalBackground() {
  return (
    <>
      <div style={{ position:"absolute", top:24, left:64, width:72, height:72, background:"radial-gradient(circle,#FFE566,#FFA500)", borderRadius:"50%", boxShadow:"0 0 52px rgba(255,200,0,0.52)" }} />
      {[0,45,90,135,180,225,270,315].map(deg=>(
        <div key={deg} style={{ position:"absolute", top:58, left:100, width:2, height:27, background:"rgba(255,220,0,0.38)", transformOrigin:"1px 0", transform:`rotate(${deg}deg) translateY(-48px)`, borderRadius:2 }} />
      ))}
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ position:"absolute", bottom:0, left:0, right:0, width:"100%", height:100 }}>
        <path d="M0,50 C240,90 480,10 720,50 C960,90 1200,10 1440,50 L1440,100 L0,100 Z" fill="rgba(0,77,122,0.45)" />
        <path d="M0,70 C360,30 720,90 1080,50 C1260,30 1380,70 1440,70 L1440,100 L0,100 Z" fill="rgba(0,50,90,0.35)" />
      </svg>
    </>
  );
}

export default function ChatPage() {
  const [messages, setMessages]  = useState<Message[]>([]);
  const [input, setInput]        = useState("");
  const [isLoading, setIsLoading]= useState(false);
  const [avaState, setAvaState]  = useState<AvaState>("idle");
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
      setMessages(prev => { const c=[...prev]; c[c.length-1]={role:"assistant",content:"Sorry, something went wrong."}; return c; });
    } finally {
      setIsLoading(false);
      setAvaState("happy");
      setTimeout(() => setAvaState("idle"), 1800);
      inputRef.current?.focus();
    }
  }

  return (
    <div style={{ height:"100vh", background:"linear-gradient(180deg,#87CEEB 0%,#29ABE2 25%,#0086BF 55%,#005F99 80%,#003D66 100%)", display:"flex", fontFamily:"'Segoe UI',system-ui,sans-serif", position:"relative", overflow:"hidden" }}>
      <TropicalBackground />

      {/* LEFT — chat */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", position:"relative", zIndex:1, minWidth:0 }}>
        <div style={{ padding:"22px 28px 0", color:"white" }}>
          <h1 style={{ margin:0, fontSize:30, fontWeight:900, letterSpacing:2, textShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>Ava</h1>
          <p style={{ margin:"3px 0 0", fontSize:13, opacity:0.88 }}>Your Bahamian Culture Guide 🌺</p>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px 24px 12px", display:"flex", flexDirection:"column", gap:12 }}>
          {messages.length === 0 ? (
            <div style={{ color:"rgba(255,255,255,0.92)", paddingTop:8 }}>
              <p style={{ fontSize:14, marginBottom:14 }}>Ask Ava anything about the Bahamas!</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => sendMessage(q)}
                    style={{ background:"rgba(255,255,255,0.18)", border:"1px solid rgba(255,255,255,0.4)", color:"white", borderRadius:24, padding:"8px 16px", fontSize:13, cursor:"pointer", backdropFilter:"blur(6px)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                  >{q}</button>
                ))}
              </div>
            </div>
          ) : messages.map((msg, i) => (
            <div key={i} style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start", alignItems:"flex-end", gap:8 }}>
              {msg.role === "assistant" && (
                <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, overflow:"hidden", border:"2px solid rgba(255,215,0,0.7)" }}>
                  <img src="/ava-avatar.png" alt="Ava" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
                </div>
              )}
              <div style={{ maxWidth:"72%", padding:"12px 16px", borderRadius:msg.role==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px", background:msg.role==="user"?"linear-gradient(135deg,#00897B,#005F99)":"rgba(255,255,255,0.93)", color:msg.role==="user"?"white":"#1a1a1a", fontSize:14, lineHeight:1.65, boxShadow:"0 3px 10px rgba(0,0,0,0.18)", whiteSpace:"pre-wrap" }}>
                {msg.content || (isLoading && i === messages.length - 1 ? <span style={{ opacity:0.5 }}>▌</span> : null)}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} style={{ display:"flex", gap:10, padding:"14px 24px", background:"rgba(0,0,0,0.25)", backdropFilter:"blur(12px)", borderTop:"1px solid rgba(255,255,255,0.15)" }}>
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about the Bahamas..." disabled={isLoading}
            style={{ flex:1, padding:"13px 20px", borderRadius:32, border:"none", background:"rgba(255,255,255,0.92)", fontSize:14, outline:"none", color:"#1a1a1a" }} />
          <button type="submit" disabled={!input.trim() || isLoading}
            style={{ padding:"13px 26px", borderRadius:32, border:"none", background:input.trim()&&!isLoading?"linear-gradient(135deg,#FFD700,#FFA500)":"rgba(255,255,255,0.2)", color:input.trim()&&!isLoading?"#1a1a1a":"rgba(255,255,255,0.4)", fontWeight:700, fontSize:14, cursor:input.trim()&&!isLoading?"pointer":"default", whiteSpace:"nowrap" }}>
            Send ➤
          </button>
        </form>
      </div>

      {/* RIGHT — 3D Ava */}
      <div style={{ width:"clamp(280px,36%,460px)", display:"flex", alignItems:"stretch", justifyContent:"center", position:"relative", zIndex:2, flexShrink:0 }}>
        <AvaAvatar avaState={avaState} onClickAva={handleClickAva} />
      </div>
    </div>
  );
}
