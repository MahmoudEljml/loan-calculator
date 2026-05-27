import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClientsStorage } from '../hooks/useClientsStorage';
import { Plus, Trash2, Edit2, Search, Eye } from 'lucide-react';

export function ClientsPage() {
  const navigate = useNavigate();
  const { clients, isLoaded, deleteClient } = useClientsStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const term = searchTerm.toLowerCase();
    return clients.filter(client =>
      client.client_information.full_name.val.toLowerCase().includes(term) ||
      client.client_information.phone_number.val.toLowerCase().includes(term) ||
      client.business_details.business_type.val.toLowerCase().includes(term)
    );
  }, [clients, searchTerm]);

  const handleDelete = (id: string) => {
    deleteClient(id);
    setDeleteConfirm(null);
  };

  if (!isLoaded) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4 text-start" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">إدارة العملاء</h1>
        <Button onClick={() => navigate('/add-client')} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          عميل جديد
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="ابحث باسم العميل أو رقم الهاتف أو نوع النشاط..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-4 pr-10"
        />
      </div>

      {/* Table - Desktop View */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-right font-semibold">اسم العميل</th>
              <th className="px-4 py-3 text-right font-semibold">رقم الهاتف</th>
              <th className="px-4 py-3 text-right font-semibold">نوع النشاط</th>
              <th className="px-4 py-3 text-right font-semibold">العنوان</th>
              <th className="px-4 py-3 text-center font-semibold">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id} className="border-t hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  {client.client_information.full_name.val || '-'}
                </td>
                <td className="px-4 py-3">
                  {client.client_information.phone_number.val || '-'}
                </td>
                <td className="px-4 py-3">
                  {client.business_details.business_type.val || '-'}
                </td>
                <td className="px-4 py-3">
                  {client.business_details.address.val || '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/view-client?id=${client.id}`)}
                      className="gap-1"
                      title="عرض"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">عرض</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/add-client?id=${client.id}`)}
                      className="gap-1"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="hidden sm:inline">تعديل</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(client.id)}
                      className="gap-1 text-destructive hover:text-destructive"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">حذف</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card View - Mobile */}
      <div className="sm:hidden space-y-3">
        {filteredClients.map((client) => (
          <div key={client.id} className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">
                    {client.client_information.full_name.val || 'غير محدد'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {client.client_information.phone_number.val}
                  </p>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">النشاط:</span> {client.business_details.business_type.val || '-'}
                </p>
                <p>
                  <span className="font-medium">العنوان:</span> {client.business_details.address.val || '-'}
                </p>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/view-client?id=${client.id}`)}
                  className="flex-1 gap-1"
                >
                  <Eye className="w-4 h-4" />
                  عرض
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/add-client?id=${client.id}`)}
                  className="flex-1 gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(client.id)}
                  className="flex-1 gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد عملاء حالياً'}
          </p>
          {!searchTerm && (
            <Button onClick={() => navigate('/add-client')}>
              <Plus className="w-4 h-4 mr-2" />
              إضافة عميل جديد
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-sm w-full text-center" dir="rtl">
            <h3 className="text-lg font-semibold mb-4">تأكيد الحذف</h3>
            <p className="text-muted-foreground mb-6">
              هل أنت متأكد من رغبتك في حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-20 justify-center ">
              <Button
                className='right-0 '
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                إلغاء
              </Button>
              <Button
                className='left-0 '
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm)}
              >
                حذف
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
