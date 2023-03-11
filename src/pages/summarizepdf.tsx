import { useState } from "react";
import { TaskNode } from "./interfaces/task";
import { getPdfSummary } from "./services/PdfService";

const SummarizePDF = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [tasks, setTasks] = useState<TaskNode[]>([]);
  const [question, setQuestion] = useState<String[]>([]);

  const handlePdfFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setPdfFile(files[0]);
      setSummary("");
    }
  };

  const handleSummarizeClick  = async () => {
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
    <div>
      <h1>PDF Summarizer</h1>
      <div>
        <label htmlFor="pdf-file-input">Select PDF file to summarize:</label>
        <input type="file" id="pdf-file-input" onChange={handlePdfFileChange} />
      </div>
      <button onClick={handleSummarizeClick}>Summarize</button>
      {summary && (
        <div>
          <h2>Summary:</h2>
          <p>{summary}</p>
        </div>
      )}
      {tasks?.length > 0 && (
        <div>
          <h2>Tasks:</h2>
          <ul>
            {tasks.map((task, index) => (
              <li key={index}>{task.text}</li>
            ))}
          </ul>
          <div>
            <label htmlFor="question-input">Ask a question:</label>
            <input type="text" id="question-input" value={question} onChange={(event) => setQuestion(event.target.value)} />
            <button onClick={handleAskQuestionClick}>Ask</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummarizePDF;
