import { useEffect, useState } from "react";
import "../styles/usuarios.css";
import logo from "../assets/logo.png";

const API_USUARIOS_URL = "http://localhost:8080/api/usuarios";
const API_ROLES_URL = "http://localhost:8080/api/roles";

export default function Usuarios({ usuarioActual, onIrDashboard }) {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [modalAbierto, setModalAbierto] = useState(false);

    const [nombreCompleto, setNombreCompleto] = useState("");
    const [documento, setDocumento] = useState("");
    const [correo, setCorreo] = useState("");
    const [telefono, setTelefono] = useState("");
    const [password, setPassword] = useState("");
    const [rolId, setRolId] = useState("");

    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [esError, setEsError] = useState(false);

    const cargarDatos = async () => {
        try {
            const [resUsuarios, resRoles] = await Promise.all([
                fetch(API_USUARIOS_URL),
                fetch(API_ROLES_URL),
            ]);

            if (resUsuarios.ok) {
                const dataUsuarios = await resUsuarios.json();
                setUsuarios(Array.isArray(dataUsuarios) ? dataUsuarios : []);
            }

            if (resRoles.ok) {
                const dataRoles = await resRoles.json();
                setRoles(Array.isArray(dataRoles) ? dataRoles : []);
            }
        } catch {
            setEsError(true);
            setMensaje("No se pudieron cargar los usuarios o roles desde el backend.");
        }
    };

    useEffect(() => {
        let montado = true;

        const inicializar = async () => {
            try {
                const [resUsuarios, resRoles] = await Promise.all([
                    fetch(API_USUARIOS_URL),
                    fetch(API_ROLES_URL),
                ]);

                if (!montado) return;

                if (resUsuarios.ok) {
                    const dataUsuarios = await resUsuarios.json();
                    setUsuarios(Array.isArray(dataUsuarios) ? dataUsuarios : []);
                }

                if (resRoles.ok) {
                    const dataRoles = await resRoles.json();
                    setRoles(Array.isArray(dataRoles) ? dataRoles : []);
                }
            } catch {
                if (montado) {
                    setEsError(true);
                    setMensaje("No se pudieron cargar los usuarios o roles desde el backend.");
                }
            }
        };

        void inicializar();

        return () => {
            montado = false;
        };
    }, []);

    const abrirModal = () => {
        setNombreCompleto("");
        setDocumento("");
        setCorreo("");
        setTelefono("");
        setPassword("");
        setRolId("");
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
    };

    const manejarCrearUsuario = async (e) => {
        e.preventDefault();
        setCargando(true);
        setEsError(false);
        setMensaje("");

        const nuevoUsuario = {
            nombre_completo: nombreCompleto.trim(),
            documento: documento.trim() || "0000000000",
            correo: correo.trim(),
            telefono: telefono.trim() || "0000000000",
            password_hash: password,
            estado: "ACTIVO",
            rol: {
                id_rol: Number(rolId),
            },
        };

        try {
            const respuesta = await fetch(API_USUARIOS_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(nuevoUsuario),
            });

            if (!respuesta.ok) {
                const errorData = await respuesta.json().catch(() => ({}));
                setCargando(false);
                setEsError(true);
                setMensaje(errorData.mensaje || "No se pudo registrar el usuario.");
                return;
            }

            setCargando(false);
            setModalAbierto(false);
            setEsError(false);
            setMensaje("Usuario creado exitosamente.");
            await cargarDatos();
        } catch {
            setCargando(false);
            setEsError(true);
            setMensaje("Error de conexión con el servidor al guardar el usuario.");
        }
    };

    const usuariosFiltrados = usuarios.filter((u) => {
        const texto = busqueda.toLowerCase();
        const nombre = (u.nombre_completo || "").toLowerCase();
        const email = (u.correo || "").toLowerCase();
        return nombre.includes(texto) || email.includes(texto);
    });

    const srcLogo = typeof logo === "string" ? logo : String(logo);

    return (
        <div className="usuarios-page">
            <header className="app-header">
                <div className="header-container">
                    <div className="logo-area">
                        <img src={srcLogo} alt="Gestión 360" className="header-logo" />
                    </div>

                    <nav className="nav-links">
                        <button
                            type="button"
                            className="nav-item"
                            onClick={() => {
                                if (typeof onIrDashboard === "function") {
                                    onIrDashboard();
                                }
                            }}
                        >
                            Dashboard
                        </button>
                        <button type="button" className="nav-item active">
                            Usuarios
                        </button>
                        <button type="button" className="nav-item">
                            Inventario
                        </button>
                        <button type="button" className="nav-item">
                            Ventas
                        </button>
                    </nav>

                    <div className="user-profile">
                        <span className="user-avatar">👤</span>
                        <span className="user-name">{usuarioActual || "Administrador"}</span>
                    </div>
                </div>
            </header>

            <main className="container">
                <div className="page-header">
                    <div>
                        <h1>Gestión de Usuarios</h1>
                        <p className="subtitle">Administra los accesos y roles del personal del ERP</p>
                    </div>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={abrirModal}
                    >
                        + Crear Nuevo Usuario
                    </button>
                </div>

                {mensaje && (
                    <div className={`feedback-banner ${esError ? "error" : "exito"}`}>
                        {mensaje}
                    </div>
                )}

                <section className="card">
                    <div className="table-toolbar">
                        <input
                            type="text"
                            placeholder="🔍 Buscar por nombre o correo..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    <table className="data-table">
                        <thead>
                        <tr>
                            <th>Nombre Completo</th>
                            <th>Correo Electrónico</th>
                            <th>Rol Asignado</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {usuariosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="5">No hay usuarios registrados o que coincidan con la búsqueda.</td>
                            </tr>
                        ) : (
                            usuariosFiltrados.map((user, index) => {
                                const nombreRol = user.rol?.nombre_rol || "Sin rol";
                                const esAdmin = nombreRol.toUpperCase().includes("ADMIN");
                                const activo = (user.estado || "").toUpperCase() === "ACTIVO";

                                return (
                                    <tr key={user.id_usuario ?? index}>
                                        <td>
                                            <strong>{user.nombre_completo}</strong>
                                        </td>
                                        <td>{user.correo}</td>
                                        <td>
                        <span className={`badge ${esAdmin ? "badge-admin" : "badge-user"}`}>
                          {nombreRol}
                        </span>
                                        </td>
                                        <td>
                        <span className={activo ? "status-active" : "status-inactive"}>
                          ● {activo ? "Activo" : user.estado || "Inactivo"}
                        </span>
                                        </td>
                                        <td className="action-links">
                                            <button type="button" className="btn-edit">
                                                Editar
                                            </button>
                                            <button type="button" className="btn-delete">
                                                Desactivar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </section>
            </main>

            {modalAbierto && (
                <div
                    className="modal-overlay"
                    onClick={(e) => {
                        if (e.target.classList.contains("modal-overlay")) {
                            cerrarModal();
                        }
                    }}
                >
                    <div className="modal-card">
                        <header className="modal-header">
                            <h2>Registrar Nuevo Usuario</h2>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={cerrarModal}
                                aria-label="Cerrar modal"
                            >
                                &times;
                            </button>
                        </header>

                        <form onSubmit={manejarCrearUsuario} className="modal-body">
                            <div className="form-group">
                                <label htmlFor="fullname">Nombre Completo</label>
                                <input
                                    type="text"
                                    id="fullname"
                                    name="fullname"
                                    placeholder="Ej: Carlos Ramírez"
                                    value={nombreCompleto}
                                    onChange={(e) => setNombreCompleto(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Correo Electrónico</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="carlos@empresa.com"
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label htmlFor="password">Contraseña Inicial</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group flex-1">
                                    <label htmlFor="role">Rol del Sistema</label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={rolId}
                                        onChange={(e) => setRolId(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>
                                            Selecciona un rol
                                        </option>
                                        {roles.map((r) => (
                                            <option key={r.id_rol} value={r.id_rol}>
                                                {r.nombre_rol}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <footer className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={cerrarModal}
                                    disabled={cargando}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit" disabled={cargando}>
                                    {cargando ? "Guardando..." : "Guardar Usuario"}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}