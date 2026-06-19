'use client';

import { useEffect, useState } from 'react';

export default function HealthCheck() {
  const [health, setHealth] = useState<string>('loading...');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((data) => setHealth(JSON.stringify(data)))
      .catch((e) => setHealth(`error: ${e.message}`));
  }, []);

  return (
    <div>
      <h1>API Health</h1>
      <pre>{health}</pre>
    </div>
  );
}