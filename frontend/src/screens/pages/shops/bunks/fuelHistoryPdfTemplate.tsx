// fuelHistoryPdfTemplate.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
  amount: number;
  date?: string;
  createdAt?: string;
  type: 'fuel' | 'statement';
  volume?: number;
  vehicle?: { vehicleName: string; vehicleNumber: string };
  bank?: { name: string; holderName: string };
  payment_mode?: string;
  description?: string;
}

const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };
    img.onerror = error => reject(error);
    img.src = url;
  });
};

export const generateFuelHistoryPDF = async (
  bunkName: string,
  transactions: Transaction[],
  summary: { totalFuel: number; totalPaid: number; outstanding: number }
) => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleDateString('en-IN');
  const logoUrl = "https://imgs.search.brave.com/Hf5QQ1fuyA5usZNVGPuSkp0nr5NVIDUZ1gB3l4LGNrA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wMTMv/MDQzLzQzNC9zbWFs/bC9iZWxsLWxvZ28t/dmVjdG9yLmpwZw";

  try {
    // --- 1. Watermark Function ---
    // Added 'any' type to handle internal GState and opacity correctly
    const addWatermark = (pdf: any) => {
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.saveGraphicsState();
        pdf.setGState(new pdf.GState({ opacity: 0.1 }));
        pdf.setFontSize(60);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(150, 150, 150);
        pdf.text("ASWATH", 40, 150, { angle: 45 });
        pdf.text("ASWATH", 100, 220, { angle: 45 });
        pdf.restoreGraphicsState();
      }
    };

    // --- 2. Header & Branding ---
    try {
      const imgData = await getBase64ImageFromURL(logoUrl);
      doc.addImage(imgData, 'JPEG', 14, 12, 22, 22);
    } catch (e) {
      console.warn("Logo failed to load.");
    }

    // Company Name
    doc.setTextColor(41, 128, 185); 
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("M.ASWATH HOLLOW BRICKS", 42, 18);
    doc.setFontSize(12);
    doc.text("& LORRY SERVICES", 42, 24);
    
    // Contact Info
    doc.setTextColor(80, 80, 80); // Fixed: separate numbers
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Phone: +91 98240 48181 | Email: bricksync001@gmail.com", 42, 30);
    doc.text("Web: www.aswath.online", 42, 34);

    // Header Accents
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(1);
    doc.line(14, 40, 196, 40);

    // --- 3. Report Title Section ---
    doc.setFillColor(240, 245, 250);
    doc.rect(14, 45, 182, 20, 'F');
    
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("FUEL STATEMENT REPORT", 18, 52);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Station: ${bunkName}`, 18, 59);
    doc.text(`Issued On: ${timestamp}`, 150, 59);

    // --- 4. Transaction Table ---
    const tableData = transactions.map((t, index) => {
      const isFuel = t.type === 'fuel';
      return [
        index + 1,
        new Date(t.date || t.createdAt || "").toLocaleDateString('en-IN'),
        isFuel ? (t.vehicle?.vehicleNumber || 'N/A') : '-',
        isFuel ? `${t.volume} L` : '-',
        isFuel ? 'FUEL' : 'PAYMENT',
        isFuel ? `₹${t.amount.toLocaleString('en-IN')}` : '-', 
        !isFuel ? `₹${t.amount.toLocaleString('en-IN')}` : '-',
      ];
    });

    autoTable(doc, {
      startY: 72,
      head: [['SL.NO', 'DATE', 'VEHICLE NO', 'VOLUME', 'TYPE', 'DEBIT (DR)', 'CREDIT (CR)']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: 255, 
        fontSize: 9, 
        halign: 'center',
        fontStyle: 'bold' 
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 4, 
        valign: 'middle' 
      },
      columnStyles: {
        0: { halign: 'center' },
        4: { fontStyle: 'bold', halign: 'center' },
        5: { halign: 'right' }, 
        6: { halign: 'right' }
      },
      // Fixed: Color rows based on type using didParseCell
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5 && data.cell.text[0] !== '-') {
            data.cell.styles.textColor = [180, 0, 0]; // Red for Debit
        }
        if (data.section === 'body' && data.column.index === 6 && data.cell.text[0] !== '-') {
            data.cell.styles.textColor = [0, 120, 0]; // Green for Credit
        }
      },
      didDrawPage: (data) => {
        // Footer Page Number - Corrected Way
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${pageCount}`, 180, 285);
      }
    });

    // --- 5. Summary Section ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(252, 252, 252);
    doc.rect(125, finalY, 71, 32, 'DF');
    
    doc.setTextColor(41, 128, 185);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ACCOUNT SUMMARY", 130, finalY + 8);
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Fuel (DR):`, 130, finalY + 15);
    doc.text(`₹${summary.totalFuel.toLocaleString('en-IN')}`, 190, finalY + 15, { align: 'right' });
    
    doc.text(`Total Paid (CR):`, 130, finalY + 21);
    doc.text(`₹${summary.totalPaid.toLocaleString('en-IN')}`, 190, finalY + 21, { align: 'right' });
    
    doc.setLineWidth(0.2);
    doc.line(130, finalY + 24, 192, finalY + 24);

    doc.setFont("helvetica", "bold");
    if (summary.outstanding > 0) {
        doc.setTextColor(180, 0, 0); // Red
    } else {
        doc.setTextColor(0, 120, 0); // Green
    }
    doc.text(`Outstanding:`, 130, finalY + 29);
    doc.text(`₹${summary.outstanding.toLocaleString('en-IN')}`, 190, finalY + 29, { align: 'right' });

    // --- 6. Add Watermarks after content is generated ---
    addWatermark(doc);

    // --- 7. Final Footer ---
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text("Note: This is an electronically generated document. No signature required.", 14, 280);
    doc.text("Thank you for your business with Aswath Hollow Bricks.", 14, 284);

    doc.save(`Aswath_Fuel_Report_${timestamp}.pdf`);
  } catch (error) {
    console.error("PDF Generation Error:", error);
  }
};