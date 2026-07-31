import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

interface InstallmentNotesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installmentId: string | null;
  clientName: string;
  notes: Note[];
  onAddNote: (note: string) => Promise<void>;
  onUpdateNote: (noteId: string, note: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
}

export function InstallmentNotesSheet({
  open,
  onOpenChange,
  installmentId,
  clientName,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: InstallmentNotesSheetProps) {
  const [newNote, setNewNote] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('يرجى كتابة الملاحظة');
      return;
    }

    if (!installmentId) {
      toast.error('معرف القسط غير صحيح');
      return;
    }

    setIsLoading(true);
    try {
      await onAddNote(newNote);
      setNewNote('');
      setShowNoteForm(false);
      toast.success('تمت إضافة الملاحظة بنجاح');
    } catch (error) {
      toast.error('فشل في إضافة الملاحظة');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    setEditingNoteId(noteId);
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setEditingNoteText(note.note);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingNoteText.trim()) {
      toast.error('يرجى كتابة الملاحظة');
      return;
    }

    if (!installmentId || !editingNoteId) {
      toast.error('معرف القسط أو الملاحظة غير صحيح');
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateNote(editingNoteId, editingNoteText);
      setEditingNoteId(null);
      setEditingNoteText('');
      toast.success('تم تحديث الملاحظة بنجاح');
    } catch (error) {
      toast.error('فشل في تحديث الملاحظة');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!installmentId) {
      toast.error('معرف القسط غير صحيح');
      return;
    }

    setIsLoading(true);
    try {
      await onDeleteNote(noteId);
      toast.success('تم حذف الملاحظة بنجاح');
    } catch (error) {
      toast.error('فشل في حذف الملاحظة');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[500px] overflow-y-auto" dir="rtl">
        <SheetHeader className="text-right">
          <SheetTitle className="text-right text-xl mt-10">
            ملاحظات - {clientName}
          </SheetTitle>
        </SheetHeader>

        {/* Notes List */}
        <div className="space-y-3 mt-6 mb-6">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد ملاحظات حالياً
            </div>
          ) : (
            notes.map((note) => (
              editingNoteId === note.id ? (
                // نموذج التعديل
                <div
                  key={note.id}
                  className="border border-blue-300 dark:border-blue-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 space-y-3"
                >
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    تعديل الملاحظة
                  </p>
                  <textarea
                    value={editingNoteText}
                    onChange={(e) => setEditingNoteText(e.target.value)}
                    disabled={isLoading}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-24 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveEdit}
                      className="flex-1"
                      disabled={isLoading}
                      size="sm"
                    >
                      {isLoading ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex-1"
                      disabled={isLoading}
                      size="sm"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                // عرض الملاحظة العادي
                <div
                  key={note.id}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800"
                >
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(note.createdAt).toLocaleDateString('ar-EG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(note.createdAt).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNote(note.id)}
                        disabled={isLoading}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={isLoading}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="break-words text-gray-900 dark:text-gray-100">{note.note}</p>
                </div>
              )
            ))
          )}
        </div>

        {/* Add Note Form */}
        {!showNoteForm ? (
          <Button
            onClick={() => setShowNoteForm(true)}
            className="w-full gap-2"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4" />
            إضافة ملاحظة جديدة
          </Button>
        ) : (
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 space-y-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="اكتب الملاحظة هنا..."
              disabled={isLoading}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-24 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddNote}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNoteForm(false);
                  setNewNote('');
                }}
                className="flex-1"
                disabled={isLoading}
              >
                إلغاء
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
