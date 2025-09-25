import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LinkBuilder() {
  const [link, setLink] = useState('');
  const [game, setGame] = useState('');
  const [platform, setPlatform] = useState('');
  const [privateLink, setPrivateLink] = useState('');
  const [output, setOutput] = useState('');
  const [remainingUses, setRemainingUses] = useState(3);

  useEffect(() => {
    // Fetching the remaining uses for the day
    fetch('/api/user/uses-remaining')
      .then((res) => res.json())
      .then((data) => setRemainingUses(data.remainingUses));
  }, []);

  const handleGenerate = () => {
    if (remainingUses <= 0) {
      alert('Você excedeu os usos diários. Tente novamente após 00:00.');
      return;
    }

    let finalLink = '';
    if (game === 'Roblox') {
      finalLink = `<${privateLink}>[s](${link})`;
    } else if (platform === 'YouTube' || platform === 'TikTok' || platform === 'Spotify') {
      finalLink = `[${platform}.com/@${privateLink}](${link})`;
    }

    setOutput(finalLink);
    // Decrease remaining uses (Assumed backend logic to decrease daily use)
    setRemainingUses(remainingUses - 1);
  };

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Luma Builder</h1>
      {remainingUses <= 0 && <p className="text-red-500 mb-4">Você excedeu seus 3 usos diários. Tente novamente amanhã.</p>}

      <input
        type="text"
        placeholder="Link privado do Roblox"
        className="border p-2 mb-4"
        value={privateLink}
        onChange={(e) => setPrivateLink(e.target.value)}
      />
      <select
        className="border p-2 mb-4"
        value={game}
        onChange={(e) => setGame(e.target.value)}
      >
        <option value="Roblox">Roblox</option>
        {/* Other games options could be added here */}
      </select>
      <input
        type="text"
        placeholder="Link do jogo"
        className="border p-2 mb-4"
        value={link}
        onChange={(e) => setLink(e.target.value)}
      />
      <select
        className="border p-2 mb-4"
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
      >
        <option value="">Plataforma</option>
        <option value="YouTube">YouTube</option>
        <option value="TikTok">TikTok</option>
        <option value="Spotify">Spotify</option>
      </select>
      <button
        onClick={handleGenerate}
        className="bg-blue-500 text-white px-4 py-2 rounded-md"
      >
        Gerar Link
      </button>

      {output && (
        <div className="mt-4">
          <p>Link Gerado:</p>
          <input
            type="text"
            value={output}
            readOnly
            className="border p-2 mb-4"
          />
          <button className="bg-green-500 text-white px-4 py-2 rounded-md">
            Copiar Link
          </button>
        </div>
      )}
    </div>
  );
}
