import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { useState, useEffect } from "react";
import App from "./App.tsx";
import "./index.css";
import { SplashScreen } from "./components/SplashScreen";

function Root() {
  const [showSplash, setShowSplash] = useState(() => {
    // Initialize from sessionStorage only on client
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('retro_learn_splash_seen');
    }
    return true;
  });

  const handleSplashComplete = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('retro_learn_splash_seen', 'true');
    }
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </>
  );
}

const root = document.getElementById("root")!;

// Always use createRoot for client-side rendering
createRoot(root).render(<Root />);
