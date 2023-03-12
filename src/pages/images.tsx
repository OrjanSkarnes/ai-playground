import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardMedia, Container, Grid, Typography } from "@mui/material";
import { getAllImages } from './services/OpenAIService';


const Images = ({ loggedIn }: any) => {
  loggedIn = true;
  const [images, setImages] = useState<{ url: string, name: string }[] | undefined>([]);

  useEffect(() => {
    const fetchImages = async () => {
      // @ts-ignore
      const imageBolbs = await getAllImages();
      console.log(imageBolbs)
      setImages(imageBolbs);
    }
    if (loggedIn && images?.length === 0) {
      fetchImages().then();
    }
  }, [loggedIn]);

  const imageGrid = (image: any, index: any) => {
    return (
      <Grid item xs={4} sm={4} md={4} key={index}>
        <Card key={index} className="card">
          <CardMedia
            component="img"
            height="auto"
            className="media"
            image={image.url}
            alt={image.name}
          />
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom>
              {image.name}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    );
  }

  const imageCards = images?.map((image, index) => imageGrid(image, index))

  return (
    <Container maxWidth="lg" className="container">
      {imageCards && (
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: imageCards?.length > 1 ? 8 : 4, md: imageCards?.length > 1 ? 12 : 4 }}>
          {imageCards}
        </Grid>
      )}
    </Container>
  );
}

export default Images;