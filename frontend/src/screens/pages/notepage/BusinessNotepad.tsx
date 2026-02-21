import React, { useState, useRef, type ChangeEvent } from 'react';
import { 
  Phone, MapPin, Download, Globe, Mail, Layout, Printer, Trash2, CheckCircle2, Hash
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Configuration & Constants ---
const FONT_SIZES = [8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48];

interface FieldData { value: string; fontSize: number; fontWeight: string; fontStyle: string; }
interface BusinessData {
  title: FieldData; 
  address: FieldData; 
  phone: FieldData;
  email: FieldData; 
  website: FieldData; 
  notes: FieldData; 
  companySignature: FieldData;
  verifiedId: FieldData;
}

const BusinessNotepad: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<BusinessData>({
    title: { value: "ASWATH HOLLOW BRICKS & LORRY SERVICES", fontSize: 28, fontWeight: 'bold', fontStyle: 'normal' },
    address: { value: "SS Tower, Pandian Nagar Bus Stop,\nPN Road, Tiruppur - 641602", fontSize: 10, fontWeight: 'normal', fontStyle: 'normal' },
    phone: { value: "+91 98420 48181, 98430 83521", fontSize: 12, fontWeight: 'bold', fontStyle: 'normal' },
    email: { value: "bricksync001@gmail.com", fontSize: 10, fontWeight: 'normal', fontStyle: 'normal' },
    website: { value: "www.aswath.online", fontSize: 10, fontWeight: 'bold', fontStyle: 'normal' },
    notes: { value: "To Whom It May Concern,\n\nThis is to certify that we provide premium grade hollow bricks manufactured with high-density materials, ensuring maximum structural integrity. \n\nOur integrated lorry services guarantee door-step delivery within the committed timeframe. We value your business and look forward to a long-term partnership.", fontSize: 14, fontWeight: 'normal', fontStyle: 'normal' },
    companySignature: { value: "M. BALAMANI", fontSize: 14, fontWeight: 'bold', fontStyle: 'normal' },
    verifiedId: { value: `ASW-${Math.floor(100000 + Math.random() * 900000)}`, fontSize: 10, fontWeight: 'bold', fontStyle: 'normal' },
  });

  const handleTextChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: { ...prev[name as keyof BusinessData], value } }));
  };

  const handleStyleUpdate = (name: keyof BusinessData, key: string, val: any) => {
    setFormData(prev => ({ ...prev, [name]: { ...prev[name], [key]: val } }));
  };

  const downloadPDF = async () => {
    if (!previewRef.current) return;
    try {
      setIsGenerating(true);
      const element = previewRef.current;
      window.scrollTo(0, 0);

      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true, 
        logging: false,
        backgroundColor: "#ffffff",
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${formData.verifiedId.value}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F8FAFC] overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-full lg:w-[420px] flex flex-col bg-white border-r border-slate-200 z-20 shadow-xl">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4f46e5] rounded-xl flex items-center justify-center text-white">
            <Layout size={20} />
          </div>
          <h2 className="text-base font-bold text-slate-800">Document Studio</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {(Object.keys(formData) as Array<keyof BusinessData>).map((key) => (
            <div key={key} className="bg-[#f8fafc] p-4 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</label>
                <div className="flex gap-1">
                  <select 
                    className="text-[10px] border rounded p-1"
                    value={formData[key].fontSize}
                    onChange={(e) => handleStyleUpdate(key, 'fontSize', parseInt(e.target.value))}
                  >
                    {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
                  </select>
                </div>
              </div>
              {key === 'notes' ? (
                <textarea name={key} value={formData[key].value} onChange={handleTextChange} rows={4} className="w-full p-2 text-sm border rounded bg-white outline-none focus:border-indigo-500" />
              ) : (
                <input type="text" name={key} value={formData[key].value} onChange={handleTextChange} className="w-full p-2 text-sm border rounded bg-white outline-none focus:border-indigo-500" />
              )}
            </div>
          ))}
        </div>

        <div className="p-5 border-t">
          <button onClick={downloadPDF} disabled={isGenerating} className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100">
            {isGenerating ? "Processing..." : <><Download size={18} /> Download Bill</>}
          </button>
        </div>
      </aside>

      {/* PREVIEW CONTAINER */}
      <main className="flex-1 overflow-auto bg-[#cbd5e1] p-8 flex justify-center custom-scrollbar">
        <div 
          ref={previewRef}
          className="bg-white"
          style={{ 
            width: '210mm', 
            height: '297mm', 
            padding: '20mm', 
            boxSizing: 'border-box', 
            display: 'flex',
            flexDirection: 'column',
            position: 'relative', 
            fontFamily: 'Arial, sans-serif', 
            color: '#334155',
            overflow: 'hidden'
          }}
        >
          {/* Decorative Header Accent */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '240px', height: '240px', backgroundColor: '#f8fafc', borderBottomLeftRadius: '120px', zIndex: 0 }} />

          {/* HEADER SECTION */}
          <header style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', marginBottom: '40px', zIndex: 1 }}>
            <div style={{ maxWidth: '60%' }}>
              <h1 style={{ 
                fontSize: `${formData.title.fontSize}px`, fontWeight: formData.title.fontWeight, 
                color: '#1e293b', marginBottom: '15px', lineHeight: '1.1' 
              }}>{formData.title.value}</h1>
              <div style={{ display: 'flex', gap: '10px', fontSize: `${formData.address.fontSize}px`, color: '#64748b' }}>
                <MapPin size={14} color="#4f46e5" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{formData.address.value}</p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
                <span style={{ fontSize: '10px', opacity: 0.7, display: 'block', fontWeight: 'bold' }}>CONTACT</span>
                <div style={{ fontSize: `${formData.phone.fontSize}px`, fontWeight: 'bold' }}>{formData.phone.value}</div>
              </div>
              <div style={{ fontSize: `${formData.email.fontSize}px`, color: '#64748b', marginBottom: '4px' }}>{formData.email.value}</div>
              <div style={{ fontSize: `${formData.website.fontSize}px`, color: '#4f46e5', fontWeight: 'bold' }}>{formData.website.value}</div>
            </div>
          </header>

          {/* CONTENT SECTION */}
          <div style={{ 
            flex: 1, 
            paddingTop: '30px', 
            fontSize: `${formData.notes.fontSize}px`, 
            fontWeight: formData.notes.fontWeight,
            lineHeight: '1.7', 
            whiteSpace: 'pre-wrap',
            zIndex: 1
          }}>
            {formData.notes.value}
          </div>

          {/* FOOTER SECTION */}
          <footer style={{ 
            paddingTop: '20px', 
            borderTop: '1px solid #e2e8f0', 
            zIndex: 1
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
              {/* Left Side: Date and ID */}
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.5px' }}>DATE OF ISSUE</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>{new Date().toLocaleDateString('en-US')}</div>
                
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.5px' }}>VERIFIED ID</div>
                <div style={{ fontSize: `${formData.verifiedId.fontSize}px`, fontWeight: 'bold', color: '#4f46e5' }}>
                   {formData.verifiedId.value}
                </div>
              </div>

              {/* Right Side: Signature */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '200px', height: '1.5px', backgroundColor: '#0f172a', marginBottom: '8px' }} />
                <div style={{ 
                  fontSize: `${formData.companySignature.fontSize}px`, 
                  fontWeight: 'bold', 
                  color: '#1e293b',
                  textTransform: 'uppercase'
                }}>
                  {formData.companySignature.value}
                </div>
                <div style={{ fontSize: '9px', color: '#4f46e5', fontWeight: 'bold', letterSpacing: '1.5px', marginTop: '4px' }}>
                  AUTHORIZED SIGNATORY
                </div>
              </div>
            </div>

            {/* Bottom Center: Computer Generated Disclaimer */}
            <div style={{ 
              textAlign: 'center', 
              borderTop: '1px dashed #cbd5e1', 
              paddingTop: '10px', 
              marginTop: '10px' 
            }}>
              <p style={{ 
                fontSize: '9px', 
                color: '#94a3b8', 
                fontStyle: 'italic', 
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                This is a computer generated Letter.
              </p>
            </div>
          </footer>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default BusinessNotepad;