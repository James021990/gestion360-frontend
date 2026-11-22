import { useEffect, useRef, useState } from "react";
import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import "../styles/dashboard.css";
import logo from "../assets/logo.png";

export default function Dashboard({ usuarioCorreo, onCerrarSesion }) {
    const [menuAbierto, setMenuAbierto] = useState(null);
    const [busqueda, setBusqueda] = useState("");

    const salesCanvasRef = useRef(null);
    const categoriesCanvasRef = useRef(null);
    const salesChartInstance = useRef(null);
    const categoriesChartInstance = useRef(null);

    const alternarMenu = (nombreMenu) => {
        setMenuAbierto((prev) => (prev === nombreMenu ? null : nombreMenu));
    };

    const manejarCerrarSesion = (e) => {
        e.preventDefault();
        if (typeof onCerrarSesion === "function") {
            onCerrarSesion();
        }
    };

    useEffect(() => {
        if (salesCanvasRef.current) {
            if (salesChartInstance.current) {
                salesChartInstance.current.destroy();
            }

            salesChartInstance.current = new Chart(salesCanvasRef.current.getContext("2d"), {
                type: "line",
                data: {
                    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct"],
                    datasets: [
                        {
                            label: "Ventas ($ COP)",
                            data: [
                                25000000, 28000000, 32000000, 30000000, 38000000,
                                42000000, 40000000, 44000000, 41000000, 45850000,
                            ],
                            borderColor: "#2563eb",
                            backgroundColor: "rgba(37, 99, 235, 0.1)",
                            fill: true,
                            tension: 0.4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                },
            });
        }

        if (categoriesCanvasRef.current) {
            if (categoriesChartInstance.current) {
                categoriesChartInstance.current.destroy();
            }

            categoriesChartInstance.current = new Chart(categoriesCanvasRef.current.getContext("2d"), {
                type: "doughnut",
                data: {
                    labels: ["Tecnología", "Papelería", "Servicios", "Otros"],
                    datasets: [
                        {
                            data: [45, 25, 20, 10],
                            backgroundColor: ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6"],
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                },
            });
        }

        return () => {
            if (salesChartInstance.current) {
                salesChartInstance.current.destroy();
            }
            if (categoriesChartInstance.current) {
                categoriesChartInstance.current.destroy();
            }
        };
    }, []);

    const menusDesplegables = [
        {
            id: "usuarios",
            icono: "👥",
            titulo: "Gestión Usuarios",
            enlaces: [
                { texto: "Lista de Usuarios", href: "#usuarios" },
                { texto: "Roles y Permisos", href: "#roles" },
                { texto: "Auditoría de Sesiones", href: "#auditoria" },
            ],
        },
        {
            id: "inventario",
            icono: "📦",
            titulo: "Inventario",
            enlaces: [
                { texto: "Catálogo Productos", href: "#catalogo" },
                { texto: "Entradas / Salidas", href: "#movimientos" },
                { texto: "Alertas de Stock", href: "#alertas" },
                { texto: "Categorías", href: "#categorias" },
            ],
        },
        {
            id: "ventas",
            icono: "💳",
            titulo: "Ventas",
            enlaces: [
                { texto: "Nueva Venta (POS)", href: "#pos" },
                { texto: "Historial Facturas", href: "#facturas" },
                { texto: "Clientes", href: "#clientes" },
            ],
        },
        {
            id: "reportes",
            icono: "📈",
            titulo: "Reportes",
            enlaces: [
                { texto: "Ventas Mensuales", href: "#ventas-mensuales" },
                { texto: "Rotación de Inventario", href: "#rotacion" },
                { texto: "Exportar a Excel/PDF", href: "#exportar" },
            ],
        },
    ];

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <img src={logo} alt="Gestión 360" className="sidebar-logo" />
                </div>

                <nav className="sidebar-nav">
                    <a href="#dashboard" className="nav-item active">
                        <span className="icon">📊</span>
                        <span className="text">Dashboard</span>
                    </a>

                    {menusDesplegables.map((menu) => {
                        const estaAbierto = menuAbierto === menu.id;
                        return (
                            <div className="nav-dropdown" key={menu.id}>
                                <button
                                    type="button"
                                    className="dropdown-btn"
                                    onClick={() => alternarMenu(menu.id)}
                                    aria-expanded={estaAbierto}
                                >
                                    <span className="icon">{menu.icono}</span>
                                    <span className="text">{menu.titulo}</span>
                                    <span
                                        className="arrow"
                                        style={{
                                            transform: estaAbierto ? "rotate(90deg)" : "rotate(0deg)",
                                        }}
                                    >
                    ▸
                  </span>
                                </button>

                                {estaAbierto && (
                                    <div className="dropdown-container open">
                                        {menu.enlaces.map((enlace) => (
                                            <a key={enlace.texto} href={enlace.href}>
                                                {enlace.texto}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <a href="#configuracion" className="nav-item">
                        <span className="icon">⚙️</span>
                        <span className="text">Configuración</span>
                    </a>
                </nav>

                <div className="sidebar-footer">
                    <a
                        href="#logout"
                        className="logout-btn"
                        onClick={manejarCerrarSesion}
                    >
                        <span className="icon">🚪</span>
                        <span className="text">Cerrar Sesión</span>
                    </a>
                </div>
            </aside>

            <div className="main-content">
                <header className="top-header">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="🔍 Buscar facturas, productos, usuarios..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    <div className="user-menu">
                        <button type="button" className="icon-btn" title="Notificaciones">
                            🔔<span className="notification-badge">3</span>
                        </button>
                        <div className="user-profile">
                            <span className="avatar">👤</span>
                            <div className="user-info">
                                <span className="user-name">Yeins Gómez</span>
                                <span className="user-role">
                  {usuarioCorreo ? `Administrador · ${usuarioCorreo}` : "Administrador"}
                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="content-body">
                    <div className="page-title">
                        <h1>Panel de Control Principal</h1>
                        <p>Resumen general del estado del sistema e indicadores clave</p>
                    </div>

                    <section className="kpi-grid">
                        <div className="kpi-card">
                            <div className="kpi-icon blue">💰</div>
                            <div className="kpi-details">
                                <h3>Ventas del Mes</h3>
                                <p className="value">$ 45.850.000</p>
                                <span className="trend positive">▲ +12% vs mes anterior</span>
                            </div>
                        </div>

                        <div className="kpi-card">
                            <div className="kpi-icon green">📦</div>
                            <div className="kpi-details">
                                <h3>Productos en Stock</h3>
                                <p className="value">1.420 items</p>
                                <span className="trend neutral">● 24 categorías</span>
                            </div>
                        </div>

                        <div className="kpi-card">
                            <div className="kpi-icon orange">⚠️</div>
                            <div className="kpi-details">
                                <h3>Alertas de Stock</h3>
                                <p className="value">8 productos</p>
                                <span className="trend negative">▼ Requiere reabastecimiento</span>
                            </div>
                        </div>

                        <div className="kpi-card">
                            <div className="kpi-icon purple">👥</div>
                            <div className="kpi-details">
                                <h3>Clientes Activos</h3>
                                <p className="value">384</p>
                                <span className="trend positive">▲ +5 nuevos hoy</span>
                            </div>
                        </div>
                    </section>

                    <section className="charts-grid">
                        <div className="chart-card">
                            <div className="card-header">
                                <h2>Comportamiento de Ventas (2026)</h2>
                            </div>
                            <div className="chart-container">
                                <canvas ref={salesCanvasRef} id="salesChart"></canvas>
                            </div>
                        </div>

                        <div className="chart-card">
                            <div className="card-header">
                                <h2>Top Categorías Más Vendidas</h2>
                            </div>
                            <div className="chart-container">
                                <canvas ref={categoriesCanvasRef} id="categoriesChart"></canvas>
                            </div>
                        </div>
                    </section>

                    <section className="table-card">
                        <div className="card-header">
                            <h2>Últimas Ventas Registradas</h2>
                            <a href="#ventas" className="view-all">
                                Ver todas →
                            </a>
                        </div>
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th># Factura</th>
                                <th>Cliente</th>
                                <th>Fecha y Hora</th>
                                <th>Total</th>
                                <th>Estado</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td>
                                    <strong>#FAC-0924</strong>
                                </td>
                                <td>Carlos Rodríguez</td>
                                <td>Hoy, 02:15 PM</td>
                                <td>$ 320.000</td>
                                <td>
                                    <span className="status paid">Completado</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>#FAC-0923</strong>
                                </td>
                                <td>Empresa Alfa S.A.S</td>
                                <td>Hoy, 11:30 AM</td>
                                <td>$ 1.450.000</td>
                                <td>
                                    <span className="status paid">Completado</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>#FAC-0922</strong>
                                </td>
                                <td>María López</td>
                                <td>Ayer, 04:45 PM</td>
                                <td>$ 85.000</td>
                                <td>
                                    <span className="status pending">Pendiente</span>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </section>
                </main>
            </div>
        </div>
    );
}