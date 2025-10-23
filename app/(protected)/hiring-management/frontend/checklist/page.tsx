"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, X, Pencil, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/app/frontend/components/ui/input";
import { Button } from "@/app/frontend/components/ui/button";
import { Label } from "@/app/frontend/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/frontend/components/ui/card";

// Types
interface Checklist {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const API_BASE = "/recruitment/backend/api/checklist";

async function fetchChecklists(): Promise<Checklist[]> {
  const res = await fetch(API_BASE, { cache: "no-store" });
  if (!res.ok) throw new Error("Không tải được danh sách checklist");
  const json: ApiResponse<Checklist[]> = await res.json();
  if (!json.success) throw new Error(json.message || json.error || "Lỗi không xác định");
  return json.data || [];
}

async function createChecklist(payload: Pick<Checklist, "name" | "description">) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.message || j.error || "Tạo checklist thất bại");
  }
  const json: ApiResponse<Checklist> = await res.json();
  return json.data as Checklist;
}

async function updateChecklist(payload: Partial<Checklist> & { id: string }) {
  const res = await fetch(API_BASE, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.message || j.error || "Cập nhật checklist thất bại");
  }
  const json: ApiResponse<Checklist> = await res.json();
  return json.data as Checklist;
}

async function deleteChecklist(id: string) {
  const res = await fetch(API_BASE, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.message || j.error || "Xóa checklist thất bại");
  }
}

function Drawer({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="h-[calc(100%-57px)] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export default function ChecklistPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({ queryKey: ["checklists"], queryFn: fetchChecklists });
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Checklist | null>(null);

  const filtered = useMemo(() => {
    const list = data || [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((i) => i.name.toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q));
  }, [data, search]);

  const createMut = useMutation({
    mutationFn: createChecklist,
    onSuccess: () => {
      toast.success("Tạo checklist thành công");
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      closeDrawer();
    },
    onError: (e: any) => toast.error(e.message || "Tạo checklist thất bại"),
  });

  const updateMut = useMutation({
    mutationFn: updateChecklist,
    onSuccess: () => {
      toast.success("Cập nhật checklist thành công");
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      closeDrawer();
    },
    onError: (e: any) => toast.error(e.message || "Cập nhật checklist thất bại"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteChecklist(id),
    onSuccess: () => {
      toast.success("Đã xóa checklist");
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
    },
    onError: (e: any) => toast.error(e.message || "Xóa checklist thất bại"),
  });

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }
  function openEdit(item: Checklist) {
    setEditing(item);
    setDrawerOpen(true);
  }
  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold">Checklist</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Làm mới
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Thêm checklist
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Nhập tên hoặc mô tả để tìm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Danh sách</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-gray-500">Đang tải...</div>
          ) : isError ? (
            <div className="py-10 text-center text-red-600">Không thể tải dữ liệu</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Không có checklist nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 px-3">Tên</th>
                    <th className="py-2 px-3">Mô tả</th>
                    <th className="py-2 px-3 w-36">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{item.name}</td>
                      <td className="py-2 px-3 text-gray-600">{item.description || "—"}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                            <Pencil className="w-4 h-4 mr-1" /> Sửa
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("Bạn có chắc muốn xóa checklist này?")) {
                                deleteMut.mutate(item.id);
                              }
                            }}
                            disabled={deleteMut.isPending}
                          >
                            {deleteMut.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-1" />
                            )}
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawer for Create/Update */}
      <ChecklistDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        initial={editing}
        onSubmit={(values) => {
          if (editing) {
            updateMut.mutate({ id: editing.id, ...values });
          } else {
            createMut.mutate(values);
          }
        }}
        submitting={createMut.isPending || updateMut.isPending}
      />
    </div>
  );
}

function ChecklistDrawer({
  open,
  onClose,
  initial,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  initial: Checklist | null;
  onSubmit: (values: { name: string; description?: string | null }) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    setName(initial?.name || "");
    setDescription(initial?.description || "");
  }, [initial, open]);

  const title = initial ? "Chỉnh sửa checklist" : "Thêm checklist";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên checklist");
      return;
    }
    onSubmit({ name: name.trim(), description: description?.trim() || null });
  };

  return (
    <Drawer open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Tên *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên checklist"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Mô tả</Label>
          <textarea
            id="description"
            className="w-full border rounded-md p-2 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả (không bắt buộc)"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Lưu
          </Button>
        </div>
      </form>
    </Drawer>
  );
}