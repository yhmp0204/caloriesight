import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import type { UserProfile, Meal, Exercise, HabitRecord } from '../types';
import { calcDailyTarget, calcTDEE } from '../services/calories';
import { today, dateOffset, fmtShort, dayOfWeek } from '../utils/date';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, PieChart, Pie, Cell, Legend,
} from 'recharts';

const sC: React.CSSProperties = { background:'var(--card)',borderRadius:16,padding:20,border:'1px solid var(--bor)',marginBottom:12 };

function Ring({pct,size=150,stroke=12,color,children}:{pct:number;size?:number;stroke?:number;color:string;children:React.ReactNode}) {
  const r=(size-stroke)/2, ci=2*Math.PI*r, off=ci-(Math.min(pct,100)/100)*ci;
  return (<div style={{position:'relative',width:size,height:size}}>
    <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bor)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={ci} strokeDashoffset={off} strokeLinecap="round" style={{transition:'stroke-dashoffset .8s ease'}}/>
    </svg>
    <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>{children}</div>
  </div>);
}

interface Props { profile: UserProfile; onNavigate: (tab: any) => void; }

export default function DashboardScreen({ profile, onNavigate }: Props) {
  const t = today();
  const todayMeals = useLiveQuery(() => db.meals.where('date').equals(t).toArray(), [t]) || [];
  const todayEx = useLiveQuery(() => db.exercises.where('date').equals(t).toArray(), [t]) || [];
  const allMeals = useLiveQuery(() => db.meals.toArray(), []) || [];
  const allExercises = useLiveQuery(() => db.exercises.toArray(), []) || [];
  const todayHabit = useLiveQuery(() => db.habits.where('date').equals(t).first(), [t]);

  const consumed = todayMeals.reduce((s,m) => s+m.calories, 0);
  const burned = todayEx.reduce((s,e) => s+e.caloriesBurned, 0);
  const target = calcDailyTarget(profile);
  const remaining = Math.max(0, target - consumed + burned);
  const pct = target > 0 ? Math.round(consumed/target*100) : 0;
  const ringC = pct > 100 ? 'var(--err)' : pct > 80 ? 'var(--warn)' : 'var(--ok)';

  // PFC
  const totP = todayMeals.reduce((s,m) => s+m.protein, 0);
  const totF = todayMeals.reduce((s,m) => s+m.fat, 0);
  const totC = todayMeals.reduce((s,m) => s+m.carbs, 0);
  const pfcT = totP+totF+totC || 1;
  const pfcD = [{name:'P',value:totP,color:'#60A5FA'},{name:'F',value:totF,color:'#FBBF24'},{name:'C',value:totC,color:'#4ADE80'}];

  // Streak
  let streak = 0;
  for (let i=0; i<365; i++) {
    if (allMeals.some(m => m.date === dateOffset(-i))) streak++; else break;
  }

  // Week chart with offset navigation
  const [weekOffset, setWeekOffset] = useState(0);
  const tdee = calcTDEE(profile);
  const wk = Array.from({length:7},(_,i) => {
    const d = dateOffset(weekOffset*7 - 6 + i);
    const intake = allMeals.filter(m=>m.date===d).reduce((s,m)=>s+m.calories,0);
    const burn = tdee + allExercises.filter(e=>e.date===d).reduce((s,e)=>s+e.caloriesBurned,0);
    return { day: fmtShort(d), date: d, 摂取: intake, 消費: burn, 差分: intake - burn };
  });
  const weekTotal = { 摂取: wk.reduce((s,d)=>s+d.摂取,0), 消費: wk.reduce((s,d)=>s+d.消費,0) };
  const weekDiff = weekTotal.摂取 - weekTotal.消費;

  const tH = todayHabit || { water:0, sleep:0 };

  return (<div className="fade-in">
    {streak > 0 && <div style={{background:'linear-gradient(135deg,var(--warn-dim),var(--acc-dim))',borderRadius:12,padding:'10px 16px',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
      <span style={{fontSize:22}}>🔥</span>
      <div><div style={{color:'var(--warn)',fontSize:16,fontWeight:800}}>{streak}日連続記録中!</div><div style={{color:'var(--sub)',fontSize:10}}>その調子で続けよう</div></div>
    </div>}

    <div style={{display:'flex',justifyContent:'center',margin:'8px 0 12px'}}>
      <Ring pct={pct} color={ringC}>
        <span style={{fontSize:26,fontWeight:800,color:'var(--txt)'}}>{consumed}</span>
        <span style={{fontSize:11,color:'var(--sub)'}}>/ {target} kcal</span>
      </Ring>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:12}}>
      {[{i:'🍽️',v:consumed,l:'摂取',c:'var(--warn)'},{i:'🔥',v:burned,l:'消費',c:'var(--ok)'},{i:'✨',v:remaining,l:'残り',c:'var(--pri)'}].map((x,idx)=>(
        <div key={idx} style={{...sC,textAlign:'center',padding:12,marginBottom:0}}>
          <div style={{fontSize:16,marginBottom:2}}>{x.i}</div>
          <div style={{fontSize:18,fontWeight:800,color:x.c}}>{x.v}</div>
          <div style={{fontSize:9,color:'var(--sub)'}}>{x.l}(kcal)</div>
        </div>
      ))}
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
      <div style={{...sC,marginBottom:0,padding:14}}>
        <div style={{fontSize:12,fontWeight:700,color:'var(--txt)',marginBottom:4}}>PFCバランス</div>
        {consumed > 0 ? <div style={{display:'flex',alignItems:'center',gap:8}}>
          <PieChart width={60} height={60}><Pie data={pfcD} dataKey="value" cx={30} cy={30} innerRadius={16} outerRadius={28} strokeWidth={0}>
            {pfcD.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart>
          <div style={{fontSize:10,color:'var(--sub)',lineHeight:1.8}}>
            <div><span style={{color:'#60A5FA',fontWeight:700}}>P</span> {totP}g ({Math.round(totP/pfcT*100)}%)</div>
            <div><span style={{color:'#FBBF24',fontWeight:700}}>F</span> {totF}g ({Math.round(totF/pfcT*100)}%)</div>
            <div><span style={{color:'#4ADE80',fontWeight:700}}>C</span> {totC}g ({Math.round(totC/pfcT*100)}%)</div>
          </div>
        </div> : <div style={{color:'var(--sub)',fontSize:11,padding:'16px 0',textAlign:'center'}}>食事を記録するとPFCが表示されます</div>}
      </div>
      <div style={{...sC,marginBottom:0,padding:14}}>
        <div style={{fontSize:12,fontWeight:700,color:'var(--txt)',marginBottom:8}}>今日の習慣</div>
        {[{i:'💧',v:tH.water||0,max:2000,u:'ml',c:'var(--pri)'},{i:'😴',v:tH.sleep||0,max:8,u:'h',c:'var(--acc)'}].map((h,idx)=>(
          <div key={idx} style={{display:'flex',alignItems:'center',gap:6,marginBottom:idx===0?6:0}}>
            <span style={{fontSize:16}}>{h.i}</span>
            <div style={{flex:1,height:8,background:'var(--bor)',borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',background:h.c,borderRadius:4,width:`${Math.min(100,h.v/h.max*100)}%`,transition:'width .3s'}}/>
            </div>
            <span style={{fontSize:10,color:'var(--sub)',minWidth:36}}>{h.v}{h.u}</span>
          </div>
        ))}
      </div>
    </div>

    {todayMeals.length > 0 && <div style={sC}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <span style={{color:'var(--txt)',fontSize:13,fontWeight:700}}>今日の食事</span>
        <button onClick={()=>onNavigate('meal')} style={{background:'none',border:'none',color:'var(--pri)',fontSize:11,cursor:'pointer'}}>+ 追加</button>
      </div>
      {todayMeals.map((m,i) => (
        <div key={m.id||i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:i<todayMeals.length-1?'1px solid var(--bor)':'none'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:16}}>{m.emoji||'🍽️'}</span>
            <div>
              <span style={{color:'var(--txt)',fontSize:13}}>{m.dishName}</span>
              <div style={{fontSize:9,color:'var(--sub)'}}>P:{m.protein}g F:{m.fat}g C:{m.carbs}g</div>
            </div>
          </div>
          <span style={{color:'var(--warn)',fontSize:13,fontWeight:700}}>{m.calories}</span>
        </div>
      ))}
    </div>}

    <div style={sC}>
      {/* Week navigation */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <button onClick={()=>setWeekOffset(weekOffset-1)}
          style={{background:'none',border:'none',color:'var(--pri)',fontSize:12,cursor:'pointer',padding:'4px 8px'}}>← 前の週</button>
        <span style={{color:'var(--txt)',fontSize:13,fontWeight:700}}>
          {weekOffset===0 ? '今週' : `${fmtShort(wk[0].date)}〜${fmtShort(wk[6].date)}`}
        </span>
        {weekOffset < 0
          ? <button onClick={()=>setWeekOffset(weekOffset+1)}
              style={{background:'none',border:'none',color:'var(--pri)',fontSize:12,cursor:'pointer',padding:'4px 8px'}}>次の週 →</button>
          : <span style={{width:60}}/>}
      </div>
      {weekOffset !== 0 && (
        <div style={{textAlign:'center',marginBottom:6}}>
          <button onClick={()=>setWeekOffset(0)}
            style={{background:'var(--pri-dim)',border:'none',color:'var(--pri)',fontSize:10,padding:'3px 10px',borderRadius:6,cursor:'pointer'}}>
            今週に戻る
          </button>
        </div>
      )}

      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={wk} barGap={2} margin={{top:12,right:4,bottom:0,left:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bor)"/>
          <XAxis dataKey="day" tick={{fill:'#8B92A5',fontSize:9}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fill:'#8B92A5',fontSize:9}} axisLine={false} tickLine={false} width={36}/>
          <Tooltip contentStyle={{background:'#1A1D27',border:'1px solid #2A2E3B',borderRadius:8,fontSize:11,color:'#E8ECF4'}}/>
          <Legend wrapperStyle={{fontSize:10}} iconSize={8}/>
          <ReferenceLine y={target} stroke="#6C9CFF" strokeDasharray="4 4" label={{value:'目標',fill:'#6C9CFF',fontSize:9,position:'right'}}/>
          <Bar dataKey="摂取" fill="#FBBF24" radius={[4,4,0,0]}/>
          <Bar dataKey="消費" fill="#4ADE80" radius={[4,4,0,0]}/>
        </BarChart>
      </ResponsiveContainer>

      {/* Daily diff table */}
      <div style={{marginTop:8}}>
        <div style={{display:'grid',gridTemplateColumns:'40px 1fr 1fr 1fr',gap:2,fontSize:9,color:'var(--sub)',marginBottom:4}}>
          <span>日付</span><span style={{textAlign:'right'}}>摂取</span><span style={{textAlign:'right'}}>消費</span><span style={{textAlign:'right'}}>差分</span>
        </div>
        {wk.map((d,i) => (
          <div key={i} style={{display:'grid',gridTemplateColumns:'40px 1fr 1fr 1fr',gap:2,fontSize:11,padding:'3px 0',borderTop:'1px solid var(--bor)'}}>
            <span style={{color:'var(--sub)',fontSize:10}}>{d.day}</span>
            <span style={{textAlign:'right',color:'var(--warn)',fontWeight:600}}>{d.摂取}</span>
            <span style={{textAlign:'right',color:'var(--ok)',fontWeight:600}}>{d.消費}</span>
            <span style={{textAlign:'right',fontWeight:700,color:d.差分<=0?'var(--ok)':'var(--err)'}}>
              {d.差分>0?'+':''}{d.差分}
            </span>
          </div>
        ))}
        <div style={{display:'grid',gridTemplateColumns:'40px 1fr 1fr 1fr',gap:2,fontSize:11,padding:'5px 0',borderTop:'2px solid var(--bor)',fontWeight:700}}>
          <span style={{color:'var(--txt)',fontSize:10}}>週計</span>
          <span style={{textAlign:'right',color:'var(--warn)'}}>{weekTotal.摂取}</span>
          <span style={{textAlign:'right',color:'var(--ok)'}}>{weekTotal.消費}</span>
          <span style={{textAlign:'right',color:weekDiff<=0?'var(--ok)':'var(--err)'}}>
            {weekDiff>0?'+':''}{weekDiff}
          </span>
        </div>
      </div>
    </div>
  </div>);
}
