import { useState } from "react";
import "../styles/login.css";
import logo from "../assets/logo.png";

export default function Login() {
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [recordarme, setRecordarme] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [esError, setEsError] = useState(false);
    
    const manejarEnvio = (evento) => {
        evento.preventDefault(); // Evita que la página se recargue sola

        if (!correo.trim() || !contrasena.trim()) {
            setEsError(true);
            setMensaje("Por favor completa el correo electrónico y la contraseña.");
            return;
        }

        setEsError(false);
        setMensaje("Validando credenciales...");

        console.log({ correo, contrasena, recordarme });
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
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
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
                                color: esError ? "#c0392b" : "#1e6b3a",
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