import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import { Search, Brain, Sword, Shield, Settings, Save, Download, Youtube, Zap, AlertTriangle, PlayCircle, Clipboard, ArrowRight } from 'lucide-react';

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
  { id: 'strategy', label: '対策', icon: <Shield size={14}/> },
  { id: 'myCombo', label: 'コンボ', icon: <Zap size={14}/> },
  { id: 'setplay', label: '連携', icon: <PlayCircle size={14}/> },
  { id: 'badHabits', label: '悪癖', icon: <AlertTriangle size={14}/> },
  { id: 'training', label: 'トレモ', icon: <Settings size={14}/> },
  { id: 'battle', label: '実戦', icon: <Sword size={14}/> },
  { id: 'ai', label: 'AI解析', icon: <Brain size={14}/> },
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

  // Sub-components as functions within the main file
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
             <Search size={12}/> SFBuff
          </a>
          <button onClick={() => navigator.clipboard.writeText(JSON.stringify(data))} style={iconBtnStyle} title="Save"><Save size={16}/></button>
          <button onClick={() => { const i = prompt("Restore JSON"); if(i){ try{ JSON.parse(i); localStorage.setItem(STORAGE_KEY, i); window.location.reload(); }catch(e){}} }} style={iconBtnStyle} title="Restore"><Download size={16}/></button>
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
              <a href={getYTLink()} target="_blank" rel="noreferrer" style={linkBtn('#f44')}><Youtube size={11}/> YouTube</a>
              <button onClick={() => {
                const base = `自キャラ:${myChar.name}(${controlType})、敵:${selectedChar.name}。直近勝率:${currentCharData.winRateRecords?.[0]?.rate || '不詳'}%。`;
                navigator.clipboard.writeText(base + "動画から実戦的な対策を要約してください。");
              }} style={linkBtn('#fc0')}><Brain size={11}/> 解析用コピー</button>
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
              <div style={sectionHeader}><Zap size={14}/> 集中練習が必要</div>
              {comboList.filter(c => c.content && c.successRate < 80).map((item, i) => (
                <div key={i} style={trainingCard}>
                  <div style={{fontSize:'12px'}}>{item.start} ➔ {item.content}</div>
                  <div style={{color:'#f44', fontSize:'10px', marginTop:'4px'}}>成功率: {item.successRate}%</div>
                </div>
              ))}
              <div style={{...sectionHeader, marginTop:'20px'}}><Settings size={14}/> 自由メモ</div>
              <textarea style={mainTextAreaStyle} value={currentCharData.trainingNote || ''} onChange={e => updateChar('trainingNote', e.target.value)} />
            </div>
          )}

          {activeTab === 'battle' && (
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <BattleBox color="#f44" icon={<AlertTriangle size={14}/>} title="要注意！NG行動" items={habitsList.filter(h => h.ng).map(h => `${h.ng} ➔ ${h.solution}`)} />
              <BattleBox color="#0ff" icon={<Shield size={14}/>} title={`対 ${selectedChar.name} 対策`} items={[currentCharData.strategy || '未入力']} />
              <BattleBox color="#fc0" icon={<Zap size={14}/>} title="起き攻め/連携" items={(data.charSetplays?.[myChar.id] || []).filter(s => s.setup).map(s => `[${s.finisher}] ${s.setup}`)} />
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
