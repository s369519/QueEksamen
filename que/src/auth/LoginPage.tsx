import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";
import * as authService from "./AuthService";

// ----------------- inline styles -----------------

const loginPageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingTop: "60px",
  background: "#ffffff",
};

const loginBrandStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "24px",
};

const brandTitleStyle: React.CSSProperties = {
  fontSize: "40px",
  fontWeight: 800,
  margin: "0 0 6px",
  color: "#6a5cff",
};

const brandSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#7a7b8a",
  fontSize: "16px",
};

const loginCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  width: "100%",
  maxWidth: "520px",
  borderRadius: "20px",
  padding: "24px 26px 28px",
  boxShadow: "0 14px 40px rgba(20, 20, 40, 0.15)",
};

const loginCardHeaderStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "18px",
};

const loginIconStyle: React.CSSProperties = {
  fontSize: "22px",
};

const loginHeaderTitleStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  margin: "6px 0 4px",
};

const loginHeaderTextStyle: React.CSSProperties = {
  margin: "0 0 12px",
  color: "#8b8c98",
  fontSize: "14px",
};

const loginTabsStyle: React.CSSProperties = {
  background: "#f1f2f7",
  borderRadius: 999,
  padding: 4,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 4,
};

const loginTabBaseStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  borderRadius: 999,
  padding: "8px 10px",
  fontSize: "14px",
  fontWeight: 600,
  color: "#75768a",
  cursor: "pointer",
};

const loginTabActiveStyle: React.CSSProperties = {
  background: "#ffffff",
  color: "#1e2033",
  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.08)",
};

const inputStyle: React.CSSProperties = {
  borderRadius: 10,
  border: "1px solid #e0e2ea",
  backgroundColor: "#f7f8fb",
};

const submitButtonStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 10,
  fontWeight: 600,
  padding: "10px",
  backgroundColor: "#070714",
  border: "none",
};

const alertStyle: React.CSSProperties = {
  borderRadius: 10,
};

// ------------------------------------------------

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<"login" | "register">("login");

  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await login({
        username: loginData.username,
        password: loginData.password,
      });
      navigate("/quizes");
    } catch (err) {
      setError("Invalid username or password.");
      console.error(err);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await authService.register(registerData);
      setSuccess("Registration successful! You can now log in.");
      setMode("login");
      setLoginData({
        username: registerData.username,
        password: registerData.password,
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      console.error(err);
    }
  };

  return (
    <main style={loginPageStyle}>
      {/* Brand / logo */}
      <div style={loginBrandStyle}>
        <h1 style={brandTitleStyle}>¿Qué ?</h1>
        <p style={brandSubtitleStyle}>Join the ultimate quiz community</p>
      </div>

      {/* Card */}
      <div style={loginCardStyle}>
        <div style={loginCardHeaderStyle}>
          <span style={loginIconStyle} aria-hidden>
            👤
          </span>
          <h2 style={loginHeaderTitleStyle}>Welcome</h2>
          <p style={loginHeaderTextStyle}>
            Sign in to your account or create a new one
          </p>

          {/* Tabs */}
          <div style={loginTabsStyle} role="tablist">
            <button
              type="button"
              style={{
                ...loginTabBaseStyle,
                ...(mode === "login" ? loginTabActiveStyle : {}),
              }}
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
              }}
            >
              → Sign In
            </button>
            <button
              type="button"
              style={{
                ...loginTabBaseStyle,
                ...(mode === "register" ? loginTabActiveStyle : {}),
              }}
              onClick={() => {
                setMode("register");
                setError(null);
                setSuccess(null);
              }}
            >
              ☻ Sign Up
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <Alert variant="danger" className="mb-3" style={alertStyle}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="mb-3" style={alertStyle}>
            {success}
          </Alert>
        )}

        {/* LOGIN FORM */}
        {mode === "login" && (
          <Form onSubmit={handleLoginSubmit}>
            <Form.Group className="mb-3" controlId="loginUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                placeholder="Enter username"
                value={loginData.username}
                onChange={handleLoginChange}
                required
                autoComplete="username"
                style={inputStyle}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="loginPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
                autoComplete="current-password"
                minLength={6}
                style={inputStyle}
              />
            </Form.Group>

            <Button type="submit" style={submitButtonStyle}>
              Sign In
            </Button>
          </Form>
        )}

        {/* REGISTER FORM */}
        {mode === "register" && (
          <Form onSubmit={handleRegisterSubmit}>
            <Form.Group className="mb-3" controlId="registerUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                placeholder="Choose a username"
                value={registerData.username}
                onChange={handleRegisterChange}
                required
                style={inputStyle}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="registerEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="your@email.com"
                value={registerData.email}
                onChange={handleRegisterChange}
                required
                style={inputStyle}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="registerPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Create a password"
                value={registerData.password}
                onChange={handleRegisterChange}
                required
                minLength={6}
                style={inputStyle}
              />
              <Form.Text className="text-muted" style={{ fontSize: '12px' }}>
                Password must be at least 6 characters and contain: uppercase letter, lowercase letter, number, and special character (!@#$%^&*).
              </Form.Text>
            </Form.Group>

            <Button type="submit" style={submitButtonStyle}>
              Sign Up
            </Button>
          </Form>
        )}
      </div>
    </main>
  );
};

export default LoginPage;
