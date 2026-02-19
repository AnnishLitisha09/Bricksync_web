import {
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
  Users,
  Fingerprint,
  ChevronLeft,
  ChevronRight
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Grid items per page

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

  const paginatedDrivers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDrivers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDrivers, currentPage]);

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="p-4 sm:p-8 lg:p-12 min-h-screen bg-[#FBFDFF] space-y-8 font-sans">

      {/* --- Header Section --- */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-600 font-bold text-[10px] uppercase tracking-widest border border-indigo-100">
            <ShieldCheck size={14} />
            Verified System Access
          </div>
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
              Personnel <span className="text-indigo-600">Hub</span>
            </h1>
            <p className="mt-3 text-slate-500 font-medium text-lg max-w-xl">
              Centralized management for institutional staff, access credentials, and fleet security profiles.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white p-2 rounded-3xl border border-slate-200 flex items-center gap-4 pr-6 shadow-sm">
            <div className="bg-slate-900 p-4 rounded-2xl shadow-lg shadow-slate-200">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Workforce</p>
              <p className="text-2xl font-black text-slate-900 leading-none">{drivers.length}</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/driver/add")}
            className="flex items-center gap-3 px-8 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] shadow-xl shadow-indigo-100 active:scale-95 font-bold"
          >
            <Plus size={20} />
            Add New Member
          </button>
        </div>
      </div>

      {/* --- Search Bar --- */}
      <div className="relative group max-w-2xl">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="text-slate-300 group-focus-within:text-indigo-500" size={22} />
        </div>
        <input
          type="text"
          placeholder="Search by name, role, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-16 pr-8 py-6 rounded-3xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-semibold text-slate-700 text-lg"
        />
      </div>

      {/* --- Main Content Grid --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
          {paginatedDrivers.map((driver) => (
            <div
              key={driver._id}
              className="bg-white rounded-[2.5rem] border border-slate-200 flex flex-col overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/5 group"
            >
              {/* Top Profile Section */}
              <div className="p-8 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden ring-4 ring-slate-50 bg-slate-100 flex items-center justify-center">
                      {driver.imageUrl ? (
                        <img
                          src={`${FILE_BASE_URL}${driver.imageUrl}`}
                          alt={driver.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-slate-300">
                          <User size={32} />
                        </div>
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${driver.status === 'Inactive' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 truncate max-w-[150px]">
                      {driver.name}
                    </h3>
                    <p className="text-indigo-500 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase size={12} />
                      {driver.staffRole || "Personnel"}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === driver._id ? null : driver._id);
                    }}
                    className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {activeMenu === driver._id && (
                    <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 py-2">
                      <button
                        onClick={() => navigate(`/driver/change-password/${driver.userid}`)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <KeyRound size={16} /> Security Access
                      </button>
                      <button
                        onClick={() => handleDeleteUser(driver.userid)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={16} /> Terminate Record
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Section: Contact & Identity */}
              <div className="px-8 space-y-3 py-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 group/item hover:border-indigo-200">
                  <Mail size={16} className="text-slate-400 group-hover/item:text-indigo-500" />
                  <span className="text-slate-600 font-semibold text-sm truncate">{driver.email || "No email registered"}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 group/item hover:border-indigo-200">
                  <Phone size={16} className="text-slate-400 group-hover/item:text-indigo-500" />
                  <span className="text-slate-600 font-semibold text-sm">{driver.phoneNumber || "No phone connected"}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 group/item hover:border-indigo-200">
                  <Fingerprint size={16} className="text-slate-400 group-hover/item:text-indigo-500" />
                  <span className="text-slate-600 font-semibold text-sm">Identity Verified</span>
                </div>
              </div>

              {/* Bottom Section: Card Footer */}
              <div className="mt-auto p-8 pt-4 flex items-center justify-between border-t border-slate-50">
                <div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase">System ID</p>
                  <p className="text-sm font-black text-slate-900">#{driver.userid?.toString().slice(-6) || "N/A"}</p>
                </div>
                <button
                  onClick={() => navigate(`/driver/view/${driver.userid}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-indigo-600 shadow-lg shadow-slate-100"
                >
                  View Profile
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Empty State --- */}
      {!loading && filteredDrivers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
          <div className="bg-slate-50 p-10 rounded-full mb-6 text-slate-200">
            <Search size={64} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">No Records Found</h2>
          <p className="text-slate-400 font-medium mt-2">No results match your current search criteria.</p>
          <button
            onClick={() => setSearch("")}
            className="mt-6 text-indigo-600 font-bold underline decoration-2 underline-offset-4"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
};

export default Staff;