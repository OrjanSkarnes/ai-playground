// React functional component to upload and display sales report data
// @ts-ignore
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircularProgress, Container, LinearProgress } from "@mui/material";
import SalesReportComponent from "./components/SalesReportComponent";
import DocumentUpload from "./components/DocumentUpload";
import { getSalesReportSummaryJson, getSalesReportSummaryText, SalesReportData, sendPageInformation, uploadSalesReportToDB } from "./services/SalesReportService";
import { getTokens } from "@/lib/tokenizer";

export default function SalesReport() {
  const [salesReport, setSalesReport] = useState<SalesReportData | undefined>();
  const [summarizedSalesReportList, setSummarizedSalesReportList] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [pdfFile, setPdfFile] = useState<File | undefined>();
  const [masterLoading, setMasterLoading] = useState<boolean>(false);
  const [masterSummary, setMasterSummary] = useState<string | undefined>();

  const pdfPagesRef = useRef<string[]>([]);
  const summarizedSalesReportListRef = useRef<string[]>([]);


  useEffect(() => {
    const summary = localStorage.getItem("salesReportSummary");
    const summaryList = localStorage.getItem("salesReportSummaryList");
    if (summary && summary.length > 0) {
      setSalesReport(JSON.parse(summary));
    }
    if (summaryList && summaryList.length > 0) {
      setSummarizedSalesReportList(JSON.parse(summaryList));
    }
  }, []);

  const uploadSalesReport = async (file: File) => {
    setLoading(true);
    const response = await uploadSalesReportToDB(file);
    pdfPagesRef.current = response.data.text;
    setPdfFile(file);
    setLoading(false);
  }

  const generateSummary = useCallback(async () => {
    setProgress(0);
    setMasterLoading(true);
    summarizedSalesReportListRef.current = [];

    const tokenLimit = 3900;

    const newPages: string[] = pdfPagesRef.current.reduce((acc: any, page: any) => {
      if (acc.length === 0) {
        acc.push(page); return acc;
      }
      const lastPage = acc[acc.length - 1];
      if (getTokens(lastPage + page) < tokenLimit) {
        acc[acc.length - 1] = lastPage + page;
      } else {
        acc.push(page);
      }
      return acc;
    }, []);

    const maxTokens = tokenLimit / newPages.length;

    const summarizationPromises = newPages.map(async (page) => {
      const text = cleanText(page);
      const res = await sendPageInformation(text, maxTokens);
      return res.response;
    });

    let progress = 0;
    const summary: string[] = []
    await Promise.allSettled(
      summarizationPromises.map(async (summ) => {
        const value = await summ;
        progress++;
        setProgress((progress / summarizationPromises.length) * 100);
        summarizedSalesReportListRef.current.push(value);
      })
    );
    await getMasterSummary(summarizedSalesReportListRef.current);
  }, []);


  const getMasterSummary = useCallback(async (summary: string[]) => {
    if (!summary || summary.length === 0) {
      return;
    }
    const summaryString = summary.join(" ");
    const jsonResp = await getSalesReportSummaryJson(cleanText(summaryString));
    const salesReportJson: SalesReportData = JSON.parse(jsonResp.response);
    localStorage.setItem("salesReportSummaryList", JSON.stringify(summary));
    localStorage.setItem("salesReportSummary", JSON.stringify(salesReportJson));
    setSalesReport(salesReportJson);
    setMasterLoading(false);

    // const masterSummaryResp = await getSalesReportSummaryText(cleanText(summaryString));
    // setMasterSummary(masterSummaryResp.response);
  }, []);

  const cleanText = useMemo(() => {
    return (text: string) => {
      return text.replace(/(\w+)-\n(\w+)/g, "$1$2").replace(/(?<!\n\s)\n(?!\s\n)/g, " ").trim().replace(/\n\s*\n/g, "\n\n");
    };
  }, []);

  return (
    <Container className="sales-report" style={{ whiteSpace: "pre-wrap" }}>
      <h2>Sales Report</h2>
      <DocumentUpload onUpload={uploadSalesReport} />
      <button type="button" onClick={generateSummary} disabled={pdfFile === undefined || pdfFile === null}>Generate Summary</button>
      <button type="button" onClick={() => getMasterSummary(summarizedSalesReportList)}>Generate Master Summary</button>

      {masterLoading ? (<div className="spinner"><CircularProgress color="success" /></div>) : (<SalesReportComponent data={salesReport} />)}

      {masterSummary && getSentenceAnimation(masterSummary, 0.005)}
      {progress < 100 && <LinearProgress variant="determinate" value={progress} />}
      {summarizedSalesReportList && getListAnimation(summarizedSalesReportList)}
    </Container>
  );
}


export function getListAnimation(list: string[], delay: number = 0.005) {
  if (!list || list.length === 0) return null;
  let totalWords = 0;
  return (
    <div className="page-summary">
      <h3>Summarized pages</h3>
      {list.map((item, index) => {
        const words: string[] = item.split(" ");
        const masterDelay = delay * totalWords;
        totalWords += words.length;
        return (
          <p className="page-summary-paragraph" key={index}>
            {getSentenceAnimation(item, delay, masterDelay)}
          </p>
        )
      })}
    </div>
  )
}

export function getSentenceAnimation(summary: string, wordsDelay: number, masterDelay: number = 0, paragraph: boolean = false) {
  if (!summary || summary.length === 0) return null;
  const words: string[] = summary.split(" ");
  return (
    words.map((word, index) => (
      <span className="page-summary-word fadeIn" key={index} style={{ animationDelay: `${masterDelay + index * wordsDelay}s` }}>
        {word}{" "}
      </span>
    ))
  );
}
