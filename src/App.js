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

const COMMANDS = ['5', '2', '6', '4', '8', '236', '214', '623', '41236', '63214', 'P', 'K', 'LP', 'MP', 'HP', 'LK', 'MK', 'HK', 'DR', 'PC'];

const TABS = [
  { id: 'strategy', label: '対策', icon: '🧠' },
  { id: 'myCombo', label: 'コンボ', icon: '💎' },
  { id: 'badHabits', label: '悪癖', icon: '🚫' },
  { id: 'todo', label: '実践', icon: '⚔️' },
];

const STORAGE_KEY = 'sf6_master_data_v2';

export default function App() {
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [myChar, setMyChar] = useState(CHARACTERS[0]);
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
    }
  }, []);

  const copyAIPrompt = () => {
    let specificInstruction = "";
    if (activeTab === 'myCombo') {
      specificInstruction = `動画内の${myChar.name}のコンボを抽出してください。形式：始動技、内容、セットプレイ。`;
    } else {
      specificInstruction = `対${selectedChar.name}の対策ポイントを箇条書きで抽出してください。`;
    }
    const prompt = `あなたはSF6コーチです。自キャラ:${myChar.name}、敵キャラ:${selectedChar.name}。${specificInstruction}`.trim();
    navigator.clipboard.writeText(prompt).then(() => alert("AIプロンプトをコピーしました！"));
  };

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
    const myCombos = [...(allCharCombos[myChar.id] || [{start:'', content:'', setup:''}])];
    myCombos[index] = { ...myCombos[index], [field]: value };
    if (myCombos[myCombos.length - 1].content) {
      myCombos.push({ start: '', content: '', setup: '' });
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

  const currentCharData = data[selectedChar.id] || {};
  const comboList = (data.charCombos && data.charCombos[myChar.id]) || [{start:'', content:'', setup:''}];

  return (
    <div style={{ backgroundColor: '#050505', color: '#fff', minHeight: '100vh', padding: '10px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <select value={myChar.id} onChange={(e) => {
          const char = CHARACTERS.find(c => c.id === e.target.value);
          setMyChar(char); updateMyData('myCharId', char.id);
        }} style={{ background: '#222', color: '#0ff', border: '1px solid #0ff' }}>
          {CHARACTERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={copyAIPrompt} style={{ background: 'linear-gradient(to right, #6a11cb, #2575fc)', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>✨ AI指示</button>
        <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>VS {selectedChar.name}</span>
      </header>

      <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', marginBottom: '20px', paddingBottom: '10px' }}>
        {CHARACTERS.map(c => (
          <div key={c.id} onClick={() => setSelectedChar(c)} style={{ cursor: 'pointer', opacity: selectedChar.id === c.id ? 1 : 0.4, textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', background: `url(/${c.id}.png) center/cover, #333`, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!data[c.id] && <span style={{fontSize: '10px'}}>{c.name[0]}</span>}
            </div>
            <div style={{ fontSize: '8px' }}>{c.name}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '10px 0', background: activeTab === tab.id ? '#333' : '#000', color: activeTab === tab.id ? '#0ff' : '#666', border: '1px solid #444' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#111', padding: '10px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
          {COMMANDS.map(cmd => <button key={cmd} onClick={() => insertCmd(cmd)} style={{ background: '#333', border: 'none', color: '#fff', padding: '5px' }}>{cmd}</button>)}
        </div>

        {activeTab === 'myCombo' ? (
          <div>
            {comboList.map((item, idx) => (
              <div key={idx} style={{ borderBottom: '1px solid #333', padding: '10px 0' }}>
                <input placeholder="始動技" value={item.start || ''} onFocus={() => setFocusField({type: 'combo', index: idx, field: 'start'})} onChange={e => updateCombo(idx, 'start', e.target.value)} style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #444', marginBottom: '5px' }} />
                <textarea placeholder="内容" value={item.content || ''} onFocus={() => setFocusField({type: 'combo', index: idx, field: 'content'})} onChange={e => updateCombo(idx, 'content', e.target.value)} style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #444' }} />
              </div>
            ))}
          </div>
        ) : (
          <textarea 
            style={{ width: '100%', height: '300px', background: '#000', color: '#eee', padding: '10px' }} 
            value={currentCharData[activeTab] || ''} 
            onChange={e => update(activeTab, e.target.value)}
            onFocus={() => setFocusField({type: 'main'})}
            placeholder="ここにメモを入力..."
          />
        )}
      </div>
    </div>
  );
}
