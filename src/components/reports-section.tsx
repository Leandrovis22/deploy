"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, BookOpen, Users, Calendar, TrendingUp, Download, Filter } from "lucide-react"
import { apiFetch } from '@/lib/api-client';
// import { dataStore } from "@/lib/data-store"
import type { Book, User as UserType, Loan, LoanWithDetails, Category } from "@/lib/types"

interface BookReport {
  book: Book
  totalLoans: number
  currentlyBorrowed: number
  availableCopies: number
}

interface UserReport {
  user: UserType
  totalLoans: number
  activeLoans: number
  overdueLoans: number
}

interface CategoryReport {
  category: string
  totalBooks: number
  totalCopies: number
  availableCopies: number
  totalLoans: number
}

export function ReportsSection() {
  const [books, setBooks] = useState<Book[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [loansWithDetails, setLoansWithDetails] = useState<LoanWithDetails[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("all")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    updateLoansWithDetails()
  }, [loans, books, users])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [booksRes, usersRes, loansRes, categoriesRes] = await Promise.all([
        apiFetch("/api/books"),
        apiFetch("/api/users"),
        apiFetch("/api/loans"),
        apiFetch("/api/categories"),
      ])
      if (!booksRes.ok || !usersRes.ok || !loansRes.ok || !categoriesRes.ok) throw new Error("Error al cargar datos")
      const [booksData, usersData, loansData, categoriesData] = await Promise.all([
        booksRes.json(),
        usersRes.json(),
        loansRes.json(),
        categoriesRes.json(),
      ])
      setBooks(booksData)
      setUsers(usersData)
      setLoans(loansData)
      setCategories(categoriesData)
    } catch (err) {
      // Si quieres mostrar un toast, puedes usar useToast aquí
    }
  }

  const updateLoansWithDetails = () => {
    const loansWithDetailsData = loans
      .map((loan) => {
        const book = books.find((b) => b.id === loan.bookId)
        const user = users.find((u) => u.id === loan.userId)

        let status = loan.status
        if (status === "active" && new Date(loan.dueDate) < new Date()) {
          status = "overdue"
        }

        return {
          ...loan,
          status,
          book: book!,
          user: user!,
        }
      })
      .filter((loan) => loan.book && loan.user)

    setLoansWithDetails(loansWithDetailsData)
  }

  const getBookReports = (): BookReport[] => {
    return books.map((book) => {
      const bookLoans = loans.filter((loan) => loan.bookId === book.id)
      const currentlyBorrowed = bookLoans.filter((loan) => loan.status === "active").length

      return {
        book,
        totalLoans: bookLoans.length,
        currentlyBorrowed,
        availableCopies: book.availableCopies ?? 0,
      }
    })
  }

  const getUserReports = (): UserReport[] => {
    return users.map((user) => {
      const userLoans = loans.filter((loan) => loan.userId === user.id)
      const activeLoans = userLoans.filter((loan) => loan.status === "active").length
      const overdueLoans = userLoans.filter((loan) => {
        if (loan.status !== "active") return false
        return new Date(loan.dueDate) < new Date()
      }).length

      return {
        user,
        totalLoans: userLoans.length,
        activeLoans,
        overdueLoans,
      }
    })
  }

  const getCategoryReports = (): CategoryReport[] => {
    return categories.map((category) => {
      const categoryBooks = books.filter((book) => book.categoryId === category.id)
      const totalBooks = categoryBooks.length
      const totalCopies = categoryBooks.reduce((sum, book) => sum + book.totalCopies, 0)
    const availableCopies = categoryBooks.reduce((sum, book) => sum + (book.availableCopies ?? 0), 0)

      const categoryBookIds = categoryBooks.map((book) => book.id)
      const totalLoans = loans.filter((loan) => categoryBookIds.includes(loan.bookId)).length

      return {
        category: category.name,
        totalBooks,
        totalCopies,
        availableCopies,
        totalLoans,
      }
    })
  }

  const getOverdueLoans = () => {
    return loansWithDetails.filter((loan) => {
      if (loan.status !== "active") return false
      return new Date(loan.dueDate) < new Date()
    })
  }

  const getPopularBooks = () => {
    const bookLoans = books.map((book) => ({
      book,
      loanCount: loans.filter((loan) => loan.bookId === book.id).length,
    }))

    return bookLoans.sort((a, b) => b.loanCount - a.loanCount).slice(0, 10)
  }

  const getActiveUsers = () => {
    const userLoans = users.map((user) => ({
      user,
      activeLoans: loans.filter((loan) => loan.userId === user.id && loan.status === "active").length,
      totalLoans: loans.filter((loan) => loan.userId === user.id).length,
    }))

    return userLoans.filter((item) => item.activeLoans > 0).sort((a, b) => b.activeLoans - a.activeLoans)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const exportReport = (reportName: string, data: any[]) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      Object.keys(data[0] || {}).join(",") +
      "\n" +
      data.map((row) => Object.values(row).join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${reportName}_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const bookReports = getBookReports()
  const userReports = getUserReports()
  const categoryReports = getCategoryReports()
  const overdueLoans = getOverdueLoans()
  const popularBooks = getPopularBooks()
  const activeUsers = getActiveUsers()

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || categoryId
  }

  const filteredBookReports =
    selectedCategory === "all" ? bookReports : bookReports.filter((report) => report.book.categoryId === selectedCategory)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Consultas e Informes</h2>
        <p className="text-slate-600">Análisis y reportes del sistema bibliotecario</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total de Préstamos</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{loans.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Préstamos Activos</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {loans.filter((loan) => loan.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Préstamos Vencidos</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{overdueLoans.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Categorías</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="books" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="books">Libros</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="overdue">Vencidos</TabsTrigger>
          <TabsTrigger value="popular">Populares</TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="space-y-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Reporte de Libros
                  </CardTitle>
                  <CardDescription>Estado de préstamos por libro</CardDescription>
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filtrar por categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() =>
                      exportReport(
                        "libros",
                        filteredBookReports.map((r) => ({
                          titulo: r.book.title,
                          autor: r.book.author,
                          categoria: r.book.category?.name || getCategoryName(r.book.categoryId),
                          total_prestamos: r.totalLoans,
                          actualmente_prestado: r.currentlyBorrowed,
                          copias_disponibles: r.availableCopies,
                        })),
                      )
                    }
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Libro</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Total Préstamos</TableHead>
                      <TableHead>Actualmente Prestado</TableHead>
                      <TableHead>Copias Disponibles</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-500 py-6">
                          No hay libros registrados para mostrar el reporte.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookReports.map((report) => (
                        <TableRow key={report.book.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-slate-900">{report.book.title}</div>
                              <div className="text-sm text-slate-600">{report.book.author}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{report.book.category?.name || getCategoryName(report.book.categoryId)}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{report.totalLoans}</TableCell>
                          <TableCell className="text-center">{report.currentlyBorrowed}</TableCell>
                          <TableCell className="text-center">{report.availableCopies}</TableCell>
                          <TableCell>
                            <Badge variant={report.availableCopies > 0 ? "default" : "destructive"} className="text-xs">
                              {report.availableCopies > 0 ? "Disponible" : "Agotado"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Reporte de Usuarios
                  </CardTitle>
                  <CardDescription>Actividad de préstamos por usuario</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    exportReport(
                      "usuarios",
                      userReports.map((r) => ({
                        nombre: r.user.name,
                        email: r.user.email,
                        total_prestamos: r.totalLoans,
                        prestamos_activos: r.activeLoans,
                        prestamos_vencidos: r.overdueLoans,
                        estado: r.user.isActive ? "Activo" : "Inactivo",
                      })),
                    )
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Total Préstamos</TableHead>
                      <TableHead>Préstamos Activos</TableHead>
                      <TableHead>Préstamos Vencidos</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userReports.map((report) => (
                      <TableRow key={report.user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-900">{report.user.name}</div>
                            <div className="text-sm text-slate-600">{report.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{report.totalLoans}</TableCell>
                        <TableCell className="text-center">{report.activeLoans}</TableCell>
                        <TableCell className="text-center">
                          {report.overdueLoans > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {report.overdueLoans}
                            </Badge>
                          )}
                          {report.overdueLoans === 0 && <span className="text-slate-400">0</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={report.user.isActive ? "default" : "secondary"} className="text-xs">
                            {report.user.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Reporte por Categorías
                  </CardTitle>
                  <CardDescription>Estadísticas por categoría de libros</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    exportReport(
                      "categorias",
                      categoryReports.map((r) => ({
                        categoria: r.category,
                        total_libros: r.totalBooks,
                        total_copias: r.totalCopies,
                        copias_disponibles: r.availableCopies,
                        total_prestamos: r.totalLoans,
                      })),
                    )
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Total Libros</TableHead>
                      <TableHead>Total Copias</TableHead>
                      <TableHead>Copias Disponibles</TableHead>
                      <TableHead>Total Préstamos</TableHead>
                      <TableHead>Tasa de Utilización</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryReports.map((report) => {
                      const utilizationRate =
                        report.totalCopies > 0
                          ? (((report.totalCopies - report.availableCopies) / report.totalCopies) * 100).toFixed(1)
                          : "0"

                      return (
                        <TableRow key={report.category}>
                          <TableCell>
                            <Badge variant="outline">{report.category}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{report.totalBooks}</TableCell>
                          <TableCell className="text-center">{report.totalCopies}</TableCell>
                          <TableCell className="text-center">{report.availableCopies}</TableCell>
                          <TableCell className="text-center">{report.totalLoans}</TableCell>
                          <TableCell className="text-center">{utilizationRate}%</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-red-600" />
                    Préstamos Vencidos
                  </CardTitle>
                  <CardDescription>Libros que requieren atención inmediata</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    exportReport(
                      "vencidos",
                      overdueLoans.map((loan) => ({
                        libro: loan.book.title,
                        usuario: loan.user.name,
                        fecha_prestamo: formatDate(loan.loanDate),
                        fecha_vencimiento: formatDate(loan.dueDate),
                        dias_vencido: Math.abs(
                          Math.ceil((new Date(loan.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
                        ),
                      })),
                    )
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Libro</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Fecha de Préstamo</TableHead>
                      <TableHead>Fecha de Vencimiento</TableHead>
                      <TableHead>Días Vencido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueLoans.map((loan) => {
                      const daysOverdue = Math.abs(
                        Math.ceil((new Date(loan.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
                      )

                      return (
                        <TableRow key={loan.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-slate-900">{loan.book.title}</div>
                              <div className="text-sm text-slate-600">{loan.book.author}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-slate-900">{loan.user.name}</div>
                              <div className="text-sm text-slate-600">{loan.user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(loan.loanDate)}</TableCell>
                          <TableCell className="text-sm">{formatDate(loan.dueDate)}</TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="text-xs">
                              {daysOverdue} días
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {overdueLoans.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-green-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">¡Excelente!</h3>
                  <p className="text-slate-600">No hay préstamos vencidos en este momento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popular" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Libros Más Populares
                </CardTitle>
                <CardDescription>Top 10 libros más prestados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {popularBooks.map((item, index) => (
                    <div key={item.book.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm">{item.book.title}</p>
                          <p className="text-xs text-slate-600">{item.book.author}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.loanCount} préstamos
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Usuarios Más Activos
                </CardTitle>
                <CardDescription>Usuarios con préstamos activos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeUsers.slice(0, 10).map((item, index) => (
                    <div key={item.user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm">{item.user.name}</p>
                          <p className="text-xs text-slate-600">{item.totalLoans} préstamos totales</p>
                        </div>
                      </div>
                      <Badge variant="default" className="text-xs">
                        {item.activeLoans} activos
                      </Badge>
                    </div>
                  ))}
                </div>

                {activeUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Sin préstamos activos</h3>
                    <p className="text-slate-600">No hay usuarios con préstamos activos actualmente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
