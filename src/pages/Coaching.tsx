import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { generateWeeklyReport } from '../services/coaching';
import { dateOffset } from '../utils/date';
import type { UserProfile } from '../types';

const sC: React.CSSProperties = {background:'var(--card)',borderRadius:16,padding:20,border:'1px solid var(--bor)',marginBottom:12};
const sB: React.CSSProperties = {background:'var(--pri)',color:'#fff',border:'none',borderRadius:12,padding:'12px 24px',fontSize:15,fontWeight:600,cursor:'pointer',width:'100%'};

interface Props { profile: UserProfile; }

export default function CoachingScreen({ profile }: Props) {
  const [report, setReport] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const weekStart = dateOffset(-6);
  const meals = useLiveQuery(() => db.meals.where('date').aboveOrEqual(weekStart).toArray(), [weekStart]) || [];
  const bodyRecords = useLiveQuery(() => db.bodyRecords.where('date').aboveOrEqual(weekStart).toArray(), [weekStart]) || [];
  const exercises = useLiveQuery(() => db.exercises.where('date').aboveOrEqual(weekStart).toArray(), [weekStart]) || [];
  const habits = useLiveQuery(() => db.habits.where('date').aboveOrEqual(weekStart).toArray(), [weekStart]) || [];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateWeeklyReport({ meals, bodyRecords, exercises, habits, profile });
      setReport(result);
    } catch {
      setReport('レポートの生成に失敗しました。もう一度お試しください。');
    }
    setLoading(false);
  };

  return (<div className="fade-in">
    <h2 style={{color:'var(--txt)',fontSize:18,fontWeight:700,margin:'0 0 12px'}}>AIコーチング</h2>

    <div style={{...sC,textAlign:'center',background:'linear-gradient(135deg,var(--pri-dim),var(--card))'}}>
      <div style={{fontSize:40,marginBottom:8}}>🤖</div>
      <div style={{color:'var(--pri)',fontSize:15,fontWeight:700,marginBottom:4}}>週次AIアドバイス</div>
      <div style={{color:'var(--sub)',fontSize:11,lineHeight:1.6}}>
        今週の食事・運動・体重・生活習慣データを<br/>AIが分析してアドバイスします
      </div>
    </div>

    {/* 今週のサマリー */}
    <div style={sC}>
      <div style={{color:'var(--txt)',fontSize:13,fontWeight:700,marginBottom:10}}>今週の記録状況</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <div style={{background:'var(--bg)',borderRadius:10,padding:10,textAlign:'center'}}>
          <div style={{color:'var(--warn)',fontSize:20,fontWeight:800}}>{new Set(meals.map(m=>m.date)).size}</div>
          <div style={{color:'var(--sub)',fontSize:10}}>食事記録日数 / 7日</div>
        </div>
        <div style={{background:'var(--bg)',borderRadius:10,padding:10,textAlign:'center'}}>
          <div style={{color:'var(--ok)',fontSize:20,fontWeight:800}}>{exercises.length}</div>
          <div style={{color:'var(--sub)',fontSize:10}}>運動記録数</div>
        </div>
        <div style={{background:'var(--bg)',borderRadius:10,padding:10,textAlign:'center'}}>
          <div style={{color:'#6C9CFF',fontSize:20,fontWeight:800}}>{bodyRecords.length}</div>
          <div style={{color:'var(--sub)',fontSize:10}}>体重記録数</div>
        </div>
        <div style={{background:'var(--bg)',borderRadius:10,padding:10,textAlign:'center'}}>
          <div style={{color:'#A78BFA',fontSize:20,fontWeight:800}}>{habits.length}</div>
          <div style={{color:'var(--sub)',fontSize:10}}>習慣記録数</div>
        </div>
      </div>
    </div>

    <button onClick={handleGenerate} disabled={loading}
      style={{...sB,opacity:loading?0.6:1,marginBottom:12}}>
      {loading ? '🔍 分析中...' : '📊 レポートを生成する'}
    </button>

    {loading && (
      <div style={{textAlign:'center',padding:16}}>
        <div style={{color:'var(--sub)',fontSize:12}}>AIがデータを分析しています...</div>
        <div style={{marginTop:8,height:4,background:'var(--bor)',borderRadius:2,overflow:'hidden'}}>
          <div style={{height:'100%',background:'var(--pri)',borderRadius:2,animation:'loading 2s ease infinite',width:'60%'}}/>
        </div>
        <style>{`@keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
      </div>
    )}

    {report && !loading && (
      <div style={{...sC,background:'linear-gradient(135deg,var(--bg),var(--card))'}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
          <span style={{fontSize:18}}>📋</span>
          <span style={{color:'var(--txt)',fontSize:13,fontWeight:700}}>AIアドバイス</span>
        </div>
        <div style={{color:'var(--txt)',fontSize:13,lineHeight:1.8,whiteSpace:'pre-wrap'}}>{report}</div>
      </div>
    )}

    <div style={{padding:12,background:'var(--bg)',borderRadius:10,border:'1px solid var(--bor)'}}>
      <div style={{fontSize:11,color:'var(--sub)',lineHeight:1.6}}>
        💡 Claude APIキーが設定されている場合はAIが分析します。未設定の場合は簡易レポートが表示されます。
      </div>
    </div>
  </div>);
}
