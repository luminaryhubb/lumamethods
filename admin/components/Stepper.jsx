// Lightweight stepper component (no external libs)
window.Stepper = ({ steps, onComplete }) => {
  const [step, setStep] = React.useState(0);
  return (
    <div className="bg-neutral-900 rounded p-4">
      <div className="mb-4 font-semibold">Passo {step+1} / {steps.length}</div>
      <div className="mb-4">{steps[step]}</div>
      <div className="flex justify-between">
        <button onClick={()=>setStep(Math.max(0,step-1))} className="px-3 py-2 bg-gray-700 rounded">Voltar</button>
        {step < steps.length-1 ? <button onClick={()=>setStep(step+1)} className="px-3 py-2 bg-purple-600 rounded">Próximo</button> : <button onClick={onComplete} className="px-3 py-2 bg-green-600 rounded">Concluir</button>}
      </div>
    </div>
  );
};
