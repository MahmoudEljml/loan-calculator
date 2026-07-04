// src/components/InstallmentRow.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, MessageSquare, MoreVertical, Eye, Edit2, Trash2 } from 'lucide-react';
import type { Installment } from '@/hooks/useInstallmentsStorage';

interface InstallmentRowProps {
    installment: Installment;
    isSelected: boolean;
    isMobile: boolean;
    onClientClick: (id: string) => void;
    onWhatsAppClick: (phone: string) => void;
    onActionClick: (action: 'view' | 'edit' | 'delete' | 'notes') => void;
    activeDropdown: string | null;
    setActiveDropdown: (id: string | null) => void;
    getStatusColor: (status: 'pending' | 'paid') => string;
    getStatusLabel: (status: 'pending' | 'paid') => string;
}

export const InstallmentRow: React.FC<InstallmentRowProps> = ({
    installment,
    isSelected,
    isMobile,
    onClientClick,
    onWhatsAppClick,
    onActionClick,
    activeDropdown,
    setActiveDropdown,
    getStatusColor,
    getStatusLabel,
}) => {
    const handleDropdownToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveDropdown(activeDropdown === installment.id ? null : installment.id);
    };

    const handleAction = (e: React.MouseEvent, action: 'view' | 'edit' | 'delete' | 'notes') => {
        e.stopPropagation();
        onActionClick(action);
    };

    if (isMobile) {
        // Mobile Card View
        return (
            <div
                className={`border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors cursor-pointer ${isSelected ? 'border-2 border-orange-500 dark:border-orange-400' : ''}`}
                onClick={() => onClientClick(installment.id)}
            >
                <div className="space-y-3">
                    <div className="flex gap-3 items-start justify-between">
                        <div className="flex-1">
                            <p className="font-semibold">{installment.clientName || 'غير محدد'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(installment.status)}`}>
                            {getStatusLabel(installment.status)}
                        </span>
                    </div>
                    <div className="text-sm space-y-1 border-t pt-2">
                        <p>
                            <span className="font-medium">رقم الهاتف:</span> {installment.clientPhone}
                        </p>
                        <p>
                            <span className="font-medium">القسط:</span> {installment.installmentAmount} ج.م
                        </p>
                        <p>
                            <span className="font-medium">الاستحقاق:</span> {new Date(installment.dueDate).toLocaleDateString('ar-EG')}
                        </p>
                    </div>
                    <div className="flex gap-2 pt-2 border-t flex-wrap">
                        {/* زر الواتساب */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClientClick(installment.id);
                                onWhatsAppClick(installment.clientPhone);
                            }}
                            className="flex-1 gap-1 text-xs hover:text-green-700"
                        >
                            <MessageCircle className="w-3 h-3" />
                            واتساب
                        </Button>

                        {/* زر الملاحظات */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClientClick(installment.id);
                                handleAction(e, 'notes');
                            }}
                            className="flex-1 gap-1 text-xs"
                        >
                            <MessageSquare className="w-3 h-3" />
                            ({installment.notes.length})
                        </Button>

                        {/* القائمة المنسدلة */}
                        <div className="relative">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDropdownToggle}
                                className="flex-1 gap-1 text-xs"
                            >
                                <MoreVertical className="w-3 h-3" />
                                الإجراءات
                            </Button>

                            {/* خيارات القائمة المنسدلة */}
                            {activeDropdown === installment.id && (
                                <div className="absolute left-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-10">
                                    <div className="py-1">
                                        <button
                                            className="block w-full text-right px-4 py-2 text-sm hover:bg-muted"
                                            onClick={(e) => handleAction(e, 'view')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Eye className="w-4 h-4" />
                                                <span>عرض</span>
                                            </div>
                                        </button>
                                        <button
                                            className="block w-full text-right px-4 py-2 text-sm hover:bg-muted"
                                            onClick={(e) => handleAction(e, 'edit')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Edit2 className="w-4 h-4" />
                                                <span>تعديل</span>
                                            </div>
                                        </button>
                                        <button
                                            className="block w-full text-right px-4 py-2 text-sm text-destructive hover:bg-muted"
                                            onClick={(e) => handleAction(e, 'delete')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Trash2 className="w-4 h-4" />
                                                <span>حذف</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Desktop Table View
    return (
        <tr
            className={`border-t hover:bg-muted/50 transition-colors cursor-pointer ${isSelected ? 'border-2 border-orange-500 dark:border-orange-400' : ''}`}
            onClick={() => onClientClick(installment.id)}
        >
            <td className="px-4 py-3">
                {installment.clientImages.length > 0 ? (
                    <div className="flex gap-1">
                        <img
                            src={installment.clientImages[0]}
                            alt="صورة العميل"
                            className="w-10 h-10 object-cover rounded"
                            title={`${installment.clientImages.length} صورة`}
                        />
                        {installment.clientImages.length > 1 && (
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs font-semibold">
                                +{installment.clientImages.length - 1}
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </td>
            <td className="px-4 py-3">{installment.clientName || '-'}</td>
            <td className="px-4 py-3">{installment.clientPhone || '-'}</td>
            <td className="px-4 py-3">{installment.installmentAmount} ج.م</td>
            <td className="px-4 py-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(installment.status)}`}>
                    {getStatusLabel(installment.status)}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex gap-1 justify-center items-center">
                    {/* زر الواتساب */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClientClick(installment.id);
                            onWhatsAppClick(installment.dueDate);
                        }}
                        className="gap-1 hover:text-green-700"
                        title="واتساب"
                    >
                        <MessageCircle className="w-4 h-4" />
                    </Button>

                    {/* زر الملاحظات */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClientClick(installment.id);
                            handleAction(e, 'notes');
                        }}
                        className="gap-1"
                        title="ملاحظات"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs">
                            {installment.notes.length}
                        </span>
                    </Button>

                    {/* القائمة المنسدلة */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDropdownToggle}
                            className="gap-1"
                            title="الإجراءات"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </Button>

                        {/* خيارات القائمة المنسدلة */}
                        {activeDropdown === installment.id && (
                            <div className="absolute left-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-10">
                                <div className="py-1">
                                    <button
                                        className="block w-full text-right px-4 py-2 text-sm hover:bg-muted"
                                        onClick={(e) => handleAction(e, 'view')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            <span>عرض</span>
                                        </div>
                                    </button>
                                    <button
                                        className="block w-full text-right px-4 py-2 text-sm hover:bg-muted"
                                        onClick={(e) => handleAction(e, 'edit')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Edit2 className="w-4 h-4" />
                                            <span>تعديل</span>
                                        </div>
                                    </button>
                                    <button
                                        className="block w-full text-right px-4 py-2 text-sm text-destructive hover:bg-muted"
                                        onClick={(e) => handleAction(e, 'delete')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Trash2 className="w-4 h-4" />
                                            <span>حذف</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
};
