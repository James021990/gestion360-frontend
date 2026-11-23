import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import "../styles/dashboard.css";
import logo from "../assets/logo.png";

const API_FACTURAS_URL = "http://localhost:8080/api/facturas";
const API_DETALLE_URL = "http://localhost:8080/api/detalle_factura";
const API_PRODUCTOS_URL = "http://localhost:8080/api/productos";
const API_CATEGORIAS_URL = "http://localhost:8080/api/categorias";
const API_CLIENTES_URL = "http://localhost:8080/api/clientes";

const MESES_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct"];
const COLORES_CATEGORIAS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

const extraerMesIndice = (factura) => {
    const fechaRaw =
        factura?.fecha_emision ??
        factura?.fechaEmision ??
        factura?.fecha ??
        factura?.created_at ??
        factura?.createdAt;

    if (!fechaRaw) return null;

    if (Array.isArray(fechaRaw) && fechaRaw.length >= 2) {
        const idx = Number(fechaRaw[1]) - 1;
        return idx >= 0 && idx < 12 ? idx : null;
    }

    const texto = String(fechaRaw).trim();
    const matchIso = texto.match(/^\d{4}[-/](\d{2})/);
    if (matchIso) {
        const idx = Number(matchIso[1]) - 1;
        return idx >= 0 && idx < 12 ? idx : null;
    }

    const fechaObj = new Date(texto);
    if (!Number.isNaN(fechaObj.getTime())) {
        return fechaObj.getMonth();
    }

    return null;
};

const extraerTotalFactura = (factura) => {
    const raw =
        factura?.total ??
        factura?.total_a_pagar ??
        factura?.totalAPagar ??
        factura?.subtotal ??
        0;
    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
};

const formatoMoneda = (valor) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
    }).format(Number(valor) || 0);

const formatoNumero = (valor) =>
    new Intl.NumberFormat("es-CO", {
        maximumFractionDigits: 0,
    }).format(Number(valor) || 0);

export default function Dashboard({
                                      usuarioCorreo,
                                      onIrUsuarios,
                                      onIrInventario,
                                      onIrProductos,
                                      onIrCategorias,
                                      onIrVentas,
                                      onIrHistorialFacturas,
                                      onIrClientes,
                                      onCerrarSesion,
                                  }) {
    const [menuAbierto, setMenuAbierto] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [facturas, setFacturas] = useState([]);
    const [detalles, setDetalles] = useState([]);
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [clientes, setClientes] = useState([]);

    const salesCanvasRef = useRef(null);
    const categoriesCanvasRef = useRef(null);
    const salesChartInstance = useRef(null);
    const categoriesChartInstance = useRef(null);

    const alternarMenu = (nombreMenu) => {
        setMenuAbierto((prev) => (prev === nombreMenu ? null : nombreMenu));
    };

    const manejarCerrarSesion = (e) => {
        e.preventDefault();
        setMenuAbierto(null);
        if (typeof onCerrarSesion === "function") {
            onCerrarSesion();
        }
    };

    const manejarClicEnlace = (e, enlace) => {
        if (!enlace?.vista) return;
        e.preventDefault();
        setMenuAbierto(null);

        if (enlace.vista === "usuarios") {
            if (typeof onIrUsuarios === "function") {
                onIrUsuarios();
            }
        } else if (enlace.vista === "inventario" || enlace.vista === "productos") {
            if (typeof onIrProductos === "function") {
                onIrProductos();
            } else if (typeof onIrInventario === "function") {
                onIrInventario();
            }
        } else if (enlace.vista === "categorias") {
            if (typeof onIrCategorias === "function") {
                onIrCategorias();
            }
        } else if (enlace.vista === "ventas") {
            if (typeof onIrVentas === "function") {
                onIrVentas();
            }
        } else if (enlace.vista === "historial-facturas") {
            if (typeof onIrHistorialFacturas === "function") {
                onIrHistorialFacturas();
            }
        } else if (enlace.vista === "clientes") {
            if (typeof onIrClientes === "function") {
                onIrClientes();
            }
        }
    };

    const manejarVerTodasVentas = (e) => {
        if (typeof onIrHistorialFacturas === "function") {
            e.preventDefault();
            onIrHistorialFacturas();
        } else if (typeof onIrVentas === "function") {
            e.preventDefault();
            onIrVentas();
        }
    };

    useEffect(() => {
        let activo = true;

        const cargarDatosDashboard = async () => {
            try {
                const [resFact, resDet, resProd, resCat, resCli] = await Promise.all([
                    fetch(API_FACTURAS_URL).catch(() => null),
                    fetch(API_DETALLE_URL).catch(() => null),
                    fetch(API_PRODUCTOS_URL).catch(() => null),
                    fetch(API_CATEGORIAS_URL).catch(() => null),
                    fetch(API_CLIENTES_URL).catch(() => null),
                ]);

                const [dataFact, dataDet, dataProd, dataCat, dataCli] = await Promise.all([
                    resFact && resFact.ok ? resFact.json() : Promise.resolve([]),
                    resDet && resDet.ok ? resDet.json() : Promise.resolve([]),
                    resProd && resProd.ok ? resProd.json() : Promise.resolve([]),
                    resCat && resCat.ok ? resCat.json() : Promise.resolve([]),
                    resCli && resCli.ok ? resCli.json() : Promise.resolve([]),
                ]);

                if (!activo) return;

                setFacturas(Array.isArray(dataFact) ? dataFact : []);
                setDetalles(Array.isArray(dataDet) ? dataDet : []);
                setProductos(Array.isArray(dataProd) ? dataProd : []);
                setCategorias(Array.isArray(dataCat) ? dataCat : []);
                setClientes(Array.isArray(dataCli) ? dataCli : []);
            } catch {
                // Si el backend no responde, se mantienen los valores iniciales
            }
        };

        void cargarDatosDashboard();
        return () => {
            activo = false;
        };
    }, []);

    const kpisReales = useMemo(() => {
        const ahora = new Date();
        const mesActual = ahora.getMonth();
        const anioActual = ahora.getFullYear();

        let ventasMesActual = 0;
        let ventasMesAnterior = 0;

        facturas.forEach((f) => {
            const totalFac = extraerTotalFactura(f);
            const fechaRaw =
                f?.fecha_emision ??
                f?.fechaEmision ??
                f?.fecha ??
                f?.created_at ??
                f?.createdAt;

            let mesIdx = extraerMesIndice(f);
            let anioFac = anioActual;

            if (Array.isArray(fechaRaw) && fechaRaw.length >= 2) {
                anioFac = Number(fechaRaw[0]) || anioActual;
                mesIdx = Number(fechaRaw[1]) - 1;
            } else if (fechaRaw) {
                const texto = String(fechaRaw).trim();
                const matchIso = texto.match(/^(\d{4})[-/](\d{2})/);
                if (matchIso) {
                    anioFac = Number(matchIso[1]);
                    mesIdx = Number(matchIso[2]) - 1;
                } else {
                    const fechaObj = new Date(texto);
                    if (!Number.isNaN(fechaObj.getTime())) {
                        anioFac = fechaObj.getFullYear();
                        mesIdx = fechaObj.getMonth();
                    }
                }
            }

            if (mesIdx === mesActual && anioFac === anioActual) {
                ventasMesActual += totalFac;
            } else if (
                (mesActual > 0 && mesIdx === mesActual - 1 && anioFac === anioActual) ||
                (mesActual === 0 && mesIdx === 11 && anioFac === anioActual - 1)
            ) {
                ventasMesAnterior += totalFac;
            }
        });

        const totalVentasMostradas =
            facturas.length === 0
                ? 45850000
                : ventasMesActual > 0
                    ? ventasMesActual
                    : facturas.reduce((acc, f) => acc + extraerTotalFactura(f), 0);

        const variacionTexto =
            facturas.length === 0
                ? "▲ +12% vs mes anterior"
                : ventasMesAnterior > 0
                    ? `${ventasMesActual >= ventasMesAnterior ? "▲ +" : "▼ "}${Math.round(
                        ((ventasMesActual - ventasMesAnterior) / ventasMesAnterior) * 100
                    )}% vs mes anterior`
                    : `● ${facturas.length} facturas registradas`;

        const totalStockUnidades =
            productos.length === 0
                ? 1420
                : productos.reduce((acc, p) => acc + (Number(p?.stock ?? 0) || 0), 0);

        const totalCategorias =
            categorias.length > 0
                ? categorias.length
                : new Set(
                productos
                    .map(
                        (p) =>
                            p?.categoria?.nombre_categoria ??
                            p?.categoria?.nombreCategoria ??
                            p?.categoria?.nombre ??
                            ""
                    )
                    .filter(Boolean)
            ).size || 24;

        const alertasStock =
            productos.length === 0
                ? 8
                : productos.filter((p) => (Number(p?.stock ?? 0) || 0) <= 10).length;

        const clientesActivos =
            clientes.length === 0
                ? 384
                : clientes.filter((c) => {
                    const estado = String(c?.estado ?? "Activo").toLowerCase();
                    return estado !== "inactivo" && estado !== "suspendido";
                }).length;

        return {
            ventasMesTexto: formatoMoneda(totalVentasMostradas),
            variacionTexto,
            variacionNegativa:
                facturas.length > 0 && ventasMesAnterior > 0 && ventasMesActual < ventasMesAnterior,
            stockTexto: `${formatoNumero(totalStockUnidades)} items`,
            categoriasTexto: `● ${totalCategorias} categorías`,
            alertasTexto: `${formatoNumero(alertasStock)} productos`,
            clientesTexto: formatoNumero(clientesActivos),
            clientesSubTexto:
                clientes.length === 0 ? "▲ +5 nuevos hoy" : `● ${clientes.length} registrados`,
        };
    }, [facturas, productos, categorias, clientes]);

    const datosVentasMensuales = useMemo(() => {
        if (facturas.length === 0) {
            return [25000000, 28000000, 32000000, 30000000, 38000000, 42000000, 40000000, 44000000, 41000000, 45850000];
        }
        const acumulados = Array(10).fill(0);
        facturas.forEach((f) => {
            const mesIdx = extraerMesIndice(f);
            if (mesIdx !== null && mesIdx < 10) {
                acumulados[mesIdx] += extraerTotalFactura(f);
            }
        });
        return acumulados;
    }, [facturas]);

    const datosCategorias = useMemo(() => {
        const mapaCat = new Map();

        const mapaProd = new Map();
        productos.forEach((p) => {
            const idP = p?.id_productos ?? p?.id_producto ?? p?.idProducto ?? p?.id;
            if (idP !== undefined && idP !== null) {
                mapaProd.set(String(idP), p);
            }
        });

        const mapaNomCat = new Map();
        categorias.forEach((c) => {
            const idC = c?.id_categoria ?? c?.idCategoria ?? c?.id;
            const nomC = c?.nombre_categoria ?? c?.nombreCategoria ?? c?.nombre;
            if (idC !== undefined && idC !== null && nomC) {
                mapaNomCat.set(String(idC), nomC);
            }
        });

        const obtenerNombreCategoriaProd = (prod) => {
            if (!prod) return "Sin categoría";
            const cat = prod?.categoria;
            if (cat) {
                if (typeof cat === "string") return cat;
                const nom = cat?.nombre_categoria ?? cat?.nombreCategoria ?? cat?.nombre;
                if (nom) return nom;
                const idC = cat?.id_categoria ?? cat?.idCategoria ?? cat?.id;
                if (idC !== undefined && idC !== null && mapaNomCat.has(String(idC))) {
                    return mapaNomCat.get(String(idC));
                }
            }
            return prod?.nombre_categoria || prod?.categoria_nombre || "Sin categoría";
        };

        detalles.forEach((det) => {
            const prodDet = det?.producto;
            const idP =
                prodDet?.id_productos ??
                prodDet?.id_producto ??
                prodDet?.idProducto ??
                prodDet?.id ??
                det?.id_productos ??
                det?.id_producto ??
                det?.idProducto;

            const prodFull =
                (idP !== undefined && idP !== null && mapaProd.get(String(idP))) || prodDet || null;
            const catNombre = obtenerNombreCategoriaProd(prodFull);
            const cant = Number(det?.cantidad ?? 1) || 1;
            const monto =
                Number(det?.subtotal_lineal ?? det?.subtotalLineal ?? det?.subtotal ?? 0) ||
                cant * Number(det?.precio ?? det?.precio_unitario ?? prodFull?.precio ?? 0);

            const prev = mapaCat.get(catNombre) || 0;
            mapaCat.set(catNombre, prev + (monto > 0 ? monto : cant));
        });

        if (mapaCat.size === 0) {
            return {
                labels: ["Tecnología", "Papelería", "Servicios", "Otros"],
                data: [45, 25, 20, 10],
            };
        }

        const entradas = Array.from(mapaCat.entries()).sort((a, b) => b[1] - a[1]);
        return {
            labels: entradas.map(([nombre]) => nombre),
            data: entradas.map(([, valor]) => valor),
        };
    }, [detalles, productos, categorias]);

    const ultimasVentasReporte = useMemo(() => {
        if (facturas.length === 0) {
            return [
                {
                    id: "#FAC-0924",
                    cliente: "Carlos Rodríguez",
                    fecha: "Hoy, 02:15 PM",
                    total: "$ 320.000",
                    estado: "Completado",
                    esPagada: true,
                },
                {
                    id: "#FAC-0923",
                    cliente: "Empresa Alfa S.A.S",
                    fecha: "Hoy, 11:30 AM",
                    total: "$ 1.450.000",
                    estado: "Completado",
                    esPagada: true,
                },
                {
                    id: "#FAC-0922",
                    cliente: "María López",
                    fecha: "Ayer, 04:45 PM",
                    total: "$ 85.000",
                    estado: "Pendiente",
                    esPagada: false,
                },
            ];
        }

        const q = busqueda.trim().toLowerCase();
        return [...facturas]
            .reverse()
            .filter((f) => {
                if (!q) return true;
                const num = String(f?.numero_factura ?? f?.numeroFactura ?? f?.id_factura ?? "").toLowerCase();
                const cli = String(f?.cliente?.nombre_o_razon_social ?? f?.cliente?.nombre ?? "").toLowerCase();
                const est = String(f?.estado_factura ?? f?.estado ?? "").toLowerCase();
                return num.includes(q) || cli.includes(q) || est.includes(q);
            })
            .slice(0, 5)
            .map((f, idx) => {
                const idFac = f?.id_factura ?? f?.idFactura ?? f?.id ?? idx;
                const estado = f?.estado_factura ?? f?.estado ?? "Completada";
                const esPagada =
                    String(estado).toLowerCase().includes("complet") ||
                    String(estado).toLowerCase().includes("pagad");
                return {
                    id: f?.numero_factura ?? f?.numeroFactura ?? `#FAC-${idFac}`,
                    cliente: f?.cliente?.nombre_o_razon_social ?? f?.cliente?.nombre ?? "Cliente",
                    fecha: String(f?.fecha_emision ?? f?.fechaEmision ?? f?.fecha ?? "—"),
                    total: formatoMoneda(extraerTotalFactura(f)),
                    estado,
                    esPagada,
                };
            });
    }, [facturas, busqueda]);

    useEffect(() => {
        if (salesCanvasRef.current) {
            if (salesChartInstance.current) {
                salesChartInstance.current.destroy();
            }

            salesChartInstance.current = new Chart(salesCanvasRef.current.getContext("2d"), {
                type: "line",
                data: {
                    labels: MESES_LABELS,
                    datasets: [
                        {
                            label: "Ventas ($ COP)",
                            data: datosVentasMensuales,
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
                    labels: datosCategorias.labels,
                    datasets: [
                        {
                            data: datosCategorias.data,
                            backgroundColor: datosCategorias.labels.map(
                                (_, idx) => COLORES_CATEGORIAS[idx % COLORES_CATEGORIAS.length]
                            ),
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
    }, [datosVentasMensuales, datosCategorias]);

    const menusDesplegables = [
        {
            id: "usuarios",
            icono: "👥",
            titulo: "Gestión Usuarios",
            enlaces: [
                { texto: "Lista de Usuarios", href: "#usuarios", vista: "usuarios" },
                { texto: "Roles y Permisos", href: "#roles" },
                { texto: "Auditoría de Sesiones", href: "#auditoria" },
            ],
        },
        {
            id: "inventario",
            icono: "📦",
            titulo: "Inventario",
            enlaces: [
                { texto: "Catálogo Productos", href: "#catalogo", vista: "inventario" },
                { texto: "Entradas / Salidas", href: "#movimientos" },
                { texto: "Alertas de Stock", href: "#alertas" },
                { texto: "Categorías", href: "#categorias", vista: "categorias" },
            ],
        },
        {
            id: "ventas",
            icono: "💳",
            titulo: "Ventas",
            enlaces: [
                { texto: "Nueva Venta (POS)", href: "#pos", vista: "ventas" },
                { texto: "Historial Facturas", href: "#facturas", vista: "historial-facturas" },
                { texto: "Clientes", href: "#clientes", vista: "clientes" },
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
                                            <a
                                                key={enlace.texto}
                                                href={enlace.href}
                                                onClick={(e) => manejarClicEnlace(e, enlace)}
                                            >
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
                                <p className="value">{kpisReales.ventasMesTexto}</p>
                                <span
                                    className={`trend ${
                                        kpisReales.variacionNegativa ? "negative" : "positive"
                                    }`}
                                >
                                    {kpisReales.variacionTexto}
                                </span>
                            </div>
                        </div>

                        <div className="kpi-card">
                            <div className="kpi-icon green">📦</div>
                            <div className="kpi-details">
                                <h3>Productos en Stock</h3>
                                <p className="value">{kpisReales.stockTexto}</p>
                                <span className="trend neutral">{kpisReales.categoriasTexto}</span>
                            </div>
                        </div>

                        <div className="kpi-card">
                            <div className="kpi-icon orange">⚠️</div>
                            <div className="kpi-details">
                                <h3>Alertas de Stock</h3>
                                <p className="value">{kpisReales.alertasTexto}</p>
                                <span className="trend negative">▼ Requiere reabastecimiento</span>
                            </div>
                        </div>

                        <div className="kpi-card">
                            <div className="kpi-icon purple">👥</div>
                            <div className="kpi-details">
                                <h3>Clientes Activos</h3>
                                <p className="value">{kpisReales.clientesTexto}</p>
                                <span className="trend positive">{kpisReales.clientesSubTexto}</span>
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
                            <a
                                href="#ventas"
                                className="view-all"
                                onClick={manejarVerTodasVentas}
                            >
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
                            {ultimasVentasReporte.map((fila, idx) => (
                                <tr key={`${fila.id}-${idx}`}>
                                    <td>
                                        <strong>{fila.id}</strong>
                                    </td>
                                    <td>{fila.cliente}</td>
                                    <td>{fila.fecha}</td>
                                    <td>{fila.total}</td>
                                    <td>
                                        <span className={`status ${fila.esPagada ? "paid" : "pending"}`}>
                                            {fila.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </section>
                </main>
            </div>
        </div>
    );
}