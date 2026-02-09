import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <div className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9 hover-scale transition-all duration-200"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-foreground hover:text-primary transition-colors" />
      ) : (
        <Moon className="h-4 w-4 text-foreground hover:text-primary transition-colors" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}