import { useEffect, useState } from "react";
import Header from "./Header";
import "../styles/factura.css";

const API_FACTURAS_URL = "http://localhost:8080/api/facturas";
const API_DETALLE_URL = "http://localhost:8080/api/detalle_factura";

const obtenerIdFactura = (fac) =>
    fac?.id_factura ?? fac?.idFactura ?? fac?.id ?? null;

const obtenerIdFacturaDesdeDetalle = (det) =>
    det?.factura?.id_factura ??
    det?.factura?.idFactura ??
    det?.factura?.id ??
    det?.id_factura ??
    det?.idFactura ??
    det?.facturaId ??
    null;

const obtenerNumeroFactura = (fac) =>
    fac?.numero_factura ?? fac?.numeroFactura ?? fac?.numero ?? "";

const obtenerNombreProductoDetalle = (det) => {
    const prod = det?.producto;
    if (prod) {
        const nombre = prod?.nombre ?? prod?.nombre_producto ?? prod?.nombreProducto;
        if (nombre) return nombre;
        const idProd = prod?.id_productos ?? prod?.id_producto ?? prod?.idProducto ?? prod?.id;
        if (idProd !== undefined && idProd !== null) return `Producto #${idProd}`;
    }
    return det?.nombre_producto ?? det?.nombreProducto ?? det?.producto_nombre ?? "Producto";
};

export default function HistorialFacturas({
                                              usuarioActual,
                                              onIrDashboard,
                                              onIrUsuarios,
                                              onIrInventario,
                                              onIrNuevaVenta,
                                          }) {
    const [facturas, setFacturas] = useState([]);
    const [detalles, setDetalles] = useState([]);
    const [detallesDirectosFactura, setDetallesDirectosFactura] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [facturaConsultada, setFacturaConsultada] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [error, setError] = useState("");

    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(Number(valor) || 0);
    };

    const cargarHistorial = async () => {
        setCargando(true);
        setError("");
        try {
            const [resFacturas, resDetalles] = await Promise.all([
                fetch(API_FACTURAS_URL),
                fetch(API_DETALLE_URL).catch(() => null),
            ]);

            if (!resFacturas.ok) {
                throw new Error(`Error al cargar facturas (${resFacturas.status})`);
            }

            const dataFacturas = await resFacturas.json();
            setFacturas(Array.isArray(dataFacturas) ? dataFacturas : []);

            if (resDetalles && resDetalles.ok) {
                const dataDetalles = await resDetalles.json();
                setDetalles(Array.isArray(dataDetalles) ? dataDetalles : []);
            } else {
                setDetalles([]);
            }
        } catch (err) {
            setError(err.message || "No se pudo cargar el historial de facturas.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        void cargarHistorial();
    }, []);

    const abrirDetalleFactura = async (fac) => {
        setFacturaConsultada(fac);
        setDetallesDirectosFactura([]);

        const anidados =
            fac?.detalles ??
            fac?.detalleFacturas ??
            fac?.detalle_facturas ??
            fac?.items ??
            [];

        if (Array.isArray(anidados) && anidados.length > 0) {
            setDetallesDirectosFactura(anidados);
            return;
        }

        const idFac = obtenerIdFactura(fac);
        if (idFac === null || idFac === undefined) return;

        setCargandoDetalle(true);
        try {
            const res = await fetch(`${API_FACTURAS_URL}/${idFac}/detalles`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setDetallesDirectosFactura(data);
                }
            }
        } catch {
            // Si el endpoint anidado no existe, se usará el arreglo global de detalles
        } finally {
            setCargandoDetalle(false);
        }
    };

    const facturasFiltradas = facturas.filter((fac) => {
        const texto = busqueda.toLowerCase();
        const numero = obtenerNumeroFactura(fac).toLowerCase();
        const pago = (fac.forma_pago ?? fac.formaPago ?? "").toLowerCase();
        const estado = (fac.estado_factura ?? fac.estadoFactura ?? fac.estado ?? "").toLowerCase();
        return numero.includes(texto) || pago.includes(texto) || estado.includes(texto);
    });

    const detallesFacturaConsultada = (() => {
        if (!facturaConsultada) return [];
        if (detallesDirectosFactura.length > 0) {
            return detallesDirectosFactura;
        }

        const idObjetivo = obtenerIdFactura(facturaConsultada);
        const numeroObjetivo = obtenerNumeroFactura(facturaConsultada);

        return detalles.filter((det) => {
            const idDet = obtenerIdFacturaDesdeDetalle(det);
            if (
                idObjetivo !== null &&
                idObjetivo !== undefined &&
                idDet !== null &&
                idDet !== undefined &&
                String(idDet) === String(idObjetivo)
            ) {
                return true;
            }
            const numDet =
                det?.factura?.numero_factura ??
                det?.factura?.numeroFactura ??
                det?.numero_factura ??
                "";
            return Boolean(numeroObjetivo && numDet && String(numDet) === String(numeroObjetivo));
        });
    })();

    const nombreUsuarioMostrar =
        typeof usuarioActual === "string"
            ? usuarioActual
            : usuarioActual?.nombre || usuarioActual?.correo || usuarioActual?.email || "Usuario";

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
                        <h1>Historial de Facturas</h1>
                        <p className="subtitle">Consulta de facturas registradas y detalle de ítems vendidos</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={cargarHistorial}
                            disabled={cargando}
                        >
                            🔄 Actualizar
                        </button>
                        {onIrNuevaVenta && (
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={onIrNuevaVenta}
                            >
                                + Nueva Venta
                            </button>
                        )}
                    </div>
                </div>

                {error && <div className="feedback-banner error">{error}</div>}

                <section className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                        <h2 className="card-title" style={{ margin: 0 }}>📄 Facturas Registradas</h2>
                        <input
                            type="text"
                            placeholder="Buscar por número, pago o estado..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            style={{ minWidth: "260px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        />
                    </div>

                    <div className="table-responsive">
                        <table className="cart-table">
                            <thead>
                            <tr>
                                <th>N° Factura</th>
                                <th>Forma de Pago</th>
                                <th>Estado</th>
                                <th>Total</th>
                                <th>Consulta</th>
                            </tr>
                            </thead>
                            <tbody>
                            {cargando ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
                                        Cargando facturas...
                                    </td>
                                </tr>
                            ) : facturasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>
                                        No hay facturas que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                facturasFiltradas.map((fac, idx) => {
                                    const claveFila = obtenerIdFactura(fac) ?? obtenerNumeroFactura(fac) ?? idx;
                                    return (
                                        <tr key={claveFila}>
                                            <td><strong>{obtenerNumeroFactura(fac)}</strong></td>
                                            <td>{fac.forma_pago ?? fac.formaPago ?? "—"}</td>
                                            <td>{fac.estado_factura ?? fac.estadoFactura ?? fac.estado ?? "—"}</td>
                                            <td><strong>{formatearMoneda(fac.total)}</strong></td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn-secondary"
                                                    onClick={() => void abrirDetalleFactura(fac)}
                                                >
                                                    Ver detalle
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>

                    {facturaConsultada && (
                        <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <h3>Detalle de Factura: {obtenerNumeroFactura(facturaConsultada)}</h3>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => {
                                        setFacturaConsultada(null);
                                        setDetallesDirectosFactura([]);
                                    }}
                                >
                                    Cerrar detalle
                                </button>
                            </div>

                            <p style={{ fontSize: "14px", marginBottom: "14px" }}>
                                <strong>Subtotal:</strong> {formatearMoneda(facturaConsultada.subtotal)} |{" "}
                                <strong>IVA:</strong> {formatearMoneda(facturaConsultada.iva)} |{" "}
                                <strong>Total:</strong> {formatearMoneda(facturaConsultada.total)}
                            </p>

                            <div className="table-responsive">
                                <table className="cart-table">
                                    <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Precio Unitario</th>
                                        <th>Subtotal Línea</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {cargandoDetalle ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: "center", color: "#64748b", padding: "14px" }}>
                                                Cargando ítems de la factura...
                                            </td>
                                        </tr>
                                    ) : detallesFacturaConsultada.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: "center", color: "#94a3b8", padding: "14px" }}>
                                                No se encontraron ítems asociados a esta factura.
                                            </td>
                                        </tr>
                                    ) : (
                                        detallesFacturaConsultada.map((det, idx) => {
                                            const cantidad = Number(det?.cantidad ?? 1) || 1;
                                            const precio = Number(det?.precio ?? det?.precio_unitario ?? 0) || 0;
                                            const subtotalLinea =
                                                det?.subtotal_lineal ?? det?.subtotalLineal ?? cantidad * precio;
                                            return (
                                                <tr key={det?.id_detalle_factura ?? det?.idDetalleFactura ?? det?.id ?? idx}>
                                                    <td>{obtenerNombreProductoDetalle(det)}</td>
                                                    <td>{cantidad}</td>
                                                    <td>{formatearMoneda(precio)}</td>
                                                    <td><strong>{formatearMoneda(subtotalLinea)}</strong></td>
                                                </tr>
                                            );
                                        })
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}