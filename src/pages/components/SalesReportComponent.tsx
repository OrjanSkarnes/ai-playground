import React from 'react';
import {getSentenceAnimation} from '../salesreport';
import { SalesReportData } from '../services/SalesReportService';

interface SalesReportProps {
  data: SalesReportData | undefined;
}

const SalesReportComponent: React.FC<SalesReportProps> = ({ data }) => {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <div className={'sales-report-component'}>
      {getSalesReportAnimation(data)}
    </div>
  );
};

// Should show the animation for each property and apply correct class
function getSalesReportAnimation(data: SalesReportData) {
  if (!data || Object.keys(data).length === 0) return null;
  const list = [
    { label: 'Address', value: data?.address, key: 'address' },
    { label: 'Price', value: data?.price, key: 'price' },
    { label: 'Size', value: data?.size, key: 'size' },
    { label: 'Bedrooms', value: data?.bedrooms, key: 'bedrooms' },
    { label: 'Bathrooms', value: data?.bathrooms, key: 'bathrooms' },
    { label: 'Features', value: data?.features, key: 'features' },
    { label: 'Condition', value: data?.condition, key: 'condition' },
    { label: 'Potential Costs/Fees', value: data?.potential_costs,   key: 'potential_costs' },
    { label: 'Potential Issues/Concerns', value: data?.potential_issues, key: 'potential_issues' },
    { label: 'Questions to Ask During a Viewing', value: data?.questions, key: 'questions' },
    { label: 'AI Assistant\'s Thoughts on the Property', value: data?.thoughts, key: 'thoughts' },
  ];
  const delay = 0.04;
  let totalWords = 0;
  return (
    <div className='report-summary'>
        {list.map(({ label, value, key }, index) => {
          if (!value) return null;
          let words: string[] = label.split(" ").concat(value?.split(" "));
          const masterDelay = delay * totalWords;
          totalWords += words.length;
          return (
          <div key={index} className={`${key} fadeIn report-item`} style={{ animationDelay: `${masterDelay}s` }}>
            <div className='report-item-lable'>{label}:</div>
            <div className='report-item-value'>{getSentenceAnimation(value, delay, masterDelay, false)}</div>
          </div>)
        })}
    </div>
  );
}

export default SalesReportComponent;