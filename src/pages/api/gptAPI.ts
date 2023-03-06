import { OpenAIApi, Configuration, ChatCompletionRequestMessage, CreateChatCompletionResponse } from 'openai';
import { Logger } from './logger';


export class GPTApi {
  private openai: OpenAIApi;
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.openai = new OpenAIApi(configuration);
  }

  public async getImage(prompt: string, n?:number) {
    this.openai.createImage({
      prompt: prompt,
      n: n || 1,
      size: "512x512",
    }).then((response: any) => {
      this.logger.info("openai:::::image:::::done");
      return response.data.data
    }).catch((error: any) => {
      this.logger.error("openai:::::image:::::failed:::::" + error);
      return error;
    });
  }

  public async getChat(messages: ChatCompletionRequestMessage[], stop?: string) {
    try {
      const completion = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
        stop
      });
      this.logger.info("openai:::::chat:::::done");
      return completion.data;
    }
    catch (error) {
      this.logger.error("openai:::::chat::::::error:::::" + error);
      return error;
    }
  }

  public async getChatOneMessage(message: string) {
    try {
      // create a completion with gpt-3.5-turbo model
      const completion = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: message,
        }],
      });
      this.logger.info("openai:::::chat message:::::done");
      return completion.data.choices[0].message?.content;
    }
    catch (error: any) {
      this.logger.error(error);
    }
  }

  public async getGeneration(engine: string, prompt: string) {
    try {
      const response = await this.openai.createCompletion({
        model: engine,
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.6,
        stream: false,
      });
      this.logger.info("openai:::::generation:::::done");
      return response.data.choices[0].text;
    } catch (error: any) {
      this.logger.error(error);
      return error;
    }
  }
}

export const gptApi = new GPTApi();