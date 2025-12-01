import './Login.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard"; 
import AdminDashboard from "./AdminDashboard";

/**
 * Componente para proteger rutas basado en autenticación real
 */
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const token = localStorage.getItem('token');
  
  // Verificar si el usuario está autenticado
  if (!token || !userData.id) {
    return <Navigate to="/" />;
  }
  
  // Verificar rol si se requiere uno específico
  // 1 = Administrador, 2 = Cliente
  if (requiredRole === 'admin' && userData.id_cargo !== 1) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

/**
 * Componente principal con rutas protegidas usando base de datos real
 */
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Ruta pública */}
          <Route path="/" element={<Login />} />
          
          {/* Ruta para usuarios regulares (cargo_id = 2) */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Ruta solo para administradores (cargo_id = 1) */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;