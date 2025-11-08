"use client"

import { useState, useEffect } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Search, Plus, Edit, Trash2, Users, Filter, Mail, Phone, MapPin, Calendar } from "lucide-react"
import { apiFetch } from '@/lib/api-client';
import type { User } from "@/lib/types"
import { getUserIdsWithActiveLoans } from "@/lib/loan-helpers"
import { useToast } from "@/hooks/use-toast"
import { toast } from "sonner"


interface UserFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  role: "admin" | "cliente";
  /** Only for admin password change */
  password?: string;
}

interface UserManagementProps {
  reloadData?: () => void
}

export function UserManagement({ reloadData }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [userIdsWithLoans, setUserIdsWithLoans] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    isActive: true,
    role: "cliente",
  })
  const [addingUser, setAddingUser] = useState(false)
  const [editingUserLoading, setEditingUserLoading] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [editPassword, setEditPassword] = useState("")
  const [addPassword, setAddPassword] = useState("")

  useEffect(() => {
    loadUsers()
    loadUserIdsWithLoans()
  }, [])

  const loadUserIdsWithLoans = async () => {
    try {
      const ids = await getUserIdsWithActiveLoans();
      setUserIdsWithLoans(ids);
    } catch {}
  }

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, statusFilter])

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await apiFetch("/api/users", { headers })
      if (!res.ok) throw new Error("Error al cargar usuarios")
      const allUsers = await res.json()
      setUsers(allUsers)
    } catch (err) {
      toast.error("No se pudieron cargar los usuarios")
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.includes(searchTerm),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => (statusFilter === "active" ? user.isActive : !user.isActive))
    }

    setFilteredUsers(filtered)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      isActive: true,
      role: "cliente",
      password: undefined,
    })
    setEditPassword("")
    setAddPassword("")
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleAddUser = async () => {
    setAddingUser(true)
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      toast.error("Por favor complete todos los campos obligatorios")
      setAddingUser(false)
      return
    }
    if (!validateEmail(formData.email)) {
      toast.error("Por favor ingrese un email válido")
      setAddingUser(false)
      return
    }
    // Check if email already exists
    const existingUser = users.find((user) => user.email === formData.email)
    if (existingUser) {
      toast.error("Ya existe un usuario con este email")
      setAddingUser(false)
      return
    }
    // Si es admin, la contraseña es obligatoria
    if (formData.role === "admin" && addPassword.trim().length === 0) {
      toast.error("La contraseña es obligatoria para administradores")
      setAddingUser(false)
      return
    }
    // Los admin siempre activos
    let dataToSend: any = { ...formData, isActive: formData.role === "admin" ? true : formData.isActive };
    if (formData.role === "admin") {
      dataToSend.password = addPassword.trim();
    } else {
      delete dataToSend.password;
    }
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await apiFetch("/api/users", {
        method: "POST",
        headers,
        body: JSON.stringify(dataToSend),
      })
      if (!res.ok) throw new Error("Error al registrar usuario")
      const newUser = await res.json()
      toast.success(`${newUser.name} ha sido registrado exitosamente`)
      await loadUsers()
      if (reloadData) reloadData()
      resetForm()
      setIsAddDialogOpen(false)
    } catch (err) {
      toast.error("No se pudo registrar el usuario")
    } finally {
      setAddingUser(false)
    }
  }

  const handleEditUser = async () => {
    setEditingUserLoading(true)
    if (!editingUser || !formData.name || !formData.email || !formData.phone || !formData.address) {
      toast.error("Por favor complete todos los campos obligatorios")
      return
    }
    if (!validateEmail(formData.email)) {
      toast.error("Por favor ingrese un email válido")
      return
    }
    // Check if email already exists (excluding current user)
    const existingUser = users.find((user) => user.email === formData.email && user.id !== editingUser.id)
    if (existingUser) {
      toast.error("Ya existe otro usuario con este email")
      return
    }
    // Los admin siempre activos
    let dataToSend: any = { ...formData, isActive: formData.role === "admin" ? true : formData.isActive };
    // Only send password if filled and user is admin
    if (formData.role === "admin" && editPassword.trim().length > 0) {
      dataToSend.password = editPassword.trim();
    } else {
      delete dataToSend.password;
    }
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await apiFetch(`/api/users?id=${editingUser.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(dataToSend),
      })
      if (!res.ok) throw new Error("Error al actualizar usuario")
      const updatedUser = await res.json()
      toast.success(`${updatedUser.name} ha sido actualizado exitosamente`)
      await loadUsers()
      // Recargar préstamos para mantener el estado actualizado
      if (typeof window !== 'undefined') {
        try {
          await apiFetch("/api/loans");
        } catch {}
      }
      if (reloadData) reloadData()
      resetForm()
      setIsEditDialogOpen(false)
      setEditingUser(null)
    } catch (err) {
      toast.error("No se pudo actualizar el usuario")
    } finally {
      setEditingUserLoading(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    setDeletingUserId(user.id)
    // Check if user has active loans
    try {
      const loansRes = await apiFetch("/api/loans")
      if (!loansRes.ok) throw new Error("Error al obtener préstamos")
      const loans = await loansRes.json()
      const hasActiveLoans = loans.some((loan: any) => loan.userId === user.id && loan.status === "active")
      if (hasActiveLoans) {
        toast.error("Este usuario tiene préstamos activos y no puede ser eliminado")
        setDeletingUserId(null)
        return
      }
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await apiFetch(`/api/users?id=${user.id}`, { method: "DELETE", headers })
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        toast.error(errorData?.error || "No se pudo eliminar el usuario");
        setDeletingUserId(null)
        return;
      }
      toast.success(`"${user.name}" ha sido eliminado exitosamente`)
      await loadUsers()
      if (reloadData) reloadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el usuario")
    } finally {
      setDeletingUserId(null)
    }
  }

  const toggleUserStatus = async (user: User) => {
    try {
      const res = await apiFetch(`/api/users?id=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      if (!res.ok) throw new Error("Error al actualizar estado")
      const updatedUser = await res.json()
      toast.success(`${user.name} ha sido ${updatedUser.isActive ? "activado" : "desactivado"}`)
      await loadUsers()
      if (reloadData) reloadData()
    } catch (err) {
      toast.error("No se pudo actualizar el estado")
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      isActive: user.isActive,
      role: user.role,
      password: undefined,
    })
    setEditPassword("")
    setIsEditDialogOpen(true)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Gestión de Usuarios</h2>
        <p className="text-slate-600">Administre los usuarios registrados en la biblioteca</p>
      </div>

      {/* Search and Filter Bar */}
      <Card className="bg-white border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-col sm:flex-row">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  <SelectItem value="active">Usuarios activos</SelectItem>
                  <SelectItem value="inactive">Usuarios inactivos</SelectItem>
                </SelectContent>
              </Select>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Registrar Nuevo Usuario</DialogTitle>
                    <DialogDescription>
                      Complete la información del usuario para registrarlo en el sistema
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nombre Completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nombre completo del usuario"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="usuario@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="555-0123"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Dirección *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Dirección completa"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Rol *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value as "admin" | "cliente" })}
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cliente">Cliente</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.role === "admin" ? (
                      <>
                        <div className="text-green-700 text-sm font-semibold">Los administradores siempre están activos</div>
                        <div>
                          <Label htmlFor="add-password">Contraseña *</Label>
                          <Input
                            id="add-password"
                            type="password"
                            value={addPassword}
                            onChange={(e) => setAddPassword(e.target.value)}
                            placeholder="Ingrese una contraseña para el admin"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="active"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <Label htmlFor="active">Usuario activo</Label>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddUser} disabled={addingUser}>
                      {addingUser ? (
                        <svg className="animate-spin h-5 w-5 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <>Registrar Usuario</>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total de Usuarios</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{users.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{users.filter((u) => u.isActive).length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Nuevos Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {
                users.filter((u) => {
                  const membershipDate = new Date(u.membershipDate)
                  const now = new Date()
                  return (
                    membershipDate.getMonth() === now.getMonth() && membershipDate.getFullYear() === now.getFullYear()
                  )
                }).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuarios Registrados ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No se encontraron usuarios</h3>
              <p className="text-slate-600">
                {searchTerm || statusFilter !== "all"
                  ? "Intente ajustar los filtros de búsqueda"
                  : "Comience registrando usuarios en el sistema"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900">{user.name}</div>
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {user.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="max-w-xs truncate">{user.address}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(user.membershipDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.role === "admin" ? (
                            <span className="text-green-700 font-semibold text-xs">Admin</span>
                          ) : (
                            <>
                              <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                                {user.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                              <Switch checked={user.isActive} onCheckedChange={() => toggleUserStatus(user)}/>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {/* Solo mostrar el botón de borrar si no es admin y no tiene préstamos activos */}
                          {user.role !== "admin" && !userIdsWithLoans.includes(user.id) && (
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user)} disabled={deletingUserId === user.id}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifique la información del usuario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre Completo *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre completo del usuario"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@email.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Teléfono *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="555-0123"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Dirección *</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Rol</Label>
              <Input id="edit-role" value={formData.role === "admin" ? "Admin" : "Cliente"} disabled className={formData.role === "admin" ? "bg-green-100 text-green-800 border-green-200" : ""} />
            </div>
            {formData.role === "admin" ? (
              <>
                <div className="text-green-700 text-sm font-semibold">Los administradores siempre están activos</div>
                <div>
                  <Label htmlFor="edit-password">Nueva contraseña (opcional)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Dejar en blanco para no cambiar"
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="edit-active">Usuario activo</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser} disabled={editingUserLoading}>
              {editingUserLoading ? (
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
