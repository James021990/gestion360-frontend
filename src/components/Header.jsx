import logo from "../assets/logo.png";

export default function Header({
                                   vistaActiva,
                                   nombreUsuario,
                                   onIrDashboard,
                                   onIrUsuarios,
                                   onIrInventario,
                                   onIrVentas,
                               }) {
    const srcLogo = typeof logo === "string" ? logo : String(logo);

    return (
        <header className="app-header">
            <div className="header-container">
                <div className="logo-area">
                    <img src={srcLogo} alt="Gestión 360" className="header-logo" />
                </div>

                <nav className="nav-links">
                    <button
                        type="button"
                        className={`nav-item ${vistaActiva === "dashboard" ? "active" : ""}`}
                        onClick={onIrDashboard}
                    >
                        Dashboard
                    </button>
                    <button
                        type="button"
                        className={`nav-item ${vistaActiva === "usuarios" ? "active" : ""}`}
                        onClick={onIrUsuarios}
                    >
                        Usuarios
                    </button>
                    <button
                        type="button"
                        className={`nav-item ${vistaActiva === "inventario" ? "active" : ""}`}
                        onClick={onIrInventario}
                    >
                        Inventario
                    </button>
                    <button
                        type="button"
                        className={`nav-item ${vistaActiva === "ventas" ? "active" : ""}`}
                        onClick={onIrVentas}
                    >
                        Ventas
                    </button>
                </nav>

                <div className="user-profile">
                    <span className="user-avatar">👤</span>
                    <span className="user-name">{nombreUsuario || "Administrador"}</span>
                </div>
            </div>
        </header>
    );
}