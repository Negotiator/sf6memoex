import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { GoogleGenerativeAI } from "@google/generative-ai";

const CHARACTERS = [
  { name: 'ALL', id: 'all' }, // キャラクター欄の先頭にALLを追加
  { name: 'リュウ', id: 'ryu' }, { name: 'ルーク', id: 'luke' }, { name: 'ジェイミー', id: 'jamie' },
  { name: '春麗', id: 'chun-li' }, { name: 'ガイル', id: 'guile' }, { name: 'キンバリー', id: 'kimberly' },
  { name: 'ジュリ', id: 'juri' }, { name: 'ケン', id: 'ken' }, { name: 'ブランカ', id: 'blanka' },
  { name: 'ダルシム', id: 'dhalsim' }, { name: 'E.本田', id: 'e-honda' }, { name: 'ディージェイ', id: 'dee-jay' },
  { name: 'マノン', id: 'manon' }, { name: 'マリーザ', id: 'marisa' }, { name: 'JP', id: 'jp' },
  { name: 'ザンギエフ', id: 'zangief' }, { name: 'リリー', id: 'lily' }, { name: 'キャミィ', id: 'cammy' },
  { name: 'ラシード', id: 'rashid' }, { name: 'A.K.I.', id: 'aki' }, { name: 'エド', id: 'ed' },
  { name: '豪鬼', id: 'akuma' }, { name: 'ベガ', id: 'm-bison' }, { name: 'テリー', id: 'terry' },
  { name: '舞', id: 'mai' }, { name: 'エレナ', id: 'elena' }, { name: 'サガット', id: 'sagat' },
  { name: 'C.ヴァイパー', id: 'crimson-viper' }, { name: 'アレックス', id: 'alex' }, { name: 'イングリット', id: 'ingrid' }
].sort((a, b) => a.id === 'all' ? -1 : b.id === 'all' ? 1 : a.name.localeCompare(b.name, 'ja'));

const NAME_MAP = {
  "ALL": "ALL", "GOUKI": "豪鬼", "AKUMA": "豪鬼", "C.VIPER": "C.ヴァイパー", "C. VIPER": "C.ヴァイパー",
  "E.HONDA": "E.本田", "E. HONDA": "E.本田", "RYU": "リュウ", "LUKE": "ルーク", "JAMIE": "ジェイミー", 
  "CHUN-LI": "春麗", "GUILE": "ガイル", "KIMBERLY": "キンバリー", "JURI": "ジュリ", "KEN": "ケン", 
  "BLANKA": "ブランカ", "DHALSIM": "ダルシム", "DEE JAY": "ディージェイ", "MANON": "マノン", 
  "MARISA": "マリーザ", "JP": "JP", "ZANGIEF": "ザンギエフ", "LILY": "リリー", "CAMMY": "キャミィ", 
  "RASHID": "ラシード", "A.K.I.": "A.K.I.", "ED": "エド", "VEGA": "ベガ", "M. BISON": "ベガ", 
  "TERRY": "テリー", "MAI": "舞", "ELENA": "エレナ", "SAGAT": "サガット", "ALEX": "アレックス", "INGRID": "イングリット"
};

const COMMON_CMDS = ['5', '2', '6', '4', '8', '236', '214', '623', '41236', '63214'];
const CLASSIC_CMDS = ['LP', 'MP', 'HP', 'LK', 'MK', 'HK'];
const MODERN_CMDS = ['L', 'M', 'H', 'SP', 'AS'];
const SYSTEM_CMDS = ['DR', 'PC', 'TC', '前ステ', 'OD', 'SA1', 'SA2', 'SA3'];
const HIT_TYPES = ['通常', 'パニカン', 'カウンター', '持続', '空中'];
const LOCATIONS = ['中央', '画面端', 'どこでも'];

const TABS = [
  { id: 'strategy', label: '対策', icon: '🧠' },
  { id: 'myCombo', label: 'コンボ', icon: '💎' },
  { id: 'setplay', label: '連携', icon: '⚡' },
  { id: 'badHabits', label: '悪癖', icon: '🚫' },
  { id: 'training', label: 'トレモ', icon: '🛠️' },
  { id: 'battle', label: '実戦', icon: '⚔️' },
];

const STORAGE_KEY = 'sf6_master_data_v13';
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "YOUR_KEY_HERE";
const genAI = new GoogleGenerativeAI(API_KEY);
// モデルを Gemini 2.5 Flash に固定
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export default function App() {
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [myChar, setMyChar] = useState(CHARACTERS[1]); // 初期値をALL以外にする
  const [controlType, setControlType] = useState('C');
  const [playerName, setPlayerName] = useState('');
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState('strategy');
  const [newWinRate, setNewWinRate] = useState('');
  const [focusField, setFocusField] = useState(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setData(parsed);
      if (parsed.myCharId) {
        const found = CHARACTERS.find(c => c.id === parsed.myCharId);
        if (found) setMyChar(found);
      }
      if (parsed.controlType) setControlType(parsed.controlType);
      if (parsed.playerName) setPlayerName(parsed.playerName);
    }
  }, []);

  const saveToStorage = (newData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const updateMyData = (field, value) => saveToStorage({ ...data, [field]: value });
  const updateChar = (field, value) => {
    const charData = data[selectedChar.id] || {};
    saveToStorage({ ...data, [selectedChar.id]: { ...charData, [field]: value } });
  };

  const updateList = (listKey, charId, index, field, value, defaultItem) => {
    const allLists = { ...(data[listKey] || {}) };
    const myList = [...(allLists[charId] || [defaultItem])];
    myList[index] = { ...myList[index], [field]: value };
    if (myList[myList.length - 1].content || myList[myList.length - 1].start || myList[myList.length - 1].setup) {
      myList.push(defaultItem);
    }
    saveToStorage({ ...data, [listKey]: { ...allLists, [charId]: myList } });
  };

  const insertCmd = (cmd) => {
    if (!focusField) return;
    const formatCmd = (current) => {
      const trimmed = current ? current.trim() : "";
      if (trimmed === "") return cmd;
      const lastPart = trimmed.split(' ').pop() || "";
      if (lastPart.includes("AS") || /^[0-9]+$/.test(lastPart) || cmd === "TC" || lastPart === "OD") return `${trimmed}${cmd}`;
      return `${trimmed} > ${cmd}`;
    };
    if (focusField.type === 'list') {
      const current = data[focusField.listKey]?.[focusField.charId]?.[focusField.index]?.[focusField.field] || '';
      updateList(focusField.listKey, focusField.charId, focusField.index, focusField.field, formatCmd(current), focusField.default);
    } else {
      updateChar(focusField.field, formatCmd(data[selectedChar.id]?.[focusField.field] || ''));
    }
  };

  const processWinRates = (resJson) => {
    const newData = { ...data };
    Object.entries(resJson).forEach(([rawName, info]) => {
      const normalizedName = NAME_MAP[rawName.toUpperCase()] || rawName;
      const char = CHARACTERS.find(c => c.name === normalizedName);
      const matches = parseInt(info.matches) || 0;
      const rate = parseFloat(info.rate) || 0;
      
      if (normalizedName === "ALL") {
        newData.globalStats = { matches, rate };
        const allCharId = 'all';
        if (!newData[allCharId]) newData[allCharId] = {};
        const records = newData[allCharId].winRateRecords || [];
        newData[allCharId].winRateRecords = [{ id: Date.now(), rate, matches }, ...records].slice(0, 10);
      } else if (char) {
        if (!newData[char.id]) newData[char.id] = {};
        const records = newData[char.id].winRateRecords || [];
        newData[char.id].winRateRecords = [{ id: Date.now(), rate, matches }, ...records].slice(0, 10);
      }
    });
    saveToStorage(newData);
    alert("勝率を同期しました。");
  };

  const analyzeWinRateText = async (text) => {
    if (!text) return;
    setIsAiProcessing(true);
    const prompt = `以下の戦績テキストから、キャラ名、試合数、勝率を抽出してJSONのみ出力してください。
    【重要ルール】
    - 出力はJSONオブジェクトのみ。余計な説明は一切禁止。
    - 全体合計値は必ずキー名を "ALL" にしてください。
    - 書式: {"CHARACTER_NAME": {"matches": 100, "rate": 55.5}}
    入力: ${text}`;
    
    try {
      const result = await model.generateContent(prompt);
      const cleanJson = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
      processWinRates(cleanJson);
    } catch (e) { 
      alert("AI解析に失敗しました。AIが正しい形式で回答できませんでした。"); 
    } finally { setIsAiProcessing(false); }
  };

  const generateAdvice = async () => {
    setIsAiProcessing(true);
    const context = `自キャラ: ${myChar.name}, 相手: ${selectedChar.name}, 最近の勝率: ${data[selectedChar.id]?.winRateRecords?.[0]?.rate || '不明'}%, メモ: ${data[selectedChar.id]?.strategy || 'なし'}`;
    try {
      const result = await model.generateContent(`${context}。この状況に対する一言アドバイスを簡潔に生成してください。`);
      setAiAdvice(result.response.text());
    } catch (e) { setAiAdvice("さらなる対戦データを集めましょう。"); }
    finally { setIsAiProcessing(false); }
  };

  const copyPrompt = () => {
    const p = `あなたはストリートファイター6の専門コーチです。自キャラ:${myChar.name}(${controlType})、相手:${selectedChar.name}。現在の「${TABS.find(t=>t.id===activeTab).label}」セクションに基づいて、勝ち筋を提示してください。`;
    navigator.clipboard.writeText(p).then(() => alert("コピー完了"));
  };

  const currentCharData = data[selectedChar.id] || {};
  const comboList = data.charCombos?.[myChar.id] || [{start:'', content:'', hitType:'通常', location:'中央', successRate:100}];
  const setplayList = data.charSetplays?.[myChar.id] || [{finisher:'', location:'中央', plusF:'', setup:''}];
  const habitsList = data.badHabits || [{ng:'', solution:''}];
  const trainingList = comboList.filter(c => c.content && (parseInt(c.successRate) || 0) < 80);

  return (
    <div style={containerStyle}>
      {isAiProcessing && <div style={aiOverlay}>AI解析中...</div>}
      {aiAdvice && <div style={adviceStyle} onClick={() => setAiAdvice("")}>💡 {aiAdvice}</div>}
      
      <header style={headerStyle}>
        <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
          <input style={nameInputStyle} placeholder="ID" value={playerName} onChange={(e) => { setPlayerName(e.target.value); updateMyData('playerName', e.target.value); }} />
          <select value={myChar.id} onChange={(e) => { const char = CHARACTERS.find(c => c.id === e.target.value); setMyChar(char); updateMyData('myCharId', char.id); }} style={selectStyle}>
            {CHARACTERS.map(c => <option key={c.id} value={c.id} disabled={c.id==='all'}>{c.name}</option>)}
          </select>
          <div style={controlToggleStyle}>
            {['C', 'M'].map(t => (
              <button key={t} onClick={() => { setControlType(t); updateMyData('controlType', t); }} style={{...toggleBtn, background: controlType === t ? (t === 'C' ? '#0ff' : '#fc0') : '#333', color: controlType === t ? '#000' : '#888'}}>{t}</button>
            ))}
          </div>
        </div>

        <div style={globalStatsStyle}>
          <div style={statLabel}>TOTAL (STATS)</div>
          <div style={statVal}>{data.globalStats?.matches || 0}戦 / {data.globalStats?.rate || 0}%</div>
        </div>

        <div style={{display:'flex', gap:'4px'}}>
          <button onClick={generateAdvice} style={circleBtn} title="アドバイス">🎯</button>
          <button onClick={() => navigator.clipboard.writeText(JSON.stringify(data)).then(() => alert("コピー"))} style={backupBtnStyle}>💾</button>
          <button onClick={() => { const i = prompt("復元データを貼り付け"); if(i){ try{ JSON.parse(i); localStorage.setItem(STORAGE_KEY, i); window.location.reload(); }catch(e){alert("失敗")}} }} style={restoreBtnStyle}>📥</button>
        </div>
      </header>

      <div style={charNavStyle}>
        {CHARACTERS.map(c => (
          <div key={c.id} onClick={() => setSelectedChar(c)} style={{...charItemStyle, opacity: selectedChar.id === c.id ? 1 : 0.4}}>
            <div style={{...iconBox, border: selectedChar.id === c.id ? '2px solid #0ff' : '1px solid #444', background: c.id === 'all' ? '#000' : '#111'}}>
              {c.id === 'all' ? (
                <div style={{color: '#f80', fontWeight: 'bold', fontSize: '12px'}}>ALL</div>
              ) : (
                <img src={`/${c.id}.png`} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML=c.name[0] }} />
              )}
            </div>
            <div style={{fontSize:'8px', color: selectedChar.id === c.id ? '#0ff' : '#888'}}>{c.name}</div>
          </div>
        ))}
      </div>

      <main style={{flex:1, padding:'10px', overflowY:'auto'}}>
        <div style={aiPanel}>
           <button onClick={() => analyzeWinRateText(prompt("戦績テキストを貼り付けてください"))} style={aiExecBtn}>📋 戦績データを同期</button>
        </div>

        {activeTab !== 'battle' && (
          <div style={winRowStyle}>
            <div style={{flex:1}}>
              <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
                <input style={winInput} value={newWinRate} onChange={e => setNewWinRate(e.target.value)} placeholder="%" type="number" />
                <button onClick={() => { if(!newWinRate) return; updateChar('winRateRecords', [{ id: Date.now(), rate: parseFloat(newWinRate) }, ...(currentCharData.winRateRecords || [])].slice(0, 10)); setNewWinRate(''); }} style={saveBtnStyle}>記録</button>
                <div style={currentWinRateDisplay}>{currentCharData.winRateRecords?.[0]?.rate || '--'}%</div>
              </div>
              <div style={{height:'35px', marginTop:'5px'}}><ResponsiveContainer width="100%" height="100%"><LineChart data={[...(currentCharData.winRateRecords || [])].reverse()}><Line type="monotone" dataKey="rate" stroke="#0ff" dot={{r:2}} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`スト6 ${selectedChar.name} 対策`)}`} target="_blank" rel="noreferrer" style={linkBtn('#f00')}>YouTube</a>
                <button onClick={copyPrompt} style={{...linkBtn('#fc0'), background:'transparent', cursor:'pointer'}}>✨ AIプロンプト</button>
                <a href={playerName ? `https://sfbuff.site/fighters/search?q=${playerName}` : "https://sfbuff.site/"} target="_blank" rel="noreferrer" style={linkBtn('#0ff')}>SFBuff</a>
            </div>
          </div>
        )}

        <div style={tabGroupStyle}>{TABS.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} style={{...tabBtnStyle, color: activeTab === t.id ? '#0ff' : '#666', background: activeTab === t.id ? '#222' : '#000'}}>{t.icon} {t.label}</button>))}</div>

        {['strategy', 'myCombo', 'setplay'].includes(activeTab) && (
          <div style={paletteStyle}>{[...COMMON_CMDS, ...(controlType === 'C' ? CLASSIC_CMDS : MODERN_CMDS), ...SYSTEM_CMDS].map(cmd => (<button key={cmd} onClick={() => insertCmd(cmd)} style={cmdBtnStyle}>{cmd}</button>))}</div>
        )}

        {/* --- タブコンテンツエリア --- */}
        {activeTab === 'myCombo' ? (
          <div>{comboList.map((item, idx) => (
            <div key={idx} style={comboCardStyle}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                <div style={{display:'flex', gap:'3px'}}>{HIT_TYPES.map(ht => <button key={ht} onClick={() => updateList('charCombos', myChar.id, idx, 'hitType', ht, {})} style={{...miniBtnStyle, background: item.hitType === ht ? '#f44' : '#333'}}>{ht}</button>)}</div>
                <div style={{display:'flex', gap:'3px'}}>{LOCATIONS.map(loc => <button key={loc} onClick={() => updateList('charCombos', myChar.id, idx, 'location', loc, {})} style={{...miniBtnStyle, background: item.location === loc ? '#0ff' : '#333', color: item.location === loc ? '#000' : '#fff'}}>{loc}</button>)}</div>
              </div>
              <div style={inputGrid}>
                 <div><label style={miniLabel}>始動</label><input style={comboInput} value={item.start || ''} onFocus={() => setFocusField({type:'list', listKey:'charCombos', charId:myChar.id, index:idx, field:'start', default:item})} onChange={e => updateList('charCombos', myChar.id, idx, 'start', e.target.value)} /></div>
                 <div><label style={miniLabel}>DMG</label><input style={comboInput} type="number" value={item.dmg || ''} onChange={e => updateList('charCombos', myChar.id, idx, 'dmg', e.target.value)} /></div>
                 <div><label style={miniLabel}>有利F</label><input style={{...comboInput, color:'#0f0'}} type="number" value={item.plusF || ''} onChange={e => updateList('charCombos', myChar.id, idx, 'plusF', e.target.value)} /></div>
              </div>
              <div style={{marginTop:'5px'}}><label style={miniLabel}>レシピ</label><textarea style={comboArea} value={item.content || ''} onFocus={() => setFocusField({type:'list', listKey:'charCombos', charId:myChar.id, index:idx, field:'content', default:item})} onChange={e => updateList('charCombos', myChar.id, idx, 'content', e.target.value)} /></div>
              <div style={{marginTop:'5px'}}><input type="range" min="0" max="100" step="10" value={item.successRate || 100} onChange={e => updateList('charCombos', myChar.id, idx, 'successRate', e.target.value)} /><span style={{fontSize:'10px', marginLeft:'5px'}}>成功率: {item.successRate}%</span></div>
            </div>
          ))}</div>
        ) : activeTab === 'setplay' ? (
          <div>{setplayList.map((item, idx) => (
            <div key={idx} style={comboCardStyle}>
              <div style={{display:'flex', gap:'8px', marginBottom:'8px'}}>
                 <div style={{flex:2}}><label style={miniLabel}>締め</label><input style={comboInput} value={item.finisher || ''} onFocus={() => setFocusField({type:'list', listKey:'charSetplays', charId:myChar.id, index:idx, field:'finisher', default:item})} onChange={e => updateList('charSetplays', myChar.id, idx, 'finisher', e.target.value)} /></div>
                 <div style={{flex:1}}><label style={miniLabel}>有利F</label><input style={{...comboInput, color:'#0f0'}} type="number" value={item.plusF || ''} onFocus={() => setFocusField({type:'list', listKey:'charSetplays', charId:myChar.id, index:idx, field:'plusF', default:item})} onChange={e => updateList('charSetplays', myChar.id, idx, 'plusF', e.target.value)} /></div>
              </div>
              <textarea style={{...comboArea, height:'45px'}} placeholder="レシピ..." value={item.setup || ''} onFocus={() => setFocusField({type:'list', listKey:'charSetplays', charId:myChar.id, index:idx, field:'setup', default:item})} onChange={e => updateList('charSetplays', myChar.id, idx, 'setup', e.target.value)} />
            </div>
          ))}</div>
        ) : activeTab === 'badHabits' ? (
          <div>{habitsList.map((item, idx) => (
            <div key={idx} style={{...comboCardStyle, borderLeft:'4px solid #f44'}}>
              <div><label style={{...miniLabel, color:'#f44'}}>NG行動</label><input style={comboInput} value={item.ng || ''} onChange={e => { const newList = [...habitsList]; newList[idx].ng = e.target.value; if(newList[newList.length-1].ng) newList.push({ng:'', solution:''}); updateMyData('badHabits', newList); }} /></div>
              <div style={{marginTop:'5px'}}><label style={{...miniLabel, color:'#0f0'}}>改善策</label><input style={comboInput} value={item.solution || ''} onChange={e => { const newList = [...habitsList]; newList[idx].solution = e.target.value; updateMyData('badHabits', newList); }} /></div>
            </div>
          ))}</div>
        ) : activeTab === 'training' ? (
          <div>
            <div style={sectionTitle}>⚔️ トレモ課題 (成功率80%未満)</div>
            {trainingList.map((item, idx) => (<div key={idx} style={trainingCard}><div style={{color:'#fff', fontSize:'12px'}}>{item.start} ➔ {item.content}</div><div style={{color:'#f44', fontSize:'10px'}}>成功率: {item.successRate}%</div></div>))}
            <textarea style={mainTextAreaStyle} value={currentCharData.trainingNote || ''} onChange={e => updateChar('trainingNote', e.target.value)} placeholder="自由メモ..." />
          </div>
        ) : activeTab === 'battle' ? (
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            <div style={battleSection}><div style={battleHeader}>🚫 NG & 改善</div>{habitsList.filter(b => b.ng).map((b, i) => (<div key={i} style={battleItem}><span style={{color:'#f44'}}>✕ {b.ng}</span> ➔ <span style={{color:'#0f0'}}>{b.solution}</span></div>))}</div>
            <div style={battleSection}><div style={battleHeader}>🧠 {selectedChar.name} 対策</div><div style={{whiteSpace:'pre-wrap', fontSize:'12px', color:'#eee'}}>{currentCharData.strategy || '未入力'}</div></div>
          </div>
        ) : (
          <textarea style={mainTextAreaStyle} value={currentCharData.strategy || ''} onFocus={() => setFocusField({type:'main', field:'strategy'})} onChange={e => updateChar('strategy', e.target.value)} placeholder={`${selectedChar.name}対策をメモ...`} />
        )}
      </main>
    </div>
  );
}

// --- スタイル定義 (完全維持) ---
const containerStyle = { display:'flex', flexDirection:'column', height:'100vh', background:'#050505', color:'#fff', overflow:'hidden' };
const headerStyle = { display:'flex', justifyContent:'space-between', padding:'10px', background:'#111', alignItems:'center', borderBottom:'1px solid #333', gap:'10px' };
const nameInputStyle = { width:'50px', background:'#000', color:'#fff', border:'1px solid #444', fontSize:'10px', padding:'3px' };
const selectStyle = { background:'#000', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', fontSize:'10px' };
const globalStatsStyle = { flex:1, textAlign:'center', background:'#222', padding:'4px', borderRadius:'4px', border:'1px dotted #444' };
const statLabel = { fontSize:'7px', color:'#888' };
const statVal = { fontSize:'11px', fontWeight:'bold', color:'#0f0' };
const backupBtnStyle = { background:'#222', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', padding:'4px', cursor:'pointer' };
const restoreBtnStyle = { background:'#222', color:'#fc0', border:'1px solid #fc0', borderRadius:'4px', padding:'4px', cursor:'pointer' };
const charNavStyle = { display:'flex', overflowX:'auto', padding:'10px', gap:'12px', background:'#000', borderBottom:'1px solid #222' };
const charItemStyle = { display:'flex', flexDirection:'column', alignItems:'center', minWidth:'45px' };
const iconBox = { width:'38px', height:'38px', borderRadius:'4px', overflow:'hidden', border:'1px solid #444', display:'flex', alignItems:'center', justifyContent:'center' };
const aiPanel = { background:'#111', padding:'10px', borderRadius:'8px', marginBottom:'10px' };
const aiExecBtn = { width:'100%', background:'#333', border:'1px solid #555', color:'#fff', padding:'8px', borderRadius:'4px', fontSize:'11px', cursor:'pointer' };
const winRowStyle = { display:'flex', gap:'10px', background:'#111', padding:'8px', borderRadius:'8px', marginBottom:'10px', alignItems:'center' };
const winInput = { width:'40px', background:'#000', color:'#0f0', border:'1px solid #444', padding:'4px', fontSize:'12px' };
const currentWinRateDisplay = { fontSize:'16px', fontWeight:'bold', color:'#0f0', minWidth:'45px', textAlign:'right' };
const saveBtnStyle = { background:'#0ff', border:'none', borderRadius:'3px', fontSize:'10px', padding:'4px 10px', cursor:'pointer' };
const linkBtn = (c) => ({ color:c, border:`1px solid ${c}`, padding:'3px 8px', borderRadius:'4px', fontSize:'10px', textDecoration:'none', textAlign:'center', display:'inline-block' });
const tabGroupStyle = { display:'flex', gap:'2px', marginBottom:'10px' };
const tabBtnStyle = { flex:1, padding:'10px 0', border:'1px solid #333', fontSize:'10px', cursor:'pointer' };
const paletteStyle = { display:'flex', flexWrap:'wrap', gap:'3px', background:'#111', padding:'8px', borderRadius:'8px', marginBottom:'10px' };
const cmdBtnStyle = { background:'#333', color:'#fff', border:'none', padding:'6px 8px', borderRadius:'4px', fontSize:'10px', cursor:'pointer' };
const comboCardStyle = { background:'#111', padding:'12px', borderRadius:'8px', marginBottom:'10px', border:'1px solid #333' };
const inputGrid = { display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'8px' };
const comboInput = { width:'100%', background:'#000', color:'#fff', border:'1px solid #444', padding:'5px', fontSize:'11px', borderRadius:'3px' };
const comboArea = { width:'100%', background:'#000', color:'#ccc', border:'1px solid #333', padding:'5px', height:'45px', fontSize:'11px', borderRadius:'3px' };
const miniLabel = { fontSize:'8px', color:'#888', display:'block' };
const miniBtnStyle = { border:'none', color:'#fff', fontSize:'8px', padding:'2px 6px', borderRadius:'3px', cursor:'pointer' };
const mainTextAreaStyle = { width:'100%', height:'250px', background:'#000', color:'#eee', padding:'10px', border:'1px solid #333', borderRadius:'8px' };
const aiOverlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', color:'#0ff', fontSize:'14px' };
const adviceStyle = { position:'fixed', bottom:'20px', left:'10px', right:'10px', background:'#022', border:'1px solid #0ff', padding:'12px', borderRadius:'8px', color:'#fff', fontSize:'11px', zIndex:1000 };
const circleBtn = { background:'transparent', border:'1px solid #0ff', color:'#0ff', borderRadius:'50%', width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', cursor:'pointer' };
const controlToggleStyle = { display:'flex', background:'#000', borderRadius:'4px', padding:'1px', border:'1px solid #333' };
const toggleBtn = { border:'none', fontSize:'9px', padding:'2px 6px', borderRadius:'2px', cursor:'pointer' };
const battleSection = { background:'#111', borderRadius:'8px', padding:'10px', border:'1px solid #222', marginBottom:'10px' };
const battleHeader = { fontSize:'11px', fontWeight:'bold', color:'#0ff', marginBottom:'8px', borderBottom:'1px solid #333', paddingBottom:'4px' };
const battleItem = { fontSize:'12px', marginBottom:'6px', borderBottom:'1px dotted #222', paddingBottom:'4px' };
const sectionTitle = { fontSize:'11px', color:'#fc0', marginBottom:'8px', fontWeight:'bold' };
const trainingCard = { background:'#1a1a1a', padding:'8px', borderRadius:'6px', marginBottom:'8px', borderLeft:'3px solid #f44' };
