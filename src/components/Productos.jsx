import { useState } from "react";
import Header from "./Header";
import "../styles/usuarios.css";

const PRODUCTOS_INICIALES = [
    {
        id: 1,
        codigo: "COD-001",
        nombre: "Licencia Software ERP (1 Año)",
        categoria: "Software",
        precio: 450000,
        stock: 45,
        stockMinimo: 10,
        estado: "ACTIVO",
    },
    {
        id: 2,
        codigo: "COD-008",
        nombre: "Soporte Técnico Especializado",
        categoria: "Servicios",
        precio: 120000,
        stock: 99,
        stockMinimo: 5,
        estado: "ACTIVO",
    },
    {
        id: 3,
        codigo: "COD-104",
        nombre: "Teclado Mecánico Ergonómico",
        categoria: "Hardware",
        precio: 180000,
        stock: 12,
        stockMinimo: 15,
        estado: "ACTIVO",
    },
    {
        id: 4,
        codigo: "COD-105",
        nombre: "Mouse Inalámbrico Recargable",
        categoria: "Hardware",
        precio: 85000,
        stock: 30,
        stockMinimo: 10,
        estado: "ACTIVO",
    },
    {
        id: 5,
        codigo: "COD-201",
        nombre: "Resma Papel Carta 75g",
        categoria: "Papelería",
        precio: 22000,
        stock: 4,
        stockMinimo: 10,
        estado: "INACTIVO",
    },
];

export default function Productos({
                                      usuarioActual,
                                      onIrDashboard,
                                      onIrUsuarios,
                                      onIrVentas,
                                  }) {
    const [productos, setProductos] = useState(PRODUCTOS_INICIALES);
    const [busqueda, setBusqueda] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
    const [modalAbierto, setModalAbierto] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);

    const [codigo, setCodigo] = useState("");
    const [nombre, setNombre] = useState("");
    const [categoria, setCategoria] = useState("Hardware");
    const [precio, setPrecio] = useState("");
    const [stock, setStock] = useState("");
    const [stockMinimo, setStockMinimo] = useState("5");

    const [mensaje, setMensaje] = useState("");
    const [esError, setEsError] = useState(false);

    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(Number(valor) || 0);
    };

    const abrirModalCrear = () => {
        setProductoEditando(null);
        setCodigo("");
        setNombre("");
        setCategoria("Hardware");
        setPrecio("");
        setStock("");
        setStockMinimo("5");
        setModalAbierto(true);
    };

    const abrirModalEditar = (prod) => {
        setProductoEditando(prod);
        setCodigo(prod.codigo || "");
        setNombre(prod.nombre || "");
        setCategoria(prod.categoria || "Hardware");
        setPrecio(String(prod.precio ?? ""));
        setStock(String(prod.stock ?? ""));
        setStockMinimo(String(prod.stockMinimo ?? "5"));
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setProductoEditando(null);
    };

    const manejarGuardarProducto = (e) => {
        e.preventDefault();
        setEsError(false);
        setMensaje("");

        const precioNum = Number(precio);
        const stockNum = Number(stock);
        const minimoNum = Number(stockMinimo);

        if (!codigo.trim() || !nombre.trim() || precioNum <= 0 || stockNum < 0) {
            setEsError(true);
            setMensaje("Verifica el código, nombre, precio mayor a 0 y stock válido.");
            return;
        }

        if (productoEditando) {
            setProductos((prev) =>
                prev.map((item) =>
                    item.id === productoEditando.id
                        ? {
                            ...item,
                            codigo: codigo.trim().toUpperCase(),
                            nombre: nombre.trim(),
                            categoria,
                            precio: precioNum,
                            stock: stockNum,
                            stockMinimo: minimoNum >= 0 ? minimoNum : 0,
                        }
                        : item
                )
            );
            setMensaje("Producto actualizado exitosamente.");
        } else {
            const nuevoProducto = {
                id: Date.now(),
                codigo: codigo.trim().toUpperCase(),
                nombre: nombre.trim(),
                categoria,
                precio: precioNum,
                stock: stockNum,
                stockMinimo: minimoNum >= 0 ? minimoNum : 0,
                estado: "ACTIVO",
            };
            setProductos((prev) => [nuevoProducto, ...prev]);
            setMensaje("Producto registrado exitosamente.");
        }

        setModalAbierto(false);
        setProductoEditando(null);
    };

    const manejarCambiarEstado = (prod) => {
        const estaActivo = (prod.estado || "").toUpperCase() === "ACTIVO";
        const nuevoEstado = estaActivo ? "INACTIVO" : "ACTIVO";
        const accion = estaActivo ? "desactivar" : "activar";

        if (!window.confirm(`¿Seguro que deseas ${accion} el producto "${prod.nombre}"?`)) {
            return;
        }

        setProductos((prev) =>
            prev.map((item) =>
                item.id === prod.id ? { ...item, estado: nuevoEstado } : item
            )
        );
        setEsError(false);
        setMensaje(`Producto ${estaActivo ? "desactivado" : "activado"} exitosamente.`);
    };

    const productosFiltrados = productos.filter((prod) => {
        const texto = busqueda.toLowerCase();
        const coincideTexto =
            (prod.nombre || "").toLowerCase().includes(texto) ||
            (prod.codigo || "").toLowerCase().includes(texto) ||
            (prod.categoria || "").toLowerCase().includes(texto);

        const coincideCategoria =
            filtroCategoria === "TODAS" || prod.categoria === filtroCategoria;

        return coincideTexto && coincideCategoria;
    });

    const esModoEdicion = Boolean(productoEditando);

    return (
        <div className="usuarios-page">
            <Header
                vistaActiva="inventario"
                nombreUsuario={usuarioActual || "Administrador"}
                onIrDashboard={onIrDashboard}
                onIrUsuarios={onIrUsuarios}
                onIrInventario={() => {}}
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
                        type="button"
                        className="btn-primary"
                        onClick={abrirModalCrear}
                    >
                        + Registrar Producto
                    </button>
                </div>

                {mensaje && (
                    <div className={`feedback-banner ${esError ? "error" : "exito"}`}>
                        {mensaje}
                    </div>
                )}

                <section className="card">
                    <div
                        className="table-toolbar"
                        style={{ display: "flex", gap: "14px", alignItems: "center" }}
                    >
                        <input
                            type="text"
                            placeholder="🔍 Buscar por código, nombre o categoría..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            style={{ flex: 2 }}
                        />

                        <select
                            aria-label="Filtrar por categoría"
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                            style={{
                                flex: 1,
                                padding: "11px 14px",
                                border: "1.5px solid #cbd5e1",
                                borderRadius: "10px",
                                fontSize: "14px",
                                backgroundColor: "#f8fafc",
                                color: "#334155",
                                fontWeight: 600,
                            }}
                        >
                            <option value="TODAS">Todas las categorías</option>
                            <option value="Software">Software</option>
                            <option value="Servicios">Servicios</option>
                            <option value="Hardware">Hardware</option>
                            <option value="Papelería">Papelería</option>
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
                                <td colSpan="7">
                                    No hay productos registrados o que coincidan con el filtro.
                                </td>
                            </tr>
                        ) : (
                            productosFiltrados.map((prod) => {
                                const activo = (prod.estado || "").toUpperCase() === "ACTIVO";
                                const stockBajo = Number(prod.stock) <= Number(prod.stockMinimo);

                                return (
                                    <tr key={prod.id}>
                                        <td>
                                            <strong>{prod.codigo}</strong>
                                        </td>
                                        <td>
                                            <strong>{prod.nombre}</strong>
                                        </td>
                                        <td>
                                                <span className="badge badge-user">
                                                    {prod.categoria}
                                                </span>
                                        </td>
                                        <td>
                                            <strong>{formatearMoneda(prod.precio)}</strong>
                                        </td>
                                        <td>
                                                <span
                                                    className={
                                                        stockBajo ? "status-inactive" : "status-active"
                                                    }
                                                >
                                                    {stockBajo ? `⚠️ ${prod.stock} (Bajo)` : `${prod.stock} und.`}
                                                </span>
                                        </td>
                                        <td>
                                                <span
                                                    className={
                                                        activo ? "status-active" : "status-inactive"
                                                    }
                                                >
                                                    ● {activo ? "Activo" : "Inactivo"}
                                                </span>
                                        </td>
                                        <td className="action-links">
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
                                                onClick={() => manejarCambiarEstado(prod)}
                                            >
                                                {activo ? "Desactivar" : "Activar"}
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
                            <h2>
                                {esModoEdicion ? "Editar Producto" : "Registrar Nuevo Producto"}
                            </h2>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={cerrarModal}
                                aria-label="Cerrar modal"
                            >
                                &times;
                            </button>
                        </header>

                        <form onSubmit={manejarGuardarProducto} className="modal-body">
                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label htmlFor="codigo">Código</label>
                                    <input
                                        type="text"
                                        id="codigo"
                                        placeholder="Ej: COD-110"
                                        value={codigo}
                                        onChange={(e) => setCodigo(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group flex-1">
                                    <label htmlFor="categoria">Categoría</label>
                                    <select
                                        id="categoria"
                                        value={categoria}
                                        onChange={(e) => setCategoria(e.target.value)}
                                    >
                                        <option value="Hardware">Hardware</option>
                                        <option value="Software">Software</option>
                                        <option value="Servicios">Servicios</option>
                                        <option value="Papelería">Papelería</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="nombre">Nombre del Producto o Servicio</label>
                                <input
                                    type="text"
                                    id="nombre"
                                    placeholder="Ej: Monitor LED 24 Pulgadas"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label htmlFor="precio">Precio Unitario (COP)</label>
                                    <input
                                        type="number"
                                        id="precio"
                                        min="1"
                                        placeholder="Ej: 650000"
                                        value={precio}
                                        onChange={(e) => setPrecio(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group flex-1">
                                    <label htmlFor="stock">Stock Actual</label>
                                    <input
                                        type="number"
                                        id="stock"
                                        min="0"
                                        placeholder="Ej: 20"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group flex-1">
                                    <label htmlFor="stockMinimo">Stock Mínimo</label>
                                    <input
                                        type="number"
                                        id="stockMinimo"
                                        min="0"
                                        placeholder="Ej: 5"
                                        value={stockMinimo}
                                        onChange={(e) => setStockMinimo(e.target.value)}
                                    />
                                </div>
                            </div>

                            <footer className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={cerrarModal}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit">
                                    {esModoEdicion ? "Actualizar Producto" : "Guardar Producto"}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}