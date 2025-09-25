
import { useState } from 'react';

export default function Shortner() {
  const [url, setUrl] = useState('');
  const [short, setShort] = useState('');

  const submit = async () => {
    const res = await fetch('/api/shortner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    setShort(data.short);
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">URL Shortner</h1>
      <input
        className="border p-2 mr-2"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Cole sua URL"
      />
      <button onClick={submit} className="bg-blue-500 text-white px-4 py-2 rounded">
        Encurtar
      </button>
      {short && <p className="mt-4">Seu link: <a href={short}>{short}</a></p>}
    </div>
  );
}
