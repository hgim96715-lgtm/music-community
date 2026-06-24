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

    fetch(`${apiUrl}/health`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setHealth(JSON.stringify(data)))
      .catch((e) =>
        setHealth(`error: ${e instanceof Error ? e.message : String(e)}`),
      );
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold">API Health</h1>
      <pre className="mt-2 rounded bg-neutral-100 p-4 text-sm">{health}</pre>
    </div>
  );
}
