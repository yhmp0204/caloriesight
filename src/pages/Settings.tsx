import { useState } from 'react';
import type { UserProfile } from '../types';
import { calcBMR, calcTDEE, calcDailyTarget, calcRawDailyTarget, calcSafeEstimatedDate, assessGoalSafety } from '../services/calories';
import { getApiKeyStatus, getGeminiKey, getClaudeKey, setGeminiKey, setClaudeKey } from '../services/apikeys';

interface Props { profile?: UserProfile; onSave: (p: UserProfile) => void; }

const sC: React.CSSProperties = { background:'var(--card)',borderRadius:16,padding:20,border:'1px solid var(--bor)',marginBottom:12 };
const sI: React.CSSProperties = { background:'var(--bg)',color:'var(--txt)',border:'1px solid var(--bor)',borderRadius:10,padding:'10px 14px',fontSize:15,width:'100%',boxSizing:'border-box',outline:'none' };

export default function SettingsScreen({ profile, onSave }: Props) {
  const defaults: UserProfile = { height:0,age:0,weight:0,gender:'male',activityLevel:1.2,targetWeight:0,targetDate:'' };
  const [f,setF] = useState<UserProfile>(profile || defaults);
  const [saved,setSaved] = useState(false);
  const [gemKey,setGemKey] = useState(getGeminiKey());
  const [claKey,setClaKey] = useState(getClaudeKey());
  const [keySaved,setKeySaved] = useState(false);

  const bmr = calcBMR(f);
  const tdee = calcTDEE(f);
  const safeTarget = calcDailyTarget(f);
  const rawTarget = calcRawDailyTarget(f);
  const safeDate = calcSafeEstimatedDate(f);
  const safety = assessGoalSafety(f);
  const hasGoal = f.targetWeight > 0 && f.targetDate && f.weight > f.targetWeight;

  const saveProfile = () => { onSave(f); setSaved(true); setTimeout(()=>setSaved(false),2000); };
  const saveKeys = () => { setGeminiKey(gemKey.trim()); setClaudeKey(claKey.trim()); setKeySaved(true); setTimeout(()=>setKeySaved(false),2000); };

  const F = ({l,children}:{l:string,children:React.ReactNode}) => (
    <div><label style={{color:'var(--sub)',fontSize:10,display:'block',marginBottom:3}}>{l}</label>{children}</div>
  );

  const safetyColor = safety.level === 'safe' ? 'var(--ok)' : safety.level === 'caution' ? 'var(--warn)' : 'var(--err)';
  const safetyBg = safety.level === 'safe' ? 'var(--ok-dim)' : safety.level === 'caution' ? 'var(--warn-dim)' : 'rgba(248,113,113,0.12)';
  const safetyIcon = safety.level === 'safe' ? '✅' : safety.level === 'caution' ? '⚠️' : '🚨';

  return (<div className="fade-in">
    <h2 style={{color:'var(--txt)',fontSize:18,fontWeight:700,margin:'0 0 12px'}}>プロフィール設定</h2>

    {/* 基本情報 */}
    <div style={sC}>
      <div style={{color:'var(--txt)',fontSize:13,fontWeight:700,marginBottom:10}}>基本情報</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <F l="身長 (cm)"><input type="number" value={f.height||''} onChange={e=>setF({...f,height:+e.target.value})} placeholder="170" style={sI}/></F>
        <F l="年齢"><input type="number" value={f.age||''} onChange={e=>setF({...f,age:+e.target.value})} placeholder="30" style={sI}/></F>
        <F l="現在の体重 (kg)"><input type="number" step="0.1" value={f.weight||''} onChange={e=>setF({...f,weight:+e.target.value})} placeholder="70" style={sI}/></F>
        <F l="性別"><select value={f.gender} onChange={e=>setF({...f,gender:e.target.value as 'male'|'female'})} style={sI}><option value="male">男性</option><option value="female">女性</option></select></F>
      </div>
      <div style={{marginTop:8}}>
        <F l="活動レベル"><select value={f.activityLevel} onChange={e=>setF({...f,activityLevel:+e.target.value})} style={sI}>
          <option value={1.2}>座り仕事中心</option><option value={1.375}>軽い運動（週1-3回）</option>
          <option value={1.55}>中程度の運動（週3-5回）</option><option value={1.725}>激しい運動（週6-7回）</option>
        </select></F>
      </div>
    </div>

    {/* 目標 */}
    <div style={sC}>
      <div style={{color:'var(--txt)',fontSize:13,fontWeight:700,marginBottom:10}}>目標設定</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <F l="目標体重 (kg)"><input type="number" step="0.1" value={f.targetWeight||''} onChange={e=>setF({...f,targetWeight:+e.target.value})} placeholder="65" style={sI}/></F>
        <F l="目標期限"><input type="date" value={f.targetDate||''} onChange={e=>setF({...f,targetDate:e.target.value})} style={sI}/></F>
      </div>
      {hasGoal && <div style={{marginTop:8,padding:'6px 10px',background:'var(--ok-dim)',borderRadius:8,fontSize:11,color:'var(--ok)'}}>
        🎯 目標まであと {(f.weight-f.targetWeight).toFixed(1)} kg
      </div>}
    </div>

    {/* 計算結果 */}
    {bmr > 0 && <div style={{...sC,background:'linear-gradient(135deg,var(--pri-dim),var(--card))'}}>
      <div style={{color:'var(--txt)',fontSize:13,fontWeight:700,marginBottom:12}}>自動計算結果</div>

      {/* 基本数値 */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
        <div style={{textAlign:'center',padding:10,background:'var(--bg)',borderRadius:10}}>
          <div style={{fontSize:10,color:'var(--sub)',marginBottom:4}}>基礎代謝 (BMR)</div>
          <div style={{fontSize:22,fontWeight:800,color:'var(--txt)'}}>{bmr}</div>
          <div style={{fontSize:9,color:'var(--sub)'}}>kcal/日</div>
        </div>
        <div style={{textAlign:'center',padding:10,background:'var(--bg)',borderRadius:10}}>
          <div style={{fontSize:10,color:'var(--sub)',marginBottom:4}}>総消費 (TDEE)</div>
          <div style={{fontSize:22,fontWeight:800,color:'var(--txt)'}}>{tdee}</div>
          <div style={{fontSize:9,color:'var(--sub)'}}>kcal/日</div>
        </div>
      </div>

      {/* 2種類の目標摂取カロリー */}
      {hasGoal && <>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
          {/* 期限通り */}
          <div style={{padding:12,borderRadius:10,border:`1px solid ${rawTarget < bmr ? 'var(--err)' : 'var(--bor)'}`,background:'var(--bg)'}}>
            <div style={{fontSize:10,color:'var(--sub)',marginBottom:4}}>📅 期限通りの目標</div>
            <div style={{fontSize:24,fontWeight:800,color: rawTarget < bmr ? 'var(--err)' : 'var(--warn)'}}>{rawTarget}</div>
            <div style={{fontSize:9,color:'var(--sub)'}}>kcal/日</div>
            <div style={{fontSize:9,color:'var(--sub)',marginTop:4}}>赤字: {tdee - rawTarget} kcal/日</div>
            {rawTarget < bmr && <div style={{fontSize:9,color:'var(--err)',marginTop:2,fontWeight:600}}>⚠️ 基礎代謝以下</div>}
          </div>
          {/* 健康セーフ */}
          <div style={{padding:12,borderRadius:10,border:'2px solid var(--ok)',background:'var(--ok-dim)'}}>
            <div style={{fontSize:10,color:'var(--ok)',marginBottom:4,fontWeight:600}}>💚 おすすめ目標</div>
            <div style={{fontSize:24,fontWeight:800,color:'var(--ok)'}}>{safeTarget}</div>
            <div style={{fontSize:9,color:'var(--sub)'}}>kcal/日</div>
            <div style={{fontSize:9,color:'var(--sub)',marginTop:4}}>赤字: {tdee - safeTarget} kcal/日</div>
            <div style={{fontSize:9,color:'var(--ok)',marginTop:2,fontWeight:600}}>✅ 上限500kcal/日</div>
          </div>
        </div>

        {/* 安全ペースの到達予定日 */}
        {safeDate && rawTarget !== safeTarget && (
          <div style={{padding:10,background:'var(--bg)',borderRadius:10,marginBottom:12}}>
            <div style={{fontSize:11,color:'var(--sub)',lineHeight:1.6}}>
              💚 おすすめペース（-500kcal/日）で進めた場合の到達予定日:
              <span style={{color:'var(--ok)',fontWeight:700,marginLeft:4}}>
                {safeDate.replace(/-/g, '/')}
              </span>
            </div>
          </div>
        )}

        {/* 安全性判定 */}
        <div style={{padding:'8px 12px',background:safetyBg,borderRadius:8,fontSize:11,color:safetyColor,lineHeight:1.5}}>
          {safetyIcon} {safety.message}
        </div>

        <div style={{marginTop:10,fontSize:10,color:'var(--sub)',lineHeight:1.6,padding:'0 4px'}}>
          ※ ダッシュボードの日常管理には「💚 おすすめ目標」が適用されます。急激な制限はリバウンドや体調不良の原因になるため、1日の赤字は500kcalを上限にしています。
        </div>
      </>}

      {/* 目標未設定時 */}
      {!hasGoal && <div style={{textAlign:'center',padding:8}}>
        <div style={{fontSize:11,color:'var(--sub)'}}>目標体重と期限を設定すると、目標摂取カロリーが計算されます</div>
      </div>}
    </div>}

    <button onClick={saveProfile}
      style={{background:saved?'var(--ok)':'var(--pri)',color:'#fff',border:'none',borderRadius:12,padding:'12px 24px',fontSize:15,fontWeight:600,cursor:'pointer',width:'100%',marginBottom:16}}>
      {saved?'✓ プロフィール保存しました！':'プロフィールを保存'}
    </button>

    {/* APIキー設定 */}
    <div style={sC}>
      <div style={{color:'var(--txt)',fontSize:13,fontWeight:700,marginBottom:10}}>🔑 APIキー設定</div>
      <div style={{fontSize:11,color:'var(--sub)',marginBottom:12,lineHeight:1.6}}>
        APIキーはこの端末のブラウザ内にのみ保存されます。サーバーには送信されません。
      </div>
      <F l="Gemini API Key（食事写真認識用）">
        <input type="password" value={gemKey} onChange={e=>setGemKey(e.target.value)}
          placeholder="AIzaSy..." style={{...sI,fontFamily:'monospace',fontSize:13,marginBottom:4}}/>
        <div style={{fontSize:10,color:'var(--sub)'}}>
          取得先: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style={{color:'var(--pri)'}}>aistudio.google.com/apikey</a>
        </div>
      </F>
      <div style={{marginTop:12}}>
        <F l="Claude API Key（AIコーチング用）">
          <input type="password" value={claKey} onChange={e=>setClaKey(e.target.value)}
            placeholder="sk-ant-..." style={{...sI,fontFamily:'monospace',fontSize:13,marginBottom:4}}/>
          <div style={{fontSize:10,color:'var(--sub)'}}>
            取得先: <a href="https://console.anthropic.com/" target="_blank" rel="noopener" style={{color:'var(--pri)'}}>console.anthropic.com</a>
          </div>
        </F>
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center',marginTop:12}}>
        {[{ok:gemKey.length>0,l:'Gemini'},{ok:claKey.length>0,l:'Claude'}].map((a,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:11}}>
            <span>{a.ok?'🟢':'⚪'}</span><span style={{color:a.ok?'var(--ok)':'var(--sub)'}}>{a.l}</span>
          </div>
        ))}
      </div>
      <button onClick={saveKeys}
        style={{background:keySaved?'var(--ok)':'var(--acc)',color:'#fff',border:'none',borderRadius:12,padding:'10px 20px',fontSize:14,fontWeight:600,cursor:'pointer',width:'100%',marginTop:12}}>
        {keySaved?'✓ APIキー保存しました！':'APIキーを保存'}
      </button>
    </div>

    <div style={{marginTop:16,padding:12,background:'var(--bg)',borderRadius:10,border:'1px solid var(--bor)',textAlign:'center'}}>
      <div style={{fontSize:11,color:'var(--sub)'}}>CalorieSight v0.3 | Powered by Gemini + Claude API</div>
    </div>
  </div>);
}
