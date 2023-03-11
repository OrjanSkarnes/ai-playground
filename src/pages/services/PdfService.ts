import { getTokens } from '@/lib/tokenizer';
import axios from 'axios';

export async function getPdfSummary(file: File) {
  const formData = new FormData();
  formData.append('pdfFile', file);

  return await axios.post(`/api/pdf/summarize`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
    .then(response => {
      console.log(response)
      return response;
    })
    .catch(error => {
      return error;
    });
}
