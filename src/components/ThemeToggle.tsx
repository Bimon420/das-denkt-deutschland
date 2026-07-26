import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = () => {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  // Init from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
    }
  }, []);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-2.5 md:p-2 rounded-full hover:bg-secondary transition-colors active:scale-95 touch-manipulation"
      aria-label={dark ? "Light Mode" : "Dark Mode"}
    >
      {dark ? (
        <Sun className="w-[18px] h-[18px] md:w-4 md:h-4 text-muted-foreground" />
      ) : (
        <Moon className="w-[18px] h-[18px] md:w-4 md:h-4 text-muted-foreground" />
      )}
    </button>
  );
};

export default ThemeToggle;
