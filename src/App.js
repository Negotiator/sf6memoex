import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

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

const COMMANDS = ['5', '2', '6', '4', '8', '236', '214', '623', '41236', '63214', 'P', 'K', 'LP', 'MP', 'HP', 'LK', 'MK', 'HK', 'DR', 'PC', 'TC', '前ステ', 'OD', 'SA1', 'SA2', 'SA3'];
const HIT_TYPES = ['通常', 'パニカン', 'カウンター', '持続', '空中'];
const LOCATIONS = ['中央', '画面端', 'どこでも'];

const TABS = [
  { id: 'strategy', label: '対策', icon: '🧠' },
  { id: 'myCombo', label: 'コンボ', icon: '💎' },
  { id: 'badHabits', label: '悪癖', icon: '🚫' },
  { id: 'todo', label: '実践', icon: '⚔️' },
];

const STORAGE_KEY = 'sf6_master_data_v4';

export default function App() {
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [myChar, setMyChar] = useState(CHARACTERS[0]);
  const [playerName, setPlayerName] = useState('');
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState('strategy');
  const [newWinRate, setNewWinRate] = useState('');
  const [focusField, setFocusField] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setData(parsed);
      if (parsed.myCharId) {
        const found = CHARACTERS.find(c => c.id === parsed.myCharId);
        if (found) setMyChar(found);
      }
      if (parsed.playerName) setPlayerName(parsed.playerName);
    }
  }, []);

  const update = (field, value) => {
    const newData = { ...data, [selectedChar.id]: { ...(data[selectedChar.id] || {}), [field]: value } };
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const updateMyData = (field, value) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const updateCombo = (index, field, value) => {
    const allCharCombos = data.charCombos || {};
    const myCombos = [...(allCharCombos[myChar.id] || [{start:'', content:'', hitType:'通常', situation:'', location:'中央'}])];
    myCombos[index] = { ...myCombos[index], [field]: value };
    if (myCombos[myCombos.length - 1].content || myCombos[myCombos.length - 1].start) {
      myCombos.push({ start: '', content: '', hitType:'通常', situation:'', location:'中央' });
    }
    const newData = { ...data, charCombos: { ...allCharCombos, [myChar.id]: myCombos } };
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const insertCmd = (cmd) => {
    if (!focusField) return;
    const { type, index, field } = focusField;
    
    const formatCmd = (current) => {
      const trimmed = current ? current.trim() : "";
      if (trimmed === "") return cmd;

      // 直前の文字を取得
      const lastPart = trimmed.split(' ').pop();
      const isNumber = /^[0-9]+$/.test(lastPart);
      const isOD = lastPart === "OD";

      // 直前が数字またはODならスペースのみ、それ以外なら > を入れる
      if (isNumber || isOD) {
        return `${trimmed}${cmd}`;
      } else {
        return `${trimmed} > ${cmd}`;
      }
    };

    if (type === 'combo') {
      const allCharCombos = data.charCombos || {};
      const myCombos = allCharCombos[myChar.id] || [{start:'', content:'', situation:''}];
      const current = myCombos[index]?.[field] || '';
      updateCombo(index, field, formatCmd(current));
    } else {
      const current = data[selectedChar.id]?.[focusField.field] || '';
      update(focusField.field, formatCmd(current));
    }
  };

  // （以下、前回と同じUIコンポーネントのため中略。スタイル等も含めすべて維持しています）
  const copyAIPrompt = () => {
    const prompt = `あなたはSF6の高度なコーチです。自キャラ:${myChar.name}、敵キャラ:${selectedChar.name}。
【最優先：敵キャラ対策の抽出】
この動画から、対敵キャラにおける自キャラの立ち回り対策を抽出してください。
・立ち回りの重要ポイント（要約）
・主要な技への対処法や反撃ポイント
これらをアプリの「対策」欄にそのまま貼れるよう、簡潔な箇条書きでまとめてください。
※前置き不要、内容のみ出力してください。`.trim();
    navigator.clipboard.writeText(prompt).then(() => alert("高度なコーチ指示をコピーしました！"));
  };

  const exportData = () => {
    const dataStr = localStorage.getItem(STORAGE_KEY);
    if (!dataStr) return alert("データがありません");
    navigator.clipboard.writeText(dataStr).then(() => alert("コピーしました"));
  };

  const importData = () => {
    const input = prompt("バックアップを貼り付け");
    if (input) {
      try { JSON.parse(input); localStorage.setItem(STORAGE_KEY, input); window.location.reload(); } catch (e) { alert("形式エラー"); }
    }
  };

  const getYTLink = () => {
    let query = (activeTab === 'myCombo') 
      ? `スト6 ${myChar.name} コンボ セットプレイ` 
      : `スト6 ${selectedChar.name} 対策`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  };

  const currentCharData = data[selectedChar.id] || {};
  const winRecords = currentCharData.winRateRecords || [];
  const comboList = (data.charCombos && data.charCombos[myChar.id]) || [{start:'', content:'', hitType:'通常', situation:'', location:'中央'}];
  const activeTabInfo = TABS.find(t => t.id === activeTab);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={{display:'flex', gap:'5px'}}>
          <input style={nameInputStyle} placeholder="PLAYER名" value={playerName} onChange={(e) => { setPlayerName(e.target.value); updateMyData('playerName', e.target.value); }} />
          <select value={myChar.id} onChange={(e) => { const char = CHARACTERS.find(c => c.id === e.target.value); setMyChar(char); updateMyData('myCharId', char.id); }} style={selectStyle}>
            {CHARACTERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{display:'flex', gap:'4px'}}>
          <button onClick={copyAIPrompt} style={aiBtnStyle}>✨ AI</button>
          <button onClick={exportData} style={backupBtnStyle}>💾</button>
          <button onClick={importData} style={restoreBtnStyle}>📥</button>
        </div>
      </header>

      <div style={charNavStyle}>
        {CHARACTERS.map(c => (
          <div key={c.id} onClick={() => setSelectedChar(c)} 
               style={{...charItemStyle, opacity: selectedChar.id === c.id ? 1 : 0.4}}>
            <div style={{...iconBox, border: selectedChar.id === c.id ? '2px solid #0ff' : '1px solid #444'}}>
              <img src={`/${c.id}.png`} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML=`<div style="font-size:10px;text-align:center;line-height:40px">${c.name[0]}</div>` }} />
            </div>
            <div style={{fontSize:'8px', color: selectedChar.id === c.id ? '#0ff' : '#888', marginTop:'2px'}}>{c.name}</div>
          </div>
        ))}
      </div>

      <main style={{flex:1, padding:'10px', overflowY:'auto'}}>
        <div style={winRowStyle}>
          <div style={{flex:1}}>
            <input style={winInput} value={newWinRate} onChange={e => setNewWinRate(e.target.value)} placeholder="%" type="number" />
            <button onClick={() => { if (!newWinRate) return; update('winRateRecords', [{ id: Date.now(), rate: parseFloat(newWinRate) }, ...winRecords].slice(0, 10)); setNewWinRate(''); }} style={saveBtnStyle}>記録</button>
            <div style={{height:'30px', marginTop:'5px'}}><ResponsiveContainer width="100%" height="100%"><LineChart data={[...winRecords].reverse()}><Line type="monotone" dataKey="rate" stroke="#0ff" dot={{r:2}} /></LineChart></ResponsiveContainer></div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
            <a href={getYTLink()} target="_blank" rel="noreferrer" style={linkBtn('#f00')}>YouTube</a>
            <a href={playerName ? `https://sfbuff.site/search?q=${encodeURIComponent(playerName)}` : `https://sfbuff.site/`} target="_blank" rel="noreferrer" style={linkBtn('#0ff')}>SFBuff</a>
          </div>
        </div>

        <div style={{textAlign:'center', color:'#f44', fontWeight:'bold', margin:'8px 0'}}>VS {selectedChar.name} ({activeTabInfo.label})</div>

        <div style={tabGroupStyle}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{...tabBtnStyle, color: activeTab === t.id ? '#0ff' : '#666', background: activeTab === t.id ? '#222' : '#000'}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={paletteStyle}>
          {COMMANDS.map(cmd => <button key={cmd} onClick={() => insertCmd(cmd)} style={cmdBtnStyle}>{cmd}</button>)}
        </div>

        {activeTab === 'myCombo' ? (
          <div>
            {comboList.map((item, idx) => (
              <div key={idx} style={comboCardStyle}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                  <div style={{display:'flex', gap:'4px', flexWrap:'wrap'}}>
                    {HIT_TYPES.map(ht => <button key={ht} onClick={() => updateCombo(idx, 'hitType', ht)} style={{...hitTypeBtnStyle, background: item.hitType === ht ? '#f44' : '#333'}}>{ht}</button>)}
                  </div>
                  <div style={{display:'flex', gap:'4px'}}>
                    {LOCATIONS.map(loc => <button key={loc} onClick={() => updateCombo(idx, 'location', loc)} style={{...locBtnStyle, background: item.location === loc ? '#0ff' : '#333', color: item.location === loc ? '#000' : '#fff'}}>{loc}</button>)}
                  </div>
                </div>
                <div style={comboRow}><div style={{flex:1}}><label style={miniLabel}>始動</label><input style={comboInput} value={item.start || ''} onFocus={() => setFocusField({type:'combo', index:idx, field:'start'})} onChange={e => updateCombo(idx, 'start', e.target.value)} /></div></div>
                <div style={{marginTop:'5px'}}><label style={miniLabel}>コンボレシピ</label><textarea style={comboArea} value={item.content || ''} onFocus={() => setFocusField({type:'combo', index:idx, field:'content'})} onChange={e => updateCombo(idx, 'content', e.target.value)} /></div>
                <div style={situationBox}><label style={{...miniLabel, color:'#fc0'}}>⚡️ セットプレイ / 状況</label><input style={situationInput} value={item.situation || ''} onFocus={() => setFocusField({type:'combo', index:idx, field:'situation'})} onChange={e => updateCombo(idx, 'situation', e.target.value)} placeholder="有利フレームや起き攻め..." /></div>
              </div>
            ))}
          </div>
        ) : activeTab === 'badHabits' ? (
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            <div style={alertBoxStyle('#f44')}><label style={{fontSize:'10px'}}>🚫 悪癖</label><textarea style={noBorderArea} value={currentCharData.badHabits || ''} onFocus={() => setFocusField({type:'main', field:'badHabits'})} onChange={e => update('badHabits', e.target.value)} /></div>
            <div style={alertBoxStyle('#2e7')}><label style={{fontSize:'10px'}}>💡 矯正</label><textarea style={noBorderArea} value={currentCharData.correction || ''} onFocus={() => setFocusField({type:'main', field:'correction'})} onChange={e => update('correction', e.target.value)} /></div>
          </div>
        ) : (
          <textarea style={mainTextAreaStyle} value={currentCharData[activeTab] || ''} onFocus={() => setFocusField({type:'main', field:activeTab})} onChange={e => update(activeTab, e.target.value)} placeholder="AIの回答をここにペースト..." />
        )}
      </main>
    </div>
  );
}

// スタイルは前回と同様のため省略なしでそのままお使いいただけます
const containerStyle = { display:'flex', flexDirection:'column', height:'100vh', background:'#050505', color:'#fff', overflow:'hidden' };
const headerStyle = { display:'flex', justifyContent:'space-between', padding:'10px', background:'#111', alignItems:'center' };
const nameInputStyle = { width:'60px', background:'#000', color:'#fff', border:'1px solid #444', fontSize:'10px', borderRadius:'4px', padding:'2px 5px' };
const selectStyle = { background:'#000', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', fontSize:'10px' };
const aiBtnStyle = { background:'linear-gradient(to right, #6a11cb, #2575fc)', border:'none', color:'#fff', borderRadius:'4px', fontSize:'9px', padding:'4px 10px' };
const backupBtnStyle = { background:'#222', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', fontSize:'11px', padding:'3px 6px' };
const restoreBtnStyle = { background:'#222', color:'#fc0', border:'1px solid #fc0', borderRadius:'4px', fontSize:'11px', padding:'3px 6px' };
const charNavStyle = { display:'flex', overflowX:'auto', padding:'10px', gap:'12px', background:'#000', borderBottom:'1px solid #222' };
const charItemStyle = { display:'flex', flexDirection:'column', alignItems:'center', minWidth:'45px', cursor:'pointer', transition: 'opacity 0.2s' };
const iconBox = { width:'40px', height:'40px', borderRadius:'5px', overflow:'hidden' };
const winRowStyle = { display:'flex', gap:'10px', background:'#111', padding:'10px', borderRadius:'8px' };
const winInput = { width:'35px', background:'#000', color:'#0f0', border:'1px solid #444', fontSize:'12px' };
const saveBtnStyle = { background:'#0ff', border:'none', borderRadius:'3px', fontSize:'10px', marginLeft:'5px' };
const linkBtn = (c) => ({ color:c, border:`1px solid ${c}`, padding:'4px 10px', borderRadius:'4px', fontSize:'10px', textDecoration:'none', textAlign:'center' });
const tabGroupStyle = { display:'flex', gap:'2px', marginBottom:'10px' };
const tabBtnStyle = { flex:1, padding:'8px 0', border:'1px solid #333', fontSize:'10px' };
const paletteStyle = { display:'flex', flexWrap:'wrap', gap:'4px', background:'#111', padding:'8px', borderRadius:'8px', marginBottom:'10px' };
const cmdBtnStyle = { background:'#333', color:'#fff', border:'none', padding:'5px 8px', borderRadius:'4px', fontSize:'11px' };
const comboCardStyle = { background:'#111', padding:'10px', borderRadius:'8px', marginBottom:'10px', border:'1px solid #333' };
const comboRow = { display:'flex', gap:'10px' };
const miniLabel = { fontSize:'9px', color:'#888', display:'block', marginBottom:'2px' };
const comboInput = { width:'100%', background:'#000', color:'#fff', border:'1px solid #444', padding:'5px', boxSizing:'border-box', fontSize:'12px' };
const comboArea = { width:'100%', background:'#000', color:'#ccc', border:'1px solid #333', padding:'5px', height:'45px', boxSizing:'border-box', fontSize:'12px' };
const situationBox = { marginTop:'8px', borderTop:'1px dashed #333', paddingTop:'8px' };
const situationInput = { width:'100%', background:'#1a1a00', color:'#fc0', border:'1px solid #440', padding:'5px', boxSizing:'border-box', fontSize:'11px' };
const hitTypeBtnStyle = { border:'none', color:'#fff', fontSize:'9px', padding:'2px 6px', borderRadius:'3px' };
const locBtnStyle = { border:'none', fontSize:'9px', padding:'2px 6px', borderRadius:'3px' };
const alertBoxStyle = (c) => ({ border:`1px solid ${c}`, padding:'8px', borderRadius:'8px' });
const noBorderArea = { width:'100%', background:'transparent', border:'none', color:'#eee', outline:'none', height:'50px' };
const mainTextAreaStyle = { width:'100%', height:'200px', background:'#000', color:'#eee', padding:'10px', borderRadius:'8px', border:'1px solid #333', boxSizing:'border-box' };
