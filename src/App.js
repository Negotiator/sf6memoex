Import React, { useState, useEffect } from 'react';

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



const STORAGE_KEY = 'sf6_master_data_v10';



export default function App() {

  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);

  const [myChar, setMyChar] = useState(CHARACTERS[0]);

  const [controlType, setControlType] = useState('C');

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

    const formatCmd = (current) => {

      const trimmed = current ? current.trim() : "";

      if (trimmed === "") return cmd;

      const lastPart = trimmed.split(' ').pop() || "";

      if (lastPart.includes("AS") || /^[0-9]+$/.test(lastPart) || cmd === "TC" || lastPart === "OD") {

        return `${trimmed}${cmd}`;

      }

      return `${trimmed} > ${cmd}`;

    };

    if (focusField.type === 'list') {

      const current = data[focusField.listKey]?.[focusField.charId]?.[focusField.index]?.[focusField.field] || '';

      updateList(focusField.listKey, focusField.charId, focusField.index, focusField.field, formatCmd(current), focusField.default);

    } else {

      updateChar(focusField.field, formatCmd(data[selectedChar.id]?.[focusField.field] || ''));

    }

  };



  const copyPrompt = () => {

    let prompt = "";

    const base = `あなたはSF6の高度なコーチです。自キャラ:${myChar.name}(${controlType === 'C' ? 'クラシック' : 'モダン'})。`;

    

    switch(activeTab) {

      case 'strategy':

        prompt = `${base}敵キャラ:${selectedChar.name}。\n【最優先：敵キャラ対策の抽出】\nこの動画から、対敵キャラにおける立ち回り対策を抽出してください。\n\n・立ち回りの重要ポイント（要約）\n・主要な技への対処法や反撃ポイント\n\nこれらをアプリの「対策」欄に貼れるよう、簡潔な箇条書きでまとめてください。\n※前置き不要、内容のみ出力してください。`;

        break;

      case 'myCombo':

        prompt = `${base}\n【最優先：実戦コンボの抽出】\nこの動画から実戦で使えるコンボを抽出してください。\n\n・形式：[始動技] ➔ [レシピ]\n・レシピ内は「 > 」で繋ぎ、DR, PC, OD, SA1~3などの略称を使用してください。\n\nそのままアプリに貼れるよう、余計な解説を省いて出力してください。`;

        break;

      case 'setplay':

        prompt = `${base}\n【最優先：セットプレイ・連携の抽出】\nこの動画から強力な起き攻めや連携を抽出してください。\n\n・形式：[締めパーツ] 有利F：[数字]F ➔ [連携内容]\n\n簡潔に内容のみ出力してください。`;

        break;

      case 'badHabits':

        prompt = `あなたはSF6の高度なコーチです。初心者〜中級者がやりがちな「負け筋」を分析します。\n【最優先：NG行動と改善策の抽出】\nこの動画（または一般的な${myChar.name}の負けパターン）から、改善すべき行動を抽出してください。\n\n・NG行動: [やってはいけない事]\n・改善法: [どうすべきか]\n\n各項目1行で、箇条書きで出力してください。`;

        break;

      default:

        prompt = `${base}動画の内容を要約してください。`;

    }

    navigator.clipboard.writeText(prompt).then(() => alert("タブ専用プロンプトをコピーしました！"));

  };



  const getYTLink = () => {

    let query = `スト6 ${selectedChar.name} 対策`;

    if (activeTab === 'myCombo') query = `スト6 ${myChar.name} コンボ ${controlType === 'C' ? 'クラシック' : 'モダン'}`;

    if (activeTab === 'setplay') query = `スト6 ${myChar.name} セットプレイ 連携`;

    if (activeTab === 'badHabits') query = `スト6 勝ち方 NG行動 意識`;

    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  };



  const currentCharData = data[selectedChar.id] || {};

  const comboList = data.charCombos?.[myChar.id] || [{start:'', content:'', hitType:'通常', location:'中央', difficulty:1, successRate:100, dmg:'', plusF:''}];

  const setplayList = data.charSetplays?.[myChar.id] || [{finisher:'', location:'中央', plusF:'', setup:'', note:''}];

  const habitsList = data.badHabits || [{ng:'', solution:''}];

  const trainingList = comboList.filter(c => c.content && (parseInt(c.successRate) || 0) < 80);



  return (

    <div style={containerStyle}>

      <header style={headerStyle}>

        <div style={{display:'flex', gap:'5px', alignItems:'center'}}>

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

        <div style={{display:'flex', gap:'4px'}}>

          <button onClick={() => navigator.clipboard.writeText(JSON.stringify(data)).then(() => alert("コピー"))} style={backupBtnStyle}>💾</button>

          <button onClick={() => { const i = prompt("復元データを貼り付け"); if(i){ try{ JSON.parse(i); localStorage.setItem(STORAGE_KEY, i); window.location.reload(); }catch(e){alert("ERROR")}} }} style={restoreBtnStyle}>📥</button>

        </div>

      </header>



      <div style={charNavStyle}>

        {CHARACTERS.map(c => (

          <div key={c.id} onClick={() => setSelectedChar(c)} style={{...charItemStyle, opacity: selectedChar.id === c.id ? 1 : 0.4}}>

            <div style={{...iconBox, border: selectedChar.id === c.id ? '2px solid #0ff' : '1px solid #444'}}>

              <img src={`/${c.id}.png`} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML=c.name[0] }} />

            </div>

            <div style={{fontSize:'8px', color: selectedChar.id === c.id ? '#0ff' : '#888'}}>{c.name}</div>

          </div>

        ))}

      </div>



      <main style={{flex:1, padding:'10px', overflowY:'auto'}}>

        {activeTab !== 'battle' && (

          <div style={winRowStyle}>

            <div style={{flex:1}}>

              <div style={{display:'flex', gap:'5px'}}>

                <input style={winInput} value={newWinRate} onChange={e => setNewWinRate(e.target.value)} placeholder="%" type="number" />

                <button onClick={() => { if(!newWinRate) return; updateChar('winRateRecords', [{ id: Date.now(), rate: parseFloat(newWinRate) }, ...(currentCharData.winRateRecords || [])].slice(0, 10)); setNewWinRate(''); }} style={saveBtnStyle}>記録</button>

              </div>

              <div style={{height:'35px', marginTop:'5px'}}><ResponsiveContainer width="100%" height="100%"><LineChart data={[...(currentCharData.winRateRecords || [])].reverse()}><Line type="monotone" dataKey="rate" stroke="#0ff" dot={{r:2}} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>

            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>

              <div style={{display:'flex', gap:'2px'}}>

                <a href={getYTLink()} target="_blank" rel="noreferrer" style={linkBtn('#f00')}>YouTube</a>

                <button onClick={copyPrompt} style={{...linkBtn('#fc0'), background:'transparent', cursor:'pointer'}}>✨ AIプロンプト</button>

              </div>

              <a href={playerName ? `https://sfbuff.site/fighters/search?q=${playerName}` : "https://sfbuff.site/"} target="_blank" rel="noreferrer" style={linkBtn('#0ff')}>SFBuff</a>

            </div>

          </div>

        )}



        <div style={tabGroupStyle}>

          {TABS.map(t => (

            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{...tabBtnStyle, color: activeTab === t.id ? '#0ff' : '#666', background: activeTab === t.id ? '#222' : '#000'}}>{t.icon} {t.label}</button>

          ))}

        </div>



        {['strategy', 'myCombo', 'setplay'].includes(activeTab) && (

          <div style={paletteStyle}>

            {[...COMMON_CMDS, ...(controlType === 'C' ? CLASSIC_CMDS : MODERN_CMDS), ...SYSTEM_CMDS].map(cmd => (

              <button key={cmd} onClick={() => insertCmd(cmd)} style={cmdBtnStyle}>{cmd}</button>

            ))}

          </div>

        )}



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

            </div>

          ))}</div>

        ) : activeTab === 'setplay' ? (

          <div>{setplayList.map((item, idx) => (

            <div key={idx} style={comboCardStyle}>

              <div style={{display:'flex', gap:'8px', marginBottom:'8px'}}>

                 <div style={{flex:2}}><label style={miniLabel}>締めパーツ</label><input style={comboInput} value={item.finisher || ''} onFocus={() => setFocusField({type:'list', listKey:'charSetplays', charId:myChar.id, index:idx, field:'finisher', default:item})} onChange={e => updateList('charSetplays', myChar.id, idx, 'finisher', e.target.value)} /></div>

                 <div style={{flex:1}}><label style={miniLabel}>有利F</label><input style={{...comboInput, color:'#0f0'}} type="number" value={item.plusF || ''} onChange={e => updateList('charSetplays', myChar.id, idx, 'plusF', e.target.value)} /></div>

              </div>

              <textarea style={{...comboArea, height:'40px'}} placeholder="連携レシピ..." value={item.setup || ''} onFocus={() => setFocusField({type:'list', listKey:'charSetplays', charId:myChar.id, index:idx, field:'setup', default:item})} onChange={e => updateList('charSetplays', myChar.id, idx, 'setup', e.target.value)} />

            </div>

          ))}</div>

        ) : activeTab === 'badHabits' ? (

          <div>{habitsList.map((item, idx) => (

            <div key={idx} style={{...comboCardStyle, borderLeft:'4px solid #f44'}}>

              <div><label style={{...miniLabel, color:'#f44'}}>NG行動</label><input style={comboInput} value={item.ng || ''} onChange={e => {

                const newList = [...habitsList]; newList[idx].ng = e.target.value; 

                if(newList[newList.length-1].ng) newList.push({ng:'', solution:''});

                updateMyData('badHabits', newList);

              }} /></div>

              <div style={{marginTop:'5px'}}><label style={{...miniLabel, color:'#0f0'}}>改善・意識</label><input style={comboInput} value={item.solution || ''} onChange={e => {

                const newList = [...habitsList]; newList[idx].solution = e.target.value;

                updateMyData('badHabits', newList);

              }} /></div>

            </div>

          ))}</div>

        ) : activeTab === 'training' ? (

          <div>

            <div style={sectionTitle}>⚔️ トレモ課題 (成功率80%未満)</div>

            {trainingList.map((item, idx) => (

              <div key={idx} style={trainingCard}>

                <div style={{color:'#fff', fontSize:'12px'}}>{item.start} ➔ {item.content}</div>

                <div style={{color:'#f44', fontSize:'10px'}}>成功率: {item.successRate}%</div>

              </div>

            ))}

            <textarea style={mainTextAreaStyle} value={currentCharData.trainingNote || ''} onChange={e => updateChar('trainingNote', e.target.value)} placeholder="自由な練習メモ..." />

          </div>

        ) : activeTab === 'battle' ? (

          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>

            <div style={battleSection}>

              <div style={battleHeader}>🚫 NG & 改善</div>

              {habitsList.filter(b => b.ng).map((b, i) => (

                <div key={i} style={battleItem}><span style={{color:'#f44'}}>✕ {b.ng}</span> ➔ <span style={{color:'#0f0'}}>{b.solution}</span></div>

              ))}

            </div>

            <div style={battleSection}>

              <div style={battleHeader}>🧠 {selectedChar.name} 対策</div>

              <div style={{whiteSpace:'pre-wrap', fontSize:'12px', color:'#eee'}}>{currentCharData.strategy || '未入力'}</div>

            </div>

            <div style={battleSection}>

              <div style={battleHeader}>⚡ {myChar.name} 連携</div>

              {setplayList.filter(s => s.setup).map((s, i) => (

                <div key={i} style={battleItem}><span style={{color:'#fc0'}}>[+{s.plusF}F]</span> {s.setup}</div>

              ))}

            </div>

          </div>

        ) : (

          <textarea style={mainTextAreaStyle} value={currentCharData[activeTab] || ''} onFocus={() => setFocusField({type:'main', field:activeTab})} onChange={e => updateChar(activeTab, e.target.value)} />

        )}

      </main>

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

const restoreBtnStyle = { background:'#222', color:'#fc0', border:'1px solid #fc0', borderRadius:'4px', padding:'4px' };

const charNavStyle = { display:'flex', overflowX:'auto', padding:'10px', gap:'12px', background:'#000', borderBottom:'1px solid #222' };

const charItemStyle = { display:'flex', flexDirection:'column', alignItems:'center', minWidth:'45px' };

const iconBox = { width:'38px', height:'38px', borderRadius:'4px', overflow:'hidden', border:'1px solid #444', display:'flex', alignItems:'center', justifyContent:'center', background:'#111' };

const winRowStyle = { display:'flex', gap:'10px', background:'#111', padding:'8px', borderRadius:'8px', marginBottom:'10px', alignItems:'center' };

const winInput = { width:'40px', background:'#000', color:'#0f0', border:'1px solid #444', padding:'4px', fontSize:'12px' };

const saveBtnStyle = { background:'#0ff', border:'none', borderRadius:'3px', fontSize:'10px', padding:'2px 8px' };

const linkBtn = (c) => ({ color:c, border:`1px solid ${c}`, padding:'3px 8px', borderRadius:'4px', fontSize:'10px', textDecoration:'none', textAlign:'center', display:'inline-block' });

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

const battleSection = { background:'#111', borderRadius:'8px', padding:'10px', border:'1px solid #222' };

const battleHeader = { fontSize:'11px', fontWeight:'bold', color:'#0ff', marginBottom:'8px', borderBottom:'1px solid #333', paddingBottom:'4px' };

const battleItem = { fontSize:'12px', marginBottom:'6px', borderBottom:'1px dotted #222', paddingBottom:'4px' };

const sectionTitle = { fontSize:'11px', color:'#fc0', marginBottom:'8px', fontWeight:'bold' };

const trainingCard = { background:'#1a1a1a', padding:'8px', borderRadius:'6px', marginBottom:'8px', borderLeft:'3px solid #f44' };

const mainTextAreaStyle = { width:'100%', height:'250px', background:'#000', color:'#eee', padding:'10px', border:'1px solid #333', borderRadius:'8px' };
