// Chart wrapper using Chart.js
window.ChartComponent = ({ period='7d' }) => {
  const ref = React.useRef(null);
  React.useEffect(()=>{
    const ctx = ref.current.getContext('2d');
    if(window._chart) window._chart.destroy();
    window._chart = new Chart(ctx, {
      type: 'line',
      data: { labels: ['-6','-5','-4','-3','-2','-1','0'], datasets: [{ label: 'Usuários', data: [12,20,8,15,30,10,25], fill:false, tension:0.3 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }
    });
    return ()=>{ if(window._chart) window._chart.destroy(); };
  }, [period]);
  return <div style={{height:240}} className="rounded overflow-hidden bg-neutral-800 p-4"><canvas ref={ref}></canvas></div>;
};
