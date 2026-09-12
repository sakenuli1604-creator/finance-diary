import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore — vite отдаёт URL воркера как строку
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export { pdfjsLib };
