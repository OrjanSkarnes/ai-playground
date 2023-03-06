import { NextApiRequest, NextApiResponse } from "next";
import { gptApi } from "../gptAPI";
import { logger } from "../logger";
import NodeCache from 'node-cache';
const cache = new NodeCache();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  logger.info("url:::::" + req.url);
  if (req.method === 'POST') {
    // Process a POST request
    const prompt = req.body.request;
    const cachedResponse = cache.get(JSON.stringify(prompt));
    if (cachedResponse) {
      logger.info("cache hit");
      res.status(200).json({ response: cachedResponse });
      return;
    }
    gptApi.getChat(prompt).then((response: any) => {
      cache.set(JSON.stringify(prompt), response.choices[0].message.content)
      res.status(200).json({ response: response.choices[0].message.content });
    }).catch((error) => {
      res.status(500).json({error});
    });
  } else {
    res.status(405).json({ message: 'We only support POST' })
  }
}