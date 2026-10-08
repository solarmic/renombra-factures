// pdf.js worker entry: install the stream polyfill before pdf.js runs inside the worker.
import './streamAsyncIterator';
import 'pdfjs-dist/legacy/build/pdf.worker.min.mjs';
