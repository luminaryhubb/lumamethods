import React, { useRef, useState } from 'react';
const SpotlightCard = ({ children, className = '', spotlightColor = 'rgba(255,255,255,0.25)' })=>{
  const divRef = useRef(null);
  const [pos,setPos] = useState({x:0,y:0});
  const [opacity,setOpacity] = useState(0);
  return (
    <div ref={divRef} onMouseMove={(e)=>{const r=divRef.current.getBoundingClientRect(); setPos({x:e.clientX-r.left,y:e.clientY-r.top})}} onMouseEnter={()=>setOpacity(0.6)} onMouseLeave={()=>setOpacity(0)} className={'relative rounded-3xl border p-6 '+className}>
      <div style={{position:'absolute',inset:0,background:`radial-gradient(circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 60%)`,opacity}} className="pointer-events-none transition-opacity"></div>
      {children}
    </div>
  );
};
export default SpotlightCard;
