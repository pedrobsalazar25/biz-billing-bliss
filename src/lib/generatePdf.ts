import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function generatePdf(element: HTMLElement, filename: string) {
  // Temporarily expand all collapsed details for the PDF
  const noprint = element.querySelectorAll(".no-print");
  noprint.forEach((el) => ((el as HTMLElement).style.display = "none"));

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false,
  });

  noprint.forEach((el) => ((el as HTMLElement).style.display = ""));

  const imgWidth = 210; // A4 mm
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${filename}.pdf`);
}
