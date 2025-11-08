import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Nav, Dropdown } from "react-bootstrap";

const AuthSection: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <Nav>
      {isAuthenticated && user ? (
        <Dropdown align="end">
          <Dropdown.Toggle as={Nav.Link} id="dropdown-user">
            Welcome, {user.username}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item as={Link} to="/profile">Profile</Dropdown.Item>
            <Dropdown.Item onClick={logout}>Logout</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      ) : (
        <>
          <Nav.Link as={Link} to="/login">Login</Nav.Link>
          <Nav.Link as={Link} to="/register">Register</Nav.Link>
        </>
      )}
    </Nav>
  );
};

export default AuthSection;