import React, { useState, useEffect, useRef } from 'react';
import {
    Save, ArrowLeft, Plus, Trash2,
    Eye, FileText, Calendar, Truck, MapPin,
    Building2, Receipt, CreditCard, Loader2
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
        cgstRate: 9,
        driverId: null as number | null
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
    const [drivers, setDrivers] = useState<any[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [stockRes, vehRes, custRes, dryRes] = await Promise.all([
                fetch(`${BASE_URL}/stock`, { headers: getAuthHeader() }),
                fetch(`${BASE_URL}/vehicles`, { headers: getAuthHeader() }),
                fetch(`${BASE_URL}/customers`, { headers: getAuthHeader() }),
                fetch(`${BASE_URL}/user/drivers`, { headers: getAuthHeader() })
            ]);

            const stockData = await stockRes.json();
            const vehData = await vehRes.json();
            const custData = await custRes.json();

            setStocks(stockData || []);
            setVehicles(vehData || []); // Vehicle controller returns array directly
            setCustomers(custData.data || []);

            if (dryRes.ok) {
                const driverData = await dryRes.json();
                setDrivers(driverData.drivers || []); // Extract 'drivers' array from response
            } else {
                setDrivers([]);
            }
        } catch (error) {
            toast.error("Failed to load backend data");
        }
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
        setItems(prevItems => prevItems.map(item => {
            if (item.id === id) {
                let updatedItem = { ...item, [field]: value };

                if (field === 'materialName') {
                    const stock = stocks.find(s => s.stock_id === parseInt(value));
                    if (stock) {
                        updatedItem.materialName = stock.product?.product_name || '';
                        updatedItem.office = stock.office?.office_name || '';
                        updatedItem.materialId = stock.product_id;
                        updatedItem.officeId = stock.office_id;
                        if (stock.product?.hsn_code) updatedItem.hsnCode = stock.product.hsn_code;
                    }
                }

                // Recalculate item total immediately
                const subtotal = updatedItem.quantity * updatedItem.rate;
                const tax = (subtotal * invoiceData.sgstRate) / 100;
                updatedItem.total = subtotal + (tax * 2); // SGST + CGST
                return updatedItem;
            }
            return item;
        }));
    };

    const addItem = () => {
        setItems([...items, {
            id: Math.random().toString(36).substr(2, 9),
            materialName: '', materialId: null,
            office: 'Office 1', officeId: 1,
            quantity: 0, unit: 'NOS', rate: 0,
            hsnCode: '69022090', sgst: 9, cgst: 9, igst: 0, total: 0
        }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) setItems(items.filter(item => item.id !== id));
    };

    // --- CALCULATIONS ---
    const subTotalValue = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const totalTax = (subTotalValue * invoiceData.sgstRate) / 100;
    const finalAmount = subTotalValue + (totalTax * 2);
    const grandTotal = Math.round(finalAmount);
    const roundOffValue = (grandTotal - finalAmount).toFixed(2);

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

    // --- UPDATED SAVE LOGIC ---
    const saveInvoice = async () => {
        if (!invoiceData.billingName || !invoiceData.vehicleNumber) {
            toast.error("Please fill required fields (Billed To Name & Vehicle)");
            return;
        }

        setIsSaving(true);
        try {
            const savedIds: number[] = [];
            let latestInvoiceId = invoiceData.invoiceId;

            for (const item of items) {
                const payload = {
                    ...invoiceData,
                    customerNumber: invoiceData.billingName,
                    customerAddress: invoiceData.billingAddress,
                    materialName: item.materialName,
                    materialId: item.materialId,
                    quantity: item.quantity,
                    ratePerUnit: item.rate,
                    totalAmount: item.total,
                    roundOff: roundOffValue,
                    totalInWords: numberToWords(grandTotal),
                    shippingName: sameAsBilled ? invoiceData.billingName : invoiceData.shippingName,
                    shippingAddress: sameAsBilled ? invoiceData.billingAddress : invoiceData.shippingAddress,
                    shippingGstin: sameAsBilled ? invoiceData.billingGstin : invoiceData.shippingGstin,
                    shippingState: sameAsBilled ? invoiceData.billingState : invoiceData.shippingState,
                };

                const response = await fetch(`${BASE_URL}/invoices/create`, {
                    method: 'POST',
                    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || "Failed to save");

                savedIds.push(result.data.id);
                latestInvoiceId = result.data.invoiceId; // Get the actual ID from DB
            }

            // Update state with the REAL Invoice ID from the database
            setInvoiceData(prev => ({ ...prev, invoiceId: latestInvoiceId }));

            // Force a DOM re-render wait so the new Invoice ID appears in the preview
            await new Promise(resolve => setTimeout(resolve, 500));

            const pdfSuccess = await generateAndUploadPDF(savedIds, latestInvoiceId);

            if (pdfSuccess) {
                toast.success("Invoice and PDF saved!");
                navigate('/invoices/history');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // --- ENHANCED PDF GENERATION ---
    const generateAndUploadPDF = async (dbIds: number[], currentId: string) => {
        if (!previewRef.current) return false;

        setShowPreview(true);
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const element = previewRef.current;
            const fileName = `Invoice_${currentId.replace(/\//g, '-')}.pdf`;

            // FORCE the invoice ID into the live DOM element (bypasses React state timing)
            const idEl = document.getElementById('invoice-id-display');
            const originalText = idEl?.textContent || '';
            if (idEl) idEl.textContent = currentId;

            // Save original styles and force A4 width on the element
            const parent = element.parentElement as HTMLElement;
            const origParentStyle = parent?.style.cssText || '';
            const origElementStyle = element.style.cssText || '';
            if (parent) {
                parent.style.cssText = 'display:flex;justify-content:center;padding:0;overflow:visible;';
            }
            element.style.width = '794px';
            element.style.minWidth = '794px';

            // Wait for layout reflow
            await new Promise(resolve => setTimeout(resolve, 200));

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                width: 794,
                height: element.scrollHeight,
                windowWidth: 794,
                scrollX: 0,
                scrollY: 0,
            });

            // RESTORE original styles and text
            if (parent) parent.style.cssText = origParentStyle;
            element.style.cssText = origElementStyle;
            if (idEl) idEl.textContent = originalText;

            const imgData = canvas.toDataURL('image/jpeg', 0.6);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            pdf.save(fileName);

            // Upload to Server
            const pdfBlob = pdf.output('blob');
            const formData = new FormData();
            formData.append('pdf', pdfBlob, fileName);

            const uploadRes = await fetch(`${BASE_URL}/notepad/upload-pdf`, {
                method: 'POST',
                headers: { ...getAuthHeader(), 'x-folder-name': 'invoices' },
                body: formData
            });

            if (!uploadRes.ok) throw new Error("PDF Upload Failed");

            const { path } = await uploadRes.json();

            await Promise.all(dbIds.map(id =>
                fetch(`${BASE_URL}/invoices/pdf/${id}`, {
                    method: 'PATCH',
                    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pdfPath: path, filename: fileName })
                })
            ));

            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    // --- DERIVED VALUES FOR PREVIEW ---
    const totalSgst = totalTax;
    const totalCgst = totalTax;
    // const totalIgst = 0;

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F8FAFC]  overflow-hidden">
            <aside className={`fixed inset-0 lg:relative lg:flex lg:w-[480px] flex-col bg-white border-r border-slate-200 z-30 shadow-xl transition-transform duration-300 ${!showPreview ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center text-white border border-white/10">
                            <Receipt size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white">Tax Invoice</h2>
                            <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Create & Generate</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/invoices/history')} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <ArrowLeft size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={12} className="text-slate-300" /> Basic Information</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Invoice No</label>
                                <input type="text" value={invoiceData.invoiceId} onChange={e => setInvoiceData({ ...invoiceData, invoiceId: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Invoice Date</label>
                                <input type="date" value={invoiceData.date} onChange={e => setInvoiceData({ ...invoiceData, date: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><Truck size={10} className="text-slate-400" /> Vehicle No</label>
                                <select value={invoiceData.vehicleNumber} onChange={e => setInvoiceData({ ...invoiceData, vehicleNumber: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all outline-none">
                                    <option value="">Select Vehicle</option>
                                    {vehicles.map(v => <option key={v.id} value={v.vehicleNumber}>{v.vehicleNumber}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><MapPin size={10} className="text-slate-400" /> Delivery Place</label>
                                <input type="text" value={invoiceData.deliveryPlace} onChange={e => setInvoiceData({ ...invoiceData, deliveryPlace: e.target.value })} placeholder="e.g. TIRUPUR" className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all outline-none" />
                            </div>
                            <div className="col-span-2 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                                        <Truck size={12} /> Assign Driver
                                    </label>
                                </div>
                                <select
                                    value={invoiceData.driverId || ""}
                                    onChange={e => setInvoiceData({ ...invoiceData, driverId: e.target.value ? parseInt(e.target.value) : null })}
                                    className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                                >
                                    <option value="">Select Driver</option>
                                    {drivers.map(d => (
                                        <option key={d.userid} value={d.userid}>{d.name} ({d.phoneNumber})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Building2 size={12} className="text-slate-300" /> Billing & Shipping</h3>
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
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={12} className="text-slate-300" /> Material Details</h3>
                            <button onClick={addItem} className="p-1.5 text-white bg-slate-900 hover:bg-black rounded-lg transition-all shadow-sm"><Plus size={14} /></button>
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
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CreditCard size={12} className="text-slate-300" /> Tax & Bank Details</h3>
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
                        <button onClick={() => setShowPreview(!showPreview)} className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 lg:hidden hover:bg-slate-50 transition-all"><Eye size={16} /> {showPreview ? 'Edit' : 'Preview'}</button>
                        <button onClick={saveInvoice} disabled={isSaving} className="flex-[2] bg-gradient-to-r from-slate-900 to-black hover:from-black hover:to-slate-800 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/20">
                            {isSaving ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Save size={16} /> Save & Generate</>}
                        </button>
                    </div>
                </div>
            </aside>

            <main className={`flex-1 overflow-y-auto bg-[#f1f5f9] p-4 lg:p-10 flex justify-center custom-scrollbar ${!showPreview ? 'hidden lg:flex' : 'flex'}`}>
                <div ref={previewRef} className="bg-white w-[210mm] min-h-[297mm] flex flex-col font-sans text-black relative mx-auto p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
                    <div className="border border-black flex-1 flex flex-col">
                        {/* Header Section */}
                        <div className="text-center border-b border-black py-3">
                            <h1 className="text-xl font-bold mb-1">M.ASWATH HOLLOW BRICKS & LORRY SERVICES</h1>
                            <p className="text-xs font-bold mb-0.5">8/3157 ANDITHOTTAM . PANDIAN NAGAR</p>
                            <p className="text-xs font-bold mb-0.5">TIRUPUR - 641 602 *</p>
                            <p className="text-xs font-bold mb-0.5">Phone: 9843083521 . 9842048181 * Email : bricksync001@gmail.com </p>
                            <p className="text-xs font-bold">GSTIN : 33CPWPB5671P1Z4</p>
                        </div>

                        {/* Title */}
                        <div className="text-center border-b border-black py-1.5">
                            <h2 className="text-sm font-bold tracking-[0.3em]">T A X I N V O I C E</h2>
                        </div>

                        {/* Invoice & Logistics Details */}
                        <div className="grid grid-cols-2 border-b border-black">
                            {/* Left Side: Invoice Info */}
                            <div className="border-r border-black p-2 flex flex-col justify-center">
                                <table className="w-full text-xs font-bold">
                                    <tbody>
                                        <tr>
                                            <td className="w-2/5 text-right pr-4 py-1.5">Invoice No. :</td>
                                            <td className="py-1.5" id="invoice-id-display">{invoiceData.invoiceId}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-right pr-4 py-1.5">Date :</td>
                                            <td className="py-1.5">{new Date(invoiceData.date).toLocaleDateString('en-GB')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Right Side: Transport Info */}
                            <div className="p-2">
                                <table className="w-full text-xs font-bold">
                                    <tbody>
                                        <tr>
                                            <td className="w-2/5 text-right pr-4 py-1">Transport Mode :</td>
                                            <td className="py-1">{invoiceData.transportMode}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-right pr-4 py-1">Vehicle Number :</td>
                                            <td className="py-1">{invoiceData.vehicleNumber}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-right pr-4 py-1">Date Of Supply :</td>
                                            <td className="py-1">{new Date(invoiceData.dateOfSupply).toLocaleDateString('en-GB')}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-right pr-4 py-1">Delivery Place :</td>
                                            <td className="py-1 uppercase">{invoiceData.deliveryPlace}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Billing & Shipping */}
                        <div className="grid grid-cols-2 border-b border-black min-h-[120px]">
                            {/* Billed To */}
                            <div className="border-r border-black flex flex-col">
                                <div className="text-center font-bold text-xs border-b border-black py-1.5">Billed To</div>
                                <div className="p-2 text-xs font-bold flex flex-col flex-1">
                                    <p className="uppercase mb-1">{invoiceData.billingName}</p>
                                    <p className="uppercase mb-1 whitespace-pre-wrap">{invoiceData.billingAddress}</p>
                                    <div className="mt-auto pt-4 space-y-1">
                                        <p>GSTIN : <span className="font-normal uppercase">{invoiceData.billingGstin || '-'}</span></p>
                                        <p>State : <span className="font-normal uppercase text-left">{invoiceData.billingState || '-'}</span></p>
                                    </div>
                                </div>
                            </div>
                            {/* Shipped To */}
                            <div className="flex flex-col">
                                <div className="text-center font-bold text-xs border-b border-black py-1.5">Shipped To</div>
                                <div className="p-2 text-xs font-bold flex flex-col flex-1">
                                    <p className="uppercase mb-1">{sameAsBilled ? invoiceData.billingName : invoiceData.shippingName}</p>
                                    <p className="uppercase mb-1 whitespace-pre-wrap">{sameAsBilled ? invoiceData.billingAddress : invoiceData.shippingAddress}</p>
                                    <div className="mt-auto pt-4 space-y-1">
                                        <p>GSTIN : <span className="font-normal uppercase">{(sameAsBilled ? invoiceData.billingGstin : invoiceData.shippingGstin) || '-'}</span></p>
                                        <p>State : <span className="font-normal uppercase">{(sameAsBilled ? invoiceData.billingState : invoiceData.shippingState) || '-'}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="flex-1 flex flex-col">
                            <table className="w-full text-xs font-bold border-collapse flex-1 h-full">
                                <thead>
                                    <tr className="border-b border-black text-center">
                                        <th className="py-2 border-r border-black w-16">Sr. No.</th>
                                        <th className="py-2 border-r border-black w-auto">Product Details</th>
                                        <th className="py-2 border-r border-black w-24">HSN Code</th>
                                        <th className="py-2 border-r border-black w-24">Quantity</th>
                                        <th className="py-2 border-r border-black w-20">Unit(s)</th>
                                        <th className="py-2 border-r border-black w-24">Rate / Unit</th>
                                        <th className="py-2 w-28">Value in Rs.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="py-2 border-r border-black text-center align-top">{i + 1}</td>
                                            <td className="py-2 px-2 border-r border-black uppercase align-top">{item.materialName}</td>
                                            <td className="py-2 border-r border-black text-center align-top">{item.hsnCode}</td>
                                            <td className="py-2 border-r border-black text-center align-top">{item.quantity.toFixed(3)}</td>
                                            <td className="py-2 border-r border-black text-center align-top">{item.unit}</td>
                                            <td className="py-2 border-r border-black text-center align-top">{item.rate.toFixed(2)}</td>
                                            <td className="py-2 pr-2 text-right align-top">{(item.quantity * item.rate).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {/* Empty filler row to stretch height to bottom */}
                                    <tr className="h-full">
                                        <td className="border-r border-black"></td>
                                        <td className="border-r border-black"></td>
                                        <td className="border-r border-black"></td>
                                        <td className="border-r border-black"></td>
                                        <td className="border-r border-black"></td>
                                        <td className="border-r border-black"></td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Subtotal Row */}
                        <div className="border-t border-black grid grid-cols-[1fr_24px_24px_20px_24px_28px] text-xs font-bold" style={{ gridTemplateColumns: 'minmax(0,1fr) 96px 80px 96px 112px' }}>
                            <div className="flex items-center justify-center tracking-[0.2em] py-1.5 border-r border-black">
                                T O T A L ......
                            </div>
                            <div className="flex items-center justify-center py-1.5 border-r border-black">
                                {items.reduce((sum, item) => sum + item.quantity, 0).toFixed(3)}
                            </div>
                            <div className="border-r border-black"></div>
                            <div className="border-r border-black"></div>
                            <div className="flex items-center justify-end pr-2 py-1.5">
                                {subTotalValue.toFixed(2)}
                            </div>
                        </div>

                        {/* Bottom Calculations Grid */}
                        <div className="grid grid-cols-[1.5fr_1fr] border-b border-t border-black min-h-[140px]">
                            {/* In Words & Bank */}
                            <div className="border-r border-black flex flex-col h-full">
                                <div className="p-2 border-b border-black flex-1 flex flex-col justify-end pb-4">
                                    <p className="text-[10px] font-normal mb-1">In Words</p>
                                    <p className="text-xs font-bold pl-2 uppercase">{numberToWords(grandTotal)}</p>
                                </div>
                                <div className="p-2 text-xs font-bold space-y-2 py-4 pb-2">
                                    <div className="grid grid-cols-[100px_1fr]">
                                        <span>BANK NAME</span>
                                        <span>: {invoiceData.bankName}</span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr]">
                                        <span>ACCOUNT NO.</span>
                                        <span>: {invoiceData.accountNo}</span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr]">
                                        <span>IFSC CODE</span>
                                        <span>: {invoiceData.ifscCode}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Taxes & Sig */}
                            <div className="flex flex-col h-full">
                                <div className="border-b border-black">
                                    <table className="w-full text-xs font-bold">
                                        <tbody>
                                            <tr>
                                                <td className="py-1 text-center w-24">SGST :</td>
                                                <td className="py-1 text-center w-24">{invoiceData.sgstRate.toFixed(2)} %</td>
                                                <td className="py-1 pr-2 text-right">{totalSgst.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-1 text-center">CGST :</td>
                                                <td className="py-1 text-center">{invoiceData.cgstRate.toFixed(2)} %</td>
                                                <td className="py-1 pr-2 text-right">{totalCgst.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-1 text-center">IGST :</td>
                                                <td className="py-1 text-center">%</td>
                                                <td className="py-1 pr-2 text-right"></td>
                                            </tr>
                                            <tr>
                                                <td className="py-1 text-center">Round Off :</td>
                                                <td className="py-1 text-center"></td>
                                                <td className="py-1 pr-2 text-right">{roundOffValue}</td>
                                            </tr>
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t border-black">
                                                <td colSpan={2} className="py-2 text-center tracking-[0.2em]">T O T A L ..:</td>
                                                <td className="py-2 pr-2 text-right border-l border-black font-bold">{grandTotal.toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                <div className="flex-1 p-2 flex flex-col justify-between pt-3 pb-2 text-xs font-bold">
                                    <p>For M.ASWATH HOLLOW BRICKS & LORRY SERVICES</p>
                                    <p className="text-right pr-6 mt-12 mb-1">Authorised Signature</p>
                                </div>
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
