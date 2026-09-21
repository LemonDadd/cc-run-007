import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* HashRouter：nginx 静态托管无需 fallback 配置，刷新任意页面都可用 */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
