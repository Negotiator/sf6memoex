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
    const myCombos = [...(allCharCombos[myChar.id] || [{start:'', content:'', hitType:'通常', situation:'', location:'中央', difficulty:1, successRate:100}])];
    myCombos[index] = { ...myCombos[index], [field]: value };
    if (myCombos[myCombos.length - 1].content || myCombos[myCombos.length - 1].start) {
      myCombos.push({ start: '', content: '', hitType:'通常', situation:'', location:'中央', difficulty:1, successRate:100 });
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
      const lastPart = trimmed.split(' ').pop();
      if (cmd === "TC") return `${trimmed} ${cmd}`;
      if (/^[0-9]+$/.test(lastPart) || lastPart === "OD") return `${trimmed}${cmd}`;
      return `${trimmed} > ${cmd}`;
    };
    if (type === 'combo') {
      const allCharCombos = data.charCombos || {};
      const myCombos = allCharCombos[myChar.id] || [];
      updateCombo(index, field, formatCmd(myCombos[index]?.[field] || ''));
    } else {
      update(focusField.field, formatCmd(data[selectedChar.id]?.[focusField.field] || ''));
    }
  };

  const getSFBuffLink = () => {
    if (!playerName) return "https://sfbuff.site/";
    return /^[0-9]+$/.test(playerName) 
      ? `https://sfbuff.site/fighters/search?q=${encodeURIComponent(playerName)}` 
      : `https://sfbuff.site/search?q=${encodeURIComponent(playerName)}`;
  };

  const currentCharData = data[selectedChar.id] || {};
  const comboList = (data.charCombos && data.charCombos[myChar.id]) || [{start:'', content:'', hitType:'通常', situation:'', location:'中央', difficulty:1, successRate:100}];
  
  // 成功率80%未満のコンボを抽出
  const trainingList = comboList.filter(c => c.content && (parseInt(c.successRate) || 0) < 80);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={{display:'flex', gap:'5px'}}>
          <input style={nameInputStyle} placeholder="コード" value={playerName} onChange={(e) => { setPlayerName(e.target.value); updateMyData('playerName', e.target.value); }} />
          <select value={myChar.id} onChange={(e) => { const char = CHARACTERS.find(c => c.id === e.target.value); setMyChar(char); updateMyData('myCharId', char.id); }} style={selectStyle}>
            {CHARACTERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{display:'flex', gap:'4px'}}>
          <button onClick={() => navigator.clipboard.writeText(JSON.stringify(data)).then(() => alert("保存"))} style={backupBtnStyle}>💾</button>
          <button onClick={() => { const input = prompt("インポート"); if (input) { try { JSON.parse(input); localStorage.setItem(STORAGE_KEY, input); window.location.reload(); } catch(e){} } }} style={restoreBtnStyle}>📥</button>
        </div>
      </header>

      <div style={charNavStyle}>
        {CHARACTERS.map(c => (
          <div key={c.id} onClick={() => setSelectedChar(c)} style={{...charItemStyle, opacity: selectedChar.id === c.id ? 1 : 0.4}}>
            <div style={{...iconBox, border: selectedChar.id === c.id ? '2px solid #0ff' : '1px solid #444'}}>
              <img src={`/${c.id}.png`} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} />
            </div>
            <div style={{fontSize:'8px', color: selectedChar.id === c.id ? '#0ff' : '#888', marginTop:'2px'}}>{c.name}</div>
          </div>
        ))}
      </div>

      <main style={{flex:1, padding:'10px', overflowY:'auto'}}>
        <div style={winRowStyle}>
          <div style={{flex:1}}>
            <input style={winInput} value={newWinRate} onChange={e => setNewWinRate(e.target.value)} placeholder="%" type="number" />
            <button onClick={() => { if (!newWinRate) return; update('winRateRecords', [{ id: Date.now(), rate: parseFloat(newWinRate) }, ...(currentCharData.winRateRecords || [])].slice(0, 10)); setNewWinRate(''); }} style={saveBtnStyle}>記録</button>
            <div style={{height:'30px', marginTop:'5px'}}><ResponsiveContainer width="100%" height="100%"><LineChart data={[...(currentCharData.winRateRecords || [])].reverse()}><Line type="monotone" dataKey="rate" stroke="#0ff" dot={{r:2}} /></LineChart></ResponsiveContainer></div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
            <a href={getSFBuffLink()} target="_blank" rel="noreferrer" style={linkBtn('#0ff')}>SFBuff</a>
            <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeTab === 'myCombo' ? `スト6 ${myChar.name}` : `スト6 ${selectedChar.name} 対策`)}`} target="_blank" rel="noreferrer" style={linkBtn('#f00')}>YT</a>
          </div>
        </div>

        <div style={tabGroupStyle}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{...tabBtnStyle, color: activeTab === t.id ? '#0ff' : '#666', background: activeTab === t.id ? '#222' : '#000'}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {activeTab !== 'todo' && (
          <div style={paletteStyle}>
            {COMMANDS.map(cmd => <button key={cmd} onClick={() => insertCmd(cmd)} style={cmdBtnStyle}>{cmd}</button>)}
          </div>
        )}

        {activeTab === 'myCombo' ? (
          <div>
            {comboList.map((item, idx) => (
              <div key={idx} style={comboCardStyle}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                  <select value={item.difficulty || 1} onChange={e => updateCombo(idx, 'difficulty', e.target.value)} style={miniSelect}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                  </select>
                  <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
                    <span style={miniLabel}>成功率</span>
                    <input type="number" style={rateInput} value={item.successRate || 0} onChange={e => updateCombo(idx, 'successRate', e.target.value)} />
                    <span style={miniLabel}>%</span>
                  </div>
                </div>
                <div style={comboRow}><div style={{flex:1}}><label style={miniLabel}>始動</label><input style={comboInput} value={item.start || ''} onFocus={() => setFocusField({type:'combo', index:idx, field:'start'})} onChange={e => updateCombo(idx, 'start', e.target.value)} /></div></div>
                <div style={{marginTop:'5px'}}><label style={miniLabel}>レシピ</label><textarea style={comboArea} value={item.content || ''} onFocus={() => setFocusField({type:'combo', index:idx, field:'content'})} onChange={e => updateCombo(idx, 'content', e.target.value)} /></div>
              </div>
            ))}
          </div>
        ) : activeTab === 'todo' ? (
          <div>
            <div style={sectionTitle}>⚔️ コンボ集中練習リスト (成功率80%未満)</div>
            {trainingList.length > 0 ? trainingList.map((item, idx) => (
              <div key={idx} style={trainingCard}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'10px', color:'#888'}}>
                  <span>難易度: {"★".repeat(item.difficulty || 1)}</span>
                  <span style={{color: '#f44'}}>現在: {item.successRate}%</span>
                </div>
                <div style={{color:'#fff', fontSize:'12px', fontWeight:'bold', marginTop:'5px'}}>{item.start}</div>
                <div style={{color:'#0ff', fontSize:'11px', marginTop:'3px'}}>{item.content}</div>
              </div>
            )) : <div style={{textAlign:'center', color:'#888', marginTop:'20px'}}>完璧です！練習が必要なコンボはありません。</div>}
            
            <div style={{...sectionTitle, marginTop:'20px'}}>📝 その他実践メモ</div>
            <textarea style={mainTextAreaStyle} value={currentCharData.todo || ''} onFocus={() => setFocusField({type:'main', field:'todo'})} onChange={e => update('todo', e.target.value)} />
          </div>
        ) : (
          <textarea style={mainTextAreaStyle} value={currentCharData[activeTab] || ''} onFocus={() => setFocusField({type:'main', field:activeTab})} onChange={e => update(activeTab, e.target.value)} />
        )}
      </main>
    </div>
  );
}

const containerStyle = { display:'flex', flexDirection:'column', height:'100vh', background:'#050505', color:'#fff', overflow:'hidden' };
const headerStyle = { display:'flex', justifyContent:'space-between', padding:'10px', background:'#111', alignItems:'center' };
const nameInputStyle = { width:'80px', background:'#000', color:'#fff', border:'1px solid #444', fontSize:'10px', borderRadius:'4px', padding:'2px 5px' };
const selectStyle = { background:'#000', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', fontSize:'10px' };
const backupBtnStyle = { background:'#222', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', padding:'3px 6px' };
const restoreBtnStyle = { background:'#222', color:'#fc0', border:'1px solid #fc0', borderRadius:'4px', padding:'3px 6px' };
const charNavStyle = { display:'flex', overflowX:'auto', padding:'10px', gap:'12px', background:'#000', borderBottom:'1px solid #222' };
const charItemStyle = { display:'flex', flexDirection:'column', alignItems:'center', minWidth:'45px' };
const iconBox = { width:'40px', height:'40px', borderRadius:'5px', overflow:'hidden' };
const winRowStyle = { display:'flex', gap:'10px', background:'#111', padding:'10px', borderRadius:'8px', marginBottom:'10px' };
const winInput = { width:'35px', background:'#000', color:'#0f0', border:'1px solid #444' };
const saveBtnStyle = { background:'#0ff', border:'none', borderRadius:'3px', fontSize:'10px', marginLeft:'5px' };
const linkBtn = (c) => ({ color:c, border:`1px solid ${c}`, padding:'4px 8px', borderRadius:'4px', fontSize:'10px', textDecoration:'none', textAlign:'center' });
const tabGroupStyle = { display:'flex', gap:'2px', marginBottom:'10px' };
const tabBtnStyle = { flex:1, padding:'8px 0', border:'1px solid #333', fontSize:'10px' };
const paletteStyle = { display:'flex', flexWrap:'wrap', gap:'4px', background:'#111', padding:'8px', borderRadius:'8px', marginBottom:'10px' };
const cmdBtnStyle = { background:'#333', color:'#fff', border:'none', padding:'5px 8px', borderRadius:'4px', fontSize:'11px' };
const comboCardStyle = { background:'#111', padding:'10px', borderRadius:'8px', marginBottom:'10px', border:'1px solid #333' };
const miniSelect = { background:'#222', color:'#fc0', border:'1px solid #444', fontSize:'10px', borderRadius:'3px' };
const rateInput = { width:'40px', background:'#000', color:'#f44', border:'1px solid #444', textAlign:'center', fontSize:'12px' };
const comboInput = { width:'100%', background:'#000', color:'#fff', border:'1px solid #444', padding:'5px', fontSize:'12px' };
const comboArea = { width:'100%', background:'#000', color:'#ccc', border:'1px solid #333', padding:'5px', height:'45px', fontSize:'12px' };
const miniLabel = { fontSize:'9px', color:'#888' };
const sectionTitle = { fontSize:'12px', color:'#fc0', marginBottom:'10px', fontWeight:'bold', borderLeft:'3px solid #fc0', paddingLeft:'8px' };
const trainingCard = { background:'#1a1a1a', padding:'10px', borderRadius:'6px', marginBottom:'8px', borderLeft:'3px solid #f44' };
const mainTextAreaStyle = { width:'100%', height:'200px', background:'#000', color:'#eee', padding:'10px', borderRadius:'8px', border:'1px solid #333' };
const comboRow = { display:'flex', gap:'10px' };
