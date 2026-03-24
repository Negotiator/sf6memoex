import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 定数・マスタデータ (v16から完全維持) ---
const CHARACTERS = [
  { name: 'ALL', id: 'all' },
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
].sort((a, b) => a.id === 'all' ? -1 : b.id === 'all' ? 1 : a.name.localeCompare(b.name, 'ja'));

const NAME_MAP = {
  "ALL": "ALL", "GOUKI": "豪鬼", "AKUMA": "豪鬼", "C.VIPER": "C.ヴァイパー", "C. VIPER": "C.ヴァイパー",
  "E.HONDA": "E.本田", "E. HONDA": "E.本田", "RYU": "リュウ", "LUKE": "ルーク", "JAMIE": "ジェイミー", 
  "CHUN-LI": "春麗", "GUILE": "ガイル", "KIMBERLY": "キンバリー", "JURI": "ジュリ", "KEN": "ケン", 
  "BLANKA": "ブランカ", "DHALSIM": "ダルシム", "DEE JAY": "ディージェイ", "MANON": "マノン", 
  "MARISA": "マリーザ", "JP": "JP", "ZANGIEF": "ザンギエフ", "LILY": "リリー", "CAMMY": "キャミィ", 
  "RASHID": "ラシード", "A.K.I.": "A.K.I.", "ED": "エド", "VEGA": "ベガ", "M. BISON": "ベガ", 
  "TERRY": "テリー", "MAI": "舞", "ELENA": "エレナ", "SAGAT": "サガット", "ALEX": "アレックス", "INGRID": "イングリット"
};

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
  { id: 'replay', label: 'リプレイ', icon: '📹' },
  { id: 'training', label: 'トレモ', icon: '🛠️' },
  { id: 'battle', label: '実戦', icon: '⚔️' },
];

const CHECKLIST_ITEMS = [
  { id: 'anti_air', label: '対空', category: '対空' },
  { id: 'combo', label: 'コンボ精度', category: 'コンボ' },
  { id: 'okizeme', label: '起き攻め', category: '起き攻め' },
  { id: 'birdcage', label: 'トリカゴ', category: '立ち回り' },
  { id: 'burnout', label: 'バーンアウト回避', category: 'ゲージ' },
  { id: 'defense', label: '守り・暴れ', category: '防御' },
];

const STORAGE_KEY = 'sf6_master_data_v17';
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "YOUR_KEY_HERE";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default function App() {
  // --- State (v16完全維持 + 新規State) ---
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [myChar, setMyChar] = useState(CHARACTERS[1]);
  const [controlType, setControlType] = useState('C');
  const [playerName, setPlayerName] = useState('');
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState('strategy');
  const [newWinRate, setNewWinRate] = useState('');
  const [focusField, setFocusField] = useState(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [showReadingTable, setShowReadingTable] = useState(false);
  const [replayCounts, setReplayCounts] = useState({});
  const [battleResult, setBattleResult] = useState('Win');
  
  // 新機能用State
  const [controllerMode, setControllerMode] = useState('Stick');
  const [dirBuffer, setDirBuffer] = useState([]);
  const timerRef = useRef(null);

  // --- 永続化・基本ロジック (v16維持) ---
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

  const saveToStorage = (newData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const updateMyData = (field, value) => saveToStorage({ ...data, [field]: value });
  const updateChar = useCallback((field, value) => {
    const charData = data[selectedChar.id] || {};
    saveToStorage({ ...data, [selectedChar.id]: { ...charData, [field]: value } });
  }, [data, selectedChar]);

  const updateList = useCallback((listKey, charId, index, field, value, defaultItem) => {
    const allLists = { ...(data[listKey] || {}) };
    const myList = [...(allLists[charId] || [defaultItem])];
    myList[index] = { ...myList[index], [field]: value };
    if (myList[myList.length - 1].content || myList[myList.length - 1].start || myList[myList.length - 1].setup) {
      myList.push(defaultItem);
    }
    saveToStorage({ ...data, [listKey]: { ...allLists, [charId]: myList } });
  }, [data]);

  // --- コマンド入力ロジック (レバーレス同時押し対応版) ---
  const insertCmd = useCallback((cmd) => {
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
      updateChar(focusField.field, formatCmd(data[selectedChar.id]?.[focusField.field] || ''));
    }
  }, [focusField, data, selectedChar, updateChar, updateList]);

  const handleDirInput = (num) => {
    setDirBuffer(prev => [...prev, num]);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDirBuffer(current => {
        const unique = Array.from(new Set(current));
        let result = "5";
        if (unique.includes("2") && unique.includes("6")) result = "3";
        else if (unique.includes("2") && unique.includes("4")) result = "1";
        else if (unique.includes("8") && unique.includes("6")) result = "9";
        else if (unique.includes("8") && unique.includes("4")) result = "7";
        else if (unique.length === 1) result = unique[0];
        insertCmd(result);
        return [];
      });
    }, 120);
  };

  // --- AI・分析ロジック (v16から一字一句維持) ---
  const processWinRates = (resJson) => {
    const newData = { ...data };
    Object.entries(resJson).forEach(([rawName, info]) => {
      const normalizedName = NAME_MAP[rawName.toUpperCase()] || rawName;
      const char = CHARACTERS.find(c => c.name === normalizedName);
      const matches = parseInt(info.matches) || 0;
      const rate = parseFloat(info.rate) || 0;
      if (normalizedName === "ALL") {
        newData.globalStats = { matches, rate };
        const allChar = CHARACTERS.find(c => c.id === 'all');
        if (!newData[allChar.id]) newData[allChar.id] = {};
        const records = newData[allChar.id].winRateRecords || [];
        newData[allChar.id].winRateRecords = [{ id: Date.now(), rate, matches }, ...records].slice(0, 10);
      } else if (char) {
        if (!newData[char.id]) newData[char.id] = {};
        const records = newData[char.id].winRateRecords || [];
        newData[char.id].winRateRecords = [{ id: Date.now(), rate, matches }, ...records].slice(0, 10);
      }
    });
    saveToStorage(newData);
    alert("勝率を同期しました。");
  };

  const analyzeWinRateText = async (text) => {
    if (!text) return;
    setIsAiProcessing(true);
    const prompt = `以下の戦績テキストから、キャラ名、試合数、勝率を抽出してJSONのみ出力してください。書式: {"キャラ名": {"matches": 数値, "rate": 数値}} 入力: ${text}`;
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanJson = JSON.parse(responseText.replace(/```json|```/g, "").trim());
      processWinRates(cleanJson);
    } catch (e) { alert("AI解析に失敗しました。"); }
    finally { setIsAiProcessing(false); }
  };

  const generateAdvice = useCallback(async () => {
    setIsAiProcessing(true);
    const context = `自キャラ: ${myChar.name}, 相手: ${selectedChar.name}, メモ: ${data[selectedChar.id]?.strategy || 'なし'}`;
    try {
      const result = await model.generateContent(`${context}。この状況に対する短いアドバイスを一言で。`);
      setAiAdvice(result.response.text());
    } catch (e) { setAiAdvice("データを蓄積しましょう。"); }
    finally { setIsAiProcessing(false); }
  }, [myChar, selectedChar, data]);

  const analyzeBattleTrends = useCallback(async () => {
    setIsAiProcessing(true);
    const logs = data.battleLogs || [];
    const recentLogs = logs.slice(0, 10);
    const prompt = `SF6の戦績データに基づき分析せよ。自キャラ: ${myChar.name}\n最近のログ: ${JSON.stringify(recentLogs)}\nコンボ成功率課題: ${JSON.stringify(data.charCombos?.[myChar.id]?.filter(c => (parseInt(c.successRate)||0) < 80))}\n1.【今日のトレモメニュー】(10分でできる具体的メニュー)\n2.【負け筋特定】(最近の敗北に共通する技術的欠陥)を、プレイヤーのやる気が出るような口調で短くまとめて。`;
    try {
      const result = await model.generateContent(prompt);
      setAiAdvice(result.response.text());
    } catch (e) { setAiAdvice("ログが不足しています。"); }
    finally { setIsAiProcessing(false); }
  }, [myChar, data]);

  const cleanupStrategy = () => {
    const raw = data[selectedChar.id]?.strategy || "";
    if (!raw) return;
    let cleaned = raw.replace(/\[\d+\]/g, "").replace(/[*#]/g, "").split('\n').map(line => line.trim()).filter(line => line.length > 0);
    updateChar('strategy', [...new Set(cleaned)].join('\n'));
    alert("整理完了");
  };

  // --- ショートカットキー (v16維持) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key >= '1' && e.key <= '7') {
        const targetTab = TABS[parseInt(e.key) - 1];
        if (targetTab) setActiveTab(targetTab.id);
      }
      if (e.altKey && e.code === 'KeyA') analyzeBattleTrends();
      if (e.altKey && e.code === 'KeyQ') generateAdvice();
      if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        const currentIndex = CHARACTERS.findIndex(c => c.id === selectedChar.id);
        const nextIndex = e.key === 'ArrowRight' ? (currentIndex + 1) % CHARACTERS.length : (currentIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
        setSelectedChar(CHARACTERS[nextIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChar, activeTab, analyzeBattleTrends, generateAdvice]);

  // --- プロンプトコピー (v16維持) ---
  const copyPrompt = () => {
    let promptText = "";
    const base = `あなたはSF6の高度なコーチです。自キャラ:${myChar.name}(${controlType === 'C' ? 'クラシック' : 'モダン'})。`;
    switch(activeTab) {
      case 'strategy': promptText = `${base}敵キャラ:${selectedChar.name}。\n【最優先：敵キャラ対策の抽出】\nこの動画から対策を抽出してください。簡潔な箇条書きで。`; break;
      case 'myCombo': promptText = `${base}\n【最優先：実戦コンボの抽出】\n[始動技] ➔ [レシピ]形式で抽出してください。`; break;
      case 'setplay': promptText = `${base}\n【最優先：セットプレイ・連携の抽出】\n[締めパーツ] 有利F：[数字]F ➔ [連携内容]形式で抽出してください。`; break;
      case 'badHabits': promptText = `${base}\n【最優先：NG行動と改善策の抽出】\nNG行動: [内容]\n改善法: [内容]形式で抽出してください。`; break;
      case 'training': promptText = `${base}\n【最優先：トレモメニューの抽出】\n基礎練習項目・状況設定トレーニングを抽出してください。`; break;
      default: promptText = `${base}動画の内容を要約してください。`;
    }
    navigator.clipboard.writeText(promptText).then(() => alert("コピーしました！"));
  };

  const getYTLink = () => {
    const queries = { strategy:`スト6 ${selectedChar.name} 対策`, myCombo:`${myChar.name} コンボ`, setplay:`${myChar.name} セットプレイ`, training:`スト6 トレモ おすすめ`, badHabits:`スト6 NG行動 修正`, battle:`${myChar.name} リプレイ`, replay:`${myChar.name} リプレイ` };
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(queries[activeTab] || queries.strategy)}`;
  };

  const handleCounter = (id, type) => {
    const current = replayCounts[id] || { success: 0, fail: 0 };
    setReplayCounts({ ...replayCounts, [id]: { ...current, [type]: current[type] + 1 } });
  };

  const saveBattleLog = () => {
    const log = { id: Date.now(), date: new Date().toLocaleDateString(), opponent: selectedChar.name, result: battleResult, counts: replayCounts };
    saveToStorage({ ...data, battleLogs: [log, ...(data.battleLogs || [])].slice(0, 50) });
    setReplayCounts({});
    alert("ログを保存しました。");
  };

  // --- 仮想コントローラー (新規・画像準拠) ---
  const VirtualController = () => {
    const renderDir = (label, cmd) => <button onClick={() => controllerMode === 'Stick' ? insertCmd(cmd) : handleDirInput(cmd)} style={{...dirBtnStyle, background: dirBuffer.includes(cmd) ? '#0ff' : '#222'}}>{label}</button>;
    const renderAtk = (label, customStyle = {}) => <button onClick={() => insertCmd(label)} style={{...atkBtnStyle, ...customStyle}}>{label}</button>;
    const curAtks = controlType === 'C' ? CLASSIC_CMDS : MODERN_CMDS;

    return (
      <div style={vcWrapper}>
        <div style={vcSelector}>
          {['Stick', 'Leverless', 'Pad'].map(m => (
            <button key={m} onClick={() => setControllerMode(m)} style={{...miniBtnStyle, flex:1, background: controllerMode === m ? '#0ff' : '#222', color: controllerMode === m ? '#000' : '#fff'}}>{m}</button>
          ))}
        </div>
        <div style={vcMainArea}>
          {controllerMode === 'Stick' && (
            <div style={stickContainer}>
              <div style={stickGrid}>{[7,8,9,4,5,6,1,2,3].map(d => renderDir(d.toString(), d.toString()))}</div>
              <div style={atkGrid}>{curAtks.map(atk => renderAtk(atk))}</div>
            </div>
          )}
          {controllerMode === 'Leverless' && (
            <div style={leverlessContainer}>
              <div style={leverlessDirs}>{renderDir('4','4')} {renderDir('2','2')} {renderDir('6','6')}<div style={{marginTop:'10px'}}>{renderDir('8','8')}</div></div>
              <div style={atkGrid}>{curAtks.map(atk => renderAtk(atk))}</div>
            </div>
          )}
          {controllerMode === 'Pad' && (
            <div style={padContainer}>
              <div style={padLeft}><div style={dpadGrid}><div style={{gridArea:'up'}}>{renderDir('▲','8')}</div><div style={{gridArea:'left'}}>{renderDir('◀','4')}</div><div style={{gridArea:'right'}}>{renderDir('▶','6')}</div><div style={{gridArea:'down'}}>{renderDir('▼','2')}</div></div></div>
              <div style={padRight}><div style={padButtonGrid}>{renderAtk(curAtks[2], {gridArea:'top'})}{renderAtk(curAtks[0], {gridArea:'left'})}{renderAtk(curAtks[5], {gridArea:'right'})}{renderAtk(curAtks[3], {gridArea:'bottom'})}{renderAtk(curAtks[1], {gridArea:'m1', width:'38px', height:'38px'})}{renderAtk(curAtks[4], {gridArea:'m2', width:'38px', height:'38px'})}</div></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Render準備 (v16維持) ---
  const currentCharData = data[selectedChar.id] || {};
  const comboList = data.charCombos?.[myChar.id] || [{start:'', content:'', hitType:'通常', location:'中央', successRate:100}];
  const setplayList = data.charSetplays?.[myChar.id] || [{finisher:'', location:'中央', plusF:'', setup:''}];
  const habitsList = data.badHabits || [{ng:'', solution:''}];

  return (
    <div style={containerStyle}>
      {isAiProcessing && <div style={aiOverlay}>AI解析中...</div>}
      {aiAdvice && <div style={adviceStyle} onClick={() => setAiAdvice("")}>💡 分析結果<div style={{marginTop:'5px', fontSize:'10px', whiteSpace:'pre-wrap'}}>{aiAdvice}</div></div>}
      
      {/* --- 固定エリア --- */}
      <div style={fixedTopArea}>
        <header style={headerStyle}>
          <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
            <input style={nameInputStyle} placeholder="ID" value={playerName} onChange={(e) => { setPlayerName(e.target.value); updateMyData('playerName', e.target.value); }} />
            <select value={myChar.id} onChange={(e) => { const char = CHARACTERS.find(c => c.id === e.target.value); setMyChar(char); updateMyData('myCharId', char.id); }} style={selectStyle}>
              {CHARACTERS.map(c => <option key={c.id} value={c.id} disabled={c.id==='all'}>{c.name}</option>)}
            </select>
            <div style={controlToggleStyle}>{['C', 'M'].map(t => (<button key={t} onClick={() => { setControlType(t); updateMyData('controlType', t); }} style={{...toggleBtn, background: controlType === t ? (t === 'C' ? '#0ff' : '#fc0') : '#333', color: controlType === t ? '#000' : '#888'}}>{t}</button>))}</div>
          </div>
          <div style={globalStatsStyle}><div style={statVal}>{data.globalStats?.matches || 0}戦 / {data.globalStats?.rate || 0}%</div></div>
          <div style={{display:'flex', gap:'4px'}}>
            <button onClick={generateAdvice} style={circleBtn}>🎯</button>
            <button onClick={analyzeBattleTrends} style={circleBtn}>📊</button>
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(data)).then(() => alert("コピー"))} style={backupBtnStyle}>💾</button>
          </div>
        </header>

        <div style={charNavStyle}>
          {CHARACTERS.map(c => (
            <div key={c.id} onClick={() => setSelectedChar(c)} style={{...charItemStyle, opacity: selectedChar.id === c.id ? 1 : 0.4}}>
              <div style={{...iconBox, border: selectedChar.id === c.id ? '2px solid #0ff' : '1px solid #444'}}>
                {c.id === 'all' ? <div style={{color: '#f80', fontWeight: 'bold', fontSize: '10px'}}>ALL</div> : <img src={`/${c.id}.png`} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML=c.name[0] }} />}
              </div>
            </div>
          ))}
        </div>

        {(activeTab === 'myCombo' || activeTab === 'setplay') && (
          <div style={inputSupportArea}>
            <div style={paletteStyle}>{[...COMMON_CMDS, ...SYSTEM_CMDS].slice(0,10).map(cmd => (<button key={cmd} onClick={() => insertCmd(cmd)} style={cmdBtnStyle}>{cmd}</button>))}</div>
            <VirtualController />
          </div>
        )}

        <div style={tabGroupStyle}>{TABS.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} style={{...tabBtnStyle, color: activeTab === t.id ? '#0ff' : '#666', borderBottom: activeTab === t.id ? '2px solid #0ff' : 'none'}}>{t.icon} <span className="tab-label">{t.label}</span></button>))}</div>
      </div>

      {/* --- スクロールエリア --- */}
      <main style={scrollableMain}>
        {activeTab === 'strategy' && (
          <div style={{padding:'10px'}}>
             <div style={winRowStyle}>
               <div style={{flex:1}}>
                 <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
                   <input style={winInput} value={newWinRate} onChange={e => setNewWinRate(e.target.value)} placeholder="%" type="number" />
                   <button onClick={() => { if(!newWinRate) return; updateChar('winRateRecords', [{ id: Date.now(), rate: parseFloat(newWinRate) }, ...(currentCharData.winRateRecords || [])].slice(0, 10)); setNewWinRate(''); }} style={saveBtnStyle}>記録</button>
                   <div style={currentWinRateDisplay}>{currentCharData.winRateRecords?.[0]?.rate || '--'}%</div>
                 </div>
                 <div style={{height:'35px', marginTop:'5px'}}><ResponsiveContainer width="100%" height="100%"><LineChart data={[...(currentCharData.winRateRecords || [])].reverse()}><Line type="monotone" dataKey="rate" stroke="#0ff" dot={{r:2}} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
               </div>
               <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                 <a href={getYTLink()} target="_blank" rel="noreferrer" style={linkBtn('#f00')}>YouTube</a>
                 <button onClick={copyPrompt} style={linkBtn('#fc0')}>✨ AIプロンプト</button>
               </div>
             </div>
             <div style={{position:'relative'}}>
               <button onClick={cleanupStrategy} style={cleanBtnStyle}>🧹</button>
               <textarea style={mainTextAreaStyle} value={currentCharData.strategy || ''} onFocus={() => setFocusField({type:'main', field:'strategy'})} onChange={e => updateChar('strategy', e.target.value)} placeholder="対策入力..." />
             </div>
          </div>
        )}

        {activeTab === 'myCombo' && comboList.map((item, idx) => (
          <div key={idx} style={comboCardStyle}>
            <div style={inputGrid}>
              <input style={comboInput} placeholder="始動" value={item.start || ''} onFocus={() => setFocusField({type:'list', listKey:'charCombos', charId:myChar.id, index:idx, field:'start', default:item})} onChange={e => updateList('charCombos', myChar.id, idx, 'start', e.target.value)} />
              <input style={comboInput} placeholder="DMG" type="number" value={item.dmg || ''} onChange={e => updateList('charCombos', myChar.id, idx, 'dmg', e.target.value)} />
              <input style={comboInput} placeholder="有利" type="number" value={item.plusF || ''} onChange={e => updateList('charCombos', myChar.id, idx, 'plusF', e.target.value)} />
            </div>
            <textarea style={comboArea} placeholder="レシピ" value={item.content || ''} onFocus={() => setFocusField({type:'list', listKey:'charCombos', charId:myChar.id, index:idx, field:'content', default:item})} onChange={e => updateList('charCombos', myChar.id, idx, 'content', e.target.value)} />
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'5px'}}>
               <div style={{display:'flex', gap:'3px'}}>{HIT_TYPES.map(ht => <button key={ht} onClick={() => updateList('charCombos', myChar.id, idx, 'hitType', ht, item)} style={{...miniBtnStyle, background: item.hitType === ht ? '#f44' : '#333'}}>{ht}</button>)}</div>
               <input type="range" min="0" max="100" value={item.successRate || 100} onChange={e => updateList('charCombos', myChar.id, idx, 'successRate', e.target.value)} />
            </div>
          </div>
        ))}

        {activeTab === 'setplay' && setplayList.map((item, idx) => (
          <div key={idx} style={comboCardStyle}>
            <div style={{display:'flex', gap:'5px', marginBottom:'5px'}}>
              <input style={{...comboInput, flex:2}} placeholder="締め技" value={item.finisher || ''} onFocus={() => setFocusField({type:'list', listKey:'charSetplays', charId:myChar.id, index:idx, field:'finisher', default:item})} onChange={e => updateList('charSetplays', myChar.id, idx, 'finisher', e.target.value)} />
              <input style={{...comboInput, flex:1}} placeholder="F" type="number" value={item.plusF || ''} onChange={e => updateList('charSetplays', myChar.id, idx, 'plusF', e.target.value)} />
            </div>
            <textarea style={comboArea} placeholder="連携内容" value={item.setup || ''} onFocus={() => setFocusField({type:'list', listKey:'charSetplays', charId:myChar.id, index:idx, field:'setup', default:item})} onChange={e => updateList('charSetplays', myChar.id, idx, 'setup', e.target.value)} />
          </div>
        ))}

        {activeTab === 'badHabits' && habitsList.map((item, idx) => (
          <div key={idx} style={{...comboCardStyle, borderLeft:'4px solid #f44'}}>
            <input style={comboInput} placeholder="NG行動" value={item.ng || ''} onChange={e => { const nl = [...habitsList]; nl[idx].ng = e.target.value; if(nl[nl.length-1].ng) nl.push({ng:'', solution:''}); updateMyData('badHabits', nl); }} />
            <input style={{...comboInput, marginTop:'5px', color:'#0f0'}} placeholder="改善策" value={item.solution || ''} onChange={e => { const nl = [...habitsList]; nl[idx].solution = e.target.value; updateMyData('badHabits', nl); }} />
          </div>
        ))}

        {activeTab === 'replay' && (
          <div style={{padding:'10px'}}>
             <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>{['Win', 'Lose'].map(r => (<button key={r} onClick={() => setBattleResult(r)} style={{...miniBtnStyle, flex:1, padding:'10px', background: battleResult === r ? (r === 'Win' ? '#0f0' : '#f00') : '#333'}}>{r}</button>))}</div>
             {CHECKLIST_ITEMS.map(item => (
               <div key={item.id} style={checkItem}>
                 <span style={{fontSize:'12px'}}>{item.label}</span>
                 <div style={{display:'flex', gap:'5px'}}>
                   <button onClick={() => handleCounter(item.id, 'success')} style={counterBtn}>○ {(replayCounts[item.id]?.success || 0)}</button>
                   <button onClick={() => handleCounter(item.id, 'fail')} style={counterBtn}>× {(replayCounts[item.id]?.fail || 0)}</button>
                 </div>
               </div>
             ))}
             <button onClick={saveBattleLog} style={saveLogBtn}>対戦ログを保存</button>
          </div>
        )}

        {activeTab === 'training' && (
          <div style={{padding:'10px'}}>
            <button onClick={() => analyzeWinRateText(prompt("戦績テキストを貼り付け"))} style={aiExecBtn}>📋 公式サイトから勝率同期</button>
            <div style={trainingCard}><div style={{fontSize:'11px', whiteSpace:'pre-wrap'}}>{aiAdvice || "📊ボタンで分析開始"}</div></div>
            <textarea style={mainTextAreaStyle} value={currentCharData.trainingNote || ''} onChange={e => updateChar('trainingNote', e.target.value)} placeholder="練習メモ..." />
          </div>
        )}

        {activeTab === 'battle' && (
          <div style={{padding:'10px'}}>
            <button onClick={() => setShowReadingTable(!showReadingTable)} style={aiExecBtn}>{showReadingTable ? '読み合い表を隠す' : '読み合い表を表示'}</button>
            {showReadingTable && (
              <table style={readingTableStyle}>
                <thead><tr><th style={thStyle}>防\攻</th><th style={thStyle}>打撃</th><th style={thStyle}>投げ</th><th style={thStyle}>ガード</th><th style={thStyle}>シミ</th></tr></thead>
                <tbody>
                  <tr><td style={tdStyle}>ガード</td><td>○</td><td>×</td><td>○</td><td>○</td></tr>
                  <tr><td style={tdStyle}>暴れ</td><td>×</td><td>×</td><td>○</td><td style={{color:'#0ff'}}>◎</td></tr>
                  <tr><td style={tdStyle}>遅グラ</td><td>○</td><td>○</td><td>○</td><td style={{color:'#f44'}}>×</td></tr>
                </tbody>
              </table>
            )}
            <div style={battleSection}>
              <div style={battleHeader}>現在の課題</div>
              {habitsList.filter(h => h.ng).map((h, i) => (<div key={i} style={battleItem}>✕ {h.ng} ➔ {h.solution}</div>))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- スタイル定義 (v16維持 + 新機能用最適化) ---
const containerStyle = { display:'flex', flexDirection:'column', height:'100vh', background:'#050505', color:'#fff', overflow:'hidden' };
const fixedTopArea = { flexShrink: 0, background:'#000', borderBottom:'1px solid #333', zIndex:100 };
const scrollableMain = { flex: 1, overflowY: 'auto', paddingBottom:'80px' };
const headerStyle = { display:'flex', justifyContent:'space-between', padding:'8px', background:'#111', alignItems:'center' };
const charNavStyle = { display:'flex', overflowX:'auto', padding:'5px', gap:'8px', borderBottom:'1px solid #222' };
const iconBox = { width:'32px', height:'32px', borderRadius:'4px', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:'#111' };
const inputSupportArea = { padding:'8px', background:'#0a0a0a', borderBottom:'1px solid #222' };
const paletteStyle = { display:'flex', flexWrap:'wrap', gap:'4px', marginBottom:'8px' };
const cmdBtnStyle = { background:'#222', color:'#fff', border:'1px solid #444', padding:'4px 8px', borderRadius:'4px', fontSize:'10px' };
const vcWrapper = { width:'100%' };
const vcSelector = { display:'flex', gap:'2px', marginBottom:'5px' };
const vcMainArea = { background:'#151515', padding:'10px', borderRadius:'8px' };
const stickContainer = { display:'flex', justifyContent:'space-around', alignItems:'center' };
const stickGrid = { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'4px' };
const atkGrid = { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'5px' };
const leverlessContainer = { display:'flex', justifyContent:'space-around' };
const leverlessDirs = { textAlign:'center' };
const padContainer = { display:'flex', justifyContent:'space-between', alignItems:'center' };
const padLeft = { flex: 1, display:'flex', justifyContent:'center' };
const dpadGrid = { display:'grid', gridTemplateAreas:'". up ." "left . right" ". down ."', gap:'8px' };
const padRight = { flex: 1.5, display:'flex', justifyContent:'center' };
const padButtonGrid = { display:'grid', gridTemplateAreas:'". top ." "left . right" ". bottom ." ". m1 m2"', gap:'6px' };
const dirBtnStyle = { width:'32px', height:'32px', border:'none', borderRadius:'50%', color:'#fff', fontSize:'10px' };
const atkBtnStyle = { width:'36px', height:'36px', border:'1px solid #444', borderRadius:'50%', color:'#0ff', background:'#222', fontSize:'9px' };
const miniBtnStyle = { border:'none', fontSize:'10px', padding:'5px', borderRadius:'4px' };
const tabGroupStyle = { display:'flex', background:'#000' };
const tabBtnStyle = { flex:1, padding:'12px 0', border:'none', background:'transparent', fontSize:'12px', color:'#555' };
const comboCardStyle = { background:'#111', padding:'10px', margin:'8px', borderRadius:'6px', border:'1px solid #222' };
const inputGrid = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'5px', marginBottom:'5px' };
const comboInput = { width:'100%', background:'#000', color:'#fff', border:'1px solid #444', padding:'6px', fontSize:'12px' };
const comboArea = { width:'100%', height:'45px', background:'#000', color:'#ccc', border:'1px solid #333', padding:'6px', fontSize:'12px' };
const mainTextAreaStyle = { width:'100%', height:'200px', background:'#000', color:'#eee', padding:'10px', border:'none' };
const adviceStyle = { position:'fixed', bottom:'20px', left:'10px', right:'10px', background:'#022', border:'1px solid #0ff', padding:'10px', borderRadius:'8px', zIndex:1000 };
const aiOverlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', color:'#0ff' };
const winRowStyle = { display:'flex', gap:'10px', background:'#111', padding:'8px', borderRadius:'8px', marginBottom:'10px' };
const linkBtn = (c) => ({ color:c, border:`1px solid ${c}`, padding:'4px 8px', borderRadius:'4px', fontSize:'10px', textDecoration:'none', textAlign:'center' });
const checkItem = { display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #222' };
const counterBtn = { background:'#222', border:'1px solid #444', color:'#fff', padding:'4px 10px', borderRadius:'4px' };
const saveLogBtn = { width:'100%', marginTop:'10px', background:'#0ff', color:'#000', border:'none', padding:'10px', borderRadius:'4px', fontWeight:'bold' };
const cleanBtnStyle = { position:'absolute', top:'5px', right:'5px', zIndex:10, background:'#222', color:'#0ff', border:'none', padding:'5px', borderRadius:'4px' };
const nameInputStyle = { width:'40px', background:'#000', color:'#fff', border:'1px solid #444', fontSize:'10px' };
const selectStyle = { background:'#000', color:'#0ff', border:'1px solid #0ff', fontSize:'10px' };
const globalStatsStyle = { flex:1, textAlign:'center' };
const statVal = { fontSize:'10px', color:'#0f0' };
const circleBtn = { background:'transparent', border:'1px solid #0ff', color:'#0ff', borderRadius:'50%', width:'24px', height:'24px' };
const backupBtnStyle = { background:'#222', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', padding:'4px' };
const controlToggleStyle = { display:'flex', background:'#000', borderRadius:'4px' };
const toggleBtn = { border:'none', fontSize:'9px', padding:'2px 6px' };
const winInput = { width:'35px', background:'#000', color:'#fff', border:'1px solid #444' };
const saveBtnStyle = { background:'#0ff', border:'none', fontSize:'10px', padding:'4px' };
const currentWinRateDisplay = { fontSize:'14px', color:'#0f0' };
const aiExecBtn = { width:'100%', background:'#333', border:'none', color:'#fff', padding:'8px', borderRadius:'4px', marginBottom:'10px' };
const trainingCard = { background:'#1a1a1a', padding:'8px', borderRadius:'6px', marginBottom:'10px' };
const readingTableStyle = { width:'100%', borderCollapse:'collapse', fontSize:'10px', textAlign:'center', marginBottom:'10px' };
const thStyle = { border:'1px solid #333', padding:'4px', background:'#222' };
const tdStyle = { border:'1px solid #333', padding:'4px' };
const battleSection = { background:'#111', padding:'10px', borderRadius:'8px' };
const battleHeader = { color:'#0ff', fontSize:'11px', marginBottom:'5px' };
const battleItem = { fontSize:'12px' };
const charItemStyle = { minWidth:'35px' };
