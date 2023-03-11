import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Divider, Fade } from "@mui/material";
import { useState } from "react";
import { TaskNode } from "./interfaces/task";
import { getPdfSummary } from "./services/PdfService";

const SummarizePDF = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [tasks, setTasks] = useState<TaskNode[]>([]);
  const [question, setQuestion] = useState<String[]>([]);
  const [expanded, setExpanded] = useState(false);

  const handlePdfFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setPdfFile(files[0]);
      setSummary("");
    }
  };

  const handleSummarizeClick = async () => {
    if (pdfFile) {
      const response = await getPdfSummary(pdfFile);
      setSummary(response.data.text);
      setTasks(response.data.subtasks);
    }
  };

  const handleAskQuestionClick = async () => {
    // setQuestions([...questions, response.data]);
    // const response = await askPdfQuestion(pdfFile, question);
    // setAnswer([...answer, response.data]);
  };

  return (
    <Container >
      <Box className="pdf-summarizer">
        <h1>PDF Summarizer</h1>
        <div>
          <label htmlFor="pdf-file-input">Select PDF file to summarize:</label>
          <input type="file" id="pdf-file-input" onChange={handlePdfFileChange} />
        </div>
        <button onClick={handleSummarizeClick}>Summarize</button>
        {summary && tasks?.length > 0 && (
          <Accordion expanded={expanded} TransitionProps={{}} className="expandable-panel">
            <AccordionSummary onClick={() => setExpanded(!expanded)} style={{minHeight: "64px"}}>
              <div>
                <h2>Compressed Summary</h2>
                <p>{summary}</p>
              </div>
            </AccordionSummary>
            <Divider sx={{ borderBottomWidth: 2 }} />
            <AccordionDetails >
              <h3>Longer Summary</h3>
              <ul>
                {tasks.map((task, index) => (
                  <li key={index}>{task.text}</li>
                ))}
              </ul>
            </AccordionDetails>
          </Accordion>
        )}
        {summary && (
          <div className="question">
            <label htmlFor="question-input">Ask a question:</label>
            <div className="question--input-area">
              <input type="text" id="question-input" value={question} onChange={(event) => setQuestion(event.target.value)} />
              <button onClick={handleAskQuestionClick}>Ask</button>
            </div>
          </div>
        )}
      </Box>
    </Container>
  );
};

export default SummarizePDF;
