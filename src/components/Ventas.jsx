import { useState } from "react";
import Header from "./Header";
import "../styles/factura.css";

const PRODUCTOS_INICIALES = [
    { id: "COD-001", nombre: "Licencia Software ERP (1 Año)", precio: 450000, stock: "45" },
    { id: "COD-008", nombre: "Soporte Técnico Especializado", precio: 120000, stock: "∞" },
    { id: "COD-104", nombre: "Teclado Mecánico Ergonómico", precio: 180000, stock: "12" },
    { id: "COD-105", nombre: "Mouse Inalámbrico Recargable", precio: 85000, stock: "30" },
];

export default function Ventas({
                                   usuarioActual,
                                   onIrDashboard,
                                   onIrUsuarios,
                                   onIrInventario,
                               }) {
    const [clienteId, setClienteId] = useState("1");
    const [metodoPago, setMetodoPago] = useState("efectivo");
    const [busqueda, setBusqueda] = useState("");
    const [carrito, setCarrito] = useState([]);

    const [mensaje, setMensaje] = useState("");
    const [esError, setEsError] = useState(false);

    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(valor);
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

    const procesarVenta = () => {
        if (carrito.length === 0) {
            setEsError(true);
            setMensaje("Debes agregar al menos un producto para procesar la venta.");
            return;
        }

        setEsError(false);
        setMensaje("¡Venta procesada con éxito! Factura electrónica FAC-2026-00925 generada.");
        setCarrito([]);
    };

    const productosFiltrados = PRODUCTOS_INICIALES.filter((prod) => {
        const texto = busqueda.toLowerCase();
        return (
            prod.nombre.toLowerCase().includes(texto) ||
            prod.id.toLowerCase().includes(texto)
        );
    });

    const subtotal = carrito.reduce(
        (acumulado, item) => acumulado + item.precio * item.cantidad,
        0
    );
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    return (
        <div className="ventas-page">
            <Header
                vistaActiva="ventas"
                nombreUsuario={usuarioActual}
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
                    <div className="invoice-number-badge">
                        <span>Factura N°:</span>
                        <strong>FAC-2026-00925</strong>
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
                                        required
                                    >
                                        <option value="1">Cliente General / Consumidor Final</option>
                                        <option value="2">Carlos Rodríguez - NIT/CC 1.098.234.567</option>
                                        <option value="3">Empresa Alfa S.A.S - NIT 900.123.456-1</option>
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
                                                    {prod.id} | Stock: {prod.stock}
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
                                                    <small>{item.id}</small>
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
                                >
                                    Limpiar Factura
                                </button>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={procesarVenta}
                                >
                                    ⚡ Procesar y Facturar
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}