import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Builder from './Builder'
import Stats from './Stats'
import Admin from './Admin'
import Overview from './Overview'

export default function DashboardRoot({user, setUser}){
  return (
    <div className='flex h-screen p-6 gap-6'>
      <aside className='w-64 bg-black/60 p-4 rounded-lg'>
        <div className='mb-4'><img src={user?.avatar || '/static/default-avatar.png'} className='w-12 h-12 rounded' /><div className='mt-2 font-bold'>{user?.username}</div><div className='text-sm opacity-70'>{(user?.roles && user.roles.length)? user.roles.join(', '): 'Membro'}</div></div>
        <nav className='flex flex-col gap-2'>
          <Link to='' className='p-2 bg-white/5 rounded'>Overview</Link>
          <Link to='builder' className='p-2 bg-white/5 rounded'>Builder</Link>
          <Link to='stats' className='p-2 bg-white/5 rounded'>Estatísticas</Link>
          <Link to='admin' className='p-2 bg-white/5 rounded'>Admin</Link>
          <a href='/auth/logout' className='p-2 bg-red-600 rounded mt-4 text-center'>Sair</a>
        </nav>
      </aside>
      <main className='flex-1 overflow-auto'>
        <Routes>
          <Route index element={<Overview />} />
          <Route path='builder' element={<Builder user={user} />} />
          <Route path='stats' element={<Stats />} />
          <Route path='admin' element={<Admin user={user} />} />
        </Routes>
      </main>
    </div>
  )
}