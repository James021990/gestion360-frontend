import { useEffect, useState } from "react";
import Header from "./Header";
import "../styles/factura.css";

const API_FACTURAS_URL = "http://localhost:8080/api/facturas";
const API_DETALLE_URL = "http://localhost:8080/api/detalle_factura";

export default function HistorialFacturas({
                                              usuarioActual,
                                              onIrDashboard,
                                              onIrUsuarios,
                                              onIrInventario,
                                              onIrNuevaVenta,
                                          }) {
    const [facturas, setFacturas] = useState([]);
    const [detalles, setDetalles] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [facturaConsultada, setFacturaConsultada] = useState(null);
    const [cargando, setCargando] = useState(true);
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
                fetch(API_DETALLE_URL),
            ]);

            if (!resFacturas.ok) {
                throw new Error(`Error al cargar facturas (${resFacturas.status})`);
            }

            const dataFacturas = await resFacturas.json();
            setFacturas(Array.isArray(dataFacturas) ? dataFacturas : []);

            if (resDetalles.ok) {
                const dataDetalles = await resDetalles.json();
                setDetalles(Array.isArray(dataDetalles) ? dataDetalles : []);
            }
        } catch (err) {
            setError(err.message || "No se pudo cargar el historial de facturas.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarHistorial();
    }, []);

    const facturasFiltradas = facturas.filter((fac) => {
        const texto = busqueda.toLowerCase();
        const numero = (fac.numero_factura || "").toLowerCase();
        const pago = (fac.forma_pago || "").toLowerCase();
        const estado = (fac.estado_factura || "").toLowerCase();
        return numero.includes(texto) || pago.includes(texto) || estado.includes(texto);
    });

    const detallesFacturaConsultada = facturaConsultada
        ? detalles.filter(
            (det) =>
                det.factura?.id_factura === facturaConsultada.id_factura ||
                det.id_factura === facturaConsultada.id_factura
        )
        : [];

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
                                facturasFiltradas.map((fac) => (
                                    <tr key={fac.id_factura || fac.numero_factura}>
                                        <td><strong>{fac.numero_factura}</strong></td>
                                        <td>{fac.forma_pago}</td>
                                        <td>{fac.estado_factura}</td>
                                        <td><strong>{formatearMoneda(fac.total)}</strong></td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                onClick={() => setFacturaConsultada(fac)}
                                            >
                                                Ver detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {facturaConsultada && (
                        <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <h3>Detalle de Factura: {facturaConsultada.numero_factura}</h3>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setFacturaConsultada(null)}
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
                                    {detallesFacturaConsultada.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: "center", color: "#94a3b8", padding: "14px" }}>
                                                No se encontraron ítems asociados a esta factura.
                                            </td>
                                        </tr>
                                    ) : (
                                        detallesFacturaConsultada.map((det, idx) => (
                                            <tr key={det.id_detalle_factura || idx}>
                                                <td>
                                                    {det.producto?.nombre ||
                                                        det.producto?.nombre_producto ||
                                                        `Producto #${det.producto?.id_producto || ""}`}
                                                </td>
                                                <td>{det.cantidad}</td>
                                                <td>{formatearMoneda(det.precio)}</td>
                                                <td><strong>{formatearMoneda(det.subtotal_lineal)}</strong></td>
                                            </tr>
                                        ))
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