// Simple pill nav (React UMD) - use by including <div id='pillnav'></div> and render
window.PillNav = ({ logo, items }) => {
  return (
    <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <img src={logo} className="w-10 h-10 rounded-full" alt="logo"/>
        <div className="hidden md:flex space-x-2">
          {items.map(it => <a key={it.href} href={it.href} className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-purple-700">{it.label}</a>)}
        </div>
      </div>
    </div>
  );
};
