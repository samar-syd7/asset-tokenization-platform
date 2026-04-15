"use client";

import { useEffect } from "react";

const ConsoleFilter = () => {
  useEffect(() => {
    const originalError = console.error;

    console.error = (...args) => {
      const msg = args?.[0];

      if (
        typeof msg === "string" &&
        (
          msg.includes("Failed to fetch") ||
          msg.includes("ERR_BLOCKED_BY_CLIENT") ||
          msg.includes("Analytics")
        )
      ) {
        return;
      }

      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
};

export default ConsoleFilter;