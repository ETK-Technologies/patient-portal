/**
 * Converts HTML string to PDF and triggers download
 * @param {string} htmlString - The HTML content to convert to PDF
 * @param {string} filename - The filename for the downloaded PDF (default: 'prescription.pdf')
 */
export const generatePDFFromHTML = async (htmlString, filename = 'prescription.pdf') => {
  // Dynamic import to avoid SSR issues - html2pdf.js uses browser-only APIs
  const html2pdf = (await import('html2pdf.js')).default;
  
  // Ensure we're in the browser
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('PDF generation is only available in the browser');
  }

  let container = null;
  
  try {
    container = document.createElement('div');
    container.innerHTML = htmlString;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm';
    container.style.padding = '20px';
    document.body.appendChild(container);

    const images = container.querySelectorAll('img');
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 5000);
      });
    });

    await Promise.all(imagePromises);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().set(opt).from(container).save();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  } finally {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Opens HTML content in a new tab for printing/viewing
 * @param {string} htmlString - The HTML content to display
 */
export const openPrescriptionInNewTab = (htmlString) => {
  // Ensure we're in the browser
  if (typeof window === 'undefined') {
    throw new Error('Opening in new tab is only available in the browser');
  }

  try {
    const blob = new Blob([htmlString], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.click();
    }
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Error opening prescription in new tab:', error);
    throw new Error('Failed to open prescription. Please try again.');
  }
};

/**
 * Fetches prescription data and generates PDF or opens in new tab
 * @param {string} prescriptionId - The prescription ID
 * @param {Object} options - Options for PDF generation
 * @param {string} options.filename - Optional filename for the PDF
 * @param {boolean} options.openInNewTab - If true, opens in new tab instead of downloading
 */
export const downloadPrescriptionPDF = async (prescriptionId, options = {}) => {
  // Ensure we're in the browser
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    throw new Error('PDF download is only available in the browser');
  }

  try {
    const { filename = null, openInNewTab = false } = options;
    
    const response = await fetch(`/api/user/prescription/${prescriptionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch prescription data');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch prescription');
    }

    const prescription = result.data;
    let htmlContent = null;

    if (prescription.prescription_pdf_html) {
      htmlContent = prescription.prescription_pdf_html;
    } else if (prescription.data?.prescription_pdf_html) {
      htmlContent = prescription.data.prescription_pdf_html;
    } else if (prescription.prescription?.prescription_pdf_html) {
      htmlContent = prescription.prescription.prescription_pdf_html;
    }

    if (!htmlContent) {
      throw new Error('Prescription PDF HTML not found in response');
    }

    if (openInNewTab) {
      openPrescriptionInNewTab(htmlContent);
    } else {
      const pdfFilename = filename || `prescription-${prescriptionId}.pdf`;

      await generatePDFFromHTML(htmlContent, pdfFilename);
    }
  } catch (error) {
    console.error('Error processing prescription:', error);
    throw error;
  }
};

