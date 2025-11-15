import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";
import * as authService from "./AuthService";
import "../views/Login/LoginPage.css";

const LoginPage: React.FC = () => {
  // which tab is active? "login" or "register"
  const [mode, setMode] = useState<"login" | "register">("login");

  // login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  // register form state
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  // handle change for login form
  const handleLoginChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  // handle change for register form
  const handleRegisterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
  };

  // submit login
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

  // submit register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await authService.register(registerData);
      setSuccess("Registration successful! You can now log in.");
      // switch to login tab after success
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
    <main className="login-page">
      {/* Brand / logo */}
      <div className="login-brand">
        <h1>¿Qué ?</h1>
        <p>Join the ultimate quiz community</p>
      </div>

      {/* Card */}
      <div className="login-card">
        <div className="login-card-header">
          <span className="login-icon" aria-hidden>
            👤
          </span>
          <h2>Welcome</h2>
          <p>Sign in to your account or create a new one</p>

          {/* Tabs */}
          <div className="login-tabs" role="tablist">
            <button
              type="button"
              className={`login-tab ${
                mode === "login" ? "active" : ""
              }`}
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
              className={`login-tab ${
                mode === "register" ? "active" : ""
              }`}
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
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="mb-3">
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
              />
            </Form.Group>

            <Button type="submit" className="login-submit-btn">
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
              />
            </Form.Group>

            <Button type="submit" className="login-submit-btn">
              Sign Up
            </Button>
          </Form>
        )}
      </div>
    </main>
  );
};

export default LoginPage;
