import React from 'react';
import VideoCall from './videoCall';
import { Container, Paper, Typography } from '@mui/material';

const App = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Video Call App
        </Typography>
        <VideoCall />
      </Paper>
    </Container>
  );
};

export default App;