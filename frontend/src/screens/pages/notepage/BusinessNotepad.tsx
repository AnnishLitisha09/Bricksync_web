import React, { useState, useRef, useEffect, type ChangeEvent } from 'react';
import {
  MapPin, Download, Layout, Eye, Edit3, History, Settings2, Check
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BASE_URL, getAuthHeader } from '../../../api/base';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Font sizes for the editor
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

interface Toggles {
  showDate: boolean;
  showVerifiedId: boolean;
  showSignatory: boolean;
  showGeneratedNote: boolean;
}

const BusinessNotepad: React.FC = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // For mobile view toggle
  const previewRef = useRef<HTMLDivElement>(null);

  const [toggles, setToggles] = useState<Toggles>({
    showDate: true,
    showVerifiedId: true,
    showSignatory: true,
    showGeneratedNote: true
  });

  const [formData, setFormData] = useState<BusinessData>({
    title: { value: "ASWATH HOLLOW BRICKS & LORRY SERVICES", fontSize: 24, fontWeight: 'bold', fontStyle: 'normal' },
    address: { value: "SS Tower, Pandian Nagar Bus Stop,\nPN Road, Tiruppur - 641602", fontSize: 10, fontWeight: 'normal', fontStyle: 'normal' },
    phone: { value: "+91 98420 48181, 98430 83521", fontSize: 12, fontWeight: 'bold', fontStyle: 'normal' },
    email: { value: "bricksync001@gmail.com", fontSize: 10, fontWeight: 'normal', fontStyle: 'normal' },
    website: { value: "www.aswath.online", fontSize: 10, fontWeight: 'bold', fontStyle: 'normal' },
    notes: { value: "To Whom It May Concern,\n\nThis is to certify that we provide premium grade hollow bricks manufactured with high-density materials, ensuring maximum structural integrity. \n\nOur integrated lorry services guarantee door-step delivery within the committed timeframe. We value your business and look forward to a long-term partnership.", fontSize: 14, fontWeight: 'normal', fontStyle: 'normal' },
    companySignature: { value: "M. BALAMANI", fontSize: 14, fontWeight: 'bold', fontStyle: 'normal' },
    verifiedId: { value: "", fontSize: 10, fontWeight: 'bold', fontStyle: 'normal' },
  });

  useEffect(() => {
    // Auto-generate Verified ID on mount
    const randomId = `ASW-${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData(prev => ({
      ...prev,
      verifiedId: { ...prev.verifiedId, value: randomId }
    }));
  }, []);

  const handleTextChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: { ...prev[name as keyof BusinessData], value } }));
  };

  const handleStyleUpdate = (name: keyof BusinessData, key: string, val: any) => {
    setFormData(prev => ({ ...prev, [name]: { ...prev[name], [key]: val } }));
  };

  const toggleFeature = (key: keyof Toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const uploadToBackend = async (pdfBlob: Blob, fileName: string) => {
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('pdf', pdfBlob, fileName);

      const response = await fetch(`${BASE_URL}/notepad/upload-pdf`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'x-folder-name': 'notepad' },
        body: formDataUpload
      });

      if (!response.ok) throw new Error("Backend upload failed");

      // Save notepad statistics and PDF path to database
      await fetch(`${BASE_URL}/notepad/save`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formData,
          pdfPath: `/notepad/${fileName}`,
          filename: fileName,
          toggles
        })
      });

      toast.success(`PDF saved as ${fileName}`);
    } catch (error) {
      console.error("Backend Error:", error);
      toast.error("Failed to save record to database.");
    }
  };

  const downloadPDF = async () => {
    if (!previewRef.current) return;
    try {
      setIsGenerating(true);
      const element = previewRef.current;
      const fileName = `Notepad_${formData.verifiedId.value}.pdf`;

      // Preserve original styles
      const originalStyle = element.getAttribute('style') || '';

      // Prepare element for high-quality capture
      element.style.transform = 'none';
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.zIndex = '9999';

      const canvas = await html2canvas(element, {
        scale: 3, // High scale for clear text and graphics
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794, // Standard A4 width at 96dpi
        height: 1123, // Standard A4 height at 96dpi
      });

      // Revert styles
      element.setAttribute('style', originalStyle);

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      const pdfBlob = pdf.output('blob');
      pdf.save(fileName);

      await uploadToBackend(pdfBlob, fileName);

    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("PDF Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F8FAFC] overflow-hidden">

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-0 lg:relative lg:flex lg:w-[420px] flex-col bg-white border-r border-slate-200 z-30 shadow-xl transition-transform duration-300
        ${!showPreview ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4f46e5] rounded-xl flex items-center justify-center text-white">
              <Layout size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Document Studio</h2>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">DESIGN & EXPORT</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/view-notepad')}
              className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100"
              title="View History"
            >
              <History size={18} />
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="lg:hidden p-2 text-indigo-600 bg-indigo-50 rounded-lg"
            >
              <Eye size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Feature Toggles Section */}
          <div className="bg-[#EEF2FF] p-4 rounded-xl border border-indigo-100 mb-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Settings2 size={16} className="text-indigo-600" />
              <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Document Options</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'showDate', label: 'Issue Date' },
                { id: 'showVerifiedId', label: 'Verified ID' },
                { id: 'showSignatory', label: 'Signatory' },
                { id: 'showGeneratedNote', label: 'Footer Note' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleFeature(item.id as keyof Toggles)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${toggles[item.id as keyof Toggles]
                      ? 'bg-white border-indigo-200 text-indigo-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                >
                  <span className="text-[11px] font-bold">{item.label}</span>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${toggles[item.id as keyof Toggles] ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}>
                    {toggles[item.id as keyof Toggles] && <Check size={10} className="text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {(Object.keys(formData) as Array<keyof BusinessData>).map((key) => (
            <div key={key} className="bg-[#f8fafc] p-4 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</label>
                <div className="flex gap-1">
                  <select
                    className="text-[10px] border rounded p-1 bg-white"
                    value={formData[key].fontSize}
                    onChange={(e) => handleStyleUpdate(key, 'fontSize', parseInt(e.target.value))}
                  >
                    {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
                  </select>
                </div>
              </div>
              {key === 'notes' ? (
                <textarea name={key} value={formData[key].value} onChange={handleTextChange} rows={6} className="w-full p-2 text-sm border rounded bg-white outline-none focus:border-indigo-500 transition-all shadow-inner" />
              ) : (
                <input
                  type="text"
                  name={key}
                  value={formData[key].value}
                  onChange={handleTextChange}
                  readOnly={key === 'verifiedId'}
                  className={`w-full p-2 text-sm border rounded bg-white outline-none focus:border-indigo-500 transition-all ${key === 'verifiedId' ? 'bg-slate-50 text-indigo-600 font-bold border-dashed cursor-not-allowed' : ''}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="p-5 border-t">
          <button onClick={downloadPDF} disabled={isGenerating} className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50">
            {isGenerating ? "Processing..." : <><Download size={18} /> Download & Save</>}
          </button>
        </div>
      </aside>

      {/* MOBILE TOGGLE FAB */}
      {showPreview && (
        <button
          onClick={() => setShowPreview(false)}
          className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#4f46e5] shadow-2xl rounded-full flex items-center justify-center text-white"
        >
          <Edit3 size={24} />
        </button>
      )}

      {/* PREVIEW CONTAINER */}
      <main className={`
        flex-1 h-full overflow-y-auto bg-[#cbd5e1] p-0 md:p-8 flex items-start justify-center custom-scrollbar transition-opacity duration-300
        ${showPreview ? 'opacity-100' : 'opacity-0 lg:opacity-100'}
      `}>
        {/* Wrapper for scaling support on mobile */}
        <div className="py-8 min-h-full flex items-center justify-center">
          <div className="origin-top scale-[0.4] sm:scale-[0.5] md:scale-[0.7] lg:scale-[0.85] xl:scale-100 shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-transform duration-300 flex-shrink-0">
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
                color: '#334155'
              }}
            >
              {/* Header Border */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', backgroundColor: '#4f46e5' }} />

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
                    <span style={{ fontSize: '10px', opacity: 0.7, display: 'block', fontWeight: 'bold', letterSpacing: '1px' }}>CONTACT</span>
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
                zIndex: 1,
                overflowY: 'hidden'
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
                  <div className="flex-shrink-0" style={{ minHeight: '80px' }}>
                    {toggles.showDate && (
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.5px' }}>DATE OF ISSUE</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      </div>
                    )}

                    {toggles.showVerifiedId && (
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.5px' }}>VERIFIED ID</div>
                        <div style={{ fontSize: `${formData.verifiedId.fontSize}px`, fontWeight: 'bold', color: '#4f46e5' }}>
                          {formData.verifiedId.value}
                        </div>
                      </div>
                    )}
                  </div>

                  {toggles.showSignatory && (
                    <div style={{ textAlign: 'center', minWidth: '220px' }}>
                      <div style={{ width: '100%', height: '1.5px', backgroundColor: '#0f172a', marginBottom: '8px' }} />
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
                  )}
                </div>

                {toggles.showGeneratedNote && (
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
                )}
              </footer>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @media (max-width: 640px) {
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        }
      `}</style>
    </div>
  );
};

export default BusinessNotepad;