'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

// ─── Indian Number Words ───
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
    function c(n) { return n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : ''); }
    if (crore > 0) words += c(crore) + ' Crore ';
    if (lakh > 0) words += c(lakh) + ' Lakh ';
    if (thousand > 0) words += c(thousand) + ' Thousand ';
    if (hundred > 0) words += ones[hundred] + ' Hundred ';
    if (remainder > 0) words += c(remainder) + ' ';
    words += 'Rupees';
    if (paise > 0) words += ' And ' + c(paise) + ' Paise';
    return words.trim() + ' Only';
}

function formatCurrency(v) {
    if (!v || isNaN(v)) return '0.00';
    return Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function QuotationPrintPage() {
    const { id } = useParams();
    const [doc, setDoc] = useState(null);
    const [lines, setLines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/documents?id=${id}`);
                const data = await res.json();
                const d = data.documents?.find(x => x.id === id);
                setDoc(d);
                const lRes = await fetch(`/api/documents/lines?document_id=${id}`);
                if (lRes.ok) {
                    const lData = await lRes.json();
                    setLines(lData.lines || []);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, [id]);

    useEffect(() => {
        if (!loading && doc) {
            setTimeout(() => window.print(), 600);
        }
    }, [loading, doc]);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>Loading quotation...</div>;
    if (!doc) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>Quotation not found</div>;

    const subtotal = doc.amount_untaxed || doc.subtotal || lines.reduce((s, l) => s + (parseFloat(l.base_amount) || 0), 0) || 0;
    const cgst = doc.cgst_total || lines.reduce((s, l) => s + (parseFloat(l.cgst_amount) || 0), 0) || 0;
    const sgst = doc.sgst_total || lines.reduce((s, l) => s + (parseFloat(l.sgst_amount) || 0), 0) || 0;
    const igst = doc.igst_total || 0;
    const grandTotal = doc.amount_total || doc.grand_total || (subtotal + cgst + sgst + igst) || 0;
    const isIGST = doc.fiscal_position === 'interstate';

    return (
        <>
            <style>{`
                @page { size: A4; margin: 15mm 12mm; }
                @media print {
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .no-print { display: none !important; }
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', 'Segoe UI', sans-serif; color: #1a1a1a; font-size: 11px; line-height: 1.4; }
            `}</style>

            {/* Print button - hidden in print */}
            <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, zIndex: 100, display: 'flex', gap: 8 }}>
                <button onClick={() => window.print()} style={{ padding: '10px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    🖨️ Print / Save PDF
                </button>
                <button onClick={() => window.history.back()} style={{ padding: '10px 24px', background: '#fff', color: '#1a1a1a', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    ← Back
                </button>
            </div>

            <div style={{ maxWidth: 794, margin: '0 auto', padding: '0 0 20px' }}>
                {/* ═══════════ HEADER ═══════════ */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '60%', verticalAlign: 'top', paddingBottom: 8 }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: '#0047AB', letterSpacing: 1 }}>BENZ PACKAGING</div>
                                <div style={{ fontSize: 10, color: '#0047AB', fontWeight: 600, marginTop: 2 }}>SOLUTIONS PRIVATE LIMITED</div>
                                <div style={{ fontSize: 9, color: '#555', marginTop: 6, lineHeight: 1.5 }}>
                                    Plot No. 83, Sector-5, IMT Manesar<br />
                                    Gurugram, Haryana - 122052, India<br />
                                    CIN: U25209HR2016PTC065972<br />
                                    GSTIN: 06AAJCB1515N1ZR
                                </div>
                            </td>
                            <td style={{ width: '40%', verticalAlign: 'top', textAlign: 'right', paddingBottom: 8 }}>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#333', marginBottom: 8 }}>QUOTATION</div>
                                <table style={{ marginLeft: 'auto', borderCollapse: 'collapse', fontSize: 10 }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '3px 10px', color: '#666', textAlign: 'right' }}>Quotation No:</td>
                                            <td style={{ padding: '3px 0', fontWeight: 700, color: '#0047AB' }}>{doc.name || doc.quotation_number || doc.doc_number}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '3px 10px', color: '#666', textAlign: 'right' }}>Date:</td>
                                            <td style={{ padding: '3px 0', fontWeight: 600 }}>{formatDate(doc.date_order || doc.doc_date)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '3px 10px', color: '#666', textAlign: 'right' }}>Valid Until:</td>
                                            <td style={{ padding: '3px 0', fontWeight: 600 }}>{formatDate(doc.validity_date || doc.due_date)}</td>
                                        </tr>
                                        {doc.client_order_ref && (
                                            <tr>
                                                <td style={{ padding: '3px 10px', color: '#666', textAlign: 'right' }}>Ref:</td>
                                                <td style={{ padding: '3px 0', fontWeight: 600 }}>{doc.client_order_ref}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ═══════════ DIVIDER ═══════════ */}
                <div style={{ height: 3, background: 'linear-gradient(90deg, #0047AB, #4A90D9, #0047AB)', marginBottom: 12 }} />

                {/* ═══════════ BILL TO ═══════════ */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                    <tbody>
                        <tr>
                            <td style={{ verticalAlign: 'top', width: '55%', padding: 10, background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 4 }}>
                                <div style={{ fontSize: 8, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Bill To</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{doc.customer_name_raw || 'Customer'}</div>
                                {doc.customer_address && <div style={{ fontSize: 10, color: '#555', marginTop: 3, lineHeight: 1.5 }}>{doc.customer_address}</div>}
                                {(doc.customer_gstin || doc.partner_gstin) && (
                                    <div style={{ fontSize: 10, marginTop: 4 }}>
                                        <span style={{ color: '#888' }}>GSTIN: </span>
                                        <span style={{ fontWeight: 600 }}>{doc.customer_gstin || doc.partner_gstin}</span>
                                    </div>
                                )}
                            </td>
                            <td style={{ width: 12 }} />
                            <td style={{ verticalAlign: 'top', width: '45%', padding: 10, background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 4 }}>
                                <div style={{ fontSize: 8, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Order Details</div>
                                <table style={{ fontSize: 10, width: '100%' }}>
                                    <tbody>
                                        <tr><td style={{ color: '#888', padding: '2px 0' }}>Payment Terms:</td><td style={{ fontWeight: 600, textAlign: 'right' }}>{doc.payment_terms || doc.payment_term_note || '100% Advance'}</td></tr>
                                        <tr><td style={{ color: '#888', padding: '2px 0' }}>Place of Supply:</td><td style={{ fontWeight: 600, textAlign: 'right' }}>{doc.place_of_supply || 'Haryana'}</td></tr>
                                        <tr><td style={{ color: '#888', padding: '2px 0' }}>Tax Type:</td><td style={{ fontWeight: 600, textAlign: 'right' }}>{isIGST ? 'IGST (Interstate)' : 'CGST + SGST (Intrastate)'}</td></tr>
                                        {doc.salesperson_name && <tr><td style={{ color: '#888', padding: '2px 0' }}>Salesperson:</td><td style={{ fontWeight: 600, textAlign: 'right' }}>{doc.salesperson_name}</td></tr>}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ═══════════ PRODUCT TABLE ═══════════ */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginBottom: 12 }}>
                    <thead>
                        <tr style={{ background: '#0047AB', color: '#fff' }}>
                            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, fontSize: 9, width: 30 }}>S.No</th>
                            <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700, fontSize: 9 }}>Item Description</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, fontSize: 9, width: 65 }}>HSN Code</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, fontSize: 9, width: 40 }}>Qty</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, fontSize: 9, width: 40 }}>UoM</th>
                            <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, fontSize: 9, width: 75 }}>Rate (₹)</th>
                            <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, fontSize: 9, width: 80 }}>Amount (₹)</th>
                            {isIGST ? (
                                <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, fontSize: 9, width: 55 }}>IGST %</th>
                            ) : (
                                <>
                                    <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, fontSize: 9, width: 55 }}>CGST %</th>
                                    <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, fontSize: 9, width: 55 }}>SGST %</th>
                                </>
                            )}
                            <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, fontSize: 9, width: 85 }}>Total (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(lines.length > 0 ? lines : [{ product_name: doc.product_name, product_name_raw: doc.product_name, hsn_code: '39232100', qty: doc.quantity || 1, uom: doc.uom || 'Pcs', unit_price: doc.unit_price || 0, base_amount: subtotal, gst_rate: 18, cgst_amount: cgst, sgst_amount: sgst, line_total: grandTotal }]).map((item, i) => {
                            const rate = parseFloat(item.gst_rate) || 18;
                            const halfRate = rate / 2;
                            return (
                                <tr key={i} style={{ borderBottom: '1px solid #e8e8e8', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <td style={{ padding: '7px 6px', textAlign: 'center', color: '#888' }}>{i + 1}</td>
                                    <td style={{ padding: '7px 6px' }}>
                                        <div style={{ fontWeight: 600 }}>{item.product_name || item.product_name_raw}</div>
                                        {item.product_description && <div style={{ fontSize: 9, color: '#888', marginTop: 1 }}>{item.product_description}</div>}
                                    </td>
                                    <td style={{ padding: '7px 6px', textAlign: 'center', fontFamily: 'monospace', fontSize: 9 }}>{item.hsn_code || '—'}</td>
                                    <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: 600 }}>{item.qty || item.quantity || 1}</td>
                                    <td style={{ padding: '7px 6px', textAlign: 'center', fontSize: 9 }}>{item.uom || item.product_uom || 'Pcs'}</td>
                                    <td style={{ padding: '7px 6px', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(item.unit_price)}</td>
                                    <td style={{ padding: '7px 6px', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(item.base_amount)}</td>
                                    {isIGST ? (
                                        <td style={{ padding: '7px 6px', textAlign: 'center' }}>{rate}%</td>
                                    ) : (
                                        <>
                                            <td style={{ padding: '7px 6px', textAlign: 'center' }}>{halfRate}%</td>
                                            <td style={{ padding: '7px 6px', textAlign: 'center' }}>{halfRate}%</td>
                                        </>
                                    )}
                                    <td style={{ padding: '7px 6px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>{formatCurrency(item.line_total)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* ═══════════ TOTALS ═══════════ */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '55%', verticalAlign: 'top', paddingRight: 12 }}>
                                {/* Amount in Words */}
                                <div style={{ background: '#f0f4ff', border: '1px solid #c8d8f0', borderRadius: 4, padding: 10, marginBottom: 8 }}>
                                    <div style={{ fontSize: 8, fontWeight: 700, color: '#0047AB', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Amount in Words</div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#333', fontStyle: 'italic' }}>{numberToWords(grandTotal)}</div>
                                </div>
                            </td>
                            <td style={{ width: '45%', verticalAlign: 'top' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '5px 8px', color: '#666' }}>Subtotal</td>
                                            <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>₹{formatCurrency(subtotal)}</td>
                                        </tr>
                                        {isIGST ? (
                                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '5px 8px', color: '#666' }}>IGST</td>
                                                <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace' }}>₹{formatCurrency(igst || (cgst + sgst))}</td>
                                            </tr>
                                        ) : (
                                            <>
                                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '5px 8px', color: '#666' }}>CGST</td>
                                                    <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace' }}>₹{formatCurrency(cgst)}</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '5px 8px', color: '#666' }}>SGST</td>
                                                    <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace' }}>₹{formatCurrency(sgst)}</td>
                                                </tr>
                                            </>
                                        )}
                                        <tr style={{ background: '#0047AB', color: '#fff' }}>
                                            <td style={{ padding: '8px', fontWeight: 700 }}>Grand Total (INR)</td>
                                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, fontSize: 14, fontFamily: 'monospace' }}>₹{formatCurrency(grandTotal)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ═══════════ TERMS & BANK DETAILS ═══════════ */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                    <tbody>
                        <tr>
                            <td style={{ verticalAlign: 'top', width: '55%', paddingRight: 12 }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: '#0047AB', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Terms & Conditions</div>
                                <div style={{ fontSize: 9, color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                    {doc.terms_and_conditions || doc.note || `1. This quotation is valid for ${doc.validity_days || 15} days from the date of issue.
2. Payment: ${doc.payment_terms || '100% Advance'} payment before dispatch.
3. Freight & Packing: Extra as applicable.
4. Delivery: 7-10 working days from order confirmation & receipt of advance.
5. Taxes: GST as applicable.
6. Any disputes are subject to Gurugram jurisdiction.`}
                                </div>
                            </td>
                            <td style={{ verticalAlign: 'top', width: '45%' }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: '#0047AB', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Bank Details</div>
                                <table style={{ fontSize: 9, color: '#555', lineHeight: 1.6, width: '100%' }}>
                                    <tbody>
                                        <tr><td style={{ color: '#888', width: '40%', padding: '1px 0' }}>Bank Name:</td><td style={{ fontWeight: 600 }}>HDFC Bank</td></tr>
                                        <tr><td style={{ color: '#888', padding: '1px 0' }}>Account No:</td><td style={{ fontWeight: 600, fontFamily: 'monospace' }}>50200089498591</td></tr>
                                        <tr><td style={{ color: '#888', padding: '1px 0' }}>IFSC Code:</td><td style={{ fontWeight: 600, fontFamily: 'monospace' }}>HDFC0001342</td></tr>
                                        <tr><td style={{ color: '#888', padding: '1px 0' }}>Branch:</td><td style={{ fontWeight: 600 }}>IMT Manesar Branch</td></tr>
                                        <tr><td style={{ color: '#888', padding: '1px 0' }}>Account Type:</td><td style={{ fontWeight: 600 }}>Current Account</td></tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ═══════════ SIGNATURE ═══════════ */}
                <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '2px solid #0047AB', paddingTop: 12, marginTop: 8 }}>
                    <tbody>
                        <tr>
                            <td style={{ verticalAlign: 'bottom', paddingTop: 12, width: '50%' }}>
                                <div style={{ fontSize: 9, color: '#888' }}>Customer Acceptance</div>
                                <div style={{ borderBottom: '1px solid #ccc', width: 180, height: 40, marginTop: 8 }} />
                                <div style={{ fontSize: 8, color: '#aaa', marginTop: 3 }}>Name, Signature & Date</div>
                            </td>
                            <td style={{ verticalAlign: 'bottom', paddingTop: 12, textAlign: 'right', width: '50%' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#0047AB' }}>For BENZ PACKAGING SOLUTIONS PVT LTD</div>
                                <div style={{ height: 40, marginTop: 8 }} />
                                <div style={{ fontSize: 10, fontWeight: 600, color: '#333' }}>Authorized Signatory</div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ═══════════ FOOTER ═══════════ */}
                <div style={{ marginTop: 16, paddingTop: 8, borderTop: '1px solid #e0e0e0', textAlign: 'center', fontSize: 8, color: '#999' }}>
                    <div>Regd. Office: Plot No. 83, Sector-5, IMT Manesar, Gurugram, Haryana - 122052 | Phone: +91 99907 44477 | Email: ccare6@benz-packaging.com</div>
                    <div style={{ marginTop: 2 }}>www.benz-packaging.com | This is a computer-generated document.</div>
                </div>
            </div>
        </>
    );
}
