"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, BookOpen, Filter } from "lucide-react"
import { apiFetch } from '@/lib/api-client';
import type { Book, Category } from "@/lib/types"
import { toast } from "sonner"

interface BookFormData {
  title: string
  author: string
  isbn: string
  categoryId: string
  publicationYear: number
  totalCopies: number
}

interface BookManagementProps {
  reloadData?: () => void
}

export function BookManagement({ reloadData }: BookManagementProps) {
  const [addingBook, setAddingBook] = useState(false)
  const [editingBookLoading, setEditingBookLoading] = useState(false)
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [categorySearchTerm, setCategorySearchTerm] = useState("")
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [formData, setFormData] = useState<BookFormData>({
    title: "",
    author: "",
    isbn: "",
    categoryId: "",
    publicationYear: new Date().getFullYear(),
    totalCopies: 1,
  })

  useEffect(() => {
    (async () => {
      loadBooks()
      loadCategories()
    })()
  }, [])

  useEffect(() => {
    filterBooks()
  }, [books, searchTerm, categoryFilter])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-category-search]')) {
        setShowCategorySuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadBooks = () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    apiFetch('/api/books', { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBooks(data);
        } else {
          console.error('Unexpected response format for books:', data);
          setBooks([]);
          toast.error('Error al cargar los libros');
        }
      })
      .catch(err => {
        console.error('Failed to load books:', err);
        setBooks([]);
        toast.error('Error al cargar los libros');
      });
  }

  const loadCategories = () => {
    apiFetch('/api/categories', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => {
        if (!res.ok) {
          console.error(`Error fetching categories: ${res.status} ${res.statusText}`);
          return [];
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error('Unexpected response format for categories:', data);
        }
      })
      .catch(err => {
        console.error('Failed to load categories:', err);
      });
  }

  const filterBooks = () => {
    let filtered = books

    if (searchTerm) {
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.isbn.includes(searchTerm),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((book) => book.categoryId === categoryFilter)
    }

    setFilteredBooks(Array.isArray(filtered) ? filtered : [])
  }

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      isbn: "",
      categoryId: "",
      publicationYear: new Date().getFullYear(),
      totalCopies: 1,
    })
    setCategorySearchTerm("")
    setShowCategorySuggestions(false)
  }

  const handleCreateCategory = async () => {
    if (!categorySearchTerm.trim()) {
      toast.error("El nombre de la categoría no puede estar vacío")
      return
    }

    setCreatingCategory(true)
    try {
      const response = await apiFetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categorySearchTerm.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        await loadCategories()
        setFormData({ ...formData, categoryId: data.id })
        setCategorySearchTerm(data.name)
        setShowCategorySuggestions(false)
        toast.success(`Categoría "${data.name}" creada exitosamente`)
      } else {
        toast.error(data.error || "Error al crear la categoría")
      }
    } catch (error) {
      toast.error("Error al crear la categoría")
    } finally {
      setCreatingCategory(false)
    }
  }

  const getFilteredCategories = () => {
    if (!categorySearchTerm.trim()) return categories
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
    )
  }

  const handleCategorySelect = (category: Category) => {
    setFormData({ ...formData, categoryId: category.id })
    setCategorySearchTerm(category.name)
    setShowCategorySuggestions(false)
  }

  const handleCategoryInputChange = (value: string) => {
    setCategorySearchTerm(value)
    setFormData({ ...formData, categoryId: "" })
    setShowCategorySuggestions(true)
  }

  const handleAddBook = () => {
    if (!formData.title || !formData.author || !formData.isbn || !formData.categoryId) {
      toast.error("Por favor complete todos los campos obligatorios");
      setAddingBook(false); // Asegurarse de desbloquear el botón
      return;
    }

    // Comprobación de ISBN único
    const existingBook = books.find((book) => book.isbn === formData.isbn);
    if (existingBook) {
      toast.error("Ya existe un libro con ese ISBN");
      setAddingBook(false); // Asegurarse de desbloquear el botón
      return;
    }

    setAddingBook(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    apiFetch('/api/books', {
      method: 'POST',
      headers,
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then((newBook) => {
        loadBooks();
        if (reloadData) reloadData();
        resetForm();
        setIsAddDialogOpen(false);
        toast.success(`"${newBook.title}" ha sido agregado exitosamente`);
      })
      .finally(() => setAddingBook(false));
  }

  const handleEditBook = () => {
    setEditingBookLoading(true)
    if (!editingBook || !formData.title || !formData.author || !formData.isbn || !formData.categoryId) {
      toast.error("Por favor complete todos los campos obligatorios")
      return
    }
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    apiFetch(`/api/books?id=${editingBook.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then((updatedBook) => {
        if (updatedBook) {
          loadBooks()
          if (reloadData) reloadData()
          resetForm()
          setIsEditDialogOpen(false)
          setEditingBook(null)
          toast.success(`"${updatedBook.title}" ha sido actualizado exitosamente`)
        }
      })
      .finally(() => setEditingBookLoading(false))
  }

  const handleDeleteBook = (book: Book) => {
    setDeletingBookId(book.id)
    if (book.totalCopies - (book.availableCopies ?? 0) > 0) {
      toast.error("Este libro tiene préstamos activos y no puede ser eliminado")
      return
    }
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    apiFetch(`/api/books?id=${book.id}`, {
      method: 'DELETE',
      headers
    })
      .then(async res => {
        const result = await res.json().catch(() => null);
        if (res.ok && (result && (result.success === true || result.deleted === true))) {
          loadBooks();
          if (reloadData) reloadData();
          toast.success(`"${book.title}" ha sido eliminado exitosamente`);
        } else {
          toast.error(result?.error || "No se pudo eliminar el libro");
        }
      })
      .finally(() => setDeletingBookId(null))
  }

  const openEditDialog = (book: Book) => {
    setEditingBook(book)
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      categoryId: book.categoryId,
      publicationYear: book.publicationYear,
      totalCopies: book.totalCopies,
    })
    const categoryName = book.category?.name || getCategoryName(book.categoryId)
    setCategorySearchTerm(categoryName)
    setShowCategorySuggestions(false)
    setIsEditDialogOpen(true)
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || categoryId
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Gestión de Libros</h2>
        <p className="text-slate-600">Administre el catálogo de libros de la biblioteca</p>
      </div>

      {/* Search and Filter Bar */}
      <Card className="bg-white border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar por título, autor o ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Libro
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Libro</DialogTitle>
                    <DialogDescription>Complete la información del libro para agregarlo al catálogo</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Título del libro"
                      />
                    </div>
                    <div>
                      <Label htmlFor="author">Autor *</Label>
                      <Input
                        id="author"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        placeholder="Nombre del autor"
                      />
                    </div>
                    <div>
                      <Label htmlFor="isbn">ISBN *</Label>
                      <Input
                        id="isbn"
                        value={formData.isbn}
                        onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                        placeholder="978-84-376-0494-7"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Categoría *</Label>
                      <div className="relative" data-category-search>
                        <Input
                          id="category"
                          value={categorySearchTerm}
                          onChange={(e) => handleCategoryInputChange(e.target.value)}
                          onFocus={() => setShowCategorySuggestions(true)}
                          placeholder="Buscar o crear categoría..."
                          autoComplete="off"
                        />
                        {showCategorySuggestions && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            {getFilteredCategories().length > 0 ? (
                              <>
                                {getFilteredCategories().map((category) => (
                                  <button
                                    key={category.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-slate-100 cursor-pointer flex items-center gap-2"
                                    onClick={() => handleCategorySelect(category)}
                                  >
                                    <BookOpen className="w-4 h-4 text-slate-400" />
                                    {category.name}
                                  </button>
                                ))}
                              </>
                            ) : null}
                            {categorySearchTerm.trim() && !categories.find(c => c.name.toLowerCase() === categorySearchTerm.toLowerCase()) && (
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-blue-600 font-medium border-t border-slate-200"
                                onClick={handleCreateCategory}
                                disabled={creatingCategory}
                              >
                                {creatingCategory ? (
                                  <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Creando...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4" />
                                    Crear "{categorySearchTerm}"
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="year">Año de Publicación</Label>
                        <Input
                          id="year"
                          type="number"
                          value={formData.publicationYear}
                          onChange={(e) =>
                            setFormData({ ...formData, publicationYear: Number.parseInt(e.target.value) })
                          }
                          min="1000"
                          max={new Date().getFullYear()}
                        />
                      </div>
                      <div>
                        <Label htmlFor="copies">Número de Copias</Label>
                        <Input
                          id="copies"
                          type="number"
                          value={formData.totalCopies}
                          onChange={(e) => setFormData({ ...formData, totalCopies: Number.parseInt(e.target.value) })}
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddBook} disabled={addingBook}>
                      {addingBook ? (
                        <svg className="animate-spin h-5 w-5 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <>Agregar Libro</>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Books Table */}
      <Card className="bg-white border-slate-200 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Catálogo de Libros ({filteredBooks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden px-0">
          <div className="overflow-x-auto px-6">
            <table className="w-full caption-bottom text-sm min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Título</TableHead>
                  <TableHead className="whitespace-nowrap">Autor</TableHead>
                  <TableHead className="whitespace-nowrap">ISBN</TableHead>
                  <TableHead className="whitespace-nowrap">Categoría</TableHead>
                  <TableHead className="whitespace-nowrap">Año</TableHead>
                  <TableHead className="whitespace-nowrap">Disponibilidad</TableHead>
                  <TableHead className="whitespace-nowrap">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell className="font-mono text-sm">{book.isbn}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{book.category?.name || getCategoryName(book.categoryId)}</Badge>
                    </TableCell>
                    <TableCell>{book.publicationYear}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {book.availableCopies}/{book.totalCopies}
                        </span>
                        <Badge variant={(book.availableCopies ?? 0) > 0 ? "default" : "destructive"} className="text-xs">
                          {(book.availableCopies ?? 0) > 0 ? "Disponible" : "Agotado"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(book)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBook(book)}
                          disabled={book.totalCopies - (book.availableCopies ?? 0) > 0 || deletingBookId === book.id}
                        >
                          {deletingBookId === book.id ? (
                            <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                ))}
              </TableBody>
            </table>
          </div>

          {filteredBooks.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No se encontraron libros</h3>
              <p className="text-slate-600">
                {searchTerm || categoryFilter !== "all"
                  ? "Intente ajustar los filtros de búsqueda"
                  : "Comience agregando libros al catálogo"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Libro</DialogTitle>
            <DialogDescription>Modifique la información del libro</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Título *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título del libro"
              />
            </div>
            <div>
              <Label htmlFor="edit-author">Autor *</Label>
              <Input
                id="edit-author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Nombre del autor"
              />
            </div>
            <div>
              <Label htmlFor="edit-isbn">ISBN *</Label>
              <Input
                id="edit-isbn"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                placeholder="978-84-376-0494-7"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Categoría *</Label>
              <div className="relative" data-category-search>
                <Input
                  id="edit-category"
                  value={categorySearchTerm}
                  onChange={(e) => handleCategoryInputChange(e.target.value)}
                  onFocus={() => setShowCategorySuggestions(true)}
                  placeholder="Buscar o crear categoría..."
                  autoComplete="off"
                />
                {showCategorySuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {getFilteredCategories().length > 0 ? (
                      <>
                        {getFilteredCategories().map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 cursor-pointer flex items-center gap-2"
                            onClick={() => handleCategorySelect(category)}
                          >
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            {category.name}
                          </button>
                        ))}
                      </>
                    ) : null}
                    {categorySearchTerm.trim() && !categories.find(c => c.name.toLowerCase() === categorySearchTerm.toLowerCase()) && (
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-blue-600 font-medium border-t border-slate-200"
                        onClick={handleCreateCategory}
                        disabled={creatingCategory}
                      >
                        {creatingCategory ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Creando...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Crear "{categorySearchTerm}"
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-year">Año de Publicación</Label>
                <Input
                  id="edit-year"
                  type="number"
                  value={formData.publicationYear}
                  onChange={(e) => setFormData({ ...formData, publicationYear: Number.parseInt(e.target.value) })}
                  min="1000"
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <Label htmlFor="edit-copies">Número de Copias</Label>
                <Input
                  id="edit-copies"
                  type="number"
                  value={formData.totalCopies}
                  onChange={(e) => setFormData({ ...formData, totalCopies: Number.parseInt(e.target.value) })}
                  min="1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditBook} disabled={editingBookLoading}>
              {editingBookLoading ? (
                <svg className="animate-spin h-5 w-5 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <>Guardar Cambios</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
