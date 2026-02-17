import {
  ArrowRight,
  Filter,
  IndianRupee,
  KeyRound,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  User,
  X
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL, FILE_BASE_URL, getAuthHeader } from "../../../api/base";
import { useDriverStore, type DriverType } from "../../../store/driverStore";

interface InternalDriver extends DriverType {
  _id: string;
}

type AmountFilter = "All" | "Below 10000" | "Below 20000" | "Below 30000";

const Staff: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<AmountFilter>("All");
  
  // Track which driver card has the action menu open
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const drivers = useDriverStore((state) => state.drivers);
  const setDrivers = useDriverStore((state) => state.setDrivers);

  const fetchDrivers = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/user/drivers`, { headers: getAuthHeader() });
      const data = await res.json();
      setDrivers(data as InternalDriver[]);
    } catch (error) {
      console.error("Error fetching drivers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (driverId: string | number) => {
    if (!window.confirm("Are you sure you want to delete this driver? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`${BASE_URL}/user/${driverId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (res.ok) {
        // Filter out the deleted driver from the store
        const updatedDrivers = (drivers as InternalDriver[]).filter(d => d.userid !== driverId);
        setDrivers(updatedDrivers);
        setActiveMenu(null);
      } else {
        alert("Failed to delete user. Please try again.");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  useEffect(() => {
    fetchDrivers();
    // Close menu on click outside
    const closeMenu = () => setActiveMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const filteredDrivers = useMemo(() => {
    return (drivers as InternalDriver[]).filter((d) => {
      const amount = Number(d.amount);
      const query = search.toLowerCase();
      const matchesSearch =
        d.name.toLowerCase().includes(query) ||
        (d.phoneNumber && d.phoneNumber.includes(query)) ||
        (d.email && d.email.toLowerCase().includes(query));

      if (filter === "All") return matchesSearch;
      const limit = parseInt(filter.replace("Below ", ""));
      return matchesSearch && amount < limit;
    });
  }, [drivers, search, filter]);

  return (
    <div className="p-4 md:p-10 min-h-screen bg-[#FDFDFD] space-y-10 font-sans">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest">
            <ShieldCheck size={16} />
            Internal Database
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Driver Directory</h1>
          <p className="text-slate-500 font-medium text-lg">Manage personnel details and weekly attendance.</p>
        </div>

        <button
          onClick={() => navigate("/driver/add")}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95 group"
        >
          <Plus size={22} />
          <span className="font-bold">Add New Driver</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative w-full lg:flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-[1.8rem] border-none bg-slate-50 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300"
          />
        </div>

        <div className="flex items-center gap-2 px-4 overflow-x-auto no-scrollbar w-full lg:w-auto">
          <Filter size={18} className="text-slate-400 mr-2 shrink-0" />
          {(["All", "Below 10000", "Below 20000", "Below 30000"] as AmountFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-6 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${filter === f
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs tracking-[0.2em]">Syncing Fleet...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
          {filteredDrivers.map((driver) => (
            <div
              key={driver._id}
              className="group bg-white rounded-[2.5rem] border border-slate-100 p-8 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50/50 transition-all duration-500 flex flex-col relative"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="relative">
                  {driver.imageUrl ? (
                    <img
                      src={`${FILE_BASE_URL}${driver.imageUrl}`}
                      alt={driver.name}
                      className="w-20 h-20 rounded-3xl object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ring-4 ring-slate-50 group-hover:ring-indigo-50"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                      <User className="text-slate-300 group-hover:text-indigo-400" size={32} />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
                </div>
                
                {/* Actions Dropdown */}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === driver._id ? null : driver._id);
                    }}
                    className="text-slate-300 hover:text-slate-600 transition-colors p-2 rounded-xl hover:bg-slate-50"
                  >
                    <MoreVertical size={24} />
                  </button>

                  {activeMenu === driver._id && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                      <div className="p-2 space-y-1">
                        <button 
                          onClick={() => navigate(`/driver/change-password/${driver.userid}`)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
                        >
                          <KeyRound size={18} />
                          Change Password
                        </button>
                        <hr className="border-slate-50 mx-2" />
                        <button 
                          onClick={() => handleDeleteUser(driver.userid)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={18} />
                          Delete User
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1 mb-8">
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                  {driver.name}
                </h3>
                <p className="text-slate-400 font-bold text-xs truncate flex items-center gap-1.5 uppercase tracking-tighter">
                  <Mail size={12} />
                  {driver.email || "No Email Provided"}
                </p>
              </div>

              <div className="mt-auto space-y-6">
                <div className="flex items-center justify-between border-y border-slate-50 py-5">
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly</span>
                    <div className="flex items-center text-slate-900 font-black text-lg">
                      <IndianRupee size={16} className="text-slate-400 mr-0.5" />
                      <span>{Number(driver.amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                    <span className="text-emerald-600 font-black text-[10px] uppercase bg-emerald-50 px-2 py-1 rounded-md">On Duty</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <a
                    href={`tel:${driver.phoneNumber}`}
                    className="flex-1 bg-slate-50 hover:bg-indigo-50 text-slate-900 hover:text-indigo-600 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold text-sm border border-transparent hover:border-indigo-100 active:scale-95"
                  >
                    <Phone size={16} />
                    Call
                  </a>
                  <button
                    onClick={() => navigate(`/driver/view/${driver.userid}`)}
                    className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-600 transition-all shadow-lg"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDrivers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
          <div className="p-6 bg-white rounded-full shadow-sm mb-6">
            <Search className="text-slate-200" size={48} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">No personnel found</h2>
          <p className="text-slate-500 font-medium mt-2">Try adjusting your filters or search query.</p>
        </div>
      )}
    </div>
  );
};

export default Staff;