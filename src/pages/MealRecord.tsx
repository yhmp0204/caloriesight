import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addMeal, updateMeal, deleteMeal } from '../data/db';
import { recognizeFood, getApiKeyStatus } from '../services/vision';
import { today, fmtShort, dayOfWeek } from '../utils/date';
import type { UserProfile, MealType, Meal, FoodItem, AIRecognitionResult } from '../types';

const sC: React.CSSProperties = {background:'var(--card)',borderRadius:16,padding:20,border:'1px solid var(--bor)',marginBottom:12};
const sI: React.CSSProperties = {background:'var(--bg)',color:'var(--txt)',border:'1px solid var(--bor)',borderRadius:10,padding:'10px 14px',fontSize:15,width:'100%',boxSizing:'border-box',outline:'none'};
const sB: React.CSSProperties = {background:'var(--pri)',color:'#fff',border:'none',borderRadius:12,padding:'12px 24px',fontSize:15,fontWeight:600,cursor:'pointer',width:'100%'};

interface Props { profile: UserProfile; }

type Mode = 'home'|'camera'|'aiResult'|'confirm'|'manual'|'history'|'dayDetail';

export default function MealScreen(_props: Props) {
  const [mode, setMode] = useState<Mode>('home');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [sel, setSel] = useState<(FoodItem & {confidence?:number})|null>(null);
  const [adj, setAdj] = useState(100);
  const [aiRes, setAiRes] = useState<AIRecognitionResult[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Manual input state
  const [manName, setManName] = useState('');
  const [manCal, setManCal] = useState('');
  const [manP, setManP] = useState('');
  const [manF, setManF] = useState('');
  const [manC, setManC] = useState('');

  // Edit modal state
  const [editingMeal, setEditingMeal] = useState<Meal|null>(null);
  const [editName, setEditName] = useState('');
  const [editCal, setEditCal] = useState('');
  const [editP, setEditP] = useState('');
  const [editF, setEditF] = useState('');
  const [editC, setEditC] = useState('');

  // History state
  const [viewDate, setViewDate] = useState('');

  const todayStr = today();
  const todayMeals = useLiveQuery(() => db.meals.where('date').equals(todayStr).toArray(), [todayStr]) || [];
  const allMeals = useLiveQuery(() => db.meals.orderBy('date').reverse().toArray(), []) || [];
  const api = getApiKeyStatus();

  // Group meals by date for history
  const mealsByDate = allMeals.reduce<Record<string, Meal[]>>((acc, m) => {
    (acc[m.date] = acc[m.date] || []).push(m);
    return acc;
  }, {});
  const dates = Object.keys(mealsByDate);

  // Meals for selected day in detail view
  const dayMeals = viewDate ? (mealsByDate[viewDate] || []) : [];

  const openEdit = (m: Meal) => {
    setEditingMeal(m);
    setEditName(m.dishName);
    setEditCal(String(m.calories));
    setEditP(String(m.protein));
    setEditF(String(m.fat));
    setEditC(String(m.carbs));
  };

  const handleEditSave = async () => {
    if (!editingMeal?.id || !editName || !editCal) return;
    await updateMeal(editingMeal.id, {
      dishName: editName, calories: parseInt(editCal)||0,
      protein: parseInt(editP)||0, fat: parseInt(editF)||0, carbs: parseInt(editC)||0,
    });
    setEditingMeal(null);
  };

  const handleEditDelete = async () => {
    if (!editingMeal?.id) return;
    if (!window.confirm('この記録を削除しますか？')) return;
    await deleteMeal(editingMeal.id);
    setEditingMeal(null);
  };

  // Copy meal to today
  const handleCopy = async (m: Meal) => {
    await addMeal({
      date: todayStr, mealType: m.mealType, dishName: m.dishName, emoji: m.emoji,
      calories: m.calories, protein: m.protein, fat: m.fat, carbs: m.carbs,
      source: 'manual', confidence: 1, createdAt: Date.now(),
    });
    setMode('home');
  };

  const handlePhoto = async (file: File) => {
    setAiLoading(true); setMode('camera');
    if (api.gemini || api.claude) {
      try {
        const result = await recognizeFood(file);
        setAiRes(result.items); setAiLoading(false); setMode('aiResult'); return;
      } catch (e) { console.error(e); }
    }
    setAiLoading(false); setMode('home');
  };

  const doAI = () => {
    setAiLoading(true); setMode('camera');
    setAiLoading(false); setMode('home');
  };

  const confirm = async (food: FoodItem & {confidence?:number}, a=100) => {
    const m = a/100;
    await addMeal({
      date: todayStr, mealType, dishName: food.name, emoji: food.emoji || '🍽️',
      calories: Math.round(food.cal*m), protein: Math.round(food.p*m),
      fat: Math.round(food.f*m), carbs: Math.round(food.c*m),
      source: food.confidence ? 'ai_gemini' : 'manual',
      confidence: food.confidence || 1, createdAt: Date.now(),
    });
    setMode('home'); setSel(null); setAdj(100);
  };

  const confirmManual = async () => {
    if (!manName || !manCal) return;
    await addMeal({
      date: todayStr, mealType, dishName: manName, emoji: '✏️',
      calories: parseInt(manCal) || 0, protein: parseInt(manP) || 0,
      fat: parseInt(manF) || 0, carbs: parseInt(manC) || 0,
      source: 'manual', confidence: 1, createdAt: Date.now(),
    });
    setMode('home'); setManName(''); setManCal(''); setManP(''); setManF(''); setManC('');
  };

  const resetToHome = () => { setMode('home'); setSel(null); setAdj(100); };

  const BackBtn = ({to}:{to?:Mode}) => (
    <button onClick={()=>to?setMode(to):resetToHome()} style={{background:'none',border:'none',color:'var(--pri)',fontSize:13,cursor:'pointer',marginBottom:8}}>← 戻る</button>
  );

  // Edit modal (shared across views)
  const editModal = editingMeal && (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,
      display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
      onClick={()=>setEditingMeal(null)}>
      <div style={{...sC,width:'100%',maxWidth:360,margin:0}} onClick={e=>e.stopPropagation()}>
        <div style={{color:'var(--txt)',fontSize:15,fontWeight:700,marginBottom:12}}>食事を編集</div>
        <div style={{marginBottom:8}}>
          <label style={{color:'var(--sub)',fontSize:11,display:'block',marginBottom:4}}>料理名</label>
          <input value={editName} onChange={e=>setEditName(e.target.value)} style={sI}/>
        </div>
        <div style={{marginBottom:8}}>
          <label style={{color:'var(--sub)',fontSize:11,display:'block',marginBottom:4}}>カロリー (kcal)</label>
          <input type="number" value={editCal} onChange={e=>setEditCal(e.target.value)} style={sI}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:12}}>
          <div>
            <label style={{color:'#60A5FA',fontSize:10,display:'block',marginBottom:2}}>P(g)</label>
            <input type="number" value={editP} onChange={e=>setEditP(e.target.value)} style={{...sI,fontSize:13}}/>
          </div>
          <div>
            <label style={{color:'#FBBF24',fontSize:10,display:'block',marginBottom:2}}>F(g)</label>
            <input type="number" value={editF} onChange={e=>setEditF(e.target.value)} style={{...sI,fontSize:13}}/>
          </div>
          <div>
            <label style={{color:'#4ADE80',fontSize:10,display:'block',marginBottom:2}}>C(g)</label>
            <input type="number" value={editC} onChange={e=>setEditC(e.target.value)} style={{...sI,fontSize:13}}/>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={handleEditDelete}
            style={{flex:1,background:'var(--err)',color:'#fff',border:'none',borderRadius:12,padding:'10px',fontSize:13,fontWeight:600,cursor:'pointer'}}>
            削除
          </button>
          <button onClick={handleEditSave}
            style={{flex:1,background:'var(--pri)',color:'#fff',border:'none',borderRadius:12,padding:'10px',fontSize:13,fontWeight:600,cursor:'pointer'}}>
            保存
          </button>
        </div>
      </div>
    </div>
  );

  // Meal row component
  const MealRow = ({m, showCopy}: {m: Meal; showCopy?: boolean}) => (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderTop:'1px solid var(--bor)',marginTop:4}}>
      <button onClick={()=>openEdit(m)}
        style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',textAlign:'left',flex:1,padding:0}}>
        <span>{m.emoji||'🍽️'}</span>
        <span style={{color:'var(--txt)',fontSize:12}}>{m.dishName}</span>
      </button>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        <span style={{color:'var(--warn)',fontSize:12,fontWeight:700}}>{m.calories}kcal</span>
        {showCopy && (
          <button onClick={()=>handleCopy(m)}
            style={{background:'var(--pri-dim)',border:'none',borderRadius:6,padding:'3px 8px',fontSize:10,color:'var(--pri)',fontWeight:600,cursor:'pointer'}}>
            コピー
          </button>
        )}
      </div>
    </div>
  );

  // ── Day detail view ──
  if (mode==='dayDetail' && viewDate) {
    const total = dayMeals.reduce((s,m)=>s+m.calories,0);
    const isToday = viewDate === todayStr;
    return (<div className="fade-in">
      <BackBtn to="history"/>
      <div style={{...sC}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{color:'var(--txt)',fontSize:15,fontWeight:700}}>
            {fmtShort(viewDate)}({dayOfWeek(viewDate)}) の食事
          </span>
          <span style={{color:'var(--warn)',fontSize:14,fontWeight:700}}>{total} kcal</span>
        </div>
        {dayMeals.map((m,i) => <MealRow key={m.id||i} m={m} showCopy={!isToday}/>)}
      </div>
      {editModal}
    </div>);
  }

  // ── History view ──
  if (mode==='history') {
    return (<div className="fade-in">
      <BackBtn/>
      <h2 style={{color:'var(--txt)',fontSize:18,fontWeight:700,margin:'0 0 12px'}}>過去の食事記録</h2>
      {dates.length === 0 && <div style={{color:'var(--sub)',fontSize:13,textAlign:'center',padding:20}}>記録がありません</div>}
      {dates.map(d => {
        const meals = mealsByDate[d];
        const total = meals.reduce((s,m)=>s+m.calories,0);
        return (
          <button key={d} onClick={()=>{setViewDate(d);setMode('dayDetail');}}
            style={{...sC,width:'100%',cursor:'pointer',textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{color:'var(--txt)',fontSize:13,fontWeight:700}}>{fmtShort(d)}({dayOfWeek(d)})</div>
              <div style={{color:'var(--sub)',fontSize:10,marginTop:2}}>
                {meals.map(m=>m.dishName).join('、').slice(0,30)}{meals.map(m=>m.dishName).join('、').length>30?'...':''}
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{color:'var(--warn)',fontSize:14,fontWeight:700}}>{total} kcal</div>
              <div style={{color:'var(--sub)',fontSize:10}}>{meals.length}件</div>
            </div>
          </button>
        );
      })}
    </div>);
  }

  // ── Confirm screen ──
  if (mode==='confirm' && sel) {
    const m = adj/100;
    return (<div className="fade-in">
      <BackBtn to={sel.confidence?'aiResult':'home'}/>
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
      <BackBtn/>
      <div style={{...sC,textAlign:'center',padding:16,background:'linear-gradient(135deg,var(--pri-dim),var(--card))'}}>
        <div style={{fontSize:13,fontWeight:700,color:'var(--pri)',marginBottom:4}}>🤖 AI認識結果</div>
        <div style={{fontSize:10,color:'var(--sub)'}}>Gemini Vision AI</div>
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
      <div style={{display:'flex',gap:8,marginTop:8}}>
        <button onClick={()=>setMode('manual')} style={{flex:1,background:'none',border:'1px solid var(--bor)',color:'var(--sub)',fontSize:12,cursor:'pointer',padding:'8px',borderRadius:8}}>✏️ 手入力</button>
      </div>
    </div>);
  }

  // ── Camera/loading ──
  if (mode==='camera') {
    return (<div style={{textAlign:'center',padding:'40px 20px'}}>
      <div style={{...sC,padding:40,background:'linear-gradient(135deg,var(--bg),var(--card))'}}>
        <div style={{fontSize:64,marginBottom:16,animation:'pulse 1.5s ease infinite'}}>{aiLoading?'🔍':'📷'}</div>
        <div style={{color:'var(--pri)',fontSize:16,fontWeight:700,marginBottom:8}}>{aiLoading?'AIが分析中...':'写真を撮影中...'}</div>
        <div style={{color:'var(--sub)',fontSize:12}}>{aiLoading?'食事の内容とカロリーを推定しています':'Gemini Vision API で認識します'}</div>
        {aiLoading && <div style={{marginTop:16,height:4,background:'var(--bor)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',background:'var(--pri)',borderRadius:2,animation:'loading 2s ease infinite',width:'60%'}}/></div>}
      </div>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}@keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
    </div>);
  }

  // ── Manual input ──
  if (mode==='manual') {
    return (<div className="fade-in">
      <BackBtn/>
      <div style={{...sC}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
          <span style={{fontSize:22}}>✏️</span>
          <div style={{color:'var(--txt)',fontSize:15,fontWeight:700}}>手入力で記録</div>
        </div>

        <div style={{marginBottom:12}}>
          <label style={{color:'var(--sub)',fontSize:11,display:'block',marginBottom:4}}>料理名・商品名 *</label>
          <input value={manName} onChange={e=>setManName(e.target.value)} placeholder="例: チキン南蛮弁当" style={sI}/>
        </div>

        <div style={{marginBottom:12}}>
          <label style={{color:'var(--sub)',fontSize:11,display:'block',marginBottom:4}}>カロリー (kcal) *</label>
          <input type="number" value={manCal} onChange={e=>setManCal(e.target.value)} placeholder="例: 650" style={{...sI,fontSize:20,fontWeight:700,textAlign:'center'}}/>
        </div>

        <div style={{color:'var(--sub)',fontSize:11,marginBottom:6}}>PFCバランス（任意・わかる範囲でOK）</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:16}}>
          <div>
            <label style={{color:'#60A5FA',fontSize:10,display:'block',marginBottom:2}}>P: タンパク質(g)</label>
            <input type="number" value={manP} onChange={e=>setManP(e.target.value)} placeholder="0" style={{...sI,fontSize:13}}/>
          </div>
          <div>
            <label style={{color:'#FBBF24',fontSize:10,display:'block',marginBottom:2}}>F: 脂質(g)</label>
            <input type="number" value={manF} onChange={e=>setManF(e.target.value)} placeholder="0" style={{...sI,fontSize:13}}/>
          </div>
          <div>
            <label style={{color:'#4ADE80',fontSize:10,display:'block',marginBottom:2}}>C: 炭水化物(g)</label>
            <input type="number" value={manC} onChange={e=>setManC(e.target.value)} placeholder="0" style={{...sI,fontSize:13}}/>
          </div>
        </div>

        {manCal && <div style={{textAlign:'center',padding:8,background:'var(--warn-dim)',borderRadius:8,marginBottom:12}}>
          <span style={{fontSize:24,fontWeight:800,color:'var(--warn)'}}>{manCal} kcal</span>
        </div>}

        <button onClick={confirmManual} disabled={!manName||!manCal}
          style={{...sB,opacity:manName&&manCal?1:0.5}}>
          記録する ✓
        </button>
      </div>

      <div style={{padding:12,background:'var(--bg)',borderRadius:10,border:'1px solid var(--bor)'}}>
        <div style={{fontSize:11,color:'var(--sub)',lineHeight:1.6}}>
          💡 カロリーがわからない場合は、商品のパッケージ裏面や「商品名 カロリー」でウェブ検索すると見つかることが多いです。
        </div>
      </div>
    </div>);
  }

  // ── Home ──
  return (<div className="fade-in">
    <h2 style={{color:'var(--txt)',fontSize:18,fontWeight:700,margin:'0 0 12px'}}>食事を記録</h2>
    {/* Meal type */}
    <div style={{display:'flex',gap:6,marginBottom:16}}>
      {([{id:'breakfast',l:'朝食',i:'🌅'},{id:'lunch',l:'昼食',i:'☀️'},{id:'dinner',l:'夕食',i:'🌙'},{id:'snack',l:'間食',i:'🍪'}] as {id:MealType;l:string;i:string}[]).map(t=>(
        <button key={t.id} onClick={()=>setMealType(t.id)} style={{flex:1,padding:'10px 4px',borderRadius:10,border:'none',cursor:'pointer',
          background:mealType===t.id?'var(--pri-dim)':'var(--card)',color:mealType===t.id?'var(--pri)':'var(--sub)',fontSize:11,fontWeight:600,
          display:'flex',flexDirection:'column',alignItems:'center',gap:2,outline:mealType===t.id?'2px solid var(--pri)':'1px solid var(--bor)'}}>
          <span style={{fontSize:18}}>{t.i}</span>{t.l}
        </button>
      ))}
    </div>

    {/* Camera */}
    <button onClick={doAI} style={{...sC,width:'100%',textAlign:'center',padding:24,cursor:'pointer',
      background:'linear-gradient(135deg,var(--pri-dim),var(--card))',border:'2px dashed rgba(108,156,255,0.3)'}}>
      <div style={{fontSize:36,marginBottom:6}}>📷</div>
      <div style={{color:'var(--pri)',fontSize:15,fontWeight:700}}>写真を撮影してAIで認識</div>
      <div style={{color:'var(--sub)',fontSize:11,marginTop:4}}>Gemini Vision AI が自動でカロリーを推定</div>
      <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:10}}>
        <label style={{background:'var(--pri)',color:'#fff',padding:'8px 16px',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer'}}>
          写真を選択
          <input type="file" accept="image/*" capture="environment" style={{display:'none'}}
            onChange={e => { const f=e.target.files?.[0]; if(f) handlePhoto(f); }}/>
        </label>
      </div>
    </button>

    {/* Action buttons */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12}}>
      <button onClick={()=>setMode('manual')} style={{...sC,textAlign:'center',padding:16,cursor:'pointer',marginBottom:0}}>
        <div style={{fontSize:22,marginBottom:4}}>✏️</div>
        <div style={{color:'var(--txt)',fontSize:13,fontWeight:600}}>手入力</div>
        <div style={{color:'var(--sub)',fontSize:10}}>カロリーを直接入力</div>
      </button>
      <button onClick={()=>setMode('history')} style={{...sC,textAlign:'center',padding:16,cursor:'pointer',marginBottom:0}}>
        <div style={{fontSize:22,marginBottom:4}}>📋</div>
        <div style={{color:'var(--txt)',fontSize:13,fontWeight:600}}>過去の記録</div>
        <div style={{color:'var(--sub)',fontSize:10}}>履歴の参照・コピー</div>
      </button>
    </div>

    {/* Today's meals */}
    {todayMeals.length > 0 && <div style={{...sC,marginTop:12}}>
      <span style={{color:'var(--txt)',fontSize:13,fontWeight:700}}>今日の記録 ({todayMeals.reduce((s,m)=>s+m.calories,0)} kcal)</span>
      <div style={{color:'var(--sub)',fontSize:10,marginTop:2}}>タップで編集</div>
      {todayMeals.map((m,i) => <MealRow key={m.id||i} m={m}/>)}
    </div>}

    {editModal}
  </div>);
}
