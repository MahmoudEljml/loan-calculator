import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import type { ClientData } from '@/features/clients/hooks/useClientsStorage';
import cairoFont from '@/assets/Cairo.ttf';

// تسجيل خط عربي (مثل Cairo) لضمان ظهور الحروف العربية بشكل صحيح وعدم تقطيعها
Font.register({
    family: 'Cairo',
    src: cairoFont,
});

// إعداد التصاميم والأنماط الخاصة بالملف
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Cairo',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
    },
    header: {
        fontSize: 22,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#1f2937',
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        flexDirection: 'row-reverse', // لعرض الأعمدة من اليمين لليسار (RTL)
    },
    tableColHeader: {
        backgroundColor: '#f3f4f6',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 8,
    },
    tableCol: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 8,
    },
    tableCellHeader: {
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
        color: '#374151',
    },
    tableCell: {
        fontSize: 9,
        textAlign: 'right',
        color: '#4b5563',
    },
});

interface ClientsPDFProps {
    clients: ClientData[];
}

export const ClientsPDF: React.FC<ClientsPDFProps> = ({ clients }) => (
    <Document>
        {/* تم اختيار وضع العرض الأفقي (landscape) لتسع مساحة الأعمدة */}
        <Page size="A4" orientation="landscape" style={styles.page}>
            <Text style={styles.header}>تقرير قائمة العملاء</Text>

            <View style={styles.table}>
                {/* رأس الجدول */}
                <View style={styles.tableRow}>
                    <View style={[styles.tableColHeader, { width: '20%' }]}>
                        <Text style={styles.tableCellHeader}>اسم العميل</Text>
                    </View>
                    <View style={[styles.tableColHeader, { width: '15%' }]}>
                        <Text style={styles.tableCellHeader}>رقم الهاتف</Text>
                    </View>
                    <View style={[styles.tableColHeader, { width: '20%' }]}>
                        <Text style={styles.tableCellHeader}>نوع النشاط</Text>
                    </View>
                    <View style={[styles.tableColHeader, { width: '25%' }]}>
                        <Text style={styles.tableCellHeader}>العنوان</Text>
                    </View>
                    <View style={[styles.tableColHeader, { width: '20%' }]}>
                        <Text style={styles.tableCellHeader}>تاريخ الإنشاء</Text>
                    </View>
                </View>

                {/* صفوف البيانات (تعتمد على البيانات المصفاة filteredClients) */}
                {clients.map((client) => (
                    <View key={client.id} style={styles.tableRow}>
                        <View style={[styles.tableCol, { width: '20%' }]}>
                            <Text style={styles.tableCell}>{client.client_information.full_name.val || '-'}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '15%' }]}>
                            <Text style={styles.tableCell}>{client.client_information.phone_number.val || '-'}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '20%' }]}>
                            <Text style={styles.tableCell}>{client.business_details.business_type.val || '-'}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '25%' }]}>
                            <Text style={styles.tableCell}>{client.business_details.address.val || '-'}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '20%' }]}>
                            <Text style={styles.tableCell}>
                                {client.createdAt ? (() => {
                                    const d = new Date(client.createdAt);
                                    const year = d.getFullYear();
                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                    const day = String(d.getDate()).padStart(2, '0');
                                    return `${year}/${month}/${day}`;
                                })() : '-'}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        </Page>
    </Document>
);