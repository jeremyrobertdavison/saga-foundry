import './generated.css';
import html2canvas from 'html2canvas';
window.html2canvas = html2canvas;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <>
    <App />
  </>
);
