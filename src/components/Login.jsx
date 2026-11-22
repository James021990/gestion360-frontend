import { useEffect, useRef, useState } from "react";
import "../styles/login.css";
import logo from "../assets/logo.png";

const API_LOGIN_URL = "http://localhost:8080/api/auth/login";

export default function Login({ onLoginExitoso }) {
    const [correo, setCorreo] = useState("");
    const [clave, setClave] = useState("");
    const [mostrarClave, setMostrarClave] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [esError, setEsError] = useState(false);
    const [cargando, setCargando] = useState(false);

    const timeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const manejarEnvio = async (e) => {
        e.preventDefault();

        const correoLimpio = correo.trim();

        if (!correoLimpio.includes("@")) {
            setEsError(true);
            setMensaje("Escribe un correo válido que incluya '@'.");
            return;
        }

        if (clave.length < 8) {
            setEsError(true);
            setMensaje("La contraseña debe tener mínimo 8 caracteres.");
            return;
        }

        setCargando(true);
        setEsError(false);
        setMensaje("Verificando credenciales con el servidor...");

        try {
            const respuesta = await fetch(API_LOGIN_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    correo: correoLimpio,
                    password: clave,
                }),
            });

            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok) {
                setCargando(false);
                setEsError(true);
                setMensaje(datos.mensaje || "Correo o contraseña incorrectos.");
                return;
            }

            setEsError(false);
            setMensaje(`¡Bienvenido, ${datos.nombre_completo || correoLimpio}! Ingresando al sistema...`);

            timeoutRef.current = setTimeout(() => {
                setCargando(false);
                if (typeof onLoginExitoso === "function") {
                    onLoginExitoso(datos.correo || correoLimpio);
                }
            }, 1000);
        } catch {
            setCargando(false);
            setEsError(true);
            setMensaje("No se pudo conectar con el backend en puerto 8080. Verifica que esté corriendo.");
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="brand-header">
                    <img src={logo} alt="Gestión 360 Logo" className="brand-logo" />
                    <p className="brand-subtitle">Sistema Integral de Gestión Empresarial</p>
                </div>

                <form className="login-form" onSubmit={manejarEnvio} noValidate>
                    <div className="input-group">
                        <label htmlFor="correo">Correo electrónico</label>
                        <input
                            type="email"
                            id="correo"
                            name="correo"
                            placeholder="usuario@empresa.com"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            disabled={cargando}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="clave">Contraseña</label>
                        <div className="password-wrapper">
                            <input
                                type={mostrarClave ? "text" : "password"}
                                id="clave"
                                name="clave"
                                placeholder="••••••••"
                                value={clave}
                                onChange={(e) => setClave(e.target.value)}
                                disabled={cargando}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setMostrarClave((prev) => !prev)}
                                aria-label="Mostrar o ocultar contraseña"
                                disabled={cargando}
                            >
                                {mostrarClave ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    <div className="form-options">
                        <label className="remember-me">
                            <input type="checkbox" name="recordar" disabled={cargando} />
                            <span>Recordar sesión</span>
                        </label>
                        <a href="#recuperar" className="forgot-password">
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>

                    <button type="submit" className="btn-login" disabled={cargando}>
                        {cargando ? "Validando..." : "Ingresar al ERP"}
                    </button>

                    {mensaje && (
                        <div
                            className={`mensaje-feedback ${esError ? "error" : "exito"}`}
                            role="alert"
                        >
                            {mensaje}
                        </div>
                    )}
                </form>

                <div className="login-footer">
                    <p>© 2026 Gestión 360 ERP. Todos los derechos reservados.</p>
                </div>
            </div>
        </div>
    );
}