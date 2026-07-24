// pdfjs-dist é uma biblioteca pesada — import() dinâmico para não entrar
// no bundle principal (Kanban/CreateTask não são rotas lazy), só carrega
// quando o usuário realmente solta um PDF na zona de upload.
export const extractPdfText = async (file: File): Promise<string> => {
  const pdfjsLib = await import('pdfjs-dist');
  const { default: pdfjsWorkerUrl } = await import('pdfjs-dist/build/pdf.worker.mjs?url');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    pageTexts.push(pageText.trim());
  }

  return pageTexts.join('\n\n').trim();
};
