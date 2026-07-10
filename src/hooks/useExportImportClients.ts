import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useClientsStorage } from './useClientsStorage';
import { checkClientsDuplicates } from './useImportDuplicateChecker';
import type { ClientData } from './useClientsStorage';
import type { ClientConflict } from './useImportDuplicateChecker';

// ==============================
// حالة الـ dialog
// ==============================
export interface ImportDialogState {
  open: boolean;
  allDuplicates: boolean;
  duplicateCount: number;
  conflicts: ClientConflict[];
  newClients: ClientData[];
}

const INITIAL_DIALOG_STATE: ImportDialogState = {
  open: false,
  allDuplicates: false,
  duplicateCount: 0,
  conflicts: [],
  newClients: [],
};

export function useExportImportClients() {
  const { clients, addClient, updateClient } = useClientsStorage();
  const [dialogState, setDialogState] = useState<ImportDialogState>(INITIAL_DIALOG_STATE);

  // ==============================
  // تصدير
  // ==============================
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

  // ==============================
  // استيراد — المرحلة 1: تحليل الملف
  // ==============================
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

        const importedClients: ClientData[] = importedData.data;

        // فحص التكرار
        const checkResult = checkClientsDuplicates(importedClients, clients);

        const hasConflicts = checkResult.conflicts.length > 0;
        const hasNew = checkResult.fullyNew.length > 0;
        const hasDuplicates = checkResult.fullyDuplicate.length > 0;

        // الحالة 1: كل البيانات مكررة تماماً
        if (!hasNew && !hasConflicts && hasDuplicates) {
          setDialogState({
            open: true,
            allDuplicates: true,
            duplicateCount: checkResult.fullyDuplicate.length,
            conflicts: [],
            newClients: [],
          });
          return;
        }

        // الحالة 2: كلها جديدة — أضف مباشرة بدون dialog
        if (hasNew && !hasConflicts && !hasDuplicates) {
          await doImportNewClients(checkResult.fullyNew);
          return;
        }

        // الحالة 3: يوجد تعارضات (مع أو بدون جديد)
        if (hasConflicts) {
          setDialogState({
            open: true,
            allDuplicates: false,
            duplicateCount: checkResult.fullyDuplicate.length,
            conflicts: checkResult.conflicts,
            newClients: checkResult.fullyNew,
          });
          return;
        }

        // الحالة 4: جديد + مكرر بالكامل (لا تعارض)
        if (hasNew && hasDuplicates) {
          await doImportNewClients(checkResult.fullyNew);
          if (hasDuplicates) {
            toast.info(`تم تخطي ${checkResult.fullyDuplicate.length} عميل مكرر`);
          }
        }
      } catch (error) {
        console.error('Import failed:', error);
        toast.error(
          error instanceof Error ? error.message : 'فشل استيراد البيانات - تأكد من صيغة الملف'
        );
      }
    },
    [clients, addClient]
  );

  // ==============================
  // استيراد — المرحلة 2: بعد قرار المستخدم
  // ==============================
  const handleDialogConfirm = useCallback(
    async (resolvedConflicts: ClientData[]) => {
      try {
        setDialogState(INITIAL_DIALOG_STATE);

        const { newClients } = dialogState;
        let successCount = 0;
        let failureCount = 0;

        // إضافة العملاء الجدد
        for (const client of newClients) {
          try {
            await addClient({
              client_information: client.client_information,
              business_details: client.business_details,
              clientImages: client.clientImages || [],
            });
            successCount++;
          } catch {
            failureCount++;
          }
        }

        // تحديث العملاء التي حلّها المستخدم (بيانات مدمجة)
        for (const resolved of resolvedConflicts) {
          try {
            await updateClient(resolved.id, {
              client_information: resolved.client_information,
              business_details: resolved.business_details,
              clientImages: resolved.clientImages || [],
            });
            successCount++;
          } catch {
            failureCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`تم استيراد / تحديث ${successCount} عميل بنجاح`);
        }
        if (failureCount > 0) {
          toast.error(`فشل معالجة ${failureCount} عميل`);
        }
      } catch (error) {
        console.error('Confirm import failed:', error);
        toast.error('حدث خطأ أثناء تطبيق التغييرات');
      }
    },
    [dialogState, addClient, updateClient]
  );

  const handleDialogCancel = useCallback(() => {
    setDialogState(INITIAL_DIALOG_STATE);
  }, []);

  // ==============================
  // دالة مساعدة: إضافة عملاء جدد
  // ==============================
  const doImportNewClients = async (newClients: ClientData[]) => {
    let successCount = 0;
    let failureCount = 0;

    for (const client of newClients) {
      try {
        await addClient({
          client_information: client.client_information,
          business_details: client.business_details,
          clientImages: client.clientImages || [],
        });
        successCount++;
      } catch {
        failureCount++;
      }
    }

    if (successCount > 0) toast.success(`تم استيراد ${successCount} عميل بنجاح`);
    if (failureCount > 0) toast.error(`فشل استيراد ${failureCount} عميل`);
  };

  return {
    exportClients,
    importClients,
    dialogState,
    handleDialogConfirm,
    handleDialogCancel,
  };
}
