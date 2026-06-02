import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addExercise, updateExercise, deleteExercise } from '../data/db';
import { EXERCISE_DB } from '../data/foods';
import { calcExerciseCalories } from '../services/calories';
import { today, fmtShort, dayOfWeek } from '../utils/date';
import type { UserProfile, ExerciseType, Exercise } from '../types';

const sC: React.CSSProperties = {background:'var(--card)',borderRadius:16,padding:20,border:'1px solid var(--bor)',marginBottom:12};
const sI: React.CSSProperties = {background:'var(--bg)',color:'var(--txt)',border:'1px solid var(--bor)',borderRadius:10,padding:'10px 14px',fontSize:15,width:'100%',boxSizing:'border-box',outline:'none'};
const sB: React.CSSProperties = {background:'var(--pri)',color:'#fff',border:'none',borderRadius:12,padding:'12px 24px',fontSize:15,fontWeight:600,cursor:'pointer',width:'100%'};

interface Props { profile: UserProfile; }

export default function ExerciseScreen({ profile }: Props) {
  const [sel, setSel] = useState<ExerciseType|null>(null);
  const [dur, setDur] = useState('');
  const [inputDate, setInputDate] = useState(today());
  const [listOpen, setListOpen] = useState(false);

  const todayStr = today();
  const todayEx = useLiveQuery(() => db.exercises.where('date').equals(todayStr).toArray(), [todayStr]) || [];
  const allEx = useLiveQuery(() => db.exercises.orderBy('date').reverse().toArray(), []) || [];
  const total = todayEx.reduce((s,e) => s+e.caloriesBurned, 0);

  // Edit modal state
  const [editingEx, setEditingEx] = useState<Exercise|null>(null);
  const [editDate, setEditDate] = useState('');
  const [editDur, setEditDur] = useState('');

  const openEdit = (e: Exercise) => {
    setEditingEx(e);
    setEditDate(e.date);
    setEditDur(String(e.durationMin));
  };

  const handleEditSave = async () => {
    if (!editingEx?.id || !editDur || !editDate) return;
    const cal = calcExerciseCalories(editingEx.mets, profile.weight || 65, parseFloat(editDur));
    await updateExercise(editingEx.id, {
      date: editDate, durationMin: parseFloat(editDur), caloriesBurned: cal,
    });
    setEditingEx(null);
  };

  const handleEditDelete = async () => {
    if (!editingEx?.id) return;
    if (!window.confirm('この記録を削除しますか？')) return;
    await deleteExercise(editingEx.id);
    setEditingEx(null);
  };

  const doSave = async () => {
    if (!sel || !dur) return;
    const cal = calcExerciseCalories(sel.mets, profile.weight || 65, parseFloat(dur));
    await addExercise({ date: inputDate, activity: sel.name, durationMin: parseFloat(dur), mets: sel.mets, caloriesBurned: cal });
    setSel(null); setDur(''); setInputDate(today());
  };

  // Group past exercises by date
  const exByDate = allEx.reduce<Record<string, Exercise[]>>((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});

  return (<div className="fade-in">
    <h2 style={{color:'var(--txt)',fontSize:18,fontWeight:700,margin:'0 0 12px'}}>運動記録</h2>

    {total > 0 && <div style={{...sC,textAlign:'center',padding:14,background:'linear-gradient(135deg,var(--ok-dim),var(--card))'}}>
      <div style={{fontSize:10,color:'var(--sub)'}}>今日の消費カロリー</div>
      <div style={{fontSize:28,fontWeight:800,color:'var(--ok)'}}>{total} kcal</div>
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
      <div style={{marginBottom:8}}>
        <label style={{color:'var(--sub)',fontSize:10,display:'block',marginBottom:3}}>📅 記録日</label>
        <input type="date" value={inputDate} onChange={e=>setInputDate(e.target.value)} style={sI}/>
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
      <div style={{color:'var(--sub)',fontSize:10,marginTop:2}}>タップで編集</div>
      {todayEx.map((e,i) => (
        <button key={e.id||i} onClick={()=>openEdit(e)}
          style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderTop:'1px solid var(--bor)',marginTop:4,
            background:'none',border:'none',width:'100%',cursor:'pointer',textAlign:'left'}}>
          <span style={{color:'var(--txt)',fontSize:12}}>{e.activity} ({e.durationMin}分)</span>
          <span style={{color:'var(--ok)',fontSize:12,fontWeight:700}}>-{e.caloriesBurned} kcal</span>
        </button>
      ))}
    </div>}

    {/* History list (collapsible) */}
    {allEx.length > 0 && <div style={sC}>
      <button onClick={()=>setListOpen(!listOpen)}
        style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',background:'none',border:'none',cursor:'pointer',padding:0}}>
        <div>
          <span style={{color:'var(--txt)',fontSize:13,fontWeight:700}}>記録一覧</span>
          <span style={{color:'var(--sub)',fontSize:10,marginLeft:6}}>({allEx.length}件)</span>
        </div>
        <span style={{color:'var(--sub)',fontSize:12}}>{listOpen?'▲ 閉じる':'▼ 開く'}</span>
      </button>
      {listOpen && <>
        <div style={{color:'var(--sub)',fontSize:10,marginTop:4}}>タップで編集</div>
        {Object.keys(exByDate).map(d => (
          <div key={d}>
            <div style={{color:'var(--sub)',fontSize:10,fontWeight:700,marginTop:8,paddingBottom:2}}>
              {fmtShort(d)}({dayOfWeek(d)})
            </div>
            {exByDate[d].map((e,i) => (
              <button key={e.id||i} onClick={()=>openEdit(e)}
                style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderTop:'1px solid var(--bor)',
                  background:'none',border:'none',width:'100%',cursor:'pointer',textAlign:'left'}}>
                <span style={{color:'var(--txt)',fontSize:12}}>{e.activity} ({e.durationMin}分)</span>
                <span style={{color:'var(--ok)',fontSize:12,fontWeight:700}}>-{e.caloriesBurned} kcal</span>
              </button>
            ))}
          </div>
        ))}
      </>}
    </div>}

    {/* Edit modal */}
    {editingEx && (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,
        display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
        onClick={()=>setEditingEx(null)}>
        <div style={{...sC,width:'100%',maxWidth:360,margin:0}} onClick={e=>e.stopPropagation()}>
          <div style={{color:'var(--txt)',fontSize:15,fontWeight:700,marginBottom:12}}>運動を編集</div>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
            <span style={{color:'var(--txt)',fontSize:14,fontWeight:600}}>{editingEx.activity}</span>
            <span style={{color:'var(--sub)',fontSize:10}}>METs:{editingEx.mets}</span>
          </div>
          <div style={{marginBottom:8}}>
            <label style={{color:'var(--sub)',fontSize:10,display:'block',marginBottom:3}}>📅 記録日</label>
            <input type="date" value={editDate} onChange={e=>setEditDate(e.target.value)} style={sI}/>
          </div>
          <div style={{marginBottom:8}}>
            <label style={{color:'var(--sub)',fontSize:10,display:'block',marginBottom:3}}>運動時間（分）</label>
            <input type="number" value={editDur} onChange={e=>setEditDur(e.target.value)} style={sI}/>
          </div>
          {editDur && <div style={{color:'var(--ok)',fontSize:13,fontWeight:600,marginBottom:10,textAlign:'center'}}>
            推定消費: {calcExerciseCalories(editingEx.mets, profile.weight||65, parseFloat(editDur||'0'))} kcal
          </div>}
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
    )}
  </div>);
}
