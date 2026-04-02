import { useLiveQuery } from 'dexie-react-hooks';
import { db, upsertHabit } from '../data/db';
import { today, dateOffset, fmtShort, dayOfWeek } from '../utils/date';

const sC: React.CSSProperties = {background:'var(--card)',borderRadius:16,padding:20,border:'1px solid var(--bor)',marginBottom:12};

export default function HabitScreen() {
  const t = today();
  const todayHabit = useLiveQuery(() => db.habits.where('date').equals(t).first(), [t]);
  const allHabits = useLiveQuery(() => db.habits.toArray(), []) || [];
  const allMeals = useLiveQuery(() => db.meals.toArray(), []) || [];

  const tH = todayHabit || { date: t, water: 0, sleep: 0 };

  const updateHabit = async (field: 'water'|'sleep', value: number) => {
    await upsertHabit({ ...tH, [field]: value, date: t });
  };

  let streak = 0;
  for (let i=0; i<365; i++) {
    if (allMeals.some(m => m.date === dateOffset(-i))) streak++; else break;
  }

  const weekDays = Array.from({length:7}, (_,i) => dateOffset(-6+i));

  return (<div className="fade-in">
    <h2 style={{color:'var(--txt)',fontSize:18,fontWeight:700,margin:'0 0 12px'}}>生活習慣</h2>

    {/* Streak */}
    <div style={{...sC,textAlign:'center',padding:16,background:'linear-gradient(135deg,var(--warn-dim),var(--acc-dim))'}}>
      <div style={{fontSize:36}}>🔥</div>
      <div style={{fontSize:28,fontWeight:800,color:'var(--warn)'}}>{streak}日</div>
      <div style={{fontSize:11,color:'var(--sub)'}}>連続記録ストリーク</div>
      <div style={{display:'flex',justifyContent:'center',gap:3,marginTop:10}}>
        {weekDays.map((d,i)=>(
          <div key={i} style={{width:28,height:28,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:9,fontWeight:600,background:allMeals.some(m=>m.date===d)?'var(--ok-dim)':'var(--bor)',
            color:allMeals.some(m=>m.date===d)?'var(--ok)':'var(--sub)'}}>{dayOfWeek(d)}</div>
        ))}
      </div>
    </div>

    {/* Water */}
    <div style={sC}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <span style={{color:'var(--txt)',fontSize:14,fontWeight:700}}>💧 水分摂取</span>
        <span style={{color:'var(--pri)',fontSize:16,fontWeight:800}}>{tH.water||0} ml</span>
      </div>
      <div style={{height:12,background:'var(--bor)',borderRadius:6,overflow:'hidden',marginBottom:10}}>
        <div style={{height:'100%',background:'linear-gradient(90deg,var(--pri),var(--acc))',borderRadius:6,width:`${Math.min(100,(tH.water||0)/2000*100)}%`,transition:'width .4s'}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'var(--sub)',marginBottom:10}}><span>0 ml</span><span>目標: 2,000 ml</span></div>
      <div style={{display:'flex',gap:6}}>
        {[{ml:200,l:'コップ',i:'🥛'},{ml:350,l:'ペットボトル半',i:'🧃'},{ml:500,l:'ペットボトル',i:'💧'}].map((b,i)=>(
          <button key={i} onClick={()=>updateHabit('water',(tH.water||0)+b.ml)}
            style={{flex:1,padding:'10px 4px',borderRadius:10,border:'1px solid var(--bor)',background:'var(--card)',cursor:'pointer',textAlign:'center'}}>
            <div style={{fontSize:18}}>{b.i}</div><div style={{color:'var(--txt)',fontSize:10,fontWeight:600}}>+{b.ml}ml</div>
          </button>
        ))}
      </div>
      {(tH.water||0) > 0 && <button onClick={()=>updateHabit('water',Math.max(0,(tH.water||0)-200))}
        style={{background:'none',border:'none',color:'var(--sub)',fontSize:10,cursor:'pointer',marginTop:8,width:'100%',textAlign:'center'}}>取り消し (-200ml)</button>}
    </div>

    {/* Sleep */}
    <div style={sC}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <span style={{color:'var(--txt)',fontSize:14,fontWeight:700}}>😴 睡眠時間</span>
        <span style={{color:'var(--acc)',fontSize:16,fontWeight:800}}>{tH.sleep||0} 時間</span>
      </div>
      <div style={{height:12,background:'var(--bor)',borderRadius:6,overflow:'hidden',marginBottom:10}}>
        <div style={{height:'100%',background:'linear-gradient(90deg,var(--acc),var(--pri))',borderRadius:6,width:`${Math.min(100,(tH.sleep||0)/8*100)}%`,transition:'width .4s'}}/>
      </div>
      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
        {[4,5,5.5,6,6.5,7,7.5,8,9].map(h=>(
          <button key={h} onClick={()=>updateHabit('sleep',h)}
            style={{padding:'8px 12px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,
              background:tH.sleep===h?'var(--acc-dim)':'var(--card)',color:tH.sleep===h?'var(--acc)':'var(--sub)',
              outline:tH.sleep===h?'2px solid var(--acc)':'1px solid var(--bor)'}}>{h}h</button>
        ))}
      </div>
    </div>

    {/* Weekly summary */}
    <div style={sC}>
      <span style={{color:'var(--txt)',fontSize:13,fontWeight:700}}>週間サマリー</span>
      <div style={{marginTop:8}}>
        {weekDays.map((d,i) => {
          const h = allHabits.find(hb => hb.date === d) || { water:0, sleep:0 };
          return (<div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:i<6?'1px solid var(--bor)':'none'}}>
            <span style={{fontSize:10,color:'var(--sub)',width:36}}>{fmtShort(d)}</span>
            <span style={{fontSize:10,color:'var(--sub)',width:16}}>{dayOfWeek(d)}</span>
            <span style={{fontSize:12}}>{allMeals.some(m=>m.date===d)?'✅':'⬜'}</span>
            <div style={{flex:1,display:'flex',alignItems:'center',gap:4}}>
              <span style={{fontSize:9}}>💧</span>
              <div style={{flex:1,height:4,background:'var(--bor)',borderRadius:2}}><div style={{height:'100%',background:'var(--pri)',borderRadius:2,width:`${Math.min(100,h.water/2000*100)}%`}}/></div>
            </div>
            <div style={{flex:1,display:'flex',alignItems:'center',gap:4}}>
              <span style={{fontSize:9}}>😴</span>
              <div style={{flex:1,height:4,background:'var(--bor)',borderRadius:2}}><div style={{height:'100%',background:'var(--acc)',borderRadius:2,width:`${Math.min(100,h.sleep/8*100)}%`}}/></div>
            </div>
          </div>);
        })}
      </div>
    </div>
  </div>);
}
