window.Sidebar = ({ page, setPage }) => {
  const items = ['Dashboard','Pastes','Builders','Users','Config'];
  return (
    <div className="w-72 p-6 bg-neutral-900 h-screen sticky top-0">
      <h2 className="text-2xl font-bold mb-6">Admin</h2>
      {items.map(i => (
        <button key={i} onClick={() => setPage(i)} className={'block w-full text-left mb-2 p-3 rounded ' + (page===i ? 'bg-purple-700' : 'hover:bg-purple-600')}>
          {i}
        </button>
      ))}
      <div className="mt-8">
        <button onClick={() => { fetch('/auth/logout').then(()=>location.href='/') }} className="px-4 py-2 bg-gray-700 rounded">Logout</button>
      </div>
    </div>
  );
};
