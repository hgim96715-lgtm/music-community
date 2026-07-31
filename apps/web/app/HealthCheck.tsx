'use client';

import { useEffect, useState } from 'react';

export default function HealthCheck() {
  const [health, setHealth] = useState<string>('loading...');

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setHealth('error: NEXT_PUBLIC_API_URL is not set');
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(`${apiUrl}/health`, { credentials: 'include' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (!cancelled) setHealth(JSON.stringify(data));
      } catch (e) {
        if (!cancelled) {
          setHealth(`error: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold">API Health</h1>
      <pre className="mt-2 rounded bg-neutral-100 p-4 text-sm">{health}</pre>
    </div>
  );
}
