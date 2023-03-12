import { NextApiRequest, NextApiResponse } from "next";
import { gptApi } from "../gptAPI";
import { logger } from "../logger";

import multer from 'multer';
import { extractPdfData, getTokensFromString } from "../utils";

// disable next.js' default body parser
export const config = {
  api: { bodyParser: false }
}

// parse the pdf file into a buffer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const cache = new Map<string, string>();
const summaryCache = new Map<string, string>();
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  logger.info("url:::::" + req.url);
  if (req.method === 'POST') {
    // @ts-ignore
    upload.single('pdfFile')(req, res, async function (err) {
      if (err) {
        res.status(400).json({ message: err.message })
      } else {
        // @ts-ignore
        const buffer = req.file.buffer;
        const data = await extractPdfData(buffer, 100);
        let text = data?.text;
        if (!text) return res.status(400).json("No text found in PDF file.");
        const pages = text.map(page => page);

        const summary = await summarizeText(pages.join(''));
        res.status(200).json(summary);

        // summarizePdfPages(pages, res).then((summaries) => {
      //     res.status(200).json(summaries);
      //     // cache.set(fileName, summaries);
      //   }).catch((err) => {
      //     res.status(400).json({ message: err.message });
      //   });
      }
    })
  } else {
    res.status(405).json({ message: 'We only support POST' })
  }
}

// Task node interface
interface TaskNode {
  text: string;
  depth: number;
  previousContext: string[];
  height?: number;
  subtasks?: TaskNode[];
}

// Constants
const MAX_CHUNK_SIZE = 800;
const MAX_REQUEST_SIZE = 3900;
const MAX_CONTEXT_DEPTH = 3;
// Summarization model
async function summarize(text: string, previousContext: string[]): Promise<string> {
  const prompt = `Summarize the following text:\n\n${text}\n\n Summary:`;

   // Check if we have a cached result for this prompt
    if (summaryCache.has(prompt)) {
      logger.info('Using cached summary');
      // @ts-ignore
      return summaryCache.get(prompt);
    }

  if (getTokensFromString(prompt) > MAX_REQUEST_SIZE) {
    logger.error('Request size too large');
    return '';
  }

  return await gptApi.getChatOneMessage({content: prompt}).then((response) => {
    summaryCache.set(prompt, response); // Cache the result
    return response;
  }).catch((err) => {
    logger.error("failed to summarize" + err);
    return '';
  });
}

// Chunkify text into smaller pieces
function chunkifyText(text: string, maxTokens: number = MAX_CHUNK_SIZE): string[] {
  // Split text into sentences
  const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!\:)\s+|\p{Cc}+|\p{Cf}+/)
   // Group sentences into chunks based on token count
   const chunkified = [];
   let chunk = '';

   sentences.forEach((sentence) => {
      if (getTokensFromString(sentence) > maxTokens) {
        logger.error('Sentence too long');
        return;
      }
      if (getTokensFromString(chunk + sentence) <= maxTokens) {
        chunk += sentence + ' ';
      } else {
        chunkified.push(chunk.trim());
        chunk = sentence + ' ';
      }
    });
    if (chunk.length > 0) {
      chunkified.push(chunk.trim());
    }
  return chunkified;
}

// Decompose a task into subtasks if needed
async function decomposeIfNeeded(task: TaskNode, maxTokens: number = MAX_CHUNK_SIZE): Promise<TaskNode> {
  // If the text is short enough, summarize it directly
  if (task.depth >= MAX_CONTEXT_DEPTH || getTokensFromString(task.text) <= maxTokens) {
    logger.info('Text short enough or context too deep, summarizing directly')
    const summary = await summarize(task.text, task.previousContext);
    return { text: summary, depth: task.depth, previousContext: task.previousContext };
  }
  // Split the text into smaller chunks
  const chunks = chunkifyText(task.text, maxTokens);
  if (chunks.length === 0) {
    const summary = await summarize(task.text, task.previousContext);
    return { text: summary, depth: task.depth, previousContext: task.previousContext };
  }

  // Recursively summarize each chunk
  const subtasksPromises = chunks.map((chunk, i) => {
    const subtask = { text: chunk, depth: task.depth + 1, previousContext: [...task.previousContext, chunks.slice(0, i)] } as TaskNode;
    return decomposeIfNeeded(subtask, maxTokens);
  });

  // Wait for all the subtasks to be summarized
  const subtasks = await Promise.all(subtasksPromises)
  // Concatenate the subtask summaries
  let summary = subtasks.map(subtask => subtask.text).join('\n\n');
  let previousContext = [...task.previousContext];

  // If the concatenated summary is too long, recursively decompose it into smaller parts
  while (getTokensFromString(summary) > MAX_REQUEST_SIZE) {
    logger.info('Summary too long, decomposing into smaller parts');
    const decomposed = await decomposeIfNeeded({ text: summary, depth: task.depth + 1, previousContext } as TaskNode, maxTokens);
    summary = decomposed.text;
    previousContext = [...decomposed.previousContext];
  }

  return { text: await summarize(summary, previousContext), depth: task.depth, previousContext, subtasks };
}

// Summarize a text using the algorithmic decomposition approach
async function summarizeText(text: string): Promise<TaskNode> {
  const rootTask: TaskNode = { text, depth: 0, previousContext: [] };
  const summary = await decomposeIfNeeded(rootTask);
  return summary;
}
