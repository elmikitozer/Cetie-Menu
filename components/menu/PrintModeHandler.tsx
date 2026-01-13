"use client";

import { useEffect, useState } from "react";

/**
 * Component that handles print mode:
 * - Triggers window.print() after a short delay
 * - Shows iOS hint for saving as PDF
 */
export function PrintModeHandler() {
  const [isIOS, setIsIOS] = useState(false);
  const [printTriggered, setPrintTriggered] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Trigger print after a short delay to ensure content is rendered
    const timer = setTimeout(() => {
      if (!printTriggered) {
        setPrintTriggered(true);
        window.print();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [printTriggered]);

  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 p-4 rounded-lg text-sm text-center no-print z-50">
        <p className="font-medium">💡 Pour enregistrer en PDF sur iOS :</p>
        <p>Partager → Imprimer → Pincer pour zoomer → Partager → Enregistrer</p>
      </div>
    );
  }

  return null;
}

