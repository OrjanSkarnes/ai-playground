import { configureStore } from "@reduxjs/toolkit";
import salesReportReducer from "./salesreport/salesReportSlice";

const store = configureStore({
  reducer: {
    salesReport: salesReportReducer,
  },
});

export default store;