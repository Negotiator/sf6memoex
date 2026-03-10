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

const STORAGE_KEY = 'sf6_master_data_v12';
const AUTH_KEY = 'sf6_ai_unlocked_v12';

export default function App() {
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [myChar, setMyChar] = useState(CHARACTERS[0]);
  const [controlType, setControlType] = useState('C');
  const [playerName, setPlayerName] = useState('');
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState('strategy');
  const [newWinRate, setNewWinRate] = useState('');
  const [focusField, setFocusField] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiUnlocked, setIsAiUnlocked] = useState(false);

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
    if (localStorage.getItem(AUTH_KEY) === 'true') {
      setIsAiUnlocked(true);
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
        prompt = `${base}敵キャラ:${selectedChar.name}。\n【最優先：敵キャラ対策の抽出】\nこのテキストから、対敵キャラにおける立ち回り対策を抽出してください。\n\n・立ち回りの重要ポイント（要約）\n・主要な技への対処法や反撃ポイント\n\nこれらをアプリの「対策」欄に貼れるよう、簡潔な箇条書きでまとめてください。\n※前置き不要、内容のみ出力してください。`;
        break;
      case 'myCombo':
        prompt = `${base}\n【最優先：実戦コンボの抽出】\nこのテキストから実戦で使えるコンボを抽出してください。\n\n・形式：[始動技] ➔ [レシピ]\n・レシピ内は「 > 」で繋ぎ、DR, PC, OD, SA1~3などの略称を使用してください。\n\nそのままアプリに貼れるよう、余計な解説を省いて出力してください。`;
        break;
      case 'setplay':
        prompt = `${base}\n【最優先：セットプレイ・連携の抽出】\nこのテキストから強力な起き攻めや連携を抽出してください。\n\n・形式：[締めパーツ] 有利F：[数字]F ➔ [連携内容]\n\n簡潔に内容のみ出力してください。`;
        break;
      case 'badHabits':
        prompt = `あなたはSF6の高度なコーチです。負け筋を分析します。\n【最優先：NG行動と改善策の抽出】\nこのテキストから、改善すべき行動を抽出してください。\n\n・NG行動: [やってはいけない事]\n・改善法: [どうすべきか]\n\n各項目1行で出力してください。`;
        break;
      default:
        prompt = `${base}内容を要約してください。`;
    }
    navigator.clipboard.writeText(prompt).then(() => alert("プロンプトをコピーしました！"));
  };

  const handleAIAnalysis = async () => {
    if (!isAiUnlocked) {
      const pw = prompt("AI機能を解放するにはパスワードを入力してください。");
      if (pw === "sf6master") {
        setIsAiUnlocked(true);
        localStorage.setItem(AUTH_KEY, 'true');
      } else return;
    }

    const apiKey = localStorage.getItem('SF6_MANUAL_API_KEY') || "";
    if (!apiKey) {
      const inputKey = prompt("Gemini APIキーを入力してください");
      if (inputKey) {
          localStorage.setItem('SF6_MANUAL_API_KEY', inputKey);
      } else return;
    }

    const rawText = prompt("動画の字幕やメモを貼り付けてください");
    if (!rawText) return;

    setIsAnalyzing(true);
    try {
      // モデル名を最新の安定版に固定。apiKeyはクエリパラメータで渡す。
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${localStorage.getItem('SF6_MANUAL_API_KEY')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `
            あなたはスト6のコーチです。以下のテキストを解析し、情報を抽出してください。
            返信は必ず以下の純粋なJSON形式のみで行ってください（Markdownの装飾は不要）。
            {
              "strategy": "立ち回りや技対策の箇条書き",
              "combos": [{"start": "始動技", "content": "コンボレシピ", "dmg": "ダメージ数値"}]
            }
            解析対象テキスト:
            ${rawText}` }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        })
      });

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        const parsed = JSON.parse(text);
        
        // 対策を更新 (現在の選択キャラに対して)
        if (parsed.strategy) {
          updateChar('strategy', parsed.strategy);
        }
        
        // コンボを更新 (マイキャラに対して)
        if (parsed.combos && Array.isArray(parsed.combos)) {
          const currentCombos = data.charCombos?.[myChar.id] || [];
          const newCombos = parsed.combos.map(c => ({
            start: c.start || '',
            content: c.content || '',
            dmg: c.dmg || '',
            hitType: '通常',
            location: '中央',
            successRate: 100,
            plusF: ''
          }));
          
          const updatedComboList = [...newCombos, ...currentCombos];
          const newData = { ...data, charCombos: { ...(data.charCombos || {}), [myChar.id]: updatedComboList } };
          setData(newData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        }
        alert("解析が完了しました。");
      } else {
        throw new Error("AIからの応答が空でした。APIキーを確認してください。");
      }
    } catch (e) {
      console.error(e);
      alert("解析エラー: " + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getYTLink = () => {
    let query = `スト6 ${selectedChar.name} 対策`;
    if (activeTab === 'myCombo') query = `スト6 ${myChar.name} コンボ ${controlType === 'C' ? 'クラシック' : 'モダン'}`;
    if (activeTab === 'setplay') query = `スト6 ${myChar.name} セットプレイ 連携`;
    if (activeTab === 'badHabits') query = `スト6 勝ち方 NG行動 意識`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  };

  const currentCharData = data[selectedChar.id] || {};
  const comboList = data.charCombos?.[myChar.id] || [{start:'', content:'', hitType:'通常', location:'中央', successRate:100, dmg:'', plusF:''}];
  const setplayList = data.charSetplays?.[myChar.id] || [{finisher:'', location:'中央', plusF:'', setup:''}];
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
        <div style={{display:'flex', gap:'5px'}}>
          <button onClick={handleAIAnalysis} disabled={isAnalyzing} style={{...aiBtnStyle, opacity: isAnalyzing ? 0.6 : 1}}>{isAnalyzing ? '解析中...' : (isAiUnlocked ? '✨ AI解析' : '🔒 AI解析')}</button>
          <button onClick={() => navigator.clipboard.writeText(JSON.stringify(data)).then(() => alert("コピーしました"))} style={backupBtnStyle}>💾</button>
          <button onClick={() => { const i = prompt("復元データを貼り付け"); if(i){ try{ JSON.parse(i); localStorage.setItem(STORAGE_KEY, i); window.location.reload(); }catch(e){alert("形式が正しくありません")}} }} style={restoreBtnStyle}>📥</button>
        </div>
      </header>

      <div style={charNavStyle}>
        {CHARACTERS.map(c => (
          <div key={c.id} onClick={() => setSelectedChar(c)} style={{...charItemStyle, opacity: selectedChar.id === c.id ? 1 : 0.4}}>
            <div style={{...iconBox, border: selectedChar.id === c.id ? '2px solid #0ff' : '1px solid #444'}}>
              <img src={`/${c.id}.png`} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} 
                   onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML=`<span style="color:#555;font-size:14px">${c.name[0]}</span>`; }} />
            </div>
            <div style={{fontSize:'8px', color: selectedChar.id === c.id ? '#0ff' : '#888', marginTop:'2px'}}>{c.name}</div>
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
                <button onClick={copyPrompt} style={{...linkBtn('#fc0'), background:'transparent', cursor:'pointer'}}>✨ 指示コピー</button>
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
                 <div><label style={miniLabel}>成功%</label><input style={{...comboInput, color: (item.successRate||0) < 80 ? '#f44' : '#0f0'}} type="number" value={item.successRate || 100} onChange={e => updateList('charCombos', myChar.id, idx, 'successRate', e.target.value)} /></div>
                 <div><label style={miniLabel}>DMG</label><input style={comboInput} type="number" value={item.dmg || ''} onChange={e => updateList('charCombos', myChar.id, idx, 'dmg', e.target.value)} /></div>
              </div>
              <div style={{marginTop:'5px'}}><label style={miniLabel}>レシピ</label><textarea style={comboArea} value={item.content || ''} onFocus={() => setFocusField({type:'list', listKey:'charCombos', charId:myChar.id, index:idx, field:'content', default:item})} onChange={e => updateList('charCombos', myChar.id, idx, 'content', e.target.value)} /></div>
            </div>
          ))}</div>
        ) : activeTab === 'training' ? (
          <div>
            <div style={sectionTitle}>🛠️ 課題 (成功率80%未満)</div>
            {trainingList.length === 0 ? <div style={{color:'#666', fontSize:'11px'}}>課題はありません。</div> : 
              trainingList.map((item, idx) => (
                <div key={idx} style={trainingCard}>
                  <div style={{fontSize:'11px', color:'#fff'}}>{item.start || '始動'} ➔ {item.content}</div>
                  <div style={{fontSize:'10px', color:'#f44', marginTop:'3px'}}>成功率: {item.successRate}%</div>
                </div>
              ))
            }
            <textarea style={{...mainTextAreaStyle, height:'100px', marginTop:'15px'}} value={currentCharData.trainingNote || ''} onChange={e => updateChar('trainingNote', e.target.value)} placeholder="メモ..." />
          </div>
        ) : activeTab === 'battle' ? (
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            <div style={battleSection}><div style={battleHeader}>🚫 NG</div>{habitsList.filter(b=>b.ng).map((b,i)=>(<div key={i} style={battleItem}><span style={{color:'#f44'}}>✕ {b.ng}</span> ➔ <span style={{color:'#0f0'}}>{b.solution}</span></div>))}</div>
            <div style={battleSection}><div style={battleHeader}>🧠 {selectedChar.name} 対策</div><div style={{whiteSpace:'pre-wrap', fontSize:'12px', color:'#eee'}}>{currentCharData.strategy || '未入力'}</div></div>
            <div style={battleSection}><div style={battleHeader}>⚡ {myChar.name} 連携</div>{setplayList.filter(s=>s.setup).map((s,i)=>(<div key={i} style={battleItem}><span style={{color:'#fc0'}}>[+{s.plusF}F]</span> {s.setup}</div>))}</div>
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
const nameInputStyle = { width:'50px', background:'#000', color:'#fff', border:'1px solid #444', fontSize:'10px', padding:'3px' };
const selectStyle = { background:'#000', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', fontSize:'10px' };
const controlToggleStyle = { display:'flex', background:'#000', borderRadius:'4px', padding:'1px', border:'1px solid #333' };
const toggleBtn = { border:'none', fontSize:'9px', padding:'2px 6px', borderRadius:'2px', cursor:'pointer' };
const backupBtnStyle = { background:'#222', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', padding:'4px', fontSize:'12px' };
const restoreBtnStyle = { background:'#222', color:'#fc0', border:'1px solid #fc0', borderRadius:'4px', padding:'4px', fontSize:'12px' };
const aiBtnStyle = { background:'#8e44ad', color:'#fff', border:'none', borderRadius:'4px', padding:'4px 8px', fontSize:'10px', fontWeight:'bold' };
const charNavStyle = { display:'flex', overflowX:'auto', padding:'10px', gap:'10px', background:'#000', borderBottom:'1px solid #222' };
const charItemStyle = { display:'flex', flexDirection:'column', alignItems:'center', minWidth:'40px' };
const iconBox = { width:'36px', height:'36px', borderRadius:'4px', overflow:'hidden', border:'1px solid #444', display:'flex', alignItems:'center', justifyContent:'center', background:'#111' };
const winRowStyle = { display:'flex', gap:'10px', background:'#111', padding:'8px', borderRadius:'8px', marginBottom:'10px', alignItems:'center' };
const winInput = { width:'40px', background:'#000', color:'#0f0', border:'1px solid #444', padding:'4px', fontSize:'12px' };
const saveBtnStyle = { background:'#0ff', border:'none', borderRadius:'3px', fontSize:'10px', padding:'2px 8px' };
const linkBtn = (c) => ({ color:c, border:`1px solid ${c}`, padding:'3px 8px', borderRadius:'4px', fontSize:'10px', textDecoration:'none', textAlign:'center', display:'inline-block' });
const tabGroupStyle = { display:'flex', gap:'2px', marginBottom:'10px' };
const tabBtnStyle = { flex:1, padding:'10px 0', border:'1px solid #333', fontSize:'9px' };
const paletteStyle = { display:'flex', flexWrap:'wrap', gap:'3px', background:'#111', padding:'8px', borderRadius:'8px', marginBottom:'10px' };
const cmdBtnStyle = { background:'#333', color:'#fff', border:'none', padding:'6px 8px', borderRadius:'4px', fontSize:'10px' };
const comboCardStyle = { background:'#111', padding:'12px', borderRadius:'8px', marginBottom:'10px', border:'1px solid #333' };
const inputGrid = { display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'8px' };
const comboInput = { width:'100%', background:'#000', color:'#fff', border:'1px solid #444', padding:'5px', fontSize:'11px', borderRadius:'3px' };
const comboArea = { width:'100%', background:'#000', color:'#ccc', border:'1px solid #333', padding:'5px', height:'45px', fontSize:'11px', borderRadius:'3px' };
const miniLabel = { fontSize:'8px', color:'#888', display:'block' };
const miniBtnStyle = { border:'none', color:'#fff', fontSize:'8px', padding:'2px 6px', borderRadius:'3px' };
const battleSection = { background:'#111', borderRadius:'8px', padding:'10px', border:'1px solid #222', marginBottom:'10px' };
const battleHeader = { fontSize:'11px', fontWeight:'bold', color:'#0ff', marginBottom:'8px', borderBottom:'1px solid #333', paddingBottom:'4px' };
const battleItem = { fontSize:'12px', marginBottom:'6px', borderBottom:'1px dotted #222', paddingBottom:'4px' };
const sectionTitle = { fontSize:'11px', color:'#fc0', marginBottom:'8px', fontWeight:'bold' };
const trainingCard = { background:'#1a1a1a', padding:'8px', borderRadius:'6px', marginBottom:'8px', borderLeft:'3px solid #f44' };
const mainTextAreaStyle = { width:'100%', height:'250px', background:'#000', color:'#eee', padding:'10px', border:'1px solid #333', borderRadius:'8px' };

