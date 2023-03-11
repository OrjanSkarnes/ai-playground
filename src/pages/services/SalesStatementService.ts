import { getTokens } from '@/lib/tokenizer';
import axios from 'axios';

export interface SalesStatementData {
  address: string;
  size: string;
  price: string;
  condition: string;
  bedrooms: string;
  bathrooms: string;
  features: string;
  potential_costs: string;
  potential_issues: string;
  questions: string;
  thoughts: string;
}

const systemInformation =
  `Welcome to the AI-powered home buying assistant! As an expert in analyzing sales statements, I am here to help you make informed decisions about your potential new home.

I can provide you with summaries of the most important information from the sales statement. This includes key factors such as the condition of the house, location, price, and any potential issues or concerns.

In addition, I can provide potential questions to ask during a viewing to gather more information about the property. This will help you make a more informed decision about your potential new home.`

export async function uploadSalesStatementToDB(uploadedFile: File) {
  console.log(uploadedFile)
  const formData = new FormData();
  formData.append('pdfFile', uploadedFile);

  return await axios.post(`/api/sales-statement/upload`, formData, {
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

// Get sales report data
export async function getSalesStatement() {
  return await axios.get(`/api/sales-statement/report`)
    .then(response => {
      console.log(response)
      return response;
    })
    .catch(error => {
      return error;
    });
}

export async function getSalesStatementSummaryJson(message: string) {

  const ordinarySystemPrompt = systemInformation + `
  Based on the individual page analyses that I have provided, I can now create a comprehensive overview of the property that includes all the relevant information that a potential buyer needs to make an informed decision.`

  const advancedSystemPrompt = systemInformation + `
  Create a comprehensive overview of the property that includes all relevant information a potential buyer needs to make an informed decision.

  Start by introducing the property, including its location, size, and current condition. Provide details on any recent upgrades or repairs that have been made to the property, as well as any outstanding issues or concerns that the buyer should be aware of.
  
  Next, provide a detailed description of the property itself, including its layout, number of bedrooms and bathrooms, notable features such as a pool or fireplace and any other unique selling points.
  
  Provide a detailed breakdown of the property's value. Include information on the property's current price, as well as any potential costs or fees that the buyer should be aware of.
  
  Finally, provide a summary of the property's potential as an investment. Give points for and against the property as an investment, and highlight any potential issues or concerns that the buyer should be aware of.
  
  Organize your response into clear and distinct sections, with headings to help guide the reader through the information. Use full sentences and provide as much detail as possible, while keeping your overview concise and to the point.
  
  By following this structured approach, you can ensure that your overview covers all relevant information and provides potential buyers with everything they need to make an informed decision about the property.
  `
  const structure = `Based on the information you will analyze from the sales statement, provide a comprehensive overview of the property. Your response should only be a JSON object with the following keys and string values:

  {
    "address": "[Location of the property]",
    "size": "[Size details, including square footage and dimensions of each room]",
    "price": "[Price details]",
    "condition": "[Condition details, including any recent upgrades or repairs and any outstanding issues or concerns]",
    "bedrooms": "[Number of bedrooms, as well as any additional details such as closet space or en-suite bathrooms]",
    "bathrooms": "[Number of bathrooms, as well as any additional details such as fixtures or recent upgrades]",
    "features": "[Notable features that could affect the buyer's decision]",
    "potential_costs": "[Any potential costs or fees associated with the property, such as HOA fees or property taxes]",
    "potential_issues": "[Any potential issues or concerns that the buyer should be aware of",
    "questions": "[Potential questions for the buyer to ask during a viewing, in order to gather more information about the property]",
    "thoughts": "[The AI assistant's thoughts on the property, including any additional insights or considerations that may be relevant to the buyer]"
  }
   Use full sentences and provide context where necessary to ensure that the information is clear and easy to understand.
    Make sure that each value for the keys is a string and not any other object type.
  `;

  const usercontent = structure + message;

  const request = [
    { role: "system", content: ordinarySystemPrompt },
    { role: "user", content: usercontent },
  ]

  const tokens = getTokens(structure + message + ordinarySystemPrompt);
  if (tokens > 4096) {
    console.log("Too many tokens", tokens)
    // shorten the prompts to fit within the 4096 token limit
  }

  return axios.post(`api/sales-statement/summary`, { request }).then(response => {
     // Extract the JSON object from the response string using a regular expression
     const jsonRegex = /{.*}/s;
     const responseString = response.data.response;
     const match = responseString.match(jsonRegex);
     console.log(responseString)
     if (match) {
       const jsonResponse = match[0];
       return JSON.parse(jsonResponse);
     } else {
       console.error("No JSON object found in server response:", responseString);
       return null;
     }
  }).catch(error => {
    console.log(tokens, error)
    return;
  })
}

export async function getSalesStatementSummaryText(message: string) {

  const ordinarySystemPrompt = systemInformation + `
  Based on the individual page analyses that I have provided, I can now create a comprehensive overview of the property that includes all the relevant information that a potential buyer needs to make an informed decision.`

  const structure = `Based on the information you have provided, I have analyzed the sales statement and created a comprehensive overview of the property. This includes all the relevant information that a potential buyer needs to make an informed decision. 

  My response will be a text summary that is precsise and includes all the details needed when buying a property should at least include location, size, condition, number of bedrooms and bathrooms, notable features, potential costs or fees, potential issues or concerns, questions to ask during a viewing, and my own thoughts on the property.`;

  const usercontent = structure + message;

  const request = [
    { role: "system", content: ordinarySystemPrompt },
    { role: "user", content: usercontent },
  ]

  const tokens = getTokens(structure + message + ordinarySystemPrompt);
  if (tokens > 4096) {
    console.log("Too many tokens", tokens)
    // shorten the prompts to fit within the 4096 token limit
  }

  return axios.post(`api/sales-statement/summary`, { request }).then(response => {
    return response.data;
  }).catch(error => {
    console.log(tokens, error)
    return;
  })
}


export async function sendPageInformation(message: string, MAX_TOKENS?: number) {
  const systemPrompt = systemInformation +
    `Please provide me with a page from the sales statement, and I will analyze it to provide you with key information and important factors that a potential buyer should pay attention to. I will highlight any potential issues or concerns that the buyer should be aware of to make an informed decision about the property.

    My response will be a brief summary of the page, including any relevant information and factors that could affect the buyer's decision. ${ MAX_TOKENS && 'However, to ensure that my response is concise and readable, it will be limited to a maximum of' + MAX_TOKENS + 'tokens. If the summary exceeds this length, I will provide a brief overview of the most important information.'} If there is no useful information found on the page, I will return an empty string.

    Once you have provided all the pages you wish to analyze, I will combine my responses into a comprehensive overview of the property, including all relevant information a potential buyer needs to make an informed decision. The final response may be edited for readability and length, but all relevant information will be included.
  `;
  const request = [
    { role: "system", content: systemPrompt },
    { role: "user", content: message },
  ]

  const tokens = getTokens(message + systemPrompt);
  return await axios.post(`/api/sales-statement/summary`, { request }).then(response => {
    return response.data;
  })
    .catch(error => {
      console.log(tokens, error)
      return;
    })
}
