import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// --- Inline SVG Icons to replace lucide-react (Zero dependencies) ---
const Icons = {
  Search: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Brain: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h2zM14.5 2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h2zM21 16a3 3 0 0 1-3 3h-1.5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v9zM10.5 19A3 3 0 0 1 7.5 22H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1.5a3 3 0 0 1 3 3v12z"></path></svg>,
  Sword: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline><line x1="13" y1="19" x2="19" y2="13"></line><line x1="16" y1="16" x2="20" y2="20"></line><line x1="19" y1="21" x2="20" y2="20"></line></svg>,
  Shield: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  Settings: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Save: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>,
  Download: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Youtube: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.14 1 12 1 12s0 3.86.42 5.58a2.78 2.78 0 0 0 1.94 2c1.71.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.86 23 12 23 12s0-3.86-.42-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg>,
  Zap: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  AlertTriangle: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  PlayCircle: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>,
  Clipboard: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>,
  ArrowRight: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
};

const CHARACTERS = [
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
].sort((a, b) => a.name.localeCompare(b.name, 'ja'));

const COMMON_CMDS = ['5', '2', '6', '4', '8', '236', '214', '623', '41236', '63214'];
const CLASSIC_CMDS = ['LP', 'MP', 'HP', 'LK', 'MK', 'HK'];
const MODERN_CMDS = ['L', 'M', 'H', 'SP', 'AS'];
const SYSTEM_CMDS = ['DR', 'PC', 'TC', '前ステ', 'OD', 'SA1', 'SA2', 'SA3'];

const TABS = [
  { id: 'strategy', label: '対策', icon: <Icons.Shield size={14}/> },
  { id: 'myCombo', label: 'コンボ', icon: <Icons.Zap size={14}/> },
  { id: 'setplay', label: '連携', icon: <Icons.PlayCircle size={14}/> },
  { id: 'badHabits', label: '悪癖', icon: <Icons.AlertTriangle size={14}/> },
  { id: 'training', label: 'トレモ', icon: <Icons.Settings size={14}/> },
  { id: 'battle', label: '実戦', icon: <Icons.Sword size={14}/> },
  { id: 'ai', label: 'AI解析', icon: <Icons.Brain size={14}/> },
];

const STORAGE_KEY = 'sf6_master_v12_pro';

export default function App() {
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [myChar, setMyChar] = useState(CHARACTERS[0]);
  const [controlType, setControlType] = useState('C');
  const [playerName, setPlayerName] = useState('');
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState('strategy');
  const [newWinRate, setNewWinRate] = useState('');
  const [focusField, setFocusField] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [importText, setImportText] = useState('');

  const apiKey = ""; 

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
        if (parsed.myCharId) setMyChar(CHARACTERS.find(c => c.id === parsed.myCharId) || CHARACTERS[0]);
        if (parsed.controlType) setControlType(parsed.controlType);
        if (parsed.playerName) setPlayerName(parsed.playerName);
      } catch(e) { console.error(e); }
    }
  }, []);

  const saveToStorage = useCallback((newData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

  const updateMyData = (field, value) => saveToStorage({ ...data, [field]: value });

  const updateChar = (field, value) => {
    const charData = data[selectedChar.id] || {};
    saveToStorage({ ...data, [selectedChar.id]: { ...charData, [field]: value } });
  };

  const updateList = (listKey, charId, index, field, value, defaultItem) => {
    const allLists = data[listKey] || {};
    const myList = [...(allLists[charId] || [defaultItem])];
    myList[index] = { ...myList[index], [field]: value };
    const last = myList[myList.length - 1];
    if (last.content || last.start || last.setup || last.ng) {
      myList.push({ ...defaultItem });
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
      const current = (data[selectedChar.id] || {})[focusField.field] || '';
      updateChar(focusField.field, formatCmd(current));
    }
  };

  const getYTLink = () => {
    return `https://www.youtube.com/results?search_query=SF6+${myChar.name}+対+${selectedChar.name}+対策`;
  };

  const callGeminiAI = async (prompt, systemPrompt = "あなたはSF6のプロコーチです。") => {
    setAiLoading(true);
    let retries = 0;
    const run = async () => {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) setAiAnalysis(text);
        else throw new Error("AI Error");
      } catch (error) {
        if (retries < 5) { retries++; await new Promise(r => setTimeout(r, 1000)); return run(); }
        setAiAnalysis("エラーが発生しました。");
      } finally { setAiLoading(false); }
    };
    run();
  };

  const diagnosePriorities = () => {
    const stats = CHARACTERS.map(c => {
      const records = data[c.id]?.winRateRecords || [];
      const latest = records[0]?.rate ?? null;
      return latest !== null ? { name: c.name, rate: latest } : null;
    }).filter(Boolean);

    const prompt = `全キャラ勝率データ: ${JSON.stringify(stats)}。
    勝率が低い（特に50%未満）キャラクターを3名選び、現在のアプリ内メモ(対策)を元に「何を優先して練習すべきか」を教えてください。`;
    callGeminiAI(prompt, "あなたはデータアナリスト兼SF6コーチです。");
  };

  const getMotivationalAdvice = () => {
    const charData = data[selectedChar.id] || {};
    const winRate = charData.winRateRecords?.[0]?.rate || 50;
    const habits = data.badHabits?.global || [];
    const prompt = `
    現在選択中の相手: ${selectedChar.name} (直近勝率: ${winRate}%)
    自分の悪い癖: ${JSON.stringify(habits.filter(h => h.ng).slice(0, 3))}
    対策メモ: ${charData.strategy || '未入力'}
    勝率が低い時、このデータから「次の一戦で意識すべきこと」を1つ、プレイヤーを励ますようにアドバイスしてください。
    `;
    callGeminiAI(prompt, "あなたは厳しいが情に厚いベテラン格ゲーコーチです。");
  };

  const handleImport = async () => {
    if (!importText) return;
    setAiLoading(true);
    const systemPrompt = `
      あなたは要約されたテキストを解析して構造化データ（JSON）に変換するアシスタントです。
      以下の形式でJSONのみを出力してください。
      {
        "strategy": "キャラ対策の内容をまとめたもの",
        "combos": [{"start": "始動技", "content": "レシピ", "dmg": "ダメージ(不明なら空)"}],
        "setplays": [{"finisher": "締め", "setup": "連携"}]
      }
    `;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: importText }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const result = await response.json();
      const json = JSON.parse(result.candidates[0].content.parts[0].text);
      
      const newData = { ...data };
      if (json.strategy) newData[selectedChar.id] = { ...(newData[selectedChar.id] || {}), strategy: (newData[selectedChar.id]?.strategy || '') + "\n" + json.strategy };
      if (json.combos) {
        const existing = data.charCombos?.[myChar.id] || [];
        newData.charCombos = { ...(newData.charCombos || {}), [myChar.id]: [...json.combos, ...existing] };
      }
      if (json.setplays) {
        const existing = data.charSetplays?.[myChar.id] || [];
        newData.charSetplays = { ...(newData.charSetplays || {}), [myChar.id]: [...json.setplays, ...existing] };
      }
      saveToStorage(newData);
      setAiAnalysis("インポートが完了し、各タブに振り分けました！");
      setImportText('');
    } catch (e) {
      setAiAnalysis("インポートに失敗しました。形式を確認してください。");
    } finally {
      setAiLoading(false);
    }
  };

  const currentCharData = data[selectedChar.id] || {};
  const comboList = data.charCombos?.[myChar.id] || [{start:'', content:'', hitType:'通常', location:'中央', successRate:100}];
  const setplayList = data.charSetplays?.[myChar.id] || [{finisher:'', location:'中央', setup:''}];
  const habitsList = data.badHabits?.global || [{ng:'', solution:''}];

  const BattleBox = ({ color, icon, title, items }) => (
    <div style={{background:'#111', borderRadius:'10px', padding:'12px', borderLeft:`4px solid ${color}`}}>
      <div style={{display:'flex', alignItems:'center', gap:'6px', color:'#fff', fontSize:'12px', marginBottom:'8px', fontWeight:'bold', opacity:0.8}}>
        {icon} {title}
      </div>
      {items.length === 0 ? <div style={{fontSize:'11px', color:'#444'}}>データなし</div> : items.map((t, i) => (
        <div key={i} style={{fontSize:'12px', marginBottom:'6px', borderBottom:'1px solid #222', paddingBottom:'4px'}}>{t}</div>
      ))}
    </div>
  );

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
          <input style={nameInputStyle} placeholder="ID" value={playerName} onChange={(e) => { setPlayerName(e.target.value); updateMyData('playerName', e.target.value); }} />
          <select value={myChar.id} onChange={(e) => { const char = CHARACTERS.find(c => c.id === e.target.value); setMyChar(char); updateMyData('myCharId', char.id); }} style={selectStyle}>
            {CHARACTERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={controlToggleStyle}>
            {['C', 'M'].map(t => (
              <button key={t} onClick={() => { setControlType(t); updateMyData('controlType', t); }} style={{...toggleBtn, background: controlType === t ? (t === 'C' ? '#0ff' : '#fc0') : '#333', color: controlType === t ? '#000' : '#888'}}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
          <a href={playerName ? `https://sfbuff.site/fighters/search?q=${playerName}` : "https://sfbuff.site/"} target="_blank" rel="noreferrer" style={{color:'#0ff', textDecoration:'none', fontSize:'10px', display:'flex', alignItems:'center', gap:'2px'}}>
             <Icons.Search size={12}/> SFBuff
          </a>
          <button onClick={() => navigator.clipboard.writeText(JSON.stringify(data))} style={iconBtnStyle} title="Save"><Icons.Save size={16}/></button>
          <button onClick={() => { const i = prompt("Restore JSON"); if(i){ try{ JSON.parse(i); localStorage.setItem(STORAGE_KEY, i); window.location.reload(); }catch(e){}} }} style={iconBtnStyle} title="Restore"><Icons.Download size={16}/></button>
        </div>
      </header>

      <div style={charNavStyle}>
        {CHARACTERS.map(c => (
          <div key={c.id} onClick={() => setSelectedChar(c)} style={{...charItemStyle, opacity: selectedChar.id === c.id ? 1 : 0.4}}>
            <div style={{...iconBox, border: selectedChar.id === c.id ? '2px solid #0ff' : '1px solid #444'}}>
               <span style={{fontSize:'12px', fontWeight:'bold', color: selectedChar.id === c.id ? '#0ff' : '#666'}}>{c.name[0]}</span>
            </div>
            <div style={{fontSize:'9px', color: selectedChar.id === c.id ? '#0ff' : '#888'}}>{c.name}</div>
          </div>
        ))}
      </div>

      <main style={mainContentStyle}>
        {activeTab !== 'battle' && activeTab !== 'ai' && (
          <div style={winRowStyle}>
            <div style={{flex:1}}>
              <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
                <input style={winInput} value={newWinRate} onChange={e => setNewWinRate(e.target.value)} placeholder="%" type="number" />
                <button onClick={() => { if(!newWinRate) return; updateChar('winRateRecords', [{ id: Date.now(), rate: parseFloat(newWinRate) }, ...(currentCharData.winRateRecords || [])].slice(0, 10)); setNewWinRate(''); }} style={saveBtnStyle}>保存</button>
                {(currentCharData.winRateRecords?.[0]?.rate < 50) && (
                  <button onClick={getMotivationalAdvice} style={{...saveBtnStyle, background:'#f44'}}>SOSコーチ</button>
                )}
              </div>
              <div style={{height:'35px', marginTop:'8px'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...(currentCharData.winRateRecords || [])].reverse()}>
                    <Line type="monotone" dataKey="rate" stroke="#0ff" strokeWidth={2} dot={{r:2}} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
              <a href={getYTLink()} target="_blank" rel="noreferrer" style={linkBtn('#f44')}><Icons.Youtube size={11}/> YouTube</a>
              <button onClick={() => {
                const base = `自キャラ:${myChar.name}(${controlType})、敵:${selectedChar.name}。直近勝率:${currentCharData.winRateRecords?.[0]?.rate || '不詳'}%。`;
                navigator.clipboard.writeText(base + "動画から実戦的な対策を要約してください。");
              }} style={linkBtn('#fc0')}><Icons.Brain size={11}/> 解析用コピー</button>
            </div>
          </div>
        )}

        <div style={tabGroupStyle}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{...tabBtnStyle, color: activeTab === t.id ? '#0ff' : '#666', borderBottom: activeTab === t.id ? '2px solid #0ff' : '2px solid transparent'}}>
              {t.icon} <span style={{marginTop:'3px'}}>{t.label}</span>
            </button>
          ))}
        </div>

        {['strategy', 'myCombo', 'setplay'].includes(activeTab) && (
          <div style={paletteStyle}>
            {[...COMMON_CMDS, ...(controlType === 'C' ? CLASSIC_CMDS : MODERN_CMDS), ...SYSTEM_CMDS].map(cmd => (
              <button key={cmd} onClick={() => insertCmd(cmd)} style={cmdBtnStyle}>{cmd}</button>
            ))}
          </div>
        )}

        <div style={{paddingBottom:'80px'}}>
          {activeTab === 'strategy' && (
             <textarea style={mainTextAreaStyle} value={currentCharData.strategy || ''} onFocus={() => setFocusField({type:'main', field:'strategy'})} onChange={e => updateChar('strategy', e.target.value)} placeholder={`${selectedChar.name}戦の要点をメモ...`} />
          )}

          {activeTab === 'myCombo' && (
            <div>{comboList.map((item, idx) => (
              <div key={idx} style={cardStyle}>
                <div style={inputGrid}>
                  <div><label style={miniLabel}>始動</label><input style={comboInput} value={item.start || ''} onFocus={() => setFocusField({type:'list', listKey:'charCombos', charId:myChar.id, index:idx, field:'start', default:{hitType:'通常', successRate:100}})} onChange={e => updateList('charCombos', myChar.id, idx, 'start', e.target.value, {hitType:'通常', successRate:100})} /></div>
                  <div><label style={miniLabel}>DMG</label><input style={comboInput} value={item.dmg || ''} onChange={e => updateList('charCombos', myChar.id, idx, 'dmg', e.target.value, {hitType:'通常', successRate:100})} /></div>
                  <div><label style={miniLabel}>成功%</label><input style={comboInput} value={item.successRate || ''} onChange={e => updateList('charCombos', myChar.id, idx, 'successRate', e.target.value, {hitType:'通常', successRate:100})} /></div>
                </div>
                <textarea style={{...comboArea, marginTop:'8px'}} value={item.content || ''} onFocus={() => setFocusField({type:'list', listKey:'charCombos', charId:myChar.id, index:idx, field:'content', default:{hitType:'通常', successRate:100}})} onChange={e => updateList('charCombos', myChar.id, idx, 'content', e.target.value, {hitType:'通常', successRate:100})} />
              </div>
            ))}</div>
          )}

          {activeTab === 'setplay' && (
            <div>{setplayList.map((item, idx) => (
              <div key={idx} style={cardStyle}>
                <input style={comboInput} value={item.finisher || ''} onFocus={() => setFocusField({type:'list', listKey:'charSetplays', charId:myChar.id, index:idx, field:'finisher', default:{location:'中央'}})} onChange={e => updateList('charSetplays', myChar.id, idx, 'finisher', e.target.value, {location:'中央'})} placeholder="締めパーツ" />
                <textarea style={{...comboArea, height:'45px', marginTop:'6px'}} value={item.setup || ''} onFocus={() => setFocusField({type:'list', listKey:'charSetplays', charId:myChar.id, index:idx, field:'setup', default:{location:'中央'}})} onChange={e => updateList('charSetplays', myChar.id, idx, 'setup', e.target.value, {location:'中央'})} placeholder="連携内容..." />
              </div>
            ))}</div>
          )}

          {activeTab === 'badHabits' && (
            <div>{habitsList.map((item, idx) => (
              <div key={idx} style={{...cardStyle, borderLeft:'4px solid #f44'}}>
                <input style={comboInput} value={item.ng || ''} onChange={e => updateList('badHabits', 'global', idx, 'ng', e.target.value, {ng:'', solution:''})} placeholder="NG行動" />
                <input style={{...comboInput, marginTop:'6px', color:'#0f0'}} value={item.solution || ''} onChange={e => updateList('badHabits', 'global', idx, 'solution', e.target.value, {ng:'', solution:''})} placeholder="改善策" />
              </div>
            ))}</div>
          )}

          {activeTab === 'training' && (
            <div>
              <div style={sectionHeader}><Icons.Zap size={14}/> 集中練習が必要</div>
              {comboList.filter(c => c.content && c.successRate < 80).map((item, i) => (
                <div key={i} style={trainingCard}>
                  <div style={{fontSize:'12px'}}>{item.start} ➔ {item.content}</div>
                  <div style={{color:'#f44', fontSize:'10px', marginTop:'4px'}}>成功率: {item.successRate}%</div>
                </div>
              ))}
              <div style={{...sectionHeader, marginTop:'20px'}}><Icons.Settings size={14}/> 自由メモ</div>
              <textarea style={mainTextAreaStyle} value={currentCharData.trainingNote || ''} onChange={e => updateChar('trainingNote', e.target.value)} />
            </div>
          )}

          {activeTab === 'battle' && (
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <BattleBox color="#f44" icon={<Icons.AlertTriangle size={14}/>} title="要注意！NG行動" items={habitsList.filter(h => h.ng).map(h => `${h.ng} ➔ ${h.solution}`)} />
              <BattleBox color="#0ff" icon={<Icons.Shield size={14}/>} title={`対 ${selectedChar.name} 対策`} items={[currentCharData.strategy || '未入力']} />
              <BattleBox color="#fc0" icon={<Icons.Zap size={14}/>} title="起き攻め/連携" items={(data.charSetplays?.[myChar.id] || []).filter(s => s.setup).map(s => `[${s.finisher}] ${s.setup}`)} />
            </div>
          )}

          {activeTab === 'ai' && (
            <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <div style={aiCard}>
                <div style={{fontSize:'14px', fontWeight:'bold', marginBottom:'10px'}}>診断 & 分析</div>
                <div style={{display:'flex', gap:'8px'}}>
                  <button onClick={diagnosePriorities} style={aiBtn}>優先対策診断</button>
                  <button onClick={getMotivationalAdvice} style={{...aiBtn, background:'#1a1a1a', border:'1px solid #4a4ae2'}}>SOSコーチ</button>
                </div>
              </div>

              <div style={aiCard}>
                <div style={{fontSize:'14px', fontWeight:'bold', marginBottom:'10px'}}>NotebookLMインポーター</div>
                <textarea 
                  style={{...comboArea, height:'80px', background:'#000'}} 
                  placeholder="NotebookLMや他AIの要約テキストをここに貼り付け..."
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                />
                <button 
                  onClick={handleImport} 
                  disabled={aiLoading} 
                  style={{...aiBtn, marginTop:'10px', background: aiLoading ? '#333' : '#4a4ae2'}}
                >
                  {aiLoading ? '解析中...' : 'AIで各タブに自動振り分け'}
                </button>
              </div>

              {aiAnalysis && (
                <div style={aiResult}>
                  <div style={{fontSize:'11px', color:'#0ff', marginBottom:'8px'}}>AI分析結果:</div>
                  <div style={{fontSize:'13px', lineHeight:'1.6', whiteSpace:'pre-wrap'}}>{aiAnalysis}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const containerStyle = { display:'flex', flexDirection:'column', height:'100vh', background:'#050505', color:'#fff', fontFamily:'sans-serif' };
const headerStyle = { display:'flex', justifyContent:'space-between', padding:'12px', background:'#111', borderBottom:'1px solid #333' };
const nameInputStyle = { width:'45px', background:'#000', color:'#fff', border:'1px solid #444', fontSize:'10px', padding:'4px', borderRadius:'4px' };
const selectStyle = { background:'#000', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', fontSize:'10px', padding:'3px' };
const controlToggleStyle = { display:'flex', background:'#222', borderRadius:'4px', padding:'2px' };
const toggleBtn = { border:'none', fontSize:'10px', padding:'2px 8px', borderRadius:'2px', cursor:'pointer' };
const iconBtnStyle = { background:'transparent', color:'#888', border:'none', cursor:'pointer' };
const charNavStyle = { display:'flex', overflowX:'auto', padding:'10px', gap:'10px', background:'#000' };
const charItemStyle = { display:'flex', flexDirection:'column', alignItems:'center', minWidth:'40px', cursor:'pointer' };
const iconBox = { width:'34px', height:'34px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', background:'#1a1a1a' };
const mainContentStyle = { flex:1, padding:'12px', overflowY:'auto' };
const winRowStyle = { display:'flex', gap:'12px', background:'#111', padding:'10px', borderRadius:'10px', marginBottom:'15px' };
const winInput = { width:'40px', background:'#000', color:'#0f0', border:'1px solid #444', padding:'5px', fontSize:'12px', textAlign:'center' };
const saveBtnStyle = { background:'#0ff', color:'#000', border:'none', borderRadius:'4px', fontSize:'10px', padding:'4px 10px', fontWeight:'bold' };
const linkBtn = (c) => ({ color:c, border:`1px solid ${c}`, padding:'4px 8px', borderRadius:'6px', fontSize:'10px', textDecoration:'none', display:'flex', alignItems:'center', gap:'4px', justifyContent:'center' });
const tabGroupStyle = { display:'flex', gap:'2px', marginBottom:'15px' };
const tabBtnStyle = { flex:1, padding:'8px 0', border:'none', fontSize:'10px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', background:'transparent' };
const paletteStyle = { display:'flex', flexWrap:'wrap', gap:'4px', background:'#111', padding:'10px', borderRadius:'8px', marginBottom:'12px' };
const cmdBtnStyle = { background:'#2a2a2a', color:'#fff', border:'none', padding:'6px', borderRadius:'4px', fontSize:'10px', minWidth:'32px' };
const mainTextAreaStyle = { width:'100%', height:'250px', background:'#111', color:'#eee', padding:'12px', border:'1px solid #333', borderRadius:'10px', fontSize:'14px', outline:'none' };
const cardStyle = { background:'#111', padding:'12px', borderRadius:'10px', marginBottom:'10px', border:'1px solid #222' };
const inputGrid = { display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'8px' };
const comboInput = { width:'100%', background:'#000', color:'#fff', border:'1px solid #333', padding:'6px', fontSize:'11px', borderRadius:'6px' };
const comboArea = { width:'100%', background:'#000', color:'#ccc', border:'1px solid #333', padding:'8px', height:'50px', fontSize:'11px', borderRadius:'6px', resize:'none' };
const miniLabel = { fontSize:'8px', color:'#777', display:'block', marginBottom:'2px' };
const sectionHeader = { fontSize:'12px', color:'#fc0', fontWeight:'bold', marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' };
const trainingCard = { background:'#161616', padding:'10px', borderRadius:'8px', marginBottom:'8px', borderLeft:'3px solid #f44' };
const aiCard = { background:'#15152a', padding:'15px', borderRadius:'12px', border:'1px solid #303060' };
const aiBtn = { flex:1, background:'#4a4ae2', color:'#fff', border:'none', padding:'10px', borderRadius:'8px', fontWeight:'bold', fontSize:'12px', cursor:'pointer' };
const aiResult = { background:'#111', padding:'15px', borderRadius:'10px', border:'1px solid #333' };
