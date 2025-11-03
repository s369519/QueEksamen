import React from "react";
import { Nav, Navbar, Container } from 'react-bootstrap';
import AuthSection from "../auth/AuthSection";

const NavMenu: React.FC = () => {
    return (
        <Navbar expand="lg">
            <Container>
                <Navbar.Brand href="/">Que</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="/quizes">Quizes</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
            <AuthSection />
        </Navbar>
    );
};

export default NavMenu;