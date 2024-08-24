import { AppBar, Box, Button, Container, CssBaseline, TextField, Toolbar, Typography, Grid, Card, CardContent } from '@mui/material';

export default function Home() {
  return (
    <Container maxWidth="lg">
      <CssBaseline />
      
      {/* Header */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Mock Rate My Professor
          </Typography>
          <Button color="inherit">Login</Button>
        </Toolbar>
      </AppBar>
      
      {/* Search Section */}
      <Box sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Find Your Professor
        </Typography>
        <TextField 
          variant="outlined" 
          placeholder="Search for a professor..." 
          fullWidth
          sx={{ maxWidth: 600, mx: 'auto' }}
        />
      </Box>
      
      {/* Professors List */}
      <Grid container spacing={4}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  Professor {index + 1}
                </Typography>
                <Typography color="textSecondary">
                  Department
                </Typography>
                <Typography variant="body2">
                  University Name
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
