import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Usuarios from "./components/Usuarios";

export default function App() {
  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [usuarioActivo, setUsuarioActivo] = useState("");
  const [vistaActual, setVistaActual] = useState("dashboard");

  const manejarLoginExitoso = (correoIngresado) => {
    setUsuarioActivo(correoIngresado);
    setVistaActual("dashboard");
    setEstaAutenticado(true);
  };

  const manejarCerrarSesion = () => {
    setUsuarioActivo("");
    setVistaActual("dashboard");
    setEstaAutenticado(false);
  };

  if (!estaAutenticado) {
    return <Login onLoginExitoso={manejarLoginExitoso} />;
  }

  if (vistaActual === "usuarios") {
    return (
        <Usuarios
            usuarioActual={usuarioActivo}
            onIrDashboard={() => setVistaActual("dashboard")}
        />
    );
  }

  return (
      <Dashboard
          usuarioCorreo={usuarioActivo}
          onIrUsuarios={() => setVistaActual("usuarios")}
          onCerrarSesion={manejarCerrarSesion}
      />
  );
}