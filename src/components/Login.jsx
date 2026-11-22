import { useEffect, useRef, useState } from "react";
import "../styles/login.css";
import logo from "../assets/logo.png";

export default function Login() {
    // Estados para los campos del formulario
    const [correo, setCorreo] = useState("");
    const [clave, setClave] = useState("");
    const [recordarme, setRecordarme] = useState(false);

    // Estados para el mensaje de validación y su color (error / éxito)
    const [mensaje, setMensaje] = useState("");
    const [esError, setEsError] = useState(false);

    // Guardamos el temporizador para limpiarlo si el componente se desmonta
    const timeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const manejarEnvio = (e) => {
        e.preventDefault();

        const correoLimpio = correo.trim();

        if (!correoLimpio.includes("@")) {
            setEsError(true);
            setMensaje("⚠️ Escribe un correo válido que incluya '@'.");
            return;
        }

        if (clave.length < 8) {
            setEsError(true);
            setMensaje("⚠️ La contraseña debe tener mínimo 8 caracteres.");
            return;
        }

        setEsError(false);
        setMensaje("✅ ¡Datos listos! Ingresando al sistema...");
        
        timeoutRef.current = setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000);
    };

    return (
        <main className="login-wrapper">
            <div className="login-brand">
                <img src={logo} alt="Gestión 360 Logo" className="brand-logo" />
            </div>

            <div className="login-form-container">
                <header className="login-header">
                    <h2>Bienvenido</h2>
                    <p>Ingresa tus credenciales para acceder al sistema</p>
                </header>

                <form id="login" onSubmit={manejarEnvio} noValidate>
                    <div className="form-group">
                        <label htmlFor="u">Correo Electrónico</label>
                        <input
                            type="email"
                            id="u"
                            name="u"
                            placeholder="ejemplo@empresa.com"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="pw">Contraseña</label>
                        <input
                            type="password"
                            id="pw"
                            name="pw"
                            placeholder="••••••••"
                            value={clave}
                            onChange={(e) => setClave(e.target.value)}
                            required
                        />
                    </div>

                    {mensaje && (
                        <p
                            id="msg-login"
                            style={{
                                fontSize: "13px",
                                marginBottom: "15px",
                                fontWeight: 600,
                                color: esError ? "#dc2626" : "#059669",
                            }}
                        >
                            {mensaje}
                        </p>
                    )}

                    <div className="form-actions">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={recordarme}
                                onChange={(e) => setRecordarme(e.target.checked)}
                            />{" "}
                            Recordarme
                        </label>
                        <a href="#" className="forgot-link">
                            ¿Olvidaste tu clave?
                        </a>
                    </div>

                    <button type="submit" className="btn-submit">
                        Ingresar al ERP
                    </button>
                </form>
            </div>
        </main>
    );
}