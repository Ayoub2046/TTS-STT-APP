import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services";
import { Badge } from "@/components/ui";
import { Profile } from "@/types";

const roleTone: Record<string, "slate" | "green" | "amber" | "red" | "indigo" | "blue"> = {
  contributor: "slate",
  reviewer: "indigo",
  admin: "amber",
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => adminService.users() });

  const updateMutation = useMutation({
    mutationFn: (v: { id: string; data: { role?: string; isActive?: boolean } }) =>
      adminService.updateUser(v.id, v.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const setRole = (user: Profile, role: string) => updateMutation.mutate({ id: user.id, data: { role } });
  const toggleActive = (user: Profile) => updateMutation.mutate({ id: user.id, data: { isActive: !user.is_active } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-slate-400">Manage roles, activation, and account status.</p>
      </div>

      {isLoading ? (
        <div className="glass p-10 text-center text-sm text-slate-400">Loading...</div>
      ) : (
        <div className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Native</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data?.data.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-200">{u.full_name ?? "—"}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={roleTone[u.role] ?? "slate"}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{u.native_language ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.is_active ? "green" : "red"}>{u.is_active ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <select
                        className="input w-auto px-2 py-1 text-xs"
                        value={u.role}
                        onChange={(e) => setRole(u, e.target.value)}
                      >
                        <option value="contributor">contributor</option>
                        <option value="reviewer">reviewer</option>
                        <option value="admin">admin</option>
                      </select>
                      <button
                        className="btn-ghost px-2 py-1 text-xs"
                        onClick={() => toggleActive(u)}
                        title={u.is_active ? "Deactivate" : "Activate"}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}