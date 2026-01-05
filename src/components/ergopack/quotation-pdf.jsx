/**
 * Quotation PDF Template
 * 
 * Uses @react-pdf/renderer to generate PDF matching the exact sample format.
 * Includes: Logo, company details, product table, terms, totals, signature.
 * 
 * @module components/ergopack/quotation-pdf
 */

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { COMPANY_INFO, QUOTATION_TERMS, formatCurrency, numberToWords } from '@/lib/ergopack/products';

// Register fonts (using default for now)
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 9,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
        paddingBottom: 15,
    },
    logo: {
        width: 120,
        height: 40,
        objectFit: 'contain',
    },
    titleSection: {
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 24,
        color: '#333333',
        fontFamily: 'Helvetica-Bold',
    },
    titleBadge: {
        backgroundColor: '#2563eb',
        color: '#ffffff',
        padding: '3 8',
        borderRadius: 3,
        fontSize: 8,
        marginTop: 5,
    },
    subtitle: {
        fontSize: 10,
        color: '#666666',
        marginTop: 3,
    },
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    infoBox: {
        width: '32%',
    },
    infoLabel: {
        fontSize: 8,
        color: '#666666',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 10,
        color: '#333333',
        fontFamily: 'Helvetica-Bold',
    },
    infoText: {
        fontSize: 9,
        color: '#555555',
        marginTop: 3,
    },
    detailsTable: {
        marginTop: 5,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    detailLabel: {
        width: 100,
        fontSize: 8,
        color: '#666666',
    },
    detailValue: {
        fontSize: 8,
        color: '#333333',
    },
    table: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
        paddingVertical: 8,
        paddingHorizontal: 5,
    },
    tableHeaderCell: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#333333',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee',
        paddingVertical: 8,
        paddingHorizontal: 5,
    },
    tableCell: {
        fontSize: 8,
        color: '#333333',
        textAlign: 'center',
    },
    itemCol: { width: '25%', textAlign: 'left', paddingLeft: 5 },
    gstCol: { width: '8%' },
    qtyCol: { width: '8%' },
    uomCol: { width: '8%' },
    rateCol: { width: '12%' },
    amountCol: { width: '12%' },
    cgstCol: { width: '10%' },
    sgstCol: { width: '10%' },
    totalCol: { width: '12%' },
    productDesc: {
        fontSize: 7,
        color: '#666666',
        marginTop: 3,
        paddingLeft: 10,
    },
    termsSection: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    termsBox: {
        width: '50%',
    },
    termsTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#333333',
        marginBottom: 8,
    },
    termItem: {
        fontSize: 8,
        color: '#555555',
        marginBottom: 4,
    },
    totalsBox: {
        width: '40%',
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 4,
    },
    totalLabel: {
        fontSize: 9,
        color: '#666666',
    },
    totalValue: {
        fontSize: 9,
        color: '#333333',
        textAlign: 'right',
    },
    grandTotal: {
        backgroundColor: '#1e4a8e',
        padding: '8 12',
        borderRadius: 4,
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    grandTotalLabel: {
        fontSize: 10,
        color: '#ffffff',
        fontFamily: 'Helvetica-Bold',
    },
    grandTotalValue: {
        fontSize: 12,
        color: '#ffffff',
        fontFamily: 'Helvetica-Bold',
    },
    totalInWords: {
        marginTop: 8,
        fontSize: 8,
        color: '#555555',
    },
    signatureSection: {
        marginTop: 30,
        alignItems: 'flex-end',
    },
    signature: {
        width: 100,
        height: 40,
        objectFit: 'contain',
    },
    signatureLabel: {
        fontSize: 9,
        color: '#333333',
        marginTop: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        backgroundColor: '#f5f5f5',
        padding: 10,
        textAlign: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#666666',
    },
});

function formatINR(amount) {
    return '₹' + new Intl.NumberFormat('en-IN').format(amount.toFixed(2));
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
                        <View style={styles.titleBadge}>
                            <Text style={{ color: '#ffffff', fontSize: 8 }}>Created</Text>
                        </View>
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
                            {data.customerCity}{data.customerAddress ? `, ${data.customerAddress}` : ''}
                        </Text>
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
                                <Text style={styles.detailLabel}>Place of Supply:</Text>
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
                        <Text style={[styles.tableHeaderCell, styles.qtyCol]}>Quantity</Text>
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
                                    <Text>{row.index}. {row.name}</Text>
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
                            <View style={{ paddingHorizontal: 10, paddingBottom: 8 }}>
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
                        <Text style={styles.totalInWords}>
                            Total (in words) : {numberToWords(Math.round(grandTotal))}
                        </Text>
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
