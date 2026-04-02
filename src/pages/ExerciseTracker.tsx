import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addExercise } from '../data/db';
import { EXERCISE_DB } from '../data/foods';
import { calcExerciseCalories } from '../services/calories';
import { today } from '../utils/date';
import type { UserProfile, ExerciseType } from '../types';

const sC: React.CSSProperties = {background:'var(--card)',borderRadius:16,padding:20,border:'1px solid var(--bor)',marginBottom:12};
const sI: React.CSSProperties = {background:'var(--bg)',color:'var(--txt)',border:'1px solid var(--bor)',borderRadius:10,padding:'10px 14px',fontSize:15,width:'100%',boxSizing:'border-box',outline:'none'};
const sB: React.CSSProperties = {background:'var(--pri)',color:'#fff',border:'none',borderRadius:12,padding:'12px 24px',fontSize:15,fontWeight:600,cursor:'pointer',width:'100%'};

interface Props { profile: UserProfile; }

export default function ExerciseScreen({ profile }: Props) {
  const [sel, setSel] = useState<ExerciseType|null>(null);
  const [dur, setDur] = useState('');
  const todayEx = useLiveQuery(() => db.exercises.where('date').equals(today()).toArray(), []) || [];
  const total = todayEx.reduce((s,e) => s+e.caloriesBurned, 0);

  const doSave = async () => {
    if (!sel || !dur) return;
    const cal = calcExerciseCalories(sel.mets, profile.weight || 65, parseFloat(dur));
    await addExercise({ date: today(), activity: sel.name, durationMin: parseFloat(dur), mets: sel.mets, caloriesBurned: cal });
    setSel(null); setDur('');
  };

  return (<div className="fade-in">
    <h2 style={{color:'var(--txt)',fontSize:18,fontWeight:700,margin:'0 0 12px'}}>運動記録</h2>

    {total > 0 && <div style={{...sC,textAlign:'center',padding:14,background:'linear-gradient(135deg,var(--ok-dim),var(--card))'}}>
      <div style={{fontSize:10,color:'var(--sub)'}}>今日の消費カロリー</div>
      <div style={{fontSize:28,fontWeight:800,color:'var(--ok)'}}>{total} kcal 🔥</div>
    </div>}

    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:12}}>
      {EXERCISE_DB.slice(0,12).map((ex,i) => (
        <button key={i} onClick={()=>setSel(ex)} style={{...sC,marginBottom:0,padding:8,cursor:'pointer',textAlign:'center',
          border:sel?.name===ex.name?'2px solid var(--pri)':'1px solid var(--bor)',
          background:sel?.name===ex.name?'var(--pri-dim)':'var(--card)'}}>
          <div style={{fontSize:20}}>{ex.icon}</div>
          <div style={{color:'var(--txt)',fontSize:9,fontWeight:600,marginTop:2}}>{ex.name}</div>
        </button>
      ))}
    </div>

    {sel && <div style={sC}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <span style={{fontSize:22}}>{sel.icon}</span>
        <span style={{color:'var(--txt)',fontSize:15,fontWeight:700}}>{sel.name}</span>
        <span style={{color:'var(--sub)',fontSize:10}}>METs:{sel.mets}</span>
      </div>
      <label style={{color:'var(--sub)',fontSize:10}}>運動時間（分）</label>
      <input type="number" placeholder="30" value={dur} onChange={e=>setDur(e.target.value)} style={{...sI,margin:'4px 0 8px'}}/>
      {dur && <div style={{color:'var(--ok)',fontSize:14,fontWeight:600,marginBottom:10,textAlign:'center'}}>
        推定消費: {calcExerciseCalories(sel.mets, profile.weight||65, parseFloat(dur||'0'))} kcal
      </div>}
      <button onClick={doSave} style={{...sB,opacity:dur?1:0.5}} disabled={!dur}>記録する</button>
    </div>}

    {todayEx.length > 0 && <div style={sC}>
      <span style={{color:'var(--txt)',fontSize:13,fontWeight:700}}>今日の運動</span>
      {todayEx.map((e,i) => (
        <div key={e.id||i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderTop:'1px solid var(--bor)',marginTop:4}}>
          <span style={{color:'var(--txt)',fontSize:12}}>{e.activity} ({e.durationMin}分)</span>
          <span style={{color:'var(--ok)',fontSize:12,fontWeight:700}}>-{e.caloriesBurned} kcal</span>
        </div>
      ))}
    </div>}
  </div>);
}
