import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [usuarioActivo, setUsuarioActivo] = useState("");

  const manejarLoginExitoso = (correoIngresado) => {
    setUsuarioActivo(correoIngresado);
    setEstaAutenticado(true);
  };

  const manejarCerrarSesion = () => {
    setUsuarioActivo("");
    setEstaAutenticado(false);
  };

  if (!estaAutenticado) {
    return <Login onLoginExitoso={manejarLoginExitoso} />;
  }

  return (
      <Dashboard
          usuarioCorreo={usuarioActivo}
          onCerrarSesion={manejarCerrarSesion}
      />
  );
}