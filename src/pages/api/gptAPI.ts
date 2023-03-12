import { getTokens } from '@/lib/tokenizer';
import { OpenAIApi, Configuration, ChatCompletionRequestMessage, CreateChatCompletionResponse } from 'openai';
import { cache } from 'react';
import { Logger } from './logger';

interface ChatParams {
  messages?: ChatCompletionRequestMessage[];
  content?: string;
  stop?: string;
  max_tokens?: number;
  top_p?: number;
  temperature?: number;
  stream?: boolean;
}

export class GPTApi {
  private openai: OpenAIApi;
  private logger: Logger;
  private gptcache = new Map<string, string>();
  constructor() {
    this.logger = new Logger();
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.openai = new OpenAIApi(configuration);
  }

  public async getImage(prompt: string, n?:number) {
    if (this.gptcache.has(prompt)) {
      this.logger.info("openai:::::image:::::cache hit");
      return this.gptcache.get(prompt);
    }
    this.openai.createImage({
      prompt: prompt,
      n: n || 1,
      size: "512x512",
    }).then((response: any) => {
      this.logger.info("openai:::::image:::::done");
      this.gptcache.set(prompt, response.data.data);
      return response.data.data
    }).catch((error: any) => {
      this.logger.error("openai:::::image:::::failed:::::" + error);
      return error;
    });
  }

  public async getChat(chatParams: ChatParams) {
    this.logger.info("openai:::::chat:::::started");
    try {
      const { messages, stop } = chatParams;
      if (this.gptcache.has(JSON.stringify(messages))) {
        this.logger.info("openai:::::chat:::::cache hit");
        const cached = this.gptcache.get(JSON.stringify(messages));
        if (cached) {
          return JSON.parse(cached);
        }
      }
      if (!messages) return "messages is required";
      const completion = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
        stop
      });
      this.logger.info("openai:::::chat:::::done");
      this.gptcache.set(JSON.stringify(messages), JSON.stringify(completion.data));
      return completion.data;
    }
    catch (error) {
      this.logger.error("openai:::::chat::::::error:::::" + error);
      return error;
    }
  }

  public async getChatOneMessage(chatParams: ChatParams): Promise<string> {
    this.logger.info("openai:::::chat message:::::started");
    const { content, stop, max_tokens, top_p, temperature, stream } = chatParams;
    if (!content) {
      this.logger.error("openai:::::chat message:::::content is required");
      return "";
    }
    if (this.gptcache.has(content)) {
      this.logger.info("openai:::::chat message:::::cache hit");
      const cached = this.gptcache.get(content);
      if (cached) {
        return cached;
      }
    }
    try {
      const completion = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content,
        }],
        // stop,
        max_tokens,
        top_p,
        temperature,
        stream,
      });
      this.logger.info("openai:::::chat message:::::done");
      this.gptcache.set(content, completion.data.choices[0].message?.content || "");
      return completion.data.choices[0].message?.content || "";
    }
    catch (error: any) {
      this.logger.error("openai::::::chat message:::::length:::::" + getTokens(content) +"::::error::::" + error);
      throw new Error(error);
    }
  }

  public async getGeneration(engine: string, prompt: string) {
    this.logger.info("openai:::::generation:::::started");
    if (this.gptcache.has(prompt)) {
      this.logger.info("openai:::::generation:::::cache hit");
      const cached = this.gptcache.get(prompt);
      if (cached) {
        return cached;
      }
    }
    try {
      const response = await this.openai.createCompletion({
        model: engine,
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.6,
        stream: false,
      });
      this.logger.info("openai:::::generation:::::done");
      this.gptcache.set(prompt, response.data.choices[0].text|| "");
      return response.data.choices[0].text;
    } catch (error: any) {
      this.logger.error(error);
      throw new Error(error);
    }
  }
}

export const gptApi = new GPTApi();