import { useCallback } from 'react';
import { toast } from 'sonner';
// import type { Installment } from './useInstallmentsStorage';
import { useInstallmentsStorage } from './useInstallmentsStorage';

export function useExportImportInstallments() {
  const { installments, addInstallment } = useInstallmentsStorage();

  const exportInstallments = useCallback(async () => {
    try {
      if (installments.length === 0) {
        toast.error('لا توجد بيانات للتصدير');
        return;
      }

      const dataToExport = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        dataType: 'installments',
        data: installments,
      };

      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `installments-backup-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`تم تصدير ${installments.length} قسط بنجاح`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('فشل تصدير البيانات');
    }
  }, [installments]);

  const importInstallments = useCallback(
    async (file: File) => {
      try {
        const fileText = await file.text();
        const importedData = JSON.parse(fileText);

        if (!importedData.data || !Array.isArray(importedData.data)) {
          throw new Error('صيغة الملف غير صحيحة');
        }

        if (importedData.dataType !== 'installments') {
          throw new Error('هذا الملف يحتوي على بيانات عملاء وليس أقساط');
        }

        let successCount = 0;
        let failureCount = 0;

        for (const installmentData of importedData.data) {
          try {
            await addInstallment({
              clientName: installmentData.clientName,
              clientPhone: installmentData.clientPhone,
              clientImages: installmentData.clientImages || [],
              installmentAmount: installmentData.installmentAmount,
              dueDate: installmentData.dueDate,
              status: installmentData.status,
              firstGuarantorName: installmentData.firstGuarantorName,
              firstGuarantorPhone: installmentData.firstGuarantorPhone,
              secondGuarantorName: installmentData.secondGuarantorName,
              secondGuarantorPhone: installmentData.secondGuarantorPhone,
              notes: installmentData.notes || [],
            });
            successCount++;
          } catch (error) {
            console.error('Failed to import installment:', error);
            failureCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`تم استيراد ${successCount} قسط بنجاح`);
        }
        if (failureCount > 0) {
          toast.error(`فشل استيراد ${failureCount} قسط`);
        }
      } catch (error) {
        console.error('Import failed:', error);
        toast.error(error instanceof Error ? error.message : 'فشل استيراد البيانات - تأكد من صيغة الملف');
      }
    },
    [addInstallment]
  );

  return { exportInstallments, importInstallments };
}
