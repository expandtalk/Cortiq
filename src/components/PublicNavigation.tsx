import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart3, Menu, X, Github } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export default function PublicNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/cmp", label: "CMP Solution" },
    { to: "/features", label: "Features" },
    { to: "/pricing", label: "Pricing" },
    { to: "/api", label: "API" },
    { to: "/privacy", label: "Privacy" },
    { to: "/contact", label: "Contact" }
  ];

  return (
    <nav className="glass border-b border-border/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-3">
          <div className="relative">
            <BarChart3 className="h-10 w-10 text-primary animate-pulse-glow" />
            <div className="absolute inset-0 h-10 w-10 text-primary opacity-30 animate-ping"></div>
          </div>
          <span className="text-2xl font-bold text-gradient-primary">CortIQ</span>
        </Link>
        
        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <a
            href="https://github.com/expandtalk/cortiq"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary transition-colors"
          >
            <Github className="h-5 w-5" />
          </a>
          <ThemeToggle />
          <Link to="/auth">
            <Button variant="ghost" className="hover-lift">Log in</Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-primary hover-scale hover-glow">Request Invitation</Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center space-x-2">
          <ThemeToggle />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-6 mt-8">
                <div className="flex items-center space-x-3 mb-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <span className="text-xl font-bold text-gradient-primary">CortIQ</span>
                </div>

                {/* Mobile Navigation Links */}
                <nav className="flex flex-col space-y-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                {/* Mobile Actions */}
                <div className="flex flex-col space-y-3 pt-6 border-t">
                  <a
                    href="https://github.com/expandtalk/cortiq"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Github className="h-5 w-5" />
                    <span className="font-medium">GitHub</span>
                  </a>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-gradient-primary">
                      Request Invitation
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}