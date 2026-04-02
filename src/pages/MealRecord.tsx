import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addMeal } from '../data/db';
import { FOOD_DB, FOOD_CATEGORIES } from '../data/foods';
import { recognizeFood, getApiKeyStatus } from '../services/vision';
import { today } from '../utils/date';
import type { UserProfile, MealType, FoodItem, AIRecognitionResult } from '../types';

const sC: React.CSSProperties = {background:'var(--card)',borderRadius:16,padding:20,border:'1px solid var(--bor)',marginBottom:12};
const sI: React.CSSProperties = {background:'var(--bg)',color:'var(--txt)',border:'1px solid var(--bor)',borderRadius:10,padding:'10px 14px',fontSize:15,width:'100%',boxSizing:'border-box',outline:'none'};
const sB: React.CSSProperties = {background:'var(--pri)',color:'#fff',border:'none',borderRadius:12,padding:'12px 24px',fontSize:15,fontWeight:600,cursor:'pointer',width:'100%'};

// Demo AI simulation
function simulateAI(): AIRecognitionResult[] {
  const n = 1+Math.floor(Math.random()*2), items: AIRecognitionResult[] = [], used = new Set<number>();
  for(let i=0;i<n;i++){let idx:number;do{idx=Math.floor(Math.random()*FOOD_DB.length)}while(used.has(idx));
    used.add(idx);items.push({...FOOD_DB[idx],confidence:0.7+Math.random()*0.25});}
  return items;
}

interface Props { profile: UserProfile; }

export default function MealScreen({ profile }: Props) {
  const [mode, setMode] = useState<'home'|'camera'|'aiResult'|'search'|'confirm'>('home');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [sel, setSel] = useState<(FoodItem & {confidence?:number})|null>(null);
  const [search, setSearch] = useState('');
  const [adj, setAdj] = useState(100);
  const [aiRes, setAiRes] = useState<AIRecognitionResult[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [catF, setCatF] = useState('ALL');
  const [photoFile, setPhotoFile] = useState<File|null>(null);

  const todayMeals = useLiveQuery(() => db.meals.where('date').equals(today()).toArray(), []) || [];
  const api = getApiKeyStatus();
  const filtered = FOOD_DB.filter(f => {
    if(catF!=='ALL' && f.cat!==catF) return false;
    if(search && !f.name.includes(search)) return false;
    return true;
  });

  const handlePhoto = async (file: File) => {
    setPhotoFile(file);
    setAiLoading(true);
    setMode('camera');
    if (api.gemini || api.claude) {
      try {
        const result = await recognizeFood(file);
        setAiRes(result.items);
        setAiLoading(false);
        setMode('aiResult');
        return;
      } catch (e) { console.error(e); }
    }
    // Fallback to demo
    setTimeout(() => { setAiRes(simulateAI()); setAiLoading(false); setMode('aiResult'); }, 2000+Math.random()*1000);
  };

  const doAI = () => {
    // If no real API, simulate
    setAiLoading(true); setMode('camera');
    setTimeout(() => { setAiRes(simulateAI()); setAiLoading(false); setMode('aiResult'); }, 2000+Math.random()*1000);
  };

  const confirm = async (food: FoodItem & {confidence?:number}, a=100) => {
    const m = a/100;
    await addMeal({
      date: today(), mealType, dishName: food.name, emoji: food.emoji || '🍽️',
      calories: Math.round(food.cal*m), protein: Math.round(food.p*m),
      fat: Math.round(food.f*m), carbs: Math.round(food.c*m),
      source: food.confidence ? 'ai_gemini' : 'manual',
      confidence: food.confidence || 1, createdAt: Date.now(),
    });
    setMode('home'); setSel(null); setAdj(100);
  };

  // ── Confirm screen ──
  if (mode==='confirm' && sel) {
    const m = adj/100;
    return (<div className="fade-in">
      <button onClick={()=>{setMode(sel.confidence?'aiResult':'search');setSel(null);}} style={{background:'none',border:'none',color:'var(--pri)',fontSize:13,cursor:'pointer',marginBottom:8}}>← 戻る</button>
      <div style={{...sC,textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:4}}>{sel.emoji||'🍽️'}</div>
        <div style={{fontSize:18,fontWeight:700,color:'var(--txt)'}}>{sel.name}</div>
        {sel.confidence && <div style={{marginTop:6,fontSize:10,color:'var(--sub)'}}>AI確信度: <span style={{color:sel.confidence>0.85?'var(--ok)':'var(--warn)',fontWeight:700}}>{Math.round(sel.confidence*100)}%</span></div>}
        <div style={{fontSize:34,fontWeight:800,color:'var(--warn)',margin:'14px 0 6px'}}>{Math.round(sel.cal*m)} kcal</div>
        <div style={{display:'flex',justifyContent:'center',gap:20,marginBottom:16}}>
          {[{l:'タンパク質',v:Math.round(sel.p*m),c:'#60A5FA'},{l:'脂質',v:Math.round(sel.f*m),c:'#FBBF24'},{l:'炭水化物',v:Math.round(sel.c*m),c:'#4ADE80'}].map((n,i)=>(
            <div key={i} style={{textAlign:'center'}}><div style={{fontSize:16,fontWeight:700,color:n.c}}>{n.v}g</div><div style={{fontSize:9,color:'var(--sub)'}}>{n.l}</div></div>
          ))}
        </div>
        <div style={{marginBottom:14}}>
          <label style={{color:'var(--sub)',fontSize:11,display:'block',marginBottom:4}}>量の調整: {adj}%</label>
          <input type="range" min={50} max={200} value={adj} onChange={e=>setAdj(+e.target.value)} style={{width:'100%'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'var(--sub)'}}><span>少なめ</span><span>普通</span><span>大盛り</span></div>
        </div>
      </div>
      <button onClick={()=>confirm(sel,adj)} style={sB}>記録する ✓</button>
    </div>);
  }

  // ── AI result ──
  if (mode==='aiResult') {
    return (<div className="fade-in">
      <button onClick={()=>setMode('home')} style={{background:'none',border:'none',color:'var(--pri)',fontSize:13,cursor:'pointer',marginBottom:8}}>← 戻る</button>
      <div style={{...sC,textAlign:'center',padding:16,background:'linear-gradient(135deg,var(--pri-dim),var(--card))'}}>
        <div style={{fontSize:13,fontWeight:700,color:'var(--pri)',marginBottom:4}}>🤖 AI認識結果</div>
        <div style={{fontSize:10,color:'var(--sub)'}}>Gemini Vision AI{api.gemini?'':'（デモモード）'}</div>
      </div>
      {aiRes.map((food,i) => (
        <button key={i} onClick={()=>{setSel(food);setMode('confirm');}} style={{...sC,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',textAlign:'left',width:'100%'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:28}}>{food.emoji}</span>
            <div><div style={{color:'var(--txt)',fontSize:14,fontWeight:600}}>{food.name}</div>
              <div style={{color:'var(--sub)',fontSize:10,marginTop:2}}>確信度: <span style={{color:food.confidence>0.85?'var(--ok)':'var(--warn)',fontWeight:600}}>{Math.round(food.confidence*100)}%</span> | P:{food.p}g F:{food.f}g C:{food.c}g</div>
            </div>
          </div>
          <div style={{textAlign:'right'}}><div style={{color:'var(--warn)',fontSize:16,fontWeight:700}}>{food.cal}</div><div style={{color:'var(--sub)',fontSize:9}}>kcal</div></div>
        </button>
      ))}
      <button onClick={()=>setMode('search')} style={{background:'none',border:'none',color:'var(--sub)',fontSize:12,cursor:'pointer',textDecoration:'underline',width:'100%',textAlign:'center',marginTop:8}}>認識結果が違う？手動で検索</button>
    </div>);
  }

  // ── Camera/loading ──
  if (mode==='camera') {
    return (<div style={{textAlign:'center',padding:'40px 20px'}}>
      <div style={{...sC,padding:40,background:'linear-gradient(135deg,var(--bg),var(--card))'}}>
        <div style={{fontSize:64,marginBottom:16,animation:'pulse 1.5s ease infinite'}}>{aiLoading?'🔍':'📷'}</div>
        <div style={{color:'var(--pri)',fontSize:16,fontWeight:700,marginBottom:8}}>{aiLoading?'AIが分析中...':'写真を撮影中...'}</div>
        <div style={{color:'var(--sub)',fontSize:12}}>{aiLoading?'食事の内容とカロリーを推定しています':'Gemini Vision API で認識します'}</div>
        {aiLoading && <div style={{marginTop:16,height:4,background:'var(--bor)',borderRadius:2,overflow:'hidden'}}>
          <div style={{height:'100%',background:'var(--pri)',borderRadius:2,animation:'loading 2s ease infinite',width:'60%'}}/>
        </div>}
      </div>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}@keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
    </div>);
  }

  // ── Search ──
  if (mode==='search') {
    return (<div className="fade-in">
      <button onClick={()=>setMode('home')} style={{background:'none',border:'none',color:'var(--pri)',fontSize:13,cursor:'pointer',marginBottom:8}}>← 戻る</button>
      <input placeholder="食品名で検索..." value={search} onChange={e=>setSearch(e.target.value)} style={{...sI,marginBottom:8}}/>
      <div style={{display:'flex',gap:4,marginBottom:10,overflowX:'auto',paddingBottom:4}}>
        {['ALL',...FOOD_CATEGORIES].map(c=>(
          <button key={c} onClick={()=>setCatF(c)} style={{padding:'4px 10px',borderRadius:8,border:'none',cursor:'pointer',fontSize:10,fontWeight:600,whiteSpace:'nowrap',
            background:catF===c?'var(--pri-dim)':'var(--card)',color:catF===c?'var(--pri)':'var(--sub)'}}>{c==='ALL'?'全て':c}</button>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:4}}>
        {filtered.slice(0,20).map((food,i) => (
          <button key={i} onClick={()=>{setSel(food);setMode('confirm');}} style={{...sC,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',marginBottom:0,padding:12,textAlign:'left',width:'100%'}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:20}}>{food.emoji}</span>
              <div><div style={{color:'var(--txt)',fontSize:13,fontWeight:600}}>{food.name}</div><div style={{color:'var(--sub)',fontSize:9}}>P:{food.p}g F:{food.f}g C:{food.c}g</div></div>
            </div>
            <span style={{color:'var(--warn)',fontSize:14,fontWeight:700}}>{food.cal}<span style={{fontSize:9}}>kcal</span></span>
          </button>
        ))}
      </div>
    </div>);
  }

  // ── Home ──
  return (<div className="fade-in">
    <h2 style={{color:'var(--txt)',fontSize:18,fontWeight:700,margin:'0 0 12px'}}>食事を記録</h2>
    <div style={{display:'flex',gap:6,marginBottom:16}}>
      {([{id:'breakfast',l:'朝食',i:'🌅'},{id:'lunch',l:'昼食',i:'☀️'},{id:'dinner',l:'夕食',i:'🌙'},{id:'snack',l:'間食',i:'🍪'}] as {id:MealType;l:string;i:string}[]).map(t=>(
        <button key={t.id} onClick={()=>setMealType(t.id)} style={{flex:1,padding:'10px 4px',borderRadius:10,border:'none',cursor:'pointer',
          background:mealType===t.id?'var(--pri-dim)':'var(--card)',color:mealType===t.id?'var(--pri)':'var(--sub)',fontSize:11,fontWeight:600,
          display:'flex',flexDirection:'column',alignItems:'center',gap:2,outline:mealType===t.id?'2px solid var(--pri)':'1px solid var(--bor)'}}>
          <span style={{fontSize:18}}>{t.i}</span>{t.l}
        </button>
      ))}
    </div>

    {/* Camera input (real) + demo button */}
    <div style={{...sC,textAlign:'center',padding:28,background:'linear-gradient(135deg,var(--pri-dim),var(--card))',border:'2px dashed rgba(108,156,255,0.3)'}}>
      <div style={{fontSize:40,marginBottom:8}}>📷</div>
      <div style={{color:'var(--pri)',fontSize:16,fontWeight:700}}>写真を撮影してAIで認識</div>
      <div style={{color:'var(--sub)',fontSize:11,marginTop:4}}>Gemini Vision AI が自動でカロリーを推定</div>
      <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:12}}>
        <label style={{background:'var(--pri)',color:'#fff',padding:'8px 16px',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer'}}>
          写真を選択
          <input type="file" accept="image/*" capture="environment" style={{display:'none'}}
            onChange={e => { const f=e.target.files?.[0]; if(f) handlePhoto(f); }}/>
        </label>
        <button onClick={doAI} style={{background:'var(--bor)',color:'var(--txt)',padding:'8px 16px',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',border:'none'}}>
          デモ
        </button>
      </div>
    </div>

    <div style={{textAlign:'center',margin:'12px 0',color:'var(--sub)',fontSize:11}}>または</div>

    <button onClick={()=>setMode('search')} style={{...sC,width:'100%',textAlign:'center',padding:16,cursor:'pointer'}}>
      <div style={{fontSize:24,marginBottom:4}}>🔍</div>
      <div style={{color:'var(--txt)',fontSize:14,fontWeight:600}}>食品を手動で検索</div>
      <div style={{color:'var(--sub)',fontSize:11}}>60品目以上の日本食データベースから選択</div>
    </button>

    {todayMeals.length > 0 && <div style={{...sC,marginTop:12}}>
      <span style={{color:'var(--txt)',fontSize:13,fontWeight:700}}>今日の記録 ({todayMeals.reduce((s,m)=>s+m.calories,0)} kcal)</span>
      {todayMeals.map((m,i) => (
        <div key={m.id||i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderTop:'1px solid var(--bor)',marginTop:6}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span>{m.emoji||'🍽️'}</span><span style={{color:'var(--txt)',fontSize:12}}>{m.dishName}</span>
          </div>
          <span style={{color:'var(--warn)',fontSize:12,fontWeight:700}}>{m.calories}kcal</span>
        </div>
      ))}
    </div>}
  </div>);
}
