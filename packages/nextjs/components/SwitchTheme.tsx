"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export const SwitchTheme = ({ className }: { className?: string }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDarkMode = resolvedTheme === "dark";

  const handleToggle = () => {
    if (isDarkMode) {
      setTheme("light");
      return;
    }
    setTheme("dark");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      type="button"
      className={`theme-switch btn btn-ghost btn-square ${className ?? ""}`}
      onClick={handleToggle}
      aria-label={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
      title={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
};
