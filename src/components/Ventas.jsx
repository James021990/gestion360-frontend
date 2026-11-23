import { useEffect, useState } from "react";
import Header from "./Header";
import "../styles/factura.css";

const API_FACTURAS_URL = "http://localhost:8080/api/facturas";
const API_DETALLE_URL = "http://localhost:8080/api/detalle_factura";
const API_CLIENTES_URL = "http://localhost:8080/api/clientes";

const PRODUCTOS_INICIALES = [
    { id: 1, codigo: "COD-001", nombre: "Licencia Software ERP (1 Año)", precio: 450000, stock: "45" },
    { id: 2, codigo: "COD-008", nombre: "Soporte Técnico Especializado", precio: 120000, stock: "∞" },
    { id: 3, codigo: "COD-104", nombre: "Teclado Mecánico Ergonómico", precio: 180000, stock: "12" },
    { id: 4, codigo: "COD-105", nombre: "Mouse Inalámbrico Recargable", precio: 85000, stock: "30" },
];

export default function Ventas({
                                   usuarioActual,
                                   onIrDashboard,
                                   onIrUsuarios,
                                   onIrInventario,
                                   onIrHistorialFacturas,
                               }) {
    const [clientes, setClientes] = useState([]);
    const [cargandoClientes, setCargandoClientes] = useState(true);
    const [clienteId, setClienteId] = useState("");
    const [metodoPago, setMetodoPago] = useState("efectivo");
    const [busqueda, setBusqueda] = useState("");
    const [carrito, setCarrito] = useState([]);
    const [procesando, setProcesando] = useState(false);

    const [mensaje, setMensaje] = useState("");
    const [esError, setEsError] = useState(false);

    const obtenerIdCliente = (cli) => cli?.id_clientes ?? cli?.idCliente ?? cli?.id;
    const obtenerNitCliente = (cli) => cli?.nit_o_cc ?? cli?.nitOCc ?? "";
    const obtenerNombreCliente = (cli) =>
        cli?.nombre_o_razon_social ?? cli?.nombreORazonSocial ?? "Cliente";

    useEffect(() => {
        let activo = true;

        const cargarClientes = async () => {
            try {
                const res = await fetch(API_CLIENTES_URL);
                if (!res.ok) {
                    throw new Error(`Error al cargar clientes (${res.status})`);
                }
                const data = await res.json();
                if (!activo) return;

                const listaClientes = Array.isArray(data) ? data : [];
                setClientes(listaClientes);

                if (listaClientes.length > 0) {
                    const primerId = obtenerIdCliente(listaClientes[0]);
                    if (primerId !== undefined && primerId !== null) {
                        setClienteId(String(primerId));
                    }
                }
            } catch (error) {
                if (activo) {
                    setEsError(true);
                    setMensaje(`No se pudieron cargar los clientes: ${error.message}`);
                }
            } finally {
                if (activo) {
                    setCargandoClientes(false);
                }
            }
        };

        cargarClientes();

        return () => {
            activo = false;
        };
    }, []);

    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(Number(valor) || 0);
    };

    const agregarAlCarrito = (producto) => {
        setMensaje("");
        setCarrito((prevCarrito) => {
            const existe = prevCarrito.find((item) => item.id === producto.id);
            if (existe) {
                return prevCarrito.map((item) =>
                    item.id === producto.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }
            return [...prevCarrito, { ...producto, cantidad: 1 }];
        });
    };

    const cambiarCantidad = (id, nuevaCantidad) => {
        const cantidadValida = nuevaCantidad > 0 ? nuevaCantidad : 1;
        setCarrito((prevCarrito) =>
            prevCarrito.map((item) =>
                item.id === id ? { ...item, cantidad: cantidadValida } : item
            )
        );
    };

    const eliminarDelCarrito = (id) => {
        setCarrito((prevCarrito) => prevCarrito.filter((item) => item.id !== id));
    };

    const limpiarFactura = () => {
        if (carrito.length === 0) return;
        if (window.confirm("¿Estás seguro de vaciar la factura actual?")) {
            setCarrito([]);
            setMensaje("");
        }
    };

    const subtotal = carrito.reduce(
        (acumulado, item) => acumulado + Number(item.precio) * Number(item.cantidad),
        0
    );
    const iva = Math.round(subtotal * 0.19);
    const total = subtotal + iva;

    const procesarVenta = async () => {
        if (!clienteId) {
            setEsError(true);
            setMensaje("Debes seleccionar un cliente registrado antes de facturar.");
            return;
        }

        if (carrito.length === 0) {
            setEsError(true);
            setMensaje("Debes agregar al menos un producto para procesar la venta.");
            return;
        }

        setProcesando(true);
        setMensaje("");
        setEsError(false);

        const numeroGenerado = `FAC-2026-${String(Date.now()).slice(-5)}`;
        const idClienteNumerico = Number(clienteId);

        const facturaPayload = {
            numero_factura: numeroGenerado,
            subtotal,
            iva,
            total,
            forma_pago: metodoPago,
            estado_factura: "Completada",
            cliente: { id_clientes: idClienteNumerico, id_cliente: idClienteNumerico },
            usuario: { id_usuario: Number(usuarioActual?.id_usuario || usuarioActual?.id || 1) },
        };

        try {
            const resFactura = await fetch(API_FACTURAS_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(facturaPayload),
            });

            if (!resFactura.ok) {
                const textoError = await resFactura.text();
                throw new Error(textoError || `Error al guardar la factura (${resFactura.status})`);
            }

            const facturaCreada = await resFactura.json();
            const idFacturaCreada = facturaCreada.id_factura;

            await Promise.all(
                carrito.map(async (item) => {
                    const cantidadNum = Number(item.cantidad);
                    const precioNum = Number(item.precio);
                    const subtotalLineal = cantidadNum * precioNum;

                    const detallePayload = {
                        cantidad: cantidadNum,
                        precio: precioNum,
                        subtotal_lineal: subtotalLineal,
                        factura: { id_factura: idFacturaCreada },
                        producto: { id_producto: Number(item.id) },
                    };

                    const resDetalle = await fetch(API_DETALLE_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(detallePayload),
                    });

                    if (!resDetalle.ok) {
                        const errDet = await resDetalle.text();
                        throw new Error(errDet || `Error al guardar detalle (${resDetalle.status})`);
                    }

                    return resDetalle.json();
                })
            );

            setCarrito([]);
            setEsError(false);
            setMensaje(
                `¡Venta procesada con éxito! Factura ${facturaCreada.numero_factura || numeroGenerado} registrada.`
            );
        } catch (error) {
            setEsError(true);
            setMensaje(`No se pudo completar la facturación: ${error.message}`);
        } finally {
            setProcesando(false);
        }
    };

    const productosFiltrados = PRODUCTOS_INICIALES.filter((prod) => {
        const texto = busqueda.toLowerCase();
        return (
            prod.nombre.toLowerCase().includes(texto) ||
            prod.codigo.toLowerCase().includes(texto)
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
                        <h1>Nueva Factura de Venta</h1>
                        <p className="subtitle">Módulo de facturación electrónica y punto de venta (POS)</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {onIrHistorialFacturas && (
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={onIrHistorialFacturas}
                            >
                                📄 Historial Facturas
                            </button>
                        )}
                        <div className="invoice-number-badge">
                            <span>Estado:</span>
                            <strong>{procesando ? "Guardando..." : "Listo para facturar"}</strong>
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
                            <h2 className="card-title">👤 Datos del Cliente</h2>
                            <div className="form-row">
                                <div className="form-group flex-2">
                                    <label htmlFor="client">Buscar / Seleccionar Cliente</label>
                                    <select
                                        id="client"
                                        name="client"
                                        value={clienteId}
                                        onChange={(e) => setClienteId(e.target.value)}
                                        disabled={cargandoClientes || clientes.length === 0}
                                        required
                                    >
                                        {cargandoClientes ? (
                                            <option value="">Cargando clientes...</option>
                                        ) : clientes.length === 0 ? (
                                            <option value="">No hay clientes registrados</option>
                                        ) : (
                                            clientes.map((cli) => {
                                                const id = obtenerIdCliente(cli);
                                                const nombre = obtenerNombreCliente(cli);
                                                const nit = obtenerNitCliente(cli);
                                                return (
                                                    <option key={id} value={String(id)}>
                                                        {nit ? `${nombre} - NIT/CC ${nit}` : nombre}
                                                    </option>
                                                );
                                            })
                                        )}
                                    </select>
                                </div>
                                <div className="form-group flex-1">
                                    <label htmlFor="payment-method">Forma de Pago</label>
                                    <select
                                        id="payment-method"
                                        name="payment-method"
                                        value={metodoPago}
                                        onChange={(e) => setMetodoPago(e.target.value)}
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta Débito/Crédito</option>
                                        <option value="transferencia">Transferencia (SURA / Nequi)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="card catalog-card">
                            <h2 className="card-title">🔍 Búsqueda Rápida de Productos</h2>
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Escribe el nombre o código para filtrar..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </div>

                            <div className="product-suggestions">
                                {productosFiltrados.length === 0 ? (
                                    <p style={{ color: "#64748b", fontSize: "14px" }}>
                                        No se encontraron productos con ese criterio.
                                    </p>
                                ) : (
                                    productosFiltrados.map((prod) => (
                                        <div key={prod.id} className="product-item">
                                            <div className="product-info">
                                                <strong>{prod.nombre}</strong>
                                                <span className="product-code">
                                                    {prod.codigo} | Stock: {prod.stock}
                                                </span>
                                            </div>
                                            <span className="product-price">
                                                {formatearMoneda(prod.precio)}
                                            </span>
                                            <button
                                                type="button"
                                                className="btn-add-item"
                                                onClick={() => agregarAlCarrito(prod)}
                                            >
                                                + Agregar
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="right-panel">
                        <div className="card cart-card">
                            <h2 className="card-title">🛒 Detalle de la Compra</h2>

                            <div className="table-responsive">
                                <table className="cart-table">
                                    <thead>
                                    <tr>
                                        <th>Producto / Servicio</th>
                                        <th>Cant.</th>
                                        <th>Precio</th>
                                        <th>Subtotal</th>
                                        <th></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {carrito.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                style={{
                                                    textAlign: "center",
                                                    color: "#94a3b8",
                                                    padding: "20px",
                                                }}
                                            >
                                                El carrito está vacío. Agrega productos desde el panel izquierdo.
                                            </td>
                                        </tr>
                                    ) : (
                                        carrito.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <strong>{item.nombre}</strong>
                                                    <small>{item.codigo}</small>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="qty-input"
                                                        value={item.cantidad}
                                                        onChange={(e) =>
                                                            cambiarCantidad(
                                                                item.id,
                                                                parseInt(e.target.value, 10)
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td>{formatearMoneda(item.precio)}</td>
                                                <td>
                                                    <strong>
                                                        {formatearMoneda(item.precio * item.cantidad)}
                                                    </strong>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn-remove"
                                                        onClick={() => eliminarDelCarrito(item.id)}
                                                        title="Eliminar"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="invoice-summary">
                                <div className="summary-row">
                                    <span>Subtotal:</span>
                                    <strong>{formatearMoneda(subtotal)}</strong>
                                </div>
                                <div className="summary-row">
                                    <span>IVA (19%):</span>
                                    <strong>{formatearMoneda(iva)}</strong>
                                </div>
                                <div className="summary-row total-row">
                                    <span>Total a Pagar:</span>
                                    <strong className="total-amount">
                                        {formatearMoneda(total)}
                                    </strong>
                                </div>
                            </div>

                            <div className="action-buttons">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={limpiarFactura}
                                    disabled={procesando}
                                >
                                    Limpiar Factura
                                </button>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={procesarVenta}
                                    disabled={procesando}
                                >
                                    {procesando ? "Procesando..." : "⚡ Procesar y Facturar"}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}