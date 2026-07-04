import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.tsx';
import { Button } from './ui/button';

interface ImportDuplicate {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface ImportDuplicatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: ImportDuplicate[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const ImportDuplicatesDialog: React.FC<ImportDuplicatesDialogProps> = ({
  open,
  onOpenChange,
  duplicates,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>تنبيه: تكرار في البيانات</DialogTitle>
          <DialogDescription>
            تم العثور على {duplicates.length} عميل متكرر. هل تريد الاستمرار في الاستيراد؟
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-right py-2 px-3">الاسم</th>
                <th className="text-right py-2 px-3">الرقم التعريفي</th>
              </tr>
            </thead>
            <tbody>
              {duplicates.map((duplicate, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-2 px-3">{duplicate.name}</td>
                  <td className="py-2 px-3">{duplicate.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button onClick={onConfirm}>
            متابعة الاستيراد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
