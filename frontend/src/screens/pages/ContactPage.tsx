import React, { useState, useEffect } from 'react';
import { Mail, Phone, Clock, CheckCircle, User, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { BASE_URL, getAuthHeader } from '../../api/base';
// Import your config variables (adjust the import path based on your file structure)

interface Contact {
  id: number;
  name: string;
  phone: string;
  email: string;
  isviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

const ContactPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/contact`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch data');
      const data: Contact[] = await response.json();
      
      setContacts(data.sort((a, b) => b.id - a.id));
      setError(null);
    } catch (err) {
      setError('Could not load contacts. Please verify your connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsViewed = async (id: number) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`${BASE_URL}/contact/viewed/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });

      if (response.ok) {
        setContacts(prev => 
          prev.map(c => c.id === id ? { ...c, isviewed: true } : c)
        );
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to mark as viewed. You might need to log in again.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Contact Inbox</h1>
            <p className="text-slate-500 mt-1">Review and manage inquiries from {BASE_URL.includes('localhost') ? 'Local' : 'Remote'}</p>
          </div>
          <button 
            onClick={fetchContacts}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            Refresh List
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center h-80 space-y-4">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
            <p className="text-slate-400 font-medium">Fetching inquiries...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {contacts.map((contact) => (
              <div 
                key={contact.id} 
                className={`group relative bg-white rounded-2xl border transition-all duration-300 ${
                  contact.isviewed ? 'border-slate-100 opacity-80' : 'border-slate-200 shadow-md hover:shadow-xl hover:border-indigo-300'
                }`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl ${contact.isviewed ? 'bg-slate-200' : 'bg-indigo-500'}`} />
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-5">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                      contact.isviewed ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                    }`}>
                      <User size={24} />
                    </div>
                    {!contact.isviewed && (
                      <span className="flex items-center text-[10px] uppercase tracking-widest font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                        New
                      </span>
                    )}
                  </div>

                  <h3 className={`text-lg font-bold leading-tight mb-4 ${contact.isviewed ? 'text-slate-500' : 'text-slate-800'}`}>
                    {contact.name}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-slate-500">
                      <Mail size={14} className="mr-3 shrink-0" />
                      <span className="text-sm truncate font-medium">{contact.email}</span>
                    </div>
                    <div className="flex items-center text-slate-500">
                      <Phone size={14} className="mr-3 shrink-0" />
                      <span className="text-sm font-medium">{contact.phone}</span>
                    </div>
                    <div className="flex items-center text-slate-400 mt-4 pt-4 border-t border-slate-50">
                      <Clock size={14} className="mr-2" />
                      <span className="text-xs font-medium">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => !contact.isviewed && handleMarkAsViewed(contact.id)}
                    disabled={contact.isviewed || updatingId === contact.id}
                    className={`w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border ${
                      contact.isviewed 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600 cursor-default shadow-none'
                        : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-70'
                    }`}
                  >
                    {updatingId === contact.id ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : contact.isviewed ? (
                      <>
                        <CheckCircle size={18} />
                        Viewed
                      </>
                    ) : (
                      <>
                        <Eye size={18} />
                        Mark as Viewed
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactPage;