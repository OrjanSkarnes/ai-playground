import { createSlice } from "@reduxjs/toolkit";

const salesReportSlice = createSlice({
  name: "salesReport",
  initialState: {
    salesReport: undefined,
    summarizedSalesReportList: [],
    progress: 100,
    pdfPages: [],
    loading: false,
    pdfFile: undefined,
    masterLoading: false,
    masterSummary: undefined,
  },
  reducers: {
    setSalesReport: (state, action) => {
      state.salesReport = action.payload;
    },
    setSummarizedSalesReportList: (state, action) => {
      state.summarizedSalesReportList = action.payload;
    },
    setProgress: (state, action) => {
      state.progress = action.payload;
    },
    setPdfPages: (state, action) => {
      state.pdfPages = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setPdfFile: (state, action) => {
      state.pdfFile = action.payload;
    },
    setMasterLoading: (state, action) => {
      state.masterLoading = action.payload;
    },
    setMasterSummary: (state, action) => {
      state.masterSummary = action.payload;
    },
  },
});

export const {
  setSalesReport,
  setSummarizedSalesReportList,
  setProgress,
  setPdfPages,
  setLoading,
  setPdfFile,
  setMasterLoading,
  setMasterSummary,
} = salesReportSlice.actions;

export default salesReportSlice.reducer;
