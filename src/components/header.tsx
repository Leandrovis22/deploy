"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import { BookOpen, TrendingUp, Users, Calendar } from "lucide-react";

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = window.localStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      setUser(parsedUser?.user || null);
    }
  }, []);

  if (!user) return null;
  return (
    <header className="w-full px-4 sm:px-6 py-3 bg-card border-b flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
  {/* Hide full title on small screens (<920px) - use custom class for exact 920px breakpoint */}
  <span className="hide-below-920 text-lg md:text-xl font-bold text-slate-900">Sistema de Gestión Bibliotecaria</span>
      </div>

      {/* Right side: user info and hamburger for mobile */}
      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-sm text-muted-foreground">{user.name} ({user.role})</span>

        {/* Menu button visible below 920px (approx md/lg breakpoints). Use md to display on smaller screens */}
        <Button
          variant="ghost"
          className="p-2 show-below-920"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </Button>

        {/* Logout visible on larger screens */}
        <div className="hidden md:inline-flex">
          <Button
            variant="outline"
            onClick={() => {
              window.localStorage.removeItem("user");
              window.location.reload();
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Absolute mobile menu */}
      {isMenuOpen && (
        <div className="absolute top-14 right-4 z-50 w-64 bg-white border rounded shadow-lg p-3 lg:hidden">
          <nav className="flex flex-col space-y-2">
            <div className="text-sm text-slate-700">{user.name} ({user.role})</div>
            {/* Navigation items will dispatch a custom event so parent page can react */}
            <button
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 text-left"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('nav-select', { detail: 'dashboard' }));
                setIsMenuOpen(false);
              }}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Panel Principal</span>
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 text-left"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('nav-select', { detail: 'books' }));
                setIsMenuOpen(false);
              }}
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">Gestión de Libros</span>
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 text-left"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('nav-select', { detail: 'users' }));
                setIsMenuOpen(false);
              }}
            >
              <Users className="w-4 h-4" />
              <span className="text-sm">Gestión de Usuarios</span>
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 text-left"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('nav-select', { detail: 'loans' }));
                setIsMenuOpen(false);
              }}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Préstamos y Devoluciones</span>
            </button>

            <div className="border-t mt-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  window.localStorage.removeItem("user");
                  window.location.reload();
                }}
              >
                Logout
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
