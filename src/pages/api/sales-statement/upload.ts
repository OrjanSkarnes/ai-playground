import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "../logger";
import multer from 'multer';
import { extractPdfData } from "../utils";


// disable next.js' default body parser
export const config = {
  api: { bodyParser: false }
}

// parse the pdf file into a buffer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  logger.info("url:::::" + req.url);
  if (req.method === 'POST') {
    // Process a POST request
    // @ts-ignore
    upload.single('pdfFile')(req, res, function (err) {
      if (err) {
        res.status(400).json({ message: err.message })
      } else {
        // @ts-ignore
        const buffer = req.file.buffer;
        extractPdfData(buffer).then((data) => {
          res.status(200).json(data);
        });
      }
    })
  } else {
    res.status(405).json({ message: 'We only support POST' })
  }
}


