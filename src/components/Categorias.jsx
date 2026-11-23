import { useEffect, useState } from "react";
import Header from "./Header";
import "../styles/categorias.css";

const API_CATEGORIAS_URL = "http://localhost:8080/api/categorias";

const FORMULARIO_INICIAL = {
    nombre_categoria: "",
};

export default function Categorias({
                                       usuarioActual,
                                       onIrDashboard,
                                       onIrUsuarios,
                                       onIrInventario,
                                       onIrNuevaVenta,
                                       onIrHistorialFacturas,
                                   }) {
    const [categorias, setCategorias] = useState([]);
    const [formData, setFormData] = useState(FORMULARIO_INICIAL);
    const [categoriaEditandoId, setCategoriaEditandoId] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [mensaje, setMensaje] = useState("");
    const [esError, setEsError] = useState(false);

    const obtenerId = (cat) => cat?.id_categoria ?? cat?.idCategoria ?? cat?.id;
    const obtenerNombre = (cat) => cat?.nombre_categoria ?? cat?.nombreCategoria ?? cat?.nombre ?? "";

    const cargarCategorias = async () => {
        setCargando(true);
        setMensaje("");
        setEsError(false);
        try {
            const res = await fetch(API_CATEGORIAS_URL);
            if (!res.ok) {
                throw new Error(`Error al consultar categorías (${res.status})`);
            }
            const data = await res.json();
            setCategorias(Array.isArray(data) ? data : []);
        } catch (error) {
            setEsError(true);
            setMensaje(`No se pudieron cargar las categorías: ${error.message}`);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        let activo = true;

        const inicializarCategorias = async () => {
            try {
                const res = await fetch(API_CATEGORIAS_URL);
                if (!res.ok) {
                    throw new Error(`Error al consultar categorías (${res.status})`);
                }
                const data = await res.json();
                if (activo) {
                    setCategorias(Array.isArray(data) ? data : []);
                    setEsError(false);
                    setMensaje("");
                }
            } catch (error) {
                if (activo) {
                    setEsError(true);
                    setMensaje(`No se pudieron cargar las categorías: ${error.message}`);
                }
            } finally {
                if (activo) {
                    setCargando(false);
                }
            }
        };

        inicializarCategorias();

        return () => {
            activo = false;
        };
    }, []);

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const limpiarFormulario = () => {
        setFormData(FORMULARIO_INICIAL);
        setCategoriaEditandoId(null);
    };

    const iniciarEdicion = (cat) => {
        setMensaje("");
        setEsError(false);
        setCategoriaEditandoId(obtenerId(cat));
        setFormData({
            nombre_categoria: obtenerNombre(cat),
        });
    };

    const guardarCategoria = async (e) => {
        e.preventDefault();
        setMensaje("");
        setEsError(false);

        const nombreLimpio = formData.nombre_categoria.trim();

        if (!nombreLimpio) {
            setEsError(true);
            setMensaje("El nombre de la categoría es obligatorio.");
            return;
        }

        setGuardando(true);

        const payload = {
            nombre_categoria: nombreLimpio,
        };

        const esEdicion = categoriaEditandoId !== null && categoriaEditandoId !== undefined;
        const url = esEdicion ? `${API_CATEGORIAS_URL}/${categoriaEditandoId}` : API_CATEGORIAS_URL;
        const method = esEdicion ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const textoError = await res.text();
                throw new Error(textoError || `Error al guardar categoría (${res.status})`);
            }

            const categoriaGuardada = await res.json();

            if (esEdicion) {
                setCategorias((prev) =>
                    prev.map((c) => (obtenerId(c) === categoriaEditandoId ? categoriaGuardada : c))
                );
                setMensaje("Categoría actualizada correctamente.");
            } else {
                setCategorias((prev) => [categoriaGuardada, ...prev]);
                setMensaje("Categoría registrada con éxito en la base de datos.");
            }

            setEsError(false);
            limpiarFormulario();
        } catch (error) {
            setEsError(true);
            setMensaje(`Error al guardar categoría: ${error.message}`);
        } finally {
            setGuardando(false);
        }
    };

    const eliminarCategoria = async (cat) => {
        const id = obtenerId(cat);
        if (!id) return;

        if (!window.confirm(`¿Deseas eliminar la categoría "${obtenerNombre(cat) || "seleccionada"}"?`)) {
            return;
        }

        setMensaje("");
        try {
            const res = await fetch(`${API_CATEGORIAS_URL}/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const textoError = await res.text();
                throw new Error(textoError || `Error al eliminar categoría (${res.status})`);
            }

            setCategorias((prev) => prev.filter((c) => obtenerId(c) !== id));
            if (categoriaEditandoId === id) {
                limpiarFormulario();
            }
            setEsError(false);
            setMensaje("Categoría eliminada correctamente.");
        } catch (error) {
            setEsError(true);
            setMensaje(`No se pudo eliminar la categoría: ${error.message}`);
        }
    };

    const categoriasFiltradas = categorias.filter((cat) => {
        const texto = busqueda.toLowerCase();
        const idTexto = String(obtenerId(cat) ?? "").toLowerCase();
        return (
            obtenerNombre(cat).toLowerCase().includes(texto) ||
            idTexto.includes(texto)
        );
    });

    const nombreUsuarioMostrar =
        typeof usuarioActual === "string"
            ? usuarioActual
            : usuarioActual?.nombre || usuarioActual?.email || "Usuario";

    return (
        <div className="categorias-page">
            <Header
                vistaActiva="inventario"
                nombreUsuario={nombreUsuarioMostrar}
                onIrDashboard={onIrDashboard}
                onIrUsuarios={onIrUsuarios}
                onIrInventario={onIrInventario}
            />

            <main className="categorias-container">
                <div className="categorias-header">
                    <div>
                        <h1>Gestión de Categorías</h1>
                        <p className="categorias-subtitle">
                            Clasificación de productos y servicios para inventario y facturación
                        </p>
                    </div>

                    <div className="categorias-header-actions">
                        {onIrInventario && (
                            <button
                                type="button"
                                className="btn-cat-secondary"
                                onClick={onIrInventario}
                            >
                                📦 Inventario
                            </button>
                        )}
                        {onIrNuevaVenta && (
                            <button
                                type="button"
                                className="btn-cat-secondary"
                                onClick={onIrNuevaVenta}
                            >
                                ⚡ Nueva Venta
                            </button>
                        )}
                        {onIrHistorialFacturas && (
                            <button
                                type="button"
                                className="btn-cat-secondary"
                                onClick={onIrHistorialFacturas}
                            >
                                📄 Historial
                            </button>
                        )}
                        <div className="categorias-total-badge">
                            <span>Total:</span>
                            <strong>{categorias.length}</strong>
                        </div>
                    </div>
                </div>

                {mensaje && (
                    <div className={`categorias-banner ${esError ? "error" : "exito"}`}>
                        {mensaje}
                    </div>
                )}

                <div className="categorias-grid">
                    <section className="categorias-card">
                        <h2 className="categorias-card-title">
                            {categoriaEditandoId ? "✏️ Editar Categoría" : "🏷️ Nueva Categoría"}
                        </h2>

                        <form onSubmit={guardarCategoria}>
                            <div className="categorias-form-group">
                                <label htmlFor="nombre_categoria">Nombre de la Categoría</label>
                                <input
                                    id="nombre_categoria"
                                    name="nombre_categoria"
                                    type="text"
                                    placeholder="Ej. Software, Periféricos, Servicios"
                                    value={formData.nombre_categoria}
                                    onChange={manejarCambio}
                                    required
                                />
                            </div>

                            <div className="categorias-form-actions">
                                {categoriaEditandoId && (
                                    <button
                                        type="button"
                                        className="btn-cat-secondary"
                                        onClick={limpiarFormulario}
                                        disabled={guardando}
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="btn-cat-primary"
                                    disabled={guardando}
                                >
                                    {guardando
                                        ? "Guardando..."
                                        : categoriaEditandoId
                                            ? "💾 Actualizar Categoría"
                                            : "➕ Guardar Categoría"}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="categorias-card">
                        <div className="categorias-list-header">
                            <h2 className="categorias-card-title" style={{ margin: 0 }}>
                                📋 Categorías Registradas
                            </h2>
                            <button
                                type="button"
                                className="btn-cat-secondary"
                                onClick={cargarCategorias}
                                disabled={cargando}
                            >
                                🔄 Actualizar
                            </button>
                        </div>

                        <div className="categorias-search">
                            <input
                                type="text"
                                placeholder="Buscar por ID o nombre de categoría..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>

                        <div className="categorias-table-wrap">
                            <table className="categorias-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre de Categoría</th>
                                    <th>Acciones</th>
                                </tr>
                                </thead>
                                <tbody>
                                {cargando ? (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            style={{
                                                textAlign: "center",
                                                color: "#64748b",
                                                padding: "24px",
                                            }}
                                        >
                                            Cargando categorías...
                                        </td>
                                    </tr>
                                ) : categoriasFiltradas.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            style={{
                                                textAlign: "center",
                                                color: "#94a3b8",
                                                padding: "24px",
                                            }}
                                        >
                                            No hay categorías registradas que coincidan con la búsqueda.
                                        </td>
                                    </tr>
                                ) : (
                                    categoriasFiltradas.map((cat) => {
                                        const id = obtenerId(cat);
                                        return (
                                            <tr key={id || obtenerNombre(cat)}>
                                                <td>
                                                    <span className="cat-id-badge">#{id ?? "—"}</span>
                                                </td>
                                                <td>
                                                    <div className="cat-nombre-principal">
                                                        {obtenerNombre(cat)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="acciones-categoria">
                                                        <button
                                                            type="button"
                                                            className="btn-editar-cat"
                                                            onClick={() => iniciarEdicion(cat)}
                                                            title="Editar"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-eliminar-cat"
                                                            onClick={() => eliminarCategoria(cat)}
                                                            title="Eliminar"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}