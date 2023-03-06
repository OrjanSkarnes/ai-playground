// @ts-nocheck
import React, { useState } from "react";

export function DocumentUpload({ onUpload }) {
  const [file, setFile] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleFileChange(event) {
    const selectedFile = event.target.files[0];
    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are supported");
      return;
    }
    setError("");
    onUpload(selectedFile);
    setFile(selectedFile);
    setSuccess("File uploaded successfully");
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess("");
    }, 3000);
  }

  return (
    <div className="document-upload">
      <h4>Upload a sales report you want to summarize</h4>
      <div className="upload-row">
        <label htmlFor="file-upload" className="file-upload">Upload Report</label>
        <input id="file-upload" type="file" accept=".pdf" onChange={handleFileChange} />
        {/* Show the file name */}
        {file && <div className="filename">{file.name}</div>}
      </div>

      {success && <p style={{ color: "green" }}>{success}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default DocumentUpload;