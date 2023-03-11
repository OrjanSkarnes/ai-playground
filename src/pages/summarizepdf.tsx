import { useState } from "react";
import { getPdfSummary } from "./services/PdfService";

const SummarizePDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>();
  const [batches, setBatches] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setSummary("");
    }
  };

  const handleSubmit = async () => {
    if (file) {
      const response = await getPdfSummary(file);
      setSummary(response.data.summary);
      setBatches(response.data.batches);
    }
  };

  return (
    <div>
      <h1>Summarize PDF</h1>
      <div>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
      </div>
      <div>
        <button onClick={handleSubmit}>Summarize</button>
      </div>
      {summary && (
        <div>
          <h2>Summary:</h2>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
};

export default SummarizePDF;
