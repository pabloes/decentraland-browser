import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button } from '@mui/material';

const Home: React.FC = () => {
    return (
        <Container maxWidth="sm" style={{ marginTop: '2rem' }}>
            <Typography variant="h4" gutterBottom>
                Home Page
            </Typography>
            <Button variant="contained" color="primary" component={Link} to="/browser-sessions">
                Go to Browser Sessions
            </Button>
        </Container>
    );
};

export default Home;