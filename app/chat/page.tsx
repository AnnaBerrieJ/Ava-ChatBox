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

    /* ── Scene ── */
    const scene = new THREE.Scene();
    const W = mount.clientWidth  || 380;
    const H = mount.clientHeight || 520;
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(0, 1.35, 4.8);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(3, 6, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x00ffd0, 0.7);
    rim.position.set(-4, 3, -3); scene.add(rim);
    const fill = new THREE.DirectionalLight(0x88ccff, 0.3);
    fill.position.set(-2, 0, 4); scene.add(fill);

    /* ── Materials ── */
    const teal     = new THREE.MeshStandardMaterial({ color:0x00b8a2, roughness:0.22, metalness:0.18 });
    const darkTeal = new THREE.MeshStandardMaterial({ color:0x007a6a, roughness:0.38, metalness:0.12 });
    const deepTeal = new THREE.MeshStandardMaterial({ color:0x00564c, roughness:0.5,  metalness:0.1  });
    const skin     = new THREE.MeshStandardMaterial({ color:0x00cdb5, roughness:0.45, metalness:0.05 });
    const hair     = new THREE.MeshStandardMaterial({ color:0x003530, roughness:0.9  });
    const beltMat  = new THREE.MeshStandardMaterial({ color:0x001f1c, roughness:0.3, metalness:0.7  });
    const buckle   = new THREE.MeshStandardMaterial({ color:0xb8860b, roughness:0.2, metalness:0.9  });
    const packMat  = new THREE.MeshStandardMaterial({ color:0x009680, roughness:0.55, metalness:0.1 });

    const char = new THREE.Group();
    scene.add(char);

    /* ── Head ── */
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.295, 36, 36), skin);
    head.position.set(0, 2.52, 0);
    char.add(head);

    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.54), hair);
    hairCap.position.copy(head.position);
    char.add(hairCap);

    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.112, 20, 20), hair);
    bun.position.set(0, 2.78, -0.22);
    char.add(bun);

    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI + 0.2;
      const loc = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.011, 0.3, 8), hair);
      loc.position.set(Math.sin(a) * 0.25, 2.38, Math.cos(a) * 0.22 - 0.04);
      loc.rotation.z = Math.sin(a) * 0.16;
      char.add(loc);
    }

    const earL = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 14), skin);
    earL.position.set(0.3, 2.48, 0); char.add(earL);
    const earR = earL.clone(); earR.position.set(-0.3, 2.48, 0); char.add(earR);

    const erL = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 10), buckle);
    erL.position.set(0.33, 2.4, 0); char.add(erL);
    const erR = erL.clone(); erR.position.set(-0.33, 2.4, 0); char.add(erR);

    /* ── Neck ── */
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.105, 0.17, 18), skin);
    neck.position.set(0, 2.16, 0); char.add(neck);

    /* ── Torso ── */
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.225, 0.62, 22), teal);
    torso.position.set(0, 1.72, 0); char.add(torso);

    const sL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 18), teal);
    sL.position.set(0.29, 1.98, 0); char.add(sL);
    const sR = sL.clone(); sR.position.set(-0.29, 1.98, 0); char.add(sR);

    /* ── Arms crossed ── */
    const lUp = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.36, 14), teal);
    lUp.position.set(0.3, 1.8, 0.05); lUp.rotation.z = -1.15; lUp.rotation.x = 0.22; char.add(lUp);
    const rUp = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.36, 14), teal);
    rUp.position.set(-0.3, 1.8, 0.05); rUp.rotation.z = 1.15; rUp.rotation.x = 0.22; char.add(rUp);

    const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.052, 0.42, 12), skin);
    lFore.position.set(0.04, 1.67, 0.22); lFore.rotation.z = Math.PI / 2; lFore.rotation.y = 0.12; char.add(lFore);
    const rFore = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.052, 0.42, 12), skin);
    rFore.position.set(-0.04, 1.6, 0.22); rFore.rotation.z = Math.PI / 2; rFore.rotation.y = -0.12; char.add(rFore);

    const lHnd = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 12), skin);
    lHnd.position.set(-0.24, 1.6, 0.22); char.add(lHnd);
    const rHnd = lHnd.clone(); rHnd.position.set(0.24, 1.67, 0.22); char.add(rHnd);

    /* ── Wave arm (right, toggles visible) ── */
    const waveGrp = new THREE.Group();
    waveGrp.position.set(-0.29, 1.98, 0);
    const wU = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.36, 14), teal);
    wU.position.y = -0.18; waveGrp.add(wU);
    const wF = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.052, 0.36, 12), skin);
    wF.position.y = -0.52; waveGrp.add(wF);
    const wH = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 12), skin);
    wH.position.y = -0.72; waveGrp.add(wH);
    waveGrp.visible = false;
    char.add(waveGrp);

    /* ── Hips + belt ── */
    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.228, 0.26, 22), darkTeal);
    hips.position.set(0, 1.26, 0); char.add(hips);
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.06, 22), beltMat);
    belt.position.set(0, 1.27, 0); char.add(belt);
    const bBox = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.04), buckle);
    bBox.position.set(0, 1.27, 0.258); char.add(bBox);

    /* ── Legs ── */
    for (const x of [0.12, -0.12]) {
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.1, 0.46, 16), darkTeal);
      thigh.position.set(x, 0.88, 0); char.add(thigh);
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.076, 0.44, 14), darkTeal);
      shin.position.set(x, 0.42, 0); char.add(shin);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.07, 14), deepTeal);
      cuff.position.set(x, 0.215, 0); char.add(cuff);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.11, 0.3), deepTeal);
      boot.position.set(x, 0.105, 0.04); char.add(boot);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.31), beltMat);
      sole.position.set(x, 0.045, 0.04); char.add(sole);
    }

    /* ── Backpack ── */
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.14), packMat);
    pack.position.set(0, 1.7, -0.3); char.add(pack);
    const packTop = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.12), packMat);
    packTop.position.set(0, 1.96, -0.3); char.add(packTop);
    for (const x of [0.1, -0.1]) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.62, 0.04), darkTeal);
      st.position.set(x, 1.72, -0.16); char.add(st);
    }

    char.position.y = -1.35;

    /* ── Mouse tracking ── */
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
      const breathe = Math.sin(t * 0.85) * 0.028;

      char.position.y = -1.35 + breathe;
      char.rotation.y = Math.sin(t * 0.22) * 0.035 + mX * 0.06;
      char.rotation.x = 0;
      char.rotation.z = 0;

      head.rotation.y = mX * 0.22;
      head.rotation.x = mY * -0.1;
      head.rotation.z = 0;
      hairCap.rotation.copy(head.rotation);

      waveGrp.visible = state === "waving";

      if (state === "talking") {
        char.position.y = -1.35 + breathe + Math.sin(t * 7) * 0.016;
        char.rotation.x = Math.sin(t * 7) * 0.01;
      } else if (state === "thinking") {
        head.rotation.z = 0.16 + Math.sin(t * 0.55) * 0.14;
        char.position.y = -1.35 + breathe + Math.sin(t * 0.5) * 0.02;
      } else if (state === "happy") {
        char.position.y = -1.35 + Math.abs(Math.sin(t * 5)) * 0.11;
        char.rotation.z = Math.sin(t * 5) * 0.04;
      } else if (state === "waving") {
        waveGrp.rotation.z = Math.PI * 0.2 + Math.sin(wavePhase) * 0.6;
        waveGrp.rotation.x = -0.25;
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
        @keyframes bubblePop { 0%{transform:scale(.8);opacity:0} 12%{transform:scale(1.04);opacity:1} 85%{opacity:1} 100%{transform:scale(.9);opacity:0} }
        @keyframes plumbob { 0%,100%{transform:translateX(-50%) translateY(0) rotate(45deg)} 50%{transform:translateX(-50%) translateY(-8px) rotate(45deg)} }
        @keyframes glowRing { 0%{transform:translateX(-50%) scale(1);opacity:.5} 100%{transform:translateX(-50%) scale(1.6);opacity:0} }
      `}</style>

      {/* Plumbob */}
      <div style={{ position:"absolute", top:14, left:"50%", width:20, height:20, background:"linear-gradient(135deg,#00e6b4,#00c49a)", clipPath:"polygon(50% 0%,100% 50%,50% 100%,0% 50%)", animation:"plumbob 2.8s ease-in-out infinite", boxShadow:"0 0 12px rgba(0,230,180,0.7)", zIndex:10 }} />

      {/* Speech bubble */}
      {bubble && (
        <div style={{ position:"absolute", top:54, right:"105%", background:"white", borderRadius:14, padding:"7px 13px", fontSize:13, fontWeight:600, color:"#1a1a1a", whiteSpace:"nowrap", boxShadow:"0 4px 16px rgba(0,0,0,0.2)", animation:"bubblePop 2.8s ease forwards", zIndex:10 }}>
          {bubble}
          <div style={{ position:"absolute", right:-8, top:"50%", transform:"translateY(-50%)", borderWidth:"8px 0 8px 8px", borderStyle:"solid", borderColor:"transparent transparent transparent white" }} />
        </div>
      )}

      {/* Talking glow rings */}
      {avaState === "talking" && [0, 0.42, 0.84].map(d => (
        <div key={d} style={{ position:"absolute", bottom:"16%", left:"50%", width:180, height:180, borderRadius:"50%", border:"2px solid rgba(0,210,190,0.5)", pointerEvents:"none", animation:`glowRing 1.3s ease-out ${d}s infinite` }} />
      ))}

      {/* Emoji reactions */}
      {reactions.map(r => (
        <div key={r.id} style={{ position:"absolute", top:"30%", left:"50%", fontSize:32, pointerEvents:"none", animation:"reactionPop 1.1s ease-out forwards" }}>{r.emoji}</div>
      ))}

      {/* Three.js canvas mounts here */}
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
