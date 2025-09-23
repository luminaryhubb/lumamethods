import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Shortener from "./pages/Shortener.jsx";
import FakeLink from "./pages/FakeLink.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminPastes from "./pages/admin/AdminPastes.jsx";
import AdminConfig from "./pages/admin/AdminConfig.jsx";
import NotFound from "./pages/NotFound.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* Página inicial */}
        <Route path="/" element={<Home />} />

        {/* Link Fake */}
        <Route path="/fake-link" element={<FakeLink />} />

        {/* Encurtador */}
        <Route path="/shortener" element={<Shortener />} />

        {/* Painel Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/pastes" element={<AdminPastes />} />
        <Route path="/admin/config" element={<AdminConfig />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
