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

// タブ構成を整理：要約+分析 = 「対策」
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
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState('strategy');
  const [newWinRate, setNewWinRate] = useState('');
  const [focusField, setFocusField] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'apple-touch-icon'; link.href = OFFICIAL_ICON_URL;
    document.getElementsByTagName('head')[0].appendChild(link);
    const favicon = document.createElement('link');
    favicon.rel = 'icon'; favicon.href = OFFICIAL_ICON_URL;
    document.getElementsByTagName('head')[0].appendChild(favicon);

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
      specificInstruction = `
【最優先：コンボ抽出】
動画内の${myChar.name}のコンボを全て抽出し、以下の形式で出力してください：
・ヒット状況: (通常/パニカン/カウンター/持続/空中 から選択)
・始動技: (例: 2MK)
・内容: (例: 2MK > 236MK > 623HP)
・セットプレイ: (起き攻めやその後の状況を簡潔に)`;
    } else {
      // 対策タブ（strategy）およびその他でのAI指示
      specificInstruction = `
【最優先：${selectedChar.name}対策の抽出】
この動画から、対${selectedChar.name}における${myChar.name}の立ち回り対策を抽出してください。
・立ち回りの重要ポイント（要約）
・主要な技への対処法や反撃ポイント
これらをアプリの「対策」欄にそのまま貼れるよう、簡潔な箇条書きでまとめてください。`;
    }

    const prompt = `あなたはSF6の高度なコーチです。自キャラ:${myChar.name}、敵キャラ:${selectedChar.name}。${specificInstruction}\n※前置き不要、内容のみ出力してください。`.trim();
    navigator.clipboard.writeText(prompt).then(() => alert(`${activeTab === 'myCombo' ? 'コンボ' : '対策'}用のAI指示をコピーしました！`));
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
    if (lastCombo.start || lastCombo.content || lastCombo.setup || lastCombo.videoUrl) {
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
      } catch (e) { alert("無効な形式です。"); }
    }
  };

  const currentCharData = data[selectedChar.id] || {};
  const winRecords = currentCharData.winRateRecords || [];
  const comboList = (data.charCombos && data.charCombos[myChar.id]) || [{start:'', content:'', setup:'', difficulty: 3, successRate: '', videoUrl: '', hitType: '通常'}];

  return (
    <div style={containerStyle} className="notranslate" translate="no">
      <div style={{...charBgOverlay, backgroundImage: `url(/${selectedChar.id}.png)`}} />

      <header style={myCharHeader}>
        <div style={headerLeft}>
          <div style={myCharLabel}>PLAYER:</div>
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
        <div style={vsLabel}>VS {selectedChar.name}</div>
      </header>

      <div style={charNavContainer}>
        {CHARACTERS.map(c => (
          <div key={c.id} onClick={() => setSelectedChar(c)} style={charTabStyle(selectedChar.id === c.id)}>
            <div style={iconWrapperStyle(selectedChar.id === c.id)}>
              <img src={`/${c.id}.png`} alt="" style={iconImgStyle} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#222;color:#00ffff;font-size:20px;">${c.name[0]}</div>`; }} />
            </div>
            <span style={charNameStyle(selectedChar.id === c.id)}>{c.name}</span>
          </div>
        ))}
      </div>

      <main style={mainWrapper}>
        <div style={statusRowStyle}>
          <div style={winSectionLeft}>
            <div style={winInputRow}>
              <input style={winInput} value={newWinRate} onChange={e => setNewWinRate(e.target.value)} placeholder="%" type="number" />
              <button onClick={() => {
                if (!newWinRate || isNaN(newWinRate)) return;
                const currentRecords = currentCharData.winRateRecords || [];
                const newRecord = { id: Date.now(), date: new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }), rate: parseFloat(newWinRate) };
                update('winRateRecords', [newRecord, ...currentRecords].slice(0, 10));
                setNewWinRate('');
              }} style={saveBtn}>記録</button>
            </div>
            <div style={graphContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...winRecords].reverse()}>
                  <Line type="monotone" dataKey="rate" stroke="#00ffff" strokeWidth={2} dot={{r: 2, fill: '#00ffff'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={winHistoryList}>
            {winRecords.length > 0 ? winRecords.map(r => (
              <div key={r.id} style={historyItem}><span style={historyDate}>{r.date}</span><span style={historyRate}>{r.rate}%</span></div>
            )) : <div style={noData}>データなし</div>}
          </div>
          <div style={linkGridStyle}>
            <a href={`https://www.youtube.com/results?search_query=スト6+${selectedChar.name}+対策`} target="_blank" rel="noreferrer" style={linkBtnStyle('#ff0000')}>Youtube</a>
            <a href="https://sfbuff.site/fighters/1386489874/matchup_chart" target="_blank" rel="noreferrer" style={linkBtnStyle('#ff00ff')}>Buff</a>
          </div>
        </div>

        <div style={tabContainer}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabBtn(activeTab === tab.id)}>
              {tab.icon}<br/>{tab.label}
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
                    <div style={comboHeader}>{myChar.name} COMBO {idx + 1}</div>
                    <div style={comboStats}>
                      <div style={starRating}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} onClick={() => updateCombo(idx, 'difficulty', star)} style={{ cursor: 'pointer', color: star <= (item.difficulty || 0) ? '#ffcc00' : '#444', fontSize: '14px' }}>★</span>
                        ))}
                      </div>
                      <div style={rateInputWrapper}>
                        <input style={rateInput} type="number" value={item.successRate || ''} onChange={e => updateCombo(idx, 'successRate', e.target.value)} />
                        <span style={{fontSize: '9px', color: '#0f0'}}>%</span>
                      </div>
                    </div>
                  </div>
                  <div style={hitTypeWrapper}>
                    {HIT_TYPES.map(ht => (
                      <button key={ht} onClick={() => updateCombo(idx, 'hitType', ht)} style={hitTypeBtn(item.hitType === ht)}>{ht}</button>
                    ))}
                  </div>
                  <div style={videoSection}>
                    {getYTThumb(item.videoUrl) ? (
                      <a href={item.videoUrl} target="_blank" rel="noreferrer" style={thumbLink}>
                        <img src={getYTThumb(item.videoUrl)} alt="" style={thumbImg} />
                        <div style={playOverlay}>▶︎ 視聴</div>
                      </a>
                    ) : (
                      <input style={videoUrlInput} placeholder="YouTube URL貼り付け" value={item.videoUrl || ''} onChange={e => updateCombo(idx, 'videoUrl', e.target.value)} />
                    )}
                  </div>
                  <input style={startMoveInput} placeholder="始動技" value={item.start || ''} onFocus={() => setFocusField({type: 'combo', index: idx, field: 'start'})} onChange={e => updateCombo(idx, 'start', e.target.value)} />
                  <textarea style={comboTextArea} placeholder="内容..." value={item.content || ''} onFocus={() => setFocusField({type: 'combo', index: idx, field: 'content'})} onChange={e => updateCombo(idx, 'content', e.target.value)} />
                  <div style={setupBox}>
                    <label style={setupLabel}>⚡️ セットプレイ</label>
                    <input style={setupInput} value={item.setup || ''} onFocus={() => setFocusField({type: 'combo', index: idx, field: 'setup'})} onChange={e => updateCombo(idx, 'setup', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'badHabits' ? (
            <div style={habitFlex}>
              <div style={alertBox('#e74c3c')}><label style={alertLabel('#ff4d4d')}>🚫 悪癖 (NG)</label>
                <textarea style={noBorderStyleArea} value={currentCharData.badHabits || ''} onChange={e => update('badHabits', e.target.value)} />
              </div>
              <div style={alertBox('#2ecc71')}><label style={alertLabel('#2ecc71')}>💡 矯正 (代用)</label>
                <textarea style={noBorderStyleArea} value={currentCharData.correction || ''} onChange={e => update('correction', e.target.value)} />
              </div>
            </div>
          ) : (
            <textarea style={mainArea} value={currentCharData[activeTab] || ''} onChange={e => update(activeTab, e.target.value)} onFocus={() => setFocusField({type: 'main'})} placeholder={`${activeTab === 'strategy' ? '対策のポイントを入力...' : activeTab + 'の内容を入力...'}`} />
          )}
        </div>
      </main>
    </div>
  );
}

// --- スタイル定義 (統合と背景濃度調整済み) ---
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#050505', color: '#fff', overflow: 'hidden', position: 'relative' };
const charBgOverlay = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '130%', height: '90%', backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: 0.25, zIndex: 0, pointerEvents: 'none' };
const myCharHeader = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111', padding: '8px 12px', borderBottom: '1px solid #333', zIndex: 20 };
const headerLeft = { display: 'flex', alignItems: 'center', gap: '5px' };
const headerBtnGroup = { display: 'flex', gap: '5px' };
const aiPromptBtn = { background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '9px', padding: '4px 8px', fontWeight: 'bold' };
const globalBackupBtn = { background: '#222', color: '#00ffff', border: '1px solid #00ffff', borderRadius: '4px', fontSize: '9px', padding: '4px 6px' };
const importBtn = { background: '#222', color: '#ffcc00', border: '1px solid #ffcc00', borderRadius: '4px', fontSize: '9px', padding: '4px 6px' };
const myCharLabel = { fontSize: '9px', color: '#888' };
const myCharSelect = { background: '#000', color: '#00ffff', border: '1px solid #00ffff', borderRadius: '4px', fontSize: '11px', padding: '2px' };
const vsLabel = { fontSize: '12px', color: '#ff4d4d', fontWeight: 'bold' };
const charNavContainer = { display: 'flex', overflowX: 'auto', background: 'rgba(0,0,0,0.8)', borderBottom: '2px solid #222', padding: '10px', gap: '15px', zIndex: 10 };
const charTabStyle = (active) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '55px', opacity: active ? 1 : 0.3 });
const iconWrapperStyle = (active) => ({ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: active ? '2px solid #00ffff' : '1px solid #444' });
const iconImgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const charNameStyle = (active) => ({ fontSize: '9px', color: active ? '#00ffff' : '#999', marginTop: '4px' });
const mainWrapper = { flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1, overflowY: 'auto' };
const statusRowStyle = { display: 'flex', gap: '8px', background: 'rgba(17,17,17,0.9)', padding: '8px', borderRadius: '10px' };
const winSectionLeft = { display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 };
const winInputRow = { display: 'flex', gap: '5px' };
const winInput = { width: '35px', background: '#000', color: '#0f0', border: '1px solid #444', textAlign: 'center', borderRadius: '4px', fontSize: '12px' };
const saveBtn = { background: '#00ffff', border: 'none', fontSize: '10px', padding: '4px 8px', borderRadius: '4px' };
const graphContainer = { height: '30px', width: '100%' };
const winHistoryList = { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', maxHeight: '60px', background: 'rgba(0,0,0,0.3)', padding: '4px' };
const historyItem = { display: 'flex', justifyContent: 'space-between', fontSize: '9px' };
const historyDate = { color: '#666' };
const historyRate = { color: '#0f0' };
const noData = { fontSize: '8px', color: '#444', textAlign: 'center' };
const linkGridStyle = { display: 'flex', flexDirection: 'column', gap: '4px' };
const linkBtnStyle = (color) => ({ fontSize: '9px', color, border: `1px solid ${color}`, padding: '4px 8px', borderRadius: '4px', textDecoration: 'none', textAlign: 'center' });
const tabContainer = { display: 'flex', gap: '2px' };
const tabBtn = (active) => ({ flex: 1, padding: '8px 0', background: active ? '#222' : '#000', color: active ? '#00ffff' : '#555', border: '1px solid #333', borderRadius: '5px 5px 0 0', fontSize: '10px' });
const editorContainer = { flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' };
const paletteBox = { display: 'flex', flexWrap: 'wrap', gap: '4px', background: '#111', padding: '8px', borderRadius: '8px' };
const cmdBtn = { background: '#333', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' };
const mainArea = { flex: 1, minHeight: '250px', background: 'rgba(17,17,17,0.8)', color: '#eee', border: '1px solid #333', borderRadius: '8px', padding: '12px', fontSize: '15px' };
const comboSection = { display: 'flex', flexDirection: 'column', gap: '12px' };
const comboCard = { background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' };
const comboHeaderRow = { display: 'flex', justifyContent: 'space-between' };
const comboHeader = { fontSize: '9px', color: '#00ffff' };
const comboStats = { display: 'flex', gap: '8px' };
const starRating = { display: 'flex', gap: '2px' };
const rateInputWrapper = { display: 'flex', background: '#000', padding: '0 4px', border: '1px solid #333' };
const rateInput = { width: '20px', background: 'transparent', border: 'none', color: '#0f0', fontSize: '10px', textAlign: 'right' };
const hitTypeWrapper = { display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '2px 0' };
const hitTypeBtn = (active) => ({ background: active ? '#ff4d4d' : '#222', color: active ? '#fff' : '#888', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '10px' });
const videoSection = { display: 'flex', flexDirection: 'column', gap: '4px' };
const videoUrlInput = { background: '#000', border: '1px solid #333', color: '#555', fontSize: '10px', padding: '6px' };
const thumbLink = { position: 'relative', height: '100px', borderRadius: '4px', overflow: 'hidden', display: 'block', background: '#000' };
const thumbImg = { width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 };
const playOverlay = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,0,0,0.7)', color: '#fff', fontSize: '10px', padding: '4px 12px', borderRadius: '12px' };
const startMoveInput = { background: '#000', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' };
const comboTextArea = { background: '#111', border: '1px solid #333', color: '#ccc', padding: '8px', borderRadius: '4px', fontSize: '15px', height: '60px' };
const setupBox = { background: 'rgba(0,255,255,0.05)', padding: '6px', borderRadius: '4px' };
const setupLabel = { fontSize: '9px', color: '#00ffff' };
const setupInput = { background: 'transparent', border: 'none', color: '#fff', width: '100%', fontSize: '12px' };
const habitFlex = { display: 'flex', flexDirection: 'column', gap: '10px' };
const alertBox = (color) => ({ border: `1px solid ${color}`, padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)' });
const alertLabel = (color) => ({ color, fontSize: '11px', fontWeight: 'bold' });
const noBorderStyleArea = { width: '100%', height: '70px', background: 'transparent', border: 'none', color: '#eee', outline: 'none' };
