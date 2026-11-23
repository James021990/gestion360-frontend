import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Usuarios from "./components/Usuarios";
import Productos from "./components/Productos";
import Ventas from "./components/Ventas";

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
            onIrInventario={() => setVistaActual("inventario")}
            onIrVentas={() => setVistaActual("ventas")}
        />
    );
  }

  if (vistaActual === "inventario") {
    return (
        <Productos
            usuarioActual={usuarioActivo}
            onIrDashboard={() => setVistaActual("dashboard")}
            onIrUsuarios={() => setVistaActual("usuarios")}
            onIrVentas={() => setVistaActual("ventas")}
        />
    );
  }

  if (vistaActual === "ventas") {
    return (
        <Ventas
            usuarioActual={usuarioActivo}
            onIrDashboard={() => setVistaActual("dashboard")}
            onIrUsuarios={() => setVistaActual("usuarios")}
            onIrInventario={() => setVistaActual("inventario")}
        />
    );
  }

  return (
      <Dashboard
          usuarioCorreo={usuarioActivo}
          onIrUsuarios={() => setVistaActual("usuarios")}
          onIrInventario={() => setVistaActual("inventario")}
          onIrVentas={() => setVistaActual("ventas")}
          onCerrarSesion={manejarCerrarSesion}
      />
  );
}