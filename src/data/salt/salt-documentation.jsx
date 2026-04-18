import React, { useState } from "react";

/* ── EXPORTED FOR DESIGN HUB ── */
export { THEMES as SALT_THEMES, buildCSS as saltBuildCSS, SIcon, COMPS as SALT_COMPS, FONT as SALT_FONT, FONT_HEAD as SALT_FONT_HEAD };
export function setSaltT(theme) { T = theme; }
export function getSaltT() { return T; }
export function getSaltPreviews() { return PREVIEWS; }
export function getSaltDemoComponent(id) {
  const comp = COMPS.find(c => c.id === id);
  return comp ? comp.render : null;
}

/* ── SALT THEMES (JPM Brand + Legacy × Light/Dark) ── */
const BASE_LIGHT = {
  bg: "#FFFFFF", bg2: "#F5F7F8", bg3: "#E2E4E5", bgInv: "#101820",
  fg: "#000000", fg2: "#4C5157", fg3: "#72777D", fgDis: "#B1B5B9", fgInv: "#FFFFFF",
  border: "#B1B5B9", borderStrong: "#72777D", borderFocus: "#000000",
  positive: "#00875D", positiveWeak: "#EAF5F2", positiveFg: "#005637",
  negative: "#E52135", negativeWeak: "#FFECEA", negativeFg: "#910D1E",
  caution: "#C75300", cautionWeak: "#FFECD9", cautionFg: "#813600",
  info: "#0078CF", infoWeak: "#EAF6FF", infoFg: "#00457E",
  shadow: "rgba(0,0,0,0.10)", shadowMed: "rgba(0,0,0,0.15)", shadowHigh: "rgba(0,0,0,0.20)",
};
const BASE_DARK = {
  bg: "#101820", bg2: "#1A2229", bg3: "#26292B", bgInv: "#FFFFFF",
  fg: "#FFFFFF", fg2: "#D3D5D8", fg3: "#91959A", fgDis: "#5F646A", fgInv: "#101820",
  border: "#5F646A", borderStrong: "#91959A", borderFocus: "#FFFFFF",
  positive: "#53B087", positiveWeak: "#002915", positiveFg: "#B8E5D1",
  negative: "#FF5D57", negativeWeak: "#450002", negativeFg: "#FFC1BA",
  caution: "#EB7B39", cautionWeak: "#422000", cautionFg: "#FFC6A1",
  info: "#669CE8", infoWeak: "#001736", infoFg: "#C7DEFF",
  shadow: "rgba(0,0,0,0.50)", shadowMed: "rgba(0,0,0,0.55)", shadowHigh: "rgba(0,0,0,0.65)",
};
const THEMES = {
  "jpm-light": { ...BASE_LIGHT, name: "JPM Brand Light", short: "JPM Light", theme: "jpm",
    accent: "#1B7F9E", accentHover: "#12647E", accentActive: "#033142", accentWeak: "#DBF5F7", accentFg: "#FFFFFF", accentText: "#1B7F9E" },
  "jpm-dark": { ...BASE_DARK, name: "JPM Brand Dark", short: "JPM Dark", theme: "jpm",
    accent: "#1B7F9E", accentHover: "#4CA1C2", accentActive: "#83C0D6", accentWeak: "#033142", accentFg: "#FFFFFF", accentText: "#4CA1C2" },
  "legacy-light": { ...BASE_LIGHT, name: "Legacy (UITK) Light", short: "Legacy Light", theme: "legacy",
    accent: "#0078CF", accentHover: "#005EA6", accentActive: "#002D59", accentWeak: "#EAF6FF", accentFg: "#FFFFFF", accentText: "#0078CF" },
  "legacy-dark": { ...BASE_DARK, name: "Legacy (UITK) Dark", short: "Legacy Dark", theme: "legacy",
    accent: "#0078CF", accentHover: "#669CE8", accentActive: "#9ABDF5", accentWeak: "#002D59", accentFg: "#FFFFFF", accentText: "#669CE8" },
};
let T = THEMES["jpm-light"];
const FONT = "'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_HEAD = "'Open Sans', sans-serif"; // Amplitude is JPM-internal
const FONT_CODE = "'PT Mono', monospace"; // Salt monospace/code font

/* ── CSS ── */
const buildCSS = (T) => `
* { box-sizing:border-box; margin:0; padding:0; }
:root { --dur-fast:150ms; --dur-norm:200ms; --dur-slow:300ms; --ease:cubic-bezier(0.2,0,0,1); }
/* Salt official duration tokens: instant=0ms, perceptible=300ms, notable=1000ms, cutoff=10000ms */
@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:0.01ms!important;animation-duration:0.01ms!important;}}

.s-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:var(--cr,4px);font-family:${FONT};font-weight:600;cursor:pointer;border:1px solid transparent;outline:none;transition:background var(--dur-fast) var(--ease),border-color var(--dur-fast) var(--ease);padding:0 var(--pad,12px);height:var(--h,28px);font-size:var(--fs,12px);}
.s-btn:focus-visible{outline:2px solid ${T.borderFocus};outline-offset:2px;}
.s-btn:disabled{opacity:0.4;cursor:default;pointer-events:none;}
.s-btn-solid{background:${T.accent};color:${T.accentFg};}
.s-btn-solid:hover{background:${T.accentHover};}
.s-btn-solid:active{background:${T.accentActive};}
.s-btn-bordered{background:transparent;color:${T.fg};border-color:${T.border};}
.s-btn-bordered:hover{background:${T.accentWeak};}
.s-btn-transparent{background:transparent;color:${T.accent};}
.s-btn-transparent:hover{background:${T.bg2};}
.s-btn-neutral{background:${T.bg2};color:${T.fg};border-color:${T.border};}
.s-btn-neutral:hover{background:${T.bg3};}
.s-btn-negative{background:${T.negative};color:#fff;}
.s-btn-negative:hover{background:${T.negativeFg};}

.s-input{height:var(--h,28px);border:1px solid ${T.border};border-bottom:2px solid ${T.borderStrong};border-radius:var(--cr,4px) var(--cr,4px) 0 0;padding:0 var(--pad,8px);font-size:var(--fs,12px);font-family:${FONT};color:${T.fg};background:${T.bg};outline:none;transition:border-color var(--dur-fast) var(--ease);}
.s-input:hover{border-color:${T.borderStrong};}
.s-input:focus{border-bottom-color:${T.accent};}
.s-input::placeholder{color:${T.fg3};}
.s-input:disabled{background:${T.bg2};color:${T.fgDis};border-color:${T.bg3};}

.s-card{border-radius:var(--cr,6px);background:${T.bg};border:1px solid ${T.border};cursor:pointer;outline:none;transition:box-shadow var(--dur-norm) var(--ease),background var(--dur-fast) var(--ease);overflow:hidden;}
.s-card:hover{box-shadow:0 2px 6px ${T.shadowMed};background:${T.bg2};}
.s-card:focus-visible{outline:2px solid ${T.borderFocus};outline-offset:2px;}

.s-tab{padding:8px 12px;font-size:var(--fs,12px);font-weight:400;font-family:${FONT};color:${T.fg2};background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;outline:none;transition:color var(--dur-fast),border-color var(--dur-fast);}
.s-tab:hover{color:${T.fg};}
.s-tab.active{color:${T.accentText||T.accent};border-bottom-color:${T.accentText||T.accent};font-weight:600;}
.s-tab:focus-visible{outline:2px solid ${T.borderFocus};outline-offset:-2px;}

.s-sidebar-item{display:block;width:100%;padding:6px 10px;border-radius:var(--cr,4px);border:none;background:transparent;cursor:pointer;font-family:${FONT};font-size:var(--fs,12px);text-align:left;color:${T.fg2};transition:background var(--dur-fast) var(--ease);outline:none;}
.s-sidebar-item:hover{background:${T.bg2};color:${T.fg};}
.s-sidebar-item.active{background:${T.accentWeak};color:${T.accentText||T.accent};font-weight:600;}
`;

/* ── ICON HELPER ── */
const SIcon = ({name, size=16, color}) => {
  const d={
    check:"M20 6L9 17l-5-5",close:"M18 6L6 18M6 6l12 12",
    search:"M11 4a7 7 0 110 14 7 7 0 010-14zM18 18l3 3",
    chevronDown:"M6 9l6 6 6-6",chevronRight:"M9 6l6 6-6 6",chevronLeft:"M15 18l-6-6 6-6",
    menu:"M3 6h18M3 12h18M3 18h18",
    sun:"M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41M8 12a4 4 0 108 0 4 4 0 00-8 0z",
    moon:"M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
    arrowLeft:"M19 12H5M12 19l-7-7 7-7",
    info:"M12 3a9 9 0 110 18 9 9 0 010-18zM12 8h.01M12 11v5",
    success:"M12 3a9 9 0 110 18 9 9 0 010-18zM8 12l3 3 5-6",
    warning:"M12 2L2 20h20L12 2zM12 10v4M12 16.5h.01",
    error:"M12 3a9 9 0 110 18 9 9 0 010-18zM15 9l-6 6M9 9l6 6",
    person:"M12 4a4 4 0 110 8 4 4 0 010-8zM4 20c0-4 3.6-7 8-7s8 3 8 7",
    settings:"M12 8a4 4 0 100 8 4 4 0 000-8zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83",
    home:"M3 12l9-9 9 9M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
    notification:"M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
    filter:"M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    bookmark:"M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z",
    edit:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
    trash:"M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
    copy:"M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d={d[name]||""}/></svg>;
};

/* ── COMPONENT DEMOS ── */
function Buttons(){
  const sentiments=[
    {name:"Accented",bg:T.accent,fg:T.accentFg},
    {name:"Neutral",bg:T.bg3,fg:T.fg},
    {name:"Positive",bg:T.positive,fg:"#fff"},
    {name:"Caution",bg:T.caution,fg:"#fff"},
    {name:"Negative",bg:T.negative,fg:"#fff"},
  ];
  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>Appearances (from GitHub source)</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
      <button className="s-btn s-btn-solid">Solid</button>
      <button className="s-btn s-btn-bordered">Bordered</button>
      <button className="s-btn s-btn-transparent">Transparent</button>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:4,padding:"6px 8px",borderRadius:"var(--cr,4px)",border:`1px solid ${T.border}`,background:T.bg2}}>
      {[["solid","Filled background, contrast foreground. Primary CTA."],["bordered","Transparent with accent border. Secondary action."],["transparent","No background or border. Tertiary / inline action."]].map(([a,d])=>(
        <div key={a} style={{display:"flex",gap:6,alignItems:"baseline"}}><code style={{fontSize:10,color:T.accent,fontFamily:"monospace",background:T.accentWeak,padding:"0 4px",borderRadius:2,flexShrink:0}}>{a}</code><span style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>{d}</span></div>
      ))}
    </div>
    <div style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>Sentiments (× appearance)</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
      {sentiments.map(s=>(
        <button key={s.name} style={{height:"var(--h,28px)",padding:"0 var(--pad,8px)",borderRadius:"var(--cr,4px)",border:"none",background:s.bg,color:s.fg,fontSize:"var(--fs,12px)",fontWeight:600,fontFamily:FONT,cursor:"pointer"}}>{s.name}</button>
      ))}
    </div>
    <div style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>States</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
      <button className="s-btn s-btn-solid">Default</button>
      <button className="s-btn s-btn-solid" style={{opacity:0.85}}>Hover</button>
      <button className="s-btn s-btn-solid" style={{opacity:0.7}}>Active</button>
      <button className="s-btn s-btn-solid" disabled>Disabled</button>
      <button className="s-btn s-btn-solid" style={{position:"relative",color:"transparent"}}>Loading<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:7,animation:"spin 1s linear infinite"}}/></div></button>
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>
      <code style={{fontFamily:"monospace",fontSize:10}}>{'<Button sentiment="accented" appearance="solid" disabled={false}>'}</code>
      <br/>3 appearances × 5 sentiments × 6 states (Default, Hover, Active, Disabled, Loading, Focus).
    </div>
  </div>;
}

function Inputs(){
  const [v1,setV1]=useState(""); const [v2,setV2]=useState("");
  return <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
    <div style={{display:"flex",flexDirection:"column",gap:4,width:200}}>
      <label style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>Full name</label>
      <input className="s-input" value={v1} onChange={e=>setV1(e.target.value)} placeholder="Enter name"/>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:4,width:200}}>
      <label style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>Email</label>
      <input className="s-input" value={v2} onChange={e=>setV2(e.target.value)} placeholder="you@example.com"/>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:4,width:200}}>
      <label style={{fontSize:11,fontWeight:600,color:T.fgDis,fontFamily:FONT}}>Disabled</label>
      <input className="s-input" disabled placeholder="Cannot edit"/>
    </div>
  </div>;
}

function Checkboxes(){
  const [ch,setCh]=useState([true,false,false,false]);
  const labels=["Checked","Unchecked","Error","Disabled"];
  const colors=[T.accent,T.borderStrong,T.negative,T.fgDis];
  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
      {labels.map((l,i)=>(
        <label key={i} style={{display:"flex",alignItems:"center",gap:6,cursor:i===3?"default":"pointer",fontSize:12,fontFamily:FONT,color:i===2?T.negative:i===3?T.fgDis:T.fg,opacity:i===3?0.5:1}} onClick={()=>{if(i<3){const n=[...ch];n[i]=!n[i];setCh(n);}}}>
          <div style={{width:16,height:16,borderRadius:3,border:`2px solid ${ch[i]?colors[i]:colors[i]}`,background:ch[i]?colors[i]:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {ch[i]&&<SIcon name="check" size={10} color={i===2?"#fff":T.accentFg}/>}
          </div>{l}
        </label>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>States: Checked, Unchecked, Indeterminate, Error (negative), Disabled (40% opacity). Validation via Form Field wrapper.</div>
  </div>;
}

function Radios(){
  const [sel,setSel]=useState(0);
  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
      {["Option A","Option B","Error","Disabled"].map((l,i)=>(
        <label key={i} style={{display:"flex",alignItems:"center",gap:6,cursor:i===3?"default":"pointer",fontSize:12,fontFamily:FONT,color:i===2?T.negative:i===3?T.fgDis:T.fg,opacity:i===3?0.5:1}} onClick={()=>{if(i<3)setSel(i);}}>
          <div style={{width:16,height:16,borderRadius:8,border:`2px solid ${i===2?T.negative:sel===i?T.accent:T.borderStrong}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {sel===i&&<div style={{width:8,height:8,borderRadius:4,background:i===2?T.negative:T.accent}}/>}
          </div>{l}
        </label>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>States: Selected, Unselected, Error (negative color), Disabled. Single selection within group.</div>
  </div>;
}

function Switches(){
  const [a,setA]=useState(true);const [b,setB]=useState(false);
  return <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
    {[[a,setA,"Wi-Fi"],[b,setB,"Bluetooth"]].map(([v,set,l],i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>set(!v)} role="switch" aria-checked={v} style={{width:36,height:18,borderRadius:9,background:v?T.accent:T.bg3,border:`1px solid ${v?T.accent:T.borderStrong}`,cursor:"pointer",position:"relative",outline:"none",padding:0,transition:"all 200ms cubic-bezier(0.2,0,0,1)"}}>
          <div style={{position:"absolute",width:12,height:12,borderRadius:6,background:v?T.accentFg:T.fg,top:2,left:v?20:2,transition:"all 200ms cubic-bezier(0.2,0,0,1)"}}/>
        </button>
        <span style={{fontFamily:FONT,fontSize:12,color:T.fg}}>{l}</span>
      </div>
    ))}
  </div>;
}

function SaltCards(){
  return <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
    {[["Q3 Report","Updated 2h ago"],["Risk Analysis","Updated yesterday"],["Trading Desk","Updated 3d ago"]].map(([t,s],i)=>(
      <button key={i} className="s-card" style={{width:180,textAlign:"left",fontFamily:FONT}}>
        <div style={{height:48,background:`linear-gradient(135deg,${T.accentWeak},${T.bg3})`}}/>
        <div style={{padding:10}}><div style={{fontSize:13,fontWeight:600,color:T.fg}}>{t}</div><div style={{fontSize:11,color:T.fg3,marginTop:3}}>{s}</div></div>
      </button>
    ))}
  </div>;
}

function TabsComp(){
  const [t,setT]=useState(0);
  return <div>
    <div style={{display:"flex",borderBottom:`1px solid ${T.border}`}}>
      {["Overview","Positions","Orders","History"].map((l,i)=>(<button key={i} className={`s-tab${t===i?" active":""}`} onClick={()=>setT(i)}>{l}</button>))}
    </div>
    <div style={{padding:12,fontSize:12,color:T.fg2,fontFamily:FONT}}>Content for "{["Overview","Positions","Orders","History"][t]}" tab.</div>
  </div>;
}

function Banners(){
  return <div style={{display:"flex",flexDirection:"column",gap:6,width:"100%"}}>
    {[["info",T.infoWeak,T.infoFg,T.info,"Server maintenance scheduled for tonight."],
      ["positive",T.positiveWeak,T.positiveFg,T.positive,"Trade executed successfully."],
      ["caution",T.cautionWeak,T.cautionFg,T.caution,"Market data may be delayed."],
      ["negative",T.negativeWeak,T.negativeFg,T.negative,"Connection lost. Retrying..."]
    ].map(([k,bg,fg,border,msg])=>(
      <div key={k} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:4,background:bg,color:fg,fontFamily:FONT,fontSize:12,borderLeft:`3px solid ${border}`}}>{msg}</div>
    ))}
  </div>;
}

function DialogDemo(){
  const [status,setStatus]=useState("Default");
  const statuses=["Default","Info","Success","Warning","Error"];
  const statusColors={Default:T.fg,Info:T.info,Success:T.positive,Warning:T.caution,Error:T.negative};
  const statusIcons={Default:null,Info:"info",Success:"success",Warning:"warning",Error:"error"};
  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
      {statuses.map(s=>(
        <button key={s} onClick={()=>setStatus(s)} style={{padding:"4px 10px",borderRadius:"var(--cr,4px)",border:status===s?`2px solid ${statusColors[s]}`:`1px solid ${T.border}`,background:status===s?statusColors[s]+"18":"transparent",color:status===s?statusColors[s]:T.fg2,fontSize:11,fontWeight:status===s?600:400,fontFamily:FONT,cursor:"pointer"}}>{s}</button>
      ))}
    </div>
    <div style={{borderRadius:8,background:T.bg,border:`1px solid ${T.border}`,padding:16,boxShadow:`0 4px 16px ${T.shadowMed}`,maxWidth:320}}>
      {statusIcons[status]&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,padding:"6px 8px",borderRadius:"var(--cr,4px)",background:statusColors[status]+"18"}}>
        <SIcon name={statusIcons[status]} size={16} color={statusColors[status]}/>
        <span style={{fontSize:12,fontWeight:600,color:statusColors[status],fontFamily:FONT}}>{status}</span>
      </div>}
      <div style={{fontSize:14,fontWeight:600,color:T.fg,fontFamily:FONT,marginBottom:6}}>Dialog Title</div>
      <div style={{fontSize:12,color:T.fg3,fontFamily:FONT,marginBottom:16}}>Dialog content with {status.toLowerCase()} status indicator.</div>
      <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
        <button className="s-btn s-btn-bordered">Cancel</button>
        <button className="s-btn s-btn-solid">Confirm</button>
      </div>
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>5 status variants: Default, Info, Success, Warning, Error. Status header with icon and color. Dismissible with close or action buttons.</div>
  </div>;
}

function Badges(){
  return <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
    {[[T.accent,"3"],[T.negative,"!"],[T.positive,"✓"],[T.caution,"5"],[T.bg3,null]].map(([bg,txt],i)=>(
      <span key={i} style={{minWidth:txt?18:8,height:txt?18:8,borderRadius:9,background:bg,color:bg===T.bg3?T.fg2:"#fff",fontSize:10,fontWeight:600,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:txt?"0 4px":0,fontFamily:FONT}}>{txt}</span>
    ))}
  </div>;
}

function Avatars(){
  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",gap:12,alignItems:"center"}}>
      {[{s:32,n:"JD",status:null},{s:32,n:"KS",status:T.positive},{s:32,n:"AB",status:T.caution},{s:32,n:"CD",status:T.negative},{s:32,n:"EF",status:T.fg3}].map((a,i)=>(
        <div key={i} style={{position:"relative"}}>
          <div style={{width:a.s,height:a.s,borderRadius:a.s/2,background:[T.accent,"#2A8285","#BD5A13","#A25BAD","#996C48"][i],color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:a.s*0.38,fontWeight:600,fontFamily:FONT}}>{a.n}</div>
          {a.status&&<div style={{position:"absolute",bottom:-1,right:-1,width:10,height:10,borderRadius:5,background:a.status,border:`2px solid ${T.bg}`}}/>}
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Status indicators: Online (green), Away (orange), Busy (red), Offline (gray). Sizes scale with density. Backgrounds from categorical palette.</div>
  </div>;
}

function Tooltips(){
  return <div style={{display:"flex",gap:16}}>
    {["Hover me","Another"].map((l,i)=>(
      <div key={i} style={{position:"relative",display:"inline-block"}} className="s-tooltip-wrap">
        <button className="s-btn s-btn-neutral">{l}</button>
        <div style={{position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",background:T.bgInv,color:T.fgInv,borderRadius:4,padding:"4px 8px",fontSize:11,fontFamily:FONT,whiteSpace:"nowrap",opacity:0,pointerEvents:"none",transition:"opacity 150ms",boxShadow:`0 2px 6px ${T.shadowMed}`}} className="s-tip">Tooltip text</div>
      </div>
    ))}
    <style>{`.s-tooltip-wrap:hover .s-tip{opacity:1!important;}`}</style>
  </div>;
}

function ProgressDemo(){
  const [v,setV]=useState(65);
  return <div style={{width:"100%",display:"flex",flexDirection:"column",gap:12}}>
    <div><div style={{fontFamily:FONT,fontSize:11,color:T.fg3,marginBottom:4}}>Processing: {v}%</div>
    <div style={{width:"100%",height:4,borderRadius:2,background:T.bg3}}><div style={{width:`${v}%`,height:"100%",borderRadius:2,background:T.accent,transition:"width 300ms"}}/></div></div>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:24,height:24,border:`3px solid ${T.bg3}`,borderTopColor:T.accent,borderRadius:12,animation:"s-spin 0.6s linear infinite"}}/>
      <span style={{fontFamily:FONT,fontSize:12,color:T.fg2}}>Loading...</span>
    </div>
    <style>{`@keyframes s-spin{to{transform:rotate(360deg);}}`}</style>
    <input type="range" min={0} max={100} value={v} onChange={e=>setV(+e.target.value)} style={{width:180}}/>
  </div>;
}

function Dividers(){
  return <div style={{display:"flex",flexDirection:"column",gap:12,width:"100%",fontFamily:FONT,fontSize:12,color:T.fg2}}>
    <div>Content above</div><div style={{height:1,background:T.border}}/><div>Content below</div>
    <div style={{height:1,background:T.border,marginLeft:16}}/><div style={{color:T.fg3}}>Inset divider above</div>
  </div>;
}

function SliderDemo(){
  const [v,setV]=useState(50);
  return <div style={{width:"100%"}}>
    <div style={{fontFamily:FONT,fontSize:11,color:T.fg3,marginBottom:6}}>Volume: {v}%</div>
    <input type="range" min={0} max={100} value={v} onChange={e=>setV(+e.target.value)} style={{width:"100%",accentColor:T.accent}}/>
  </div>;
}

function PillsDemo(){
  const [pills,setPills]=useState([{l:"React",a:true},{l:"TypeScript",a:true},{l:"Salt DS",a:false},{l:"WCAG",a:false}]);
  const toggle=i=>setPills(p=>{const n=[...p];n[i]={...n[i],a:!n[i].a};return n;});
  return <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
    {pills.map((p,i)=>(
      <button key={i} onClick={()=>toggle(i)} style={{height:22,padding:"0 10px",borderRadius:11,border:`1px solid ${p.a?T.accent:T.border}`,background:p.a?T.accentWeak:"transparent",color:p.a?T.accent:T.fg2,fontSize:11,fontWeight:p.a?600:400,fontFamily:FONT,cursor:"pointer",transition:"all 150ms",outline:"none"}}>{p.l}</button>
    ))}
  </div>;
}

function AccordionDemo(){
  const [open,setOpen]=useState(0);
  return <div style={{border:`1px solid ${T.border}`,borderRadius:6,overflow:"hidden"}}>
    {["Account settings","Notification preferences","Security & privacy"].map((l,i)=>(
      <div key={i}>
        {i>0&&<div style={{height:1,background:T.border}}/>}
        <button onClick={()=>setOpen(open===i?-1:i)} style={{width:"100%",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",background:open===i?T.bg2:"transparent",border:"none",cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:open===i?600:400,color:T.fg,outline:"none"}}>
          {l}<span style={{transform:open===i?"rotate(180deg)":"rotate(0)",transition:"transform 200ms",fontSize:10}}>▼</span>
        </button>
        {open===i&&<div style={{padding:"8px 14px 14px",fontSize:12,color:T.fg2,fontFamily:FONT,lineHeight:1.5}}>Configure your {l.toLowerCase()} here. All changes are saved automatically.</div>}
      </div>
    ))}
  </div>;
}

/* ── DESIGN LANGUAGE SECTIONS ── */
function DLColor(){
  const foundation = [
    {name:"Gray",role:"Neutral colors",shades:["#E6E9EB","#D3D5D8","#B1B5B9","#91959A","#72777D","#5F646A","#4C5157","#3A3F44","#292E33"]},
    {name:"Teal",role:"Accent",shades:["#DBF5F7","#AFE0ED","#83C0D6","#4CA1C2","#1B7F9E","#12647E","#094A60","#033142","#002538"]},
    {name:"Blue",role:"Info statuses",shades:["#EAF6FF","#C7DEFF","#9ABDF5","#669CE8","#0078CF","#005EA6","#00457E","#002D59","#001736"]},
    {name:"Green",role:"Success / Positive",shades:["#EAF5F2","#B8E5D1","#89CCAD","#53B087","#00875D","#006B48","#005637","#003F25","#002915"]},
    {name:"Red",role:"Error / Negative",shades:["#FFECEA","#FFC1BA","#FF938A","#FF5D57","#E52135","#BA1729","#910D1E","#690413","#450002"]},
    {name:"Orange",role:"Warning / Caution",shades:["#FFECD9","#FFC6A1","#F7A06A","#EB7B39","#C75300","#9E4200","#813600","#612900","#422000"]},
    {name:"Purple",role:"Ancillary color",shades:["#F6F0FA","#F0D6F5","#DAAFE0","#C388CC","#A25BAD","#85438F","#682D71","#491552","#33003B"]},
    {name:"Brown",role:"Brand accent",shades:["#F3EEE8","#EDE5D8","#D7BA9D","#B88A67","#996C48","#7D532F","#673F1B","#422407","#2E1905"]},
  ];
  const bgs = [
    {n:"snow",h:"#FFFFFF",m:"Light 1°"},{n:"marble",h:"#F5F7F8",m:"Light 2°"},
    {n:"limestone",h:"#FAF8F2",m:"Light 3°"},{n:"titanium",h:"#E2E4E5",m:"Light sep"},
    {n:"jet",h:"#101820",m:"Dark 1°"},{n:"granite",h:"#1A2229",m:"Dark 2°"},
    {n:"leather",h:"#26292B",m:"Dark 3°"},{n:"dk titanium",h:"#474C50",m:"Dark sep"},
  ];
  const catNames = ["Cat 1","Cat 2","Cat 3","Cat 4","Cat 5","Cat 6","Cat 7","Cat 8","Cat 9","Cat 10",
    "Cat 11","Cat 12","Cat 13","Cat 14","Cat 15","Cat 16","Cat 17","Cat 18","Cat 19","Cat 20"];
  const cat500 = ["#2A8285","#BD5A13","#AB6528","#877410","#4676BF","#23855E","#C24795","#996A45","#7665CF","#2D8543",
    "#946694","#667D15","#008094","#6D7C4D","#9F55C2","#B0549D","#BD5558","#697694","#72757A","#636EBF"];
  const shadeLabels = [100,200,300,400,500,600,700,800,900];
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{fontSize:12,color:T.fg3,fontFamily:FONT,lineHeight:1.5}}>8 foundation ramps × 9 shades (100–900). 20 categorical ramps × 9 shades. Named backgrounds. From Figma: Salt DS JPM Brand Colors.</div>

    <div style={{fontSize:13,fontWeight:600,color:T.fg,fontFamily:FONT}}>Foundation Ramps</div>
    <div style={{display:"flex",gap:1,marginBottom:2}}>
      <div style={{width:72}}/>
      {shadeLabels.map(s=><div key={s} style={{width:30,fontSize:8,color:T.fg3,fontFamily:"monospace",textAlign:"center"}}>{s}</div>)}
    </div>
    {foundation.map(r=>(
      <div key={r.name} style={{display:"flex",alignItems:"center",gap:1,marginBottom:1}}>
        <div style={{width:72}}>
          <div style={{fontSize:10,fontWeight:600,color:T.fg,fontFamily:FONT}}>{r.name}</div>
          <div style={{fontSize:8,color:T.fg3,fontFamily:FONT}}>{r.role}</div>
        </div>
        {r.shades.map((c,i)=><div key={i} title={`${r.name}-${shadeLabels[i]}: ${c}`} style={{width:30,height:22,borderRadius:2,background:c,border:i===4?`2px solid ${T.borderFocus}`:`1px solid ${T.border}15`}}/>)}
      </div>
    ))}
    <div style={{fontSize:9,color:T.fg3,fontFamily:FONT}}>500 (outlined) = mode-agnostic. Ramp inverts for dark mode (100↔900).</div>

    <div style={{fontSize:13,fontWeight:600,color:T.fg,fontFamily:FONT,marginTop:4}}>Named Backgrounds</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
      {bgs.map(b=>(
        <div key={b.n} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <div style={{width:46,height:28,borderRadius:3,background:b.h,border:`1px solid ${T.border}`}} title={b.h}/>
          <span style={{fontSize:8,fontWeight:600,color:T.fg,fontFamily:FONT}}>{b.n}</span>
          <span style={{fontSize:7,color:T.fg3,fontFamily:"monospace"}}>{b.h}</span>
        </div>
      ))}
    </div>

    <div style={{fontSize:13,fontWeight:600,color:T.fg,fontFamily:FONT,marginTop:4}}>Categorical Colors (20 ramps × 9 shades, shown at 500)</div>
    <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
      {cat500.map((c,i)=>(
        <div key={i} style={{width:24,height:24,borderRadius:3,background:c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,color:"#fff",fontWeight:600}} title={`${catNames[i]}: ${c}`}>{i+1}</div>
      ))}
    </div>
    <div style={{fontSize:9,color:T.fg3,fontFamily:FONT}}>1–20 mode-agnostic (4.5:1 on white/black). Used for data viz, avatars, calendars, badges.</div>
  </div>;
}

function DLIcons(){
  const cats = [
    {name:"Actions",count:59,samples:["bookmark","edit","filter","settings","copy","trash"]},
    {name:"Arrows",count:45,samples:["arrowLeft","chevronDown","chevronRight","chevronLeft"]},
    {name:"Communication",count:21,samples:["notification","info","warning","error"]},
    {name:"Data",count:23,samples:["filter","bookmark","search"]},
    {name:"Documents",count:38,samples:["copy","edit"]},
    {name:"Indicators",count:28,samples:["check","success","error","warning","info"]},
    {name:"Media",count:43,samples:["sun","moon","settings"]},
    {name:"Objects",count:37,samples:["home","bookmark","trash"]},
    {name:"Organize",count:52,samples:["menu","filter","search","settings"]},
    {name:"People",count:22,samples:["person"]},
    {name:"Finance",count:11,samples:["bookmark","copy"]},
    {name:"Computing",count:19,samples:["settings"]},
    {name:"Places",count:17,samples:["home"]},
    {name:"Logos",count:6,samples:[]},
    {name:"Accessibility",count:11,samples:[]},
  ];
  const styles = [
    {name:"Default",desc:"Outlined, 2px stroke. Primary style for UI.",weight:"2"},
    {name:"Solid",desc:"Filled variant. Use for selected/active states.",weight:"0"},
  ];
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{fontSize:12,color:T.fg3,fontFamily:FONT,lineHeight:1.5}}>salt-ds icons provides ~430 unique SVG icons in 2 styles across 15 categories. Icons scale with density (10/12/14/16px). From Figma: Salt DS Assets file.</div>

    <div style={{fontSize:13,fontWeight:600,color:T.fg,fontFamily:FONT}}>Styles: Default (Outline) + Solid (Filled)</div>
    <div style={{display:"flex",gap:16}}>
      {styles.map(s=>(
        <div key={s.name} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{display:"flex",gap:6}}>
            {["check","info","person","settings","home","search"].map(ic=>(
              <SIcon key={ic} name={ic} size={20} color={T.fg}/>
            ))}
          </div>
          <span style={{fontSize:10,fontWeight:600,color:T.fg,fontFamily:FONT}}>{s.name}</span>
          <span style={{fontSize:9,color:T.fg3,fontFamily:FONT}}>{s.desc}</span>
        </div>
      ))}
    </div>

    <div style={{fontSize:13,fontWeight:600,color:T.fg,fontFamily:FONT,marginTop:4}}>15 Categories (~430 icons)</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:6}}>
      {cats.map(c=>(
        <div key={c.name} style={{padding:"6px 8px",borderRadius:4,border:`1px solid ${T.border}`,background:T.bg}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:10,fontWeight:600,color:T.fg,fontFamily:FONT}}>{c.name}</span>
            <span style={{fontSize:9,color:T.fg3,fontFamily:"monospace"}}>{c.count}</span>
          </div>
          {c.samples.length>0 && <div style={{display:"flex",gap:4,marginTop:4}}>
            {c.samples.slice(0,4).map(ic=><SIcon key={ic} name={ic} size={14} color={T.fg3}/>)}
          </div>}
        </div>
      ))}
    </div>

    <div style={{fontSize:13,fontWeight:600,color:T.fg,fontFamily:FONT,marginTop:4}}>Density Sizing</div>
    <div style={{display:"flex",gap:16,alignItems:"flex-end"}}>
      {[{d:"High",s:10},{d:"Medium",s:12},{d:"Low",s:14},{d:"Touch",s:16}].map(z=>(
        <div key={z.d} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <SIcon name="settings" size={z.s} color={T.accent}/>
          <span style={{fontSize:9,color:T.fg3,fontFamily:FONT}}>{z.d} ({z.s}px)</span>
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Install: npm install salt-ds icons · Import: {"import { SearchIcon } from salt-ds/icons"}</div>
  </div>;
}

function DLTypography(){
  const ramp = [["Display 1",34,700],["Display 2",27,700],["Display 3",21,700],["Display 4",16,700],["H1",12,600],["H2",9,600],["H3",7,600],["H4",6,600],["Body",6,400],["Body Strong",6,600],["Label",5.5,600],["Notation",5,400]];
  const densityTable = [
    ["Display 1","54/70","68/88","84/109","102/133"],
    ["Display 2","42/55","54/70","68/88","84/109"],
    ["H1","18/24","24/32","32/42","42/54"],
    ["H2","14/18","18/24","24/32","32/42"],
    ["Body","11/14","12/16","14/18","16/20"],
    ["Label","10/13","11/14","12/16","14/18"],
  ];
  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{fontSize:12,color:T.fg3,fontFamily:FONT,marginBottom:4,lineHeight:1.5}}>Open Sans (body) + Amplitude (headers/buttons, JPM Brand) + PT Mono (code). Line height ≈ 1.3× font size. All sizes adjust with density.</div>
    {ramp.map(([n,s,w])=>(
      <div key={n} style={{display:"flex",alignItems:"baseline",gap:10,padding:"2px 0",borderBottom:`1px solid ${T.border}20`}}>
        <span style={{fontFamily:FONT,fontSize:Math.min(s*2,28),fontWeight:w,color:T.fg,flex:1,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n}</span>
        <span style={{fontSize:10,color:T.fg3,fontFamily:"monospace",whiteSpace:"nowrap",flexShrink:0}}>{w===700?"Bold":w===600?"Semi":"Regular"}</span>
      </div>
    ))}
    <div style={{marginTop:8}}>
      <div style={{fontSize:13,fontWeight:600,color:T.fg,fontFamily:FONT,marginBottom:6}}>Font Size / Line Height by Density</div>
      <div style={{borderRadius:6,border:`1px solid ${T.border}`,overflow:"hidden",fontSize:10,fontFamily:"monospace"}}>
        <div style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr 1fr 1fr",background:T.bg2,padding:"6px 8px",fontWeight:600,color:T.fg2,fontFamily:FONT,fontSize:10}}>
          <span>Style</span><span>High</span><span>Medium</span><span>Low</span><span>Touch</span>
        </div>
        {densityTable.map(([name,...vals])=>(
          <div key={name} style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr 1fr 1fr",padding:"4px 8px",borderTop:`1px solid ${T.border}30`,color:T.fg}}>
            <span style={{fontFamily:FONT,fontWeight:600,fontSize:10}}>{name}</span>
            {vals.map((v,i)=><span key={i} style={{color:i===1?T.accent:T.fg3}}>{v}</span>)}
          </div>
        ))}
      </div>
    </div>
  </div>;
}

function DLDensity(){
  const densities=[["High",20,4,11],["Medium",28,8,12],["Low",36,12,14],["Touch",44,16,16]];
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{fontSize:12,color:T.fg3,fontFamily:FONT,lineHeight:1.5}}>Salt's 4-density system uses a 4px scaling grid. All components, spacing, and type adjust proportionally. Use the <strong>density selector</strong> in the sidebar to preview live.</div>
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
      {densities.map(([name,h,sp,fs])=>(
        <div key={name} style={{flex:1,minWidth:100,padding:10,borderRadius:6,background:T.bg2,border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <div style={{width:28,height:h/1.5,borderRadius:3,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",color:T.accentFg,fontSize:9,fontWeight:600,fontFamily:FONT}}>{name[0]}</div>
            <div style={{fontSize:12,fontWeight:600,color:T.fg,fontFamily:FONT}}>{name}</div>
          </div>
          <div style={{fontSize:10,color:T.fg3,fontFamily:"monospace"}}>base: {h}px · sp100: {sp}px · font: {fs}px</div>
        </div>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <div style={{padding:10,borderRadius:4,background:T.positiveWeak,border:`1px solid ${T.positive}30`}}>
        <div style={{fontSize:11,fontWeight:600,color:T.positiveFg,fontFamily:FONT,marginBottom:4}}>✓ Changes</div>
        <div style={{fontSize:10,color:T.fg2,fontFamily:FONT,lineHeight:1.5}}>Height, padding, font size, spacing, corner radius, icon size, touch targets</div>
      </div>
      <div style={{padding:10,borderRadius:4,background:T.bg2,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:11,fontWeight:600,color:T.fg2,fontFamily:FONT,marginBottom:4}}>✗ Constant</div>
        <div style={{fontSize:10,color:T.fg3,fontFamily:FONT,lineHeight:1.5}}>Colors, border width (1px), token names, API, font weight, line-height ratio</div>
      </div>
    </div>
  </div>;
}

function DLElevation(){
  const shadows=[["lowest","0 1px 3px rgba(0,0,0,0.10)","Cards, subtle lift"],["lower","0 2px 4px rgba(0,0,0,0.10)","Raised, dropdowns"],["low","0 4px 8px rgba(0,0,0,0.15)","Floating, popovers"],["mediumLow","0 6px 10px rgba(0,0,0,0.20)","Dialogs, panels"],["medium","0 12px 40px rgba(0,0,0,0.30)","Drawers, overlays"]];
  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{fontSize:12,color:T.fg3,fontFamily:FONT,lineHeight:1.5}}>5 shadow levels (lowest→medium). Dark mode increases opacity (~3–5×). Z-index layering for stacking order.</div>
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
      {shadows.map(([n,sh,u])=>(
        <div key={n} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
          <div style={{width:64,height:64,borderRadius:6,background:T.bg,boxShadow:sh,border:`1px solid ${T.border}20`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:10,fontWeight:600,color:T.fg2,fontFamily:FONT}}>{n.split("-")[1]}</span>
          </div>
          <span style={{fontSize:9,color:T.fg3,fontFamily:FONT,textAlign:"center",maxWidth:64}}>{u}</span>
        </div>
      ))}
    </div>
  </div>;
}

function DLSpacing(){
  const sp=[[25,1],[50,2],[100,4],[150,6],[200,8],[300,12],[500,20],[700,28],[900,36]];
  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{fontSize:12,color:T.fg3,fontFamily:FONT,lineHeight:1.5}}>4px base unit (High density). Spacing scales proportionally with density. Fixed spacing (borders=1px) stays constant.</div>
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      {sp.map(([tok,px])=>(
        <div key={tok} style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:10,color:T.fg3,fontFamily:"monospace",width:24,textAlign:"right"}}>{tok}</span>
          <div style={{width:px*5,height:14,borderRadius:2,background:T.accent,opacity:0.3+px/16}}/>
          <span style={{fontSize:10,color:T.fg3,fontFamily:"monospace"}}>{px}px (high)</span>
        </div>
      ))}
    </div>
  </div>;
}

function DLTokens(){
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{fontSize:12,color:T.fg3,fontFamily:FONT,lineHeight:1.5}}>Salt uses a 3-layer token architecture: <strong>Foundation</strong> (raw values) → <strong>Palette</strong> (light/dark switching) → <strong>Characteristic</strong> (semantic purpose). Only vanilla CSS variables - no third-party libraries.</div>
    {[["Foundation","--salt-color-green-100 = rgb(234,245,242)","Raw hex/rgb values, spacing px, font sizes"],
      ["Palette","--salt-palette-positive-weak = green-100 (light) / green-900 (dark)","Mode switching layer, most practical place to customize themes"],
      ["Characteristic","--salt-status-success-background = palette-positive-weak","Semantic intent: actionable, category, container, content, editable, focused, layout, navigable, overlayable, selectable, sentiment, separable, status, target, text"]
    ].map(([level,example,desc])=>(
      <div key={level} style={{padding:12,borderRadius:6,background:T.bg2,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:13,fontWeight:600,color:T.fg,fontFamily:FONT}}>{level}</div>
        <code style={{fontSize:10,color:T.accent,fontFamily:"monospace",display:"block",margin:"4px 0"}}>{example}</code>
        <div style={{fontSize:11,color:T.fg3,fontFamily:FONT}}>{desc}</div>
      </div>
    ))}
  </div>;
}

function DLAccessibility(){
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{fontSize:12,color:T.fg3,fontFamily:FONT,lineHeight:1.6}}>WCAG 2.1 AA is a core requirement, not an afterthought. Categorical colors guarantee 4.5:1 against white/black text.</div>
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      {[["Color contrast","4.5:1 text, 3:1 large text & UI components"],["Focus","2px solid ring on all interactive elements"],["Touch targets","44×44px minimum at Touch density"],["Screen readers","JAWS + Chrome, NVDA + Firefox tested"],["Keyboard","Full navigation on all components"],["Reduced motion","prefers-reduced-motion respected"]].map(([t,d])=>(
        <div key={t} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:4,background:T.bg2,border:`1px solid ${T.border}30`}}>
          <span style={{color:T.positive,fontSize:12}}>✓</span>
          <div><div style={{fontSize:12,fontWeight:600,color:T.fg,fontFamily:FONT}}>{t}</div><div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>{d}</div></div>
        </div>
      ))}
    </div>
  </div>;
}

function DLContentDesign(){
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{fontSize:12,color:T.fg3,fontFamily:FONT,lineHeight:1.5}}>Words are a design material - as essential as color or iconography. Content design eases complex tasks by highlighting key decisions and simplifying interactions.</div>
    {[["Keep it simple","Turn on notifications","You can enable the notification feature in settings"],
      ["Get to the point","3 trades executed","The 3 trades you initiated have been successfully executed"],
      ["Talk like a person","Something went wrong. Try again.","An unexpected error has occurred. Please retry."]
    ].map(([t,good,bad])=>(
      <div key={t} style={{borderRadius:6,border:`1px solid ${T.border}`,overflow:"hidden"}}>
        <div style={{padding:"8px 12px",background:T.bg2,fontFamily:FONT,fontSize:12,fontWeight:600,color:T.fg}}>{t}</div>
        <div style={{display:"flex"}}>
          <div style={{flex:1,padding:"6px 12px",borderRight:`1px solid ${T.border}30`}}>
            <div style={{fontSize:9,fontWeight:600,color:T.positiveFg,textTransform:"uppercase",marginBottom:2}}>✓ Do</div>
            <div style={{fontSize:11,color:T.fg,fontFamily:FONT}}>{good}</div>
          </div>
          <div style={{flex:1,padding:"6px 12px"}}>
            <div style={{fontSize:9,fontWeight:600,color:T.negativeFg,textTransform:"uppercase",marginBottom:2}}>✗ Don't</div>
            <div style={{fontSize:11,color:T.fg,fontFamily:FONT}}>{bad}</div>
          </div>
        </div>
      </div>
    ))}
    <div style={{display:"flex",flexDirection:"column",gap:2}}>
      {[["Present tense","\"File uploads\" not \"File will upload\""],["Active voice","\"You saved the file\" not \"The file was saved\""],["Sentence case","Capitalize only first word + proper nouns"],["Numerals","Use \"3\" not \"three\""]].map(([r,e])=>(
        <div key={r} style={{display:"flex",gap:8,padding:"4px 0",borderBottom:`1px solid ${T.border}15`}}>
          <span style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT,minWidth:100}}>{r}</span>
          <span style={{fontSize:11,color:T.fg3,fontFamily:FONT}}>{e}</span>
        </div>
      ))}
    </div>
  </div>;
}

/* ── PATTERN DEMOS ── */

function PatDashboard(){
  return <div style={{display:"flex",flexDirection:"column",gap:12,fontFamily:FONT}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
      {[{l:"Revenue",v:"$42.8K",p:60},{l:"Users",v:"1,247",p:75},{l:"Growth",v:"+18%",p:90}].map(s=>
        <div key={s.l} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",padding:10}}>
          <div style={{fontSize:10,color:T.fg3}}>{s.l}</div>
          <div style={{fontSize:16,fontWeight:700,color:T.fg}}>{s.v}</div>
          <div style={{height:3,borderRadius:2,background:T.border,marginTop:6}}><div style={{width:`${s.p}%`,height:"100%",borderRadius:2,background:T.accent}}/></div>
        </div>
      )}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8}}>
      <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",padding:12}}>
        <div style={{fontSize:11,fontWeight:600,color:T.fg,marginBottom:8}}>Monthly Revenue</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:4,height:60}}>
          {[40,65,50,80,70,90,75].map((h,i)=><div key={i} style={{flex:1,background:T.accent,borderRadius:2,height:`${h}%`,opacity:0.7+i*0.04}}/>)}
        </div>
      </div>
      <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",padding:12}}>
        <div style={{fontSize:11,fontWeight:600,color:T.fg,marginBottom:8}}>By Region</div>
        {[{l:"NA",w:80},{l:"EMEA",w:65},{l:"APAC",w:45}].map(r=>
          <div key={r.l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            <span style={{fontSize:9,color:T.fg3,width:30}}>{r.l}</span>
            <div style={{flex:1,height:6,borderRadius:3,background:T.border}}><div style={{width:`${r.w}%`,height:"100%",borderRadius:3,background:T.accent}}/></div>
          </div>
        )}
      </div>
    </div>
    <div style={{fontSize:10,color:T.fg3}}>Analytical dashboard: stat cards + bar chart + horizontal bars. Components: Card, Progress, Charts.</div>
  </div>;
}

function PatForm(){
  const [valid,setValid]=useState(true);
  return <div style={{display:"flex",flexDirection:"column",gap:10,fontFamily:FONT,maxWidth:320}}>
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <label style={{fontSize:11,fontWeight:600,color:T.fg}}>Full Name <span style={{color:T.negative}}>*</span></label>
      <input className="s-input" placeholder="Jane Doe" style={{fontSize:12}}/>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <label style={{fontSize:11,fontWeight:600,color:T.fg}}>Email <span style={{color:T.negative}}>*</span></label>
      <input className="s-input" placeholder="jane@company.com" style={{fontSize:12,borderColor:valid?undefined:T.negative}} onChange={e=>setValid(e.target.value.includes("@")||!e.target.value)}/>
      {!valid&&<span style={{fontSize:10,color:T.negative}}>Please enter a valid email</span>}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <label style={{fontSize:11,fontWeight:600,color:T.fg}}>Department</label>
      <div style={{display:"flex",alignItems:"center",height:"var(--h,28px)",border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",padding:"0 var(--pad,8px)",background:T.bg,fontSize:12,color:T.fg2}}>Select department...</div>
    </div>
    <div style={{display:"flex",gap:6,marginTop:4}}>
      <button className="s-btn s-btn-solid" style={{fontSize:12}}>Submit</button>
      <button className="s-btn s-btn-bordered" style={{fontSize:12}}>Cancel</button>
    </div>
    <div style={{fontSize:10,color:T.fg3}}>Form pattern: FormField + Input + Dropdown + Button bar. Validation with FormFieldHelperText.</div>
  </div>;
}

function PatListDetail(){
  const [sel,setSel]=useState(0);
  const items=[{t:"Dashboard Report",d:"Q4 revenue analysis with regional breakdowns"},{t:"User Metrics",d:"Monthly active users and retention data"},{t:"System Alerts",d:"Infrastructure health and uptime monitoring"}];
  return <div style={{display:"flex",border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",overflow:"hidden",height:180,fontFamily:FONT}}>
    <div style={{width:160,borderRight:`1px solid ${T.border}`,overflowY:"auto"}}>
      {items.map((it,i)=><div key={i} onClick={()=>setSel(i)} style={{padding:8,fontSize:11,cursor:"pointer",borderBottom:`1px solid ${T.border}`,background:sel===i?T.accentWeak:"transparent",color:sel===i?T.accent:T.fg,fontWeight:sel===i?600:400,borderLeft:sel===i?`3px solid ${T.accent}`:"3px solid transparent"}}>{it.t}</div>)}
    </div>
    <div style={{flex:1,padding:12}}>
      <div style={{fontSize:13,fontWeight:600,color:T.fg,marginBottom:4}}>{items[sel].t}</div>
      <div style={{fontSize:11,color:T.fg3,lineHeight:1.5}}>{items[sel].d}</div>
      <div style={{marginTop:12,display:"flex",gap:6}}>
        <button className="s-btn s-btn-bordered" style={{fontSize:10,padding:"2px 8px",height:"auto",minWidth:0}}>Edit</button>
        <button className="s-btn s-btn-transparent" style={{fontSize:10,padding:"2px 8px",height:"auto",minWidth:0}}>Delete</button>
      </div>
    </div>
  </div>;
}

function PatAppShell(){
  return <div style={{border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",overflow:"hidden",fontFamily:FONT,fontSize:10}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",background:T.bg2,borderBottom:`1px solid ${T.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:18,height:18,borderRadius:4,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",color:T.accentFg,fontSize:8,fontWeight:700}}>A</div><span style={{fontWeight:600,color:T.fg}}>App Name</span></div>
      <div style={{display:"flex",gap:4}}><div style={{width:18,height:18,borderRadius:9,background:T.bg3}}/></div>
    </div>
    <div style={{display:"flex",height:100}}>
      <div style={{width:48,background:T.bg2,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"8px 0"}}>
        {["home","dashboard","settings"].map(i=><div key={i} style={{width:28,height:22,borderRadius:3,background:i==="home"?T.accentWeak:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}><span className="material-symbols-outlined" style={{fontSize:12,color:i==="home"?T.accent:T.fg3}}>{i}</span></div>)}
      </div>
      <div style={{flex:1,padding:8,color:T.fg3,display:"flex",alignItems:"center",justifyContent:"center"}}>Main Content Area</div>
    </div>
    <div style={{padding:"4px 10px",borderTop:`1px solid ${T.border}`,color:T.fg3,fontSize:9,background:T.bg2}}>Footer · v1.0</div>
  </div>;
}

function PatLogin(){
  return <div style={{maxWidth:260,margin:"0 auto",fontFamily:FONT}}>
    <div style={{textAlign:"center",marginBottom:12}}>
      <div style={{width:36,height:36,borderRadius:8,background:T.accent,display:"inline-flex",alignItems:"center",justifyContent:"center",color:T.accentFg,fontSize:16,fontWeight:700,marginBottom:6}}>A</div>
      <div style={{fontSize:14,fontWeight:700,color:T.fg}}>Welcome back</div>
      <div style={{fontSize:11,color:T.fg3}}>Sign in to your account</div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div><label style={{fontSize:10,fontWeight:600,color:T.fg}}>Email</label><input className="s-input" placeholder="you@company.com" style={{fontSize:11,marginTop:2}}/></div>
      <div><label style={{fontSize:10,fontWeight:600,color:T.fg}}>Password</label><input className="s-input" type="password" placeholder="••••••••" style={{fontSize:11,marginTop:2}}/></div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><label style={{fontSize:10,color:T.fg2,display:"flex",gap:4,alignItems:"center"}}><input type="checkbox"/> Remember me</label><span style={{fontSize:10,color:T.accent,cursor:"pointer"}}>Forgot?</span></div>
      <button className="s-btn s-btn-solid" style={{width:"100%",marginTop:4}}>Sign In</button>
    </div>
  </div>;
}

function PatSettings(){
  const [tab,setTab]=useState(0);
  const tabs=["General","Security","Notifications"];
  return <div style={{display:"flex",border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",overflow:"hidden",height:160,fontFamily:FONT}}>
    <div style={{width:110,background:T.bg2,borderRight:`1px solid ${T.border}`,padding:4}}>
      {tabs.map((t,i)=><div key={t} onClick={()=>setTab(i)} style={{padding:"6px 8px",fontSize:11,cursor:"pointer",borderRadius:"var(--cr,4px)",background:tab===i?T.accentWeak:"transparent",color:tab===i?T.accent:T.fg2,fontWeight:tab===i?600:400,marginBottom:2}}>{t}</div>)}
    </div>
    <div style={{flex:1,padding:12}}>
      <div style={{fontSize:12,fontWeight:600,color:T.fg,marginBottom:8}}>{tabs[tab]}</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        <div><label style={{fontSize:10,color:T.fg2}}>Display Name</label><input className="s-input" defaultValue="Jane Doe" style={{fontSize:11,marginTop:2}}/></div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:10,color:T.fg2}}>Dark Mode</span><div style={{width:28,height:14,borderRadius:7,background:T.accent,cursor:"pointer",position:"relative"}}><div style={{width:10,height:10,borderRadius:5,background:T.accentFg,position:"absolute",top:2,right:2}}/></div></div>
      </div>
    </div>
  </div>;
}

function PatSearch(){
  return <div style={{display:"flex",flexDirection:"column",gap:8,fontFamily:FONT}}>
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",background:T.bg}}>
      <span className="material-symbols-outlined" style={{fontSize:16,color:T.fg3}}>search</span>
      <span style={{fontSize:12,color:T.fg3}}>Search components...</span>
    </div>
    <div style={{display:"flex",gap:4}}>
      {["All","Actions","Inputs","Navigation"].map((f,i)=><button key={f} className={`s-btn ${i===0?"s-btn-solid":"s-btn-bordered"}`} style={{fontSize:9,padding:"2px 8px",height:"auto",minWidth:0}}>{f}</button>)}
    </div>
    {[{t:"Button",d:"3 appearances × 5 sentiments"},{t:"Input",d:"Bottom-border accent on focus"},{t:"Tabs",d:"Underline-style active indicator"}].map(r=>
      <div key={r.t} style={{padding:8,border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:11,fontWeight:600,color:T.fg}}>{r.t}</div><div style={{fontSize:9,color:T.fg3}}>{r.d}</div></div>
        <span className="material-symbols-outlined" style={{fontSize:14,color:T.fg3}}>chevron_right</span>
      </div>
    )}
  </div>;
}

function PatWizard(){
  const [step,setStep]=useState(1);
  return <div style={{fontFamily:FONT}}>
    <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:12}}>
      {["Account","Profile","Review"].map((s,i)=><React.Fragment key={s}>
        {i>0&&<div style={{flex:1,height:2,background:i<=step?T.accent:T.border}}/>}
        <div onClick={()=>setStep(i)} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}>
          <div style={{width:20,height:20,borderRadius:10,background:i<step?T.accent:i===step?T.accent:T.border,color:i<=step?T.accentFg:T.fg3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:600}}>{i<step?"✓":i+1}</div>
          <span style={{fontSize:10,color:i===step?T.fg:T.fg3,fontWeight:i===step?600:400}}>{s}</span>
        </div>
      </React.Fragment>)}
    </div>
    <div style={{border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",padding:12,minHeight:60}}>
      <div style={{fontSize:11,fontWeight:600,color:T.fg,marginBottom:6}}>Step {step+1}: {["Account","Profile","Review"][step]}</div>
      {step===0&&<div><label style={{fontSize:10,color:T.fg2}}>Email</label><input className="s-input" placeholder="you@co.com" style={{fontSize:11,marginTop:2}}/></div>}
      {step===1&&<div><label style={{fontSize:10,color:T.fg2}}>Display Name</label><input className="s-input" placeholder="Jane Doe" style={{fontSize:11,marginTop:2}}/></div>}
      {step===2&&<div style={{fontSize:10,color:T.fg3}}>Review your information and submit.</div>}
    </div>
    <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
      <button className="s-btn s-btn-bordered" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0} style={{fontSize:10,opacity:step===0?0.3:1}}>Back</button>
      <button className="s-btn s-btn-solid" onClick={()=>setStep(Math.min(2,step+1))} style={{fontSize:10}}>{step===2?"Submit":"Next"}</button>
    </div>
  </div>;
}

function PatDataTable(){
  const cols=["Name","Status","Amount","Date"];
  const rows=[["Jane Doe","Active","$1,200","Apr 12"],["John Smith","Pending","$890","Apr 11"],["Alice Chen","Active","$2,340","Apr 10"]];
  return <div style={{fontFamily:FONT}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <div style={{display:"flex",gap:4}}>
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",fontSize:10,color:T.fg3}}><span className="material-symbols-outlined" style={{fontSize:12}}>filter_list</span>Filter</div>
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",fontSize:10,color:T.fg3}}><span className="material-symbols-outlined" style={{fontSize:12}}>search</span>Search</div>
      </div>
      <button className="s-btn s-btn-solid" style={{fontSize:10,padding:"2px 8px",height:"auto",minWidth:0}}>Export</button>
    </div>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
      <thead><tr>{cols.map(c=><th key={c} style={{textAlign:"left",padding:"6px 8px",borderBottom:`2px solid ${T.border}`,color:T.fg2,fontWeight:600,fontSize:10}}>{c}</th>)}</tr></thead>
      <tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j} style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,color:j===1?(c==="Active"?T.positive:T.caution):T.fg,fontWeight:j===1?600:400}}>{c}</td>)}</tr>)}</tbody>
    </table>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,fontSize:10,color:T.fg3}}>
      <span>Showing 1-3 of 24</span>
      <div style={{display:"flex",gap:2}}>{[1,2,3,"...","8"].map(p=><button key={p} className={`s-btn ${p===1?"s-btn-solid":"s-btn-bordered"}`} style={{fontSize:9,padding:"2px 6px",height:"auto",minWidth:0}}>{p}</button>)}</div>
    </div>
  </div>;
}

/* ── COMPONENT REGISTRY ── */
const CATS = ["Foundations","Components & Patterns","Patterns"];
const COMPS = [
  {id:"dl-color",name:"Color",cat:"Foundations",desc:"8 foundation ramps × 9 shades (incl. Brown). Named backgrounds (snow/marble/limestone/titanium + jet/granite/leather). 40 categorical colors. From Figma.",render:DLColor},
  {id:"dl-icons",name:"Iconography",cat:"Foundations",desc:"salt-ds icons - ~430 unique SVG icons in 2 styles (Default outline, Solid filled) across 15 categories. Density-responsive sizing.",render:DLIcons},
  {id:"dl-typography",name:"Typography",cat:"Foundations",desc:"Open Sans + Amplitude + PT Mono. 12 type styles. Line height 1.3×. Size adjusts with density.",render:DLTypography},
  {id:"dl-elevation",name:"Elevation",cat:"Foundations",desc:"5 shadow levels (lowest through medium). Shadow + z-index for depth. Dark mode doubles opacity.",render:DLElevation},
  {id:"dl-spacing",name:"Spacing",cat:"Foundations",desc:"4px base grid. Proportional scale (25–300). Fixed spacing for borders. Adjusts with density.",render:DLSpacing},
  {id:"dl-tokens",name:"Token Architecture",cat:"Foundations",desc:"3-layer system: Foundation (raw) → Palette (mode switch) → Characteristic (semantic). Pure CSS variables.",render:DLTokens},
  {id:"dl-a11y",name:"Accessibility",cat:"Foundations",desc:"WCAG 2.1 AA core. 4.5:1 contrast, focus rings, 44px touch targets, screen reader tested, reduced motion.",render:DLAccessibility},
  {id:"dl-density",name:"Density",cat:"Foundations",desc:"4 levels: High (20px), Medium (28px), Low (36px), Touch (44px). All on 4px scaling grid.",render:DLDensity},
  {id:"dl-content",name:"Content Design",cat:"Foundations",desc:"UX writing: simple, direct, human. Present tense, active voice, sentence case.",render:DLContentDesign},
  {id:"tokens",name:"Tokens",cat:"Foundations",desc:"Token reference for all design tokens - colors, spacing, typography, and elevation with contrast ratios.",render:()=>null},
  {id:"audit",name:"Design Audit",cat:"Foundations",desc:"Paste code to audit for raw hex values, wrong APIs, accessibility issues, and dark mode compliance.",render:()=>null},
  {id:"pat-dashboard",name:"Analytical Dashboard",cat:"Patterns",desc:"Stat cards, charts, and data tables composed into an analytics overview layout.",render:PatDashboard},
  {id:"pat-form",name:"Forms",cat:"Patterns",desc:"Input fields, validation, labels, and button bar composed into a data entry form.",render:PatForm},
  {id:"pat-list-detail",name:"List-Detail",cat:"Patterns",desc:"Master list alongside detail pane - email client, file browser, settings patterns.",render:PatListDetail},
  {id:"pat-app-shell",name:"App Shell",cat:"Patterns",desc:"Header, sidebar navigation, content area, and footer composed into a full application layout.",render:PatAppShell},
  {id:"pat-login",name:"Login / Auth",cat:"Patterns",desc:"Authentication form with brand header, inputs, validation, and action buttons.",render:PatLogin},
  {id:"pat-settings",name:"Settings Page",cat:"Patterns",desc:"Navigation sidebar with form sections for application configuration.",render:PatSettings},
  {id:"pat-search",name:"Search Results",cat:"Patterns",desc:"Search input with filterable result cards and pagination.",render:PatSearch},
  {id:"pat-wizard",name:"Wizard / Stepper",cat:"Patterns",desc:"Multi-step form with progress indicator, validation per step, and review.",render:PatWizard},
  {id:"pat-data-table",name:"Data Table Page",cat:"Patterns",desc:"Filter bar, sortable data grid, and pagination for tabular data views.",render:PatDataTable},
  {id:"charts",name:"Charts & Dataviz",cat:"Patterns",desc:"12 chart types: line, area, column, pie, scatter, bar, donut, spline, stacked column, gauge, heatmap, treemap.",render:()=>null},
  {id:"buttons",name:"Buttons",cat:"Components & Patterns",desc:"3 appearances: solid, bordered, transparent. 5 sentiments: accented, neutral, positive, caution, negative. States: Default, Hover, Active, Disabled, Loading, Focus.",render:Buttons},
  {id:"pills",name:"Pills / Tags",cat:"Components & Patterns",desc:"Toggle selection. Accent fill when active. Used for filters, categories, skills.",render:PillsDemo},
  {id:"inputs",name:"Text Input",cat:"Components & Patterns",desc:"Bottom-border accent on focus. Salt's signature flat-top input with strong baseline.",render:Inputs},
  {id:"checkboxes",name:"Checkbox",cat:"Components & Patterns",desc:"Accent fill when checked. Accessible with role='checkbox' and keyboard support.",render:Checkboxes},
  {id:"radios",name:"Radio Buttons",cat:"Components & Patterns",desc:"Single selection with accent ring + inner dot. Arrow key navigation within group.",render:Radios},
  {id:"switches",name:"Switch",cat:"Components & Patterns",desc:"Toggle on/off. Accent track when on. Thumb slides with decelerate easing.",render:Switches},
  {id:"slider",name:"Slider",cat:"Components & Patterns",desc:"Range input with accent color. Drag to select value.",render:SliderDemo},
  {id:"cards",name:"Cards",cat:"Components & Patterns",desc:"Hover lifts with shadow. Gradient header. Outline border + background shift.",render:SaltCards},
  {id:"tabs",name:"Tabs",cat:"Components & Patterns",desc:"Underline-style. Active shows accent underline + semibold. Content switches.",render:TabsComp},
  {id:"banners",name:"Banners",cat:"Components & Patterns",desc:"Info (blue), Positive (green), Caution (orange), Negative (red). Left accent border.",render:Banners},
  {id:"dialog",name:"Dialog",cat:"Components & Patterns",desc:"Floating modal with shadow-300. Title, body, action buttons. Financial confirmation pattern.",render:DialogDemo},
  {id:"badges",name:"Badges",cat:"Components & Patterns",desc:"Accent, negative, positive, caution, and dot variants. Pill-shaped counters.",render:Badges},
  {id:"avatars",name:"Avatars",cat:"Components & Patterns",desc:"Circular initials. Multiple sizes. Accent, blue, purple, red backgrounds.",render:Avatars},
  {id:"tooltips",name:"Tooltips",cat:"Components & Patterns",desc:"Hover-triggered. Inverted background. Fade-in transition.",render:Tooltips},
  {id:"progress",name:"Progress",cat:"Components & Patterns",desc:"Linear bar (4px) + circular spinner. Accent-colored. Determinate + indeterminate.",render:ProgressDemo},
  {id:"accordion",name:"Accordion",cat:"Components & Patterns",desc:"Expandable sections. Single open at a time. Chevron indicator rotates.",render:AccordionDemo},
  {id:"dividers",name:"Dividers",cat:"Components & Patterns",desc:"1px border line. Full-width and inset variants.",render:Dividers},
  {id:"form-field",name:"Form Field",cat:"Components & Patterns",desc:"Wraps inputs with label, helper text, validation, necessity indicator. States: Default, Hover, Active, Read-only, Disabled, Error.",render:FormField},
  {id:"link",name:"Link",cat:"Components & Patterns",desc:"3 variants: Accent, Primary, Secondary. States: Default, Hover, Active, Visited. Optional trailing icon.",render:LinkDemo},
  {id:"menu",name:"Menu",cat:"Components & Patterns",desc:"Grouped/basic templates. Items with icon, separator, secondary label. States: Default, Hover, Active, Disabled.",render:MenuDemo},
  {id:"toast",name:"Toast",cat:"Components & Patterns",desc:"Auto-dismiss notification. Sentiments: Info, Success, Warning, Error. Top-right positioning.",render:ToastDemo},
  {id:"toggle-btn",name:"Toggle Button",cat:"Components & Patterns",desc:"Toggle on/off selection. Single-select and multi-select groups. Works with icon buttons.",render:ToggleButtonDemo},
  {id:"segmented-btn",name:"Segmented Button Group",cat:"Components & Patterns",desc:"Connected buttons for single/multi select. Shape morphs on press. All densities (High/Medium/Low/Touch).",render:SegmentedButtonDemo},
  {id:"tag",name:"Tag",cat:"Components & Patterns",desc:"Removable labels for categorization. Dismissible (vs Pill which is selectable).",render:TagDemo},
  {id:"drawer",name:"Drawer",cat:"Components & Patterns",desc:"Slide-out panel. Primary/secondary. Border placement: Left, Right, Top, Bottom.",render:DrawerDemo},
  {id:"spinner",name:"Spinner",cat:"Components & Patterns",desc:"Indeterminate loading indicator. Sizes scale with density.",render:SpinnerDemo},
  {id:"list-box",name:"List Box",cat:"Components & Patterns",desc:"Single/multi-select list. Optional border. Keyboard nav. Used inside ComboBox, Dropdown.",render:ListBoxDemo},
  {id:"calendar",name:"Calendar",cat:"Components & Patterns",desc:"Composable: CalendarNavigation + CalendarWeekHeader + CalendarGrid. Modes: Single, Range, Multiselect, Offset. Day states: Selected, Range, Today, Unselectable, Disabled.",render:CalendarDemo},
  {id:"date-picker",name:"Date Picker",cat:"Components & Patterns",desc:"Composable: DatePicker > DatePickerSingleInput + DatePickerOverlay + DatePickerSinglePanel + DatePickerActions. Single/range. Requires LocalizationProvider. lab (RC).",render:DatePickerDemo},
  {id:"stepper",name:"Stepper",cat:"Components & Patterns",desc:"Horizontal/vertical progress steps. Active, Completed, Pending, Error states.",render:StepperDemo},
  {id:"pagination",name:"Pagination",cat:"Components & Patterns",desc:"Page navigation with prev/next. Truncation for large counts. Compact mode.",render:PaginationDemo},
  {id:"panel",name:"Panel",cat:"Components & Patterns",desc:"Contained section with optional header/close button.",render:PanelDemo},
  {id:"data-grid",name:"Data Grid",cat:"Components & Patterns",desc:"Primary/Secondary/Zebra fill. Column groups, multi-select, filter bar, sorting.",render:DataGridDemo},
  {id:"ag-grid",name:"AG Grid",cat:"Components & Patterns",desc:"AG Grid data table themed with Salt DS tokens. Sorting, filtering, pagination, row selection.",render:()=>null},
  {id:"table",name:"Table",cat:"Components & Patterns",desc:"Semantic HTML table. Simpler than Data Grid. Column alignment, zebra striping.",render:TableDemo},
  {id:"vert-nav",name:"Vertical Navigation",cat:"Components & Patterns",desc:"Sidebar navigation with active indicator. Supports nesting, icons, badges.",render:VerticalNavDemo},
  {id:"overlay",name:"Overlay / Scrim",cat:"Components & Patterns",desc:"Overlay positions content above page. Scrim is semi-transparent backdrop.",render:OverlayScrimDemo},
  {id:"file-drop",name:"File Drop Zone",cat:"Components & Patterns",desc:"Upload by click or drag-drop. States: Default, Drag-drop, Error, Success, Disabled.",render:FileDropZoneDemo},
  {id:"splitter",name:"Splitter",cat:"Components & Patterns",desc:"Drag handle to resize panes. Horizontal/vertical. Collapse to minimum.",render:SplitterDemo},
  {id:"skip-link",name:"Skip Link",cat:"Components & Patterns",desc:"Keyboard-only link on Tab focus. Jumps past navigation. WCAG 2.4.1.",render:SkipLinkDemo},
  {id:"nav-item",name:"Navigation Item",cat:"Components & Patterns",desc:"Horizontal/vertical nav items with active indicator. Icons, badges, nesting.",render:NavigationItemDemo},
  {id:"static-list",name:"Static List",cat:"Components & Patterns",desc:"Non-interactive display list. Icons, status indicators.",render:StaticListDemo},
  {id:"carousel",name:"Carousel",cat:"Components & Patterns",desc:"Slides with progress dots, autoplay, counter. Bordered/transparent.",render:CarouselDemo},
  {id:"combo-box",name:"ComboBox",cat:"Components & Patterns",desc:"Filterable dropdown. Variants: primary/secondary/tertiary. bordered prop. Keyboard nav. Multi-select available.",render:ComboBoxDemo},
  {id:"dropdown",name:"Dropdown",cat:"Components & Patterns",desc:"Select from predefined options. Variants: primary/secondary/tertiary. bordered prop. ValidationStatus support.",render:DropdownDemo},
  {id:"number-input",name:"Number Input",cat:"Components & Patterns",desc:"Increment/decrement stepper buttons. Variants: primary/secondary/tertiary. bordered, min, max, step props.",render:NumberInputDemo},
  {id:"multiline-input",name:"Multiline Input",cat:"Components & Patterns",desc:"Resizable text area. Same variant/bordered/validation API as Input. rows prop.",render:MultilineInputDemo},
  {id:"interactable-card",name:"Interactable Card",cat:"Components & Patterns",desc:"Clickable card with selection. Variants: primary/secondary/tertiary. Hover lift + focus ring.",render:InteractableCardDemo},
  {id:"collapsible",name:"Collapsible",cat:"Components & Patterns",desc:"Controlled open/close container. Used internally by Accordion. CSS transition. open prop.",render:CollapsibleDemo},
];


/* ── MISSING COMPONENTS (from Figma Components & Patterns file) ── */

function FormField(){
  const validations=[
    {status:"Default",color:T.fg,border:T.borderStrong,icon:null,helper:"Helper text provides guidance"},
    {status:"Error",color:T.negative,border:T.negative,icon:"error",helper:"Validation error - fix before continuing"},
    {status:"Warning",color:T.caution,border:T.caution,icon:"warning",helper:"Warning - review this value"},
    {status:"Success",color:T.positive,border:T.positive,icon:"success",helper:"Validated successfully"},
  ];
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>Validation States</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
      {validations.map(v=>(
        <div key={v.status} style={{display:"flex",flexDirection:"column",gap:2}}>
          <label style={{fontSize:11,fontWeight:600,color:v.status==="Default"?T.fg:v.color,fontFamily:FONT}}>Label *</label>
          <div style={{position:"relative"}}>
            <input className="s-input" defaultValue={v.status==="Default"?"":"Value"} placeholder="Enter value" style={{borderBottomColor:v.border,width:"100%",paddingRight:v.icon?24:undefined}}/>
            {v.icon&&<div style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)"}}><SIcon name={v.icon} size={14} color={v.color}/></div>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            {v.icon&&<SIcon name={v.icon} size={10} color={v.color}/>}
            <span style={{fontSize:10,color:v.status==="Default"?T.fg3:v.color,fontFamily:FONT}}>{v.helper}</span>
          </div>
          <span style={{fontSize:9,color:T.fg3,fontFamily:FONT,marginTop:2,background:T.bg2,padding:"1px 4px",borderRadius:2,alignSelf:"flex-start"}}>{v.status}</span>
        </div>
      ))}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <div style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>Interaction States</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {["Default","Hover","Active","Read-only","Disabled"].map(s=>(
          <span key={s} style={{fontSize:10,padding:"2px 8px",borderRadius:99,border:`1px solid ${T.border}`,color:s==="Disabled"?T.fgDis:T.fg,fontFamily:FONT,background:s==="Active"?T.accentWeak:s==="Disabled"?T.bg2:"transparent"}}>{s}</span>
        ))}
      </div>
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Wraps all input types. Supports: necessity indicator (required *), label position (top/left), helper text, adornments (leading/trailing icons), full border variant, multiline.</div>
  </div>;
}

function LinkDemo(){
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"flex",gap:16,alignItems:"center"}}>
      <a href="#" onClick={e=>e.preventDefault()} style={{color:T.accent,fontSize:12,fontFamily:FONT,textDecoration:"underline",cursor:"pointer"}}>Primary Link</a>
      <a href="#" onClick={e=>e.preventDefault()} style={{color:T.fg,fontSize:12,fontFamily:FONT,textDecoration:"underline",cursor:"pointer"}}>Secondary Link</a>
      <a href="#" onClick={e=>e.preventDefault()} style={{color:T.accent,fontSize:12,fontFamily:FONT,textDecoration:"none",cursor:"pointer"}}>No Underline</a>
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>3 variants: Accent, Primary, Secondary. States: Default, Hover, Active, Visited. Optional trailing icon for external links.</div>
  </div>;
}

function MenuDemo(){
  return <div style={{display:"flex",gap:16}}>
    <div style={{borderRadius:"var(--cr,4px)",border:`1px solid ${T.border}`,background:T.bg,minWidth:160,padding:"4px 0",boxShadow:`0 4px 8px ${T.shadow}`}}>
      {["Cut","Copy","Paste"].map((item,i)=>(
        <div key={i} style={{padding:"6px 12px",fontSize:12,color:T.fg,fontFamily:FONT,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
          <SIcon name={["edit","copy","copy"][i]} size={14} color={T.fg3}/>{item}
        </div>
      ))}
      <div style={{height:1,background:T.border,margin:"4px 0"}}/>
      <div style={{padding:"6px 12px",fontSize:12,color:T.fgDis,fontFamily:FONT}}>Delete</div>
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT,maxWidth:200}}>Grouped/basic templates. Items with icon, separator, secondary label, parent arrow. States: Default, Hover, Active, Disabled.</div>
  </div>;
}

function ToastDemo(){
  const toasts=[
    {status:"Info",bg:T.infoWeak,border:T.info,icon:"info",msg:"New update available"},
    {status:"Success",bg:T.positiveWeak,border:T.positive,icon:"success",msg:"Changes saved successfully"},
    {status:"Warning",bg:T.cautionWeak,border:T.caution,icon:"warning",msg:"Session expires in 5 minutes"},
    {status:"Error",bg:T.negativeWeak,border:T.negative,icon:"error",msg:"Failed to save - please retry"},
  ];
  const [visible,setVisible]=useState([true,true,true,true]);
  return <div style={{display:"flex",flexDirection:"column",gap:8}}>
    {toasts.map((t,i)=>visible[i]&&(
      <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:"var(--cr,4px)",background:t.bg,border:`1px solid ${t.border}`,fontFamily:FONT,fontSize:12,color:T.fg}}>
        <SIcon name={t.icon} size={16} color={t.border}/>
        <span style={{flex:1}}>{t.msg}</span>
        <span style={{fontSize:9,color:T.fg3,background:T.bg2,padding:"1px 4px",borderRadius:2}}>{t.status}</span>
        <button onClick={()=>{const v=[...visible];v[i]=false;setVisible(v);}} style={{background:"none",border:"none",cursor:"pointer",padding:0}}><SIcon name="close" size={14} color={T.fg3}/></button>
      </div>
    ))}
    {visible.some(v=>!v)&&<button className="s-btn s-btn-bordered" onClick={()=>setVisible([true,true,true,true])} style={{alignSelf:"flex-start"}}>Reset All</button>}
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>4 sentiments: Info, Success, Warning, Error. Auto-dismiss timer. Stacks vertically. Dismissible with close button.</div>
  </div>;
}

function ToggleButtonDemo(){
  const [sel,setSel]=useState([true,false,false]);
  const sentiments=[
    {name:"Accented",bg:T.accent,fg:T.accentFg},
    {name:"Neutral",bg:T.bg3,fg:T.fg},
    {name:"Positive",bg:T.positive,fg:"#fff"},
    {name:"Caution",bg:T.caution,fg:"#fff"},
    {name:"Negative",bg:T.negative,fg:"#fff"},
  ];
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>Multi-select toggle</div>
    <div style={{display:"flex",gap:4}}>
      {["Bold","Italic","Underline"].map((l,i)=>(
        <button key={i} onClick={()=>{const n=[...sel];n[i]=!n[i];setSel(n);}} className={`s-btn ${sel[i]?"s-btn-solid":"s-btn-bordered"}`} style={{minWidth:0,padding:"0 10px"}}>{l}</button>
      ))}
    </div>
    <div style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT,marginTop:4}}>Sentiments (selected state)</div>
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
      {sentiments.map(s=>(
        <button key={s.name} style={{height:"var(--h,28px)",padding:"0 var(--pad,8px)",borderRadius:"var(--cr,4px)",border:"none",background:s.bg,color:s.fg,fontSize:"var(--fs,12px)",fontWeight:600,fontFamily:FONT,cursor:"pointer"}}>{s.name}</button>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>5 sentiments: Accented, Neutral, Positive, Caution, Negative. 2 appearances: Solid, Bordered. States: Selected, Unselected, Hover, Active, Disabled.</div>
  </div>;
}

function SegmentedButtonDemo(){
  const [sel,setSel]=useState(0);
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"inline-flex",borderRadius:"var(--cr,4px)",overflow:"hidden",border:`1px solid ${T.border}`}}>
      {["Day","Week","Month"].map((l,i)=>(
        <button key={i} onClick={()=>setSel(i)} style={{padding:"6px 16px",border:"none",borderRight:i<2?`1px solid ${T.border}`:"none",background:sel===i?T.accent:"transparent",color:sel===i?T.accentFg:T.fg,fontSize:12,fontFamily:FONT,fontWeight:sel===i?600:400,cursor:"pointer"}}>{l}</button>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Connected buttons for single/multi select. Shape morphs on press. Works with all densities (High/Medium/Low/Touch).</div>
  </div>;
}

function TagDemo(){
  const [tags,setTags]=useState(["React","TypeScript","CSS"]);
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
      {tags.map((t,i)=>(
        <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:99,border:`1px solid ${T.border}`,fontSize:11,color:T.fg,fontFamily:FONT,background:T.bg2}}>
          {t}<button onClick={()=>setTags(tags.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><SIcon name="close" size={10} color={T.fg3}/></button>
        </span>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Removable labels for categorization. Separate from Pill - Tags are dismissible, Pills are selectable.</div>
  </div>;
}

function DrawerDemo(){
  const [open,setOpen]=useState(false);
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <button className="s-btn s-btn-solid" onClick={()=>setOpen(!open)} style={{alignSelf:"flex-start"}}>{open?"Close":"Open"} Drawer</button>
    {open&&<div style={{display:"flex",border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",overflow:"hidden",height:120}}>
      <div style={{width:200,background:T.bg,borderRight:`1px solid ${T.border}`,padding:12,display:"flex",flexDirection:"column",gap:6}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,fontWeight:600,color:T.fg,fontFamily:FONT}}>Drawer</span><button onClick={()=>setOpen(false)} style={{background:"none",border:"none",cursor:"pointer"}}><SIcon name="close" size={14} color={T.fg3}/></button></div>
        <div style={{fontSize:11,color:T.fg3,fontFamily:FONT}}>Panel content here</div>
      </div>
      <div style={{flex:1,background:T.bg2,padding:12,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:11,color:T.fg3}}>Main content</span></div>
    </div>}
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Primary/secondary drawer. Border placement: Left, Right, Top, Bottom. Optional close button.</div>
  </div>;
}

function SpinnerDemo(){
  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",gap:16,alignItems:"center"}}>
      {[16,24,36].map(s=>(
        <div key={s} style={{width:s,height:s,border:`2px solid ${T.bg3}`,borderTopColor:T.accent,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      ))}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Indeterminate loading indicator. Sizes scale with density. Use for async operations.</div>
  </div>;
}

function ListBoxDemo(){
  const [sel,setSel]=useState(1);
  const items=["Option Alpha","Option Beta","Option Gamma","Option Delta"];
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",background:T.bg,maxWidth:220}}>
      {items.map((item,i)=>(
        <div key={i} onClick={()=>setSel(i)} style={{padding:"6px 10px",fontSize:12,color:sel===i?T.accentFg:T.fg,background:sel===i?T.accent:"transparent",cursor:"pointer",fontFamily:FONT,borderTop:i?`1px solid ${T.border}20`:"none"}}>{item}</div>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Single/multi-select list. Optional border. Keyboard navigation. Used inside ComboBox, Dropdown, and Date Picker.</div>
  </div>;
}

/* Salt-styled mini dropdown for calendar month/year selectors */
function SaltMiniDropdown({value,options,onChange}){
  const [open,setOpen]=useState(false);
  return <div style={{position:"relative",display:"inline-block"}}>
    <button className="s-btn s-btn-bordered" onClick={()=>setOpen(!open)} style={{fontSize:11,padding:"2px 8px",height:"auto",minWidth:0,gap:4,display:"inline-flex",alignItems:"center"}}>
      {value}<SIcon name="chevronDown" size={8} color={T.fg2}/>
    </button>
    {open&&<>
      <div style={{position:"fixed",inset:0,zIndex:19}} onClick={()=>setOpen(false)}/>
      <div style={{position:"absolute",top:"100%",left:0,zIndex:20,marginTop:2,background:T.bg,border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",boxShadow:`0 2px 8px ${T.shadowMed}`,minWidth:80,maxHeight:140,overflowY:"auto"}}>
        {options.map(o=><div key={o} onClick={()=>{onChange(o);setOpen(false);}} style={{padding:"4px 8px",fontSize:11,color:o===value?T.accent:T.fg,fontWeight:o===value?600:400,background:o===value?T.accentWeak:"transparent",cursor:"pointer",fontFamily:FONT,whiteSpace:"nowrap"}} onMouseEnter={e=>e.currentTarget.style.background=T.bg2} onMouseLeave={e=>e.currentTarget.style.background=o===value?T.accentWeak:"transparent"}>{o}</div>)}
      </div>
    </>}
  </div>;
}

function CalendarDemo(){
  const [sel,setSel]=useState(15);
  const [rangeStart,setRangeStart]=useState(10);
  const [rangeEnd,setRangeEnd]=useState(18);
  const [mode,setMode]=useState("single");
  const [calMonth,setCalMonth]=useState("June");
  const [calYear,setCalYear]=useState("2025");
  const days=["Mo","Tu","We","Th","Fr","Sa","Su"];
  const dates=Array.from({length:35},(_,i)=>i<2?29+i:i<33?i-1:null);
  const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const years=["2024","2025","2026","2027"];
  const isInRange=(d)=>mode==="range"&&d&&d>=rangeStart&&d<=rangeEnd;
  const isStart=(d)=>mode==="range"&&d===rangeStart;
  const isEnd=(d)=>mode==="range"&&d===rangeEnd;
  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",gap:4}}>
      {["single","range","multiselect"].map(m=>(
        <button key={m} onClick={()=>setMode(m)} className={`s-btn ${mode===m?"s-btn-solid":"s-btn-bordered"}`} style={{fontSize:10,padding:"3px 8px",height:"auto",minWidth:0,textTransform:"capitalize"}}>{m}</button>
      ))}
    </div>
    <div style={{maxWidth:240}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <button className="s-btn s-btn-transparent" style={{padding:2,minWidth:0,height:"auto"}}><SIcon name="chevronLeft" size={14} color={T.fg3}/></button>
        <div style={{display:"flex",gap:4}}>
          <SaltMiniDropdown value={calMonth} options={months} onChange={setCalMonth}/>
          <SaltMiniDropdown value={calYear} options={years} onChange={setCalYear}/>
        </div>
        <button className="s-btn s-btn-transparent" style={{padding:2,minWidth:0,height:"auto"}}><SIcon name="chevronRight" size={14} color={T.fg3}/></button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,textAlign:"center"}}>
        {days.map(d=><div key={d} style={{fontSize:9,color:T.fg3,padding:3,fontFamily:FONT,fontWeight:600}}>{d}</div>)}
        {dates.map((d,i)=>{
          const selected=mode==="single"?d===sel:isStart(d)||isEnd(d);
          const inRange=isInRange(d);
          return d?<div key={i} onClick={()=>{if(mode==="single")setSel(d);}} style={{
            fontSize:10,padding:5,cursor:"pointer",fontFamily:FONT,
            borderRadius:isStart(d)?"var(--cr,4px) 0 0 var(--cr,4px)":isEnd(d)?"0 var(--cr,4px) var(--cr,4px) 0":selected?"var(--cr,4px)":"0",
            color:selected?T.accentFg:i<2?T.fg3:T.fg,
            background:selected?T.accent:inRange?T.accentWeak:"transparent",
            fontWeight:d===15?700:400,
          }}>{d}</div>:<div key={i}/>;
        })}
      </div>
    </div>
    <div style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>Composable Children</div>
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      {[
        ["CalendarNavigation","Month/year dropdowns + prev/next arrows"],
        ["CalendarWeekHeader","Day-of-week header row (Mo–Su)"],
        ["CalendarGrid","Grid of day buttons with selection states"],
      ].map(([name,desc])=>(
        <div key={name} style={{display:"flex",gap:6,alignItems:"baseline"}}>
          <code style={{fontSize:10,color:T.accent,fontFamily:"monospace",background:T.accentWeak,padding:"1px 4px",borderRadius:2}}>{name}</code>
          <span style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>{desc}</span>
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Selection modes: Single, Range (start/end), Multiselect, Offset. Day states: Default, Hover, Selected, Range start/end, In-range, Today (bold), Unselectable, Disabled, Out-of-month (muted).</div>
  </div>;
}

function StepperDemo(){
  const steps=["Details","Review","Confirm"];
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"flex",alignItems:"center",gap:0}}>
      {steps.map((s,i)=>(
        <React.Fragment key={i}>
          {i>0&&<div style={{flex:1,height:2,background:i<=1?T.accent:T.border}}/>}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{width:24,height:24,borderRadius:12,background:i<=1?T.accent:T.bg3,color:i<=1?T.accentFg:T.fg3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600}}>{i<1?<SIcon name="check" size={12} color={T.accentFg}/>:i+1}</div>
            <span style={{fontSize:10,color:i===1?T.fg:T.fg3,fontWeight:i===1?600:400,fontFamily:FONT}}>{s}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Horizontal/vertical stepper. States: Active, Completed, Pending, Error. Step numbering or custom icons.</div>
  </div>;
}

function PaginationDemo(){
  const [p,setP]=useState(3);
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
      <button onClick={()=>setP(Math.max(1,p-1))} className="s-btn s-btn-bordered" style={{minWidth:0,width:"var(--h,28px)",padding:0}}><SIcon name="chevronLeft" size={12}/></button>
      {[1,2,3,4,5].map(n=>(
        <button key={n} onClick={()=>setP(n)} style={{width:"var(--h,28px)",height:"var(--h,28px)",borderRadius:"var(--cr,4px)",border:p===n?`2px solid ${T.accent}`:`1px solid ${T.border}`,background:p===n?T.accentWeak:"transparent",color:p===n?T.accent:T.fg,fontSize:11,fontWeight:p===n?600:400,fontFamily:FONT,cursor:"pointer"}}>{n}</button>
      ))}
      <button onClick={()=>setP(Math.min(5,p+1))} className="s-btn s-btn-bordered" style={{minWidth:0,width:"var(--h,28px)",padding:0}}><SIcon name="chevronRight" size={12}/></button>
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Page navigation with prev/next arrows. Truncation for large page counts. Compact mode shows page input.</div>
  </div>;
}

function PanelDemo(){
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",overflow:"hidden"}}>
      <div style={{padding:"8px 12px",borderBottom:`1px solid ${T.border}`,background:T.bg2,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,fontWeight:600,color:T.fg,fontFamily:FONT}}>Panel Title</span>
        <SIcon name="close" size={14} color={T.fg3}/>
      </div>
      <div style={{padding:12,background:T.bg,fontSize:11,color:T.fg3,fontFamily:FONT}}>Panel content area. Configurable with header, actions, and content.</div>
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Contained section with optional header/close. Used for side panels, content grouping.</div>
  </div>;
}

function DataGridDemo(){
  const cols=["Name","Status","Value"];
  const rows=[["AAPL","Active","182.52"],["MSFT","Active","378.91"],["GOOGL","Pending","141.80"]];
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",overflow:"hidden",fontSize:11,fontFamily:FONT}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px",background:T.bg2,fontWeight:600,color:T.fg2}}>
        {cols.map(c=><div key={c} style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`}}>{c}</div>)}
      </div>
      {rows.map((r,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 80px 80px",borderBottom:i<2?`1px solid ${T.border}20`:"none"}}>
          {r.map((c,j)=><div key={j} style={{padding:"5px 10px",color:j===1&&c==="Pending"?T.caution:T.fg}}>{c}</div>)}
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Fill: Primary/Secondary/Zebra. Features: column groups, separators, multi-select, filter bar, sorting, pinned columns. AG Grid theme available via salt-ds ag-grid-theme.</div>
  </div>;
}

function VerticalNavDemo(){
  const [sel,setSel]=useState(0);
  const items=["Dashboard","Portfolio","Analytics","Settings"];
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{maxWidth:200,border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",background:T.bg,padding:4}}>
      {items.map((item,i)=>(
        <div key={i} onClick={()=>setSel(i)} style={{padding:"8px 12px",borderRadius:"var(--cr,4px)",fontSize:12,color:sel===i?T.accent:T.fg,background:sel===i?T.accentWeak:"transparent",fontWeight:sel===i?600:400,cursor:"pointer",fontFamily:FONT,borderLeft:sel===i?`2px solid ${T.accent}`:"2px solid transparent",display:"flex",alignItems:"center",gap:8}}>
          <SIcon name={["home","bookmark","filter","settings"][i]} size={14} color={sel===i?T.accent:T.fg3}/>{item}
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Vertical sidebar navigation with active indicator. Supports nesting, icons, badges. Horizontal variant also available.</div>
  </div>;
}

function OverlayScrimDemo(){
  const [show,setShow]=useState(false);
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <button className="s-btn s-btn-solid" onClick={()=>setShow(!show)} style={{alignSelf:"flex-start"}}>Toggle Overlay</button>
    <div style={{position:"relative",height:80,border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",overflow:"hidden"}}>
      <div style={{padding:12,fontSize:11,color:T.fg3,fontFamily:FONT}}>Content behind overlay</div>
      {show&&<div onClick={()=>setShow(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",borderRadius:"var(--cr,4px)"}}>
        <span style={{color:"#fff",fontSize:11,fontFamily:FONT}}>Click to dismiss</span>
      </div>}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Overlay: positions content above page. Scrim: semi-transparent backdrop behind modals/drawers. Click-outside to dismiss.</div>
  </div>;
}

function FileDropZoneDemo(){
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{border:`2px dashed ${T.border}`,borderRadius:"var(--cr,4px)",padding:20,textAlign:"center",background:T.bg2}}>
      <SIcon name="copy" size={24} color={T.fg3}/>
      <div style={{fontSize:12,color:T.fg,fontFamily:FONT,marginTop:6}}>Drop files here or <span style={{color:T.accent,textDecoration:"underline",cursor:"pointer"}}>browse</span></div>
      <div style={{fontSize:10,color:T.fg3,fontFamily:FONT,marginTop:2}}>500KB total file limit</div>
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>States: Default, Drag-drop (active), Error, Success, Disabled. Shows validation criteria text.</div>
  </div>;
}

function SplitterDemo(){
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"flex",height:80,border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",overflow:"hidden"}}>
      <div style={{flex:1,padding:10,background:T.bg,fontSize:11,color:T.fg3,fontFamily:FONT}}>Left panel</div>
      <div style={{width:6,background:T.bg3,cursor:"col-resize",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:2,height:20,borderRadius:1,background:T.borderStrong}}/></div>
      <div style={{flex:1,padding:10,background:T.bg2,fontSize:11,color:T.fg3,fontFamily:FONT}}>Right panel</div>
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Drag handle to resize panes. Horizontal/vertical orientation. Supports collapse to minimum size.</div>
  </div>;
}

function SkipLinkDemo(){
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{padding:"4px 8px",borderRadius:"var(--cr,4px)",background:T.accent,color:T.accentFg,fontSize:11,fontFamily:FONT,display:"inline-block",alignSelf:"flex-start"}}>Skip to main content</div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Keyboard-only link that appears on Tab focus. Jumps past repeated navigation to main content. Essential for accessibility (WCAG 2.4.1).</div>
  </div>;
}

function NavigationItemDemo(){
  const [sel,setSel]=useState(1);
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.border}`}}>
      {["Home","Products","Services","Contact"].map((item,i)=>(
        <button key={i} onClick={()=>setSel(i)} style={{padding:"8px 16px",fontSize:12,color:sel===i?T.accent:T.fg2,borderBottom:sel===i?`2px solid ${T.accent}`:"2px solid transparent",background:"none",border:"none",fontFamily:FONT,fontWeight:sel===i?600:400,cursor:"pointer"}}>{item}</button>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Horizontal/vertical navigation items with active indicator. Supports icons, badges, nesting. Group template for horizontal nav bars.</div>
  </div>;
}

function DatePickerDemo(){
  const [open,setOpen]=useState(false);
  const [date,setDate]=useState("15 Jun 2025");
  const [rangeStart,setRangeStart]=useState("15 Jun 2025");
  const [rangeEnd,setRangeEnd]=useState("22 Jun 2025");
  const days=["Mo","Tu","We","Th","Fr","Sa","Su"];
  const dates=Array.from({length:35},(_,i)=>i<2?29+i:i<33?i-1:null);
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>Single Date Picker (composable)</div>
    <div style={{position:"relative",maxWidth:220}}>
      <div style={{display:"flex",flexDirection:"column",gap:2}}>
        <label style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>Select Date</label>
        <div style={{display:"flex",alignItems:"center",height:"var(--h,28px)",border:`1px solid ${T.border}`,borderBottom:`2px solid ${open?T.accent:T.borderStrong}`,borderRadius:"var(--cr,4px) var(--cr,4px) 0 0",background:T.bg,padding:"0 var(--pad,8px)",gap:6}}>
          <input value={date} onChange={e=>setDate(e.target.value)} style={{flex:1,border:"none",background:"transparent",outline:"none",fontSize:"var(--fs,12px)",color:T.fg,fontFamily:FONT}}/>
          <button onClick={()=>setOpen(!open)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><SIcon name="calendar" size={14} color={T.accent}/></button>
        </div>
        <span style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>DD MMM YYYY</span>
      </div>
      {open&&<div style={{position:"absolute",top:"100%",left:0,zIndex:10,marginTop:4,background:T.bg,border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",boxShadow:`0 4px 16px ${T.shadowMed}`,padding:8,minWidth:200}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <button style={{background:"none",border:"none",cursor:"pointer",padding:2}}><SIcon name="chevronLeft" size={12} color={T.fg3}/></button>
          <div style={{display:"flex",gap:4}}>
            <SaltMiniDropdown value="June" options={["May","June","July","August"]} onChange={()=>{}}/>
            <SaltMiniDropdown value="2025" options={["2024","2025","2026"]} onChange={()=>{}}/>
          </div>
          <button style={{background:"none",border:"none",cursor:"pointer",padding:2}}><SIcon name="chevronRight" size={12} color={T.fg3}/></button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,textAlign:"center"}}>
          {days.map(d=><div key={d} style={{fontSize:9,color:T.fg3,padding:2,fontFamily:FONT,fontWeight:600}}>{d}</div>)}
          {dates.map((d,i)=>d?<div key={i} onClick={()=>{setDate(`${d} Jun 2025`);setOpen(false);}} style={{fontSize:10,padding:4,borderRadius:3,color:d===15?T.accentFg:i<2?T.fg3:T.fg,background:d===15?T.accent:"transparent",cursor:"pointer",fontFamily:FONT}}>{d}</div>:<div key={i}/>)}
        </div>
      </div>}
    </div>

    <div style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT,marginTop:4}}>Range Date Picker</div>
    <div style={{display:"flex",gap:8,alignItems:"flex-end",maxWidth:320}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
        <label style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Start</label>
        <input className="s-input" value={rangeStart} onChange={e=>setRangeStart(e.target.value)} style={{fontSize:11}}/>
      </div>
      <span style={{fontSize:11,color:T.fg3,paddingBottom:6}}>→</span>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
        <label style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>End</label>
        <input className="s-input" value={rangeEnd} onChange={e=>setRangeEnd(e.target.value)} style={{fontSize:11}}/>
      </div>
    </div>

    <div style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT,marginTop:4}}>Composable Architecture</div>
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      {[
        ["DatePicker","Context provider - wraps all children, manages selection state"],
        ["DatePickerSingleInput","Input pre-wired to single date selection context"],
        ["DatePickerRangeInput","Dual inputs pre-wired to range selection context"],
        ["DatePickerOverlay","Overlay container for calendar dropdown"],
        ["DatePickerSinglePanel","Calendar panel for single date selection"],
        ["DatePickerRangePanel","Calendar panel for date range selection"],
        ["DatePickerActions","Apply/Cancel buttons for confirming selection"],
      ].map(([name,desc])=>(
        <div key={name} style={{display:"flex",gap:8,alignItems:"baseline"}}>
          <code style={{fontSize:10,color:T.accent,fontFamily:"monospace",flexShrink:0,background:T.accentWeak,padding:"1px 4px",borderRadius:2}}>{name}</code>
          <span style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>{desc}</span>
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Requires LocalizationProvider with a date adapter (Day.js recommended). Supports timezone and locale configuration. lab package (RC).</div>
  </div>;
}

function TableDemo(){
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",overflow:"hidden",fontSize:11,fontFamily:FONT}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:T.bg2}}>
          {["Instrument","Bid","Ask","Change"].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"left",fontWeight:600,color:T.fg2,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {[["EUR/USD","1.0842","1.0844","+0.12%"],["GBP/USD","1.2716","1.2718","-0.05%"]].map((r,i)=>(
            <tr key={i}>{r.map((c,j)=><td key={j} style={{padding:"5px 10px",color:j===3?(c.startsWith("+")?T.positive:T.negative):T.fg,borderBottom:`1px solid ${T.border}20`}}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Semantic HTML table. Simpler alternative to Data Grid. Column alignment, zebra striping, compact density.</div>
  </div>;
}

function StaticListDemo(){
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{maxWidth:220,border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",background:T.bg}}>
      {["Portfolio Summary","Risk Analysis","Trade History","Compliance Report"].map((item,i)=>(
        <div key={i} style={{padding:"8px 12px",fontSize:12,color:T.fg,fontFamily:FONT,borderTop:i?`1px solid ${T.border}20`:"none",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:6,height:6,borderRadius:3,background:[T.accent,T.positive,T.caution,T.info][i]}}/>{item}
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Non-interactive display list. Supports icons, status indicators. Use for read-only data presentation.</div>
  </div>;
}

function CarouselDemo(){
  const [slide,setSlide]=useState(0);
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",overflow:"hidden"}}>
      <div style={{height:60,background:[T.accentWeak,T.positiveWeak,T.cautionWeak][slide],display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:T.fg,fontFamily:FONT}}>Slide {slide+1}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 8px"}}>
        <button onClick={()=>setSlide(Math.max(0,slide-1))} style={{background:"none",border:"none",cursor:"pointer"}}><SIcon name="chevronLeft" size={16} color={T.fg3}/></button>
        <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:3,background:i===slide?T.accent:T.border}}/>)}</div>
        <button onClick={()=>setSlide(Math.min(2,slide+1))} style={{background:"none",border:"none",cursor:"pointer"}}><SIcon name="chevronRight" size={16} color={T.fg3}/></button>
      </div>
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>Carousel with progress dots, autoplay toggle, slide counter. Controls: Left/Center/Right aligned. Bordered or transparent.</div>
  </div>;
}

/* ── PREVIEWS ── */

/* ── MISSING CORE COMPONENTS (from GitHub packages/core/src) ── */

function ComboBoxDemo(){
  const [val,setVal]=useState("");
  const [open,setOpen]=useState(false);
  const options=["Apple","Banana","Cherry","Date","Fig","Grape"];
  const filtered=options.filter(o=>o.toLowerCase().includes(val.toLowerCase()));
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{position:"relative",maxWidth:220}}>
      <div style={{display:"flex",flexDirection:"column",gap:2}}>
        <label style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>Fruit</label>
        <div style={{display:"flex",alignItems:"center",height:"var(--h,28px)",border:`1px solid ${T.border}`,borderBottom:`2px solid ${open?T.accent:T.borderStrong}`,borderRadius:"var(--cr,4px) var(--cr,4px) 0 0",background:T.bg,padding:"0 var(--pad,8px)"}}>
          <input value={val} onChange={e=>{setVal(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)} placeholder="Type to filter..." style={{flex:1,border:"none",background:"transparent",outline:"none",fontSize:"var(--fs,12px)",color:T.fg,fontFamily:FONT}}/>
          <button onClick={()=>setOpen(!open)} style={{background:"none",border:"none",cursor:"pointer",padding:0}}><SIcon name="chevronDown" size={12} color={T.fg3}/></button>
        </div>
      </div>
      {open&&filtered.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:10,marginTop:2,background:T.bg,border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",boxShadow:`0 4px 12px ${T.shadowMed}`,maxHeight:120,overflow:"auto"}}>
        {filtered.map(o=><div key={o} onClick={()=>{setVal(o);setOpen(false);}} style={{padding:"6px 10px",fontSize:12,color:T.fg,cursor:"pointer",fontFamily:FONT}}>{o}</div>)}
      </div>}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>
      <code style={{fontFamily:"monospace",fontSize:10}}>{'<ComboBox variant="primary" bordered={false}>'}</code>
      <br/>Filterable dropdown. Variants: primary/secondary/tertiary. bordered prop. Keyboard nav. Multi-select mode available.
    </div>
  </div>;
}

function DropdownDemo(){
  const [sel,setSel]=useState("Select...");
  const [open,setOpen]=useState(false);
  const options=["Option Alpha","Option Beta","Option Gamma","Option Delta"];
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{position:"relative",maxWidth:220}}>
      <label style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>Category</label>
      <button onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",height:"var(--h,28px)",border:`1px solid ${T.border}`,borderBottom:`2px solid ${open?T.accent:T.borderStrong}`,borderRadius:"var(--cr,4px) var(--cr,4px) 0 0",background:T.bg,padding:"0 var(--pad,8px)",fontSize:"var(--fs,12px)",color:sel==="Select..."?T.fg3:T.fg,fontFamily:FONT,cursor:"pointer"}}>
        {sel}<SIcon name="chevronDown" size={12} color={T.fg3}/>
      </button>
      {open&&<div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:10,marginTop:2,background:T.bg,border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",boxShadow:`0 4px 12px ${T.shadowMed}`}}>
        {options.map(o=><div key={o} onClick={()=>{setSel(o);setOpen(false);}} style={{padding:"6px 10px",fontSize:12,color:sel===o?(T.accentText||T.accent):T.fg,background:sel===o?T.accentWeak:"transparent",cursor:"pointer",fontFamily:FONT}}>{o}</div>)}
      </div>}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>
      <code style={{fontFamily:"monospace",fontSize:10}}>{'<Dropdown variant="primary" bordered={false}>'}</code>
      <br/>Select from predefined options. Variants: primary/secondary/tertiary. bordered prop. ValidationStatus support.
    </div>
  </div>;
}

function NumberInputDemo(){
  const [val,setVal]=useState(42);
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{maxWidth:160}}>
      <label style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>Quantity</label>
      <div style={{display:"flex",alignItems:"center",height:"var(--h,28px)",border:`1px solid ${T.border}`,borderBottom:`2px solid ${T.borderStrong}`,borderRadius:"var(--cr,4px) var(--cr,4px) 0 0",background:T.bg}}>
        <button onClick={()=>setVal(v=>v-1)} style={{width:"var(--h,28px)",height:"100%",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.fg3,fontSize:14}}>−</button>
        <input value={val} onChange={e=>setVal(+e.target.value||0)} style={{flex:1,border:"none",borderLeft:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,background:"transparent",textAlign:"center",outline:"none",fontSize:"var(--fs,12px)",color:T.fg,fontFamily:FONT}}/>
        <button onClick={()=>setVal(v=>v+1)} style={{width:"var(--h,28px)",height:"100%",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.fg3,fontSize:14}}>+</button>
      </div>
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>
      <code style={{fontFamily:"monospace",fontSize:10}}>{'<NumberInput variant="primary" min={0} max={100} step={1} />'}</code>
      <br/>Increment/decrement buttons. Variants: primary/secondary/tertiary. bordered, min, max, step props.
    </div>
  </div>;
}

function MultilineInputDemo(){
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <label style={{fontSize:11,fontWeight:600,color:T.fg,fontFamily:FONT}}>Description</label>
    <textarea style={{width:"100%",minHeight:60,border:`1px solid ${T.border}`,borderBottom:`2px solid ${T.borderStrong}`,borderRadius:"var(--cr,4px) var(--cr,4px) 0 0",background:T.bg,padding:"var(--pad,8px)",fontSize:"var(--fs,12px)",color:T.fg,fontFamily:FONT,outline:"none",resize:"vertical"}} placeholder="Enter multi-line text..." defaultValue="Line 1
Line 2
Line 3"/>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>
      <code style={{fontFamily:"monospace",fontSize:10}}>{'<MultilineInput variant="primary" bordered={false} rows={3} />'}</code>
      <br/>Resizable text area. Same variant/bordered/validation API as Input. Adornment support.
    </div>
  </div>;
}

function InteractableCardDemo(){
  const [sel,setSel]=useState(0);
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"flex",gap:8}}>
      {["Standard","Selected","Disabled"].map((label,i)=>(
        <div key={i} onClick={()=>i<2&&setSel(i)} className="s-card" style={{width:100,padding:10,cursor:i===2?"default":"pointer",opacity:i===2?0.5:1,border:sel===i?`2px solid ${T.accent}`:`1px solid ${T.border}`}}>
          <div style={{fontSize:12,fontWeight:600,color:T.fg,fontFamily:FONT}}>{label}</div>
          <div style={{fontSize:10,color:T.fg3,fontFamily:FONT,marginTop:4}}>Click me</div>
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>
      <code style={{fontFamily:"monospace",fontSize:10}}>{'<InteractableCard variant="primary" disabled={false} />'}</code>
      <br/>Clickable card with selection state. Variants: primary/secondary/tertiary. Hover lift + focus ring.
    </div>
  </div>;
}

function CollapsibleDemo(){
  const [open,setOpen]=useState(true);
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{border:`1px solid ${T.border}`,borderRadius:"var(--cr,4px)",overflow:"hidden"}}>
      <button onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"8px 12px",background:T.bg2,border:"none",cursor:"pointer",fontFamily:FONT,fontSize:12,fontWeight:600,color:T.fg}}>
        Collapsible Section <SIcon name={open?"chevronDown":"chevronRight"} size={14} color={T.fg3}/>
      </button>
      {open&&<div style={{padding:12,fontSize:12,color:T.fg3,fontFamily:FONT,borderTop:`1px solid ${T.border}`}}>Collapsed content is hidden when closed. Animated open/close transition.</div>}
    </div>
    <div style={{fontSize:10,color:T.fg3,fontFamily:FONT}}>
      <code style={{fontFamily:"monospace",fontSize:10}}>{'<Collapsible open={true}>{children}</Collapsible>'}</code>
      <br/>Controlled open/close. Used internally by Accordion. CSS transition animation.
    </div>
  </div>;
}

const PREVIEWS={
  "dl-color":()=><div style={{display:"flex",gap:2,padding:"6px 0"}}>{["#1B7F9E","#0078CF","#00875D","#E52135","#C75300","#A25BAD","#996C48"].map(c=><div key={c} style={{width:12,height:12,borderRadius:2,background:c}}/>)}</div>,
  "dl-icons":()=><div style={{display:"flex",gap:4,padding:"6px 0"}}><SIcon name="search" size={12} color={T.fg3}/><SIcon name="settings" size={12} color={T.fg3}/><SIcon name="home" size={12} color={T.fg3}/></div>,
  "dl-typography":()=><div style={{padding:"6px 0"}}><div style={{fontSize:11,fontWeight:700,color:T.fg}}>Aa</div><div style={{fontSize:7,color:T.fg3}}>Open Sans</div></div>,
  "dl-elevation":()=><div style={{display:"flex",gap:4,padding:"6px 0"}}>{[1,2,4].map(s=><div key={s} style={{width:16,height:12,borderRadius:2,background:T.bg,boxShadow:`0 ${s}px ${s*2}px ${T.shadow}`}}/>)}</div>,
  "dl-spacing":()=><div style={{display:"flex",gap:2,padding:"6px 0",alignItems:"flex-end"}}>{[4,8,12,16].map(s=><div key={s} style={{width:s,height:s,borderRadius:1,background:T.accent+"40"}}/>)}</div>,
  "dl-tokens":()=><div style={{padding:"6px 0",fontSize:7,color:T.fg3,fontFamily:"monospace"}}>foundation→palette→char</div>,
  "dl-a11y":()=><div style={{padding:"6px 0",display:"flex",gap:4,alignItems:"center"}}><div style={{width:14,height:14,borderRadius:7,border:`2px solid ${T.accent}`,fontSize:7,fontWeight:700,color:T.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>A</div><span style={{fontSize:7,color:T.fg3}}>AA</span></div>,
  "dl-density":()=><div style={{display:"flex",gap:2,padding:"6px 0",alignItems:"flex-end"}}>{[10,14,18,22].map(h=><div key={h} style={{width:20,height:h,borderRadius:2,background:T.bg3}}/>)}</div>,
  "dl-content":()=><div style={{padding:"6px 0",fontSize:7,color:T.fg3}}>✓ Clear · ✗ Jargon</div>,
  buttons:()=><div style={{display:"flex",gap:3,padding:"6px 0"}}><div style={{height:14,padding:"0 6px",borderRadius:3,background:T.accent,color:T.accentFg,fontSize:7,fontWeight:600,display:"flex",alignItems:"center"}}>Filled</div><div style={{height:14,padding:"0 6px",borderRadius:3,background:T.accentWeak,color:T.accent,fontSize:7,display:"flex",alignItems:"center"}}>Tonal</div></div>,
  pills:()=><div style={{display:"flex",gap:3,padding:"6px 0"}}>{["A","B"].map(t=><div key={t} style={{height:12,padding:"0 5px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:7,color:T.fg,display:"flex",alignItems:"center"}}>{t}</div>)}</div>,
  "toggle-btn":()=><div style={{display:"flex",gap:2,padding:"6px 0"}}><div style={{height:14,padding:"0 5px",borderRadius:3,background:T.accent,color:T.accentFg,fontSize:7,display:"flex",alignItems:"center"}}>B</div><div style={{height:14,padding:"0 5px",borderRadius:3,border:`1px solid ${T.border}`,fontSize:7,color:T.fg,display:"flex",alignItems:"center"}}>I</div></div>,
  "segmented-btn":()=><div style={{display:"flex",padding:"6px 0"}}>{["D","W","M"].map((l,i)=><div key={l} style={{height:14,padding:"0 6px",fontSize:7,background:i===0?T.accent:"transparent",color:i===0?T.accentFg:T.fg2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center"}}>{l}</div>)}</div>,
  tag:()=><div style={{display:"flex",gap:3,padding:"6px 0"}}>{["A","B"].map(t=><div key={t} style={{height:12,padding:"0 5px",borderRadius:8,background:T.bg2,fontSize:7,color:T.fg,display:"flex",alignItems:"center",gap:2}}>{t}×</div>)}</div>,
  checkboxes:()=><div style={{display:"flex",gap:4,padding:"6px 0"}}>{[true,false].map((c,i)=><div key={i} style={{width:10,height:10,borderRadius:2,border:`1.5px solid ${c?T.accent:T.border}`,background:c?T.accent:"transparent"}}/>)}</div>,
  radios:()=><div style={{display:"flex",gap:4,padding:"6px 0"}}>{[true,false].map((c,i)=><div key={i} style={{width:10,height:10,borderRadius:5,border:`1.5px solid ${c?T.accent:T.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>{c&&<div style={{width:5,height:5,borderRadius:3,background:T.accent}}/>}</div>)}</div>,
  switches:()=><div style={{display:"flex",gap:4,padding:"6px 0"}}><div style={{width:22,height:12,borderRadius:6,background:T.accent,position:"relative"}}><div style={{width:8,height:8,borderRadius:4,background:"#fff",position:"absolute",right:2,top:2}}/></div><div style={{width:22,height:12,borderRadius:6,background:T.bg3,position:"relative"}}><div style={{width:8,height:8,borderRadius:4,background:"#fff",position:"absolute",left:2,top:2}}/></div></div>,
  inputs:()=><div style={{padding:"6px 0"}}><div style={{height:14,borderRadius:2,border:`1px solid ${T.border}`,borderBottom:`2px solid ${T.accent}`,padding:"0 4px",fontSize:7,color:T.fg3,display:"flex",alignItems:"center"}}>Text</div></div>,
  slider:()=><div style={{padding:"8px 0"}}><div style={{position:"relative",height:4,background:T.bg3,borderRadius:2}}><div style={{width:"60%",height:4,background:T.accent,borderRadius:2}}/><div style={{position:"absolute",left:"58%",top:-3,width:10,height:10,borderRadius:5,background:T.accent}}/></div></div>,
  "form-field":()=><div style={{padding:"6px 0"}}><div style={{fontSize:7,fontWeight:600,color:T.fg}}>Label</div><div style={{height:12,borderRadius:2,border:`1px solid ${T.border}`,background:T.bg,marginTop:1}}/><div style={{fontSize:6,color:T.fg3,marginTop:1}}>Helper</div></div>,
  "list-box":()=><div style={{padding:"6px 0",border:`1px solid ${T.border}`,borderRadius:2}}>{[0,1].map(i=><div key={i} style={{padding:"2px 4px",fontSize:7,color:i===0?T.accentFg:T.fg,background:i===0?T.accent:"transparent"}}>Opt {i+1}</div>)}</div>,
  calendar:()=><div style={{padding:"6px 0"}}><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>{Array.from({length:7},(_,i)=><div key={i} style={{width:8,height:8,borderRadius:1,fontSize:5,textAlign:"center",background:i===3?T.accent:"transparent",color:i===3?"#fff":T.fg3}}>{i+10}</div>)}</div></div>,
  "date-picker":()=><div style={{padding:"6px 0"}}><div style={{height:12,borderRadius:2,border:`1px solid ${T.border}`,padding:"0 4px",fontSize:7,color:T.fg3,display:"flex",alignItems:"center"}}>15 Jun</div></div>,
  "file-drop":()=><div style={{padding:"6px 0"}}><div style={{border:`1px dashed ${T.border}`,borderRadius:2,padding:4,textAlign:"center",fontSize:6,color:T.fg3}}>↑ Drop</div></div>,
  tabs:()=><div style={{display:"flex",gap:0,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>{["Tab 1","Tab 2"].map((t,i)=><div key={t} style={{padding:"2px 6px",fontSize:7,color:i===0?T.accent:T.fg3,borderBottom:i===0?`2px solid ${T.accent}`:"none"}}>{t}</div>)}</div>,
  link:()=><div style={{padding:"6px 0"}}><span style={{fontSize:8,color:T.accent,textDecoration:"underline"}}>Link</span></div>,
  menu:()=><div style={{padding:"6px 0",border:`1px solid ${T.border}`,borderRadius:2}}>{["Cut","Copy"].map(m=><div key={m} style={{padding:"2px 6px",fontSize:7,color:T.fg}}>{m}</div>)}</div>,
  stepper:()=><div style={{display:"flex",gap:2,padding:"6px 0",alignItems:"center"}}><div style={{width:10,height:10,borderRadius:5,background:T.accent,fontSize:5,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>✓</div><div style={{flex:1,height:1,background:T.accent}}/><div style={{width:10,height:10,borderRadius:5,border:`2px solid ${T.accent}`,fontSize:5,color:T.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>2</div><div style={{flex:1,height:1,background:T.border}}/><div style={{width:10,height:10,borderRadius:5,border:`1px solid ${T.border}`,fontSize:5,color:T.fg3,display:"flex",alignItems:"center",justifyContent:"center"}}>3</div></div>,
  pagination:()=><div style={{display:"flex",gap:2,padding:"6px 0"}}>{["‹","1","2","›"].map((p,i)=><div key={i} style={{width:12,height:12,borderRadius:2,border:`1px solid ${i===2?T.accent:T.border}`,background:i===2?T.accentWeak:"transparent",fontSize:7,display:"flex",alignItems:"center",justifyContent:"center",color:i===2?T.accent:T.fg3}}>{p}</div>)}</div>,
  "skip-link":()=><div style={{padding:"6px 0"}}><div style={{fontSize:7,padding:"1px 4px",borderRadius:2,background:T.accent,color:T.accentFg,display:"inline-block"}}>Skip →</div></div>,
  "nav-item":()=><div style={{display:"flex",gap:0,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>{["Home","About"].map((n,i)=><div key={n} style={{padding:"2px 6px",fontSize:7,color:i===0?T.accent:T.fg3,borderBottom:i===0?`2px solid ${T.accent}`:"none"}}>{n}</div>)}</div>,
  "vert-nav":()=><div style={{padding:"6px 0"}}>{["Dash","Port"].map((n,i)=><div key={n} style={{padding:"2px 6px",fontSize:7,color:i===0?T.accent:T.fg,borderLeft:i===0?`2px solid ${T.accent}`:"2px solid transparent",background:i===0?T.accentWeak+"60":"transparent"}}>{n}</div>)}</div>,
  avatars:()=><div style={{display:"flex",gap:3,padding:"6px 0"}}>{["J","K"].map(a=><div key={a} style={{width:16,height:16,borderRadius:8,background:T.accent,color:T.accentFg,fontSize:7,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center"}}>{a}</div>)}</div>,
  badges:()=><div style={{display:"flex",gap:4,padding:"6px 0"}}><div style={{position:"relative"}}><div style={{width:14,height:14,borderRadius:3,background:T.bg3}}/><div style={{position:"absolute",top:-2,right:-4,width:8,height:8,borderRadius:4,background:T.negative,fontSize:5,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>3</div></div></div>,
  banners:()=><div style={{padding:"6px 0"}}><div style={{padding:"3px 6px",borderRadius:2,background:T.infoWeak,fontSize:7,color:T.fg,display:"flex",alignItems:"center",gap:3}}>ⓘ Info</div></div>,
  dialog:()=><div style={{padding:"6px 0"}}><div style={{borderRadius:4,background:T.bg,border:`1px solid ${T.border}`,padding:5,boxShadow:`0 2px 6px ${T.shadow}`}}><div style={{fontSize:7,fontWeight:600,color:T.fg}}>Title</div><div style={{display:"flex",justifyContent:"flex-end",marginTop:3}}><div style={{height:10,padding:"0 4px",borderRadius:2,background:T.accent,fontSize:6,color:T.accentFg,display:"flex",alignItems:"center"}}>OK</div></div></div></div>,
  progress:()=><div style={{display:"flex",gap:6,padding:"6px 0",alignItems:"center"}}><div style={{flex:1,height:3,borderRadius:1,background:T.bg3}}><div style={{width:"65%",height:"100%",borderRadius:1,background:T.accent}}/></div><div style={{width:10,height:10,border:`2px solid ${T.bg3}`,borderTopColor:T.accent,borderRadius:5}}/></div>,
  tooltips:()=><div style={{padding:"6px 0"}}><div style={{padding:"2px 5px",borderRadius:3,background:T.bgInv,color:T.fgInv,fontSize:7}}>Tooltip</div></div>,
  toast:()=><div style={{padding:"6px 0"}}><div style={{padding:"3px 6px",borderRadius:2,background:T.positiveWeak,fontSize:7,color:T.fg,display:"flex",alignItems:"center",gap:3}}>✓ Saved</div></div>,
  spinner:()=><div style={{padding:"6px 0"}}><div style={{width:14,height:14,border:`2px solid ${T.bg3}`,borderTopColor:T.accent,borderRadius:7}}/></div>,
  accordion:()=><div style={{padding:"4px 0"}}><div style={{borderRadius:3,border:`1px solid ${T.border}`}}>{[0,1].map(i=><div key={i} style={{padding:"2px 5px",fontSize:7,color:T.fg2,borderTop:i?`1px solid ${T.border}`:"none"}}>{i===0?"▼ Sect":"▶ Sect"}</div>)}</div></div>,
  cards:()=><div style={{padding:"6px 0"}}><div style={{borderRadius:4,border:`1px solid ${T.border}`,padding:5,background:T.bg}}><div style={{fontSize:7,fontWeight:600,color:T.fg}}>Card</div><div style={{fontSize:6,color:T.fg3}}>Body</div></div></div>,
  dividers:()=><div style={{padding:"6px 0",display:"flex",flexDirection:"column",gap:4}}><div style={{height:1,background:T.border}}/><div style={{height:1,background:T.border,marginLeft:8}}/></div>,
  drawer:()=><div style={{display:"flex",padding:"6px 0",height:24,border:`1px solid ${T.border}`,borderRadius:2,overflow:"hidden"}}><div style={{width:20,background:T.bg,borderRight:`1px solid ${T.border}`,padding:2,fontSize:5,color:T.fg3}}>☰</div><div style={{flex:1,background:T.bg2}}/></div>,
  panel:()=><div style={{padding:"6px 0"}}><div style={{border:`1px solid ${T.border}`,borderRadius:2,overflow:"hidden"}}><div style={{padding:"2px 4px",background:T.bg2,fontSize:6,fontWeight:600,color:T.fg}}>Panel</div><div style={{padding:3,fontSize:6,color:T.fg3}}>…</div></div></div>,
  "data-grid":()=><div style={{padding:"6px 0",border:`1px solid ${T.border}`,borderRadius:2,overflow:"hidden"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",fontSize:6}}><div style={{padding:"1px 3px",background:T.bg2,fontWeight:600,color:T.fg2}}>Col</div><div style={{padding:"1px 3px",background:T.bg2,fontWeight:600,color:T.fg2}}>Val</div><div style={{padding:"1px 3px",color:T.fg}}>A</div><div style={{padding:"1px 3px",color:T.fg}}>1</div></div></div>,
  table:()=><div style={{padding:"6px 0",border:`1px solid ${T.border}`,borderRadius:2,fontSize:6}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}><div style={{padding:"1px 3px",background:T.bg2,fontWeight:600}}>Bid</div><div style={{padding:"1px 3px",background:T.bg2,fontWeight:600}}>Ask</div><div style={{padding:"1px 3px",color:T.positive}}>1.08</div><div style={{padding:"1px 3px",color:T.negative}}>1.09</div></div></div>,
  overlay:()=><div style={{padding:"6px 0"}}><div style={{position:"relative",height:20,borderRadius:2,background:T.bg3}}><div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3)",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:6,color:"#fff"}}>Scrim</div></div></div>,
  splitter:()=><div style={{display:"flex",padding:"6px 0",height:20,border:`1px solid ${T.border}`,borderRadius:2,overflow:"hidden"}}><div style={{flex:1,background:T.bg}}/><div style={{width:4,background:T.bg3}}/><div style={{flex:1,background:T.bg2}}/></div>,
  "static-list":()=><div style={{padding:"6px 0"}}>{["A","B"].map((n,i)=><div key={n} style={{display:"flex",alignItems:"center",gap:3,padding:"1px 0"}}><div style={{width:4,height:4,borderRadius:2,background:[T.accent,T.positive][i]}}/><span style={{fontSize:7,color:T.fg}}>{n}</span></div>)}</div>,
  "combo-box":()=><div style={{padding:"6px 0"}}><div style={{height:14,borderRadius:2,border:`1px solid ${T.border}`,padding:"0 4px",fontSize:7,color:T.fg3,display:"flex",alignItems:"center",justifyContent:"space-between"}}>Select<SIcon name="chevronDown" size={8} color={T.fg3}/></div></div>,
  dropdown:()=><div style={{padding:"6px 0"}}><div style={{height:14,borderRadius:2,border:`1px solid ${T.border}`,padding:"0 4px",fontSize:7,color:T.fg3,display:"flex",alignItems:"center",justifyContent:"space-between"}}>Option<SIcon name="chevronDown" size={8} color={T.fg3}/></div></div>,
  "number-input":()=><div style={{display:"flex",padding:"6px 0"}}><div style={{fontSize:7,padding:"0 3px",border:`1px solid ${T.border}`,color:T.fg3}}>−</div><div style={{fontSize:7,padding:"0 6px",borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,color:T.fg}}>42</div><div style={{fontSize:7,padding:"0 3px",border:`1px solid ${T.border}`,color:T.fg3}}>+</div></div>,
  "multiline-input":()=><div style={{padding:"6px 0"}}><div style={{height:20,borderRadius:2,border:`1px solid ${T.border}`,borderBottom:`2px solid ${T.borderStrong}`,background:T.bg,padding:2,fontSize:6,color:T.fg3}}>Text...</div></div>,
  "interactable-card":()=><div style={{padding:"6px 0"}}><div style={{borderRadius:3,border:`2px solid ${T.accent}`,padding:4,background:T.bg}}><div style={{fontSize:7,fontWeight:600,color:T.fg}}>Click</div></div></div>,
  collapsible:()=><div style={{padding:"4px 0"}}><div style={{borderRadius:2,border:`1px solid ${T.border}`}}><div style={{padding:"2px 4px",fontSize:7,color:T.fg,display:"flex",justifyContent:"space-between"}}>Section ▼</div></div></div>,
  carousel:()=><div style={{padding:"6px 0"}}><div style={{height:16,borderRadius:2,background:T.accentWeak,marginBottom:2}}/><div style={{display:"flex",justifyContent:"center",gap:3}}>{[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:2,background:i===0?T.accent:T.border}}/>)}</div></div>,
  charts:()=><div style={{display:"flex",gap:2,alignItems:"flex-end",padding:"6px 0"}}>{[35,55,40,70,50].map((h,i)=><div key={i} style={{width:8,height:h/3,borderRadius:2,background:[T.accent,T.info,T.positive,T.caution,T.negative][i]}}/>)}</div>,
  "pat-dashboard":()=><div style={{display:"flex",gap:3,padding:"6px 0"}}>{["$42K","1.2K","+18%"].map((v,i)=><div key={i} style={{fontSize:7,fontWeight:700,color:T.fg,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:2,padding:"2px 4px"}}>{v}</div>)}</div>,
  "pat-form":()=><div style={{display:"flex",flexDirection:"column",gap:2,padding:"6px 0"}}><div style={{height:10,borderRadius:2,border:`1px solid ${T.border}`,background:T.bg,borderBottom:`2px solid ${T.accent}`}}/><div style={{height:10,borderRadius:2,border:`1px solid ${T.border}`,background:T.bg}}/></div>,
  "pat-list-detail":()=><div style={{display:"flex",gap:1,padding:"6px 0",height:20}}><div style={{width:24,background:T.bg2,borderRadius:2,padding:1}}><div style={{height:4,borderRadius:1,background:T.accentWeak,marginBottom:1}}/><div style={{height:4,borderRadius:1,background:"transparent"}}/></div><div style={{flex:1,background:T.bg,borderRadius:2,border:`1px solid ${T.border}`}}/></div>,
  "pat-app-shell":()=><div style={{display:"flex",flexDirection:"column",padding:"6px 0",height:24,border:`1px solid ${T.border}`,borderRadius:2,overflow:"hidden"}}><div style={{height:6,background:T.bg2,borderBottom:`1px solid ${T.border}`}}/><div style={{display:"flex",flex:1}}><div style={{width:12,background:T.bg2,borderRight:`1px solid ${T.border}`}}/><div style={{flex:1}}/></div></div>,
  "pat-login":()=><div style={{padding:"6px 0",display:"flex",justifyContent:"center"}}><div style={{width:40,borderRadius:3,border:`1px solid ${T.border}`,padding:3,background:T.bg}}><div style={{height:4,borderRadius:1,background:T.accent,marginBottom:2}}/><div style={{height:6,borderRadius:1,border:`1px solid ${T.border}`,marginBottom:2}}/><div style={{height:6,borderRadius:1,background:T.accent}}/></div></div>,
  "pat-settings":()=><div style={{display:"flex",gap:1,padding:"6px 0",height:20}}><div style={{width:16,borderRadius:2}}>{["⚙","🔔"].map((i,idx)=><div key={idx} style={{fontSize:6,padding:1,color:idx===0?T.accent:T.fg3}}>{i}</div>)}</div><div style={{flex:1,background:T.bg,border:`1px solid ${T.border}`,borderRadius:2}}/></div>,
  "pat-search":()=><div style={{padding:"6px 0"}}><div style={{height:10,borderRadius:2,border:`1px solid ${T.border}`,padding:"0 3px",fontSize:6,color:T.fg3,display:"flex",alignItems:"center"}}>🔍 Search</div><div style={{display:"flex",gap:2,marginTop:2}}>{[1,2].map(i=><div key={i} style={{flex:1,height:8,borderRadius:2,background:T.bg2}}/>)}</div></div>,
  "pat-wizard":()=><div style={{display:"flex",gap:2,padding:"6px 0",alignItems:"center"}}>{[1,2,3].map(s=><><div key={s} style={{width:10,height:10,borderRadius:5,background:s===1?T.accent:s===2?T.accent+"60":"transparent",border:`1.5px solid ${s<=2?T.accent:T.border}`,fontSize:5,color:s===1?T.accentFg:s===2?T.accent:T.fg3,display:"flex",alignItems:"center",justifyContent:"center"}}>{s}</div>{s<3&&<div style={{flex:1,height:1,background:s===1?T.accent:T.border}}/>}</>)}</div>,
  "pat-data-table":()=><div style={{padding:"6px 0",border:`1px solid ${T.border}`,borderRadius:2,overflow:"hidden"}}><div style={{display:"flex",borderBottom:`1px solid ${T.border}`,padding:2}}><span style={{flex:1,fontSize:6,fontWeight:600,color:T.fg}}>Name</span><span style={{fontSize:6,fontWeight:600,color:T.fg}}>Val</span></div><div style={{padding:2,fontSize:6,color:T.fg3}}>Row 1</div></div>,
};

/* ── APP ── */
export default function App(){
  const [sel,setSel]=useState(null);
  const [q,setQ]=useState("");
  const [sb,setSb]=useState(true);
  const [themeKey,setThemeKey]=useState("jpm-light");
  const [density,setDensity]=useState("medium");
  const [ctrlOpen,setCtrlOpen]=useState(true);

  T=THEMES[themeKey];
  const CSS=buildCSS(T);

  // Comprehensive density map - every dimension from the 4px grid
  const D = {
    high:   { h:20, sp:4,  fs:11, fsS:10, h1:18, h2:14, title:24, pad:6,  cr:2, icon:10, sideW:200, mainP:16, cardMin:150, cardP:8,  gap:6,  topH:28, srchH:24, logoS:20, catFs:8,  demoP:12, demoCr:4 },
    medium: { h:28, sp:8,  fs:12, fsS:11, h1:24, h2:18, title:32, pad:8,  cr:4, icon:12, sideW:240, mainP:24, cardMin:180, cardP:12, gap:8,  topH:36, srchH:28, logoS:26, catFs:9,  demoP:20, demoCr:8 },
    low:    { h:36, sp:12, fs:14, fsS:12, h1:32, h2:24, title:40, pad:12, cr:6, icon:14, sideW:280, mainP:32, cardMin:210, cardP:16, gap:10, topH:44, srchH:32, logoS:30, catFs:10, demoP:28, demoCr:10 },
    touch:  { h:44, sp:16, fs:16, fsS:14, h1:42, h2:32, title:48, pad:16, cr:8, icon:16, sideW:300, mainP:40, cardMin:240, cardP:20, gap:14, topH:52, srchH:40, logoS:36, catFs:11, demoP:36, demoCr:12 },
  }[density];
  const dCSS=`:root{--h:${D.h}px;--pad:${D.pad}px;--fs:${D.fs}px;--cr:${D.cr}px;}
    .s-sidebar-item{padding:${Math.max(4,D.sp-2)}px ${D.sp}px;font-size:${D.fs}px;border-radius:${D.cr}px;}`;

  const fl=COMPS.filter(c=>!q||c.name.toLowerCase().includes(q.toLowerCase()));
  const sc=COMPS.find(c=>c.id===sel);

  return(
    <div style={{display:"flex",minHeight:"100vh",fontFamily:FONT,background:T.bg2,transition:"background 200ms",fontSize:D.fs}}>
      <style>{CSS}{dCSS}</style>

      {/* SIDEBAR */}
      <aside style={{width:sb?D.sideW:0,overflow:"hidden",background:T.bg,borderRight:`1px solid ${T.border}`,transition:"width 250ms cubic-bezier(0.2,0,0,1)",display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0}}>
        <div style={{padding:`${D.sp*1.5}px ${D.sp+2}px ${D.sp/2}px`,minWidth:D.sideW}}>
          <div style={{display:"flex",alignItems:"center",gap:D.sp,marginBottom:D.sp*1.5}}>
            <div style={{width:D.logoS,height:D.logoS,borderRadius:D.cr+2,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",color:T.accentFg,fontWeight:700,fontSize:D.logoS*0.42}}>S</div>
            <div><div style={{fontWeight:600,fontSize:D.fs+1,color:T.fg,lineHeight:1.2}}>Salt DS</div><div style={{fontSize:D.fsS-1,color:T.fg3}}>J.P. Morgan</div></div>
          </div>

          <button onClick={()=>setCtrlOpen(!ctrlOpen)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:"none",border:"none",cursor:"pointer",padding:`${D.sp/2}px 0`,marginBottom:ctrlOpen?D.sp/4:0}}>
            <span style={{fontSize:D.catFs,fontWeight:600,color:T.fg3,textTransform:"uppercase",letterSpacing:"0.06em"}}>Controls</span>
            <SIcon name={ctrlOpen?"chevronDown":"chevronRight"} size={D.icon} color={T.fg3}/>
          </button>
          {ctrlOpen&&<><div style={{fontSize:D.catFs,fontWeight:600,color:T.fg3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:D.sp/4}}>Theme</div>
          <div style={{display:"flex",gap:D.sp/2,marginBottom:D.sp*0.75}}>
            {[["jpm","JPM Brand","#1B7F9E"],["legacy","Legacy","#0078CF"]].map(([id,label,color])=>{
              const a=THEMES[themeKey].theme===id;
              return <button key={id} onClick={()=>setThemeKey(id+(themeKey.includes("dark")?"-dark":"-light"))} style={{flex:1,height:D.h,borderRadius:D.cr,border:a?`2px solid ${color}`:`1px solid ${T.border}`,background:a?color+"18":"transparent",color:a?color:T.fg2,fontSize:D.fsS,fontWeight:a?600:400,fontFamily:FONT,cursor:"pointer",transition:"all 150ms"}}>{label}</button>;
            })}
          </div>

          <div style={{fontSize:D.catFs,fontWeight:600,color:T.fg3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:D.sp/4}}>Mode</div>
          <div style={{display:"flex",gap:D.sp/2,marginBottom:D.sp}}>
            {[["light","☀ Light"],["dark","☾ Dark"]].map(([m,l])=>{
              const a=themeKey.includes(m);
              return <button key={m} onClick={()=>setThemeKey(themeKey.replace(/light|dark/,m))} style={{flex:1,height:D.h,borderRadius:D.cr,border:a?`2px solid ${T.accent}`:`1px solid ${T.border}`,background:a?T.accentWeak:"transparent",color:a?T.accent:T.fg2,fontSize:D.fsS,fontWeight:a?600:400,fontFamily:FONT,cursor:"pointer",transition:"all 150ms"}}>{l}</button>;
            })}
          </div>

          <div style={{fontSize:D.catFs,fontWeight:600,color:T.fg3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:D.sp/4}}>Density</div>
          <div style={{display:"flex",gap:0,marginBottom:D.sp,borderRadius:D.cr,overflow:"hidden",border:`1px solid ${T.border}`}}>
            {[["high","H·20"],["medium","M·28"],["low","L·36"],["touch","T·44"]].map(([k,l])=>(
              <button key={k} onClick={()=>setDensity(k)} style={{flex:1,height:D.h,border:"none",cursor:"pointer",fontFamily:FONT,fontSize:D.catFs,fontWeight:density===k?600:400,background:density===k?T.accent:"transparent",color:density===k?T.accentFg:T.fg2,transition:"all 150ms"}}>{l}</button>
            ))}
          </div>

          </>}
          <div style={{display:"flex",alignItems:"center",gap:D.sp*0.75,padding:`0 ${D.sp}px`,borderRadius:D.cr,background:T.bg2,border:`1px solid ${T.border}`,height:D.srchH,marginBottom:D.sp*0.75}}>
            <SIcon name="search" size={D.icon} color={T.fg3}/>
            <input type="text" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} style={{border:"none",background:"transparent",outline:"none",fontSize:D.fsS,color:T.fg,width:"100%",fontFamily:FONT}}/>
          </div>
        </div>
        <div style={{flex:1,overflow:"auto",padding:`0 ${D.sp*0.75}px ${D.sp*1.5}px`,minWidth:D.sideW}}>
          {CATS.map(cat=>{
            const items=fl.filter(c=>c.cat===cat);
            if(!items.length)return null;
            return <div key={cat} style={{marginBottom:D.sp/4}}>
              <div style={{padding:`${D.sp*0.6}px ${D.sp/2}px ${D.sp/4}px`,fontSize:D.catFs,fontWeight:700,color:T.fg3,textTransform:"uppercase",letterSpacing:"0.08em"}}>{cat}</div>
              {items.map(c=><button key={c.id} onClick={()=>setSel(c.id)} className={`s-sidebar-item${sel===c.id?" active":""}`}>{c.name}</button>)}
            </div>;
          })}
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,overflow:"auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:D.sp,padding:`0 ${D.sp*1.5}px`,height:D.topH,borderBottom:`1px solid ${T.border}`,background:T.bg}}>
          <button className="s-btn s-btn-transparent" onClick={()=>setSb(!sb)} style={{minWidth:"auto",width:D.h,height:D.h,padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}><SIcon name="menu" size={D.icon} color={T.fg3}/></button>
          <span style={{fontSize:D.fsS,color:T.fg3,flex:1}}>{sc?`${sc.cat} / ${sc.name}`:"Salt Design System"}</span>
          <div style={{display:"flex",alignItems:"center",gap:D.sp*0.75}}>
            <div style={{width:D.sp,height:D.sp,borderRadius:D.sp/2,background:T.accent}}/>
            <span style={{fontSize:D.catFs,color:T.fg3,background:T.bg2,padding:`${D.sp/4}px ${D.sp}px`,borderRadius:99}}>{T.short} · {density[0].toUpperCase()+density.slice(1)} ({D.h}px)</span>
          </div>
        </div>
        <div style={{padding:D.mainP}}>
          {sc?(
            <div style={{maxWidth:700}}>
              <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:T.accent,fontSize:D.fsS,cursor:"pointer",fontFamily:FONT,marginBottom:D.sp}}>← Back</button>
              <h1 style={{fontSize:D.h1,fontWeight:600,margin:`0 0 ${D.sp/2}px`,color:T.fg,lineHeight:1.3,fontFamily:FONT_HEAD}}>{sc.name}</h1>
              <p style={{fontSize:D.fs,color:T.fg3,margin:`0 0 ${D.sp*2.5}px`,lineHeight:1.5}}>{sc.desc}</p>
              <div style={{padding:D.demoP,borderRadius:D.demoCr,background:T.bg,border:`1px solid ${T.border}`}}><sc.render/></div>
            </div>
          ):(
            <div style={{maxWidth:700,margin:"0 auto"}}>
              <h1 style={{fontSize:D.title,fontWeight:700,margin:`0 0 ${D.sp}px`,color:T.fg,lineHeight:1.1,fontFamily:FONT_HEAD}}>Salt <span style={{color:T.accent}}>Interactive Library</span></h1>
              <p style={{fontSize:D.fs,lineHeight:1.6,color:T.fg3,maxWidth:500,margin:`0 0 ${D.sp*0.75}px`}}>J.P. Morgan's open-source design system. WCAG 2.1 AA, 4-density system, token-driven CSS. Every element on this page responds to density changes.</p>
              <p style={{fontSize:D.fsS,color:T.accent,margin:`0 0 ${D.sp*3}px`,fontWeight:600}}>Try: switch density (H·20 / M·28 / L·36 / T·44) - sidebar, cards, type, spacing all scale.</p>
              <div style={{display:"grid",gridTemplateColumns:`repeat(auto-fill,minmax(${D.cardMin}px,1fr))`,gap:D.gap}}>
                {COMPS.map(c=>{const P=PREVIEWS[c.id];return(
                  <button key={c.id} onClick={()=>setSel(c.id)} className="s-card" style={{width:"100%",textAlign:"left"}}>
                    <div style={{padding:`${D.cardP*0.7}px ${D.cardP}px ${D.cardP*0.85}px`}}>
                      <div style={{fontSize:D.fs,fontWeight:600,color:T.fg}}>{c.name}</div>
                      <div style={{fontSize:D.fsS,color:T.fg3,marginTop:D.sp/4}}>{c.cat}</div>
                      {P&&<div style={{pointerEvents:"none",marginTop:D.sp/4}}><P/></div>}
                    </div>
                  </button>
                );})}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

