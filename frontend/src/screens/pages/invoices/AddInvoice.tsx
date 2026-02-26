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
        customerAddress: '',

        sgstRate: 9,
        cgstRate: 9
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
    const [stocks, setStocks] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [stockRes, vehRes, custRes] = await Promise.all([
                fetch(`${BASE_URL}/stock`, { headers: getAuthHeader() }),
                fetch(`${BASE_URL}/vehicles`, { headers: getAuthHeader() }),
                fetch(`${BASE_URL}/customers`, { headers: getAuthHeader() })
            ]);

            const stockData = await stockRes.json();
            const vehData = await vehRes.json();
            const custData = await custRes.json();

            setStocks(stockData || []);
            setVehicles(vehData || []); // Vehicle controller returns array directly
            setCustomers(custData.data || []);
        } catch (error) {
            toast.error("Failed to load backend data");
        }
    };

    const calculateItemTotal = (item: InvoiceItem) => {
        const subtotal = item.quantity * item.rate;
        const sgstAmount = (subtotal * invoiceData.sgstRate) / 100;
        const cgstAmount = (subtotal * invoiceData.cgstRate) / 100;
        const igstAmount = (subtotal * item.igst) / 100;
        return subtotal + sgstAmount + cgstAmount + igstAmount;
    };

    const handleCustomerChange = (name: string) => {
        const customer = customers.find(c => c.name === name);
        if (customer) {
            setInvoiceData({
                ...invoiceData,
                billingName: customer.name,
                billingAddress: customer.address || '-',
                billingGstin: customer.category || '-', // Assuming GSTIN might be in category or just placeholder
                billingState: 'TAMIL NADU', // Default or from customer if available
                customerPhone: customer.phone_no || '',
                customerAddress: customer.address || ''
            });
        } else {
            setInvoiceData({ ...invoiceData, billingName: name });
        }
    };

    const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
        const updatedItems = items.map(item => {
            if (item.id === id) {
                let updatedItem = { ...item, [field]: value };

                if (field === 'materialName') {
                    // Expecting value to be "StockId"
                    const stock = stocks.find(s => s.stock_id === parseInt(value));
                    if (stock) {
                        updatedItem.materialName = stock.product?.product_name || '';
                        updatedItem.office = stock.office?.office_name || '';
                        updatedItem.materialId = stock.product_id;
                        updatedItem.officeId = stock.office_id;
                        if (stock.product?.hsn_code) updatedItem.hsnCode = stock.product.hsn_code;
                    }
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


    const subTotalValue = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const totalSgst = items.reduce((sum, item) => sum + ((item.quantity * item.rate * invoiceData.sgstRate) / 100), 0);
    const totalCgst = items.reduce((sum, item) => sum + ((item.quantity * item.rate * invoiceData.cgstRate) / 100), 0);
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
            const savedIds: number[] = [];
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
                    sgst: invoiceData.sgstRate,
                    cgst: invoiceData.cgstRate,
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
                savedIds.push(result.data.id);

                // CRITICAL: Sync the generated invoice ID from the backend to the UI state
                if (result.data.invoiceId && invoiceData.invoiceId !== result.data.invoiceId) {
                    setInvoiceData(prev => ({ ...prev, invoiceId: result.data.invoiceId }));
                }
            }

            // Small delay to ensure React state update renders the new ID in the DOM
            await new Promise(resolve => setTimeout(resolve, 300));

            // Generate ONE PDF for all items and upload
            const pdfSuccess = await generateAndUploadPDF(savedIds);

            if (pdfSuccess) {
                toast.success("Invoices saved successfully!");
                navigate('/invoices/history');
            } else {
                toast.error("Invoice records created, but PDF sync failed. Check history.");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const generateAndUploadPDF = async (dbIds: number[]) => {
        if (!previewRef.current) return false;
        const wasPreview = showPreview;
        setShowPreview(true);
        window.scrollTo(0, 0); // Ensure no scroll offset
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const element = previewRef.current;
            const fileName = `Invoice_${invoiceData.invoiceId.replace(/\//g, '-')}_${Date.now()}.pdf`;

            console.log("Generating Canvas...");
            const canvas = await html2canvas(element, {
                scale: 3, // Increased scale for crispness
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                width: 794, // Fixed width for A4 (210mm @ 96dpi)
                windowWidth: 794,
            });

            console.log("Creating PDF...");
            const imgData = canvas.toDataURL('image/jpeg', 0.98); // High quality JPEG
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
                hotfixes: ["px_tracking"]
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();

            // Calculate dimensions to fill A4 width exactly
            const canvasAspectRatio = canvas.height / canvas.width;
            const finalWidth = pdfWidth;
            const finalHeight = pdfWidth * canvasAspectRatio;

            // Align to top-left (0,0) to use full A4 area
            pdf.addImage(imgData, 'JPEG', 0, 0, finalWidth, finalHeight, undefined, 'FAST');

            console.log("Saving PDF locally...");
            pdf.save(fileName);

            const pdfBlob = pdf.output('blob');
            const formDataUpload = new FormData();
            formDataUpload.append('pdf', pdfBlob, fileName);

            console.log("Uploading PDF to backend...");
            const uploadRes = await fetch(`${BASE_URL}/notepad/upload-pdf`, {
                method: 'POST',
                headers: { ...getAuthHeader(), 'x-folder-name': 'invoices' },
                body: formDataUpload
            });

            if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                console.error("Upload failed:", errorText);
                throw new Error(`Upload failed: ${uploadRes.status} ${errorText}`);
            }

            const uploadResult = await uploadRes.json();
            const pdfPath = uploadResult.path;
            console.log("Upload success, path:", pdfPath);

            console.log("Updating database records:", dbIds);
            const patchResults = await Promise.all(dbIds.map(async id => {
                const res = await fetch(`${BASE_URL}/invoices/pdf/${id}`, {
                    method: 'PATCH',
                    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pdfPath: pdfPath, filename: fileName })
                });
                if (!res.ok) {
                    const errTxt = await res.text();
                    console.error(`Failed to update DB for ID ${id}:`, errTxt);
                    return false;
                }
                return true;
            }));

            if (patchResults.includes(false)) {
                throw new Error("Some database path updates failed");
            }

            return true;
        } catch (err: any) {
            console.error("PDF Process Error:", err);
            toast.error(err.message || "PDF storage failed");
            return false;
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
                                    {vehicles.map(v => <option key={v.id} value={v.vehicleNumber}>{v.vehicleNumber}</option>)}
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
                            <select
                                value={invoiceData.billingName}
                                onChange={e => handleCustomerChange(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                            >
                                <option value="">Select Customer</option>
                                {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
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
                                <select
                                    value={stocks.find(s => s.product_id === item.materialId && s.office_id === item.officeId)?.stock_id || ""}
                                    onChange={e => handleItemChange(item.id, 'materialName', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                                >
                                    <option value="">Select Material & Office</option>
                                    {stocks.map(s => (
                                        <option key={s.stock_id} value={s.stock_id}>
                                            {s.product?.product_name} ({s.office?.office_name}) - Stock: {s.quantity}
                                        </option>
                                    ))}
                                </select>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-1">
                                        <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase">Quantity</label>
                                        <input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase">Rate</label>
                                        <input type="number" placeholder="Rate" value={item.rate} onChange={e => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase">HSN</label>
                                        <input type="text" placeholder="HSN" value={item.hsnCode} onChange={e => handleItemChange(item.id, 'hsnCode', e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax & Bank Details</h3>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase">SGST %</label>
                                    <input type="number" value={invoiceData.sgstRate} onChange={e => setInvoiceData({ ...invoiceData, sgstRate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase">CGST %</label>
                                    <input type="number" value={invoiceData.cgstRate} onChange={e => setInvoiceData({ ...invoiceData, cgstRate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                                </div>
                            </div>
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

            <main className={`flex-1 overflow-y-auto bg-[#f1f5f9] p-4 lg:p-10 flex justify-center custom-scrollbar ${!showPreview ? 'hidden lg:flex' : 'flex'}`}>
                <div ref={previewRef} className="bg-white w-[210mm] min-h-[297mm] p-[12mm] flex flex-col font-sans text-[#1e293b] relative border border-[#e2e8f0]">

                    {/* Top Accent Bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#0f172a]"></div>

                    {/* Header Section */}
                    <div className="flex justify-between items-start mb-6 mt-2">
                        <div className="space-y-1.5">
                            <h1 className="text-2xl font-black tracking-tight text-[#0f172a] leading-none">M.ASWATH</h1>
                            <div className="flex flex-col text-[9px] font-bold text-[#64748b] tracking-wider uppercase">
                                <span>Hollow Bricks & Lorry Services</span>
                                <span className="text-[#8b97a8]">Tirupur, Tamil Nadu</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-[#f8fafc] border border-[#e2e8f0] px-3 py-1.5 rounded-lg inline-block text-right">
                                <p className="text-[8px] font-black text-[#64748b] uppercase tracking-widest mb-0.5">Invoice Number</p>
                                <p className="text-base font-black text-[#0f172a] leading-none">{invoiceData.invoiceId}</p>
                            </div>
                            <p className="mt-1.5 text-[9px] font-bold text-[#94a3b8] italic">Date: {new Date(invoiceData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* Corporate Info Row */}
                    <div className="grid grid-cols-3 gap-6 mb-6 py-4 border-y border-[#f1f5f9] bg-[#fbfcfd] px-2">
                        <div className="space-y-0.5">
                            <h3 className="text-[8px] font-black text-[#64748b] uppercase tracking-[0.15em] mb-1">Registered Office</h3>
                            <p className="text-[10px] font-bold leading-relaxed">8/3157 Andithottam, Pandian Nagar<br />Tirupur - 641 602, TN</p>
                        </div>
                        <div className="space-y-0.5 text-center">
                            <h3 className="text-[8px] font-black text-[#64748b] uppercase tracking-[0.15em] mb-1">Contact Details</h3>
                            <p className="text-[10px] font-black text-[#0f172a]">+91 98430 83521</p>
                            <p className="text-[10px] font-black text-[#0f172a]">+91 98420 48181</p>
                        </div>
                        <div className="space-y-0.5 text-right">
                            <h3 className="text-[8px] font-black text-[#64748b] uppercase tracking-[0.15em] mb-1">Tax Registration</h3>
                            <p className="text-[11px] font-black text-[#0f172a]">GSTIN: 33CPWPB5671P1Z4</p>
                            <span className="text-[8px] bg-[#f1f5f9] text-[#64748b] px-2 py-0.5 rounded font-black uppercase tracking-wider mt-0.5 inline-block">Tamil Nadu (33)</span>
                        </div>
                    </div>

                    {/* Billing & Logistics Section */}
                    <div className="grid grid-cols-2 gap-8 mb-6">
                        {/* Billed To */}
                        <div className="space-y-3">
                            <div className="border-l-2 border-[#0f172a] pl-3">
                                <h3 className="text-[9px] font-black text-[#64748b] uppercase tracking-widest mb-2">Bill To</h3>
                                <p className="text-[13px] font-black text-[#0f172a] uppercase mb-1">{invoiceData.billingName}</p>
                                <p className="text-[10px] font-medium text-[#475569] leading-relaxed mb-3 uppercase min-h-[30px]">{invoiceData.billingAddress}</p>
                                <div className="flex gap-4 mt-2 pt-2 border-t border-[#f1f5f9] text-[10px]">
                                    <div className="flex flex-col"><span className="text-[8px] text-[#94a3b8] font-bold uppercase mb-0.5">GSTIN</span><span className="font-black text-[#0f172a] uppercase">{invoiceData.billingGstin || 'N/A'}</span></div>
                                    <div className="flex flex-col"><span className="text-[8px] text-[#94a3b8] font-bold uppercase mb-0.5">Place</span><span className="font-black text-[#0f172a] uppercase">{invoiceData.deliveryPlace}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Logistics Details */}
                        <div className="bg-[#f8fafc] p-4 rounded-xl border border-[#edeff2] relative overflow-hidden">
                            <h3 className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest mb-3">Transport Information</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-[#f1f5f9]">
                                    <span className="text-[9px] font-bold text-[#94a3b8] uppercase">Vehicle</span>
                                    <span className="text-[11px] font-black text-[#0f172a] uppercase">{invoiceData.vehicleNumber}</span>
                                </div>
                                <div className="flex justify-between items-center px-1 text-[10px]">
                                    <span className="font-bold text-[#94a3b8] uppercase">Supply Date</span>
                                    <span className="font-bold text-[#334155]">{new Date(invoiceData.dateOfSupply).toLocaleDateString('en-GB')}</span>
                                </div>
                                <div className="flex justify-between items-center px-1 text-[10px]">
                                    <span className="font-bold text-[#94a3b8] uppercase">Transport Mode</span>
                                    <span className="font-bold text-[#334155] uppercase">{invoiceData.transportMode}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="flex-1 mb-6">
                        <div className="rounded-lg border border-[#e2e8f0] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#0f172a] text-white">
                                        <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-widest w-10 text-center text-[#d1d5db]">#</th>
                                        <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-widest">Product / Service Description</th>
                                        <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-widest text-center">HSN</th>
                                        <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-widest text-center">Quantity</th>
                                        <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-widest text-right">Rate</th>
                                        <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-widest text-right">Amount (INR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, i) => (
                                        <tr key={i} className={`border-b border-[#f1f5f9] ${i % 2 === 0 ? 'bg-white' : 'bg-[#fbfcfd]'}`}>
                                            <td className="py-3 px-3 text-center text-[10px] font-bold text-[#94a3b8]">{i + 1}</td>
                                            <td className="py-3 px-3">
                                                <p className="text-[11px] font-black text-[#0f172a] uppercase leading-none">{item.materialName}</p>
                                                <p className="text-[8px] font-bold text-[#bec7d1] mt-1 uppercase">Standard Unit: {item.unit}</p>
                                            </td>
                                            <td className="py-3 px-3 text-center text-[10px] font-bold text-[#475569]">{item.hsnCode}</td>
                                            <td className="py-3 px-3 text-center text-[11px] font-black text-[#0f172a]">{item.quantity.toFixed(3)}</td>
                                            <td className="py-3 px-3 text-right text-[10px] font-bold text-[#475569]">₹{item.rate.toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right text-[11px] font-black text-[#0f172a]">₹{(item.quantity * item.rate).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {/* Subtotal row within table for clean look */}
                                    <tr className="bg-[#f8fafc]">
                                        <td colSpan={5} className="py-2.5 px-4 text-right text-[9px] font-black text-[#94a3b8] uppercase tracking-widest">Sub Total</td>
                                        <td className="py-2.5 px-4 text-right text-[11px] font-black text-[#0f172a]">₹{subTotalValue.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary & Footer */}
                    <div className="mt-auto">
                        <div className="grid grid-cols-[1.3fr_1fr] gap-8">
                            {/* Left Side: Bank & Words */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-[8px] font-black text-[#94a3b8] uppercase tracking-widest">Amount in Words</h3>
                                    <p className="text-[11px] font-black text-[#0f172a] uppercase italic bg-[#f8fafc] p-3 rounded-lg border border-[#f1f5f9] leading-tight underline decoration-[#e2e8f0] underline-offset-4">
                                        {numberToWords(grandTotal)} Only
                                    </p>
                                </div>
                                <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#fafbfc] rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                                    <h3 className="text-[8px] font-black text-[#94a3b8] uppercase tracking-widest mb-3 relative">Remittance Details</h3>
                                    <div className="space-y-1.5 relative">
                                        <div className="flex justify-between text-[10px]"><span className="text-[#94a3b8] font-bold uppercase">Bank</span><span className="font-black text-[#334155] uppercase">{invoiceData.bankName}</span></div>
                                        <div className="flex justify-between text-[10px]"><span className="text-[#94a3b8] font-bold uppercase">Account</span><span className="font-black text-[#334155]">{invoiceData.accountNo}</span></div>
                                        <div className="flex justify-between text-[10px]"><span className="text-[#94a3b8] font-bold uppercase">IFSC</span><span className="font-black text-[#334155] uppercase">{invoiceData.ifscCode}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Total Calculation */}
                            <div className="space-y-2.5 bg-[#f8fafc] p-3 rounded-xl border border-[#f1f5f9]">
                                <div className="flex justify-between items-center text-[10px] px-2">
                                    <span className="font-bold text-[#64748b]">SGST ({invoiceData.sgstRate}%)</span>
                                    <span className="font-black text-[#0f172a]">₹{totalSgst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] px-2">
                                    <span className="font-bold text-[#64748b]">CGST ({invoiceData.cgstRate}%)</span>
                                    <span className="font-black text-[#0f172a]">₹{totalCgst.toFixed(2)}</span>
                                </div>
                                {totalIgst > 0 && (
                                    <div className="flex justify-between items-center text-[10px] px-2">
                                        <span className="font-bold text-[#64748b]">IGST</span>
                                        <span className="font-black text-[#0f172a]">₹{totalIgst.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-[9px] px-2 text-[#94a3b8] italic">
                                    <span className="font-medium">Round off</span>
                                    <span>₹{roundOffValue.toFixed(2)}</span>
                                </div>
                                <div className="h-[1px] bg-[#e5e7eb] my-1.5"></div>
                                <div className="bg-[#0f172a] text-white p-4 rounded-xl border-4 border-white mb-1">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-[#9ca3af]">Total Payable</p>
                                            <p className="text-xl font-black">₹{grandTotal.toFixed(2)}</p>
                                        </div>
                                        <div className="text-right pb-1">
                                            <span className="text-[7px] font-black uppercase tracking-widest block text-[#6b7280] leading-none">Net Amount</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Signature & Disclaimer */}
                        <div className="mt-8 flex justify-between items-end pt-6 border-t border-[#f1f5f9]">
                            <div className="text-[8px] text-[#94a3b8] font-bold max-w-[280px] leading-relaxed italic">
                                <p>* This is a secure system-generated document. No physical signature is required.</p>
                                <p className="mt-1 text-[#bec7d1] uppercase tracking-tighter text-[7.5px]">Tirupur Jurisdiction</p>
                            </div>
                            <div className="text-center w-[220px]">
                                <p className="text-[8px] font-black text-[#94a3b8] uppercase tracking-widest mb-8">Authorised Certification</p>
                                <div className="h-[1px] bg-[#2d3748] w-full mb-2"></div>
                                <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-wide">For M.ASWATH HOLLOW BRICKS</p>
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
