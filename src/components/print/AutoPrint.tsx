"use client";

import { useEffect } from "react";

export default function AutoPrint() {
  useEffect(() => {
    // Small delay to ensure styles and fonts are loaded before print dialog blocks thread
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    // Optional: close the window after printing
    const afterPrint = () => {
      // Uncomment to auto-close after print dialog is dismissed
      // window.close(); 
    };
    
    window.addEventListener("afterprint", afterPrint);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  return null;
}
