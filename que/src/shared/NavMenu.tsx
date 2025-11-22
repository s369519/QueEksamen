import React from "react";
import { Nav, Navbar, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from "../auth/AuthContext";
import AuthSection from "../auth/AuthSection";

const NavMenu: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <Navbar 
            expand="lg" 
            className="shadow-sm py-3"
            style={{ 
                background: 'linear-gradient(135deg, #8b5fc7 0%, #7a5aae 50%, #6d7dbe 100%)',
            }}
        >
            <Container fluid>
                <Navbar.Brand 
                    as={Link} 
                    to="/" 
                    className="fw-bold fs-3"
                    style={{ 
                        color: 'white',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                    }}
                >
                    ¿Qué?
                </Navbar.Brand>
                <Navbar.Toggle 
                    aria-controls="basic-navbar-nav"
                    style={{ 
                        backgroundColor: 'white',
                        borderColor: 'white'
                    }}
                />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto ms-4">
                        <Nav.Link 
                            as={Link} 
                            to="/"
                            className="mx-2 fw-semibold"
                            style={{
                                color: isActive('/') ? 'white' : 'rgba(255,255,255,0.85)',
                                borderBottom: isActive('/') ? '3px solid white' : 'none',
                                paddingBottom: '5px',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <i className="bi bi-compass me-1"></i>
                            Explore
                        </Nav.Link>
                        <Nav.Link 
                            as={Link} 
                            to="/quizes"
                            className="mx-2 fw-semibold"
                            style={{
                                color: isActive('/quizes') ? 'white' : 'rgba(255,255,255,0.85)',
                                borderBottom: isActive('/quizes') ? '3px solid white' : 'none',
                                paddingBottom: '5px',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <i className="bi bi-collection me-1"></i>
                            Quizzes
                        </Nav.Link>
                        {isAuthenticated && (
                            <Nav.Link 
                                as={Link} 
                                to="/profile"
                                className="mx-2 fw-semibold"
                                style={{
                                    color: isActive('/profile') ? 'white' : 'rgba(255,255,255,0.85)',
                                    borderBottom: isActive('/profile') ? '3px solid white' : 'none',
                                    paddingBottom: '5px',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <i className="bi bi-person-circle me-1"></i>
                                Profile
                            </Nav.Link>
                        )}
                    </Nav>
                    <AuthSection />
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default NavMenu;