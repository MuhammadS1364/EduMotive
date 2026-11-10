import { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminList, adminSave, adminDelete, adminSaveSettings, AdminListInputType } from 'zitejs/api';

export type TableName = AdminListInputType['table'];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Rec = Record<string, any> & { id: string };

export const AdminCtx = createContext<{ logout: () => void }>({ logout: () => {} });
export const useAdmin = () => useContext(AdminCtx);

export function useTable(table: TableName) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['t', table],
    queryFn: async () => {
      return (await adminList({ table })).records as Rec[];
    },
  });
  const save = useMutation({
    mutationFn: (v: { id?: string; record: Record<string, unknown> }) => adminSave({ table, ...v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t', table] }),
    onError: () => toast.error('Save failed'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminDelete({ table, id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['t', table] }); toast.success('Deleted'); },
    onError: () => toast.error('Delete failed'),
  });
  return { rows: q.data ?? [], isLoading: q.isLoading, save, remove };
}

export function useSettings() {
  const qc = useQueryClient();
  const { rows, isLoading } = useTable('siteSettings');
  const map: Record<string, string> = {};
  rows.forEach((r) => { if (r.key) map[r.key] = r.value ?? ''; });
  const save = async (settings: Record<string, string>) => {
    await adminSaveSettings({ settings });
    await qc.invalidateQueries({ queryKey: ['t', 'siteSettings'] });
  };
  return { settings: map, isLoading, save };
}

export const arr = (v: unknown): string[] => [v].flat().filter((x): x is string => typeof x === 'string' && !!x);

export function fmtDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
