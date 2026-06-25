"use client";

import { useEffect } from "react";

/**
 * Handles post-hydration DOM updates to prevent hydration mismatch.
 * Manages the 'loaded' class on the html tag and 'preload' removal from the body tag.
 */
export default function ThemeWatcher() {
  useEffect(() => {
    // These changes happen after hydration, so they won't cause mismatches
    document.documentElement.classList.add("loaded");
    document.body.classList.remove("preload");
  }, []);

  return null;
}
