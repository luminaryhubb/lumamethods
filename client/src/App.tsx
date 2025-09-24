import React, { useEffect, useState } from 'react';

const TextType: React.FC<any> = ({ text = 'LumaPad', className = '', typingSpeed = 80 }) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayed(prev => prev + text[index]);
      index++;
      if (index >= text.length) clearInterval(interval);
    }, typingSpeed);
    return () => clearInterval(interval);
  }, []);
  return <h1 className={className}>{displayed}</h1>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // on mount, get user if logged
    fetch('/api/user').then(r => r.json()).then(data => {
      if (data.logged) setUser(data);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // if server redirected to /welcome, client route '/welcome' will be loaded, so fetch user again
    if (window.location.pathname === '/welcome') {
      fetch('/api/user').then(r => r.json()).then(data => {
        if (data.logged) setUser(data);
        // push state to root after reading
        window.history.replaceState({}, '', '/');
      }).catch(()=>{});
    }
  }, []);

  const handleDiscordLogin = () => {
    // Redirect to backend auth route
    window.location.href = '/auth/discord';
  };

  if (user) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div style={{background:'#000', padding:'40px'}} className="rounded">
            <h1 className="text-4xl">Bem vindo {user.username}!</h1>
          </div>
          <div className="mt-6">
            <a href="/auth/logout" className="px-4 py-2 bg-gray-700 rounded">Sair</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <TextType text="LumaPad" className="text-6xl font-bold mb-6" />
        <button onClick={handleDiscordLogin} className="bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold py-3 px-8 rounded-lg text-lg">
          Login with Discord
        </button>
      </div>
    </div>
  );
};

export default App;
