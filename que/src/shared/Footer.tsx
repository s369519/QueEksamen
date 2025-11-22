import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer: React.FC = () => {
  return (
    <footer 
      className="mt-auto py-4"
      style={{
        background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 50%, #4a5b9e 100%)',
        color: 'white',
        width: '100%',
        marginLeft: 0,
        marginRight: 0
      }}
    >
      <Container fluid>
        <Row className="align-items-center">
          <Col md={4} className="text-center text-md-start mb-3 mb-md-0">
            <h5 className="fw-bold mb-2">¿Qué?</h5>
            <p className="mb-0 small" style={{ opacity: 0.9 }}>
              Test your knowledge, challenge yourself
            </p>
          </Col>
          
          <Col md={4} className="text-center mb-3 mb-md-0">
            <div className="mb-3">
              <p className="mb-1 small">
                <i className="bi bi-geo-alt-fill me-2"></i>
                Pilestredet 35, 0166 Oslo
              </p>
              <p className="mb-1 small">
                <i className="bi bi-telephone-fill me-2"></i>
                +47 116 123
              </p>
              <p className="mb-0 small">
                <i className="bi bi-envelope-fill me-2"></i>
                que.company@service.com
              </p>
            </div>
            <div className="d-flex justify-content-center gap-3 mt-3">
              <a 
                href="#" 
                className="text-white fs-4"
                style={{ transition: 'opacity 0.3s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <i className="bi bi-instagram"></i>
              </a>
              <a 
                href="#" 
                className="text-white fs-4"
                style={{ transition: 'opacity 0.3s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a 
                href="#" 
                className="text-white fs-4"
                style={{ transition: 'opacity 0.3s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <i className="bi bi-envelope"></i>
              </a>
            </div>
          </Col>
          
          <Col md={4} className="text-center text-md-end">
            <p className="mb-0 small" style={{ opacity: 0.8 }}>
              © {new Date().getFullYear()} ¿Qué? All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;