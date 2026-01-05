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

// Benz Blue color
const BENZ_BLUE = '#097dc4';

// Register Noto Sans font which supports Rupee symbol
Font.register({
    family: 'NotoSans',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNb4j5Ba_2c7A.ttf', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/notosans/v36/o-0NIpQlx3QUlC5A4PNjXhFVZNyB.ttf', fontWeight: 700 },
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 9,
        fontFamily: 'NotoSans',
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 15,
    },
    logo: {
        width: 140,
        height: 45,
        objectFit: 'contain',
    },
    titleSection: {
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 28,
        color: '#333333',
        fontFamily: 'Helvetica-Bold',
    },
    subtitle: {
        fontSize: 10,
        color: '#666666',
        marginTop: 5,
    },
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        marginTop: 10,
    },
    infoBox: {
        width: '32%',
    },
    infoLabel: {
        fontSize: 8,
        color: '#666666',
        marginBottom: 5,
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
        marginBottom: 3,
    },
    detailLabel: {
        width: 100,
        fontSize: 9,
        color: '#666666',
    },
    detailValue: {
        fontSize: 9,
        color: '#333333',
        fontFamily: 'Helvetica-Bold',
    },
    table: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#dddddd',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#dddddd',
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    tableHeaderCell: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#333333',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee',
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    tableCell: {
        fontSize: 9,
        color: '#333333',
        textAlign: 'center',
    },
    itemCol: { width: '20%', textAlign: 'left', paddingLeft: 8 },
    gstCol: { width: '7%' },
    qtyCol: { width: '7%' },
    uomCol: { width: '7%' },
    rateCol: { width: '12%' },
    amountCol: { width: '12%' },
    cgstCol: { width: '12%' },
    sgstCol: { width: '12%' },
    totalCol: { width: '13%' },
    productDesc: {
        fontSize: 8,
        color: '#666666',
        marginTop: 4,
        paddingLeft: 15,
        lineHeight: 1.4,
    },
    termsSection: {
        marginTop: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    termsBox: {
        width: '50%',
    },
    termsTitle: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#333333',
        marginBottom: 10,
    },
    termItem: {
        fontSize: 9,
        color: '#555555',
        marginBottom: 5,
        lineHeight: 1.4,
    },
    totalsBox: {
        width: '40%',
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 5,
    },
    totalLabel: {
        fontSize: 10,
        color: '#666666',
    },
    totalValue: {
        fontSize: 10,
        color: '#333333',
        textAlign: 'right',
    },
    grandTotal: {
        backgroundColor: BENZ_BLUE,
        padding: '10 15',
        borderRadius: 4,
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    grandTotalLabel: {
        fontSize: 11,
        color: '#ffffff',
        fontFamily: 'Helvetica-Bold',
    },
    grandTotalValue: {
        fontSize: 13,
        color: '#ffffff',
        fontFamily: 'Helvetica-Bold',
    },
    totalInWords: {
        marginTop: 12,
        fontSize: 9,
        color: '#555555',
    },
    totalInWordsValue: {
        fontSize: 9,
        color: '#333333',
        fontFamily: 'Helvetica-Bold',
        marginTop: 3,
    },
    signatureSection: {
        marginTop: 40,
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
    return '₹' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
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
                                <Text style={styles.detailLabel}>Country of Supply</Text>
                                <Text style={styles.detailValue}>India</Text>
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
                        <Text style={[styles.tableHeaderCell, styles.gstCol]}>GST{'\n'}Rate</Text>
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
                                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>{row.index}. {row.name}</Text>
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
                            <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
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
