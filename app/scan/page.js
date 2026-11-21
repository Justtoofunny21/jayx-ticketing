'use client';
import { useEffect, useRef, useState } from 'react';

export default function Scan() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState(null);
  const [code, setCode] = useState('');
  const video = useRef(null);
  const busy = useRef(false);

  async function login(e) {
    e.preventDefault(); setMsg('');
    const r = await fetch('/api/scan/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    if (r.ok) setAuthed(true); else setMsg((await r.json()).error || 'Failed');
  }

  async function check(c) {
    if (busy.current) return; busy.current = true;
    try {
      const r = await fetch('/api/scan/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: c }) });
      if (r.status === 401) { setAuthed(false); return; }
      setResult(await r.json());
    } finally { setTimeout(() => { busy.current = false; }, 2500); }
  }

  useEffect(() => {
    if (!authed || !('BarcodeDetector' in window)) return;
    let stream, stop = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.current.srcObject = stream; await video.current.play();
        const det = new window.BarcodeDetector({ formats: ['qr_code'] });
        const tick = async () => {
          if (stop) return;
          try { const f = await det.detect(video.current); if (f[0]) await check(f[0].rawValue); } catch {}
          setTimeout(tick, 400);
        };
        tick();
      } catch { setMsg('Camera unavailable — type the ID instead.'); }
    })();
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [authed]);

  if (!authed) return (
    <main><h1>Staff scan</h1>
      <form className="card" onSubmit={login}>
        <label>Staff password</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        <button>Sign in</button>{msg && <div className="err">{msg}</div>}
      </form></main>);

  const cls = result?.status === 'valid' ? 'ok' : result?.status === 'used' ? 'warn' : 'no';
  return (
    <main><h1>Scan tickets</h1>
      <video ref={video} playsInline muted style={{ width: '100%', borderRadius: 16, background: '#000' }} />
      {msg && <div className="err">{msg}</div>}
      <form className="card" onSubmit={(e) => { e.preventDefault(); check(code); }}>
        <label>Or type ticket ID</label>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="JX-XXXX-XXXX-XXXX" autoCapitalize="characters" />
        <button>Check</button>
      </form>
      {result && (
        <div className={`big ${cls}`}>
          {result.status === 'valid' && <>✅ VALID<div style={{ fontSize: 16 }}>{result.name} · {result.tier}</div></>}
          {result.status === 'used' && <>⚠️ ALREADY USED<div style={{ fontSize: 16 }}>{result.name} · {new Date(result.usedAt).toLocaleTimeString()}</div></>}
          {result.status === 'invalid' && <>❌ INVALID</>}
        </div>)}
    </main>);
}
