/**
 * Professional Quotation PDF Generator
 * 
 * Generates PDF matching the Benz Packaging format exactly.
 * Uses @react-pdf/renderer for precise layout control.
 * 
 * @module components/documents/QuotationPDF
 */

import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    Image,
} from '@react-pdf/renderer';

// Register fonts (optional - for better typography)
// Font.register({ family: 'Inter', src: '/fonts/Inter-Regular.ttf' });

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 9,
        padding: 30,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottom: '2px solid #1a73e8',
        paddingBottom: 10,
    },
    logo: {
        width: 120,
        height: 40,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a73e8',
    },
    logoSubtext: {
        fontSize: 10,
        color: '#666666',
    },
    titleSection: {
        textAlign: 'right',
    },
    title: {
        fontSize: 28,
        color: '#1a73e8',
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 10,
        color: '#666666',
        marginTop: 2,
    },
    infoSection: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 20,
    },
    infoColumn: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 8,
        color: '#888888',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 9,
        color: '#333333',
        marginBottom: 8,
    },
    infoBold: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1a73e8',
        marginBottom: 4,
    },
    detailsBox: {
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 4,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    detailLabel: {
        width: 100,
        fontSize: 8,
        color: '#666666',
    },
    detailValue: {
        flex: 1,
        fontSize: 9,
        fontWeight: 'bold',
    },
    table: {
        marginTop: 10,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1a73e8',
        padding: 8,
        color: '#ffffff',
    },
    tableHeaderCell: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #e0e0e0',
        padding: 8,
        minHeight: 40,
    },
    tableRowAlt: {
        backgroundColor: '#f8f9fa',
    },
    tableCell: {
        fontSize: 8,
    },
    tableCellBold: {
        fontSize: 9,
        fontWeight: 'bold',
    },
    // Column widths
    colSr: { width: '4%' },
    colItem: { width: '28%' },
    colHsn: { width: '10%' },
    colGst: { width: '6%' },
    colQty: { width: '8%' },
    colUom: { width: '6%' },
    colRate: { width: '10%', textAlign: 'right' },
    colAmount: { width: '10%', textAlign: 'right' },
    colCgst: { width: '9%', textAlign: 'right' },
    colSgst: { width: '9%', textAlign: 'right' },
    colTotal: { width: '10%', textAlign: 'right' },
    summarySection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    termsBox: {
        width: '55%',
    },
    termsTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333333',
    },
    termsText: {
        fontSize: 8,
        color: '#666666',
        lineHeight: 1.5,
    },
    totalsBox: {
        width: '40%',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
        paddingVertical: 2,
    },
    totalLabel: {
        fontSize: 9,
        color: '#666666',
    },
    totalValue: {
        fontSize: 9,
        fontWeight: 'bold',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#1a73e8',
        padding: 8,
        marginTop: 4,
    },
    grandTotalLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    grandTotalValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    totalWords: {
        fontSize: 8,
        color: '#666666',
        marginTop: 8,
        fontStyle: 'italic',
    },
    signatureSection: {
        marginTop: 40,
        alignItems: 'flex-end',
    },
    signatureLine: {
        width: 150,
        borderTop: '1px solid #333333',
        paddingTop: 4,
        textAlign: 'center',
    },
    signatureText: {
        fontSize: 8,
        color: '#666666',
    },
    hsnTable: {
        marginTop: 30,
        border: '1px solid #e0e0e0',
    },
    hsnHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        padding: 6,
        borderBottom: '1px solid #e0e0e0',
    },
    hsnRow: {
        flexDirection: 'row',
        padding: 6,
        borderBottom: '1px solid #e0e0e0',
    },
    hsnCell: {
        fontSize: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        paddingTop: 10,
        borderTop: '1px solid #e0e0e0',
    },
    footerText: {
        fontSize: 8,
        color: '#666666',
    },
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount || 0).replace('₹', '₹');
}

function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (!num || num === 0) return 'Zero Rupees Only';

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const hundred = Math.floor((num % 1000) / 100);
    const remainder = Math.floor(num % 100);
    const paise = Math.round((num % 1) * 100);

    let words = '';

    function convertLessThanHundred(n) {
        if (n < 20) return ones[n];
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    }

    if (crore > 0) words += convertLessThanHundred(crore) + ' Crore ';
    if (lakh > 0) words += convertLessThanHundred(lakh) + ' Lakh ';
    if (thousand > 0) words += convertLessThanHundred(thousand) + ' Thousand ';
    if (hundred > 0) words += ones[hundred] + ' Hundred ';
    if (remainder > 0) words += convertLessThanHundred(remainder) + ' ';

    words += 'Rupees';
    if (paise > 0) words += ' And ' + convertLessThanHundred(paise) + ' Paise';
    words += ' Only';

    return words.trim();
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuotationPDF({ document, lineItems = [], companyInfo }) {
    const company = companyInfo || {
        name: 'BENZ PACKAGING SOLUTIONS PRIVATE LIMITED',
        address: 'Plot 83, Sec-5, IMT Manesar, Gurgaon, Haryana, India - 122052',
        email: 'ccare6@benz-packaging.com',
        phone: '+919990744477',
    };

    // Calculate HSN summary
    const hsnSummary = {};
    lineItems.forEach(item => {
        const hsn = item.hsn_code || '39232100';
        if (!hsnSummary[hsn]) {
            hsnSummary[hsn] = {
                hsn,
                taxableValue: 0,
                cgstRate: (item.gst_rate || 18) / 2,
                cgstAmount: 0,
                sgstRate: (item.gst_rate || 18) / 2,
                sgstAmount: 0,
                total: 0,
            };
        }
        hsnSummary[hsn].taxableValue += item.base_amount || 0;
        hsnSummary[hsn].cgstAmount += item.cgst_amount || 0;
        hsnSummary[hsn].sgstAmount += item.sgst_amount || 0;
        hsnSummary[hsn].total += (item.cgst_amount || 0) + (item.sgst_amount || 0);
    });

    const hsnRows = Object.values(hsnSummary);
    const totalTax = hsnRows.reduce((sum, row) => sum + row.total, 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.logoText}>BENZ</Text>
                        <Text style={styles.logoSubtext}>PACKAGING</Text>
                    </View>
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>Quotation</Text>
                        <Text style={styles.subtitle}>Protective Packaging Solutions</Text>
                    </View>
                </View>

                {/* Info Section - 3 Columns */}
                <View style={styles.infoSection}>
                    {/* From Column */}
                    <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>Quotation From</Text>
                        <Text style={styles.infoBold}>{company.name}</Text>
                        <Text style={styles.infoValue}>{company.address}</Text>
                        <Text style={styles.infoValue}>Email: {company.email}</Text>
                        <Text style={styles.infoValue}>Phone: {company.phone}</Text>
                    </View>

                    {/* For Column */}
                    <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>Quotation For</Text>
                        <Text style={styles.infoBold}>{document.customer_name_raw || document.customer_name}</Text>
                        <Text style={styles.infoValue}>{document.customer_address || 'India'}</Text>
                        {document.customer_gstin && (
                            <Text style={styles.infoValue}>GSTIN: {document.customer_gstin}</Text>
                        )}
                    </View>

                    {/* Details Column */}
                    <View style={[styles.infoColumn, styles.detailsBox]}>
                        <Text style={styles.infoLabel}>Details</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Quotation No #</Text>
                            <Text style={styles.detailValue}>{document.quotation_number || document.doc_number}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Quotation Date</Text>
                            <Text style={styles.detailValue}>{document.doc_date}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Due Date</Text>
                            <Text style={styles.detailValue}>{document.due_date || '-'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Payment Terms</Text>
                            <Text style={styles.detailValue}>{document.payment_terms || '100% Advance'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Country of Supply</Text>
                            <Text style={styles.detailValue}>{document.country_of_supply || 'India'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Place of Supply</Text>
                            <Text style={styles.detailValue}>{document.place_of_supply || 'Haryana (06)'}</Text>
                        </View>
                    </View>
                </View>

                {/* Line Items Table */}
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colSr]}>#</Text>
                        <Text style={[styles.tableHeaderCell, styles.colItem]}>Item</Text>
                        <Text style={[styles.tableHeaderCell, styles.colHsn]}>HSN</Text>
                        <Text style={[styles.tableHeaderCell, styles.colGst]}>GST Rate</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQty]}>Quantity</Text>
                        <Text style={[styles.tableHeaderCell, styles.colUom]}>UoM</Text>
                        <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate</Text>
                        <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
                        <Text style={[styles.tableHeaderCell, styles.colCgst]}>CGST</Text>
                        <Text style={[styles.tableHeaderCell, styles.colSgst]}>SGST</Text>
                        <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
                    </View>

                    {/* Table Rows */}
                    {lineItems.map((item, index) => (
                        <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                            <Text style={[styles.tableCell, styles.colSr]}>{index + 1}.</Text>
                            <View style={styles.colItem}>
                                <Text style={styles.tableCellBold}>{item.product_name || item.product_name_raw}</Text>
                                <Text style={[styles.tableCell, { color: '#666666', fontSize: 7 }]}>
                                    {item.product_description || `HSN/SAC: ${item.hsn_code || '39232100'}`}
                                </Text>
                            </View>
                            <Text style={[styles.tableCell, styles.colHsn]}>{item.hsn_code || '39232100'}</Text>
                            <Text style={[styles.tableCell, styles.colGst]}>{item.gst_rate || 18}%</Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{item.qty || item.quantity}</Text>
                            <Text style={[styles.tableCell, styles.colUom]}>{item.uom}</Text>
                            <Text style={[styles.tableCell, styles.colRate]}>{formatCurrency(item.unit_price)}</Text>
                            <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(item.base_amount)}</Text>
                            <Text style={[styles.tableCell, styles.colCgst]}>{formatCurrency(item.cgst_amount)}</Text>
                            <Text style={[styles.tableCell, styles.colSgst]}>{formatCurrency(item.sgst_amount)}</Text>
                            <Text style={[styles.tableCellBold, styles.colTotal]}>{formatCurrency(item.line_total)}</Text>
                        </View>
                    ))}
                </View>

                {/* Summary Section */}
                <View style={styles.summarySection}>
                    {/* Terms */}
                    <View style={styles.termsBox}>
                        <Text style={styles.termsTitle}>Terms and Conditions</Text>
                        <Text style={styles.termsText}>
                            {document.terms_and_conditions || `Validity: This quote is valid for ${document.validity_days || 15} days from the date of making.\nFreight: Extra as applicable.`}
                        </Text>
                    </View>

                    {/* Totals */}
                    <View style={styles.totalsBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Amount</Text>
                            <Text style={styles.totalValue}>{formatCurrency(document.subtotal || document.total_value)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>CGST</Text>
                            <Text style={styles.totalValue}>{formatCurrency(document.cgst_total)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>SGST</Text>
                            <Text style={styles.totalValue}>{formatCurrency(document.sgst_total)}</Text>
                        </View>
                        <View style={styles.grandTotalRow}>
                            <Text style={styles.grandTotalLabel}>Total (INR)</Text>
                            <Text style={styles.grandTotalValue}>{formatCurrency(document.grand_total)}</Text>
                        </View>
                        <Text style={styles.totalWords}>
                            Total (in words): {numberToWords(document.grand_total)}
                        </Text>
                    </View>
                </View>

                {/* Signature */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureLine}>
                        <Text style={styles.signatureText}>{document.authorized_signatory || 'Authorized Signatory'}</Text>
                    </View>
                </View>

                {/* HSN Tax Summary Table */}
                {hsnRows.length > 0 && (
                    <View style={styles.hsnTable}>
                        <View style={styles.hsnHeader}>
                            <Text style={[styles.hsnCell, { width: '15%', fontWeight: 'bold' }]}>HSN</Text>
                            <Text style={[styles.hsnCell, { width: '20%', fontWeight: 'bold' }]}>Taxable Value</Text>
                            <Text style={[styles.hsnCell, { width: '15%', fontWeight: 'bold', textAlign: 'center' }]}>CGST</Text>
                            <Text style={[styles.hsnCell, { width: '15%', fontWeight: 'bold', textAlign: 'right' }]}>Amount</Text>
                            <Text style={[styles.hsnCell, { width: '15%', fontWeight: 'bold', textAlign: 'center' }]}>SGST</Text>
                            <Text style={[styles.hsnCell, { width: '15%', fontWeight: 'bold', textAlign: 'right' }]}>Amount</Text>
                            <Text style={[styles.hsnCell, { width: '15%', fontWeight: 'bold', textAlign: 'right' }]}>Total</Text>
                        </View>
                        {hsnRows.map((row, idx) => (
                            <View key={idx} style={styles.hsnRow}>
                                <Text style={[styles.hsnCell, { width: '15%' }]}>{row.hsn}</Text>
                                <Text style={[styles.hsnCell, { width: '20%' }]}>{formatCurrency(row.taxableValue)}</Text>
                                <Text style={[styles.hsnCell, { width: '15%', textAlign: 'center' }]}>{row.cgstRate}%</Text>
                                <Text style={[styles.hsnCell, { width: '15%', textAlign: 'right' }]}>{formatCurrency(row.cgstAmount)}</Text>
                                <Text style={[styles.hsnCell, { width: '15%', textAlign: 'center' }]}>{row.sgstRate}%</Text>
                                <Text style={[styles.hsnCell, { width: '15%', textAlign: 'right' }]}>{formatCurrency(row.sgstAmount)}</Text>
                                <Text style={[styles.hsnCell, { width: '15%', textAlign: 'right' }]}>{formatCurrency(row.total)}</Text>
                            </View>
                        ))}
                        <View style={[styles.hsnRow, { backgroundColor: '#f0f0f0' }]}>
                            <Text style={[styles.hsnCell, { width: '15%', fontWeight: 'bold' }]}>Total</Text>
                            <Text style={[styles.hsnCell, { width: '20%' }]}>{formatCurrency(document.subtotal)}</Text>
                            <Text style={[styles.hsnCell, { width: '15%' }]}></Text>
                            <Text style={[styles.hsnCell, { width: '15%', textAlign: 'right' }]}>{formatCurrency(document.cgst_total)}</Text>
                            <Text style={[styles.hsnCell, { width: '15%' }]}></Text>
                            <Text style={[styles.hsnCell, { width: '15%', textAlign: 'right' }]}>{formatCurrency(document.sgst_total)}</Text>
                            <Text style={[styles.hsnCell, { width: '15%', textAlign: 'right', fontWeight: 'bold' }]}>{formatCurrency(totalTax)}</Text>
                        </View>
                        <Text style={{ fontSize: 7, padding: 6, color: '#666666' }}>
                            Total Tax In Words: {numberToWords(totalTax).toUpperCase()}
                        </Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        For any enquiry, reach out via email at ccare6@benz-packaging.com, call on +91 99907 44477
                    </Text>
                </View>
            </Page>
        </Document>
    );
}

export default QuotationPDF;
