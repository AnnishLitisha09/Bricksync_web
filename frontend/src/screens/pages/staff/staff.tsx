import {
  ArrowRight,
  Briefcase,
  ExternalLink,
  KeyRound,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  User,
  Users
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL, FILE_BASE_URL, getAuthHeader } from "../../../api/base";
import { useDriverStore, type DriverType } from "../../../store/driverStore";

interface InternalDriver extends Omit<DriverType, 'status'> {
  _id: string;
  staffRole?: string;
  status?: "Active" | "Inactive" | "On Leave" | "Away"; 
}

const Staff: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const drivers = useDriverStore((state) => state.drivers) as InternalDriver[];
  const setDrivers = useDriverStore((state) => state.setDrivers);

  const fetchDrivers = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/user/drivers`, { headers: getAuthHeader() });
      const data = await res.json();
      setDrivers(data as DriverType[]);
    } catch (error) {
      console.error("Error fetching drivers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (driverId: string | number) => {
    if (!window.confirm("Permanent Action: Delete this personnel record?")) return;
    try {
      const res = await fetch(`${BASE_URL}/user/${driverId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        const updatedDrivers = drivers.filter(d => d.userid !== driverId);
        setDrivers(updatedDrivers as DriverType[]);
        setActiveMenu(null);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  useEffect(() => {
    fetchDrivers();
    const closeMenu = () => setActiveMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const query = search.toLowerCase();
      return (
        d.name.toLowerCase().includes(query) ||
        (d.phoneNumber && d.phoneNumber.includes(query)) ||
        (d.email && d.email.toLowerCase().includes(query)) ||
        (d.staffRole && d.staffRole.toLowerCase().includes(query))
      );
    });
  }, [drivers, search]);

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#F8FAFC] space-y-10 font-sans">
      
      {/* --- Enhanced Header --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-[0.3em]">
            <ShieldCheck size={16} className="animate-pulse" />
            Security Verified
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">
            Staff <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Directory</span>
          </h1>
          <p className="text-slate-500 font-medium">Manage institutional access and personnel profiles.</p>
        </div>

        <div className="flex items-center gap-4">
            <div className="bg-white px-6 py-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-indigo-50 p-2 rounded-xl">
                  <Users size={24} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Fleet</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">{drivers.length}</p>
                </div>
            </div>
            <button
                onClick={() => navigate("/driver/add")}
                className="group flex items-center gap-3 px-8 py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-3xl transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95 font-bold"
            >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                Add Member
            </button>
        </div>
      </div>

      {/* --- Search Section --- */}
      <div className="relative max-w-3xl mx-auto lg:mx-0">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="text-slate-400" size={22} />
        </div>
        <input
          type="text"
          placeholder="Search by name, role, or ID number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-16 pr-8 py-6 rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/60 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 text-lg"
        />
      </div>

      {/* --- Identity Cards Grid --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-14 h-14 border-[6px] border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Decrypting Database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 gap-8">
          {filteredDrivers.map((driver) => (
            <div
              key={driver._id}
              className="group bg-white rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row overflow-hidden hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 ease-out"
            >
              {/* Left Portrait Section */}
              <div className="md:w-52 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-200/20 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                    <div className="p-1 bg-white rounded-[2rem] shadow-xl">
                      {driver.imageUrl ? (
                          <img
                          src={`${FILE_BASE_URL}${driver.imageUrl}`}
                          alt={driver.name}
                          className="w-32 h-32 md:w-36 md:h-36 rounded-[1.8rem] object-cover"
                          />
                      ) : (
                          <div className="w-32 h-32 md:w-36 md:h-36 rounded-[1.8rem] bg-slate-50 flex items-center justify-center border border-slate-100">
                          <User className="text-slate-200" size={48} />
                          </div>
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-[5px] border-white shadow-lg ${driver.status === 'Inactive' ? 'bg-slate-300' : 'bg-emerald-500'}`}></div>
                </div>
                
                <div className="mt-6 text-center z-10">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Registration</p>
                  <p className="text-slate-900 font-black text-sm">#{driver.userid?.toString().slice(-6) || "000000"}</p>
                </div>
              </div>

              {/* Right Details Section */}
              <div className="flex-1 p-8 md:p-10 flex flex-col relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${driver.status === 'Inactive' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        ● {driver.status || 'Active'}
                      </span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                      {driver.name}
                    </h3>
                    <p className="text-slate-400 font-bold text-sm flex items-center gap-2">
                        <Briefcase size={16} className="text-indigo-500" />
                        {driver.staffRole || "Executive Personnel"}
                    </p>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === driver._id ? null : driver._id);
                      }}
                      className="text-slate-300 hover:text-slate-900 p-2 rounded-2xl hover:bg-slate-50 transition-all"
                    >
                      <MoreVertical size={24} />
                    </button>
                    {activeMenu === driver._id && (
                      <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden py-2 animate-in fade-in zoom-in duration-200">
                        <button 
                          onClick={() => navigate(`/driver/change-password/${driver.userid}`)}
                          className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <KeyRound size={16} /> Security Access
                        </button>
                        <div className="h-[1px] bg-slate-50 mx-4 my-1" />
                        <button 
                          onClick={() => handleDeleteUser(driver.userid)}
                          className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} /> Terminate Record
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Email</p>
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm truncate">
                      <Mail size={14} className="text-indigo-400 shrink-0" />
                      {driver.email || "N/A"}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Line</p>
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                      <Phone size={14} className="text-indigo-400 shrink-0" />
                      {driver.phoneNumber || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center gap-3">
                  <a
                    href={`tel:${driver.phoneNumber}`}
                    className="flex-1 bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all duration-300 font-bold text-sm shadow-lg shadow-slate-200"
                  >
                    Direct Contact
                  </a>
                  <button
                    onClick={() => navigate(`/driver/view/${driver.userid}`)}
                    className="px-6 py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-[1.5rem] hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all group/btn"
                  >
                    <ExternalLink size={20} className="group-hover/btn:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Empty State --- */}
      {!loading && filteredDrivers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 p-10 rounded-full mb-6">
            <Search className="text-slate-200" size={80} />
          </div>
          <h2 className="text-3xl font-black text-slate-800">No Personnel Found</h2>
          <p className="text-slate-400 font-medium mt-2 max-w-xs text-center">
            We couldn't find any staff matching your current search criteria.
          </p>
          <button 
            onClick={() => setSearch("")}
            className="mt-8 text-indigo-600 font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Staff;