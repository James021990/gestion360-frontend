import { useEffect, useMemo, useState } from "react";
import Header from "./Header";
import "../styles/productos.css";

const API_PRODUCTOS_URL = "http://localhost:8080/api/productos";
const API_CATEGORIAS_URL = "http://localhost:8080/api/categorias";

const FORMULARIO_VACIO = {
    codigo: "",
    nombre: "",
    categoriaId: "",
    categoriaNombre: "",
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
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [busqueda, setBusqueda] = useState("");
    const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
    const [modalAbierto, setModalAbierto] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [mensaje, setMensaje] = useState(null);

    const obtenerIdProducto = (prod) =>
        prod?.id_producto ??
        prod?.idProducto ??
        prod?.id_productos ??
        prod?.idProductos ??
        prod?.idProd ??
        prod?.id;
    const obtenerCodigo = (prod) =>
        prod?.codigo ?? prod?.codigo_producto ?? prod?.codigoProducto ?? "";
    const obtenerNombre = (prod) =>
        prod?.nombre ?? prod?.nombre_producto ?? prod?.nombreProducto ?? "";
    const obtenerPrecio = (prod) =>
        Number(prod?.precio ?? prod?.precio_unitario ?? prod?.precioUnitario ?? 0);
    const obtenerStock = (prod) =>
        Number(prod?.stock ?? prod?.cantidad_stock ?? prod?.cantidadStock ?? prod?.cantidad ?? 0);
    const obtenerStockMinimo = (prod) =>
        Number(prod?.stock_minimo ?? prod?.stockMinimo ?? 10);
    const obtenerEstado = (prod) => {
        const raw = prod?.estado ?? "Activo";
        return String(raw).toUpperCase() === "INACTIVO" ? "Inactivo" : "Activo";
    };

    const obtenerIdCategoria = (cat) =>
        cat?.id_categoria ?? cat?.idCategoria ?? cat?.id ?? "";
    const obtenerNombreCategoria = (cat) => {
        if (!cat) return "";
        if (typeof cat === "string") return cat;
        return cat?.nombre_categoria ?? cat?.nombreCategoria ?? cat?.nombre ?? "";
    };

    const obtenerCategoriaTextoProducto = (prod) => {
        if (prod?.categoria) {
            const nombreDirecto = obtenerNombreCategoria(prod.categoria);
            if (nombreDirecto) return nombreDirecto;
            const idCat = obtenerIdCategoria(prod.categoria);
            const encontrada = categorias.find(
                (c) => String(obtenerIdCategoria(c)) === String(idCat)
            );
            if (encontrada) return obtenerNombreCategoria(encontrada);
        }
        return prod?.nombre_categoria || prod?.categoria_nombre || "Sin categoría";
    };

    const mostrarAlerta = (tipo, texto) => {
        setMensaje({ tipo, texto });
        setTimeout(() => {
            setMensaje(null);
        }, 4000);
    };

    const cargarDatosBackend = async () => {
        setCargando(true);
        try {
            const [resProd, resCat] = await Promise.all([
                fetch(API_PRODUCTOS_URL),
                fetch(API_CATEGORIAS_URL).catch(() => null),
            ]);

            if (!resProd.ok) {
                throw new Error(`Error al cargar productos (${resProd.status})`);
            }

            const dataProd = await resProd.json();
            setProductos(Array.isArray(dataProd) ? dataProd : []);

            if (resCat && resCat.ok) {
                const dataCat = await resCat.json();
                setCategorias(Array.isArray(dataCat) ? dataCat : []);
            }
        } catch (error) {
            mostrarAlerta("error", `No se pudieron cargar los productos: ${error.message}`);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        let activo = true;

        const inicializar = async () => {
            try {
                const [resProd, resCat] = await Promise.all([
                    fetch(API_PRODUCTOS_URL),
                    fetch(API_CATEGORIAS_URL).catch(() => null),
                ]);

                if (!resProd.ok) {
                    throw new Error(`Error al cargar productos (${resProd.status})`);
                }

                const [dataProd, dataCat] = await Promise.all([
                    resProd.json(),
                    resCat && resCat.ok ? resCat.json() : Promise.resolve([]),
                ]);

                if (activo) {
                    setProductos(Array.isArray(dataProd) ? dataProd : []);
                    setCategorias(Array.isArray(dataCat) ? dataCat : []);
                }
            } catch (error) {
                if (activo) {
                    setMensaje({
                        tipo: "error",
                        texto: `No se pudieron cargar los productos desde la base de datos: ${error.message}`,
                    });
                }
            } finally {
                if (activo) {
                    setCargando(false);
                }
            }
        };

        void inicializar();

        return () => {
            activo = false;
        };
    }, []);

    const categoriasDisponibles = useMemo(() => {
        const nombresCat = categorias.map((c) => obtenerNombreCategoria(c)).filter(Boolean);
        const desdeProductos = productos
            .map((p) => obtenerCategoriaTextoProducto(p))
            .filter(Boolean);
        return ["Todas", ...new Set([...nombresCat, ...desdeProductos])];
    }, [categorias, productos]);

    const productosFiltrados = useMemo(() => {
        return productos.filter((prod) => {
            const catTexto = obtenerCategoriaTextoProducto(prod);
            const coincideCategoria =
                categoriaFiltro === "Todas" || catTexto === categoriaFiltro;

            const texto = busqueda.trim().toLowerCase();
            const coincideTexto =
                !texto ||
                obtenerCodigo(prod).toLowerCase().includes(texto) ||
                obtenerNombre(prod).toLowerCase().includes(texto) ||
                catTexto.toLowerCase().includes(texto);

            return coincideCategoria && coincideTexto;
        });
    }, [productos, categorias, busqueda, categoriaFiltro]);

    const abrirModalCrear = () => {
        const primeraCatId =
            categorias.length > 0 ? String(obtenerIdCategoria(categorias[0])) : "";
        const primeraCatNombre =
            categorias.length > 0 ? obtenerNombreCategoria(categorias[0]) : "";
        setProductoEditando(null);
        setFormulario({
            ...FORMULARIO_VACIO,
            categoriaId: primeraCatId,
            categoriaNombre: primeraCatNombre,
        });
        setModalAbierto(true);
    };

    const abrirModalEditar = (producto) => {
        const idCatActual = obtenerIdCategoria(producto?.categoria);
        const nombreCatActual = obtenerCategoriaTextoProducto(producto);
        setProductoEditando(producto);
        setFormulario({
            codigo: obtenerCodigo(producto),
            nombre: obtenerNombre(producto),
            categoriaId: idCatActual ? String(idCatActual) : "",
            categoriaNombre: nombreCatActual,
            precio: String(obtenerPrecio(producto)),
            stock: String(obtenerStock(producto)),
            stockMinimo: String(obtenerStockMinimo(producto)),
            estado: obtenerEstado(producto),
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
        if (name === "categoriaId") {
            const catSeleccionada = categorias.find(
                (c) => String(obtenerIdCategoria(c)) === String(value)
            );
            setFormulario((prev) => ({
                ...prev,
                categoriaId: value,
                categoriaNombre: catSeleccionada ? obtenerNombreCategoria(catSeleccionada) : "",
            }));
            return;
        }
        setFormulario((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const construirPayloadProducto = (datos, baseExistente = null) => {
        const idCatNum = datos.categoriaId ? Number(datos.categoriaId) : null;
        const payload = {
            ...(baseExistente || {}),
            codigo: datos.codigo.trim().toUpperCase(),
            codigo_producto: datos.codigo.trim().toUpperCase(),
            nombre: datos.nombre.trim(),
            nombre_producto: datos.nombre.trim(),
            precio: Number(datos.precio),
            precio_unitario: Number(datos.precio),
            stock: Number(datos.stock),
            cantidad_stock: Number(datos.stock),
            stock_minimo: Number(datos.stockMinimo) || 0,
            stockMinimo: Number(datos.stockMinimo) || 0,
            estado: datos.estado,
        };

        if (idCatNum) {
            payload.categoria = { id_categoria: idCatNum, id: idCatNum };
        }

        if (baseExistente) {
            const idProd = obtenerIdProducto(baseExistente);
            if (idProd !== undefined && idProd !== null) {
                payload.id_producto = idProd;
                payload.id = idProd;
            }
        }

        return payload;
    };

    const manejarGuardarProducto = async (e) => {
        e.preventDefault();

        const codigoLimpio = formulario.codigo.trim().toUpperCase();
        const nombreLimpio = formulario.nombre.trim();
        const precioNumero = Number(formulario.precio);
        const stockNumero = Number(formulario.stock);

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

        setGuardando(true);
        const esEdicion = Boolean(productoEditando);
        const idObjetivo = obtenerIdProducto(productoEditando);
        const url = esEdicion ? `${API_PRODUCTOS_URL}/${idObjetivo}` : API_PRODUCTOS_URL;
        const metodo = esEdicion ? "PUT" : "POST";

        const payload = construirPayloadProducto(formulario, productoEditando);

        try {
            const respuesta = await fetch(url, {
                method: metodo,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!respuesta.ok) {
                const textoError = await respuesta.text();
                throw new Error(textoError || `Error al guardar producto (${respuesta.status})`);
            }

            await cargarDatosBackend();
            mostrarAlerta(
                "exito",
                esEdicion
                    ? `Producto "${nombreLimpio}" actualizado correctamente.`
                    : `Producto "${nombreLimpio}" registrado en la base de datos.`
            );
            cerrarModal();
        } catch (error) {
            mostrarAlerta("error", `No se pudo guardar el producto: ${error.message}`);
        } finally {
            setGuardando(false);
        }
    };

    const alternarEstadoProducto = async (producto) => {
        const idObjetivo = obtenerIdProducto(producto);
        if (!idObjetivo) return;

        const estadoActual = obtenerEstado(producto);
        const nuevoEstado = estadoActual === "Activo" ? "Inactivo" : "Activo";

        const payload = construirPayloadProducto(
            {
                codigo: obtenerCodigo(producto),
                nombre: obtenerNombre(producto),
                categoriaId: obtenerIdCategoria(producto?.categoria),
                precio: obtenerPrecio(producto),
                stock: obtenerStock(producto),
                stockMinimo: obtenerStockMinimo(producto),
                estado: nuevoEstado,
            },
            producto
        );

        try {
            const respuesta = await fetch(`${API_PRODUCTOS_URL}/${idObjetivo}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!respuesta.ok) {
                const textoError = await respuesta.text();
                throw new Error(textoError || `Error al actualizar estado (${respuesta.status})`);
            }

            await cargarDatosBackend();
            mostrarAlerta("exito", `Estado del producto actualizado a "${nuevoEstado}".`);
        } catch (error) {
            mostrarAlerta("error", `No se pudo cambiar el estado: ${error.message}`);
        }
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
                        {cargando ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    style={{ textAlign: "center", padding: "24px", color: "#64748b" }}
                                >
                                    Cargando productos desde la base de datos...
                                </td>
                            </tr>
                        ) : productosFiltrados.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    style={{ textAlign: "center", padding: "24px", color: "#64748b" }}
                                >
                                    No hay productos registrados o que coincidan con el filtro.
                                </td>
                            </tr>
                        ) : (
                            productosFiltrados.map((prod, idx) => {
                                const idProd = obtenerIdProducto(prod) ?? idx;
                                const stockActual = obtenerStock(prod);
                                const stockMin = obtenerStockMinimo(prod);
                                const stockBajo = stockActual <= stockMin;
                                const estadoActual = obtenerEstado(prod);
                                const catTexto = obtenerCategoriaTextoProducto(prod);

                                return (
                                    <tr key={idProd}>
                                        <td>
                                            <strong>{obtenerCodigo(prod)}</strong>
                                        </td>
                                        <td>{obtenerNombre(prod)}</td>
                                        <td>
                                            <span className="badge badge-user">{catTexto}</span>
                                        </td>
                                        <td>{formatearMoneda(obtenerPrecio(prod))}</td>
                                        <td>
                                            <span className={stockBajo ? "status-inactive" : "status-active"}>
                                                {stockBajo ? `▲ ${stockActual} (Bajo)` : `${stockActual} und.`}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={
                                                    estadoActual === "Activo"
                                                        ? "status-active"
                                                        : "status-inactive"
                                                }
                                            >
                                                ● {estadoActual}
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
                                                    onClick={() => alternarEstadoProducto(prod)}
                                                >
                                                    {estadoActual === "Activo" ? "Desactivar" : "Activar"}
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
                                    <label htmlFor="categoriaId">Categoría</label>
                                    <select
                                        id="categoriaId"
                                        name="categoriaId"
                                        value={formulario.categoriaId}
                                        onChange={manejarCambioFormulario}
                                    >
                                        <option value="">Selecciona una categoría</option>
                                        {categorias.map((cat) => {
                                            const idCat = obtenerIdCategoria(cat);
                                            return (
                                                <option key={idCat} value={String(idCat)}>
                                                    {obtenerNombreCategoria(cat)}
                                                </option>
                                            );
                                        })}
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
                                    disabled={guardando}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit" disabled={guardando}>
                                    {guardando
                                        ? "Guardando..."
                                        : productoEditando
                                            ? "Guardar Cambios"
                                            : "Registrar Producto"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}