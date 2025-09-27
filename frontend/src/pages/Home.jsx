import React from 'react'
export default function Home({user}){
  return (
    <div className='flex items-center justify-center h-screen relative'>
      <canvas className='canvas-bg' id='glitchCanvas'></canvas>
      <div className='app-root text-center p-6'>
        <h1 className='text-6xl font-bold mb-4'>LUMA METHODS</h1>
        <p className='mb-6'>Painel moderno. Faça login com Discord para continuar.</p>
        {!user ? <a className='px-6 py-3 bg-blue-600 rounded' href='/auth/discord' onClick={(e)=>{ /* open popup handled by backend if needed */ }}>Login com Discord</a> :
          <a className='px-6 py-3 bg-green-600 rounded' href='/dashboard'>Ir ao Dashboard</a>
        }
      </div>
      <script dangerouslySetInnerHTML={{__html:`(${glitchScript.toString()})()`}} />
    </div>
  )
}
function glitchScript(){
  const canvas = document.getElementById('glitchCanvas'); if(!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
  resize(); addEventListener('resize', resize);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*()';
  const fontSize = 14; let cols = Math.floor(canvas.width/fontSize); let drops = Array(cols).fill(1);
  function draw(){ ctx.fillStyle='rgba(0,0,0,0.06)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#fff'; ctx.font=fontSize+'px monospace';
    for(let i=0;i<drops.length;i++){ ctx.fillText(chars[Math.floor(Math.random()*chars.length)], i*fontSize, drops[i]*fontSize); if(drops[i]*fontSize>canvas.height && Math.random()>0.975) drops[i]=0; drops[i]++; } }
  setInterval(draw,60);
}