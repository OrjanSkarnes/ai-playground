// This is a service that will be used to call the OpenAI API
// Can send get request to both the text and code api with a prompt parameter

import axios from 'axios';

export async function createArticle(prompt: string) {
  const userId = localStorage.getItem("userId");
  const response = await axios.post(`/api/openai/create/article`, {prompt, userId})
  // Handle error
  if (response.status !== 200) {
    console.log('Error creating article');
    return;
  }
  return await response.data.article;
}

export async function fetchAllArticles() {
  const userId = localStorage.getItem("userId");
  // How to handle stream from backend in the frontend service
  const response = await axios.get(`/api/openai/articles`, {params: {userId}})
  // Handle error
  if (response.status !== 200) {
    console.log('Error getting articles.tsx');
    return;
  }
  return response.data;
}

// the express rout is this.express.get("openai/images/:prompt"
export async function getAllImages() : Promise<{url: string, name: string}[] | undefined> {
  const response = await axios.get(`/api/openai/images`)
  // Handle error
  if (response.status !== 200) {
    console.log('Error getting images');
    return;
  }
  return getImageUrl(response.data.images, true);
}

export async function getImagesByRef(imgRef: string) {
  if (!imgRef) return null;
  const response = await axios.get(`/api/openai/images`, {params: {imgRef: imgRef}})
  // Handle error
  if (response.status !== 200) {
    console.log('Error getting images');
    return;
  }
  return getImageUrl(response.data.images);
}

export async function getImage(prompt: string) {
  const response = await fetch(`/api/openai/image/${prompt}`);
  return await response.json();
}

export async function getTextGeneration(prompt: string) {
  const response = await axios.post(`/api/openai/text`, {prompt})
  // Handle error
  if (response.status !== 200) {
    console.log('Error creating text');
    return;
  }
  return await response.data;
}



export async function getCodeGeneration(prompt: string) {
  const response = await fetch(`/api/openai/code/${prompt}`);
  return await response.json();
}

export async function getImageGeneration(prompt: string) {
  const response = await fetch(`/api/openai/image/${prompt}`);
  return await response.json();
}


export const getImageUrl = (images: any, getName?: boolean): any | undefined => {
  if (!images || images.length === 0) return null;
  const urls: string[] = []
  const imageUrlsAndNames: any[] = [];
  images.forEach((image: any) => {
    const img = image.image || image.data;
    const imageBase64 = img.split(',')[1]; // extract the base64 data from the data

    const binary_string = window.atob(imageBase64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }

    const imageSrc = new Blob([bytes.buffer], {type: 'image/png'});
    urls.push(URL.createObjectURL(imageSrc));
    imageUrlsAndNames.push({url: URL.createObjectURL(imageSrc), name: image.prompt});
  });

  return !getName ? urls : imageUrlsAndNames;
}
