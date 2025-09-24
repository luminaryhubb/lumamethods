import React from 'react';

const App: React.FC = () => {
  const handleDiscordLogin = () => {
    window.location.href = '/auth/discord';  // Redireciona para o login com Discord
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h1 className="text-6xl mb-8">LumaPad</h1>
      <button
        onClick={handleDiscordLogin}
        className="bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold py-3 px-8 rounded-lg text-lg flex items-center gap-3 transition-all duration-300"
      >
        Login with Discord
      </button>
    </div>
  );
};

export default App;
