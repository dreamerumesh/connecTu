import React from "react";
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AppProvider } from "./contexts/AppContext";
import "./index.css";

createRoot(document.getElementById('root')).render(
 <React.StrictMode>
    <AppProvider>
      <App />
      {/* <IntroAnimation /> */}
    </AppProvider>
  </React.StrictMode>
)
