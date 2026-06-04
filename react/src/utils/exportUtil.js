import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exports JSON data to Excel spreadsheet.
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} fileName - Name of exported file (without extension)
 * @param {string} sheetName - Name of Excel worksheet
 */
export const exportToExcel = (data, fileName = 'export', sheetName = 'Sheet1') => {
  // Format data keys for cleaner display if needed
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

/**
 * Exports data to tabular PDF document.
 * @param {Array<Object>} columns - Array of column definitions: { field, headerName }
 * @param {Array<Object>} data - Array of data rows
 * @param {string} fileName - Name of exported PDF file
 * @param {string} title - Title text printed at top of document
 */
export const exportToPDF = (columns, data, fileName = 'export', title = 'Document') => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Add Title
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175); // Deep Blue ERP primary color
  doc.text(title, 14, 15);
  
  // Add Date Generated
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Muted slate color
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 20);

  const headers = columns.map(col => col.headerName || col.field);
  const rows = data.map(row => 
    columns.map(col => {
      const val = row[col.field];
      if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val);
      }
      return val === undefined || val === null ? '' : String(val);
    })
  );

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 25,
    theme: 'grid',
    styles: { 
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle'
    },
    headStyles: { 
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  doc.save(`${fileName}.pdf`);
};
