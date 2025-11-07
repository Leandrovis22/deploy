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
// import { dataStore } from "@/lib/data-store"
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
              <div className="overflow-x-auto">
                <Table>