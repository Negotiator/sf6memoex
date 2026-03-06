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

const COMMANDS = ['5', '2', '6', '4', '8', '236', '214', '623', '41236', '63214', 'P', 'K', 'LP', 'MP', 'HP', 'LK', 'MK', 'HK', 'DR', 'PC'];
const HIT_TYPES = ['通常', 'パニカン', 'カウンター', '持続', '空中'];

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
    const myCombos = [...(allCharCombos[myChar.id] || [{start:'', content:'', hitType:'通常'}])];
    myCombos[index] = { ...myCombos[index], [field]: value };
    if (myCombos[myCombos.length - 1].content) {
      myCombos.push({ start: '', content: '', hitType:'通常' });
    }
    const newData = { ...data, charCombos: { ...allCharCombos, [myChar.id]: myCombos } };
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const insertCmd = (cmd) => {
    if (!focusField) return;
    const { type, index, field } = focusField;
    if (type === 'combo') {
      const allCharCombos = data.charCombos || {};
      const myCombos = allCharCombos[myChar.id] || [{start:''}];
      const current = myCombos[index]?.[field] || '';
      updateCombo(index, field, current + ` [${cmd}] `);
    } else {
      const current = data[selectedChar.id]?.[activeTab] || '';
      update(activeTab, current + ` [${cmd}] `);
    }
  };

  const copyAIPrompt = () => {
    const prompt = `SF6コーチとして対${selectedChar.name}の${myChar.name}対策を教えてください。`.trim();
    navigator.clipboard.writeText(prompt).then(() => alert("コピーしました"));
  };

  // ↓ バックアップ機能
  const exportData = () => {
    const dataStr = localStorage.getItem(STORAGE_KEY);
    if (!dataStr) return alert("データがありません");
    navigator.clipboard.writeText(dataStr).then(() => alert("全データをクリップボードにコピーしました！メモ帳などに保存してください。"));
  };

  // ↓ 復元機能
  const importData = () => {
    const input = prompt("バックアップしたテキストを貼り付けてください。");
    if (input) {
      try {
        JSON.parse(input); // 形式チェック
        localStorage.setItem(STORAGE_KEY, input);
        alert("復元しました。ページを再読み込みします。");
        window.location.reload();
      } catch (e) {
        alert("形式が正しくありません。");
      }
    }
  };

  const currentCharData = data[selectedChar.id] || {};
  const winRecords = currentCharData.winRateRecords || [];
  const comboList = (data.charCombos && data.charCombos[myChar.id]) || [{start:'', content:'', hitType:'通常'}];

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={{display:'flex', gap:'5px'}}>
          <input 
            style={nameInputStyle} 
            placeholder="PLAYER名" 
            value={playerName} 
            onChange={(e) => { setPlayerName(e.target.value); updateMyData('playerName', e.target.value); }} 
          />
          <select value={myChar.id} onChange={(e) => {
            const char = CHARACTERS.find(c => c.id === e.target.value);
            setMyChar(char); updateMyData('myCharId', char.id);
          }} style={selectStyle}>
            {CHARACTERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{display:'flex', gap:'5px'}}>
          <button onClick={copyAIPrompt} style={aiBtnStyle}>✨ AI</button>
          <button onClick={exportData} style={backupBtnStyle}>💾 保存</button>
          <button onClick={importData} style={restoreBtnStyle}>📥 復元</button>
        </div>
      </header>

      <div style={charNavStyle}>
        {CHARACTERS.map(c => (
          <div key={c.id} onClick={() => setSelectedChar(c)} style={{...charItemStyle, opacity: selectedChar.id === c.id ? 1 : 0.4}}>
            <div style={{...iconBox, border: selectedChar.id === c.id ? '2px solid #0ff' : '1px solid #444'}}>
              <img src={`/${c.id}.png`} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML=`<div style="font-size:10px;text-align:center;line-height:40px">${c.name[0]}</div>` }} />
            </div>
            <div style={{fontSize:'8px', color: selectedChar.id === c.id ? '#0ff' : '#888'}}>{c.name}</div>
          </div>
        ))}
      </div>

      <main style={{
