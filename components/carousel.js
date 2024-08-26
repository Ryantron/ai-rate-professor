'use client'
import React from 'react';
import Carousel from 'react-material-ui-carousel';
import { Card, CardContent, Typography, IconButton } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const professors = [
  {
    name: 'Professor Alice Johnson',
    department: 'Computer Science',
    rating: '4.8/5',
    review: 'Known for interactive lectures and practical examples. Highly recommended for her clarity in teaching complex topics.',
  },
  {
    name: 'Professor Bob Smith',
    department: 'Mathematics',
    rating: '4.5/5',
    review: 'Makes difficult concepts understandable and is always available to help students outside of class.',
  },
  {
    name: 'Professor Carol Davis',
    department: 'Physics',
    rating: '4.9/5',
    review: 'Engages students with thought-provoking experiments and detailed explanations.',
  },
  {
    name: 'Professor David Brown',
    department: 'Chemistry',
    rating: '4.2/5',
    review: 'Challenging coursework but very rewarding. Excellent lab sessions and clear grading criteria.',
  },
  {
    name: 'Professor Eva White',
    department: 'Biology',
    rating: '4.7/5',
    review: 'Passionate about the subject and encourages students to participate in research projects.',
  },
];

function ProfessorCarousel() {
  return (
    <Carousel
      indicators={false}
      navButtonsProps={{          
        style: {
          backgroundColor: '#A3A380',
          color: '#EFEBCE',
        },
      }}
      NextIcon={<ArrowForwardIosIcon />}
      PrevIcon={<ArrowBackIosIcon />}
    >
      {professors.map((professor, index) => (
        <Card
          key={index}
          sx={{
            maxWidth: 600,
            margin: 'auto',
            backgroundColor: '#D8A48F',
            color: '#EFEBCE',
            padding: 4,
          }}
        >
          <CardContent>
            <Typography variant="h4" component="div">
              {professor.name}
            </Typography>
            <Typography variant="body1">
              <strong>Department:</strong> {professor.department}
            </Typography>
            <Typography variant="body1">
              <strong>Rating:</strong> {professor.rating}
            </Typography>
            <Typography variant="body1">
              <strong>Review:</strong> {professor.review}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Carousel>
  );
}

export default ProfessorCarousel;

