"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Settings, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { InternalUser } from "@/types";
import { USER_ROLES, type UserRole } from "@/lib/roles";

function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const raw = error.message.trim();
  try {
    const parsed = JSON.parse(raw) as { error?: unknown };
    if (typeof parsed.error === "string" && parsed.error) return parsed.error;
  } catch {
    /* texto puro */
  }
  return raw || fallback;
}

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [users, setUsers] = useState<InternalUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("USER");
  const [creating, setCreating] = useState(false);

  const [resetTarget, setResetTarget] = useState<InternalUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<InternalUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(() => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    api.users
      .listar()
      .then(setUsers)
      .catch((error) => {
        toast.error(apiErrorMessage(error, "Não foi possível listar usuários."));
      })
      .finally(() => setLoadingUsers(false));
  }, [isAdmin]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleChangeMyPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }
    setSavingPassword(true);
    try {
      await api.auth.alterarMinhaSenha({ currentPassword, newPassword });
      toast.success("Senha alterada.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível alterar a senha."));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      await api.users.criar({
        username: newUsername.trim(),
        password: newUserPassword,
        role: newUserRole,
      });
      toast.success("Usuário criado.");
      setCreateOpen(false);
      setNewUsername("");
      setNewUserPassword("");
      setNewUserRole("USER");
      loadUsers();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível criar o usuário."));
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (target: InternalUser, role: string) => {
    try {
      await api.users.atualizarPapel(target.id, role);
      toast.success("Papel atualizado.");
      loadUsers();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível alterar o papel."));
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!resetTarget) return;
    setResetting(true);
    try {
      await api.users.redefinirSenha(resetTarget.id, resetPassword);
      toast.success("Senha redefinida.");
      setResetTarget(null);
      setResetPassword("");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível redefinir a senha."));
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.users.deletar(deleteTarget.id);
      toast.success("Usuário removido.");
      setDeleteTarget(null);
      loadUsers();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível remover o usuário."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          Configurações
        </h1>
        <p className="text-muted-foreground">Conta e usuários internos do painel.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Minha conta</CardTitle>
          <CardDescription>
            {user?.username} · {user?.role === "ADMIN" ? "Administrador" : "Usuário"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangeMyPassword} className="grid max-w-md gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha atual</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" disabled={savingPassword} className="w-fit">
              {savingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando…
                </>
              ) : (
                "Alterar senha"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Usuários internos
              </CardTitle>
              <CardDescription>
                Somente administradores gerenciam contas. Vendedores continuam usando o restante do painel.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo usuário
            </Button>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead className="w-40">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.username}</TableCell>
                      <TableCell>
                        <Select
                          value={row.role}
                          onValueChange={(role) => handleRoleChange(row, role)}
                          disabled={row.username === user?.username && row.role === "ADMIN"}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                            <SelectItem value="USER">USER</SelectItem>
                            <SelectItem value="FINANCE">FINANCE</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Redefinir senha"
                            onClick={() => {
                              setResetPassword("");
                              setResetTarget(row);
                            }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Remover"
                            disabled={row.username === user?.username}
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Usuários internos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Apenas administradores gerenciam contas. Você pode alterar a própria senha acima.
            </p>
          </CardHeader>
        </Card>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>A senha deve ter no mínimo 8 caracteres.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Usuário</Label>
              <Input
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-password">Senha</Label>
              <Input
                id="new-user-password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={creating}>
                {creating ? "Criando…" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={resetTarget != null} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>
              Nova senha para {resetTarget?.username}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              minLength={8}
              required
              placeholder="Mínimo 8 caracteres"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={resetting}>
                {resetting ? "Salvando…" : "Salvar senha"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {deleteTarget?.username}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Não é possível apagar o último administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Removendo…" : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
