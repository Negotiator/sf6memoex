import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
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
  { name: 'C.ヴァイパー', id: 'crimson-viper' }, { name: 'アレックス', id: 'alex' }, { name: 'イングリット', id: 'ingrid' },
  { name: 'ヤスミン', id: 'yasmine' }, { name: 'アルジュン', id: 'arjun' }
].sort((a, b) => a.id === 'all' ? -1 : b.id === 'all' ? 1 : a.name.localeCompare(b.name, 'ja'));

// 公式サイト（streetfighter.com）の画像フォルダ名がアプリ内idと異なるキャラの対応表
const IMG_SLUG = { 'akuma': 'gouki_akuma', 'chun-li': 'chunli', 'crimson-viper': 'cviper', 'dee-jay': 'deejay', 'e-honda': 'ehonda', 'm-bison': 'vega_mbison' };
const charImg = (id) => { const s = IMG_SLUG[id] || id; return `https://www.streetfighter.com/6/assets/images/character/${s}/${s}.png`; };



const TABS = [
  { id: 'home', label: 'ホーム', icon: '🏠' },
  { id: 'dosdb', label: 'コンボ・セットプレイ', icon: '⚡' },
  { id: 'strategy', label: '対策', icon: '🧠' },
  { id: 'badHabits', label: '反省', icon: '📝' },
  { id: 'replay', label: 'リプレイ', icon: '📹' },
  { id: 'training', label: 'トレモ', icon: '🛠️' },
  { id: 'battle', label: '実戦', icon: '⚔️' },
  { id: 'qa', label: '質問', icon: '🤖' }, // 追加: AI質問タブ
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
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ===== Google Sheets 連携（NEGOSHIちゃんが更新するデータの表示） =====
const SHEET_IDS = {
  dash: '1Wlosrs3QKreA7xeyYI-mAJUNlkXWEMprJmwW0HI4_YI',
  reflection: '19Lms9pv6Y8A8BMbH_RAv6cwPR_Gcytmiz5tA9u5sm_8',
  dos: '1CnWfVzAMxZnZ6dAYmUup3dPdghoLG7_maBQkE1ScKwU',
};
const DOC_LINKS = [
  { label: 'Buckler プロフィール（PLAY）', url: 'https://www.streetfighter.com/6/buckler/ja-jp/profile/1386489874/play' },
  { label: '反省ログ（シート）', url: 'https://docs.google.com/spreadsheets/d/19Lms9pv6Y8A8BMbH_RAv6cwPR_Gcytmiz5tA9u5sm_8/edit' },
  { label: 'doskonnbu攻略DB（シート）', url: 'https://docs.google.com/spreadsheets/d/1CnWfVzAMxZnZ6dAYmUup3dPdghoLG7_maBQkE1ScKwU/edit' },
  { label: 'AI情報収集ハブ', url: 'https://docs.google.com/spreadsheets/d/1BTPyYYoeYncUQoLH-DOZxmF_ic-rmZ3P4S12aS_x5Tw/edit' },
  { label: 'スト6_ラシード攻略DB（ドキュメント）', url: 'https://docs.google.com/document/d/12y0GDXJjGat02v4zCNmHb4MrGMjae5SByR3eqrkwmp4/edit' },
  { label: 'アケコン_パーツ改造DB（ドキュメント）', url: 'https://docs.google.com/document/d/1P1JBrb8P30drAEyckhUI6vQwjXmhh4meoOBVwPl36ZU/edit' },
];

async function fetchSheetRows(id, sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json${sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : ''}`;
  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
  return (json.table.rows || []).map(r => (r.c || []).map(c => (c ? { v: c.v, f: c.f !== undefined ? String(c.f) : (c.v !== null && c.v !== undefined ? String(c.v) : '') } : { v: null, f: '' })));
}

const dashCard = { background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px', marginBottom: '12px' };
const dashTitle = { fontSize: '13px', fontWeight: 'bold', color: '#0ff', marginBottom: '8px' };

function HomeDashboard({ onSelectChar }) {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [matchups, setMatchups] = useState([]);
  const [ach, setAch] = useState([]);
  const [reflection, setReflection] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [sRows, hRows, mRows, aRows, rRows] = await Promise.all([
          fetchSheetRows(SHEET_IDS.dash, 'status'),
          fetchSheetRows(SHEET_IDS.dash, 'mr_history'),
          fetchSheetRows(SHEET_IDS.dash, 'matchups'),
          fetchSheetRows(SHEET_IDS.dash, 'achievements'),
          fetchSheetRows(SHEET_IDS.reflection),
        ]);
        const st = {};
        sRows.forEach(r => { if (r[0] && r[1] && r[0].f) st[r[0].f] = r[1]; });
        setStatus(st);
        setHistory(hRows.filter(r => r[0] && r[0].f && r[1] && r[1].v !== null && r[1].v !== undefined).map(r => ({ date: r[0].f.slice(5), mr: Number(r[1].v) })));
        setMatchups(mRows.filter(r => r[0] && r[0].f).map(r => ({ id: r[0].f, name: r[1].f, matches: Number(r[2].v), rate: Number(r[3].v) })));
        setAch(aRows.filter(r => r[0] && r[0].f));
        const valid = rRows.filter(r => r[0] && r[0].f);
        if (valid.length) {
          const last = valid[valid.length - 1];
          setReflection({ date: last[0].f, mr: last[1] ? last[1].f : '', text: last[4] ? last[4].f : '', good: last[5] ? last[5].f : '', focus: last[6] ? last[6].f : '' });
        }
      } catch (e) { setError('データ取得に失敗しました。下のリンクから直接確認してください。'); }
    })();
  }, []);

  const weak5 = [...matchups].filter(m => m.matches >= 15).sort((a, b) => a.rate - b.rate).slice(0, 5);
  const curMR = status && status['現在MR'] ? Number(status['現在MR'].v) : null;
  const goalMR = status && status['目標MR'] ? Number(status['目標MR'].v) : 1800;

  return (
    <div>
      <div style={dashCard}>
        <div style={dashTitle}>🎯 MR（ラシード）</div>
        {error && <div style={{ color: '#f88', fontSize: '12px' }}>{error}</div>}
        {!status && !error && <div style={{ color: '#888', fontSize: '12px' }}>読み込み中...</div>}
        {status && (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '34px', fontWeight: 'bold', color: '#fff' }}>{curMR}</span>
              <span style={{ fontSize: '13px', color: '#fc0' }}>目標 {goalMR} まで あと {curMR !== null ? goalMR - curMR : '--'}</span>
              <span style={{ fontSize: '11px', color: '#888' }}>最高 {status['Act14最高MR'] ? status['Act14最高MR'].f : '--'}</span>
            </div>
            {history.length > 1 && (
              <div style={{ height: '110px', marginTop: '8px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} />
                    <YAxis domain={['dataMin - 30', 'dataMax + 30']} tick={{ fill: '#888', fontSize: 10 }} width={45} />
                    <Tooltip contentStyle={{ background: '#222', border: '1px solid #444', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="mr" stroke="#0ff" dot={{ r: 3 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
              Act14: {status['Act14対戦数'] ? status['Act14対戦数'].f : '--'}戦 / {status['Act14勝率'] ? status['Act14勝率'].f : '--'}%　
              Act13: {status['Act13対戦数'] ? status['Act13対戦数'].f : '--'}戦 / {status['Act13勝率'] ? status['Act13勝率'].f : '--'}%　
              累計: {status['累計対戦数'] ? status['累計対戦数'].f : '--'}戦 / {status['累計勝率'] ? status['累計勝率'].f : '--'}%
            </div>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>MR確認日: {status['MR確認日'] ? status['MR確認日'].f : '--'}（勝率データ: {status['勝率データ基準'] ? status['勝率データ基準'].f : '--'}） ※毎晩のチェックインで更新</div>
          </div>
        )}
      </div>

      {weak5.length > 0 && (
        <div style={dashCard}>
          <div style={dashTitle}>⚠️ 苦手キャラ TOP5（Act14・15戦以上）</div>
          {weak5.map(m => (
            <div key={m.id} onClick={() => onSelectChar(m.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid #222', cursor: 'pointer' }}>
              <img src={charImg(m.id)} alt="" style={{ width: '34px', height: '34px', objectFit: 'cover', borderRadius: '4px', background: '#222' }} onError={(e) => { e.target.style.display = 'none'; }} />
              <div style={{ flex: 1, fontSize: '13px', color: '#fff' }}>{m.name}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>{m.matches}戦</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: m.rate < 40 ? '#f44' : '#fc0' }}>{m.rate.toFixed(2)}%</div>
            </div>
          ))}
          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>タップでそのキャラの対策タブへ</div>
        </div>
      )}

      {reflection && (
        <div style={dashCard}>
          <div style={dashTitle}>📝 最新の反省（{reflection.date}）</div>
          {reflection.focus && <div style={{ fontSize: '13px', color: '#fc0', marginBottom: '6px' }}>意識ポイント：{reflection.focus}</div>}
          {reflection.text && <div style={{ fontSize: '12px', color: '#ccc', whiteSpace: 'pre-wrap', marginBottom: '4px' }}>{reflection.text}</div>}
          {reflection.good && <div style={{ fontSize: '12px', color: '#9c9', whiteSpace: 'pre-wrap' }}>良かった点：{reflection.good}</div>}
        </div>
      )}

      {ach.length > 0 && (
        <div style={dashCard}>
          <div style={dashTitle}>📊 実績（過去100戦平均）</div>
          {['ドライブゲージ', 'SAゲージ'].map(g => (
            <div key={g} style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>{g}</div>
              {ach.filter(r => r[0].f === g).map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#ccc', padding: '2px 0' }}>
                  <span>{r[1].f}</span><span style={{ color: '#fff' }}>{r[2].f}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div style={dashCard}>
        <div style={dashTitle}>🔗 データ・リンク</div>
        {DOC_LINKS.map(l => (
          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '12px', color: '#6cf', padding: '5px 0', borderBottom: '1px solid #222', textDecoration: 'none' }}>{l.label}</a>
        ))}
      </div>
    </div>
  );
}

function DosDbView() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('すべて');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetchSheetRows(SHEET_IDS.dos, 'DB_ラシード攻略');
        setRows(r.filter(x => x[0] && x[0].f).map(x => ({ cat: x[0].f, date: x[1].f, pos: x[2].f, res: x[3].f, sit: x[4].f, recipe: x[5].f, tip: x[6].f, title: x[7].f, url: x[8].f })));
      } catch (e) { setError('データ取得に失敗しました'); }
    })();
  }, []);

  const cats = ['すべて', ...Array.from(new Set(rows.map(r => r.cat)))];
  const filtered = rows.filter(r => (cat === 'すべて' || r.cat === cat) && (!q || (r.sit + r.recipe + r.tip + r.title).includes(q)));

  return (
    <div>
      <div style={dashTitle}>📚 ラシード攻略DB（doskonnbu・{filtered.length}件）</div>
      {error && <div style={{ color: '#f88', fontSize: '12px', marginBottom: '8px' }}>{error}</div>}
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="キーワード検索（状況・レシピ・要点）" style={{ width: '100%', boxSizing: 'border-box', background: '#111', border: '1px solid #444', borderRadius: '6px', color: '#fff', padding: '8px', fontSize: '13px', marginBottom: '8px' }} />
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ background: cat === c ? '#0ff' : '#222', color: cat === c ? '#000' : '#aaa', border: '1px solid #444', borderRadius: '12px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}>{c}</button>
        ))}
      </div>
      {filtered.map((r, i) => (
        <div key={i} style={dashCard}>
          <div style={{ display: 'flex', gap: '6px', fontSize: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
            <span style={{ background: '#300', color: '#f99', borderRadius: '4px', padding: '2px 6px' }}>{r.cat}</span>
            <span style={{ background: '#222', color: '#aaa', borderRadius: '4px', padding: '2px 6px' }}>{r.pos}</span>
            <span style={{ background: '#222', color: '#aaa', borderRadius: '4px', padding: '2px 6px' }}>{r.res}</span>
            <span style={{ color: '#666' }}>{r.date}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}>{r.sit}</div>
          <div style={{ fontSize: '12px', color: '#ccc', whiteSpace: 'pre-wrap', marginBottom: '4px' }}>{r.recipe}</div>
          <div style={{ fontSize: '12px', color: '#9c9', whiteSpace: 'pre-wrap', marginBottom: '6px' }}>💡 {r.tip}</div>
          {r.url && <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#6cf', textDecoration: 'none' }}>▶ 動画を見る（{r.title}）</a>}
        </div>
      ))}
      {rows.length > 0 && filtered.length === 0 && <div style={{ color: '#888', fontSize: '12px' }}>該当データなし</div>}
    </div>
  );
}

function CompactDashboard() {
  const [status, setStatus] = useState(null);
  const [matchups, setMatchups] = useState([]);
  const [focus, setFocus] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const [sRows, mRows, rRows] = await Promise.all([
          fetchSheetRows(SHEET_IDS.dash, 'status'),
          fetchSheetRows(SHEET_IDS.dash, 'matchups'),
          fetchSheetRows(SHEET_IDS.reflection),
        ]);
        const st = {};
        sRows.forEach(r => { if (r[0] && r[1] && r[0].f) st[r[0].f] = r[1]; });
        setStatus(st);
        setMatchups(mRows.filter(r => r[0] && r[0].f).map(r => ({ id: r[0].f, name: r[1].f, matches: Number(r[2].v), rate: Number(r[3].v) })));
        const valid = rRows.filter(r => r[0] && r[0].f);
        if (valid.length) { const last = valid[valid.length - 1]; setFocus(last[6] ? last[6].f : ''); }
      } catch (e) { /* 固定表示は失敗しても静かにする */ }
    })();
  }, []);
  if (!status || !status['現在MR']) return null;
  const curMR = Number(status['現在MR'].v);
  const goalMR = status['目標MR'] ? Number(status['目標MR'].v) : 1800;
  const weak5 = [...matchups].filter(m => m.matches >= 15).sort((a, b) => a.rate - b.rate).slice(0, 5);
  return (
    <div style={{ background: '#0a1a1a', border: '1px solid #0ff', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: '#0ff' }}>MR</span>
        <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>{curMR}</span>
        <span style={{ fontSize: '11px', color: '#fc0' }}>あと {goalMR - curMR}</span>
        <span style={{ fontSize: '11px', color: '#aaa' }}>Act14 {status['Act14勝率'] ? status['Act14勝率'].f : '--'}%（{status['Act14対戦数'] ? status['Act14対戦数'].f : '--'}戦）</span>
        {weak5.length > 0 && <span style={{ fontSize: '10px', color: '#f88' }}>苦手: {weak5.map(m => `${m.name} ${m.rate.toFixed(1)}%`).join(' / ')}</span>}
      </div>
      {focus && <div style={{ fontSize: '11px', color: '#fc0', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🎯 {focus}</div>}
    </div>
  );
}

function ReflectionView() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const r = await fetchSheetRows(SHEET_IDS.reflection);
        const valid = r.filter(x => x[0] && x[0].f).map(x => ({ date: x[0].f, mr: x[1] ? x[1].f : '', rate: x[2] ? x[2].f : '', matches: x[3] ? x[3].f : '', text: x[4] ? x[4].f : '', good: x[5] ? x[5].f : '', focus: x[6] ? x[6].f : '' }));
        setRows(valid.reverse());
      } catch (e) { setError('データ取得に失敗しました'); }
    })();
  }, []);
  return (
    <div>
      <div style={dashTitle}>📝 反省ログ（蓄積）</div>
      {error && <div style={{ color: '#f88', fontSize: '12px' }}>{error}</div>}
      {rows.length === 0 && !error && <div style={{ color: '#888', fontSize: '12px' }}>読み込み中...</div>}
      {rows.map((r, i) => (
        <div key={i} style={{ ...dashCard, borderLeft: '4px solid #fc0' }}>
          <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#888', marginBottom: '5px' }}>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>{r.date}</span>
            {r.mr && <span>MR {r.mr}</span>}
            {r.rate && <span>Act14 {r.rate}%</span>}
            {r.matches && <span>{r.matches}戦</span>}
          </div>
          {r.text && <div style={{ fontSize: '12px', color: '#ccc', whiteSpace: 'pre-wrap', marginBottom: '4px' }}>{r.text}</div>}
          {r.good && <div style={{ fontSize: '12px', color: '#9c9', whiteSpace: 'pre-wrap', marginBottom: '4px' }}>良かった点：{r.good}</div>}
          {r.focus && <div style={{ fontSize: '12px', color: '#fc0' }}>意識ポイント：{r.focus}</div>}
        </div>
      ))}
      <div style={{ fontSize: '10px', color: '#666' }}>※毎晩0:00の反省で自動で蓄積されます</div>
    </div>
  );
}

function StrategyRefPanel({ charId, charName }) {
  const [mu, setMu] = useState(null);
  const [related, setRelated] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const [mRows, dRows] = await Promise.all([
          fetchSheetRows(SHEET_IDS.dash, 'matchups'),
          fetchSheetRows(SHEET_IDS.dos, 'DB_ラシード攻略'),
        ]);
        const found = mRows.find(r => r[0] && r[0].f === charId);
        if (found) setMu({ matches: Number(found[2].v), rate: Number(found[3].v) }); else setMu(null);
        const rel = dRows.filter(x => x[0] && x[0].f === 'キャラ対策' && ((x[4].f + x[6].f + x[7].f).includes(charName))).map(x => ({ sit: x[4].f, tip: x[6].f, url: x[8].f }));
        setRelated(rel.slice(0, 3));
      } catch (e) { /* 静かに失敗 */ }
    })();
  }, [charId, charName]);
  if (charId === 'all') return null;
  if (!mu && related.length === 0) return null;
  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
      <div style={{ fontSize: '11px', color: '#0ff', marginBottom: '5px' }}>📊 NEGOSHIちゃん収集データ（Act14）</div>
      {mu && <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '5px' }}>対{charName}： {mu.matches}戦 / 勝率 <span style={{ color: mu.rate < 45 ? '#f44' : '#0f0', fontWeight: 'bold' }}>{mu.rate.toFixed(2)}%</span></div>}
      {related.map((r, i) => (
        <div key={i} style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
          <div style={{ color: '#ddd' }}>{r.sit}</div>
          <div>💡 {r.tip}</div>
          {r.url && <a href={r.url} target="_blank" rel="noreferrer" style={{ color: '#6cf', textDecoration: 'none' }}>▶ 動画を見る</a>}
        </div>
      ))}
      <a href="https://docs.google.com/document/d/12y0GDXJjGat02v4zCNmHb4MrGMjae5SByR3eqrkwmp4/edit" target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#6cf', textDecoration: 'none' }}>📄 攻略DBドキュメント（対策記事）</a>
    </div>
  );
}

function ReflectionFocusPanel() {
  const [latest, setLatest] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetchSheetRows(SHEET_IDS.reflection);
        const valid = r.filter(x => x[0] && x[0].f);
        if (valid.length) { const last = valid[valid.length - 1]; setLatest({ date: last[0].f, text: last[4] ? last[4].f : '', focus: last[6] ? last[6].f : '' }); }
      } catch (e) { /* 静かに失敗 */ }
    })();
  }, []);
  if (!latest || (!latest.focus && !latest.text)) return null;
  return (
    <div style={{ background: '#1a1503', border: '1px solid #fc0', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: '#fc0', marginBottom: '4px' }}>🎯 前回の反省から（{latest.date}）</div>
      {latest.focus && <div style={{ fontSize: '13px', color: '#fff', marginBottom: '3px' }}>{latest.focus}</div>}
      {latest.text && <div style={{ fontSize: '11px', color: '#bbb', whiteSpace: 'pre-wrap' }}>{latest.text}</div>}
    </div>
  );
}


export default function App() {
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [myChar, setMyChar] = useState(CHARACTERS[1]);
  const [controlType, setControlType] = useState('C');
  const [playerName, setPlayerName] = useState('');
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState('home');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [showReadingTable, setShowReadingTable] = useState(false);
  const [replayCounts, setReplayCounts] = useState({});
  const [battleResult, setBattleResult] = useState('Win');
  
  // 追加: 連携表示・QA機能用ステート
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

  // 追加: AIなんでも質問機能
  const askAnyQuestion = async () => {
    if (!qaInput.trim()) return;
    setIsAiProcessing(true);
    const context = `自キャラ: ${myChar.name}, 現在開いている対策対象: ${selectedChar.name}。アプリ内既存データ: ${JSON.stringify(data[selectedChar.id] || {})}`;
    const prompt = `あなたはSF6の専門コーチです。\n現在のユーザーの状況: ${context}\n\n質問: ${qaInput}\n\nこのアプリの情報を優先しつつ、不足している場合はストリートファイター6の一般的な知識（フレームデータ、立ち回り、プロの意見など）を補って回答してください。また、参考になるようなYouTube動画の検索キーワードや、noteなどの記事URL（または検索のヒント）も併記してください。`;
    try {
      const result = await model.generateContent(prompt);
      setQaResult(result.response.text());
    } catch (e) { setQaResult("質問の処理に失敗しました。"); }
    finally { setIsAiProcessing(false); }
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
      if (e.altKey && e.key >= '1' && e.key <= '8') { // 8タブに対応
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
              {c.id === 'all' ? <div style={{color: '#f80', fontWeight: 'bold', fontSize: '12px'}}>ALL</div> : <img src={charImg(c.id)} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML=c.name[0] }} />}
            </div>
            <div style={{fontSize:'8px', color: selectedChar.id === c.id ? '#0ff' : '#888'}}>{c.name}</div>
          </div>
        ))}
      </div>

      {/* 追加: スクロールせずに固定表示させる上部エリア */}
      <div style={{ padding: '10px 10px 0 10px', flexShrink: 0, background: '#050505' }}>
        {!['home', 'dosdb'].includes(activeTab) && (<>
        <div style={{...winRowStyle, justifyContent:'flex-end'}}>
          <div style={{display:'flex', gap:'4px'}}>
              <a href={getYTLink()} target="_blank" rel="noreferrer" style={linkBtn('#f00')}>YouTube</a>
              <button onClick={copyPrompt} style={{...linkBtn('#fc0'), background:'transparent', cursor:'pointer'}}>✨ AIプロンプト</button>
              <a href={playerName ? `https://sfbuff.site/fighters/search?q=${playerName}` : "https://sfbuff.site/"} target="_blank" rel="noreferrer" style={linkBtn('#0ff')}>SFBuff</a>
          </div>
        </div>

        </>)}
        <CompactDashboard />
        <div style={tabGroupStyle}>{TABS.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} style={{...tabBtnStyle, color: activeTab === t.id ? '#0ff' : '#666', background: activeTab === t.id ? '#222' : '#000'}}>{t.icon} {t.label}</button>))}</div>
      </div>

      <main style={{flex:1, padding:'10px', overflowY:'auto'}}>
        {activeTab === 'home' ? (
          <HomeDashboard onSelectChar={(id) => { const c = CHARACTERS.find(x => x.id === id); if (c) { setSelectedChar(c); setActiveTab('strategy'); } }} />
        ) : activeTab === 'dosdb' ? (
          <DosDbView />
        ) : activeTab === 'replay' ? (
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
            <ReflectionFocusPanel />
            <div style={sectionTitle}>🛠️ トレモ課題 (AI分析優先)</div>
            <div style={{marginBottom:'15px'}}>
              <div style={trainingCard}>
                <div style={{color:'#0ff', fontSize:'11px', marginBottom:'5px'}}>AIおすすめメニュー</div>
                <div style={{color:'#eee', fontSize:'11px', whiteSpace:'pre-wrap'}}>{aiAdvice || "解析ボタン(📊)を押してください"}</div>
              </div>
            </div>
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
            <div style={battleSection}><div style={battleHeader}>🧠 {selectedChar.name} 対策</div><div style={{whiteSpace:'pre-wrap', fontSize:'12px', color:'#eee'}}>{currentCharData.strategy || '未入力'}</div></div>
          </div>
        ) : activeTab === 'badHabits' ? (
          <ReflectionView />
        ) : activeTab === 'qa' ? (
          // 追加: AIなんでも質問タブの内容
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px', height: '100%'}}>
            <div style={sectionTitle}>🤖 AIになんでも質問</div>
            <div style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
              {DOC_LINKS.map(l => (<a key={l.url} href={l.url} target="_blank" rel="noreferrer" style={{fontSize:'10px', color:'#6cf', border:'1px solid #335', borderRadius:'10px', padding:'3px 8px', textDecoration:'none'}}>📄 {l.label}</a>))}
            </div>
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
            <StrategyRefPanel charId={selectedChar.id} charName={selectedChar.name} />
            <button onClick={cleanupStrategy} style={cleanBtnStyle} title="重複・不要記号を削除">🧹</button>
            <textarea style={mainTextAreaStyle} value={currentCharData.strategy || ''} onChange={e => updateChar('strategy', e.target.value)} placeholder={`${selectedChar.name}対策...`} />
          </div>
        )}
      </main>
    </div>
  );
}

// スタイル定数 (変更なし)
const cleanBtnStyle = { position:'absolute', top:'10px', right:'10px', zIndex:10, background:'#222', border:'1px solid #444', color:'#0ff', padding:'5px', borderRadius:'4px', cursor:'pointer' };
const counterBtn = { background:'#222', border:'1px solid #444', borderRadius:'4px', padding:'5px 10px', fontSize:'11px', cursor:'pointer' };
const readingTableStyle = { width:'100%', borderCollapse:'collapse', fontSize:'10px', textAlign:'center', color:'#fff' };
const thStyle = { border:'1px solid #333', padding:'4px', background:'#222', color:'#fc0' };
const tdStyle = { border:'1px solid #333', padding:'4px', background:'#000', fontWeight:'bold' };
const containerStyle = { display:'flex', flexDirection:'column', height:'100vh', background:'#050505', color:'#fff', overflow:'hidden' };
const headerStyle = { display:'flex', justifyContent:'space-between', padding:'10px', background:'#111', alignItems:'center', borderBottom:'1px solid #333', gap:'10px' };
const nameInputStyle = { width:'50px', background:'#000', color:'#fff', border:'1px solid #444', fontSize:'10px', padding:'3px' };
const selectStyle = { background:'#000', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', fontSize:'10px' };
const backupBtnStyle = { background:'#222', color:'#0ff', border:'1px solid #0ff', borderRadius:'4px', padding:'4px' };
const restoreBtnStyle = { background:'#222', color:'#fc0', border:'1px solid #fc0', borderRadius:'4px', padding:'4px' };
const charNavStyle = { display:'flex', overflowX:'auto', padding:'10px', gap:'12px', background:'#000', borderBottom:'1px solid #222' };
const charItemStyle = { display:'flex', flexDirection:'column', alignItems:'center', minWidth:'45px', cursor:'pointer' };
const iconBox = { width:'38px', height:'38px', borderRadius:'4px', overflow:'hidden', border:'1px solid #444', display:'flex', alignItems:'center', justifyContent:'center' };
const winRowStyle = { display:'flex', gap:'10px', background:'#111', padding:'8px', borderRadius:'8px', marginBottom:'10px', alignItems:'center' };
const saveBtnStyle = { background:'#0ff', border:'none', borderRadius:'3px', fontSize:'10px', padding:'4px 10px' };
const linkBtn = (c) => ({ color:c, border:`1px solid ${c}`, padding:'3px 8px', borderRadius:'4px', fontSize:'10px', textDecoration:'none', textAlign:'center', display:'inline-block' });
const tabGroupStyle = { display:'flex', gap:'2px', marginBottom:'10px' };
const tabBtnStyle = { flex:1, padding:'10px 0', border:'1px solid #333', fontSize:'10px' };
const comboCardStyle = { background:'#111', padding:'12px', borderRadius:'8px', marginBottom:'10px', border:'1px solid #333' };
const comboInput = { width:'100%', background:'#000', color:'#fff', border:'1px solid #444', padding:'5px', fontSize:'11px' };
const miniBtnStyle = { border:'none', color:'#fff', fontSize:'8px', padding:'2px 6px', borderRadius:'3px' };
const mainTextAreaStyle = { width:'100%', height:'150px', background:'#000', color:'#eee', padding:'10px', border:'1px solid #333' };
const aiOverlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', color:'#0ff' };
const adviceStyle = { position:'fixed', bottom:'20px', left:'10px', right:'10px', background:'#022', border:'1px solid #0ff', padding:'12px', borderRadius:'8px', color:'#fff', fontSize:'11px', zIndex:1000 };
const circleBtn = { background:'transparent', border:'1px solid #0ff', color:'#0ff', borderRadius:'50%', width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center' };
const controlToggleStyle = { display:'flex', background:'#000', borderRadius:'4px', padding:'1px', border:'1px solid #333' };
const toggleBtn = { border:'none', fontSize:'9px', padding:'2px 6px' };
const battleSection = { background:'#111', borderRadius:'8px', padding:'10px', border:'1px solid #222', marginBottom:'10px' };
const battleHeader = { fontSize:'11px', fontWeight:'bold', color:'#0ff', marginBottom:'8px', borderBottom:'1px solid #333' };
const sectionTitle = { fontSize:'11px', color:'#fc0', marginBottom:'8px', marginTop:'5px' };
const trainingCard = { background:'#1a1a1a', padding:'8px', borderRadius:'6px', marginBottom:'8px', borderLeft:'3px solid #f44' };
