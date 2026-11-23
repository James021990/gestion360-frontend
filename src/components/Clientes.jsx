import { useEffect, useState } from "react";
import Header from "./Header";
import "../styles/factura.css";

const API_CLIENTES_URL = "http://localhost:8080/api/clientes";

const FORMULARIO_INICIAL = {
    nit_o_cc: "",
    nombre_o_razon_social: "",
    correo: "",
    telefono: "",
    direccion: "",
};

export default function Clientes({
                                     usuarioActual,
                                     onIrDashboard,
                                     onIrUsuarios,
                                     onIrInventario,
                                     onIrNuevaVenta,
                                     onIrHistorialFacturas,
                                 }) {
    const [clientes, setClientes] = useState([]);
    const [formData, setFormData] = useState(FORMULARIO_INICIAL);
    const [clienteEditandoId, setClienteEditandoId] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [mensaje, setMensaje] = useState("");
    const [esError, setEsError] = useState(false);

    const obtenerIdCliente = (cli) => cli?.id_clientes ?? cli?.idCliente ?? cli?.id;
    const obtenerNit = (cli) => cli?.nit_o_cc ?? cli?.nitOCc ?? "";
    const obtenerNombre = (cli) => cli?.nombre_o_razon_social ?? cli?.nombreORazonSocial ?? "";

    const cargarClientes = async () => {
        setCargando(true);
        setMensaje("");
        try {
            const res = await fetch(API_CLIENTES_URL);
            if (!res.ok) {
                throw new Error(`Error al consultar clientes (${res.status})`);
            }
            const data = await res.json();
            setClientes(Array.isArray(data) ? data : []);
        } catch (error) {
            setEsError(true);
            setMensaje(`No se pudieron cargar los clientes: ${error.message}`);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarClientes();
    }, []);

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const limpiarFormulario = () => {
        setFormData(FORMULARIO_INICIAL);
        setClienteEditandoId(null);
    };

    const iniciarEdicion = (cli) => {
        setMensaje("");
        setEsError(false);
        setClienteEditandoId(obtenerIdCliente(cli));
        setFormData({
            nit_o_cc: obtenerNit(cli),
            nombre_o_razon_social: obtenerNombre(cli),
            correo: cli?.correo || "",
            telefono: cli?.telefono || "",
            direccion: cli?.direccion || "",
        });
    };

    const guardarCliente = async (e) => {
        e.preventDefault();
        setMensaje("");
        setEsError(false);

        if (!formData.nit_o_cc.trim() || !formData.nombre_o_razon_social.trim()) {
            setEsError(true);
            setMensaje("El NIT/CC y el Nombre o Razón Social son obligatorios.");
            return;
        }

        setGuardando(true);

        const payload = {
            nit_o_cc: formData.nit_o_cc.trim(),
            nombre_o_razon_social: formData.nombre_o_razon_social.trim(),
            correo: formData.correo.trim(),
            telefono: formData.telefono.trim(),
            direccion: formData.direccion.trim(),
        };

        const esEdicion = clienteEditandoId !== null && clienteEditandoId !== undefined;
        const url = esEdicion ? `${API_CLIENTES_URL}/${clienteEditandoId}` : API_CLIENTES_URL;
        const method = esEdicion ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const textoError = await res.text();
                throw new Error(textoError || `Error al guardar cliente (${res.status})`);
            }

            const clienteGuardado = await res.json();

            if (esEdicion) {
                setClientes((prev) =>
                    prev.map((c) =>
                        obtenerIdCliente(c) === clienteEditandoId ? clienteGuardado : c
                    )
                );
                setMensaje("Cliente actualizado correctamente.");
            } else {
                setClientes((prev) => [clienteGuardado, ...prev]);
                setMensaje("Cliente registrado con éxito en la base de datos.");
            }

            setEsError(false);
            limpiarFormulario();
        } catch (error) {
            setEsError(true);
            setMensaje(`Error al guardar cliente: ${error.message}`);
        } finally {
            setGuardando(false);
        }
    };

    const eliminarCliente = async (cli) => {
        const id = obtenerIdCliente(cli);
        if (!id) return;

        if (!window.confirm(`¿Deseas eliminar a "${obtenerNombre(cli) || "este cliente"}"?`)) {
            return;
        }

        setMensaje("");
        try {
            const res = await fetch(`${API_CLIENTES_URL}/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const textoError = await res.text();
                throw new Error(textoError || `Error al eliminar cliente (${res.status})`);
            }

            setClientes((prev) => prev.filter((c) => obtenerIdCliente(c) !== id));
            if (clienteEditandoId === id) {
                limpiarFormulario();
            }
            setEsError(false);
            setMensaje("Cliente eliminado correctamente.");
        } catch (error) {
            setEsError(true);
            setMensaje(`No se pudo eliminar el cliente: ${error.message}`);
        }
    };

    const clientesFiltrados = clientes.filter((cli) => {
        const texto = busqueda.toLowerCase();
        return (
            obtenerNombre(cli).toLowerCase().includes(texto) ||
            obtenerNit(cli).toLowerCase().includes(texto) ||
            (cli?.correo || "").toLowerCase().includes(texto) ||
            (cli?.telefono || "").toLowerCase().includes(texto)
        );
    });

    const nombreUsuarioMostrar =
        typeof usuarioActual === "string"
            ? usuarioActual
            : usuarioActual?.nombre || usuarioActual?.email || "Usuario";

    return (
        <div className="ventas-page">
            <Header
                vistaActiva="ventas"
                nombreUsuario={nombreUsuarioMostrar}
                onIrDashboard={onIrDashboard}
                onIrUsuarios={onIrUsuarios}
                onIrInventario={onIrInventario}
            />

            <main className="container">
                <div className="page-header">
                    <div>
                        <h1>Gestión de Clientes</h1>
                        <p className="subtitle">Registro y consulta de clientes para facturación</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {onIrNuevaVenta && (
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={onIrNuevaVenta}
                            >
                                ⚡ Nueva Venta
                            </button>
                        )}
                        {onIrHistorialFacturas && (
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={onIrHistorialFacturas}
                            >
                                📄 Historial
                            </button>
                        )}
                        <div className="invoice-number-badge">
                            <span>Total:</span>
                            <strong>{clientes.length}</strong>
                        </div>
                    </div>
                </div>

                {mensaje && (
                    <div className={`feedback-banner ${esError ? "error" : "exito"}`}>
                        {mensaje}
                    </div>
                )}

                <div className="invoice-grid">
                    <section className="left-panel">
                        <div className="card client-card">
                            <h2 className="card-title">
                                {clienteEditandoId ? "✏️ Editar Cliente" : "👤 Nuevo Cliente"}
                            </h2>

                            <form onSubmit={guardarCliente}>
                                <div className="form-row">
                                    <div className="form-group flex-1">
                                        <label htmlFor="nit_o_cc">NIT / Cédula</label>
                                        <input
                                            id="nit_o_cc"
                                            name="nit_o_cc"
                                            type="text"
                                            placeholder="Ej. 1098234567 o 900123456-1"
                                            value={formData.nit_o_cc}
                                            onChange={manejarCambio}
                                            required
                                        />
                                    </div>
                                    <div className="form-group flex-1">
                                        <label htmlFor="telefono">Teléfono</label>
                                        <input
                                            id="telefono"
                                            name="telefono"
                                            type="text"
                                            placeholder="Ej. 3001234567"
                                            value={formData.telefono}
                                            onChange={manejarCambio}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group flex-2">
                                        <label htmlFor="nombre_o_razon_social">Nombre o Razón Social</label>
                                        <input
                                            id="nombre_o_razon_social"
                                            name="nombre_o_razon_social"
                                            type="text"
                                            placeholder="Nombre completo o razón social"
                                            value={formData.nombre_o_razon_social}
                                            onChange={manejarCambio}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group flex-1">
                                        <label htmlFor="correo">Correo Electrónico</label>
                                        <input
                                            id="correo"
                                            name="correo"
                                            type="email"
                                            placeholder="cliente@correo.com"
                                            value={formData.correo}
                                            onChange={manejarCambio}
                                        />
                                    </div>
                                    <div className="form-group flex-1">
                                        <label htmlFor="direccion">Dirección</label>
                                        <input
                                            id="direccion"
                                            name="direccion"
                                            type="text"
                                            placeholder="Dirección o municipio"
                                            value={formData.direccion}
                                            onChange={manejarCambio}
                                        />
                                    </div>
                                </div>

                                <div className="action-buttons" style={{ marginTop: "16px" }}>
                                    {clienteEditandoId && (
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={limpiarFormulario}
                                            disabled={guardando}
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={guardando}
                                    >
                                        {guardando
                                            ? "Guardando..."
                                            : clienteEditandoId
                                                ? "💾 Actualizar Cliente"
                                                : "➕ Guardar Cliente"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    <section className="right-panel">
                        <div className="card cart-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
                                <h2 className="card-title" style={{ margin: 0 }}>📋 Clientes Registrados</h2>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={cargarClientes}
                                    disabled={cargando}
                                >
                                    🔄 Actualizar
                                </button>
                            </div>

                            <div className="search-box" style={{ marginBottom: "14px" }}>
                                <input
                                    type="text"
                                    placeholder="Buscar por NIT/CC, nombre, correo o teléfono..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </div>

                            <div className="table-responsive">
                                <table className="cart-table">
                                    <thead>
                                    <tr>
                                        <th>NIT / CC</th>
                                        <th>Nombre / Razón Social</th>
                                        <th>Contacto</th>
                                        <th>Dirección</th>
                                        <th>Acciones</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {cargando ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
                                                Cargando clientes...
                                            </td>
                                        </tr>
                                    ) : clientesFiltrados.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>
                                                No hay clientes registrados que coincidan con la búsqueda.
                                            </td>
                                        </tr>
                                    ) : (
                                        clientesFiltrados.map((cli) => {
                                            const id = obtenerIdCliente(cli);
                                            return (
                                                <tr key={id || obtenerNit(cli)}>
                                                    <td><strong>{obtenerNit(cli)}</strong></td>
                                                    <td>
                                                        <strong>{obtenerNombre(cli)}</strong>
                                                    </td>
                                                    <td>
                                                        <div>{cli?.correo || "—"}</div>
                                                        <small>{cli?.telefono || "—"}</small>
                                                    </td>
                                                    <td>{cli?.direccion || "—"}</td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <button
                                                            type="button"
                                                            className="btn-secondary"
                                                            style={{ marginRight: "6px" }}
                                                            onClick={() => iniciarEdicion(cli)}
                                                            title="Editar"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-remove"
                                                            onClick={() => eliminarCliente(cli)}
                                                            title="Eliminar"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}