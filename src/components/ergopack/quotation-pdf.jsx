/**
 * Quotation PDF Template
 * 
 * Uses @react-pdf/renderer to generate PDF matching the exact sample format.
 * Includes: Logo, company details, product table, terms, totals, signature.
 * 
 * @module components/ergopack/quotation-pdf
 */

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { COMPANY_INFO, QUOTATION_TERMS, formatCurrency, numberToWords } from '@/lib/ergopack/products';

// Benz Blue color
const BENZ_BLUE = '#097dc4';

// Compact styles to fit on single page
const styles = StyleSheet.create({
    page: {
        padding: 25,
        fontSize: 8,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 8,
    },
    logo: {
        width: 120,
        height: 38,
        objectFit: 'contain',
    },
    titleSection: {
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 24,
        color: '#333333',
        fontWeight: 700,
    },
    subtitle: {
        fontSize: 9,
        color: '#666666',
        marginTop: 3,
    },
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        marginTop: 5,
    },
    infoBox: {
        width: '32%',
    },
    infoLabel: {
        fontSize: 7,
        color: '#666666',
        marginBottom: 3,
    },
    infoValue: {
        fontSize: 9,
        color: '#333333',
        fontWeight: 700,
    },
    infoText: {
        fontSize: 8,
        color: '#555555',
        marginTop: 2,
    },
    detailsTable: {
        marginTop: 3,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    detailLabel: {
        width: 85,
        fontSize: 8,
        color: '#666666',
    },
    detailValue: {
        fontSize: 8,
        color: '#333333',
        fontWeight: 700,
    },
    table: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#dddddd',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#dddddd',
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    tableHeaderCell: {
        fontSize: 7,
        fontWeight: 700,
        color: '#333333',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee',
        paddingVertical: 5,
        paddingHorizontal: 4,
    },
    tableCell: {
        fontSize: 7,
        color: '#333333',
        textAlign: 'center',
    },
    itemCol: { width: '18%', textAlign: 'left', paddingLeft: 4 },
    gstCol: { width: '6%' },
    qtyCol: { width: '6%' },
    uomCol: { width: '6%' },
    rateCol: { width: '13%' },
    amountCol: { width: '13%' },
    cgstCol: { width: '12%' },
    sgstCol: { width: '12%' },
    totalCol: { width: '14%' },
    productDesc: {
        fontSize: 7,
        color: '#666666',
        marginTop: 2,
        paddingLeft: 12,
        lineHeight: 1.3,
    },
    termsSection: {
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    termsBox: {
        width: '50%',
    },
    termsTitle: {
        fontSize: 9,
        fontWeight: 700,
        color: '#333333',
        marginBottom: 6,
    },
    termItem: {
        fontSize: 7,
        color: '#555555',
        marginBottom: 3,
        lineHeight: 1.3,
    },
    totalsBox: {
        width: '40%',
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 3,
    },
    totalLabel: {
        fontSize: 8,
        color: '#666666',
    },
    totalValue: {
        fontSize: 8,
        color: '#333333',
        textAlign: 'right',
    },
    grandTotal: {
        backgroundColor: BENZ_BLUE,
        padding: '6 10',
        borderRadius: 3,
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    grandTotalLabel: {
        fontSize: 9,
        color: '#ffffff',
        fontWeight: 700,
    },
    grandTotalValue: {
        fontSize: 11,
        color: '#ffffff',
        fontWeight: 700,
    },
    totalInWords: {
        marginTop: 8,
        fontSize: 7,
        color: '#555555',
    },
    totalInWordsValue: {
        fontSize: 7,
        color: '#333333',
        fontWeight: 700,
        marginTop: 2,
    },
    signatureSection: {
        marginTop: 25,
        alignItems: 'flex-end',
    },
    signature: {
        width: 80,
        height: 30,
        objectFit: 'contain',
    },
    signatureLabel: {
        fontSize: 8,
        color: '#333333',
        marginTop: 3,
    },
    footer: {
        position: 'absolute',
        bottom: 15,
        left: 25,
        right: 25,
        backgroundColor: '#f5f5f5',
        padding: 8,
        textAlign: 'center',
    },
    footerText: {
        fontSize: 7,
        color: '#666666',
    },
});

function formatINR(amount) {
    return 'Rs.' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export default function QuotationPDF({ data }) {
    // Calculate totals
    let subtotal = 0;
    const productRows = data.products.map((p, i) => {
        const amount = p.rate * p.quantity;
        const cgst = amount * 0.09;
        const sgst = amount * 0.09;
        const total = amount + cgst + sgst;
        subtotal += amount;
        return { ...p, amount, cgst, sgst, total, index: i + 1 };
    });

    const totalCGST = subtotal * 0.09;
    const totalSGST = subtotal * 0.09;
    const grandTotal = subtotal + totalCGST + totalSGST;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Image
                        src="/benz-packaging-solutions-logo.jpg"
                        style={styles.logo}
                    />
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>Quotation</Text>
                        <Text style={styles.subtitle}>Protective Packaging Solutions</Text>
                    </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    {/* From */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>Quotation From</Text>
                        <Text style={styles.infoValue}>{COMPANY_INFO.name}</Text>
                        <Text style={styles.infoText}>{COMPANY_INFO.address}</Text>
                        <Text style={styles.infoText}>Email: {COMPANY_INFO.email}</Text>
                        <Text style={styles.infoText}>Phone: {COMPANY_INFO.phone}</Text>
                    </View>

                    {/* For */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>Quotation For</Text>
                        <Text style={styles.infoValue}>{data.customerName}</Text>
                        <Text style={styles.infoText}>
                            {data.customerCity}{data.customerAddress ? `,` : ''}
                        </Text>
                        {data.customerAddress && (
                            <Text style={styles.infoText}>{data.customerAddress}</Text>
                        )}
                    </View>

                    {/* Details */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>Details</Text>
                        <View style={styles.detailsTable}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Quotation No #</Text>
                                <Text style={styles.detailValue}>{data.quotationNumber}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Quotation Date</Text>
                                <Text style={styles.detailValue}>{data.quotationDate}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Payment</Text>
                                <Text style={styles.detailValue}>{QUOTATION_TERMS.payment}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Currency</Text>
                                <Text style={styles.detailValue}>{QUOTATION_TERMS.currency}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Place of Supply</Text>
                                <Text style={styles.detailValue}>{COMPANY_INFO.placeOfSupply}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Products Table */}
                <View style={styles.table}>
                    {/* Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.itemCol]}>Item</Text>
                        <Text style={[styles.tableHeaderCell, styles.gstCol]}>GST Rate</Text>
                        <Text style={[styles.tableHeaderCell, styles.qtyCol]}>Qty</Text>
                        <Text style={[styles.tableHeaderCell, styles.uomCol]}>UoM</Text>
                        <Text style={[styles.tableHeaderCell, styles.rateCol]}>Rate</Text>
                        <Text style={[styles.tableHeaderCell, styles.amountCol]}>Amount</Text>
                        <Text style={[styles.tableHeaderCell, styles.cgstCol]}>CGST</Text>
                        <Text style={[styles.tableHeaderCell, styles.sgstCol]}>SGST</Text>
                        <Text style={[styles.tableHeaderCell, styles.totalCol]}>Total</Text>
                    </View>

                    {/* Rows */}
                    {productRows.map((row) => (
                        <View key={row.id}>
                            <View style={styles.tableRow}>
                                <View style={[styles.tableCell, styles.itemCol]}>
                                    <Text style={{ fontWeight: 700 }}>{row.index}. {row.name}</Text>
                                </View>
                                <Text style={[styles.tableCell, styles.gstCol]}>{row.gstRate}%</Text>
                                <Text style={[styles.tableCell, styles.qtyCol]}>{row.quantity}</Text>
                                <Text style={[styles.tableCell, styles.uomCol]}>{row.uom}</Text>
                                <Text style={[styles.tableCell, styles.rateCol]}>{formatINR(row.rate)}</Text>
                                <Text style={[styles.tableCell, styles.amountCol]}>{formatINR(row.amount)}</Text>
                                <Text style={[styles.tableCell, styles.cgstCol]}>{formatINR(row.cgst)}</Text>
                                <Text style={[styles.tableCell, styles.sgstCol]}>{formatINR(row.sgst)}</Text>
                                <Text style={[styles.tableCell, styles.totalCol]}>{formatINR(row.total)}</Text>
                            </View>
                            {/* Product Description */}
                            <View style={{ paddingHorizontal: 8, paddingBottom: 6 }}>
                                {row.description.map((desc, i) => (
                                    <Text key={i} style={styles.productDesc}>{desc}</Text>
                                ))}
                            </View>
                        </View>
                    ))}
                </View>

                {/* Terms and Totals */}
                <View style={styles.termsSection}>
                    {/* Terms */}
                    <View style={styles.termsBox}>
                        <Text style={styles.termsTitle}>Terms and Conditions</Text>
                        <Text style={styles.termItem}>Delivery: {QUOTATION_TERMS.delivery}</Text>
                        <Text style={styles.termItem}>Validity: {QUOTATION_TERMS.validity}</Text>
                        <Text style={styles.termItem}>Freight: {QUOTATION_TERMS.freight}</Text>
                    </View>

                    {/* Totals */}
                    <View style={styles.totalsBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Amount</Text>
                            <Text style={styles.totalValue}>{formatINR(subtotal)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>CGST</Text>
                            <Text style={styles.totalValue}>{formatINR(totalCGST)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>SGST</Text>
                            <Text style={styles.totalValue}>{formatINR(totalSGST)}</Text>
                        </View>
                        <View style={styles.grandTotal}>
                            <Text style={styles.grandTotalLabel}>Total (INR)</Text>
                            <Text style={styles.grandTotalValue}>{formatINR(grandTotal)}</Text>
                        </View>
                        <Text style={styles.totalInWords}>Total (in words) :</Text>
                        <Text style={styles.totalInWordsValue}>{numberToWords(Math.round(grandTotal))}</Text>
                    </View>
                </View>

                {/* Signature */}
                <View style={styles.signatureSection}>
                    <Image
                        src="/signature.png"
                        style={styles.signature}
                    />
                    <Text style={styles.signatureLabel}>Authorized Signatory</Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        For any enquiry, reach out via email at {COMPANY_INFO.email}, call on {COMPANY_INFO.phone}
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
