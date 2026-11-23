import { useState } from "react";
import Dashboard from "./components/Dashboard";
import Clientes from "./components/Clientes";
import Ventas from "./components/Ventas";
import Categorias from "./components/Categorias";
import Productos from "./components/Productos";
import Usuarios from "./components/Usuarios";
import HistorialFacturas from "./components/HistorialFacturas";
import Login from "./components/Login";

export default function App() {
  const [vistaActual, setVistaActual] = useState("dashboard");
  const [usuarioActual, setUsuarioActual] = useState({
    id_usuario: 1,
    nombre: "Yeins Gómez",
    email: "yeins@gestion360.com",
  });

  const cerrarSesion = () => {
    setUsuarioActual(null);
    setVistaActual("login");
  };

  const manejarLoginExitoso = (usuarioRecibido) => {
    setUsuarioActual(
        usuarioRecibido || {
          id_usuario: 1,
          nombre: "Yeins Gómez",
          email: "yeins@gestion360.com",
        }
    );
    setVistaActual("dashboard");
  };

  const irDashboard = () => setVistaActual("dashboard");
  const irUsuarios = () => setVistaActual("usuarios");
  const irProductos = () => setVistaActual("productos");
  const irCategorias = () => setVistaActual("categorias");
  const irVentas = () => setVistaActual("ventas");
  const irHistorialFacturas = () => setVistaActual("historial-facturas");
  const irClientes = () => setVistaActual("clientes");

  if (vistaActual === "login" || !usuarioActual) {
    return <Login onLoginExitoso={manejarLoginExitoso} />;
  }

  const usuarioCorreo =
      typeof usuarioActual === "string"
          ? usuarioActual
          : usuarioActual?.email || "";

  if (vistaActual === "usuarios") {
    return (
        <Usuarios
            usuarioActual={usuarioActual}
            onIrDashboard={irDashboard}
            onIrUsuarios={irUsuarios}
            onIrInventario={irProductos}
            onIrCategorias={irCategorias}
            onIrVentas={irVentas}
            onIrHistorialFacturas={irHistorialFacturas}
            onIrClientes={irClientes}
            onCerrarSesion={cerrarSesion}
        />
    );
  }

  if (vistaActual === "productos" || vistaActual === "inventario") {
    return (
        <Productos
            usuarioActual={usuarioActual}
            onIrDashboard={irDashboard}
            onIrUsuarios={irUsuarios}
            onIrVentas={irVentas}
        />
    );
  }

  if (vistaActual === "categorias") {
    return (
        <Categorias
            usuarioActual={usuarioActual}
            onIrDashboard={irDashboard}
            onIrUsuarios={irUsuarios}
            onIrInventario={irProductos}
            onIrCategorias={irCategorias}
            onIrNuevaVenta={irVentas}
            onIrVentas={irVentas}
            onIrHistorialFacturas={irHistorialFacturas}
            onIrClientes={irClientes}
            onCerrarSesion={cerrarSesion}
        />
    );
  }

  if (vistaActual === "ventas") {
    return (
        <Ventas
            usuarioActual={usuarioActual}
            onIrDashboard={irDashboard}
            onIrUsuarios={irUsuarios}
            onIrInventario={irProductos}
            onIrCategorias={irCategorias}
            onIrVentas={irVentas}
            onIrHistorialFacturas={irHistorialFacturas}
            onIrClientes={irClientes}
            onCerrarSesion={cerrarSesion}
        />
    );
  }

  if (vistaActual === "historial-facturas") {
    return (
        <HistorialFacturas
            usuarioActual={usuarioActual}
            onIrDashboard={irDashboard}
            onIrUsuarios={irUsuarios}
            onIrInventario={irProductos}
            onIrCategorias={irCategorias}
            onIrVentas={irVentas}
            onIrHistorialFacturas={irHistorialFacturas}
            onIrClientes={irClientes}
            onCerrarSesion={cerrarSesion}
        />
    );
  }

  if (vistaActual === "clientes") {
    return (
        <Clientes
            usuarioActual={usuarioActual}
            onIrDashboard={irDashboard}
            onIrUsuarios={irUsuarios}
            onIrInventario={irProductos}
            onIrCategorias={irCategorias}
            onIrVentas={irVentas}
            onIrNuevaVenta={irVentas}
            onIrHistorialFacturas={irHistorialFacturas}
            onIrClientes={irClientes}
            onCerrarSesion={cerrarSesion}
        />
    );
  }

  return (
      <Dashboard
          usuarioCorreo={usuarioCorreo}
          onIrUsuarios={irUsuarios}
          onIrInventario={irProductos}
          onIrProductos={irProductos}
          onIrCategorias={irCategorias}
          onIrVentas={irVentas}
          onIrHistorialFacturas={irHistorialFacturas}
          onIrClientes={irClientes}
          onCerrarSesion={cerrarSesion}
      />
  );
}