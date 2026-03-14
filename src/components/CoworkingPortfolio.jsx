import React from 'react';
import { Box, Typography, Card, CardContent, CardMedia, Grid } from '@mui/material';

// Demo de proyectos
const demoPortfolio = [
  { id: 'pr1', title: 'Mapa de Cobertura Social', description: 'Visualización de datos territoriales.', image: '', link: '' },
  { id: 'pr2', title: 'Plataforma GovTech', description: 'Desarrollo de soluciones para gobierno digital.', image: '', link: '' },
];

export default function CoworkingPortfolio({ portfolio = demoPortfolio }) {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" fontWeight={700} mb={1}>Portafolio de proyectos</Typography>
      <Grid container spacing={2}>
        {portfolio.map(proj => (
          <Grid item xs={12} sm={6} md={4} key={proj.id}>
            <Card>
              {proj.image && <CardMedia component="img" height="120" image={proj.image} alt={proj.title} />}
              <CardContent>
                <Typography fontWeight={700}>{proj.title}</Typography>
                <Typography variant="body2" color="text.secondary">{proj.description}</Typography>
                {proj.link && <Typography variant="body2" color="primary"><a href={proj.link} target="_blank" rel="noopener noreferrer">Ver más</a></Typography>}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
