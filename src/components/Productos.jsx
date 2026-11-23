import { useEffect, useMemo, useState } from "react";
import Header from "./Header";
import "../styles/productos.css";

const API_PRODUCTOS = "http://localhost:8080/api/productos";
const API_CATEGORIAS = "http://localhost:8080/api/categorias";

const FORM_VACIO = {
    codigo: "",
    nombre: "",
    categoriaId: "",
    precio: "",
    stock: "",
    stockMinimo: "10",
    estado: "Activo",
};

const formatoCOP = (valor) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(Number(valor) || 0);

const getIdProd = (p) => p?.id_producto ?? p?.idProducto ?? p?.id;
const getCodigo = (p) => p?.codigo ?? p?.codigo_producto ?? p?.codigoProducto ?? "";
const getNombre = (p) => p?.nombre ?? p?.nombre_producto ?? p?.nombreProducto ?? "";
const getPrecio = (p) => Number(p?.precio ?? p?.precio_unitario ?? p?.precioUnitario ?? 0);
const getStock = (p) =>
    Number(p?.stock ?? p?.cantidad_stock ?? p?.cantidadStock ?? p?.cantidad ?? 0);
const getStockMin = (p) => Number(p?.stock_minimo ?? p?.stockMinimo ?? 10);
const getEstado = (p) =>
    String(p?.estado ?? "Activo").toUpperCase() === "INACTIVO" ? "Inactivo" : "Activo";

const getIdCat = (c) => c?.id_categoria ?? c?.idCategoria ?? c?.id ?? "";
const getNombreCat = (c) => {
    if (!c) return "";
    if (typeof c === "string") return c;
    return c?.nombre_categoria ?? c?.nombreCategoria ?? c?.nombre ?? "";
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
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(FORM_VACIO);
    const [alerta, setAlerta] = useState(null);

    const mostrarAlerta = (tipo, texto) => {
        setAlerta({ tipo, texto });
        setTimeout(() => setAlerta(null), 4000);
    };

    const getCategoriaTexto = (prod) => {
        if (prod?.categoria) {
            const directo = getNombreCat(prod.categoria);
            if (directo) return directo;
            const idC = getIdCat(prod.categoria);
            const match = categorias.find((c) => String(getIdCat(c)) === String(idC));
            if (match) return getNombreCat(match);
        }
        return prod?.nombre_categoria || prod?.categoria_nombre || "Sin categoría";
    };

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [rProd, rCat] = await Promise.all([
                fetch(API_PRODUCTOS),
                fetch(API_CATEGORIAS).catch(() => null),
            ]);
            if (!rProd.ok) throw new Error(`HTTP ${rProd.status}`);
            const dProd = await rProd.json();
            setProductos(Array.isArray(dProd) ? dProd : []);
            if (rCat && rCat.ok) {
                const dCat = await rCat.json();
                setCategorias(Array.isArray(dCat) ? dCat : []);
            }
        } catch (err) {
            mostrarAlerta("error", `Error al cargar productos: ${err.message}`);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        let montado = true;
        (async () => {
            try {
                const [rProd, rCat] = await Promise.all([
                    fetch(API_PRODUCTOS),
                    fetch(API_CATEGORIAS).catch(() => null),
                ]);
                if (!rProd.ok) throw new Error(`HTTP ${rProd.status}`);
                const [dProd, dCat] = await Promise.all([
                    rProd.json(),
                    rCat && rCat.ok ? rCat.json() : Promise.resolve([]),
                ]);
                if (montado) {
                    setProductos(Array.isArray(dProd) ? dProd : []);
                    setCategorias(Array.isArray(dCat) ? dCat : []);
                }
            } catch (err) {
                if (montado) {
                    setAlerta({
                        tipo: "error",
                        texto: `No se pudieron cargar los productos: ${err.message}`,
                    });
                }
            } finally {
                if (montado) setCargando(false);
            }
        })();
        return () => {
            montado = false;
        };
    }, []);

    const opcionesCategoria = useMemo(() => {
        const deCat = categorias.map((c) => getNombreCat(c)).filter(Boolean);
        const deProd = productos.map((p) => getCategoriaTexto(p)).filter(Boolean);
        return ["Todas", ...new Set([...deCat, ...deProd])];
    }, [categorias, productos]);

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return productos.filter((p) => {
            const catTxt = getCategoriaTexto(p);
            const okCat = categoriaFiltro === "Todas" || catTxt === categoriaFiltro;
            const okTxt =
                !q ||
                getCodigo(p).toLowerCase().includes(q) ||
                getNombre(p).toLowerCase().includes(q) ||
                catTxt.toLowerCase().includes(q);
            return okCat && okTxt;
        });
    }, [productos, categorias, busqueda, categoriaFiltro]);

    const abrirCrear = () => {
        const primeraId = categorias.length > 0 ? String(getIdCat(categorias[0])) : "";
        setEditando(null);
        setForm({ ...FORM_VACIO, categoriaId: primeraId });
        setModalAbierto(true);
    };

    const abrirEditar = (prod) => {
        setEditando(prod);
        setForm({
            codigo: getCodigo(prod),
            nombre: getNombre(prod),
            categoriaId: String(getIdCat(prod?.categoria)),
            precio: String(getPrecio(prod)),
            stock: String(getStock(prod)),
            stockMinimo: String(getStockMin(prod)),
            estado: getEstado(prod),
        });
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setEditando(null);
        setForm(FORM_VACIO);
    };

    const onChangeForm = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const buildPayload = (datos, base = null) => {
        const codigo = datos.codigo.trim().toUpperCase();
        const nombre = datos.nombre.trim();
        const precio = Number(datos.precio);
        const stock = Number(datos.stock);
        const stockMinimo = Number(datos.stockMinimo) || 0;
        const idCat = datos.categoriaId ? Number(datos.categoriaId) : null;

        const body = {
            ...(base || {}),
            codigo,
            codigo_producto: codigo,
            nombre,
            nombre_producto: nombre,
            precio,
            precio_unitario: precio,
            stock,
            cantidad_stock: stock,
            stock_minimo: stockMinimo,
            stockMinimo,
            estado: datos.estado,
        };

        if (idCat) {
            body.categoria = { id_categoria: idCat, id: idCat };
        }

        if (base) {
            const idP = getIdProd(base);
            if (idP !== undefined && idP !== null) {
                body.id_producto = idP;
                body.id = idP;
            }
        }
        return body;
    };

    const onGuardar = async (e) => {
        e.preventDefault();
        const codigo = form.codigo.trim().toUpperCase();
        const nombre = form.nombre.trim();
        const precio = Number(form.precio);
        const stock = Number(form.stock);

        if (!codigo || !nombre) {
            mostrarAlerta("error", "Completa el código y el nombre del producto.");
            return;
        }
        if (Number.isNaN(precio) || precio < 0 || Number.isNaN(stock) || stock < 0) {
            mostrarAlerta("error", "Ingresa precio y stock válidos.");
            return;
        }

        setGuardando(true);
        const esEdit = Boolean(editando);
        const idObj = getIdProd(editando);
        const url = esEdit ? `${API_PRODUCTOS}/${idObj}` : API_PRODUCTOS;
        const method = esEdit ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildPayload(form, editando)),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || `HTTP ${res.status}`);
            }
            await cargarDatos();
            mostrarAlerta(
                "exito",
                esEdit ? `Producto "${nombre}" actualizado.` : `Producto "${nombre}" registrado.`
            );
            cerrarModal();
        } catch (err) {
            mostrarAlerta("error", `No se pudo guardar: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    const onToggleEstado = async (prod) => {
        const idObj = getIdProd(prod);
        if (!idObj) return;
        const nuevoEstado = getEstado(prod) === "Activo" ? "Inactivo" : "Activo";
        try {
            const res = await fetch(`${API_PRODUCTOS}/${idObj}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    buildPayload(
                        {
                            codigo: getCodigo(prod),
                            nombre: getNombre(prod),
                            categoriaId: getIdCat(prod?.categoria),
                            precio: getPrecio(prod),
                            stock: getStock(prod),
                            stockMinimo: getStockMin(prod),
                            estado: nuevoEstado,
                        },
                        prod
                    )
                ),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || `HTTP ${res.status}`);
            }
            await cargarDatos();
            mostrarAlerta("exito", `Estado actualizado a "${nuevoEstado}".`);
        } catch (err) {
            mostrarAlerta("error", `No se pudo cambiar el estado: ${err.message}`);
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
                        onClick={abrirCrear}
                    >
                        + Registrar Producto
                    </button>
                </div>

                {alerta && <div className={`feedback-banner ${alerta.tipo}`}>{alerta.texto}</div>}

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
                            {opcionesCategoria.map((cat) => (
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
                                <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                                    Cargando productos desde la base de datos...
                                </td>
                            </tr>
                        ) : filtrados.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                                    No hay productos registrados o que coincidan con el filtro.
                                </td>
                            </tr>
                        ) : (
                            filtrados.map((prod, idx) => {
                                const idP = getIdProd(prod) ?? idx;
                                const stockAct = getStock(prod);
                                const stockMin = getStockMin(prod);
                                const bajo = stockAct <= stockMin;
                                const estado = getEstado(prod);
                                return (
                                    <tr key={idP}>
                                        <td><strong>{getCodigo(prod)}</strong></td>
                                        <td>{getNombre(prod)}</td>
                                        <td><span className="badge badge-user">{getCategoriaTexto(prod)}</span></td>
                                        <td>{formatoCOP(getPrecio(prod))}</td>
                                        <td>
                        <span className={bajo ? "status-inactive" : "status-active"}>
                          {bajo ? `▲ ${stockAct} (Bajo)` : `${stockAct} und.`}
                        </span>
                                        </td>
                                        <td>
                        <span className={estado === "Activo" ? "status-active" : "status-inactive"}>
                          ● {estado}
                        </span>
                                        </td>
                                        <td>
                                            <div className="action-links">
                                                <button type="button" className="btn-edit" onClick={() => abrirEditar(prod)}>
                                                    Editar
                                                </button>
                                                <button type="button" className="btn-delete" onClick={() => onToggleEstado(prod)}>
                                                    {estado === "Activo" ? "Desactivar" : "Activar"}
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
                            <h2>{editando ? "Editar Producto" : "Registrar Nuevo Producto"}</h2>
                            <button type="button" className="btn-close" onClick={cerrarModal} aria-label="Cerrar modal">
                                ×
                            </button>
                        </div>

                        <form className="modal-body" onSubmit={onGuardar}>
                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label htmlFor="codigo">Código</label>
                                    <input
                                        id="codigo"
                                        name="codigo"
                                        type="text"
                                        placeholder="Ej. COD-301"
                                        value={form.codigo}
                                        onChange={onChangeForm}
                                        required
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label htmlFor="categoriaId">Categoría</label>
                                    <select
                                        id="categoriaId"
                                        name="categoriaId"
                                        value={form.categoriaId}
                                        onChange={onChangeForm}
                                    >
                                        <option value="">Selecciona una categoría</option>
                                        {categorias.map((c) => {
                                            const idC = getIdCat(c);
                                            return (
                                                <option key={idC} value={String(idC)}>
                                                    {getNombreCat(c)}
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
                                    value={form.nombre}
                                    onChange={onChangeForm}
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
                                        value={form.precio}
                                        onChange={onChangeForm}
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
                                        value={form.stock}
                                        onChange={onChangeForm}
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
                                        value={form.stockMinimo}
                                        onChange={onChangeForm}
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label htmlFor="estado">Estado</label>
                                    <select
                                        id="estado"
                                        name="estado"
                                        value={form.estado}
                                        onChange={onChangeForm}
                                    >
                                        <option value="Activo">Activo</option>
                                        <option value="Inactivo">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={cerrarModal} disabled={guardando}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit" disabled={guardando}>
                                    {guardando ? "Guardando..." : editando ? "Guardar Cambios" : "Registrar Producto"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}