const { useRef, useState } = React;
window.SpotlightCard = ({ children, className='' }) => {
  const ref = useRef(null); const [pos,setPos]=useState({x:0,y:0}); const [opa,setOpa]=useState(0);
  return (<div ref={ref} onMouseMove={(e)=>{ if(!ref.current) return; const r=ref.current.getBoundingClientRect(); setPos({x:e.clientX-r.left,y:e.clientY-r.top}); }} onMouseEnter={()=>setOpa(0.6)} onMouseLeave={()=>setOpa(0)} className={'relative rounded-3xl border border-neutral-800 bg-neutral-900 p-6 '+className}><div style={{position:'absolute',inset:0,background:`radial-gradient(circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.06), transparent 60%)`,opacity:opa}} className="pointer-events-none transition-opacity"></div>{children}</div>);
};
