import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, User, ShoppingBag, Store, Home, Shirt, PlusCircle, Sun, Moon, ArrowLeftRight } from "lucide-react";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("realclosets-theme");
    const prefersDark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("realclosets-theme", next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-background text-foreground transition-colors hover:bg-muted"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

const navItems = [
  { href: "/", label: "For You", icon: Home },
  { href: "/list", label: "List", icon: PlusCircle },
  { href: "/trades", label: "Trades", icon: ArrowLeftRight },
  { href: "/shop", label: "My Shop", icon: Store },
  { href: "/account", label: "Account", icon: User },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-20">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto px-4 py-3 flex flex-col gap-3 md:h-20 md:flex-row md:items-center md:justify-between md:py-0">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="group flex items-center gap-2.5" aria-label="Real Closets home">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-foreground text-background shadow-sm transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                <Shirt className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-sans text-[1.35rem] font-black lowercase tracking-[-0.08em] text-foreground">
                  realclosets
                </span>
                <span className="mt-1 hidden text-[0.55rem] font-bold uppercase tracking-[0.22em] text-primary sm:block">
                  secondhand only
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <ShoppingBag className="h-5 w-5 text-foreground md:hidden" />
            </div>
          </div>
          
          <div className="flex flex-1 items-center md:max-w-xl">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search brands, items, closets"
                className="h-11 w-full rounded-full bg-muted/70 pl-11 pr-4 text-sm border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        {children}
      </main>

      <footer className="hidden md:block border-t py-12 bg-card mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="font-serif text-xl font-bold text-foreground mb-4">Real Closets</p>
          <p className="text-sm max-w-md mx-auto">True secondhand clothing from real people. Verified, personal, and authentic.</p>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto grid max-w-3xl grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)] gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href === "/" && location.startsWith("/listings"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="leading-tight text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
