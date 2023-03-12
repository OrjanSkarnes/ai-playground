// @ts-nocheck
import React, {useEffect, useState} from 'react'
import Typography from '@mui/material/Typography';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  IconButtonProps,
  Modal,
  styled
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import OpenAIInput from './components/Input';
import { createArticle, fetchAllArticles, getImagesByRef, getImageUrl } from './services/OpenAIService';

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const {expand, ...other} = props;
  return <IconButton {...other} />;
})(({theme, expand}) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxHeight: '80%',
  width: '80%;',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  borderRadius: '18px',
  overflow: 'auto',
  boxShadow: 24,
  p: 4,
};


const Articles = ({loggedIn}) => {
  const [prompt, setPrompt] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articleData, setArticleData] = useState([]);
  const [articles, setArticles] = useState<Article>([]);
  const [expanded, setExpanded] = useState([]);

  const handleExpandClick = (index: any) => {
    const newExpanded = [...expanded];
    // @ts-ignore
    newExpanded[index] = !newExpanded[index];
    setExpanded(newExpanded);
  };


  const onChangePrompt = (e: any) => {
    let prompt = e.target.value;
    setPrompt(prompt);
  }

  const generateArticle = async () => {
    setLoading(true);
    createArticle(prompt).then(r => {
      setArticleData([...articleData, r]);
      setLoading(false);
    }).catch(e => {
      console.log(e);
      setLoading(false);
    });
  }


  const getAllArticles = async () => {
    const articles = await fetchAllArticles();
    if (articles.length === 0) {
      return;
    }
    setArticleData(articles);
  }


  useEffect(() => {

    const fetchData = async () => {
      const newArticles = [...articleData];
      if (!newArticles?.length) return;
      for (let i = 0; i < newArticles.length; i++) {
        if (!newArticles[i].urlFetched) {
          if (newArticles[i].imgRef && !newArticles[i].images?.length) {
            console.log('fetching images by ref')
            const imageUrl = await getImagesByRef(newArticles[i].imgRef);
            newArticles[i] = {...newArticles[i], imageUrl, urlFetched: true};
          } else if (newArticles[i].images?.length !== 0) {
            console.log('fetching images by url')
            const imageUrl = getImageUrl(newArticles[i].images);
            newArticles[i] = {...newArticles[i], imageUrl, urlFetched: true};
          }
        } else {
          // If the image url is not fetched, fetch it again
          await fetch(newArticles[i].imageUrl[0]).catch(() => {
            console.log('Error fetching image: fetch again');
            newArticles[i] = {...newArticles[i], imageUrl: undefined, urlFetched: undefined};
            setArticles(newArticles);
          });
        }
        // Add new property to each article is the short version of the content
        newArticles[i] = {...newArticles[i], shortContent: newArticles[i].content.substring(0, 100) + '...'}
      }
      setArticles(newArticles.reverse());
      setExpanded(newArticles.map(() => false));
      setLoadingArticles(false)
      localStorage.setItem('articles.tsx', JSON.stringify(newArticles.map((article) => {
        article.images = undefined;
        return article
      })));
    };
    if (articleData?.length > 0) {
      fetchData().then();
    } else {
      setLoadingArticles(true);
      getAllArticles().then()
    }
  }, [articleData]);

  const ArticleRow = (article: Article, index: number) => {
    return (
      // TODO: Dynamically set size of grid item based on screen size and number of articles.tsx
      <Grid item xs={4} sm={4} md={4} key={index}>
        <Card key={index} className="card" onClick={() => handleExpandClick(index)}>
          {article?.imageUrl?.length > 0 && <CardMedia
              component="img"
              height="240px"
              className="media"
              image={article?.imageUrl[0]}
              alt={article?.prompt}
          />}

          <CardContent className="content">
            <Typography gutterBottom variant="h5" component="div">{article?.prompt} </Typography>
            <Typography variant="body2" color="text.secondary">
              {article.shortContent}
            </Typography>
          </CardContent>
          <Modal
            open={expanded[index]}
            onClose={() => handleExpandClick(index)}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={modalStyle} maxWidth="lg">
              <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                <Typography id="modal-modal-title" variant="h5" component="h2">
                  {article?.prompt}
                </Typography>
                <ExpandMore
                  expand={expanded[index]}
                  onClick={() => handleExpandClick(index)}
                  aria-expanded={expanded[index]}
                  aria-label="close modal"
                >
                  <CloseIcon/>
                </ExpandMore>
              </Box>
              <Divider style={{marginBottom: '2rem'}}/>
              <Box>
                {article?.imageUrl?.length > 0 && <img src={article?.imageUrl[0]} alt={article?.prompt} className="modal-image"/>}
                <Typography sx={{overflowWrap: 'break-word', whiteSpace: 'pre-wrap', display: 'contents'}}>
                  {article?.content.trimStart()}
                </Typography>
              </Box>
            </Box>
          </Modal>
        </Card>
      </Grid>
    )
  }

  const articlesRows = articles.map((user, index) => ArticleRow(user, index))

  return (
    <div>
      <Container maxWidth="lg" className="container">
        <Typography gutterBottom variant="h4" className="articles-heading">Articles</Typography>
        <OpenAIInput
          prompt={prompt}
          loading={loading}
          onChangeForm={onChangePrompt}
          createArticle={generateArticle}
        >
        </OpenAIInput>
      </Container>
      <Container maxWidth="lg" className="container">
        <div className="articles">
          {
            loadingArticles ?
              (<div className="spinner">
                  <CircularProgress color="success"/>
                </div>)
              :
              (<Grid container spacing={{xs: 2, md: 3}} columns={{xs: 4, sm: articleData?.length > 1 ? 8 : 4, md: articleData?.length > 1 ? 12 : 4}}>
                {articlesRows}
              </Grid>)
          }
        </div>
      </Container>
    </div>
  )
}

export default Articles;