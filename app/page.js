import { Box, Button, Container, CssBaseline, Card, CardContent, Typography } from '@mui/material';
import Navbar from "@/components/navbar"
import ProfessorCarousel from '@/components/carousel';

export default function Home() {
  return (
  <>
      {/* Header */}
      <Navbar home={true}/>

      <Container maxWidth="lg">
        <CssBaseline />
        
        {/* Search Section */}
        <Box sx={{ mt: 8, mb: 4, textAlign: 'center', color: "#BB8588" }}>
          <Typography variant="h2" gutterBottom>
            Find Your Professor
          </Typography>
          <Button href='/generate' sx={{ backgroundColor: '#A3A380', color: "white", px: 3}}> Click here </Button>
        </Box>
        
        {/* Professors List */}
        <ProfessorCarousel/>
      </Container>
    </>
    );
}
