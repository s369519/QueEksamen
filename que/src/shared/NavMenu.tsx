import React from "react";
import { Nav, Navbar, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from "../auth/AuthContext";
import AuthSection from "../auth/AuthSection";

const NavMenu: React.FC = () => {
    const { isAuthenticated } = useAuth();
    return (
        <Navbar expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">Que</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        <Nav.Link as={Link} to="/quizes">Quizes</Nav.Link>
                        {isAuthenticated && (
                            <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
            <AuthSection />
        </Navbar>
    );
};

export default NavMenu;