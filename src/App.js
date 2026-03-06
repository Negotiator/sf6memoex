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

const OFFICIAL_ICON_URL = "https://pbs.twimg.com/profile_images/1664102919310860288/C-rC_605_400x400.jpg";
const STORAGE_KEY = 'sf6_master_data_final';

export default function App() {
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [myChar, setMyChar] = useState(CHARACTERS[0]);
  const [playerName, setPlayerName] = useState('');
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState('strategy');
  const [newWinRate, setNewWinRate] = useState('');
  const [focusField, setFocusField] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'apple-touch-icon'; link.href = OFFICIAL_ICON_URL;
    document.getElementsByTagName('head')[0].appendChild(link);
    
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

  const copyAIPrompt = () => {
    let specificInstruction = activeTab === 'myCombo' 
      ? `動画内の${myChar.name}のコンボを全て抽出し、ヒット状況、始動技、内容、セットプレイを形式化してください。`
      : `対${selectedChar.name}における${myChar.name}の立ち回り対策を簡潔な箇条書きでまとめてください。`;

    const prompt = `あなたはSF6コーチです。自キャラ:${myChar.name}、敵キャラ:${selectedChar.name}。${specificInstruction}`.trim();
    navigator.clipboard.writeText(prompt).then(() => alert("AI指示をコピーしました！"));
  };

  const getYTThumb = (url) => {
    if (!url) return null;
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^?&]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
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
    const myCombos = [...(allCharCombos[myChar.id] || [{start:'', content:'', setup:'', difficulty: 3, successRate: '', videoUrl: '', hitType: '通常'}])];
    myCombos[index] = { ...myCombos[index], [field]: value };
    const lastCombo = myCombos[myCombos.length - 1];
    if (lastCombo.start || lastCombo.content) {
      myCombos.push({ start: '', content: '', setup: '', difficulty: 3, successRate: '', videoUrl: '', hitType: '通常' });
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

  const exportAllData = () => {
    const dataStr = localStorage.getItem(STORAGE_KEY);
    navigator.clipboard.writeText(dataStr).then(() => alert("全データをコピーしました！"));
  };

  const importData = () => {
    const input = prompt("バックアップテキストを貼り付けてください。");
    if (input) {
      try {
        const parsed = JSON.parse(input);
        setData(parsed);
        localStorage.setItem(STORAGE_KEY, input);
        alert("復元完了！");
        window.location.reload();
      } catch (e) { alert("形式が違います。"); }
    }
  };

  const currentCharData = data[selectedChar.id] || {};
  const winRecords = currentCharData.winRateRecords || [];
  const comboList = (data.charCombos && data.charCombos[myChar.id]) || [{start:'', content:'', setup:'', difficulty: 3, successRate: '', videoUrl: '', hitType: '通常'}];

  return (
    <div style={containerStyle}>
      <div style={{...charBgOverlay, backgroundImage: `url(/${selectedChar.id}.png)`}} />

      <header style={myCharHeader}>
        <div style={headerLeft}>
          <input 
            style={nameInputStyle} 
            placeholder="PLAYER NAME" 
            value={playerName} 
            onChange={(e) => {
              setPlayerName(e.target.value);
              updateMyData('playerName', e.target.value);
            }} 
          />
          <select style={myCharSelect} value={myChar.id} onChange={(e) => {
            const char = CHARACTERS.find(c => c.id === e.target.value);
            setMyChar(char); updateMyData('myCharId', char.id);
          }}>
            {CHARACTERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={headerBtnGroup}>
          <button onClick={copyAIPrompt} style={aiPromptBtn}>✨ AI指示</button>
          <button onClick={exportAllData} style={globalBackupBtn}>💾 保存</button>
          <button onClick={importData} style={importBtn}>📥 復元</button>
        </div>
      </header>

      <div style={charNavContainer}>
        {CHARACTERS.map(c => (
          <div key={c.id} onClick={() => setSelectedChar(c)} style={charTabStyle(selectedChar.id === c.id)}>
            <div style={iconWrapperStyle(selectedChar.id === c.id)}>
              <img src={`/${c.id}.png`} alt="" style={iconImgStyle} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#222;color:#0ff;font-size:12px;">${c.name[0]}</div>`; }} />
            </div>
            <div style={{ fontSize: '8px', marginTop: '4px', color: selectedChar.id === c.id ? '#0ff' : '#888', textAlign: 'center' }}>{c.name}</div>
          </div>
        ))}
      </div>

      <main style={mainWrapper}>
        <div style={statusRowStyle}>
          <div style={winSectionLeft}>
            <div style={winInputRow}>
              <input style={winInput} value={newWinRate} onChange={e => setNewWinRate(e.target.value)} placeholder="%" type="number" />
              <button onClick={() => {
                if (!newWinRate) return;
                const newRecord = { id: Date.now(), date: new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }), rate: parseFloat(newWinRate) };
                update('winRateRecords', [newRecord, ...winRecords].slice(0, 10));
                setNewWinRate('');
              }} style={saveBtn}>記録</button>
            </div>
            <div style={graphContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...winRecords].reverse()}>
                  <Line type="monotone" dataKey="rate" stroke="#00ffff" strokeWidth={2} dot={{r: 2}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={linkGridStyle}>
            <a href={`https://www.youtube.com/results?search_query=スト6+${selectedChar.name}+対策`} target="_blank" rel="noreferrer" style={linkBtnStyle('#ff0000')}>Youtube</a>
            <a href={playerName ? `https://sfbuff.site/search?q=${encodeURIComponent(playerName)}` : `https://sfbuff.site/`} target="_blank" rel="noreferrer" style={linkBtnStyle('#ff00ff')}>Buff</a>
          </div>
        </div>
        <div style={{textAlign: 'center', fontSize: '12px', color: '#ff4d4d', fontWeight: 'bold'}}>VS {selectedChar.name}</div>

        <div style={tabContainer}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabBtn(activeTab === tab.id)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={editorContainer}>
          <div style={paletteBox}>
            {COMMANDS.map(cmd => <button key={cmd} onClick={() => insertCmd(cmd)} style={cmdBtn}>{cmd}</button>)}
          </div>

          {activeTab === 'myCombo' ? (
            <div style={comboSection}>
              {comboList.map((item, idx) => (
                <div key={idx} style={comboCard}>
                  <div style={comboHeaderRow}>
                    <div style={starRating}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} onClick={() => updateCombo(idx, 'difficulty', star)} style={{ cursor: 'pointer', color: star <= (item.difficulty || 0) ? '#ffcc00' : '#444' }}>★</span>
                      ))}
                    </div>
                  </div>
                  <div style={hitTypeWrapper}>
                    {HIT_TYPES.map(ht => (
                      <button key={ht} onClick={() => updateCombo(idx, 'hitType', ht)} style={hitTypeBtn(item.hitType === ht)}>{ht}</button>
                    ))}
                  </div>
                  <input style={videoUrlInput} placeholder="YouTube URL" value={item.videoUrl || ''} onChange={e => updateCombo(idx, 'videoUrl', e.target.value)} />
                  {getYTThumb(item.videoUrl) && (
                    <a href={item.videoUrl} target="_blank" rel="noreferrer" style={thumbLink}>
                      <img src={getYTThumb(item.videoUrl)} alt="" style={thumbImg} />
                      <div style={playOverlay}>▶ 視聴</div>
                    </a>
                  )}
                  <input style={startMoveInput} placeholder="始動技" value={item.start || ''} onFocus={() => setFocusField({type: 'combo', index: idx, field: 'start'})} onChange={e => updateCombo(idx, 'start', e.target.value)} />
                  <textarea style={comboTextArea} placeholder="内容..." value={item.content || ''} onFocus={() => setFocusField({type: 'combo', index: idx, field: 'content'})} onChange={e => updateCombo(idx, 'content', e.target.value)} />
                  <input style={setupInput} placeholder="セットプレイ" value={item.setup || ''} onFocus={() => setFocusField({type: 'combo', index: idx, field: 'setup'})} onChange={e => updateCombo(idx, 'setup', e.target.value)} />
                </div>
              ))}
            </div>
          ) : activeTab === 'badHabits' ? (
            <div style={habitFlex}>
              <div style={alertBox('#ff4d4d')}><label>🚫 悪癖</label>
                <textarea style={noBorderStyleArea} value={currentCharData.badHabits || ''} onChange={e => update('badHabits', e.target.value)} />
              </div>
              <div style={alertBox('#2ecc71')}><label>💡 矯正</label>
                <textarea style={noBorderStyleArea} value={currentCharData.correction || ''} onChange={e => update('correction', e.target.value)} />
              </div>
            </div>
          ) : (
            <textarea style={mainArea} value={currentCharData[activeTab] || ''} onChange={e => update(activeTab, e.target.value)} onFocus={() => setFocusField({type: 'main'})} placeholder="メモを入力..." />
          )}
        </div>
      </main>
    </div>
  );
}

// スタイル
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#050505', color: '#fff', overflow: 'hidden', position: 'relative' };
const charBgOverlay = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: 0.15, zIndex: 0, pointerEvents: 'none' };
const myCharHeader = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111', padding: '10px', zIndex: 10 };
const headerLeft = { display: 'flex', alignItems: 'center', gap: '5px' };
const nameInputStyle = { width: '80px', background: '#000', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontSize: '10px', padding: '2px 5px' };
const headerBtnGroup = { display: 'flex', gap: '5px' };
const aiPromptBtn = { background: 'linear-gradient(to right, #6a11cb, #2575fc)', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '10px' };
const globalBackupBtn = { background: '#222', color: '#0ff', border: '1px solid #0ff', padding: '5px', borderRadius: '4px', fontSize: '10px' };
const importBtn = { background: '#222', color: '#fc0', border: '1px solid #fc0', padding: '5px', borderRadius: '4px', fontSize: '10px' };
const myCharSelect = { background: '#000', color: '#0ff', border: '1px solid #0ff', borderRadius: '4px', fontSize: '10px' };
const vsLabel = { color: '#f44', fontWeight: 'bold' };
const charNavContainer = { display: 'flex', overflowX: 'auto', padding: '10px 5px', gap: '12px', background: '#000', zIndex: 10, borderBottom: '1px solid #222' };
const charTabStyle = (active) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: active ? 1 : 0.4, cursor: 'pointer', minWidth: '45px' });
const iconWrapperStyle = (active) => ({ width: '40px', height: '40px', borderRadius: '5px', overflow: 'hidden', border: active ? '2px solid #0ff' : '1px solid #444' });
const iconImgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const mainWrapper = { flex: 1, padding: '10px', overflowY: 'auto', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '10px' };
const statusRowStyle = { display: 'flex', gap: '10px', background: 'rgba(17,17,17,0.8)', padding: '10px', borderRadius: '8px' };
const winSectionLeft = { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' };
const winInputRow = { display: 'flex', gap: '5px' };
const winInput = { width: '40px', background: '#000', color: '#0f0', border: '1px solid #444' };
const saveBtn = { background: '#0ff', border: 'none', borderRadius: '3px', fontSize: '10px', padding: '0 5px' };
const graphContainer = { height: '30px' };
const linkGridStyle = { display: 'flex', flexDirection: 'column', gap: '5px', justifyContent: 'center' };
const linkBtnStyle = (color) => ({ color, border: `1px solid ${color}`, padding: '4px 8px', borderRadius: '4px', fontSize: '10px', textDecoration: 'none', textAlign: 'center' });
const tabContainer = { display: 'flex', gap: '2px' };
const tabBtn = (active) => ({ flex: 1, padding: '10px 0', background: active ? '#222' : '#000', color: active ? '#0ff' : '#666', border: '1px solid #333', fontSize: '10px' });
const editorContainer = { display: 'flex', flexDirection: 'column', gap: '10px' };
const paletteBox = { display: 'flex', flexWrap: 'wrap', gap: '5px', background: '#111', padding: '10px', borderRadius: '8px' };
const cmdBtn = { background: '#333', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px' };
const mainArea = { minHeight: '200px', background: 'rgba(0,0,0,0.6)', color: '#eee', padding: '10px', borderRadius: '8px', border: '1px solid #333' };
const comboSection = { display: 'flex', flexDirection: 'column', gap: '10px' };
const comboCard = { background: 'rgba(17,17,17,0.8)', padding: '10px', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '8px' };
const comboHeaderRow = { display: 'flex', justifyContent: 'space-between' };
const starRating = { display: 'flex', gap: '2px' };
const hitTypeWrapper = { display: 'flex', gap: '5px' };
const hitTypeBtn = (active) => ({ background: active ? '#f44' : '#222', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '10px' });
const videoUrlInput = { background: '#000', border: '1px solid #333', color: '#fff', padding: '5px', fontSize: '10px' };
const thumbLink = { position: 'relative', height: '80px', display: 'block', borderRadius: '4px', overflow: 'hidden' };
const thumbImg = { width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 };
const playOverlay = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,0,0,0.8)', padding: '5px 10px', borderRadius: '10px', fontSize: '10px' };
const startMoveInput = { background: '#000', color: '#fff', border: '1px solid #444', padding: '5px' };
const comboTextArea = { background: '#000', color: '#ccc', border: '1px solid #333', padding: '5px' };
const setupInput = { background: '#000', color: '#0ff', border: '1px solid #333', padding: '5px', fontSize: '12px' };
const habitFlex = { display: 'flex', flexDirection: 'column', gap: '10px' };
const alertBox = (color) => ({ border: `1px solid ${color}`, padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)' });
const noBorderStyleArea = { width: '100%', height: '60px', background: 'transparent', border: 'none', color: '#eee', outline: 'none' };
