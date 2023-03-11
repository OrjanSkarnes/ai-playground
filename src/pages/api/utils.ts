
import { PdfData, VerbosityLevel } from 'pdfdataextract';

export const extractPdfData = async (buffer: any, pages: number = 40) => {
  return PdfData.extract(buffer, {
    pages: pages, // how many pages should be read at most
    sort: true, // sort the text by text coordinates
    verbosity: VerbosityLevel.ERRORS, // set the verbosity level for parsing
    get: { // enable or disable data extraction (all are optional and enabled by default)
      pages: true, // get number of pages
      text: true, // get text of each page
      fingerprint: true, // get fingerprint
      outline: true, // get outline
      metadata: true, // get metadata
      info: true, // get info
      permissions: true, // get permissions
    },
  });
}

// Open ai says that:
// A helpful rule of thumb is that one token generally corresponds to ~4 characters of text for common English text. This translates to roughly ¾ of a word (so 100 tokens ~= 75 words).
// We should take error margin into account and allow a bit mor tokens for each character so we multiply by 0.32
export const getTokensFromString = (text: string): number => {
  return Math.ceil(text.length * 0.30);
};


export function allSettled<T>(promises: Promise<T>[]): Promise<T[]> {
  // Should return the value of the promise if it is fulfilled, or the reason if it is rejected
  return Promise.allSettled(promises).then((results) => {
    const values: T[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        values.push(result.value);
      }
    }
    return values;
  });
}
