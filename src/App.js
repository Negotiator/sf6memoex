import React, { useState, useEffect } from 'react';

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
const HIT_TYPES = ['通常', 'パニカン', 'カウンター', '持続', '空中'];
const LOCATIONS = ['中央', '画面端', 'どこでも'];

const TABS = [
  { id: 'strategy', label: '対策', icon: '🧠' },
  { id: 'myCombo', label: 'コンボ', icon: '💎' },
  { id: 'setplay', label: '連携', icon: '⚡' },
  { id: 'badHabits', label: '悪癖', icon: '🚫' },
  { id: 'todo', label: '実践', icon: '⚔️' },
];

const STORAGE_KEY = 'sf6_master_data_v5';

export default function App() {
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [myChar, setMyChar] = useState(CHARACTERS[0]);
  const [controlType, setControlType] = useState('C');
  const [playerName, setPlayerName] = useState('');
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState('strategy');
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
      if (parsed.controlType) setControlType(parsed.controlType);
      if (parsed.playerName) setPlayerName(parsed.playerName);
    }
  }, []);

  const updateMyData = (field, value) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const updateChar = (field, value) => {
    const newData = { ...data, [selectedChar.id]: { ...(data[selectedChar.id] || {}), [field]: value } };
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const updateList = (listKey, charId, index, field, value, defaultItem) => {
    const allLists = data[listKey] || {};
    const myList = [...(allLists[charId] || [defaultItem])];
    myList[index] = { ...myList[index], [field]: value };
    
    if (myList[myList.length - 1].content || myList[myList.length - 1].start || myList[myList.length - 1].setup) {
      myList.push(defaultItem);
    }
    
    const newData = { ...data, [listKey]: { ...allLists, [charId]: myList } };
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const insertCmd = (cmd) => {
    if (!focusField) return;
    const { type, index, field, listKey, charId } = focusField;
    const formatCmd = (current) => {
      const trimmed = current ? current.trim() : "";
      if (trimmed === "") return cmd;
      const lastPart = trimmed.split(' ').pop();
      if (cmd === "TC") return `${trimmed} ${cmd}`;
      if (/^[0-9]+$/.test(lastPart) || lastPart === "OD") return `${trimmed}${cmd}`;
      return `${trimmed} > ${cmd}`;
    };

    if (type === 'list') {
      const current = data[listKey]?.[charId]?.[index]?.[field] || '';
      const defaultItems = {
        charCombos: {start:'', content:'', hitType:'通常', location:'中央', difficulty:1, successRate:100, dmg:'', plusF:''},
        charSetplays: {finisher:'', location:'中央', plusF:'', setup:'', note:''}
      };
      updateList(listKey, charId, index, field, formatCmd(current), defaultItems[listKey]);
    } else {
      const current = data[selectedChar.id]?.[field] || '';
      updateChar(field, formatCmd(current));
    }
  };

  const getSFBuffLink = () => {
    if (!playerName) return "https://sfbuff.site/";
    return /^[0-9]+$/.test(playerName) ? `https://sfbuff.site/fighters/search?q=${playerName}` : `https://sfbuff.site/search?q=${playerName}`;
  };

  const comboList = data.charCombos?.[myChar.id] || [{start:'', content:'', hitType:'通常', location:'中央', difficulty:1, successRate:100, dmg:'', plusF:''}];
  const setplayList = data.charSetplays?.[myChar.id] || [{finisher:'', location:'中央', plusF:'', setup:'', note:''}];
  const trainingList = comboList.filter(c => c.content && (parseInt(c.successRate) || 0) < 80);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
          <input style={nameInputStyle} placeholder="コード" value={playerName} onChange={(e) => { setPlayerName(e.target.value); updateMyData('playerName', e.target.value); }} />
          <select value={myChar.id} onChange={(e) => { const char = CHARACTERS.find(c => c.id === e.target.value); setMyChar(char); updateMyData('myCharId', char.id); }} style={selectStyle}>
            {CHARACTERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={controlToggleStyle}>
            {['C', 'M'].map(t => (
              <button key={t} onClick={() => { setControlType(t); updateMyData('controlType', t); }} style={{...toggleBtn, background: controlType === t ? (t === 'C' ? '#0ff' : '#fc0') : '#333', color: controlType === t ? '#000' : '#888'}}>{t}</button>
            ))}
          </div>
        </div>
        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(data)).then(() => alert("保存しました"))} style={backupBtnStyle}>💾</button>
      </header>

      <div style={charNavStyle}>
        {CHARACTERS.map(c => (
          <div key={c.id} onClick={() => setSelectedChar(c)} style={{...charItemStyle, opacity: selectedChar.id === c.id ? 1 : 0.4}}>
            <div style={{...iconBox, border: selectedChar.id === c.id ? '2px solid #0ff' : '1px solid #444'}}>
              <div style={{fontSize:'12px'}}>{c.name[0]}</div>
            </div>
            <div style={{fontSize:'8px', color: selectedChar.id === c.id ? '#0ff' : '#888'}}>{c.name}</div>
          </div>
        ))}
      </div>

      <main style={{flex:1, padding:'10px', overflowY:'auto'}}>
        <div style={tabGroupStyle}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{...tabBtnStyle, color: activeTab === t.id ? '#0ff' : '#666', background: activeTab === t.id ? '#222' : '#000'}}>{t.icon} {t.label}</button>
          ))}
        </div>

        {activeTab !== 'todo' && (
          <div style={paletteStyle}>
            {[...COMMON_CMDS, ...(controlType === 'C' ? CLASSIC_CMDS : MODERN_CMDS), ...SYSTEM_CMDS].map(cmd => (
              <button key={cmd} onClick={() => insertCmd(cmd)} style={cmdBtnStyle}>{cmd}</button>
            ))}
          </div>
        )}

        {activeTab === 'myCombo' ? (
          <div>
            {comboList.map((item, idx) => (
              <div key={idx} style={comboCardStyle}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                  <div style={{display:'flex', gap:'3px'}}>{HIT_TYPES.map(ht => <button key={ht} onClick={() => updateList('charCombos', myChar.id, idx, 'hitType', ht, {})} style={{...miniBtnStyle, background: item.hitType === ht ? '#f44' : '#333'}}>{ht}</button>)}</div>
                  <div style={{display:'flex', gap:'3px'}}>{LOCATIONS.map(loc => <button key={loc} onClick={() => updateList('charCombos', myChar.id, idx, 'location', loc, {})} style={{...miniBtnStyle, background: item.location === loc ? '#0ff' : '#333', color: item.location === loc ? '#000' : '#fff'}}>{loc}</button>)}</div>
                </div>
                <div style={inputGrid}>
                   <div><label style={miniLabel}>始動</label><input style={comboInput} value={item.start || ''} onFocus={() => setFocusField({type:'list', listKey:'charCombos', charId:myChar.id, index:idx, field:'start'})} onChange={e => updateList('charCombos', myChar.id, idx, 'start', e.target.value)} /></div>
                   <div><label style={miniLabel}>DMG</label><input style={comboInput} type="number" value={item.dmg || ''} onChange={e => updateList('charCombos', myChar.id, idx, 'dmg', e.target.value)} /></div>
                   <div><label style={miniLabel}>有利F</label><input style={{...comboInput, color:'#0f0'}} type="number" value={item.plusF || ''} onChange={e => updateList('charCombos', myChar.id, idx, 'plusF', e.target.value)} /></div>
                </div>
                <div style={{marginTop:'5px'}}><label style={miniLabel}>レシピ</label><textarea style={comboArea} value={item.content || ''} onFocus={() => setFocusField({type:'list', listKey:'charCombos', charId:myChar.id, index:idx, field:'content'})} onChange={e => updateList('charCombos', myChar.id, idx, 'content', e.target.value)} /></div>
                <div style={{marginTop:'5px', display:'flex', gap:'10px'}}>
                  <div style={{flex:1}}><label style={miniLabel}>成功率(%)</label><input type="number" style={comboInput} value={item.successRate || 0} onChange={e => updateList('charCombos', myChar.id, idx, 'successRate', e.target.value)} /></div>
                  <div style={{flex:1}}>
                    <label style={miniLabel}>難易度</label>
                    <select value={item.difficulty || 1} onChange={e => updateList('charCombos', myChar.id, idx, 'difficulty', e.target.value)} style={comboInput}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                    </select>
                  </div>
                </div>
                {item.plusF && (
                  <div style={setupSuggestion}>
                    <div style={{fontSize:'9px', color:'#fc0', marginBottom:'4px'}}>💡 有利F {item.plusF} の連携候補:</div>
                    {setplayList.filter(s => s.plusF === item.plusF && (s.location === item.location || s.location === 'どこでも')).map((s, i) => (
                      <div key={i} style={{fontSize:'10px', color:'#eee', borderLeft:'2px solid #fc0', paddingLeft:'5px', marginBottom:'2px'}}>{s.setup} <span style={{color:'#888'}}>({s.note})</span></div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : activeTab === 'setplay' ? (
          <div>
            {setplayList.map((item, idx) => (
              <div key={idx} style={comboCardStyle}>
                <div style={inputGrid}>
                   <div style={{gridColumn:'span 2'}}><label style={miniLabel}>締め技パーツ</label><input style={comboInput} value={item.finisher || ''} onFocus={() => setFocusField({type:'list', listKey:'charSetplays', charId:myChar.id, index:idx, field:'finisher'})} onChange={e => updateList('charSetplays', myChar.id, idx, 'finisher', e.target.value)} /></div>
                   <div><label style={miniLabel}>有利F</label><input style={{...comboInput, color:'#0f0'}} type="number" value={item.plusF || ''} onChange={e => updateList('charSetplays', myChar.id, idx, 'plusF', e.target.value)} /></div>
                </div>
                <div style={{marginTop:'8px', display:'flex', gap:'5px'}}>{LOCATIONS.map(loc => <button key={loc} onClick={() => updateList('charSetplays', myChar.id, idx, 'location', loc, {})} style={{...miniBtnStyle, flex:1, background: item.location === loc ? '#0ff' : '#333', color: item.location === loc ? '#000' : '#fff'}}>{loc}</button>)}</div>
                <div style={{marginTop:'8px'}}><label style={miniLabel}>セットプレイ内容</label><input style={comboInput} value={item.setup || ''} onFocus={() => setFocusField({type:'list', listKey:'charSetplays', charId:myChar.id, index:idx, field:'setup'})} onChange={e => updateList('charSetplays', myChar.id, idx, 'setup', e.target.value)} /></div>
                <div style={{marginTop:'5px'}}><label style={miniLabel}>備考</label><input style={{...comboInput, fontSize:'10px', color:'#888'}} value={item.note || ''} onChange={e => updateList('charSetplays', myChar.id, idx, 'note', e.target.value)} /></div>
              </div>
            ))}
          </div>
        ) : activeTab === 'todo' ? (
          <div>
            <div style={sectionTitle}>⚔️ コンボ集中練習リスト</div>
            {trainingList.map((item, idx) => (
              <div key={idx} style={trainingCard}>
                <div style={{color:'#f44', fontSize:'10px'}}>成功率: {item.successRate}%</div>
                <div style={{color:'#fff', fontSize:'12px', fontWeight:'bold'}}>{item.start} (DMG: {item.dmg})</div>
                <div style={{color:'#0ff', fontSize:'11px'}}>{item.content}</div>
              </div>
            ))}
            <textarea style={mainTextAreaStyle} value={data[selectedChar.id]?.todo || ''} onFocus={() => setFocusField({type:'main', field:'todo'})} onChange={e => updateChar('todo', e.target.value)} placeholder="自由な実践メモ..." />
          </div>
        ) : (
          <textarea style={mainTextAreaStyle} value={data[selectedChar.id]?.[activeTab] || ''} onFocus={() => setFocusField({type:'main', field:activeTab})} onChange={e => updateChar(activeTab, e.target.value)} />
        )}
      </main>
      <a href={getSFBuffLink()} target="_blank" rel="noreferrer" style={floatingSFBuff}>SFBuff</a>
    </div>
  );
}

const containerStyle = { display:'flex', flexDirection:'column', height:'100vh', background:'#050505', color:'#fff', overflow:'hidden' };
const headerStyle = { display:'flex', justifyContent:'space-between', padding:'10px', background:'#111', alignItems:'center', borderBottom:'1px solid #333' };
const nameInputStyle = { width:'60px', background:'#000', color:'#fff', border:'1px solid #444', fontSize:'10px', padding:'3px' };
const selectStyle = { background:'#000', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', fontSize:'10px' };
const controlToggleStyle = { display:'flex', background:'#000', borderRadius:'4px', padding:'1px', border:'1px solid #333' };
const toggleBtn = { border:'none', fontSize:'9px', padding:'2px 6px', borderRadius:'2px', cursor:'pointer' };
const backupBtnStyle = { background:'#222', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', padding:'4px' };
const charNavStyle = { display:'flex', overflowX:'auto', padding:'10px', gap:'12px', background:'#000' };
const charItemStyle = { display:'flex', flexDirection:'column', alignItems:'center', minWidth:'45px' };
const iconBox = { width:'38px', height:'38px', borderRadius:'4px', overflow:'hidden', border:'1px solid #444', display:'flex', alignItems:'center', justifyContent:'center' };
const tabGroupStyle = { display:'flex', gap:'2px', marginBottom:'10px' };
const tabBtnStyle = { flex:1, padding:'10px 0', border:'1px solid #333', fontSize:'10px' };
const paletteStyle = { display:'flex', flexWrap:'wrap', gap:'3px', background:'#111', padding:'8px', borderRadius:'8px', marginBottom:'10px' };
const cmdBtnStyle = { background:'#333', color:'#fff', border:'none', padding:'6px 8px', borderRadius:'4px', fontSize:'10px' };
const comboCardStyle = { background:'#111', padding:'12px', borderRadius:'8px', marginBottom:'10px', border:'1px solid #333' };
const inputGrid = { display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'8px' };
const comboInput = { width:'100%', background:'#000', color:'#fff', border:'1px solid #444', padding:'5px', fontSize:'11px', borderRadius:'3px' };
const comboArea = { width:'100%', background:'#000', color:'#ccc', border:'1px solid #333', padding:'5px', height:'45px', fontSize:'11px', borderRadius:'3px' };
const miniLabel = { fontSize:'8px', color:'#888', display:'block' };
const miniBtnStyle = { border:'none', color:'#fff', fontSize:'8px', padding:'2px 6px', borderRadius:'3px' };
const setupSuggestion = { marginTop:'8px', padding:'8px', background:'#221a00', borderRadius:'5px', border:'1px solid #440' };
const sectionTitle = { fontSize:'11px', color:'#fc0', marginBottom:'8px', fontWeight:'bold' };
const trainingCard = { background:'#1a1a1a', padding:'8px', borderRadius:'6px', marginBottom:'8px', borderLeft:'3px solid #f44' };
const mainTextAreaStyle = { width:'100%', height:'250px', background:'#000', color:'#eee', padding:'10px', border:'1px solid #333', borderRadius:'8px' };
const floatingSFBuff = { position:'fixed', bottom:'20px', right:'20px', background:'#0ff', color:'#000', padding:'8px 15px', borderRadius:'20px', fontSize:'11px', fontWeight:'bold', textDecoration:'none', boxShadow:'0 0 10px #0ff' };
