"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

import { Navbar } from "@/components/navbar";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useAuth, type AuthUser } from "@/hooks/use-auth";

export default function AdminPenggunaPage() {
  // Dipakai untuk mengunci tombol pada baris diri sendiri: admin yang
  // menurunkan perannya sendiri akan terkunci di luar halaman ini, dan tidak
  // ada yang tersisa untuk mengembalikannya.
  const { user: saya } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [nimDraft, setNimDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  async function load() {
    try {
      setLoading(true);
      const rows = await api<AuthUser[]>("/admin/users");
      setUsers(rows);
      setNimDraft(Object.fromEntries(rows.map((u) => [u.id, u.student?.nim ?? ""])));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat pengguna");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void load());
  }, []);

  async function patchUser(user: AuthUser, patch: Record<string, unknown>) {
    try {
      await api<AuthUser>(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      toast.success("Data pengguna diperbarui.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui pengguna");
    }
  }
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <PageHeader
          title="Pengguna"
          description="Pantau akun Google yang pernah login, role, status akun, dan hubungkan mahasiswa ke NIM roster."
          actions={
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className="size-4" />
              Muat Ulang
            </Button>
          }
        />

        <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{users.length} akun</Badge>
          <Badge variant="outline">{users.filter((u) => u.role === "admin").length} admin</Badge>
          <Badge variant="outline">{users.filter((u) => u.student).length} terhubung NIM</Badge>
          <Badge variant="outline">{users.filter((u) => u.active).length} aktif</Badge>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pengguna Google</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>NIM / Mahasiswa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="min-w-64">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "outline"}>
                          {user.role === "admin" ? <ShieldCheck className="size-3" /> : null}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <p>{user.loginCount}× login</p>
                        <p>{user.lastLogin ? new Date(user.lastLogin).toLocaleString("id-ID") : "Belum ada"}</p>
                      </TableCell>
                      <TableCell className="min-w-72">
                        <div className="flex gap-2">
                          <Input
                            value={nimDraft[user.id] ?? ""}
                            onChange={(event) => setNimDraft((old) => ({ ...old, [user.id]: event.target.value }))}
                            placeholder="NIM mahasiswa"
                          />
                          <Button size="sm" variant="outline" onClick={() => void patchUser(user, { nim: nimDraft[user.id] ?? "" })}>
                            Simpan
                          </Button>
                        </div>
                        {user.student && <p className="mt-1 text-xs text-muted-foreground">{user.student.nama}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.active ? "outline" : "destructive"}>
                          {user.active ? <UserCheck className="size-3" /> : <UserX className="size-3" />}
                          {user.active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void patchUser(user, { role: user.role === "admin" ? "user" : "admin" })}
                            disabled={user.email.toLowerCase() === saya?.email.toLowerCase()}
                          >
                            {user.role === "admin" ? "Jadikan User" : "Jadikan Admin"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void patchUser(user, { active: !user.active })}
                            disabled={user.email.toLowerCase() === saya?.email.toLowerCase()}
                          >
                            {user.active ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {!loading && users.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Belum ada akun Google yang login.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
