import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Shortner from "./pages/Shortner";
import Builders from "./pages/Builders";  // Corrigido para Builders.jsx
import Admin from "./pages/Admin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/shortner" element={<Shortner />} />
        <Route path="/builder" element={<Builders />} />  {/* Alterado aqui */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
