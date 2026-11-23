import { useState } from "react";
import Dashboard from "./components/Dashboard";
import Ventas from "./components/Ventas";
import HistorialFacturas from "./components/HistorialFacturas";
import Clientes from "./components/Clientes";

export default function App() {
  const [vistaActual, setVistaActual] = useState("dashboard");
  const [usuarioActual, setUsuarioActual] = useState({
    id_usuario: 1,
    nombre: "Yeins Gómez",
    correo: "yeins@gestion360.com",
  });

  const irADashboard = () => setVistaActual("dashboard");
  const irANuevaVenta = () => setVistaActual("ventas");
  const irAHistorialFacturas = () => setVistaActual("historial-facturas");
  const irAClientes = () => setVistaActual("clientes");

  const irAUsuarios = () => {
    console.log("Navegar a Gestión de Usuarios");
  };

  const irAInventario = () => {
    console.log("Navegar a Inventario");
  };

  const cerrarSesion = () => {
    setUsuarioActual(null);
    setVistaActual("dashboard");
  };

  return (
      <>
        {vistaActual === "dashboard" && (
            <Dashboard
                usuarioCorreo={usuarioActual?.correo || ""}
                onIrUsuarios={irAUsuarios}
                onIrInventario={irAInventario}
                onIrVentas={irANuevaVenta}
                onIrHistorialFacturas={irAHistorialFacturas}
                onIrClientes={irAClientes}
                onCerrarSesion={cerrarSesion}
            />
        )}

        {vistaActual === "ventas" && (
            <Ventas
                usuarioActual={usuarioActual}
                onIrDashboard={irADashboard}
                onIrUsuarios={irAUsuarios}
                onIrInventario={irAInventario}
                onIrHistorialFacturas={irAHistorialFacturas}
            />
        )}

        {vistaActual === "historial-facturas" && (
            <HistorialFacturas
                usuarioActual={usuarioActual}
                onIrDashboard={irADashboard}
                onIrUsuarios={irAUsuarios}
                onIrInventario={irAInventario}
                onIrNuevaVenta={irANuevaVenta}
            />
        )}

        {vistaActual === "clientes" && (
            <Clientes
                usuarioActual={usuarioActual}
                onIrDashboard={irADashboard}
                onIrUsuarios={irAUsuarios}
                onIrInventario={irAInventario}
                onIrNuevaVenta={irANuevaVenta}
                onIrHistorialFacturas={irAHistorialFacturas}
            />
        )}
      </>
  );
}