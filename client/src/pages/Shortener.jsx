import React from 'react'
export default function Shortener(){
  return (
    <div className="max-w-2xl mx-auto card p-6">
      <h3 className="font-semibold">Encurtador - Luma Methods</h3>
      <p className="text-sm text-neutral-300">Aqui é o encurtador que você já tem. Acesse o site existente.</p>
      <a href="/short" className="px-3 py-1 rounded mt-3" style={{background:'var(--purple)'}}>Abrir</a>
    </div>
  )
}
