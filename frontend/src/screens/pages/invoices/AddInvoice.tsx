import React, { useState, useEffect, useRef } from 'react';
import {
    Save, ArrowLeft, Plus, Trash2,
    Eye, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BASE_URL, getAuthHeader } from '../../../api/base';

interface InvoiceItem {
    id: string;
    materialName: string;
    materialId: number | null;
    office: string;
    officeId: number | null;
    quantity: number;
    unit: string;
    rate: number;
    hsnCode: string;
    sgst: number;
    cgst: number;
    igst: number;
    total: number;
}

const AddInvoice: React.FC = () => {
    const navigate = useNavigate();
    const previewRef = useRef<HTMLDivElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [sameAsBilled, setSameAsBilled] = useState(true);

    // Form State
    const [invoiceData, setInvoiceData] = useState({
        invoiceId: `000${Math.floor(10 + Math.random() * 89)}/2526`,
        date: new Date().toISOString().split('T')[0],
        transportMode: 'ROAD',
        vehicleNumber: '',
        dateOfSupply: new Date().toISOString().split('T')[0],
        deliveryPlace: '',

        billingName: '',
        billingAddress: '',
        billingGstin: '',
        billingState: '-',

        shippingName: '',
        shippingAddress: '',
        shippingGstin: '',
        shippingState: '-',

        bankName: 'ICICI BANK, TIRUPUR BRANCH',
        accountNo: '253805004311',
        ifscCode: 'ICIC0002538',

        customerNumber: '', // legacy compatibility
        customerPhone: '',
        customerAddress: ''
    });

    const [items, setItems] = useState<InvoiceItem[]>([
        {
            id: Math.random().toString(36).substr(2, 9),
            materialName: '',
            materialId: null,
            office: 'Office 1',
            officeId: 1,
            quantity: 0,
            unit: 'NOS',
            rate: 0,
            hsnCode: '69022090',
            sgst: 9,
            cgst: 9,
            igst: 0,
            total: 0
        }
    ]);

    // Backend Data State
    const [materials, setMaterials] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [offices, setOffices] = useState<any[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [matRes, vehRes, offRes] = await Promise.all([
                fetch(`${BASE_URL}/products`, { headers: getAuthHeader() }),
                fetch(`${BASE_URL}/vehicles`, { headers: getAuthHeader() }),
                fetch(`${BASE_URL}/offices`, { headers: getAuthHeader() })
            ]);

            const matData = await matRes.json();
            const vehData = await vehRes.json();
            const offData = await offRes.json();

            setMaterials(matData.data || []);
            setVehicles(vehData.data || []);
            setOffices(offData.data || []);
        } catch (error) {
            toast.error("Failed to load backend data");
        }
    };

    const calculateItemTotal = (item: InvoiceItem) => {
        const subtotal = item.quantity * item.rate;
        const sgstAmount = (subtotal * item.sgst) / 100;
        const cgstAmount = (subtotal * item.cgst) / 100;
        const igstAmount = (subtotal * item.igst) / 100;
        return subtotal + sgstAmount + cgstAmount + igstAmount;
    };

    const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
        const updatedItems = items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };

                if (field === 'materialName') {
                    const mat = materials.find(m => m.product_name === value);
                    updatedItem.materialId = mat ? mat.product_id : null;
                }

                if (field === 'office') {
                    const off = offices.find(o => o.office_name === value);
                    updatedItem.officeId = off ? off.office_id : (value === 'Office 1' ? 1 : 2);
                }

                updatedItem.total = calculateItemTotal(updatedItem);
                return updatedItem;
            }
            return item;
        });
        setItems(updatedItems);
    };

    const addItem = () => {
        setItems([...items, {
            id: Math.random().toString(36).substr(2, 9),
            materialName: '',
            materialId: null,
            office: 'Office 1',
            officeId: 1,
            quantity: 0,
            unit: 'NOS',
            rate: 0,
            hsnCode: '69022090',
            sgst: 9,
            cgst: 9,
            igst: 0,
            total: 0
        }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    const subTotalValue = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const totalSgst = items.reduce((sum, item) => sum + ((item.quantity * item.rate * item.sgst) / 100), 0);
    const totalCgst = items.reduce((sum, item) => sum + ((item.quantity * item.rate * item.cgst) / 100), 0);
    const totalIgst = items.reduce((sum, item) => sum + ((item.quantity * item.rate * item.igst) / 100), 0);
    const finalAmount = subTotalValue + totalSgst + totalCgst + totalIgst;
    const roundOffValue = Math.round(finalAmount) - finalAmount;
    const grandTotal = Math.round(finalAmount);

    const numberToWords = (num: number): string => {
        if (num === 0) return 'ZERO ONLY';
        const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
        const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

        const convert = (n: number): string => {
            if (n < 20) return ones[n];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
            if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' AND ' + convert(n % 100) : '');
            if (n < 100000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
            if (n < 10000000) return convert(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
            return convert(Math.floor(n / 10000000)) + ' CRORE' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
        };

        return convert(num) + ' ONLY';
    };

    const saveInvoice = async () => {
        if (!invoiceData.billingName || !invoiceData.vehicleNumber) {
            toast.error("Please fill required fields (Billed To Name & Vehicle)");
            return;
        }

        if (items.some(item => !item.materialId)) {
            toast.error("Please select material for all items");
            return;
        }

        setIsSaving(true);
        try {
            for (const item of items) {
                const payload = {
                    ...invoiceData,
                    customerNumber: invoiceData.billingName,
                    customerAddress: invoiceData.billingAddress,
                    materialName: item.materialName,
                    materialId: item.materialId,
                    office: item.office,
                    officeId: item.officeId,
                    quantity: item.quantity,
                    unit: item.unit,
                    ratePerUnit: item.rate,
                    hsnCode: item.hsnCode,
                    sgst: item.sgst,
                    cgst: item.cgst,
                    igst: item.igst,
                    totalAmount: item.total,
                    roundOff: roundOffValue,
                    totalInWords: numberToWords(grandTotal),
                    shippingName: sameAsBilled ? invoiceData.billingName : invoiceData.shippingName,
                    shippingAddress: sameAsBilled ? invoiceData.billingAddress : invoiceData.shippingAddress,
                    shippingGstin: sameAsBilled ? invoiceData.billingGstin : invoiceData.shippingGstin,
                    shippingState: sameAsBilled ? invoiceData.billingState : invoiceData.shippingState
                };

                const response = await fetch(`${BASE_URL}/invoices/create`, {
                    method: 'POST',
                    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || "Failed to save invoice");
                }

                const result = await response.json();
                await generateAndUploadPDF(result.data.id);
            }

            toast.success("Invoices saved successfully!");
            navigate('/invoices/history');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const generateAndUploadPDF = async (dbId: number) => {
        if (!previewRef.current) return;
        const wasPreview = showPreview;
        setShowPreview(true);
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const element = previewRef.current;
            const fileName = `Invoice_${invoiceData.invoiceId.replace(/\//g, '-')}_${Date.now()}.pdf`;

            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: "#ffffff",
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            const pdfBlob = pdf.output('blob');

            const formDataUpload = new FormData();
            formDataUpload.append('pdf', pdfBlob, fileName);

            const uploadRes = await fetch(`${BASE_URL}/notepad/upload-pdf`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: formDataUpload
            });

            if (uploadRes.ok) {
                const uploadResult = await uploadRes.json();
                await fetch(`${BASE_URL}/invoices/pdf/${dbId}`, {
                    method: 'PATCH',
                    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pdfPath: uploadResult.path, filename: fileName })
                });
            }
        } catch (err) {
            console.error("PDF upload failed", err);
        } finally {
            setShowPreview(wasPreview);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F8FAFC] overflow-hidden">
            <aside className={`fixed inset-0 lg:relative lg:flex lg:w-[480px] flex-col bg-white border-r border-slate-200 z-30 shadow-xl transition-transform duration-300 ${!showPreview ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-100">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800">Tax Invoice</h2>
                            <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Template Studio</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/invoices/history')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
                        <ArrowLeft size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Invoice No</label>
                                <input type="text" value={invoiceData.invoiceId} onChange={e => setInvoiceData({ ...invoiceData, invoiceId: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Invoice Date</label>
                                <input type="date" value={invoiceData.date} onChange={e => setInvoiceData({ ...invoiceData, date: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Vehicle No</label>
                                <select value={invoiceData.vehicleNumber} onChange={e => setInvoiceData({ ...invoiceData, vehicleNumber: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                                    <option value="">Select Vehicle</option>
                                    {vehicles.map(v => <option key={v.id} value={v.vehicle_number}>{v.vehicle_number}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Delivery Place</label>
                                <input type="text" value={invoiceData.deliveryPlace} onChange={e => setInvoiceData({ ...invoiceData, deliveryPlace: e.target.value })} placeholder="e.g. TIRUPUR" className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing & Shipping</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400">Same as Billed</span>
                                <input type="checkbox" checked={sameAsBilled} onChange={e => setSameAsBilled(e.target.checked)} className="rounded border-slate-300 text-black focus:ring-black" />
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                            <p className="text-[10px] font-black text-black uppercase">Billed To</p>
                            <input type="text" placeholder="Customer Name" value={invoiceData.billingName} onChange={e => setInvoiceData({ ...invoiceData, billingName: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                            <textarea placeholder="Full Address" value={invoiceData.billingAddress} onChange={e => setInvoiceData({ ...invoiceData, billingAddress: e.target.value })} rows={2} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm resize-none" />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="GSTIN" value={invoiceData.billingGstin} onChange={e => setInvoiceData({ ...invoiceData, billingGstin: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                                <input type="text" placeholder="State" value={invoiceData.billingState} onChange={e => setInvoiceData({ ...invoiceData, billingState: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                            </div>
                        </div>
                        {!sameAsBilled && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                                <p className="text-[10px] font-black text-black uppercase">Shipped To</p>
                                <input type="text" placeholder="Receiver Name" value={invoiceData.shippingName} onChange={e => setInvoiceData({ ...invoiceData, shippingName: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                                <textarea placeholder="Shipping Address" value={invoiceData.shippingAddress} onChange={e => setInvoiceData({ ...invoiceData, shippingAddress: e.target.value })} rows={2} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm resize-none" />
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="text" placeholder="GSTIN" value={invoiceData.shippingGstin} onChange={e => setInvoiceData({ ...invoiceData, shippingGstin: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                                    <input type="text" placeholder="State" value={invoiceData.shippingState} onChange={e => setInvoiceData({ ...invoiceData, shippingState: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material Details</h3>
                            <button onClick={addItem} className="p-1 text-black bg-slate-50 border border-slate-200 rounded-lg"><Plus size={16} /></button>
                        </div>
                        {items.map((item) => (
                            <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 relative">
                                <button onClick={() => removeItem(item.id)} className="absolute top-2 right-2 text-red-400"><Trash2 size={14} /></button>
                                <select value={item.materialName} onChange={e => handleItemChange(item.id, 'materialName', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold">
                                    <option value="">Select Product</option>
                                    {materials.map(m => <option key={m.product_id} value={m.product_name}>{m.product_name}</option>)}
                                </select>
                                <div className="grid grid-cols-3 gap-2">
                                    <input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                                    <input type="number" placeholder="Rate" value={item.rate} onChange={e => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                                    <input type="text" placeholder="HSN" value={item.hsnCode} onChange={e => handleItemChange(item.id, 'hsnCode', e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <input type="number" placeholder="SGST%" value={item.sgst} onChange={e => handleItemChange(item.id, 'sgst', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                                    <input type="number" placeholder="CGST%" value={item.cgst} onChange={e => handleItemChange(item.id, 'cgst', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                                    <select value={item.office} onChange={e => handleItemChange(item.id, 'office', e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm">
                                        {offices.map(o => <option key={o.office_id} value={o.office_name}>{o.office_name}</option>)}
                                        {offices.length === 0 && <><option value="Office 1">Office 1</option><option value="Office 2">Office 2</option></>}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Details</h3>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                            <input type="text" placeholder="Bank Name" value={invoiceData.bankName} onChange={e => setInvoiceData({ ...invoiceData, bankName: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                            <input type="text" placeholder="Account No" value={invoiceData.accountNo} onChange={e => setInvoiceData({ ...invoiceData, accountNo: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                            <input type="text" placeholder="IFSC" value={invoiceData.ifscCode} onChange={e => setInvoiceData({ ...invoiceData, ifscCode: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                        </div>
                    </section>
                </div>

                <div className="p-5 border-t bg-slate-50/50 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase">Grand Total</span>
                        <span className="text-xl font-black text-black">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowPreview(!showPreview)} className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl lg:hidden"><Eye size={16} /> {showPreview ? 'Edit' : 'Preview'}</button>
                        <button onClick={saveInvoice} disabled={isSaving} className="flex-[2] bg-black hover:bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                            {isSaving ? "Saving..." : <><Save size={16} /> Save & Generate</>}
                        </button>
                    </div>
                </div>
            </aside>

            <main className={`flex-1 overflow-y-auto bg-slate-300 p-10 flex justify-center custom-scrollbar ${!showPreview ? 'hidden lg:flex' : 'flex'}`}>
                <div ref={previewRef} className="bg-white w-[210mm] min-h-[297mm] p-[10mm] flex flex-col font-sans border border-slate-400">
                    <div className="flex-1 border-2 border-slate-800 flex flex-col">
                        <div className="p-4 text-center border-b-2 border-slate-800 space-y-1">
                            <h1 className="text-2xl font-black tracking-tight">M.ASWATH HOLLOW BRICKS & LORRY SERVICES</h1>
                            <p className="text-[11px] font-bold">8/3157 ANDITHOTTAM , PANDIAN NAGAR</p>
                            <p className="text-[11px] font-bold">TIRUPUR - 641 602 *</p>
                            <p className="text-[11px] font-bold">Phone: 9843083521 . 9842048181 * Email :</p>
                            <p className="text-[11px] font-black underline uppercase">GSTIN : 33CPWPB5671P1Z4</p>
                        </div>
                        <div className="py-1 bg-slate-50 text-center border-b-2 border-slate-800">
                            <span className="text-sm font-black tracking-[0.5em] uppercase">T A X  I N V O I C E</span>
                        </div>
                        <div className="grid grid-cols-2 text-[11px] font-bold">
                            <div className="p-4 border-r-2 border-slate-800 space-y-4">
                                <div className="flex"><span className="w-24">Invoice No. :</span><span className="font-black text-xs">{invoiceData.invoiceId}</span></div>
                                <div className="flex"><span className="w-24">Date :</span><span className="font-black">{new Date(invoiceData.date).toLocaleDateString('en-GB')}</span></div>
                            </div>
                            <div className="p-2 pl-4 space-y-2">
                                <div className="flex"><span className="w-32">Transport Mode :</span><span>{invoiceData.transportMode}</span></div>
                                <div className="flex"><span className="w-32">Vehicle Number :</span><span className="font-black">{invoiceData.vehicleNumber}</span></div>
                                <div className="flex"><span className="w-32">Date Of Supply :</span><span>{new Date(invoiceData.dateOfSupply).toLocaleDateString('en-GB')}</span></div>
                                <div className="flex"><span className="w-32">Delivery Place :</span><span className="uppercase">{invoiceData.deliveryPlace}</span></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 border-y-2 border-slate-800 text-center text-[11px] font-black">
                            <div className="py-1 border-r-2 border-slate-800">Billed To</div>
                            <div className="py-1">Shipped To</div>
                        </div>
                        <div className="grid grid-cols-2 text-[11px] min-h-[120px]">
                            <div className="p-3 border-r-2 border-slate-800 space-y-1">
                                <p className="font-black uppercase">{invoiceData.billingName}</p>
                                <p className="whitespace-pre-wrap leading-relaxed">{invoiceData.billingAddress}</p>
                                <div className="mt-4 pt-10">
                                    <p className="font-bold">GSTIN : <span className="font-black">{invoiceData.billingGstin}</span></p>
                                    <p className="font-bold">State : <span>{invoiceData.billingState}</span></p>
                                </div>
                            </div>
                            <div className="p-3 space-y-1">
                                <p className="font-black uppercase">{sameAsBilled ? invoiceData.billingName : invoiceData.shippingName}</p>
                                <p className="whitespace-pre-wrap leading-relaxed">{sameAsBilled ? invoiceData.billingAddress : invoiceData.shippingAddress}</p>
                                <div className="mt-4 pt-10">
                                    <p className="font-bold">GSTIN : <span className="font-black">{sameAsBilled ? invoiceData.billingGstin : invoiceData.shippingGstin}</span></p>
                                    <p className="font-bold">State : <span>{sameAsBilled ? invoiceData.billingState : invoiceData.shippingState}</span></p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col border-t-2 border-slate-800">
                            <div className="flex border-b-2 border-slate-800 text-[10px] font-black text-center bg-slate-50">
                                <div className="w-12 border-r-2 border-slate-800 py-1">Sr. No.</div>
                                <div className="flex-1 border-r-2 border-slate-800 py-1">Product Details</div>
                                <div className="w-20 border-r-2 border-slate-800 py-1">HSN Code</div>
                                <div className="w-20 border-r-2 border-slate-800 py-1">Quantity</div>
                                <div className="w-12 border-r-2 border-slate-800 py-1">Unit(s)</div>
                                <div className="w-20 border-r-2 border-slate-800 py-1">Rate / Unit</div>
                                <div className="w-24 py-1">Value in Rs.</div>
                            </div>
                            <div className="flex-1 flex">
                                <div className="w-12 border-r-2 border-slate-800 text-center py-2 text-[10px] space-y-2">{items.map((_, i) => <div key={i}>{i + 1}</div>)}</div>
                                <div className="flex-1 border-r-2 border-slate-800 px-2 py-2 text-[11px] font-black space-y-2">{items.map((item, i) => <div key={i} className="uppercase">{item.materialName}</div>)}</div>
                                <div className="w-20 border-r-2 border-slate-800 text-center py-2 text-[10px] space-y-2">{items.map((item, i) => <div key={i}>{item.hsnCode}</div>)}</div>
                                <div className="w-20 border-r-2 border-slate-800 text-center py-2 text-[10px] font-bold space-y-2">{items.map((item, i) => <div key={i}>{item.quantity.toFixed(3)}</div>)}</div>
                                <div className="w-12 border-r-2 border-slate-800 text-center py-2 text-[10px] space-y-2">{items.map((item, i) => <div key={i}>{item.unit}</div>)}</div>
                                <div className="w-20 border-r-2 border-slate-800 text-center py-2 text-[10px] font-bold space-y-2">{items.map((item, i) => <div key={i}>{item.rate.toFixed(2)}</div>)}</div>
                                <div className="w-24 text-right pr-2 py-2 text-[10px] font-black space-y-2">{items.map((item, i) => <div key={i}>{(item.quantity * item.rate).toFixed(2)}</div>)}</div>
                            </div>
                        </div>
                        <div className="flex border-t-2 border-slate-800 text-[11px] font-black">
                            <div className="flex-1 text-right py-1 pr-10 border-r-2 border-slate-800 uppercase tracking-widest">T O T A L  ......</div>
                            <div className="w-[112px] text-center py-1 border-r-2 border-slate-800 pl-4">{totalQty.toFixed(3)}</div>
                            <div className="w-24 text-right py-1 pr-2">{subTotalValue.toFixed(2)}</div>
                        </div>
                        <div className="flex border-t-2 border-slate-800 min-h-[80px]">
                            <div className="flex-1 p-2 space-y-2 border-r-2 border-slate-800">
                                <p className="text-[10px] font-bold">In Words</p>
                                <p className="text-[11px] font-black uppercase leading-relaxed pr-10">{numberToWords(grandTotal)}</p>
                            </div>
                            <div className="w-[204px] flex flex-col">
                                <div className="flex border-b border-slate-800 py-1 text-[11px] font-bold px-2"><span className="flex-1 text-right font-black uppercase">SGST :</span><span className="w-16 text-center">9.00 %</span><span className="w-20 text-right">{totalSgst.toFixed(2)}</span></div>
                                <div className="flex border-b border-slate-800 py-1 text-[11px] font-bold px-2"><span className="flex-1 text-right font-black uppercase">CGST :</span><span className="w-16 text-center">9.00 %</span><span className="w-20 text-right">{totalCgst.toFixed(2)}</span></div>
                                <div className="flex border-b border-slate-800 py-1 text-[11px] font-bold px-2"><span className="flex-1 text-right font-black uppercase">IGST :</span><span className="w-16 text-center">%</span><span className="w-20 text-right">{totalIgst > 0 ? totalIgst.toFixed(2) : ''}</span></div>
                                <div className="flex border-b border-slate-800 py-1 text-[11px] font-bold px-2"><span className="flex-1 text-right font-black uppercase">Round Off :</span><span className="w-16 text-center"></span><span className="w-20 text-right">{roundOffValue.toFixed(2)}</span></div>
                                <div className="flex-1 flex bg-slate-50 items-center justify-between px-2 text-[12px] font-black uppercase tracking-widest"><span>T O T A L ...:</span><span>{grandTotal.toFixed(2)}</span></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 border-t-2 border-slate-800 text-[11px]">
                            <div className="p-3 space-y-1 font-bold border-r-2 border-slate-800">
                                <p>BANK NAME : <span className="font-black uppercase">{invoiceData.bankName}</span></p>
                                <p>ACCOUNT NO. : <span className="font-black">{invoiceData.accountNo}</span></p>
                                <p>IFSC CODE : <span className="font-black">{invoiceData.ifscCode}</span></p>
                            </div>
                            <div className="flex flex-col text-center py-2 px-2 text-[10px] font-black uppercase">
                                <p>For M.ASWATH HOLLOW BRICKS & LORRY SERVICES</p>
                                <div className="flex-1 flex flex-col justify-end"><div className="w-full h-px bg-slate-400 mt-10"></div><p className="mt-2">Authorised Signature</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }`}</style>
        </div>
    );
};

export default AddInvoice;
