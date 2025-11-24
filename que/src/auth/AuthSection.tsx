import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Nav, Dropdown, Button } from "react-bootstrap";

const AuthSection: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <Nav>
      {isAuthenticated && user ? (
        <Dropdown align="end">
          <Dropdown.Toggle 
            as={Nav.Link} 
            id="dropdown-user"
            className="fw-semibold"
            style={{
              color: 'white',
              fontSize: '1.1rem',
              cursor: 'pointer',
              textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            <i className="bi bi-person-circle me-2"></i>
            Welcome, {user.username}
          </Dropdown.Toggle>
          <Dropdown.Menu className="shadow-lg border-0">
            <Dropdown.Item 
              as={Link} 
              to="/profile"
              className="fw-semibold"
            >
              <i className="bi bi-person me-2" style={{ color: '#6f42c1' }}></i>
              Profile
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item 
              onClick={logout}
              className="fw-semibold text-danger"
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      ) : (
        <Button
          as={Link as any}
          to="/login"
          variant="light"
          className="fw-bold ms-2 sign-in-btn"
          style={{
            color: '#6f42c1',
            borderRadius: '20px',
            padding: '8px 24px',
            border: '2px solid white',
            transition: 'all 0.3s ease',
            backgroundColor: '#f8f9fa'
          }}
        >
          <style>
            {`
              .sign-in-btn:hover {
                background-color: white !important;
                transform: scale(1.05);
                color: #6f42c1 !important;
              }
                
            `}
          </style>
          <i className="bi bi-box-arrow-in-right me-2"></i>
          Sign In
        </Button>
      )}
    </Nav>
  );
};

export default AuthSection;