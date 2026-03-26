import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  { id: 'qa', label: '質問', icon: '🤖' },
];

const CHECKLIST_ITEMS = [
  { id: 'anti_air', label: '対空', category: '対空' },
  { id: 'combo', label: 'コンボ精度', category: 'コンボ' },
  { id: 'okizeme', label: '起き攻め', category: '起き攻め' },
  { id: 'birdcage', label: 'トリカゴ', category: '立ち回り' },
  { id: 'burnout', label: 'バーンアウト回避', category: 'ゲージ' },
  { id: 'defense', label: '守り・暴れ', category: '防御' },
];

const STORAGE_KEY = 'sf6_master_data_v16';
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "YOUR_KEY_HERE";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default function App() {
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
  const [comboSetplaysVisible, setComboSetplaysVisible] = useState({});
  const [qaInput, setQaInput] = useState("");
  const [qaResult, setQaResult] = useState("");

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

  const updateList = (listKey, charId, index, field, value, defaultItem) => {
    const allLists = { ...(data[listKey] || {}) };
    const myList = [...(allLists[charId] || [defaultItem])];
    myList[index] = { ...myList[index], [field]: value };
    if (myList[myList.length - 1].content || myList[myList.length - 1].start || myList[myList.length - 1].setup) {
      myList.push(defaultItem);
    }
    saveToStorage({ ...data, [listKey]: { ...allLists, [charId]: myList } });
  };

  const insertCmd = (cmd) => {
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
  };

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
    const prompt = `
      SF6の戦績データに基づき分析せよ。
      自キャラ: ${myChar.name}
      最近のログ: ${JSON.stringify(recentLogs)}
      コンボ成功率課題: ${JSON.stringify(data.charCombos?.[myChar.id]?.filter(c => (parseInt(c.successRate)||0) < 80))}
      
      1.【今日のトレモメニュー】(10分でできる具体的メニュー)
      2.【負け筋特定】(最近の敗北に共通する技術的欠陥)
      を、プレイヤーのやる気が出るような口調で短くまとめて。
    `;
    try {
      const result = await model.generateContent(prompt);
      setAiAdvice(result.response.text());
    } catch (e) { setAiAdvice("ログが不足しています。数試合リプレイをつけてください。"); }
    finally { setIsAiProcessing(false); }
  }, [myChar, data]);

  // アップグレード: エラーハンドリングを強化した質問機能
  const askAnyQuestion = async () => {
    if (!qaInput.trim()) return;
    setIsAiProcessing(true);
    const charDataStr = JSON.stringify(data[selectedChar.id] || {});
    const context = `自キャラ: ${myChar.name}, 現在開いている対策対象: ${selectedChar.name}。アプリ内既存データ: ${charDataStr}`;
    const prompt = `あなたはSF6の専門コーチです。\n現在のユーザーの状況: ${context}\n\n質問: ${qaInput}\n\nこのアプリの情報を優先しつつ、不足している場合はストリートファイター6の一般的な知識を補って回答してください。また、参考になるようなYouTube動画の検索キーワードや、noteなどの記事URLのヒントも併記してください。`;
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (text) {
        setQaResult(text);
      } else {
        setQaResult("AIからの回答が空でした。質問内容を変えてみてください。");
      }
    } catch (e) {
      console.error(e);
      setQaResult("質問の処理に失敗しました。APIキーの確認か、少し時間を置いて再度お試しください。");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const cleanupStrategy = () => {
    const raw = data[selectedChar.id]?.strategy || "";
    if (!raw) return;
    let cleaned = raw.replace(/\[\d+\]/g, "")
                     .replace(/[*#]/g, "")
                     .split('\n')
                     .map(line => line.trim())
                     .filter(line => line.length > 0);
    const uniqueLines = [...new Set(cleaned)];
    updateChar('strategy', uniqueLines.join('\n'));
    alert("テキストを整理しました。");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key >= '1' && e.key <= '8') {
        const targetTab = TABS[parseInt(e.key) - 1];
        if (targetTab) setActiveTab(targetTab.id);
      }
      if (e.altKey && e.code === 'KeyA') analyzeBattleTrends();
      if (e.altKey && e.code === 'KeyS') { e.preventDefault(); alert("オートセーブ有効中"); }
      if (e.altKey && e.code === 'KeyQ') generateAdvice();

      if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        const currentIndex = CHARACTERS.findIndex(c => c.id === selectedChar.id);
        const nextIndex = e.key === 'ArrowRight' 
          ? (currentIndex + 1) % CHARACTERS.length 
          : (currentIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
        setSelectedChar(CHARACTERS[nextIndex]);
      }

      if (e.ctrlKey && e.altKey) {
        const key = e.key.toLowerCase();
        const found = CHARACTERS.find(c => c.id.startsWith(key) || c.id === key);
        if (found) setSelectedChar(found);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChar, activeTab, analyzeBattleTrends, generateAdvice]);

  // アップグレード: QAタブ対応のプロンプト生成
  const copyPrompt = () => {
    let promptText = "";
    const base = `あなたはSF6の高度なコーチです。自キャラ:${myChar.name}(${controlType === 'C' ? 'クラシック' : 'モダン'})。`;
    switch(activeTab) {
      case 'strategy':
        promptText = `${base}敵キャラ:${selectedChar.name}。\n【最優先：敵キャラ対策の抽出】\nこの動画から、対敵キャラにおける立ち回り対策を抽出してください。\n\n・立ち回りの重要ポイント（要約）\n・主要な技への対処法や反撃ポイント\n\nこれらをアプリの「対策」欄に貼れるよう、簡潔な箇条書きでまとめてください。\n※前置き不要、内容のみ出力してください。`;
        break;
      case 'myCombo':
        promptText = `${base}\n【最優先：実戦コンボの抽出】\nこの動画から実戦で使えるコンボを抽出してください。\n\n・形式：[始動技] ➔ [レシピ]\n・レシピ内は「 > 」で繋ぎ、DR, PC, OD, SA1~3などの略称を使用してください。\n\nそのままアプリに貼れるよう、余計な解説を省いて出力してください。`;
        break;
      case 'setplay':
        promptText = `${base}\n【最優先：セットプレイ・連携の抽出】\nこの動画から強力な起き攻めや連携を抽出してください。\n\n・形式：[締めパーツ] 有利F：[数字]F ➔ [連携内容]\n\n簡潔に内容のみ出力してください。`;
        break;
      case 'badHabits':
        promptText = `あなたはSF6の高度なコーチです。初心者〜中級者がやりがちな「負け筋」を分析します。\n【最優先：NG行動と改善策の抽出】\nこの動画（または一般的な${myChar.name}の負けパターン）から、改善すべき行動を抽出してください。\n\n・NG行動: [やってはいけない事]\n・改善法: [どうすべきか]\n\n各項目1行で、箇条書きで出力してください。`;
        break;
      case 'training':
        promptText = `${base}\n【最優先：トレーニング・練習メニューの抽出】\nこの動画から、自身の練度を高めるためのトレモ練習項目を抽出してください。\n\n・基礎練習項目：[具体的内容]\n・状況設定トレーニング：[相手の行動設定とそれへの対応]\n\nそのまま練習メモとして活用できるよう、簡潔に出力してください。`;
        break;
      case 'qa':
        promptText = `${base}現在、${selectedChar.name}対策の画面を開いています。私の質問に対して、格ゲーの専門用語を使いつつも分かりやすく回答してください。\n質問: ${qaInput || '[ここに質問を入力してください]'}`;
        break;
      default:
        promptText = `${base}動画の内容を要約してください。`;
    }
    navigator.clipboard.writeText(promptText).then(() => alert("タブ専用プロンプトをコピーしました！"));
  };

  const getYTLink = () => {
    let query = `スト6 ${selectedChar.name} 対策`;
    if (activeTab === 'myCombo') query = `${myChar.name} コンボ`;
    if (activeTab === 'setplay') query = `${myChar.name} セットプレイ`;
    if (activeTab === 'training') query = `スト6 トレモ おすすめ`;
    if (activeTab === 'badHabits') query = `スト6 NG行動 修正`;
    if (activeTab === 'battle' || activeTab === 'replay') query = `${myChar.name} リプレイ`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  };

  const currentCharData = data[selectedChar.id] || {};
  const comboList = data.charCombos?.[myChar.id] || [{start:'', content:'', hitType:'通常', location:'中央', successRate:100}];
  const setplayList = data.charSetplays?.[myChar.id] || [{finisher:'', location:'中央', plusF:'', setup:''}];
  const habitsList = data.badHabits || [{ng:'', solution:''}];
  
  const handleCounter = (id, type) => {
    const current = replayCounts[id] || { success: 0, fail: 0 };
    setReplayCounts({ ...replayCounts, [id]: { ...current, [type]: current[type] + 1 } });
  };

  const saveBattleLog = () => {
    const log = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      opponent: selectedChar.name,
      result: battleResult,
      counts: replayCounts
    };
    const newLogs = [log, ...(data.battleLogs || [])].slice(0, 50);
    saveToStorage({ ...data, battleLogs: newLogs });
    setReplayCounts({});
    alert("対戦ログを保存しました。");
  };

  return (
    <div style={containerStyle}>
      {isAiProcessing && <div style={aiOverlay}>AI解析中...</div>}
      {aiAdvice && <div style={adviceStyle} onClick={() => setAiAdvice("")}>💡 分析結果（クリックで閉じる）<div style={{marginTop:'5px', fontSize:'10px', whiteSpace:'pre-wrap'}}>{aiAdvice}</div></div>}
      
      <header style={headerStyle}>
        <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
          <input style={nameInputStyle} placeholder="ID" value={playerName} onChange={(e) => { setPlayerName(e.target.value); updateMyData('playerName', e.target.value); }} />
          <select value={myChar.id} onChange={(e) => { const char = CHARACTERS.find(c => c.id === e.target.value); setMyChar(char); updateMyData('myCharId', char.id); }} style={selectStyle}>
            {CHARACTERS.map(c => <option key={c.id} value={c.id} disabled={c.id==='all'}>{c.name}</option>)}
          </select>
          <div style={controlToggleStyle}>
            {['C', 'M'].map(t => (
              <button key={t} onClick={() => { setControlType(t); updateMyData('controlType', t); }} style={{...toggleBtn, background: controlType === t ? (t === 'C' ? '#0ff' : '#fc0') : '#333', color: controlType === t ? '#000' : '#888'}}>{t}</button>
            ))}
          </div>
        </div>
        <div style={globalStatsStyle}>
          <div style={statVal}>{data.globalStats?.matches || 0}戦 / {data.globalStats?.rate || 0}%</div>
        </div>
        <div style={{display:'flex', gap:'4px'}}>
          <button onClick={generateAdvice} style={circleBtn} title="アドバイス">🎯</button>
          <button onClick={analyzeBattleTrends} style={circleBtn} title="AI傾向分析">📊</button>
          <button onClick={() => navigator.clipboard.writeText(JSON.stringify(data)).then(() => alert("コピー"))} style={backupBtnStyle}>💾</button>
          <button onClick={() => { const i = prompt("復元"); if(i){ try{ JSON.parse(i); localStorage.setItem(STORAGE_KEY, i); window.location.reload(); }catch(e){alert("失敗")}} }} style={restoreBtnStyle}>📥</button>
        </div>
      </header>

      <div style={charNavStyle}>
        {CHARACTERS.map(c => (
          <div key={c.id} id={`char-${c.id}`} onClick={() => setSelectedChar(c)} style={{...charItemStyle, opacity: selectedChar.id === c.id ? 1 : 0.4}}>
            <div style={{...iconBox, border: selectedChar.id === c.id ? '2px solid #0ff' : '1px solid #444', background: c.id === 'all' ? '#000' : '#111'}}>
              {c.id === 'all' ? <div style={{color: '#f80', fontWeight: 'bold', fontSize: '12px'}}>ALL</div> : <img src={`/${c.id}.png`} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML=c.name[0] }} />}
            </div>
            <div style={{fontSize:'8px', color: selectedChar.id === c.id ? '#0ff' : '#888'}}>{c.name}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 10px 0 10px', flexShrink: 0, background: '#050505' }}>
        <div style={aiPanel}>
           <button onClick={() => analyzeWinRateText(prompt("公式サイトの戦績を貼り付け"))} style={aiExecBtn}>📋 戦績同期</button>
        </div>

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
              <button onClick={copyPrompt} style={{...linkBtn('#fc0'), background:'transparent', cursor:'pointer'}}>✨ AIプロンプト</button>
              <a href={playerName ? `https://sfbuff.site/fighters/search?q=${playerName}` : "https://sfbuff.site/"} target="_blank" rel="noreferrer" style={linkBtn('#0ff')}>SFBuff</a>
          </div>
        </div>

        <div style={tabGroupStyle}>{TABS.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} style={{...tabBtnStyle, color: activeTab === t.id ? '#0ff' : '#666', background: activeTab === t.id ? '#222' : '#000'}}>{t.icon} {t.label}</button>))}</div>
      </div>

      <main style={{flex:1, padding:'10px', overflowY:'auto'}}>
        {activeTab === 'replay' ? (
          <div>
            <div style={sectionTitle}>📹 リプレイ・リアルタイムカウンター</div>
            <div style={comboCardStyle}>
              <div style={{display:'flex', gap:'10px', marginBottom:'15px', justifyContent:'center'}}>
                {['Win', 'Lose'].map(r => (
                  <button key={r} onClick={() => setBattleResult(r)} style={{...miniBtnStyle, padding:'8px 20px', fontSize:'12px', background: battleResult === r ? (r === 'Win' ? '#0f0' : '#f00') : '#333', color: '#fff'}}>{r}</button>
                ))}
              </div>
              {CHECKLIST_ITEMS.map(item => {
                const count = replayCounts[item.id] || { success: 0, fail: 0 };
                const rate = count.success + count.fail > 0 ? Math.round((count.success / (count.success + count.fail)) * 100) : 0;
                return (
                  <div key={item.id} style={{display:'flex', alignItems:'center', gap:'10px', padding:'10px 0', borderBottom:'1px solid #222'}}>
                    <div style={{flex:1}}><div style={{fontSize:'12px', color:'#fff'}}>{item.label}</div><div style={{fontSize:'10px', color: rate < 50 ? '#f44' : '#0f0'}}>成功率: {rate}%</div></div>
                    <div style={{display:'flex', gap:'5px'}}>
                      <button onClick={() => handleCounter(item.id, 'success')} style={{...counterBtn, color:'#0f0'}}>成功(+)</button>
                      <button onClick={() => handleCounter(item.id, 'fail')} style={{...counterBtn, color:'#f44'}}>失敗(-)</button>
                    </div>
                  </div>
                );
              })}
              <button onClick={saveBattleLog} style={{width:'100%', marginTop:'15px', background:'#0ff', color:'#000', border:'none', padding:'10px', borderRadius:'4px', fontWeight:'bold'}}>試合終了・ログを保存</button>
            </div>
            <div style={sectionTitle}>📜 直近のログ</div>
            {(data.battleLogs || []).slice(0, 5).map(log => (
               <div key={log.id} style={{fontSize:'10px', background:'#111', padding:'5px', marginBottom:'4px', borderRadius:'4px', borderLeft: `3px solid ${log.result === 'Win' ? '#0f0' : '#f00'}`}}>
                 {log.date} vs {log.opponent} ({log.result})
               </div>
            ))}
            <textarea style={mainTextAreaStyle} placeholder="リプレイを見て気づいたこと..." value={currentCharData.replayNote || ''} onChange={e => updateChar('replayNote', e.target.value)} />
          </div>
        ) : activeTab === 'training' ? (
          <div>
            <div style={sectionTitle}>🛠️ トレモ課題 (AI分析優先)</div>
            <div style={{marginBottom:'15px'}}>
              <div style={trainingCard}>
                <div style={{color:'#0ff', fontSize:'11px', marginBottom:'5px'}}>AIおすすめメニュー</div>
                <div style={{color:'#eee', fontSize:'11px', whiteSpace:'pre-wrap'}}>{aiAdvice || "解析ボタン(📊)を押してください"}</div>
              </div>
            </div>
            <div style={sectionTitle}>⚔️ コンボ成功率課題</div>
            {comboList.filter(c => c.content && (parseInt(c.successRate) || 0) < 80).map((item, idx) => (<div key={idx} style={trainingCard}><div style={{color:'#fff', fontSize:'12px'}}>{item.start} ➔ {item.content}</div><div style={{color:'#f44', fontSize:'10px'}}>成功率: {item.successRate}%</div></div>))}
            <div style={sectionTitle}>✍️ トレモ練習メモ</div>
            <textarea style={mainTextAreaStyle} value={currentCharData.trainingNote || ''} onChange={e => updateChar('trainingNote', e.target.value)} placeholder="練習メニューや気づきを自由に記載..." />
          </div>
        ) : activeTab === 'battle' ? (
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            <button onClick={() => setShowReadingTable(!showReadingTable)} style={{...linkBtn('#fc0'), width:'100%', padding:'10px'}}>{showReadingTable ? '読み合い表を隠す' : '起き攻め読み合い表を表示'}</button>
            {showReadingTable && (
              <div style={{background:'#111', padding:'5px', borderRadius:'8px', overflowX:'auto', border:'1px solid #fc0'}}>
                <table style={readingTableStyle}>
                  <thead><tr><th style={thStyle}>防\攻</th><th style={thStyle}>打撃</th><th style={thStyle}>投げ</th><th style={thStyle}>当て投</th><th style={thStyle}>ガード</th><th style={thStyle}>シミ</th><th style={thStyle}>原人</th></tr></thead>
                  <tbody>
                    <tr><td style={tdStyle}>ガード</td><td>○</td><td>×</td><td>×</td><td>○</td><td>○</td><td>○</td></tr>
                    <tr><td style={tdStyle}>最速抜</td><td>×</td><td>○</td><td>×</td><td>○</td><td style={{color:'#f44'}}>×</td><td>△</td></tr>
                    <tr><td style={tdStyle}>最速暴</td><td>×</td><td>×</td><td>×</td><td>○</td><td style={{color:'#0ff'}}>◎</td><td>○</td></tr>
                    <tr><td style={tdStyle}>遅グラ</td><td>○</td><td>○</td><td>△</td><td>○</td><td style={{color:'#f44'}}>×</td><td>×</td></tr>
                    <tr><td style={tdStyle}>無敵技</td><td style={{color:'#0ff'}}>◎</td><td style={{color:'#0ff'}}>◎</td><td style={{color:'#0ff'}}>◎</td><td style={{color:'#f44'}}>×</td><td style={{color:'#f44'}}>×</td><td>△</td></tr>
                    <tr><td style={tdStyle}>バクステ</td><td>×</td><td style={{color:'#0ff'}}>◎</td><td>×</td><td>○</td><td>○</td><td>○</td></tr>
                    <tr><td style={tdStyle}>ジャスパ</td><td style={{color:'#0ff'}}>◎</td><td style={{color:'#f44'}}>×</td><td style={{color:'#0ff'}}>◎</td><td>○</td><td>○</td><td>○</td></tr>
                  </tbody>
                </table>
              </div>
            )}
            <div style={battleSection}><div style={battleHeader}>🚫 NG & 改善</div>{habitsList.filter(b => b.ng).map((b, i) => (<div key={i} style={battleItem}><span style={{color:'#f44'}}>✕ {b.ng}</span> ➔ <span style={{color:'#0f0'}}>{b.solution}</span></div>))}</div>
            <div style={battleSection}><div style={battleHeader}>🧠 {selectedChar.name} 対策</div><div style={{whiteSpace:'pre-wrap', fontSize:'12px', color:'#eee'}}>{currentCharData.strategy || '未入力'}</div></div>
          </div>
        ) : activeTab === 'myCombo' ? (
          <div>
            <div style={paletteStyle}>{[...COMMON_CMDS, ...(controlType === 'C' ? CLASSIC_CMDS : MODERN_CMDS), ...SYSTEM_CMDS].map(cmd => (<button key={cmd} onClick={() => insertCmd(cmd)} style={cmdBtnStyle}>{cmd}</button>))}</div>
            {comboList.map((item, idx) => {
              const lastPart = item.content ? item.content.split('>').pop().trim() : '';
              const matchingSetplays = lastPart ? setplayList.filter(sp => sp.finisher && (lastPart.includes(sp.finisher) || sp.finisher.includes(lastPart))) : [];

              return (
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
                  <div style={{marginTop:'5px'}}><input type="range" min="0" max="100" step="10" value={item.successRate || 100} onChange={e => updateList('charCombos', myChar.id, idx, 'successRate', e.target.value)} /><span style={{fontSize:'10px', marginLeft:'5px'}}>成功率: {item.successRate}%</span></div>
                  
                  {matchingSetplays.length > 0 && (
                    <div style={{marginTop: '10px'}}>
                      <button onClick={() => setComboSetplaysVisible(prev => ({...prev, [idx]: !prev[idx]}))} style={{...linkBtn('#fc0'), background: 'transparent', cursor: 'pointer'}}>
                        {comboSetplaysVisible[idx] ? '連携を隠す' : `関連する連携を表示 (${matchingSetplays.length}件)`}
                      </button>
                      {comboSetplaysVisible[idx] && (
                        <div style={{marginTop: '5px', padding: '8px', background: '#000', border: '1px solid #444', borderRadius: '4px'}}>
                          {matchingSetplays.map((sp, sIdx) => (
                            <div key={sIdx} style={{fontSize: '10px', color: '#ccc', marginBottom: '4px', borderBottom: '1px dashed #333', paddingBottom: '4px'}}>
                              <span style={{color: '#fc0'}}>[{sp.finisher}]</span> 有利: <span style={{color: '#0f0'}}>{sp.plusF}F</span> ➔ {sp.setup}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : activeTab === 'setplay' ? (
          <div>
            <div style={paletteStyle}>{[...COMMON_CMDS, ...(controlType === 'C' ? CLASSIC_CMDS : MODERN_CMDS), ...SYSTEM_CMDS].map(cmd => (<button key={cmd} onClick={() => insertCmd(cmd)} style={cmdBtnStyle}>{cmd}</button>))}</div>
            {setplayList.map((item, idx) => (
              <div key={idx} style={comboCardStyle}>
                <div style={{display:'flex', gap:'8px', marginBottom:'8px'}}>
                   <div style={{flex:2}}><label style={miniLabel}>締め</label><input style={comboInput} value={item.finisher || ''} onFocus={() => setFocusField({type:'list', listKey:'charSetplays', charId:myChar.id, index:idx, field:'finisher', default:item})} onChange={e => updateList('charSetplays', myChar.id, idx, 'finisher', e.target.value)} /></div>
                   <div style={{flex:1}}><label style={miniLabel}>有利F</label><input style={{...comboInput, color:'#0f0'}} type="number" value={item.plusF || ''} onFocus={() => setFocusField({type:'list', listKey:'charSetplays', charId:myChar.id, index:idx, field:'plusF', default:item})} onChange={e => updateList('charSetplays', myChar.id, idx, 'plusF', e.target.value)} /></div>
                </div>
                <textarea style={{...comboArea, height:'45px'}} placeholder="レシピ..." value={item.setup || ''} onFocus={() => setFocusField({type:'list', listKey:'charSetplays', charId:myChar.id, index:idx, field:'setup', default:item})} onChange={e => updateList('charSetplays', myChar.id, idx, 'setup', e.target.value)} />
              </div>
            ))}
          </div>
        ) : activeTab === 'badHabits' ? (
          <div>{habitsList.map((item, idx) => (
            <div key={idx} style={{...comboCardStyle, borderLeft:'4px solid #f44'}}>
              <div><label style={{...miniLabel, color:'#f44'}}>NG行動</label><input style={comboInput} value={item.ng || ''} onChange={e => { const newList = [...habitsList]; newList[idx].ng = e.target.value; if(newList[newList.length-1].ng) newList.push({ng:'', solution:''}); updateMyData('badHabits', newList); }} /></div>
              <div style={{marginTop:'5px'}}><label style={{...miniLabel, color:'#0f0'}}>改善策</label><input style={comboInput} value={item.solution || ''} onChange={e => { const newList = [...habitsList]; newList[idx].solution = e.target.value; updateMyData('badHabits', newList); }} /></div>
            </div>
          ))}</div>
        ) : activeTab === 'qa' ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px', height: '100%'}}>
            <div style={sectionTitle}>🤖 AIになんでも質問</div>
            <div style={{display: 'flex', gap: '5px'}}>
              <input style={{...comboInput, flex: 1}} value={qaInput} onChange={e => setQaInput(e.target.value)} placeholder="例：ルークのしゃがみ中P対策は？ / 画面端の柔道対策を教えて" />
              <button onClick={askAnyQuestion} style={{...saveBtnStyle, padding: '10px'}}>質問送信</button>
            </div>
            <div style={{flex: 1, background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '10px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontSize: '12px', color: '#eee'}}>
              {qaResult || "質問を入力して送信すると、アプリのデータやWeb上の知識からAIが回答します。\n(※YouTubeやnoteなどの参考リンクのヒントも提示されます)"}
            </div>
          </div>
        ) : (
          <div style={{position:'relative'}}>
            <button onClick={cleanupStrategy} style={cleanBtnStyle} title="重複・不要記号を削除">🧹</button>
            <textarea style={mainTextAreaStyle} value={currentCharData.strategy || ''} onFocus={() => setFocusField({type:'main', field:'strategy'})} onChange={e => updateChar('strategy', e.target.value)} placeholder={`${selectedChar.name}対策...`} />
          </div>
        )}
      </main>
    </div>
  );
}

// スタイル定数は変更なし
const cleanBtnStyle = { position:'absolute', top:'10px', right:'10px', zIndex:10, background:'#222', border:'1px solid #444', color:'#0ff', padding:'5px', borderRadius:'4px', cursor:'pointer' };
const counterBtn = { background:'#222', border:'1px solid #444', borderRadius:'4px', padding:'5px 10px', fontSize:'11px', cursor:'pointer' };
const readingTableStyle = { width:'100%', borderCollapse:'collapse', fontSize:'10px', textAlign:'center', color:'#fff' };
const thStyle = { border:'1px solid #333', padding:'4px', background:'#222', color:'#fc0' };
const tdStyle = { border:'1px solid #333', padding:'4px', background:'#000', fontWeight:'bold' };
const containerStyle = { display:'flex', flexDirection:'column', height:'100vh', background:'#050505', color:'#fff', overflow:'hidden' };
const headerStyle = { display:'flex', justifyContent:'space-between', padding:'10px', background:'#111', alignItems:'center', borderBottom:'1px solid #333', gap:'10px' };
const nameInputStyle = { width:'50px', background:'#000', color:'#fff', border:'1px solid #444', fontSize:'10px', padding:'3px' };
const selectStyle = { background:'#000', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', fontSize:'10px' };
const globalStatsStyle = { flex:1, textAlign:'center', background:'#222', padding:'4px', borderRadius:'4px', border:'1px dotted #444' };
const statVal = { fontSize:'11px', fontWeight:'bold', color:'#0f0' };
const backupBtnStyle = { background:'#222', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', padding:'4px' };
const restoreBtnStyle = { background:'#222', color:'#fc0', border:'1px solid #fc0', borderRadius:'4px', padding:'4px' };
const charNavStyle = { display:'flex', overflowX:'auto', padding:'10px', gap:'12px', background:'#000', borderBottom:'1px solid #222' };
const charItemStyle = { display:'flex', flexDirection:'column', alignItems:'center', minWidth:'45px', cursor:'pointer' };
const iconBox = { width:'38px', height:'38px', borderRadius:'4px', overflow:'hidden', border:'1px solid #444', display:'flex', alignItems:'center', justifyContent:'center' };
const winRowStyle = { display:'flex', gap:'10px', background:'#111', padding:'8px', borderRadius:'8px', marginBottom:'10px', alignItems:'center' };
const winInput = { width:'40px', background:'#000', color:'#0f0', border:'1px solid #444', padding:'4px', fontSize:'12px' };
const currentWinRateDisplay = { fontSize:'16px', fontWeight:'bold', color:'#0f0', minWidth:'45px', textAlign:'right' };
const saveBtnStyle = { background:'#0ff', border:'none', borderRadius:'3px', fontSize:'10px', padding:'4px 10px' };
const linkBtn = (c) => ({ color:c, border:`1px solid ${c}`, padding:'3px 8px', borderRadius:'4px', fontSize:'10px', textDecoration:'none', textAlign:'center', display:'inline-block' });
const tabGroupStyle = { display:'flex', gap:'2px', marginBottom:'10px' };
const tabBtnStyle = { flex:1, padding:'10px 0', border:'1px solid #333', fontSize:'10px' };
const paletteStyle = { display:'flex', flexWrap:'wrap', gap:'3px', background:'#111', padding:'8px', borderRadius:'8px', marginBottom:'10px' };
const cmdBtnStyle = { background:'#333', color:'#fff', border:'none', padding:'6px 8px', borderRadius:'4px', fontSize:'10px' };
const comboCardStyle = { background:'#111', padding:'12px', borderRadius:'8px', marginBottom:'10px', border:'1px solid #333' };
const inputGrid = { display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'8px' };
const comboInput = { width:'100%', background:'#000', color:'#fff', border:'1px solid #444', padding:'5px', fontSize:'11px' };
const comboArea = { width:'100%', background:'#000', color:'#ccc', border:'1px solid #333', padding:'5px', height:'45px', fontSize:'11px' };
const miniLabel = { fontSize:'8px', color:'#888', display:'block' };
const miniBtnStyle = { border:'none', color:'#fff', fontSize:'8px', padding:'2px 6px', borderRadius:'3px' };
const mainTextAreaStyle = { width:'100%', height:'150px', background:'#000', color:'#eee', padding:'10px', border:'1px solid #333' };
const aiOverlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', color:'#0ff' };
const adviceStyle = { position:'fixed', bottom:'20px', left:'10px', right:'10px', background:'#022', border:'1px solid #0ff', padding:'12px', borderRadius:'8px', color:'#fff', fontSize:'11px', zIndex:1000 };
const circleBtn = { background:'transparent', border:'1px solid #0ff', color:'#0ff', borderRadius:'50%', width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center' };
const controlToggleStyle = { display:'flex', background:'#000', borderRadius:'4px', padding:'1px', border:'1px solid #333' };
const toggleBtn = { border:'none', fontSize:'9px', padding:'2px 6px' };
const battleSection = { background:'#111', borderRadius:'8px', padding:'10px', border:'1px solid #222', marginBottom:'10px' };
const battleHeader = { fontSize:'11px', fontWeight:'bold', color:'#0ff', marginBottom:'8px', borderBottom:'1px solid #333' };
const battleItem = { fontSize:'12px', marginBottom:'6px' };
const sectionTitle = { fontSize:'11px', color:'#fc0', marginBottom:'8px', marginTop:'5px' };
const trainingCard = { background:'#1a1a1a', padding:'8px', borderRadius:'6px', marginBottom:'8px', borderLeft:'3px solid #f44' };
const aiPanel = { background:'#111', padding:'10px', borderRadius:'8px', marginBottom:'10px' };
const aiExecBtn = { width:'100%', background:'#333', border:'1px solid #555', color:'#fff', padding:'8px', borderRadius:'4px', fontSize:'11px' };
