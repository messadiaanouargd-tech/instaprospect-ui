/**
 * ProspectGram — UI connected to real backend API
 *
 * HOW THE REAL DATA FLOWS:
 *  1. User types "#dentist" → POST /api/v1/search → job_id returned instantly
 *  2. Poll GET /api/v1/search/{job_id} every 2s → when status==="done" → show results
 *  3. Save lead → POST /api/v1/leads → persisted to PostgreSQL
 *  4. Update status → PATCH /api/v1/leads/{id}/status
 *
 * ▶ Toggle API_MODE = "real" once backend is running on localhost:8000
 */
import { useState, useEffect } from "react";

const API_MODE = "real"; // "mock" | "real"
const API_BASE = "https://instaprospect.onrender.com/api";

const api = {
  async post(path, body) {
    const res = await fetch(`${API_BASE}${path}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    if (!res.ok) throw new Error((await res.json()).detail || res.statusText);
    return res.json();
  },
  async get(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  },
  async patch(path, body) {
    const res = await fetch(`${API_BASE}${path}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    return res.json();
  },
  async delete(path) {
    const res = await fetch(`${API_BASE}${path}`, { method:"DELETE" });
    return res.json();
  },
};

async function searchAndWait(query, searchType, onProgress) {
  const { job_id } = await api.post("/search/", { query, search_type: searchType });
  return new Promise((resolve, reject) => {
    let elapsed = 0;
    const interval = setInterval(async () => {
      try {
        elapsed += 2000;
        const job = await api.get(`/search/${job_id}`);
        onProgress(Math.min((elapsed / 30000) * 90, 90));
        if (job.status === "done") { clearInterval(interval); onProgress(100); resolve(job.results || []); }
        else if (job.status === "failed") { clearInterval(interval); reject(new Error("Search failed")); }
      } catch (e) { clearInterval(interval); reject(e); }
    }, 2000);
  });
}

const MOCK = [
  { id:"1", username:"studio.marcos",       full_name:"Marcos Studio",   bio:"🎨 Branding & Design Studio | Helping brands stand out | DM for collab",          followers:4200,  following:891,  posts:134, engagement_rate:4.8, detected_niche:"Design",      qualification_score:92, email_in_bio:"marcos@studio.com", external_url:"marcosstudio.co", status:"New" },
  { id:"2", username:"realestate.by.sara",  full_name:"Sara Realty",     bio:"🏠 Real Estate Agent | Miami FL | Luxury homes | Book a call 👇",                  followers:8700,  following:1200, posts:289, engagement_rate:3.2, detected_niche:"Real Estate",  qualification_score:87, email_in_bio:null,                external_url:"sara.realtor",    status:"New" },
  { id:"3", username:"fitcoach_mike",        full_name:"Mike Fitness",    bio:"💪 Online fitness coach | 500+ clients transformed | DM START to begin",            followers:12400, following:634,  posts:412, engagement_rate:6.1, detected_niche:"Fitness",      qualification_score:94, email_in_bio:"mike@fitlife.com",  external_url:null,              status:"DMed" },
  { id:"4", username:"dentist.dr.anna",      full_name:"Dr. Anna White",  bio:"🦷 Cosmetic Dentist | NYC | Smile makeovers | Book online",                        followers:3100,  following:520,  posts:98,  engagement_rate:5.4, detected_niche:"Healthcare",   qualification_score:89, email_in_bio:null,                external_url:"dranna.dental",   status:"Replied" },
  { id:"5", username:"shopwithleila",        full_name:"Leila Boutique",  bio:"👗 Fashion boutique | New arrivals weekly | FREE shipping $50+ | Shop now",        followers:6800,  following:2100, posts:567, engagement_rate:2.9, detected_niche:"Fashion",      qualification_score:71, email_in_bio:"hello@leila.shop",  external_url:"leila.shop",      status:"New" },
  { id:"6", username:"techstartup_nova",     full_name:"Nova Tech",       bio:"🚀 SaaS founders | Building the future of productivity | Seed stage",               followers:2300,  following:410,  posts:67,  engagement_rate:7.2, detected_niche:"Tech",         qualification_score:96, email_in_bio:"team@nova.io",      external_url:"nova.io",         status:"New" },
  { id:"7", username:"bakery.by.joy",        full_name:"Joy Bakery",      bio:"🍰 Artisan bakery | Custom cakes | Orders open | DM to order",                     followers:5600,  following:1800, posts:234, engagement_rate:4.1, detected_niche:"Food",         qualification_score:78, email_in_bio:null,                external_url:null,              status:"Viewed" },
  { id:"8", username:"lawfirm_sterling",     full_name:"Sterling Law",    bio:"⚖️ Business & IP law | Startups & entrepreneurs | Free consult",                   followers:1900,  following:340,  posts:45,  engagement_rate:3.8, detected_niche:"Legal",        qualification_score:83, email_in_bio:"contact@sterling.law", external_url:"sterling.law", status:"New" },
];

const C = { bg:"#0A0A0F", surface:"#111118", card:"#16161F", border:"#1E1E2E", accent:"#6C63FF", accentG:"#6C63FF33", green:"#00E5A0", greenG:"#00E5A033", orange:"#FF8A00", red:"#FF4757", p:"#F0F0FF", s:"#8888AA", m:"#44445A" };
const SC = { New:{bg:"#6C63FF22",t:"#6C63FF",b:"#6C63FF44"}, Viewed:{bg:"#FF8A0022",t:"#FF8A00",b:"#FF8A0044"}, DMed:{bg:"#00E5A022",t:"#00E5A0",b:"#00E5A044"}, Replied:{bg:"#00BFFF22",t:"#00BFFF",b:"#00BFFF44"}, Converted:{bg:"#FFD70022",t:"#FFD700",b:"#FFD70044"} };
const NC = { Design:"#6C63FF","Real Estate":"#00BFFF",Fitness:"#00E5A0",Healthcare:"#FF6B9D",Fashion:"#FF8A00",Tech:"#FFD700",Food:"#FF6B6B",Legal:"#B8B8FF" };
const TMPLS = [
  { id:1, name:"Cold Intro",   text:"Hey {first_name} 👋 I came across your profile and love what you're doing with {business_name}. I help {niche} businesses like yours get more clients through social media. Would you be open to a quick chat?" },
  { id:2, name:"Value Hook",   text:"Hi {first_name}! I noticed {business_name} has great content but I think there's a huge opportunity you're missing to convert your followers into clients. I have a quick idea — mind if I share it?" },
  { id:3, name:"Direct Offer", text:"Hey {first_name} — I run a marketing agency that specializes in {niche}. We've helped similar businesses 2-3x their DMs in 30 days. Interested in hearing how?" },
];

const fmt = n => n>=1000?`${(n/1000).toFixed(1)}k`:String(n||0);
const inits = n => (n||"??").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

const Ring = ({ score, size=48 }) => {
  const r=size/2-4, c=2*Math.PI*r, d=(score/100)*c;
  const col = score>=90?C.green:score>=75?C.accent:C.orange;
  return <svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth="3"/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="3" strokeDasharray={`${d} ${c}`} strokeLinecap="round" style={{filter:`drop-shadow(0 0 4px ${col})`}}/>
    <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" fill={col} fontSize={size*.26} fontWeight="700" style={{transform:"rotate(90deg)",transformOrigin:`${size/2}px ${size/2}px`,fontFamily:"monospace"}}>{score}</text>
  </svg>;
};

const Av = ({ name, niche, size=40 }) => {
  const col = NC[niche]||C.accent;
  return <div style={{width:size,height:size,borderRadius:"50%",background:`${col}22`,border:`2px solid ${col}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.32,fontWeight:700,color:col,fontFamily:"monospace",flexShrink:0}}>{inits(name)}</div>;
};

export default function App() {
  const [page, setPage]           = useState("dashboard");
  const [query, setQuery]         = useState("");
  const [sType, setSType]         = useState("both");
  const [loading, setLoading]     = useState(false);
  const [results, setResults]     = useState([]);
  const [done, setDone]           = useState(false);
  const [err, setErr]             = useState(null);
  const [prog, setProg]           = useState(0);
  const [saved, setSaved]         = useState([]);
  const [modal, setModal]         = useState(null);
  const [tplIdx, setTplIdx]       = useState(0);
  const [niche, setNiche]         = useState("All");
  const [sort, setSort]           = useState("score");
  const [copied, setCopied]       = useState(null);
  const [notif, setNotif]         = useState(null);

  useEffect(() => {
    if (API_MODE==="real") api.get("/leads/").then(setSaved).catch(()=>{});
    else setSaved(MOCK.filter(l=>["3","4","6"].includes(l.id)).map(l=>({...l,profile_id:l.id})));
  },[]);

  const toast = (msg,type="ok") => { setNotif({msg,type}); setTimeout(()=>setNotif(null),3000); };

  const search = async () => {
    if(!query.trim()) return;
    setLoading(true); setDone(false); setErr(null); setProg(0);
    try {
      if(API_MODE==="real") {
        const r = await searchAndWait(query,sType,setProg);
        setResults(r);
      } else {
        let p=0;
        await new Promise(res=>{ const iv=setInterval(()=>{ p+=Math.random()*14; if(p>=100){p=100;clearInterval(iv);res();} setProg(Math.min(p,100)); },180); });
        setResults(MOCK);
      }
      setDone(true);
    } catch(e){ setErr(e.message); }
    finally{ setLoading(false); }
  };

  const isSaved = id => saved.some(l=>l.id===id||l.profile_id===id);

  const toggleSave = async (lead) => {
    if(isSaved(lead.id)){
      const ex = saved.find(l=>l.id===lead.id||l.profile_id===lead.id);
      if(API_MODE==="real"&&ex?.id) await api.delete(`/leads/${ex.id}`).catch(()=>{});
      setSaved(p=>p.filter(l=>l.id!==lead.id&&l.profile_id!==lead.id));
      toast("Removed from list");
    } else {
      if(API_MODE==="real"){ const s=await api.post("/leads/",{profile_id:lead.id}).catch(()=>null); if(s) setSaved(p=>[...p,{...lead,profile_id:lead.id,status:"New"}]); }
      else setSaved(p=>[...p,{...lead,profile_id:lead.id,status:"New"}]);
      toast("Saved ✓");
    }
  };

  const setStatus = async (leadId,status) => {
    if(API_MODE==="real") await api.patch(`/leads/${leadId}/status`,{status}).catch(()=>{});
    setSaved(p=>p.map(l=>(l.id===leadId||l.profile_id===leadId)?{...l,status}:l));
    toast(`Status → ${status}`);
  };

  const copyDM = (lead) => {
    const txt = TMPLS[tplIdx].text.replace(/{first_name}/g,(lead.full_name||"").split(" ")[0]).replace(/{business_name}/g,lead.full_name||"").replace(/{niche}/g,(lead.detected_niche||"").toLowerCase());
    navigator.clipboard?.writeText(txt).catch(()=>{});
    setCopied(lead.id); setTimeout(()=>setCopied(null),2000); toast("DM copied! 📋");
  };

  const pool = done ? results : MOCK;
  const niches = ["All",...new Set(pool.map(l=>l.detected_niche).filter(Boolean))];
  const filtered = pool.filter(l=>niche==="All"||l.detected_niche===niche).sort((a,b)=>sort==="score"?b.qualification_score-a.qualification_score:sort==="followers"?b.followers-a.followers:b.engagement_rate-a.engagement_rate);

  const navs=[{id:"dashboard",ic:"⬡",lb:"Dashboard"},{id:"search",ic:"◎",lb:"Search"},{id:"lists",ic:"▤",lb:"My Lists",badge:saved.length},{id:"pipeline",ic:"⋮⋮",lb:"Pipeline"},{id:"templates",ic:"✉",lb:"Templates"}];

  return (
    <div style={{display:"flex",height:"100vh",background:C.bg,fontFamily:"'DM Sans','Segoe UI',sans-serif",color:C.p,overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap');
        *{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#2A2A3E;border-radius:4px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .nv:hover{background:${C.accentG}!important;color:#8B85FF!important}
        .ch:hover{border-color:${C.accent}88!important;transform:translateY(-2px);box-shadow:0 6px 28px ${C.accentG}!important}
        .bp:hover{background:#8B85FF!important} .bg:hover{background:${C.accentG}!important;color:#8B85FF!important}
        input:focus{border-color:${C.accent}!important;outline:none}
      `}</style>

      {notif&&<div style={{position:"fixed",top:22,right:22,zIndex:9999,background:notif.type==="ok"?C.green:C.red,color:"#000",padding:"10px 20px",borderRadius:10,fontWeight:700,fontSize:13,animation:"slideIn .3s ease",boxShadow:"0 4px 20px #0008"}}>{notif.msg}</div>}

      {/* Sidebar */}
      <div style={{width:216,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"22px 0",flexShrink:0}}>
        <div style={{padding:"0 18px 22px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${C.accent},#A78BFA)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:`0 0 14px ${C.accentG}`}}>◎</div>
            <div>
              <div style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:13}}>ProspectGram</div>
              <div style={{fontSize:10,color:API_MODE==="real"?C.green:C.orange,letterSpacing:.8}}>● {API_MODE==="real"?"LIVE":"DEMO"}</div>
            </div>
          </div>
        </div>
        <nav style={{flex:1,padding:"14px 10px"}}>
          {navs.map(n=>(
            <button key={n.id} className="nv" onClick={()=>setPage(n.id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:8,border:"none",background:page===n.id?C.accentG:"transparent",color:page===n.id?C.accent:C.s,cursor:"pointer",fontSize:13,fontWeight:page===n.id?600:400,marginBottom:2,transition:"all .15s",textAlign:"left",fontFamily:"inherit"}}>
              <span style={{fontSize:15,width:18,textAlign:"center"}}>{n.ic}</span>{n.lb}
              {n.badge>0&&<span style={{marginLeft:"auto",background:C.accent,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20}}>{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"14px 18px",borderTop:`1px solid ${C.border}`,fontSize:11,color:API_MODE==="real"?C.green:C.orange}}>
          {API_MODE==="real"?"🟢 Backend connected":"🟡 Set API_MODE='real'"}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflow:"auto",padding:"30px 34px"}}>

        {/* DASHBOARD */}
        {page==="dashboard"&&<div style={{animation:"fadeUp .4s ease"}}>
          <div style={{marginBottom:26}}>
            <div style={{fontSize:23,fontWeight:700,marginBottom:3}}>Good morning, Agency 👋</div>
            <div style={{color:C.s,fontSize:14}}>Your prospecting overview.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:26}}>
            {[["Total Scraped",pool.length||0,"From searches",C.accent],["Saved",saved.length,"In your list",C.green],["Avg Score",pool.length?Math.round(pool.reduce((s,l)=>s+l.qualification_score,0)/pool.length):0,"Quality index","#00BFFF"],["With Email",pool.filter(l=>l.email_in_bio).length,"Direct contact",C.orange]].map(([lb,val,ch,col],i)=>(
              <div key={i} className="ch" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18,transition:"all .2s"}}>
                <div style={{fontSize:11,color:C.s,textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>{lb}</div>
                <div style={{fontSize:30,fontWeight:700,fontFamily:"'Space Mono',monospace",color:col,marginBottom:3}}>{val}</div>
                <div style={{fontSize:12,color:C.m}}>{ch}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:18}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:22}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div style={{fontWeight:600,fontSize:15}}>Recent Prospects</div>
                <button className="bg" onClick={()=>setPage("search")} style={{fontSize:12,color:C.accent,background:"transparent",border:`1px solid ${C.accent}33`,borderRadius:8,padding:"6px 14px",cursor:"pointer",transition:"all .15s",fontFamily:"inherit"}}>Search More →</button>
              </div>
              {pool.slice(0,6).map(l=>(
                <div key={l.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                  <Av name={l.full_name} niche={l.detected_niche} size={34}/>
                  <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>@{l.username}</div><div style={{fontSize:11,color:C.s}}>{l.detected_niche} · {fmt(l.followers)}</div></div>
                  <Ring score={l.qualification_score} size={36}/>
                  <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:SC[l.status||"New"]?.bg,color:SC[l.status||"New"]?.t,border:`1px solid ${SC[l.status||"New"]?.b}`}}>{l.status||"New"}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:22}}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Quick Search</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
                  {["#dentist","#realtor","#fitcoach","CEO","coach"].map(t=>(
                    <button key={t} className="bg" onClick={()=>{setQuery(t);setPage("search");}} style={{fontSize:11,color:C.s,background:C.border,border:"none",borderRadius:20,padding:"4px 11px",cursor:"pointer",transition:"all .15s",fontFamily:"inherit"}}>{t}</button>
                  ))}
                </div>
                <button className="bp" onClick={()=>setPage("search")} style={{width:"100%",padding:"11px",background:C.accent,color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .2s",fontFamily:"inherit"}}>◎ New Search</button>
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:22}}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Pipeline</div>
                {Object.entries(SC).map(([s,c])=>{
                  const cnt=saved.filter(l=>(l.status||"New")===s).length;
                  return <div key={s} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                    <div style={{fontSize:11,color:c.t,width:60}}>{s}</div>
                    <div style={{flex:1,height:4,background:C.border,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${saved.length?(cnt/saved.length)*100:0}%`,background:c.t,borderRadius:2,transition:"width .6s"}}/></div>
                    <div style={{fontSize:11,color:C.m,width:12,textAlign:"right"}}>{cnt}</div>
                  </div>;
                })}
              </div>
            </div>
          </div>
        </div>}

        {/* SEARCH */}
        {page==="search"&&<div style={{animation:"fadeUp .4s ease"}}>
          <div style={{marginBottom:22}}>
            <div style={{fontSize:23,fontWeight:700,marginBottom:3}}>Find Prospects</div>
            <div style={{color:C.s,fontSize:13}}>{API_MODE==="real"?"🟢 Live Instagram scraper":"🟡 Demo — change API_MODE='real' in code for live data"}</div>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:26,marginBottom:22}}>
            <div style={{display:"flex",gap:8,marginBottom:18}}>
              {[["hashtag","#️⃣ Hashtag"],["keyword","🔤 Keyword"],["both","⚡ Both"]].map(([t,l])=>(
                <button key={t} onClick={()=>setSType(t)} style={{padding:"7px 16px",borderRadius:8,border:`1px solid ${sType===t?C.accent:C.border}`,background:sType===t?C.accentG:"transparent",color:sType===t?C.accent:C.s,cursor:"pointer",fontSize:13,fontWeight:sType===t?600:400,transition:"all .15s",fontFamily:"inherit"}}>{l}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()}
                placeholder={sType==="hashtag"?"#dentist, #realestate...":sType==="keyword"?"CEO, founder, coach...":"#dentist, fitness coach..."}
                style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"13px 17px",color:C.p,fontSize:14,fontFamily:"inherit",transition:"border-color .15s"}}/>
              <button className="bp" onClick={search} disabled={loading} style={{padding:"13px 26px",background:C.accent,color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap",fontFamily:"inherit",opacity:loading?.7:1}}>
                {loading?"Scraping...":"◎ Search"}
              </button>
            </div>
            {loading&&<div style={{marginTop:18}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.s,marginBottom:7}}>
                <span style={{animation:"pulse 1.2s infinite"}}>{API_MODE==="real"?"🔍 Scraping Instagram (~30s)...":"🔍 Loading..."}</span>
                <span style={{fontFamily:"monospace",color:C.accent}}>{Math.round(prog)}%</span>
              </div>
              <div style={{height:4,background:C.border,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${prog}%`,background:`linear-gradient(90deg,${C.accent},${C.green})`,borderRadius:4,transition:"width .2s"}}/>
              </div>
            </div>}
            {err&&<div style={{marginTop:12,padding:"10px 14px",background:"#FF475722",border:"1px solid #FF475744",borderRadius:8,fontSize:13,color:C.red}}>{err}</div>}
          </div>

          {done&&<>
            <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:13,color:C.s}}>{filtered.length} results</span>
              {niches.map(n=>(
                <button key={n} onClick={()=>setNiche(n)} style={{padding:"5px 13px",borderRadius:20,border:`1px solid ${niche===n?C.accent:C.border}`,background:niche===n?C.accentG:"transparent",color:niche===n?C.accent:C.s,cursor:"pointer",fontSize:12,fontWeight:niche===n?600:400,transition:"all .15s",fontFamily:"inherit"}}>{n}</button>
              ))}
              <select value={sort} onChange={e=>setSort(e.target.value)} style={{marginLeft:"auto",background:C.surface,border:`1px solid ${C.border}`,color:C.p,padding:"6px 12px",borderRadius:8,fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>
                <option value="score">Best Score</option><option value="followers">Followers</option><option value="engagement_rate">Engagement</option>
              </select>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))",gap:14}}>
              {filtered.map(l=>(
                <div key={l.id} className="ch" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18,transition:"all .2s",cursor:"pointer"}} onClick={()=>setModal(l)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11}}>
                    <div style={{display:"flex",gap:11,alignItems:"center"}}>
                      <Av name={l.full_name} niche={l.detected_niche} size={42}/>
                      <div><div style={{fontWeight:700,fontSize:13}}>@{l.username}</div><div style={{fontSize:11,color:C.s}}>{l.full_name}</div></div>
                    </div>
                    <Ring score={l.qualification_score} size={46}/>
                  </div>
                  <div style={{fontSize:12,color:C.s,marginBottom:11,lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{l.bio}</div>
                  <div style={{display:"flex",gap:14,fontSize:12,color:C.m,marginBottom:11}}>
                    <span>👥 {fmt(l.followers)}</span><span>📊 {l.engagement_rate}%</span><span>📸 {l.posts}</span>
                    {l.email_in_bio&&<span style={{color:C.green}}>✉</span>}{l.external_url&&<span style={{color:C.accent}}>🌐</span>}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={e=>{e.stopPropagation();toggleSave(l);}} style={{flex:1,padding:"7px",background:isSaved(l.id)?C.greenG:"transparent",border:`1px solid ${isSaved(l.id)?C.green:C.border}`,color:isSaved(l.id)?C.green:C.s,borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,transition:"all .15s",fontFamily:"inherit"}}>
                      {isSaved(l.id)?"✓ Saved":"+ Save"}
                    </button>
                    <button onClick={e=>{e.stopPropagation();copyDM(l);}} style={{flex:1,padding:"7px",background:copied===l.id?C.accentG:"transparent",border:`1px solid ${C.accent}44`,color:C.accent,borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,transition:"all .15s",fontFamily:"inherit"}}>
                      {copied===l.id?"✓ Copied!":"📋 Copy DM"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>}
          {!done&&!loading&&<div style={{textAlign:"center",padding:"70px 0",color:C.m}}>
            <div style={{fontSize:44,marginBottom:12}}>◎</div>
            <div style={{fontSize:15,marginBottom:7}}>Enter a keyword or hashtag to start</div>
            <div style={{fontSize:13}}>Try: #dentist · #realestateagent · fitness coach</div>
          </div>}
        </div>}

        {/* LISTS */}
        {page==="lists"&&<div style={{animation:"fadeUp .4s ease"}}>
          <div style={{marginBottom:22}}><div style={{fontSize:23,fontWeight:700,marginBottom:3}}>Saved Lists</div><div style={{color:C.s,fontSize:13}}>{saved.length} saved · {API_MODE==="real"?"synced to DB":"demo"}</div></div>
          {saved.length===0?(
            <div style={{textAlign:"center",padding:"70px 0",color:C.m}}>
              <div style={{fontSize:44,marginBottom:12}}>▤</div><div style={{fontSize:15}}>No saved prospects yet</div>
              <button className="bp" onClick={()=>setPage("search")} style={{marginTop:14,padding:"10px 22px",background:C.accent,color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Go Search</button>
            </div>
          ):(
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 75px 95px 105px 135px 120px",padding:"11px 18px",borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.m,textTransform:"uppercase",letterSpacing:.8}}>
                <span>Profile</span><span style={{textAlign:"center"}}>Score</span><span style={{textAlign:"center"}}>Followers</span><span style={{textAlign:"center"}}>Eng.</span><span style={{textAlign:"center"}}>Status</span><span style={{textAlign:"center"}}>Actions</span>
              </div>
              {saved.map((l,i)=>(
                <div key={l.id} style={{display:"grid",gridTemplateColumns:"1fr 75px 95px 105px 135px 120px",alignItems:"center",padding:"13px 18px",borderBottom:i<saved.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <Av name={l.full_name} niche={l.detected_niche} size={32}/>
                    <div><div style={{fontWeight:600,fontSize:13}}>@{l.username}</div><div style={{fontSize:11,color:C.s}}>{l.detected_niche}{l.email_in_bio?" · ✉":""}</div></div>
                  </div>
                  <div style={{textAlign:"center"}}><Ring score={l.qualification_score} size={32}/></div>
                  <div style={{textAlign:"center",fontSize:13,fontFamily:"monospace"}}>{fmt(l.followers)}</div>
                  <div style={{textAlign:"center",fontSize:13,fontWeight:600,color:l.engagement_rate>5?C.green:l.engagement_rate>3?C.orange:C.red,fontFamily:"monospace"}}>{l.engagement_rate}%</div>
                  <div style={{textAlign:"center"}}>
                    <select value={l.status||"New"} onChange={e=>setStatus(l.id||l.profile_id,e.target.value)} style={{background:SC[l.status||"New"]?.bg,border:`1px solid ${SC[l.status||"New"]?.b}`,color:SC[l.status||"New"]?.t,padding:"4px 9px",borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      {Object.keys(SC).map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{textAlign:"center",display:"flex",gap:6,justifyContent:"center"}}>
                    <button onClick={()=>copyDM(l)} style={{padding:"4px 9px",background:"transparent",border:`1px solid ${C.accent}33`,color:C.accent,borderRadius:6,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>{copied===l.id?"✓":"DM"}</button>
                    <button onClick={()=>toggleSave(l)} style={{padding:"4px 8px",background:"transparent",border:`1px solid ${C.border}`,color:C.m,borderRadius:6,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}

        {/* PIPELINE */}
        {page==="pipeline"&&<div style={{animation:"fadeUp .4s ease"}}>
          <div style={{marginBottom:22}}><div style={{fontSize:23,fontWeight:700,marginBottom:3}}>Outreach Pipeline</div><div style={{color:C.s,fontSize:13}}>Track prospects from discovery → conversion.</div></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
            {Object.entries(SC).map(([status,c])=>{
              const sl=saved.filter(l=>(l.status||"New")===status);
              return <div key={status} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,minHeight:260}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,color:c.t,textTransform:"uppercase",letterSpacing:.8}}>{status}</div>
                  <div style={{background:c.bg,color:c.t,border:`1px solid ${c.b}`,borderRadius:20,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>{sl.length}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {sl.map(l=>(
                    <div key={l.id} className="ch" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:11,transition:"all .2s",cursor:"pointer"}} onClick={()=>setModal(l)}>
                      <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:7}}>
                        <Av name={l.full_name} niche={l.detected_niche} size={26}/>
                        <div><div style={{fontSize:11,fontWeight:600}}>@{l.username}</div><div style={{fontSize:10,color:C.m}}>{l.detected_niche}</div></div>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:11,color:C.m}}>{fmt(l.followers)}</span>
                        <Ring score={l.qualification_score} size={26}/>
                      </div>
                    </div>
                  ))}
                  {sl.length===0&&<div style={{textAlign:"center",padding:"18px 0",fontSize:11,color:C.m}}>Empty</div>}
                </div>
              </div>;
            })}
          </div>
        </div>}

        {/* TEMPLATES */}
        {page==="templates"&&<div style={{animation:"fadeUp .4s ease"}}>
          <div style={{marginBottom:22}}><div style={{fontSize:23,fontWeight:700,marginBottom:3}}>DM Templates</div><div style={{color:C.s,fontSize:13}}>Variables auto-fill with prospect's real data.</div></div>
          <div style={{display:"grid",gap:14}}>
            {TMPLS.map((t,i)=>(
              <div key={t.id} className="ch" style={{background:C.card,border:`1px solid ${i===tplIdx?C.accent:C.border}`,borderRadius:14,padding:22,transition:"all .2s",cursor:"pointer"}} onClick={()=>setTplIdx(i)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:15}}>{t.name}</div>
                  {i===tplIdx&&<div style={{padding:"3px 11px",background:C.greenG,color:C.green,border:`1px solid ${C.green}44`,borderRadius:20,fontSize:11,fontWeight:700}}>✓ Active</div>}
                </div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:14,fontSize:13,color:C.s,lineHeight:1.7,marginBottom:14}}>
                  {t.text.split(/(\{[^}]+\})/g).map((p,j)=>p.match(/^\{.*\}$/)?<span key={j} style={{color:C.accent,background:C.accentG,padding:"1px 6px",borderRadius:4,fontFamily:"monospace",fontSize:12}}>{p}</span>:p)}
                </div>
                <button className="bp" onClick={()=>{setTplIdx(i);toast(`"${t.name}" active`);}} style={{padding:"8px 18px",background:i===tplIdx?C.green:C.accent,color:i===tplIdx?"#000":"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .2s",fontFamily:"inherit"}}>
                  {i===tplIdx?"✓ Active":"Set Active"}
                </button>
              </div>
            ))}
            <div style={{background:C.card,border:`2px dashed ${C.border}`,borderRadius:14,padding:22,display:"flex",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer"}} onClick={()=>toast("Template editor — Phase 2!")}>
              <span style={{fontSize:20,color:C.m}}>+</span><span style={{color:C.m,fontSize:14}}>Create template</span>
            </div>
          </div>
        </div>}
      </div>

      {/* MODAL */}
      {modal&&<div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={()=>setModal(null)}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:30,width:510,maxHeight:"88vh",overflowY:"auto",animation:"fadeUp .3s ease"}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
            <div style={{display:"flex",gap:13,alignItems:"center"}}>
              <Av name={modal.full_name} niche={modal.detected_niche} size={52}/>
              <div>
                <div style={{fontWeight:700,fontSize:17}}>@{modal.username}</div>
                <div style={{fontSize:12,color:C.s}}>{modal.full_name}</div>
                <div style={{fontSize:11,color:C.m,marginTop:2}}>{modal.detected_niche}</div>
              </div>
            </div>
            <button onClick={()=>setModal(null)} style={{background:"transparent",border:"none",color:C.m,fontSize:18,cursor:"pointer"}}>✕</button>
          </div>
          <div style={{background:C.surface,borderRadius:12,padding:13,marginBottom:16,fontSize:13,color:C.s,lineHeight:1.6}}>{modal.bio}</div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:C.m,textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>Score Breakdown</div>
            <div style={{display:"flex",gap:18,alignItems:"center"}}>
              <Ring score={modal.qualification_score} size={66}/>
              <div style={{flex:1}}>
                {[["Engagement",Math.round((modal.engagement_rate/10)*100)],["Business Signals",modal.business_signal_score||72],["Niche Match",modal.niche_match_score||85],["Contact",modal.email_in_bio?100:40]].map(([lb,v])=>(
                  <div key={lb} style={{marginBottom:7}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}><span style={{color:C.s}}>{lb}</span><span style={{color:C.m}}>{v}%</span></div>
                    <div style={{height:4,background:C.border,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${v}%`,background:v>=80?C.green:v>=60?C.accent:C.orange,borderRadius:2}}/></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,marginBottom:16}}>
            {[["Followers",fmt(modal.followers)],["Following",modal.following],["Posts",modal.posts]].map(([k,v])=>(
              <div key={k} style={{background:C.surface,borderRadius:10,padding:11,textAlign:"center"}}>
                <div style={{fontFamily:"monospace",fontWeight:700,fontSize:17}}>{v}</div>
                <div style={{fontSize:11,color:C.m}}>{k}</div>
              </div>
            ))}
          </div>
          {(modal.email_in_bio||modal.external_url)&&<div style={{background:C.surface,borderRadius:12,padding:12,marginBottom:16,display:"flex",gap:14,flexWrap:"wrap"}}>
            {modal.email_in_bio&&<div style={{fontSize:12}}>✉ <span style={{color:C.green}}>{modal.email_in_bio}</span></div>}
            {modal.external_url&&<div style={{fontSize:12}}>🌐 <span style={{color:C.accent}}>{modal.external_url}</span></div>}
          </div>}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:C.m,textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>DM ({TMPLS[tplIdx].name})</div>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:13,fontSize:13,color:C.s,lineHeight:1.7}}>
              {TMPLS[tplIdx].text.replace(/{first_name}/g,(modal.full_name||"").split(" ")[0]).replace(/{business_name}/g,modal.full_name||"").replace(/{niche}/g,(modal.detected_niche||"").toLowerCase())}
            </div>
          </div>
          <div style={{display:"flex",gap:9}}>
            <button onClick={()=>toggleSave(modal)} style={{flex:1,padding:"11px",background:isSaved(modal.id)?C.greenG:"transparent",border:`1px solid ${isSaved(modal.id)?C.green:C.border}`,color:isSaved(modal.id)?C.green:C.s,borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:700,transition:"all .15s",fontFamily:"inherit"}}>
              {isSaved(modal.id)?"✓ Saved":"+ Save"}
            </button>
            <button className="bp" onClick={()=>copyDM(modal)} style={{flex:1,padding:"11px",background:copied===modal.id?C.green:C.accent,color:copied===modal.id?"#000":"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .2s",fontFamily:"inherit"}}>
              {copied===modal.id?"✓ Copied!":"📋 Copy DM"}
            </button>
          </div>
        </div>
      </div>}
    </div>
  );
}
