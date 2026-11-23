import { useMemo, useState } from "react";
import Header from "./Header";
import "../styles/productos.css";

const PRODUCTOS_INICIALES = [
    {
        id: 1,
        codigo: "COD-001",
        nombre: "Licencia Software ERP (1 Año)",
        categoria: "Software",
        precio: 450000,
        stock: 45,
        stockMinimo: 10,
        estado: "Activo",
    },
    {
        id: 2,
        codigo: "COD-008",
        nombre: "Soporte Técnico Especializado",
        categoria: "Servicios",
        precio: 120000,
        stock: 99,
        stockMinimo: 15,
        estado: "Activo",
    },
    {
        id: 3,
        codigo: "COD-104",
        nombre: "Teclado Mecánico Ergonómico",
        categoria: "Hardware",
        precio: 180000,
        stock: 12,
        stockMinimo: 15,
        estado: "Activo",
    },
    {
        id: 4,
        codigo: "COD-105",
        nombre: "Mouse Inalámbrico Recargable",
        categoria: "Hardware",
        precio: 85000,
        stock: 30,
        stockMinimo: 10,
        estado: "Activo",
    },
    {
        id: 5,
        codigo: "COD-201",
        nombre: "Resma Papel Carta 75g",
        categoria: "Papelería",
        precio: 22000,
        stock: 4,
        stockMinimo: 10,
        estado: "Inactivo",
    },
];

const FORMULARIO_VACIO = {
    codigo: "",
    nombre: "",
    categoria: "Software",
    precio: "",
    stock: "",
    stockMinimo: "10",
    estado: "Activo",
};

const formatearMoneda = (valor) => {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(Number(valor) || 0);
};

export default function Productos({
                                      usuarioActual,
                                      onIrDashboard,
                                      onIrUsuarios,
                                      onIrVentas,
                                  }) {
    const [productos, setProductos] = useState(PRODUCTOS_INICIALES);
    const [busqueda, setBusqueda] = useState("");
    const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
    const [modalAbierto, setModalAbierto] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [mensaje, setMensaje] = useState(null);

    const categoriasDisponibles = useMemo(() => {
        const base = ["Software", "Servicios", "Hardware", "Papelería"];
        const extras = productos
            .map((p) => p.categoria)
            .filter((cat) => cat && !base.includes(cat));
        return ["Todas", ...base, ...new Set(extras)];
    }, [productos]);

    const productosFiltrados = useMemo(() => {
        return productos.filter((prod) => {
            const coincideCategoria =
                categoriaFiltro === "Todas" || prod.categoria === categoriaFiltro;

            const texto = busqueda.trim().toLowerCase();
            const coincideTexto =
                !texto ||
                prod.codigo.toLowerCase().includes(texto) ||
                prod.nombre.toLowerCase().includes(texto) ||
                prod.categoria.toLowerCase().includes(texto);

            return coincideCategoria && coincideTexto;
        });
    }, [productos, busqueda, categoriaFiltro]);

    const mostrarAlerta = (tipo, texto) => {
        setMensaje({ tipo, texto });
        setTimeout(() => {
            setMensaje(null);
        }, 3500);
    };

    const abrirModalCrear = () => {
        setProductoEditando(null);
        setFormulario(FORMULARIO_VACIO);
        setModalAbierto(true);
    };

    const abrirModalEditar = (producto) => {
        setProductoEditando(producto);
        setFormulario({
            codigo: producto.codigo,
            nombre: producto.nombre,
            categoria: producto.categoria,
            precio: String(producto.precio),
            stock: String(producto.stock),
            stockMinimo: String(producto.stockMinimo ?? 10),
            estado: producto.estado,
        });
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setProductoEditando(null);
        setFormulario(FORMULARIO_VACIO);
    };

    const manejarCambioFormulario = (e) => {
        const { name, value } = e.target;
        setFormulario((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const manejarGuardarProducto = (e) => {
        e.preventDefault();

        const codigoLimpio = formulario.codigo.trim().toUpperCase();
        const nombreLimpio = formulario.nombre.trim();
        const precioNumero = Number(formulario.precio);
        const stockNumero = Number(formulario.stock);
        const stockMinimoNumero = Number(formulario.stockMinimo) || 0;

        if (!codigoLimpio || !nombreLimpio) {
            mostrarAlerta("error", "Completa el código y el nombre del producto.");
            return;
        }

        if (Number.isNaN(precioNumero) || precioNumero < 0) {
            mostrarAlerta("error", "Ingresa un precio unitario válido.");
            return;
        }

        if (Number.isNaN(stockNumero) || stockNumero < 0) {
            mostrarAlerta("error", "Ingresa una cantidad de stock válida.");
            return;
        }

        if (productoEditando) {
            setProductos((prev) =>
                prev.map((item) =>
                    item.id === productoEditando.id
                        ? {
                            ...item,
                            codigo: codigoLimpio,
                            nombre: nombreLimpio,
                            categoria: formulario.categoria,
                            precio: precioNumero,
                            stock: stockNumero,
                            stockMinimo: stockMinimoNumero,
                            estado: formulario.estado,
                        }
                        : item
                )
            );
            mostrarAlerta("exito", `Producto "${nombreLimpio}" actualizado correctamente.`);
        } else {
            const nuevoProducto = {
                id: Date.now(),
                codigo: codigoLimpio,
                nombre: nombreLimpio,
                categoria: formulario.categoria,
                precio: precioNumero,
                stock: stockNumero,
                stockMinimo: stockMinimoNumero,
                estado: formulario.estado,
            };
            setProductos((prev) => [nuevoProducto, ...prev]);
            mostrarAlerta("exito", `Producto "${nombreLimpio}" registrado en inventario.`);
        }

        cerrarModal();
    };

    const alternarEstadoProducto = (id) => {
        setProductos((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                const nuevoEstado = item.estado === "Activo" ? "Inactivo" : "Activo";
                return { ...item, estado: nuevoEstado };
            })
        );
    };

    return (
        <div className="productos-page">
            <Header
                vistaActiva="inventario"
                usuarioActual={usuarioActual}
                onIrDashboard={onIrDashboard}
                onIrUsuarios={onIrUsuarios}
                onIrVentas={onIrVentas}
            />

            <main className="container">
                <div className="page-header">
                    <div>
                        <h1>Gestión de Productos e Inventario</h1>
                        <p className="subtitle">
                            Administra el catálogo de productos y servicios, precios, stock y alertas
                        </p>
                    </div>

                    <button
                        id="btnRegistrarProducto"
                        type="button"
                        className="btn-nuevo-producto"
                        onClick={abrirModalCrear}
                    >
                        + Registrar Producto
                    </button>
                </div>

                {mensaje && (
                    <div className={`feedback-banner ${mensaje.tipo}`}>
                        {mensaje.texto}
                    </div>
                )}

                <section className="card">
                    <div className="table-toolbar">
                        <input
                            type="text"
                            placeholder="Buscar por código, nombre o categoría..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />

                        <select
                            className="toolbar-select"
                            value={categoriaFiltro}
                            onChange={(e) => setCategoriaFiltro(e.target.value)}
                        >
                            {categoriasDisponibles.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat === "Todas" ? "Todas las categorías" : cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    <table className="data-table">
                        <thead>
                        <tr>
                            <th>Código</th>
                            <th>Producto / Servicio</th>
                            <th>Categoría</th>
                            <th>Precio Unitario</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {productosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                                    No se encontraron productos que coincidan con el filtro.
                                </td>
                            </tr>
                        ) : (
                            productosFiltrados.map((prod) => {
                                const stockBajo = prod.stock <= (prod.stockMinimo ?? 10);
                                return (
                                    <tr key={prod.id}>
                                        <td>
                                            <strong>{prod.codigo}</strong>
                                        </td>
                                        <td>{prod.nombre}</td>
                                        <td>
                                            <span className="badge badge-user">{prod.categoria}</span>
                                        </td>
                                        <td>{formatearMoneda(prod.precio)}</td>
                                        <td>
                        <span className={stockBajo ? "status-inactive" : "status-active"}>
                          {stockBajo ? `▲ ${prod.stock} (Bajo)` : `${prod.stock} und.`}
                        </span>
                                        </td>
                                        <td>
                        <span
                            className={
                                prod.estado === "Activo" ? "status-active" : "status-inactive"
                            }
                        >
                          • {prod.estado}
                        </span>
                                        </td>
                                        <td>
                                            <div className="action-links">
                                                <button
                                                    type="button"
                                                    className="btn-edit"
                                                    onClick={() => abrirModalEditar(prod)}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-delete"
                                                    onClick={() => alternarEstadoProducto(prod.id)}
                                                >
                                                    {prod.estado === "Activo" ? "Desactivar" : "Activar"}
                                                </button>
                                            </div>
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
                <div className="modal-overlay" onClick={cerrarModal}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {productoEditando ? "Editar Producto" : "Registrar Nuevo Producto"}
                            </h2>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={cerrarModal}
                                aria-label="Cerrar modal"
                            >
                                ×
                            </button>
                        </div>

                        <form className="modal-body" onSubmit={manejarGuardarProducto}>
                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label htmlFor="codigo">Código</label>
                                    <input
                                        id="codigo"
                                        name="codigo"
                                        type="text"
                                        placeholder="Ej. COD-301"
                                        value={formulario.codigo}
                                        onChange={manejarCambioFormulario}
                                        required
                                    />
                                </div>

                                <div className="form-group flex-1">
                                    <label htmlFor="categoria">Categoría</label>
                                    <select
                                        id="categoria"
                                        name="categoria"
                                        value={formulario.categoria}
                                        onChange={manejarCambioFormulario}
                                    >
                                        <option value="Software">Software</option>
                                        <option value="Servicios">Servicios</option>
                                        <option value="Hardware">Hardware</option>
                                        <option value="Papelería">Papelería</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="nombre">Producto / Servicio</label>
                                <input
                                    id="nombre"
                                    name="nombre"
                                    type="text"
                                    placeholder="Nombre del producto o servicio"
                                    value={formulario.nombre}
                                    onChange={manejarCambioFormulario}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label htmlFor="precio">Precio Unitario ($ COP)</label>
                                    <input
                                        id="precio"
                                        name="precio"
                                        type="number"
                                        min="0"
                                        step="100"
                                        placeholder="0"
                                        value={formulario.precio}
                                        onChange={manejarCambioFormulario}
                                        required
                                    />
                                </div>

                                <div className="form-group flex-1">
                                    <label htmlFor="stock">Stock Actual</label>
                                    <input
                                        id="stock"
                                        name="stock"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={formulario.stock}
                                        onChange={manejarCambioFormulario}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label htmlFor="stockMinimo">Stock Mínimo (Alerta)</label>
                                    <input
                                        id="stockMinimo"
                                        name="stockMinimo"
                                        type="number"
                                        min="0"
                                        value={formulario.stockMinimo}
                                        onChange={manejarCambioFormulario}
                                    />
                                </div>

                                <div className="form-group flex-1">
                                    <label htmlFor="estado">Estado</label>
                                    <select
                                        id="estado"
                                        name="estado"
                                        value={formulario.estado}
                                        onChange={manejarCambioFormulario}
                                    >
                                        <option value="Activo">Activo</option>
                                        <option value="Inactivo">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={cerrarModal}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit">
                                    {productoEditando ? "Guardar Cambios" : "Registrar Producto"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}