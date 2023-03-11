import { NextApiRequest, NextApiResponse } from "next";
import { gptApi } from "../gptAPI";
import { logger } from "../logger";

import multer from 'multer';
import { getTokens } from "@/lib/tokenizer";
import { Writable } from "stream";
import { allSettled, extractPdfData, getTokensFromString } from "../utils";

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
  subtasks?: TaskNode[];
}

// Constants
const MAX_TOKENS = 680;
const MAX_REQUEST_SIZE = 4024;
const MAX_CONTEXT_DEPTH = 3;
// Summarization model
async function summarize(text: string, previousContext: string[]): Promise<string> {
  const prompt = `Summarize the following text:\n\n${text}\n\nSummary:`;

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
function chunkifyText(text: string): string[] {
  // Split text into sentences
  const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!\:)\s+|\p{Cc}+|\p{Cf}+/)
   // Group sentences into chunks based on token count
   const chunkified = [];
   let chunk = '';

   sentences.forEach((sentence) => {
      if (getTokens(sentence) > MAX_TOKENS) {
        logger.error('Sentence too long');
        return;
      }
      if (getTokensFromString(chunk + sentence) <= MAX_TOKENS) {
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
async function decomposeIfNeeded(task: TaskNode): Promise<TaskNode> {
  // If the text is short enough, summarize it directly
  if (getTokensFromString(task.text) <= MAX_TOKENS) {
    const summary = await summarize(task.text, task.previousContext);
    return { text: summary, depth: task.depth, previousContext: task.previousContext };
  }

  // If the context is too deep, summarize it directly
  if (task.depth >= MAX_CONTEXT_DEPTH) {
    logger.info('Context too deep, summarizing directly')
    const summary = await summarize(task.text, task.previousContext);
    return { text: summary, depth: task.depth, previousContext: task.previousContext };
  }

  // Split the text into smaller chunks
  const chunks = chunkifyText(task.text);
  if (chunks.length === 0) {
    const summary = await summarize(task.text, task.previousContext);
    return { text: summary, depth: task.depth, previousContext: task.previousContext };
  }

  // Recursively summarize each chunk
  const subtasksPromises = chunks.map((chunk, i) => {
    const subtask = { text: chunk, depth: task.depth + 1, previousContext: [...task.previousContext, chunks.slice(0, i)] } as TaskNode;
    return decomposeIfNeeded(subtask);
  });

  // Wait for all the subtasks to be summarized
  const subtasks = await Promise.all(subtasksPromises)

  // Concatenate the subtask summaries
  const summary = subtasks.map(subtask => subtask.text).join('\n\n');
  return { text: await summarize(summary, task.previousContext), depth: task.depth, previousContext: task.previousContext, subtasks };
}

// Summarize a text using the algorithmic decomposition approach
async function summarizeText(text: string): Promise<TaskNode> {
  const rootTask: TaskNode = { text, depth: 0, previousContext: [] };
  const summary = await decomposeIfNeeded(rootTask);
  return summary;
}

interface Summary {
  summary: string;
  pages: string[];
  batches?: string[];
}

/**
 * This function takes in a list of PDF pages, cleans and concatenates them into a long string,
 * and then splits the string into batches and chunks based on the maximum tokens allowed per prompt.
 * For each chunk, it calls the GPT-3 API to generate a summary, and then summarizes the chunks for each batch
 * into a batch summary. If the batch is under the maximum token limit, it simply summarizes the batch.
 * Finally, it summarizes the batches and batch summaries into a master summary containing all the information
 * needed from the PDF file.
 *
 * @param pages List of PDF pages as strings
 * @param maxTokensPerPrompt Maximum number of tokens allowed per GPT-3 API prompt
 * @returns Master summary of the entire PDF file
 */
async function summarizePdfPages(
  pages: string[],
  outputStream: Writable,
  maxTokensPerPrompt: number = 3800,
  maxTokensPerBatch: number = 4000
): Promise<Summary> {
  const cleanedPages = pages.map((pageText) =>
    pageText
      .replace(/(\w+)-\n(\w+)/g, "$1$2") // remove hyphenation
      .replace(/\s+/g, " ") // remove extra whitespace
      .replace(/\n+/g, "\n") // remove extra newlines
      .replace(/(?<=\n)\s+/g, "") // remove leading whitespace
      .replace(/\s+(?=\n)/g, "") // remove trailing whitespace
      .replace(/\n\s+\n/g, "\n\n") // remove empty lines
      .trim()
  );
  const cleanedString = cleanedPages.join(' ');
  logger.info('cleaned string::::');
  const cleanedStringTokens = getTokensFromString(cleanedString)
  logger.info('cleaned string tokens::::' + cleanedStringTokens);

  if (cleanedStringTokens > maxTokensPerPrompt) {
    const numBatches = Math.ceil(cleanedStringTokens / maxTokensPerBatch);
    const maxTokensPerBatchS = Math.ceil(cleanedStringTokens / numBatches);
    const maxTokensPerBatchSummary = Math.ceil(maxTokensPerBatchS * 0.9);

    // Split the cleaned string into batches
    const batches = splitStringIntoSmallerChunks(cleanedString, maxTokensPerBatchSummary);
    const chunkSize = Math.ceil(maxTokensPerPrompt * 0.75);
    
    logger.info('batch size:::: ' + batches.map(batch => getTokensFromString(batch)) + " actual tokens: " + batches.map(batch => getTokens(batch)));

    // Generate summaries for each batch and chunk
    const batchSummaries = await allSettled(
      batches.map(async (batch) => {
        if (getTokens(batch) > maxTokensPerPrompt) {
          // Split the batch into chunks
          const chunkList = splitStringIntoSmallerChunks(batch, chunkSize);
          const summaries = await allSettled(chunkList.map(async (chunk) => {
            return await generateSummary(chunk, maxTokensPerPrompt);
          }));
          return await summarizeChunks(summaries, maxTokensPerBatchSummary);
        } else {
          // return await cacheHit(batch, maxTokensPerPrompt)
          return await generateSummary(batch, maxTokensPerPrompt);
        }
      })
    );
    logger.info('Size of summaries:::: ' + batchSummaries.map(batch => getTokensFromString(batch)));

    // Summarize the batches and batch summaries into a master summary
    const masterSummary = await summarizeBatches(batchSummaries, maxTokensPerBatch, true);
    return { summary: masterSummary, pages, batches: batchSummaries };
  } else {
    // If the entire cleaned string is shorter than the max tokens per prompt, generate summary for entire string
    const summary = await generateSummary(cleanedString, maxTokensPerPrompt, true);
    return { summary, pages };
  }
}

function splitStringIntoSmallerChunks(inputString: string, maxToken: number): string[] {
  const token = getTokensFromString(inputString);
  if (token <= maxToken) {
    return [inputString];
  }

  const chunks: string[] = [];
  let chunk = '';
  let chunkTokens = 0;
  for (let i = 0; i < inputString.length; i++) {
    const char = inputString.charAt(i);
    const charTokens = getTokensFromString(char);
    if (chunkTokens + charTokens > maxToken) {
      chunks.push(chunk);
      chunk = '';
      chunkTokens = 0;
    }
    chunk += char;
    chunkTokens += charTokens;
  }
  chunks.push(chunk);

  console.log('string splitt into:::: ' + chunks.map(chunk => getTokensFromString(chunk)));
  return chunks;
}

/** This function summarizes the list of chunks into a single summary. */
function summarizeChunks(chunks: string[], maxTokensPerSummary: number): string {
  let summarizedChunks = chunks.join("");
  const summarizedChunksLength = getTokensFromString(summarizedChunks);
  const numSummaries = Math.ceil(summarizedChunksLength / maxTokensPerSummary);
  // Split the summarized chunks into multiple summaries if needed
  if (numSummaries > 1) {
    summarizedChunks = splitStringIntoSmallerChunks(summarizedChunks, maxTokensPerSummary)
      .map((batch) => generateSummary(batch, maxTokensPerSummary))
      .join("");
  }

  return summarizedChunks;
}

/** This function summarizes the list of batch summaries into a single master summary. */
async function summarizeBatches(
  batchSummaries: string[],
  maxTokensPerSummary: number,
  isMaster: boolean = false
): Promise<string> {
  let summarizedBatches = batchSummaries.join("");
  const numSummaries = Math.ceil(getTokensFromString(summarizedBatches) / maxTokensPerSummary);
  if (numSummaries > 1) {
    const summaryPromises = splitStringIntoSmallerChunks(summarizedBatches, maxTokensPerSummary).map((batch) =>
      generateSummary(batch, maxTokensPerSummary, false)
    );
    const summaries = await allSettled(summaryPromises);
    const masterSummary = await generateSummary(summaries.join(""), maxTokensPerSummary, true);
    summarizedBatches = masterSummary;
  }

  return summarizedBatches;
}

/** This function generates a summary for the given text using the GPT-3 API. */
async function generateSummary(text: string, maxTokensPerPrompt: number, isMaster: boolean = false): Promise<string> {
  const sectionPrompt = ` ${text} \n Give me a summary of this text`;
  const masterPrompt = `${text} \n Give me a detailed summary of this text`;
  const prompt = isMaster ? masterPrompt : sectionPrompt;
  if (getTokensFromString(prompt) > maxTokensPerPrompt) {
    logger.error("Prompt is too long for GPT-3 API");
  }
  return gptApi.getChatOneMessage({ content: prompt });
}

export async function cacheHit(string: string, maxTokens: number): Promise<string> {
  const cachedSummary = cache.get(string);
  if (cachedSummary) {
    return cachedSummary;
  } else {
    const summary = await generateSummary(string, maxTokens);
    cache.set(string, summary);
    return summary;
  }
}