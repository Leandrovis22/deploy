"use client"

import { useEffect, useState } from "react"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, FileText, TrendingUp, Calendar, AlertCircle, Menu } from "lucide-react"
import type { Book, User, Loan } from "@/lib/types"
import { BookManagement } from "@/components/book-management"
import { LoanManagement } from "@/components/loan-management"
import { UserManagement } from "@/components/user-management"

function Spinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  )
}
import { Toaster } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function Dashboard() {
  useAuthRedirect();
  const [books, setBooks] = useState<Book[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [activeSection, setActiveSection] = useState<string>("dashboard")
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true);
    try {
      const [booksRes, usersRes, loansRes] = await Promise.all([
        apiFetch('/api/books'),
        apiFetch('/api/users'),
        apiFetch('/api/loans'),
      ]);

      if (!booksRes.ok || !usersRes.ok || !loansRes.ok) {
        console.error('Error fetching data:', {
          books: booksRes.status,
          users: usersRes.status,
          loans: loansRes.status,
        });
        return;
      }

      const books = await booksRes.json();
      const users = await usersRes.json();
      const loans = await loansRes.json();

      setBooks(Array.isArray(books) ? books : []);
      setUsers(Array.isArray(users) ? users : []);
      setLoans(Array.isArray(loans) ? loans : []);
    } catch (error) {
      console.error('Error during fetchData:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('user');
    if (!token) {
      console.warn('No token found. Redirecting to login.');
      window.location.href = '/login';
      return;
    }

    fetchData();
  }, [])

  // Listen to nav-select events dispatched by Header mobile menu
  useEffect(() => {
    const handler = (e: any) => {
      const section = e?.detail
      if (section) {
        setActiveSection(section)
        setIsMenuOpen(false)
      }
    }
    window.addEventListener('nav-select', handler as EventListener)
    return () => window.removeEventListener('nav-select', handler as EventListener)
  }, [])

  const reloadData = () => {
    fetchData()
  }

  const totalBooks = books.reduce((sum, book) => sum + book.totalCopies, 0)
  const availableBooks = books.reduce((sum, book) => sum + (book.availableCopies ?? 0), 0)
  const activeLoans = loans.filter((loan) => loan.status === "active").length
  const overdueLoans = loans.filter((loan) => {
    if (loan.status !== "active") return false
    return new Date(loan.dueDate) < new Date()
  }).length

  const menuItems = [
  { id: "dashboard", label: "Panel Principal", icon: TrendingUp },
  { id: "books", label: "Gestión de Libros", icon: BookOpen },
  { id: "users", label: "Gestión de Usuarios", icon: Users },
  { id: "loans", label: "Préstamos y Devoluciones", icon: Calendar },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster position="top-right" />

      {/* Header removido, ahora es global y client-side */}

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile menu button moved to Header; hide duplicate here */}
        <button 
          className="hidden"
          aria-hidden
        />
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className={`w-64 flex-shrink-0 md:block ${isMenuOpen ? 'block absolute z-40 left-4 top-20 w-64 bg-white border rounded shadow p-4' : 'hidden md:block'}`}>
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "default" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => {
                      setActiveSection(item.id)
                      setIsMenuOpen(false) // Close menu on selection
                    }}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeSection === "dashboard" && (
              loading ? <Spinner /> : (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Panel Principal</h2>
                    <p className="text-slate-600">Resumen general del sistema bibliotecario</p>
                  </div>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white border-slate-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total de Libros</CardTitle>
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{totalBooks}</div>
                        <p className="text-xs text-slate-600 mt-1">{availableBooks} disponibles</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Usuarios Registrados</CardTitle>
                        <Users className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{users.length}</div>
                        <p className="text-xs text-slate-600 mt-1">{users.filter((u) => u.isActive).length} activos</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Préstamos Activos</CardTitle>
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{activeLoans}</div>
                        <p className="text-xs text-slate-600 mt-1">En circulación</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Préstamos Vencidos</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{overdueLoans}</div>
                        <p className="text-xs text-slate-600 mt-1">Requieren atención</p>
                      </CardContent>
                    </Card>
                  </div>
                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-white border-slate-200">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-900">Libros Más Prestados</CardTitle>
                        <CardDescription>Top 5 libros con más préstamos</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {books.length === 0 ? (
                            <div className="text-center text-slate-500 py-6">
                              No hay libros registrados aún.
                            </div>
                          ) : (
                            books.slice(0, 5).map((book, index) => (
                              <div key={book.id} className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900 text-sm">{book.title}</p>
                                  <p className="text-xs text-slate-600">{book.author}</p>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {book.totalCopies - (book.availableCopies ?? 0)} préstamos
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-200">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-900">Acciones Rápidas</CardTitle>
                        <CardDescription>Operaciones frecuentes del sistema</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Button
                            className="w-full justify-start bg-transparent"
                            variant="outline"
                            onClick={() => setActiveSection("books")}
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Agregar Nuevo Libro
                          </Button>
                          <Button
                            className="w-full justify-start bg-transparent"
                            variant="outline"
                            onClick={() => setActiveSection("users")}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Registrar Usuario
                          </Button>
                          <Button
                            className="w-full justify-start bg-transparent"
                            variant="outline"
                            onClick={() => setActiveSection("loans")}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Procesar Préstamo
                          </Button>
                          {/* Botón de informes eliminado */}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )
            )}

            {activeSection === "books" && (
              loading ? <Spinner /> : <BookManagement reloadData={reloadData} />
            )}
            {activeSection === "users" && (
              loading ? <Spinner /> : <UserManagement reloadData={reloadData} />
            )}
            {activeSection === "loans" && (
              loading
                ? <Spinner />
                : <LoanManagement reloadData={reloadData} />
            )}
            {/* Sección de informes eliminada */}
          </main>
        </div>
      </div>
    </div>
  )
}
