"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Message  = { role: "user" | "assistant"; content: string };
type AvaState = "idle" | "talking" | "waving" | "thinking" | "happy";
type Reaction = { emoji: string; id: number };

const SUGGESTED = [
  "What is Junkanoo? 🎉",
  "Best Bahamian food? 🍽️",
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
    if (line.trim() === "")      return <div key={i} style={{height:6}}/>;
    return <p key={i} style={{margin:0,lineHeight:1.65}}>{renderInline(line)}</p>;
  });
}

/* ─── Beach background ─── */
function BeachBackground() {
  return (
    <div style={{position:"absolute",inset:0,overflow:"hidden",zIndex:0}}>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,#87CEEB 0%,#B0E0FF 40%,#E8F4FF 65%,#F5DEB3 75%,#F4A460 82%,#DEB887 100%)"}}/>
      <div style={{position:"absolute",top:30,right:"28%",width:80,height:80,borderRadius:"50%",background:"radial-gradient(circle,#FFF9C4 0%,#FFE066 40%,#FFA500 100%)",boxShadow:"0 0 50px 16px rgba(255,200,0,0.45)"}}/>
      {[{top:40,left:"5%",s:1},{top:22,left:"28%",s:.75},{top:32,left:"52%",s:1.1}].map((c,i)=>(
        <div key={i} style={{position:"absolute",top:c.top,left:c.left,transform:`scale(${c.s})`,display:"flex",opacity:0.9}}>
          <div style={{width:52,height:30,background:"white",borderRadius:"50%"}}/>
          <div style={{width:70,height:40,background:"white",borderRadius:"50%",marginLeft:-18,marginTop:-8}}/>
          <div style={{width:44,height:28,background:"white",borderRadius:"50%",marginLeft:-14,marginTop:-2}}/>
        </div>
      ))}
      <div style={{position:"absolute",bottom:"18%",left:0,right:0,height:"22%",background:"linear-gradient(180deg,#1A9BD4 0%,#0077B6 50%,#005F99 100%)",borderRadius:"60% 60% 0 0/20% 20% 0 0"}}/>
      <svg style={{position:"absolute",bottom:"17%",left:0,width:"100%",height:50}} viewBox="0 0 800 50" preserveAspectRatio="none">
        <path d="M0,25 C100,0 200,45 300,25 C400,5 500,45 600,25 C700,5 780,35 800,25 L800,50 L0,50 Z" fill="rgba(255,255,255,0.18)"/>
      </svg>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"20%",background:"linear-gradient(180deg,#F5DEB3 0%,#DEB887 50%,#C8A56A 100%)"}}/>
      {/* Left palm */}
      <div style={{position:"absolute",bottom:"18%",left:-10,width:130,height:280}}>
        <div style={{position:"absolute",bottom:0,left:40,width:18,height:210,background:"linear-gradient(180deg,#6B4226,#8B5E3C)",borderRadius:"10px 6px 3px 3px",transform:"rotate(-6deg)",transformOrigin:"bottom center"}}/>
        {[[-50,0],[-22,-12],[8,-16],[36,-8],[55,4],[-70,10]].map(([r,y],i)=>(
          <div key={i} style={{position:"absolute",bottom:188,left:40,width:90,height:18,background:"linear-gradient(90deg,#2D6A2D,#4CAF50)",borderRadius:"0 50% 50% 0",transform:`rotate(${r}deg) translateY(${y}px)`,transformOrigin:"left center",opacity:0.9}}/>
        ))}
      </div>
      {/* Right palm */}
      <div style={{position:"absolute",bottom:"18%",right:-10,width:120,height:250}}>
        <div style={{position:"absolute",bottom:0,right:16,width:17,height:185,background:"linear-gradient(180deg,#6B4226,#8B5E3C)",borderRadius:"6px 10px 3px 3px",transform:"rotate(7deg)",transformOrigin:"bottom center"}}/>
        {[[-32,0],[-58,7],[-82,16],[8,-10],[33,-5]].map(([r,y],i)=>(
          <div key={i} style={{position:"absolute",bottom:168,right:18,width:85,height:17,background:"linear-gradient(270deg,#2D6A2D,#4CAF50)",borderRadius:"50% 0 0 50%",transform:`rotate(${r}deg) translateY(${y}px)`,transformOrigin:"right center",opacity:0.9}}/>
        ))}
      </div>
    </div>
  );
}

/* ─── Desktop Avatar ─── */
function AvaAvatarDesktop({ avaState, onClickAva }: { avaState: AvaState; onClickAva: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [bubble, setBubble] = useState<string|null>(null);
  const rid = useRef(0);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!ref.current) return;
      const dx=(e.clientX/window.innerWidth-0.75)*2, dy=(e.clientY/window.innerHeight-0.5)*2;
      ref.current.style.transform=`perspective(900px) rotateX(${dy*-5}deg) rotateY(${dx*10}deg)`;
    };
    window.addEventListener("mousemove",fn);
    return ()=>window.removeEventListener("mousemove",fn);
  },[]);

  useEffect(()=>{
    const iv=setInterval(()=>{
      if(Math.random()<0.4){setBubble(IDLE_COMMENTS[Math.floor(Math.random()*IDLE_COMMENTS.length)]);setTimeout(()=>setBubble(null),2800);}
    },9000);
    return()=>clearInterval(iv);
  },[]);

  const handleClick=()=>{
    const emoji=CLICK_REACTIONS[Math.floor(Math.random()*CLICK_REACTIONS.length)];
    const id=rid.current++;
    setReactions(p=>[...p,{emoji,id}]);
    setTimeout(()=>setReactions(p=>p.filter(r=>r.id!==id)),1100);
    onClickAva();
  };

  const cls=({idle:"ava-idle",talking:"ava-talk",waving:"ava-wave",thinking:"ava-think",happy:"ava-happy"} as Record<AvaState,string>)[avaState];
  return (
    <div style={{position:"relative",width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end"}}>
      <style>{`
        @keyframes avaIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes avaTalk{0%,100%{transform:translateY(0)rotate(0)}25%{transform:translateY(-8px)rotate(-1deg)}75%{transform:translateY(-4px)rotate(1deg)}}
        @keyframes avaWave{0%,100%{transform:translateY(0)rotate(0)}25%{transform:translateY(-20px)rotate(-4deg)}75%{transform:translateY(-20px)rotate(4deg)}}
        @keyframes avaThink{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)rotate(3deg)}}
        @keyframes avaHappy{0%,100%{transform:translateY(0)scale(1)}30%{transform:translateY(-26px)scale(1.04)}60%{transform:translateY(-30px)scale(1.06)}}
        @keyframes glowP{0%,100%{filter:drop-shadow(0 0 18px rgba(0,220,200,.7))}50%{filter:drop-shadow(0 0 36px rgba(0,230,210,1))}}
        @keyframes rPop{0%{transform:scale(.5);opacity:1}70%{transform:translateY(-52px)scale(1.3);opacity:1}100%{transform:translateY(-80px);opacity:0}}
        @keyframes bPop{0%{transform:scale(.8);opacity:0}12%{transform:scale(1.04);opacity:1}85%{opacity:1}100%{transform:scale(.9);opacity:0}}
        @keyframes gRing{0%{transform:translateX(-50%)scale(1);opacity:.5}100%{transform:translateX(-50%)scale(1.65);opacity:0}}
        .ava-idle{animation:avaIdle 3.6s ease-in-out infinite}
        .ava-talk{animation:avaTalk .46s ease-in-out infinite}
        .ava-wave{animation:avaWave .55s ease-in-out 4}
        .ava-think{animation:avaThink 2.1s ease-in-out infinite}
        .ava-happy{animation:avaHappy .5s ease-in-out 4}
        .ava-glow{animation:glowP .6s ease-in-out infinite}
      `}</style>
      {bubble&&<div style={{position:"absolute",top:24,right:"108%",background:"white",borderRadius:14,padding:"8px 14px",fontSize:13,fontWeight:600,color:"#1a1a1a",whiteSpace:"nowrap",boxShadow:"0 4px 16px rgba(0,0,0,0.18)",animation:"bPop 2.8s ease forwards",zIndex:10}}>{bubble}<div style={{position:"absolute",right:-8,top:"50%",transform:"translateY(-50%)",borderWidth:"8px 0 8px 8px",borderStyle:"solid",borderColor:"transparent transparent transparent white"}}/></div>}
      {avaState==="talking"&&[0,.42,.84].map(d=><div key={d} style={{position:"absolute",bottom:"18%",left:"50%",width:200,height:200,borderRadius:"50%",border:"2px solid rgba(0,210,190,.55)",pointerEvents:"none",animation:`gRing 1.3s ease-out ${d}s infinite`}}/>)}
      {reactions.map(r=><div key={r.id} style={{position:"absolute",top:"28%",left:"50%",fontSize:32,pointerEvents:"none",animation:"rPop 1.1s ease-out forwards"}}>{r.emoji}</div>)}
      <div ref={ref} className={`${cls} ${avaState==="talking"?"ava-glow":""}`} onClick={handleClick} style={{cursor:"pointer",transition:"transform .1s ease-out",width:"100%",display:"flex",alignItems:"flex-end",justifyContent:"center",flex:1}}>
        <img src="/ava-avatar.png" alt="Ava" style={{maxHeight:"78vh",width:"auto",objectFit:"contain",objectPosition:"bottom center",display:"block",pointerEvents:"none",filter:"drop-shadow(0 12px 28px rgba(0,0,0,.35))"}}/>
      </div>
      <div style={{fontSize:11,color:"rgba(80,50,20,.55)",letterSpacing:.5,marginBottom:6}}>{avaState==="talking"?"Ava is speaking ✨":"click ava · move your mouse"}</div>
    </div>
  );
}

/* ─── Main ─── */
export default function ChatPage() {
  const [messages,setMessages]   = useState<Message[]>([]);
  const [input,setInput]         = useState("");
  const [isLoading,setIsLoading] = useState(false);
  const [avaState,setAvaState]   = useState<AvaState>("idle");
  const [screenW,setScreenW]     = useState(1200);
  const [reactions,setReactions] = useState<Reaction[]>([]);
  const [showSuggested,setShowSuggested] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const rid       = useRef(0);

  const isMobile = screenW < 640;
  const isTablet = screenW >= 640 && screenW < 1024;

  useEffect(()=>{const fn=()=>setScreenW(window.innerWidth);fn();window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);
  useEffect(()=>{
    const IDLES:AvaState[]=["waving","thinking","happy"];
    const go=()=>{idleTimer.current=setTimeout(()=>{if(isLoading){go();return;}setAvaState(IDLES[Math.floor(Math.random()*IDLES.length)]);setTimeout(()=>{setAvaState("idle");go();},2400);},7000+Math.random()*6000);};
    go();return()=>{if(idleTimer.current)clearTimeout(idleTimer.current);};
  },[isLoading]);

  const handleClickAva=useCallback(()=>{
    if(avaState==="talking")return;
    const emoji=CLICK_REACTIONS[Math.floor(Math.random()*CLICK_REACTIONS.length)];
    const id=rid.current++;
    setReactions(p=>[...p,{emoji,id}]);
    setTimeout(()=>setReactions(p=>p.filter(r=>r.id!==id)),1100);
    setAvaState("waving");setTimeout(()=>setAvaState("idle"),2200);
  },[avaState]);

  async function sendMessage(text:string){
    if(!text.trim()||isLoading)return;
    setShowSuggested(false);
    const userMsg:Message={role:"user",content:text};
    const updated=[...messages,userMsg];
    setMessages(updated);setInput("");setIsLoading(true);setAvaState("thinking");
    await new Promise(r=>setTimeout(r,500));
    setAvaState("talking");
    setMessages(prev=>[...prev,{role:"assistant",content:""}]);
    let full="";
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:updated})});
      if(!res.ok)throw new Error();
      const reader=res.body?.getReader(),dec=new TextDecoder();
      if(!reader)throw new Error();
      while(true){const{done,value}=await reader.read();if(done)break;full+=dec.decode(value,{stream:true});setMessages(prev=>{const c=[...prev];c[c.length-1]={role:"assistant",content:full};return c;});}
    }catch{
      setMessages(prev=>{const c=[...prev];c[c.length-1]={role:"assistant",content:"Hmm, something went wrong. Try again! 😊"};return c;});
    }finally{setIsLoading(false);setAvaState("happy");setTimeout(()=>setAvaState("idle"),1800);inputRef.current?.focus();}
  }

  /* ════════════════ MOBILE — WhatsApp-style fullscreen ════════════════ */
  if(isMobile) {
    const mCls = {idle:"m-idle",talking:"m-talk",waving:"m-wave",thinking:"m-think",happy:"m-happy"}[avaState] ?? "m-idle";
    return (
      <div style={{height:"100dvh",display:"flex",flexDirection:"column",fontFamily:"'Segoe UI',system-ui,sans-serif",overflow:"hidden",position:"relative"}}>
        <style>{`
          @keyframes tdot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
          @keyframes mPop{0%{transform:scale(.5);opacity:1}70%{transform:translateY(-50px)scale(1.3);opacity:1}100%{transform:translateY(-80px);opacity:0}}
          @keyframes mIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
          @keyframes mTalk{0%,100%{transform:translateY(0)rotate(0)}25%{transform:translateY(-6px)rotate(-1deg)}75%{transform:translateY(-3px)rotate(1deg)}}
          @keyframes mWave{0%,100%{transform:translateY(0)rotate(0)}25%{transform:translateY(-16px)rotate(-4deg)}75%{transform:translateY(-16px)rotate(4deg)}}
          @keyframes mHappy{0%,100%{transform:translateY(0)scale(1)}40%{transform:translateY(-20px)scale(1.05)}}
          .m-idle{animation:mIdle 3.6s ease-in-out infinite}
          .m-talk{animation:mTalk .46s ease-in-out infinite}
          .m-wave{animation:mWave .55s ease-in-out 4}
          .m-think{animation:mIdle 1.2s ease-in-out infinite}
          .m-happy{animation:mHappy .5s ease-in-out 4}
          .no-sb::-webkit-scrollbar{display:none}
        `}</style>

        {/* ── BACKGROUND: beach scene + full-body Ava ── */}
        <div style={{position:"absolute",inset:0,zIndex:0}}>
          <BeachBackground/>
          {/* Ava standing right side, full height */}
          <div className={mCls} style={{position:"absolute",right:0,bottom:0,height:"85%",zIndex:1,pointerEvents:"none"}}>
            <img src="/ava-avatar.png" alt="Ava"
              style={{height:"100%",width:"auto",objectFit:"contain",objectPosition:"bottom right",display:"block",
                filter:"drop-shadow(-6px 0 18px rgba(0,0,0,.3))"}}/>
          </div>
          {/* Dark overlay — heavier at bottom for readability, lighter at top so beach shows */}
          <div style={{position:"absolute",inset:0,zIndex:2,
            background:"linear-gradient(180deg,rgba(0,20,10,.08) 0%,rgba(0,20,10,.18) 50%,rgba(0,20,10,.55) 100%)"}}/>
        </div>

        {/* Emoji reactions */}
        {reactions.map(r=>(
          <div key={r.id} style={{position:"absolute",top:"20%",left:"30%",fontSize:32,zIndex:20,pointerEvents:"none",animation:"mPop 1.1s ease-out forwards"}}>{r.emoji}</div>
        ))}

        {/* ── TOP HEADER ── */}
        <div style={{position:"relative",zIndex:10,flexShrink:0,
          background:"linear-gradient(180deg,rgba(0,60,40,.85),rgba(0,60,40,.55))",
          backdropFilter:"blur(12px)",
          borderBottom:"1px solid rgba(255,255,255,.12)",
          padding:"52px 16px 12px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:42,height:42,borderRadius:"50%",overflow:"hidden",border:"2.5px solid rgba(255,255,255,.8)",flexShrink:0,cursor:"pointer"}}
            onClick={handleClickAva}>
            <img src="/ava-avatar.png" alt="Ava" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:800,color:"white",lineHeight:1,letterSpacing:.5}}>Ava</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.8)",marginTop:2}}>
              {isLoading?"💭 thinking…":avaState==="talking"?"✨ speaking…":"🌺 Your Bahamian Guide"}
            </div>
          </div>
          <div style={{fontSize:20}}>🌊</div>
        </div>

        {/* ── MESSAGES ── */}
        <div className="no-sb" style={{flex:1,overflowY:"auto",position:"relative",zIndex:10,
          padding:"12px 14px 8px",display:"flex",flexDirection:"column",gap:10,minHeight:0,
          WebkitOverflowScrolling:"touch" as any}}>

          {/* Welcome + suggestion chips (disappear after first message) */}
          {showSuggested && (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,paddingTop:8,paddingBottom:4}}>
              <div style={{background:"rgba(0,0,0,.32)",backdropFilter:"blur(10px)",borderRadius:14,
                padding:"10px 20px",textAlign:"center",color:"white",fontSize:13,fontWeight:500}}>
                Hey! I'm Ava 🌺 Ask me anything about the Bahamas
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
                {SUGGESTED.map((q)=>(
                  <button key={q} onClick={()=>sendMessage(q)}
                    style={{background:"rgba(255,255,255,.92)",border:"none",color:"#006D5B",
                      borderRadius:22,padding:"10px 20px",fontSize:13,cursor:"pointer",fontWeight:700,
                      boxShadow:"0 2px 12px rgba(0,0,0,.2)"}}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg,i)=>(
            <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",
              alignItems:"flex-end",gap:8}}>
              {/* Ava avatar dot on assistant messages */}
              {msg.role==="assistant"&&(
                <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,overflow:"hidden",
                  border:"2px solid rgba(255,255,255,.85)",boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>
                  <img src="/ava-avatar.png" alt="Ava" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
                </div>
              )}
              <div style={{
                maxWidth:"72%",
                padding:"10px 14px",
                borderRadius: msg.role==="user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role==="user"
                  ? "linear-gradient(135deg,#00897B,#005F99)"
                  : "rgba(255,255,255,.93)",
                color: msg.role==="user" ? "white" : "#1a2a1e",
                fontSize:15,lineHeight:1.6,
                boxShadow:"0 2px 12px rgba(0,0,0,.18)",
                border: msg.role==="assistant" ? "1px solid rgba(255,255,255,.6)" : "none",
              }}>
                {msg.role==="assistant"
                  ? (msg.content
                      ? renderMarkdown(msg.content)
                      : isLoading && i===messages.length-1
                        ? <span style={{display:"flex",gap:5,padding:"2px 0"}}>
                            {[0,.18,.36].map(d=><span key={d} style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:"#00897B",animation:`tdot 1.2s ease-in-out ${d}s infinite`}}/>)}
                          </span>
                        : null)
                  : msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>

        {/* ── INPUT BAR ── */}
        <div style={{position:"relative",zIndex:10,flexShrink:0,
          background:"rgba(0,40,25,.78)",backdropFilter:"blur(16px)",
          borderTop:"1px solid rgba(255,255,255,.12)",padding:"10px 12px 24px"}}>
          <form onSubmit={e=>{e.preventDefault();sendMessage(input);}} style={{display:"flex",gap:10,alignItems:"center"}}>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              placeholder="Message Ava…" disabled={isLoading}
              style={{flex:1,padding:"13px 18px",borderRadius:28,
                border:"1.5px solid rgba(255,255,255,.22)",
                background:"rgba(255,255,255,.14)",
                color:"white",fontSize:15,outline:"none",
                caretColor:"#FFD700"}}/>
            <button type="submit" disabled={!input.trim()||isLoading}
              style={{width:48,height:48,borderRadius:"50%",border:"none",flexShrink:0,
                background: input.trim()&&!isLoading
                  ? "linear-gradient(135deg,#FFD700,#FF8C00)"
                  : "rgba(255,255,255,.18)",
                color: input.trim()&&!isLoading ? "#1a1a1a" : "rgba(255,255,255,.4)",
                fontSize:20,cursor:input.trim()&&!isLoading?"pointer":"default",
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:input.trim()&&!isLoading?"0 3px 12px rgba(255,160,0,.4)":"none"}}>
              ➤
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ════════════════ TABLET / DESKTOP ════════════════ */
  const avaW = isTablet ? "clamp(200px,35%,300px)" : "clamp(260px,34%,420px)";
  return (
    <div style={{height:"100dvh",display:"flex",fontFamily:"'Segoe UI',system-ui,sans-serif",position:"relative",overflow:"hidden"}}>
      <BeachBackground/>
      {/* Chat panel */}
      <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative",zIndex:1,minWidth:0,minHeight:0,padding:isTablet?"14px 0 0 14px":"20px 0 0 20px"}}>
        <div style={{background:"rgba(255,255,255,.22)",backdropFilter:"blur(14px)",borderRadius:18,padding:"14px 20px",marginBottom:10,marginRight:16,border:"1px solid rgba(255,255,255,.4)",boxShadow:"0 4px 24px rgba(0,0,0,.08)",flexShrink:0}}>
          <h1 style={{margin:0,fontSize:isTablet?20:26,fontWeight:900,letterSpacing:2,color:"#1a4a2e"}}>Ava</h1>
          <p style={{margin:"2px 0 0",fontSize:isTablet?11:13,color:"#2d5a3d",opacity:.9}}>Your Bahamian Culture Guide 🌺</p>
        </div>
        <div style={{flex:1,overflowY:"auto",background:"rgba(255,255,255,.18)",backdropFilter:"blur(14px)",borderRadius:18,padding:"14px 16px",marginRight:16,marginBottom:10,border:"1px solid rgba(255,255,255,.38)",display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
          {messages.length===0?(
            <div style={{paddingTop:4}}>
              <p style={{fontSize:14,marginBottom:10,color:"#1a3a26",fontWeight:500}}>Ask Ava anything about the Bahamas!</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {[...SUGGESTED,"Famous Bahamians? 🌟","The Out Islands? 🏝️","Best conch salad? 🐚","Bahari Bahamas? 👗"].map(q=>(
                  <button key={q} onClick={()=>sendMessage(q)}
                    style={{background:"rgba(255,255,255,.6)",border:"1px solid rgba(255,255,255,.7)",color:"#1a4a2e",borderRadius:20,padding:"8px 16px",fontSize:13,cursor:"pointer",fontWeight:500,backdropFilter:"blur(4px)"}}
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,.85)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,.6)")}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ):messages.map((msg,i)=>(
            <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:7}}>
              {msg.role==="assistant"&&<div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,overflow:"hidden",border:"2px solid rgba(255,255,255,.8)"}}><img src="/ava-avatar.png" alt="Ava" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/></div>}
              <div style={{maxWidth:"76%",padding:"11px 16px",borderRadius:msg.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
                background:msg.role==="user"?"linear-gradient(135deg,#00897B,#005F99)":"rgba(255,255,255,.9)",
                color:msg.role==="user"?"white":"#1a2a1e",fontSize:14,lineHeight:1.65,boxShadow:"0 2px 10px rgba(0,0,0,.1)",
                border:msg.role==="assistant"?"1px solid rgba(255,255,255,.6)":"none",backdropFilter:msg.role==="assistant"?"blur(8px)":"none"}}>
                {msg.role==="assistant"?(msg.content?renderMarkdown(msg.content):isLoading&&i===messages.length-1?<span style={{opacity:.5}}>▌</span>:null):msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>
        <form onSubmit={e=>{e.preventDefault();sendMessage(input);}}
          style={{display:"flex",gap:8,padding:"12px 14px",background:"rgba(255,255,255,.28)",backdropFilter:"blur(14px)",borderRadius:18,marginRight:16,marginBottom:16,border:"1px solid rgba(255,255,255,.5)",flexShrink:0}}>
          <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about the Bahamas…" disabled={isLoading}
            style={{flex:1,padding:"11px 18px",borderRadius:24,border:"1px solid rgba(255,255,255,.7)",background:"rgba(255,255,255,.7)",fontSize:14,outline:"none",color:"#1a3a26"}}/>
          <button type="submit" disabled={!input.trim()||isLoading}
            style={{padding:"11px 22px",borderRadius:24,border:"none",
              background:input.trim()&&!isLoading?"linear-gradient(135deg,#FFD700,#FF8C00)":"rgba(200,200,200,.5)",
              color:input.trim()&&!isLoading?"#1a1a1a":"rgba(80,80,80,.5)",
              fontWeight:700,fontSize:14,cursor:input.trim()&&!isLoading?"pointer":"default",whiteSpace:"nowrap"}}>
            Send ➤
          </button>
        </form>
      </div>
      {/* Ava */}
      <div style={{width:avaW,display:"flex",alignItems:"stretch",justifyContent:"center",position:"relative",zIndex:2,flexShrink:0}}>
        <AvaAvatarDesktop avaState={avaState} onClickAva={handleClickAva}/>
      </div>
    </div>
  );
}
