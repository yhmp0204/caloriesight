import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, upsertBodyRecord, deleteBodyRecord } from '../data/db';
import { today, fmtShort } from '../utils/date';
import type { UserProfile, BodyRecord } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

const sC: React.CSSProperties = {background:'var(--card)',borderRadius:16,padding:20,border:'1px solid var(--bor)',marginBottom:12};
const sI: React.CSSProperties = {background:'var(--bg)',color:'var(--txt)',border:'1px solid var(--bor)',borderRadius:10,padding:'10px 14px',fontSize:15,width:'100%',boxSizing:'border-box',outline:'none'};
const sB: React.CSSProperties = {background:'var(--pri)',color:'#fff',border:'none',borderRadius:12,padding:'12px 24px',fontSize:15,fontWeight:600,cursor:'pointer',width:'100%'};

interface Props { profile: UserProfile; }

export default function WeightScreen({ profile }: Props) {
  const [wt, setWt] = useState('');
  const [fat, setFat] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const weights = useLiveQuery(() => db.bodyRecords.orderBy('date').toArray(), []) || [];

  // Edit modal state
  const [editingRec, setEditingRec] = useState<BodyRecord|null>(null);
  const [editWt, setEditWt] = useState('');
  const [editFat, setEditFat] = useState('');

  const openEdit = (r: BodyRecord) => {
    setEditingRec(r);
    setEditWt(String(r.weight));
    setEditFat(r.bodyFatPct != null ? String(r.bodyFatPct) : '');
  };

  const handleEditSave = async () => {
    if (!editingRec || !editWt) return;
    await upsertBodyRecord({ date: editingRec.date, weight: parseFloat(editWt), bodyFatPct: editFat ? parseFloat(editFat) : null });
    setEditingRec(null);
  };

  const handleEditDelete = async () => {
    if (!editingRec?.id) return;
    if (!window.confirm('この記録を削除しますか？')) return;
    await deleteBodyRecord(editingRec.id);
    setEditingRec(null);
  };

  const doSave = async () => {
    if (!wt) return;
    await upsertBodyRecord({ date: today(), weight: parseFloat(wt), bodyFatPct: fat ? parseFloat(fat) : null });
    setWt(''); setFat('');
  };

  const cd = weights.slice(-30).map((w, i, a) => {
    const win = a.slice(Math.max(0,i-6), i+1);
    const avg = win.reduce((s,x) => s+x.weight, 0) / win.length;
    return { date: fmtShort(w.date), 体重: w.weight, '7日平均': +avg.toFixed(1) };
  });

  const lt = weights.length>0 ? weights[weights.length-1].weight : null;
  const diff = weights.length>=2 ? (weights[weights.length-1].weight - weights[weights.length-2].weight).toFixed(1) : null;
  const fromS = weights.length>=2 ? (weights[weights.length-1].weight - weights[0].weight).toFixed(1) : null;

  return (<div className="fade-in">
    <h2 style={{color:'var(--txt)',fontSize:18,fontWeight:700,margin:'0 0 12px'}}>体重管理</h2>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:12}}>
      {[
        {i:'⚖️',v:lt?`${lt}`:'—',l:'現在',u:'kg',c:'var(--txt)'},
        {i:diff&&Number(diff)<0?'📉':'📈',v:diff?`${Number(diff)>0?'+':''}${diff}`:'—',l:'前日比',u:'kg',c:diff&&Number(diff)<0?'var(--ok)':diff&&Number(diff)>0?'var(--err)':'var(--txt)'},
        {i:'🎯',v:fromS?`${Number(fromS)>0?'+':''}${fromS}`:'—',l:'開始時比',u:'kg',c:fromS&&Number(fromS)<0?'var(--ok)':fromS&&Number(fromS)>0?'var(--err)':'var(--txt)'},
      ].map((x,idx) => (
        <div key={idx} style={{...sC,textAlign:'center',padding:12,marginBottom:0}}>
          <div style={{fontSize:16,marginBottom:2}}>{x.i}</div>
          <div style={{fontSize:18,fontWeight:800,color:x.c}}>{x.v}</div>
          <div style={{fontSize:9,color:'var(--sub)'}}>{x.l}({x.u})</div>
        </div>
      ))}
    </div>

    {cd.length > 1 && <div style={sC}>
      <span style={{color:'var(--txt)',fontSize:13,fontWeight:700}}>体重推移</span>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={cd} margin={{top:12,right:4,bottom:0,left:0}}>
          <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6C9CFF" stopOpacity={0.3}/><stop offset="95%" stopColor="#6C9CFF" stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2E3B"/>
          <XAxis dataKey="date" tick={{fill:'#8B92A5',fontSize:9}} axisLine={false} tickLine={false}/>
          <YAxis domain={['dataMin-1','dataMax+1']} tick={{fill:'#8B92A5',fontSize:9}} axisLine={false} tickLine={false} width={34}/>
          {profile.targetWeight>0 && <ReferenceLine y={profile.targetWeight} stroke="#4ADE80" strokeDasharray="5 5" label={{value:'目標',fill:'#4ADE80',fontSize:9}}/>}
          <Tooltip contentStyle={{background:'#1A1D27',border:'1px solid #2A2E3B',borderRadius:8,fontSize:11,color:'#E8ECF4'}}/>
          <Area type="monotone" dataKey="体重" stroke="#6C9CFF" fill="url(#wg)" strokeWidth={2} dot={{r:3}}/>
          <Area type="monotone" dataKey="7日平均" stroke="#A78BFA" fill="none" strokeWidth={2} strokeDasharray="4 4" dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>}

    <div style={sC}>
      <span style={{color:'var(--txt)',fontSize:13,fontWeight:700}}>今日の記録</span>
      <div style={{display:'flex',gap:8,margin:'10px 0'}}>
        <div style={{flex:2}}><label style={{color:'var(--sub)',fontSize:10,display:'block',marginBottom:3}}>体重 (kg)</label>
          <input type="number" step="0.1" placeholder="65.0" value={wt} onChange={e=>setWt(e.target.value)} style={sI}/></div>
        <div style={{flex:1}}><label style={{color:'var(--sub)',fontSize:10,display:'block',marginBottom:3}}>体脂肪 %</label>
          <input type="number" step="0.1" placeholder="20" value={fat} onChange={e=>setFat(e.target.value)} style={sI}/></div>
      </div>
      <button onClick={doSave} style={{...sB,opacity:wt?1:0.5}} disabled={!wt}>記録する</button>
    </div>

    {/* Record list (collapsible) */}
    {weights.length > 0 && <div style={sC}>
      <button onClick={()=>setListOpen(!listOpen)}
        style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',background:'none',border:'none',cursor:'pointer',padding:0}}>
        <div>
          <span style={{color:'var(--txt)',fontSize:13,fontWeight:700}}>記録一覧</span>
          <span style={{color:'var(--sub)',fontSize:10,marginLeft:6}}>({weights.length}件)</span>
        </div>
        <span style={{color:'var(--sub)',fontSize:12}}>{listOpen?'▲ 閉じる':'▼ 開く'}</span>
      </button>
      {listOpen && <>
        <div style={{color:'var(--sub)',fontSize:10,marginTop:4}}>タップで編集</div>
        {weights.slice().reverse().map((r,i) => (
          <button key={r.id||i} onClick={()=>openEdit(r)}
            style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderTop:'1px solid var(--bor)',marginTop:4,
              background:'none',border:'none',width:'100%',cursor:'pointer',textAlign:'left'}}>
            <span style={{color:'var(--sub)',fontSize:12}}>{fmtShort(r.date)}</span>
            <div style={{display:'flex',gap:12}}>
              <span style={{color:'var(--txt)',fontSize:13,fontWeight:700}}>{r.weight}kg</span>
              {r.bodyFatPct != null && <span style={{color:'var(--sub)',fontSize:12}}>{r.bodyFatPct}%</span>}
            </div>
          </button>
        ))}
      </>}
    </div>}

    {/* Edit modal */}
    {editingRec && (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,
        display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
        onClick={()=>setEditingRec(null)}>
        <div style={{...sC,width:'100%',maxWidth:360,margin:0}} onClick={e=>e.stopPropagation()}>
          <div style={{color:'var(--txt)',fontSize:15,fontWeight:700,marginBottom:12}}>{fmtShort(editingRec.date)} の体重を編集</div>
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            <div style={{flex:2}}>
              <label style={{color:'var(--sub)',fontSize:10,display:'block',marginBottom:3}}>体重 (kg)</label>
              <input type="number" step="0.1" value={editWt} onChange={e=>setEditWt(e.target.value)} style={sI}/>
            </div>
            <div style={{flex:1}}>
              <label style={{color:'var(--sub)',fontSize:10,display:'block',marginBottom:3}}>体脂肪 %</label>
              <input type="number" step="0.1" value={editFat} onChange={e=>setEditFat(e.target.value)} style={sI}/>
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
    )}
  </div>);
}
