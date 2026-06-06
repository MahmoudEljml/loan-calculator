import { useCallback } from 'react';
import { toast } from 'sonner';
// import type { ClientData } from './useClientsStorage';
import { useClientsStorage } from './useClientsStorage';

export function useExportImportClients() {
  const { clients, addClient } = useClientsStorage();

  const exportClients = useCallback(async () => {
    try {
      if (clients.length === 0) {
        toast.error('لا توجد بيانات للتصدير');
        return;
      }

      const dataToExport = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        dataType: 'clients',
        data: clients,
      };

      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `clients-backup-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`تم تصدير ${clients.length} عميل بنجاح`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('فشل تصدير البيانات');
    }
  }, [clients]);

  const importClients = useCallback(
    async (file: File) => {
      try {
        const fileText = await file.text();
        const importedData = JSON.parse(fileText);

        if (!importedData.data || !Array.isArray(importedData.data)) {
          throw new Error('صيغة الملف غير صحيحة');
        }

        if (importedData.dataType !== 'clients') {
          throw new Error('هذا الملف يحتوي على بيانات أقساط وليس عملاء');
        }

        let successCount = 0;
        let failureCount = 0;

        for (const clientData of importedData.data) {
          try {
            await addClient({
              client_information: clientData.client_information,
              business_details: clientData.business_details,
              clientImages: clientData.clientImages || [],
            });
            successCount++;
          } catch (error) {
            console.error('Failed to import client:', error);
            failureCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`تم استيراد ${successCount} عميل بنجاح`);
        }
        if (failureCount > 0) {
          toast.error(`فشل استيراد ${failureCount} عميل`);
        }
      } catch (error) {
        console.error('Import failed:', error);
        toast.error(error instanceof Error ? error.message : 'فشل استيراد البيانات - تأكد من صيغة الملف');
      }
    },
    [addClient]
  );

  return { exportClients, importClients };
}
