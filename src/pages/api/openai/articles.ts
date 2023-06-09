// Return text generated by OpenAI API
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../database";
import { logger } from "../logger";
import { ArticleModel } from "@/models/articleModel";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  logger.info("url:::::::" + req.url);
  const articles: any[] = [];
  await dbConnect();
  const stream = ArticleModel.find(null).cursor();
  // For each article, push it into the articles.tsx array
  stream.on('data', (doc: any) => {
    articles.push(doc);
  })
    .on('end', () => {
      return res.json(articles);
    }) // If there is an error, log it
    .on('error', (error: any) => {
      console.log(error);
    });
}