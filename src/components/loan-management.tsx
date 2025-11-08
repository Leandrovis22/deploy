"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Calendar, BookOpen, CheckCircle, AlertTriangle, RotateCcw, DollarSign, Edit, Trash2 } from "lucide-react"
import { apiFetch } from '@/lib/api-client';

import type { Book, User as UserType, Loan, LoanWithDetails } from "@/lib/types"

interface LoanFormData {
  bookId: string
  userId: string
  loanDate: Date
  dueDate: Date
}

interface LoanManagementProps {
  reloadData?: () => void
}

export function LoanManagement({ reloadData }: LoanManagementProps) {
  // ...existing state...
  const [returningLoanId, setReturningLoanId] = useState<string | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [loansWithDetails, setLoansWithDetails] = useState<LoanWithDetails[]>([])
  const [filteredLoans, setFilteredLoans] = useState<LoanWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [formData, setFormData] = useState<LoanFormData>({
    bookId: "",
    userId: "",
    loanDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  })
  const [creatingLoan, setCreatingLoan] = useState(false)
  const [editingLoan, setEditingLoan] = useState<LoanWithDetails | null>(null)
  const [editFormData, setEditFormData] = useState<LoanFormData>({
    bookId: "",
    userId: "",
    loanDate: new Date(),
    dueDate: new Date(),
  })
  const [editStatus, setEditStatus] = useState<"active" | "returned">("active")
  const [editReturnDate, setEditReturnDate] = useState<Date | null>(null)
  const [updatingLoan, setUpdatingLoan] = useState(false)
  const [deletingLoanId, setDeletingLoanId] = useState<string | null>(null)
  // --- Autocomplete logic for book and user inputs ---
  const [bookSearchTerm, setBookSearchTerm] = useState("");
  const [bookSuggestions, setBookSuggestions] = useState<Book[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<UserType[]>([]);

  const handleBookSearch = (term: string) => {
    setBookSearchTerm(term);
    setFormData({ ...formData, bookId: "" });
    if (!term) {
      setBookSuggestions([]);
      return;
    }
    const suggestions = books.filter(
      (book) =>
        (book.availableCopies ?? 0) > 0 &&
        (book.title.toLowerCase().includes(term.toLowerCase()) ||
          book.author.toLowerCase().includes(term.toLowerCase()))
    );
    setBookSuggestions(suggestions.slice(0, 8));
  };

  const handleSelectBook = (book: Book) => {
    setFormData({ ...formData, bookId: book.id });
    setBookSearchTerm(book.title + " - " + book.author);
    setBookSuggestions([]);
  };

  const handleUserSearch = (term: string) => {
    setUserSearchTerm(term);
    setFormData({ ...formData, userId: "" });
    if (!term) {
      setUserSuggestions([]);
      return;
    }
    const suggestions = users.filter(
      (user) =>
        user.isActive &&
        user.role !== "admin" &&
        (user.name.toLowerCase().includes(term.toLowerCase()) ||
          user.email.toLowerCase().includes(term.toLowerCase()))
    );
    setUserSuggestions(suggestions.slice(0, 8));
  };

  const handleSelectUser = (user: UserType) => {
    setFormData({ ...formData, userId: user.id });
    setUserSearchTerm(user.name + " - " + user.email);
    setUserSuggestions([]);
  };
  // ...existing code...

  // Funciones de validación
  const validateDates = (loanDate: Date, dueDate: Date): string | null => {
    if (new Date(dueDate) < new Date(loanDate)) {
      return "La fecha de vencimiento no puede ser anterior a la de préstamo"
    }
    return null
  }

  // Calcular multa por retraso
  const calculateLateFee = (dueDate: Date): number => {
    const now = new Date()
    const due = new Date(dueDate)

    if (now <= due) return 0

    const daysOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
    return daysOverdue * 500 // $500 por día de retraso
  }

  // Calcular días de retraso
  const getDaysOverdue = (dueDate: Date | string): number => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays < 0 ? Math.abs(diffDays) : 0
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    updateLoansWithDetails()
  }, [loans, books, users])

  useEffect(() => {
    filterLoans()
  }, [loansWithDetails, searchTerm, statusFilter])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [booksRes, usersRes, loansRes] = await Promise.all([
        apiFetch("/api/books"),
        apiFetch("/api/users"),
        apiFetch("/api/loans"),
      ])
      if (!booksRes.ok || !usersRes.ok || !loansRes.ok) throw new Error("Error al cargar datos")
      const [booksData, usersData, loansData] = await Promise.all([
        booksRes.json(),
        usersRes.json(),
        loansRes.json(),
      ])
      setBooks(booksData)
      setUsers(usersData)
      setLoans(loansData)
    } catch (err) {
  toast.error("No se pudieron cargar los datos")
    }
  }

  const updateLoansWithDetails = () => {
    const loansWithDetailsData = loans
      .map((loan) => {
        const book = books.find((b) => b.id === loan.bookId)
        const user = users.find((u) => u.id === loan.userId)

        let status = loan.status
        // Solo cambiar a overdue si el préstamo está activo y está vencido
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

  const filterLoans = () => {
    let filtered = loansWithDetails

    if (searchTerm) {
      filtered = filtered.filter(
        (loan) =>
          loan.book?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.book?.author.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((loan) => loan.status === statusFilter)
    }

    setFilteredLoans(filtered)
  }

  const resetForm = () => {
    setFormData({
      bookId: "",
      userId: "",
      loanDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    })
  }

  const handleCreateLoan = async () => {
    setCreatingLoan(true)
    try {
      if (!formData.bookId || !formData.userId) {
        toast.error("Por favor seleccione un libro y un usuario")
        return
      }
      const dateError = validateDates(formData.loanDate, formData.dueDate)
      if (dateError) {
        toast.error(dateError)
        return
      }
      const book = books.find((b) => b.id === formData.bookId)
      if (!book || typeof book.availableCopies !== "number" || book.availableCopies <= 0) {
        toast.error("El libro seleccionado no tiene copias disponibles")
        return
      }
      const user = users.find((u) => u.id === formData.userId)
      if (!user || !user.isActive) {
        toast.error("El usuario no está activo en el sistema")
        return
      }
      const existingLoan = loans.find(
        (loan) => loan.userId === formData.userId && loan.bookId === formData.bookId && loan.status === "active"
      )
      if (existingLoan) {
        toast.error("El usuario ya tiene este libro en préstamo activo")
        return
      }
      const res = await apiFetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: formData.bookId,
          userId: formData.userId,
          loanDate: formData.loanDate,
          dueDate: formData.dueDate,
          status: "active",
          returnDate: null
        }),
      })
      if (!res.ok) throw new Error("Error al crear préstamo")
      await loadData()
      if (reloadData) reloadData()
      resetForm()
      toast.success(`"${book.title}" ha sido prestado a ${user.name} hasta ${formatDate(formData.dueDate)}`)
    } catch (error) {
      toast.error("Ocurrió un error al crear el préstamo")
    } finally {
      setCreatingLoan(false)
    }
  }

  const handleReturnBook = async (loan: LoanWithDetails) => {
    setReturningLoanId(loan.id)
    const lateFee = calculateLateFee(loan.dueDate)
    const daysOverdue = lateFee > 0 ? Math.floor(lateFee / 500) : 0
    try {
      const res = await apiFetch(`/api/loans/${loan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "returned", returnDate: new Date() }),
      })
      if (!res.ok) throw new Error("Error al devolver libro")
      await loadData()
      if (reloadData) reloadData()
      let message = `"${loan.book.title}" ha sido devuelto exitosamente`
      if (lateFee > 0) {
        message += ` (Multa por ${daysOverdue} días: $${lateFee})`
      }
      toast.success(message)
    } catch (error) {
      toast.error("No se pudo procesar la devolución")
    } finally {
      setReturningLoanId(null)
    }
  }

  const handleMarkFeesPaid = async (loanId: string) => {
    const loan = loansWithDetails.find(l => l.id === loanId)
    if (loan && loan.status !== "returned") {
      toast.error("Debe devolver el libro antes de marcar la multa como pagada")
      return
    }
    try {
      const res = await apiFetch(`/api/loans/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lateFeesPaid: true }),
      })
      if (!res.ok) throw new Error("Error al marcar multa como pagada")
      await loadData()
      if (reloadData) reloadData()
      toast.success("Multa marcada como pagada")
    } catch (error) {
      toast.error("No se pudo actualizar el estado de la multa")
    }
  }

  const handleEditLoan = (loan: LoanWithDetails) => {
    setEditingLoan(loan)
    setEditFormData({
      bookId: loan.bookId,
      userId: loan.userId,
      loanDate: new Date(loan.loanDate),
      dueDate: new Date(loan.dueDate),
    })
    setEditStatus(loan.status === "returned" ? "returned" : "active")
    setEditReturnDate(loan.returnDate ? new Date(loan.returnDate) : null)
  }

  const handleUpdateLoan = async () => {
    if (!editingLoan) return
    setUpdatingLoan(true)
    try {
      const dateError = validateDates(editFormData.loanDate, editFormData.dueDate)
      if (dateError) {
        toast.error(dateError)
        return
      }
      if (editStatus === "returned" && !editReturnDate) {
        toast.error("Debe especificar una fecha de devolución")
        return
      }
      const res = await apiFetch(`/api/loans/${editingLoan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editFormData,
          status: editStatus,
          returnDate: editStatus === "returned" ? editReturnDate : null,
        }),
      })
      if (!res.ok) throw new Error("Error al actualizar préstamo")
      setEditingLoan(null)
      await loadData()
      if (reloadData) reloadData()
      toast.success("Préstamo actualizado exitosamente")
    } catch (error) {
      toast.error("No se pudo actualizar el préstamo")
    } finally {
      setUpdatingLoan(false)
    }
  }

  const handleDeleteLoan = async (loanId: string) => {
    if (!confirm("¿Está seguro de eliminar este préstamo? Esta acción no se puede deshacer.")) {
      return
    }
    setDeletingLoanId(loanId)
    try {
      const res = await apiFetch(`/api/loans/${loanId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Error al eliminar préstamo")
      await loadData()
      if (reloadData) reloadData()
      toast.success("Préstamo eliminado exitosamente")
    } catch (error) {
      toast.error("No se pudo eliminar el préstamo")
    } finally {
      setDeletingLoanId(null)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getDaysUntilDue = (dueDate: Date | string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusBadge = (loan: LoanWithDetails) => {
    const daysUntilDue = getDaysUntilDue(loan.dueDate)

    if (loan.status === "returned") {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Devuelto
        </Badge>
      )
    }

    if (loan.status === "overdue" || daysUntilDue < 0) {
      return <Badge variant="destructive">Vencido ({Math.abs(daysUntilDue)} días)</Badge>
    }

    if (daysUntilDue <= 3) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Por vencer ({daysUntilDue} días)
        </Badge>
      )
    }

    return <Badge variant="outline">Activo ({daysUntilDue} días)</Badge>
  }

  // Cálculos
  const availableBooks = books.filter((book) => typeof book.availableCopies === "number" && book.availableCopies > 0)
  const activeUsers = users.filter((user) => user.isActive)
  const activeLoans = loansWithDetails.filter((loan) => loan.status === "active").length
  const overdueLoans = loansWithDetails.filter(
    (loan) => loan.status !== "returned" && (loan.status === "overdue" || getDaysUntilDue(loan.dueDate) < 0)
  ).length
  const returnedToday = loansWithDetails.filter((loan) => {
    if (!loan.returnDate) return false
    const today = new Date()
    const returnDate = new Date(loan.returnDate)
    return returnDate.toDateString() === today.toDateString()
  }).length

  const totalOverdueFees = loansWithDetails
    .filter((loan) => loan.status === "active" && getDaysOverdue(loan.dueDate) > 0)
    .reduce((sum, loan) => sum + calculateLateFee(loan.dueDate), 0)

  const averageLoanDuration = loansWithDetails.length > 0
    ? Math.round(
        loansWithDetails.reduce((sum, loan) => {
          const days = Math.floor(
            (new Date(loan.dueDate).getTime() - new Date(loan.loanDate).getTime()) / (1000 * 60 * 60 * 24)
          )
          return sum + days
        }, 0) / loansWithDetails.length
      )
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Préstamos y Devoluciones</h2>
        <p className="text-slate-600">Gestione los préstamos de libros y devoluciones</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Préstamos Activos</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{activeLoans}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Préstamos Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{overdueLoans}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Multas Pendientes</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">${totalOverdueFees}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Duración Promedio</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{averageLoanDuration} días</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="loans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="loans">Gestión de Préstamos</TabsTrigger>
          <TabsTrigger value="new-loan">Nuevo Préstamo</TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="space-y-6">
          {/* Search and Filter Bar */}
          <Card className="bg-white border-slate-200">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por libro, usuario o autor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los préstamos</SelectItem>
                    <SelectItem value="active">Préstamos activos</SelectItem>
                    <SelectItem value="overdue">Préstamos vencidos</SelectItem>
                    <SelectItem value="returned">Libros devueltos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Loans Table */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Préstamos ({filteredLoans.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLoans.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No se encontraron préstamos</h3>
                  <p className="text-slate-600">
                    {searchTerm || statusFilter !== "all"
                      ? "Intente ajustar los filtros de búsqueda"
                      : "No hay préstamos registrados en el sistema"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Libro</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead className="hidden md:table-cell">Fecha de Préstamo</TableHead>
                        <TableHead>Fecha de Vencimiento</TableHead>
                        <TableHead>Multa</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLoans.map((loan) => {
                        const lateFee = calculateLateFee(loan.dueDate);
                        return (
                          <TableRow key={loan.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium text-slate-900">{loan.book?.title}</div>
                                <div className="text-sm text-slate-600">{loan.book?.author}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-slate-900">{loan.user?.name}</div>
                                <div className="text-sm text-slate-600">{loan.user?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm hidden md:table-cell">{formatDate(loan.loanDate)}</TableCell>
                            <TableCell className="text-sm">
                              {formatDate(loan.dueDate)}
                              {loan.returnDate && (
                                <div className="text-xs text-green-600 mt-1">
                                  Devuelto: {formatDate(loan.returnDate)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {lateFee > 0 ? (
                                <div className="flex flex-col gap-1">
                                  <Badge variant="destructive">${lateFee}</Badge>
                                  {!loan.lateFeesPaid && loan.status === "returned" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleMarkFeesPaid(loan.id)}
                                      className="text-xs h-7"
                                    >
                                      <DollarSign className="w-3 h-3 mr-1" />
                                      Marcar Pagado
                                    </Button>
                                  )}
                                  {loan.lateFeesPaid && (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                      Pagado
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-slate-600">-</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(loan)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {(loan.status === "active" || loan.status === "overdue") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReturnBook(loan)}
                                    className="flex items-center gap-1 px-2"
                                    disabled={returningLoanId === loan.id}
                                  >
                                    {returningLoanId === loan.id ? (
                                      <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                      </svg>
                                    ) : (
                                      <>
                                        <RotateCcw className="w-4 h-4" />
                                        <span className="hidden sm:inline">Devolver</span>
                                      </>
                                    )}
                                  </Button>
                                )}
                                {loan.status === "returned" && (
                                  <Badge variant="outline" className="text-xs">
                                    Completado
                                  </Badge>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditLoan(loan)}
                                  className="flex items-center gap-1 px-2"
                                  title="Editar préstamo"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteLoan(loan.id)}
                                  className="flex items-center gap-1 text-red-600 hover:text-red-700 px-2"
                                  disabled={deletingLoanId === loan.id}
                                  title="Eliminar préstamo"
                                >
                                  {deletingLoanId === loan.id ? (
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new-loan" className="space-y-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Registrar Nuevo Préstamo
              </CardTitle>
              <CardDescription>
                Seleccione un libro disponible y un usuario activo para crear un nuevo préstamo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="book">Libro *</Label>
                    <div className="relative">
                      <Input
                        id="book"
                        placeholder="Buscar libro por título o autor..."
                        value={formData.bookId ? (availableBooks.find(b => b.id === formData.bookId)?.title + ' - ' + availableBooks.find(b => b.id === formData.bookId)?.author) : bookSearchTerm || ''}
                        onChange={e => handleBookSearch(e.target.value)}
                        className="pl-10"
                        autoComplete="off"
                      />
                      {bookSuggestions.length > 0 && (
                        <div className="absolute z-10 bg-white border border-slate-200 rounded shadow w-full mt-1 max-h-48 overflow-y-auto">
                          {bookSuggestions.map(book => (
                            <div
                              key={book.id}
                              className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                              onClick={() => handleSelectBook(book)}
                            >
                              {book.title} - {book.author} ({book.availableCopies} disponibles)
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="user">Usuario *</Label>
                    <div className="relative">
                      <Input
                        id="user"
                        placeholder="Buscar usuario por nombre o email..."
                        value={formData.userId ? (activeUsers.find(u => u.id === formData.userId)?.name + ' - ' + activeUsers.find(u => u.id === formData.userId)?.email) : userSearchTerm || ''}
                        onChange={e => handleUserSearch(e.target.value)}
                        className="pl-10"
                        autoComplete="off"
                      />
                      {userSuggestions.length > 0 && (
                        <div className="absolute z-10 bg-white border border-slate-200 rounded shadow w-full mt-1 max-h-48 overflow-y-auto">
                          {userSuggestions.map(user => (
                            <div
                              key={user.id}
                              className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                              onClick={() => handleSelectUser(user)}
                            >
                              {user.name} - {user.email}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="loanDate">Fecha de Préstamo</Label>
                    <Input
                      id="loanDate"
                      type="date"
                      value={formData.loanDate && !isNaN(formData.loanDate.getTime()) ? formData.loanDate.toISOString().split("T")[0] : ""}
                      onChange={(e) => setFormData({ ...formData, loanDate: e.target.value ? new Date(e.target.value) : new Date() })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate && !isNaN(formData.dueDate.getTime()) ? formData.dueDate.toISOString().split("T")[0] : ""}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value ? new Date(e.target.value) : new Date() })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 flex-col sm:flex-row">
                <Button onClick={handleCreateLoan} className="flex-1" disabled={creatingLoan}>
                  {creatingLoan ? (
                    <svg className="animate-spin h-5 w-5 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar Préstamo
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Limpiar Formulario
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{availableBooks.length}</div>
                  <div className="text-sm text-slate-600">Libros Distintos Disponibles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{activeUsers.length}</div>
                  <div className="text-sm text-slate-600">Usuarios Activos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para editar préstamo */}
      <Dialog open={editingLoan !== null} onOpenChange={(open) => !open && setEditingLoan(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Préstamo</DialogTitle>
            <DialogDescription>
              Modifique los datos del préstamo incluyendo fechas y estado.
            </DialogDescription>
          </DialogHeader>
          {editingLoan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Libro</Label>
                  <div className="p-2 bg-slate-100 rounded text-sm">
                    <div className="font-medium">{editingLoan.book.title}</div>
                    <div className="text-slate-600">{editingLoan.book.author}</div>
                  </div>
                </div>
                <div>
                  <Label>Usuario</Label>
                  <div className="p-2 bg-slate-100 rounded text-sm">
                    <div className="font-medium">{editingLoan.user.name}</div>
                    <div className="text-slate-600">{editingLoan.user.email}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editLoanDate">Fecha de Préstamo</Label>
                  <Input
                    id="editLoanDate"
                    type="date"
                    value={editFormData.loanDate && !isNaN(editFormData.loanDate.getTime()) ? editFormData.loanDate.toISOString().split("T")[0] : ""}
                    onChange={(e) => setEditFormData({ ...editFormData, loanDate: e.target.value ? new Date(e.target.value) : new Date() })}
                  />
                </div>
                <div>
                  <Label htmlFor="editDueDate">Fecha de Vencimiento</Label>
                  <Input
                    id="editDueDate"
                    type="date"
                    value={editFormData.dueDate && !isNaN(editFormData.dueDate.getTime()) ? editFormData.dueDate.toISOString().split("T")[0] : ""}
                    onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value ? new Date(e.target.value) : new Date() })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editStatus">Estado</Label>
                  <Select value={editStatus} onValueChange={(value: "active" | "returned") => setEditStatus(value)}>
                    <SelectTrigger id="editStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="returned">Devuelto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editStatus === "returned" && (
                  <div>
                    <Label htmlFor="editReturnDate">Fecha de Devolución</Label>
                    <Input
                      id="editReturnDate"
                      type="date"
                      value={editReturnDate && !isNaN(editReturnDate.getTime()) ? editReturnDate.toISOString().split("T")[0] : ""}
                      onChange={(e) => setEditReturnDate(e.target.value ? new Date(e.target.value) : new Date())}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingLoan(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateLoan} disabled={updatingLoan}>
                  {updatingLoan ? (
                    <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
