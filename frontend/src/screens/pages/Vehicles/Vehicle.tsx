import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Banknote,
  Calendar,
  CalendarDays,
  Car,
  CheckCircle2,
  Filter,
  Gauge,
  Plus,
  Search,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FILE_BASE_URL } from "../../../api/base";
import { encryptId } from "../../../utils/functions";
import { useVehicleStore, type Vehicle } from "../../../store/vechicle/useVehicleStore";
import { formatDate } from "../../../utils/formatDate";

const getStatus = (vehicle: Vehicle): "Active" | "Inactive" => {
  if (!vehicle.insurance || !vehicle.pollution || !vehicle.rcDate) return "Inactive";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    new Date(vehicle.insurance) >= today &&
    new Date(vehicle.pollution) >= today &&
    new Date(vehicle.rcDate) >= today
  )
    ? "Active"
    : "Inactive";
};

const DataMetric = ({
  label,
  value,
  icon,
  isExpired = false,
  valueClass,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  isExpired?: boolean;
  valueClass?: string;
}) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
      {icon}
      {label}
    </span>
    <span
      className={`text-xs font-bold mt-1 tracking-tight ${
        isExpired ? "text-rose-600 font-extrabold" : valueClass || "text-slate-700"
      }`}
    >
      {value}
    </span>
  </div>
);

export default function VehicleList() {
  const navigate = useNavigate();
  const { vehicles, fetchVehicles, loading, error } = useVehicleStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Compute fleet statistics for KPI cards (mirrors Tripzo KPI overview)
  const stats = useMemo(() => {
    let active = 0;
    let attention = 0;
    let totalSpend = 0;

    vehicles.forEach((v) => {
      const s = getStatus(v);
      if (s === "Active") active++;
      else attention++;
      totalSpend += Number(v.totalCost || 0);
    });

    return {
      total: vehicles.length,
      active,
      attention,
      totalSpend,
    };
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const status = getStatus(v);
      const matchesSearch =
        (v.vehicleNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.vehicleName ?? "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && status === "Active") ||
        (statusFilter === "INACTIVE" && status === "Inactive");

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, statusFilter]);

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <div className="p-10 bg-white rounded-3xl border-2 border-rose-100 flex flex-col items-center text-center gap-5 shadow-xl shadow-rose-500/5">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100">
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
              Synchronization Error
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Could not retrieve fleet assets from the secure backend.
            </p>
          </div>
          <button
            onClick={() => fetchVehicles()}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* ─── 1. TRIPZO PAGE HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
              <ShieldCheck size={11} /> Fleet Management
            </span>
            <span className="text-xs font-bold text-slate-400">
              • {vehicles.length} Assets Registered
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Vehicle <span className="text-indigo-600">Fleet Registry</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Real-time tracking of transport trucks, documentation compliance & operational spend
          </p>
        </div>

        {/* Action Button - Standardized Tripzo Button */}
        <button
          onClick={() => navigate("/add-vehicle")}
          className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus size={16} />
          <span>Register Vehicle</span>
        </button>
      </div>

      {/* ─── 2. TRIPZO KPI OVERVIEW CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Fleet */}
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group select-none shadow-2xs bg-white ${
            statusFilter === "ALL"
              ? "border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm"
              : "border-slate-200/80 hover:border-indigo-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Truck size={18} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50">
              Total
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Fleet
          </span>
          <span className="text-2xl font-black text-slate-800 tracking-tight block mt-0.5">
            {stats.total}
          </span>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">Indexed in yard registry</p>
        </div>

        {/* Active Fleet */}
        <div
          onClick={() => setStatusFilter("ACTIVE")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group select-none shadow-2xs bg-white ${
            statusFilter === "ACTIVE"
              ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm"
              : "border-slate-200/80 hover:border-emerald-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50">
              Valid Docs
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Compliant Vehicles
          </span>
          <span className="text-2xl font-black text-emerald-600 tracking-tight block mt-0.5">
            {stats.active}
          </span>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">Ready for transport</p>
        </div>

        {/* Attention Needed */}
        <div
          onClick={() => setStatusFilter("INACTIVE")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group select-none shadow-2xs bg-white ${
            statusFilter === "INACTIVE"
              ? "border-rose-500 ring-2 ring-rose-500/10 shadow-sm"
              : "border-slate-200/80 hover:border-rose-400 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100/50">
              Alerts
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Attention Needed
          </span>
          <span className="text-2xl font-black text-rose-600 tracking-tight block mt-0.5">
            {stats.attention}
          </span>
          <p className="text-[11px] text-rose-600 font-bold mt-1">Expired insurance/FC</p>
        </div>

        {/* Total Spend */}
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white relative overflow-hidden group select-none shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Banknote size={18} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50">
              Expenses
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Fleet Spend (₹)
          </span>
          <span className="text-2xl font-black text-slate-800 tracking-tight block mt-0.5">
            ₹ {stats.totalSpend.toLocaleString("en-IN")}
          </span>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">Cumulative operational cost</p>
        </div>
      </div>

      {/* ─── 3. SEARCH & FILTER TOOLBAR ─── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        {/* Search Input with Indigo Focus */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by vehicle name, plate number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-9 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mr-1 hidden sm:inline-flex items-center gap-1">
            <Filter size={12} />
            Status:
          </span>
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            All ({vehicles.length})
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setStatusFilter("INACTIVE")}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "INACTIVE"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            Attention ({stats.attention})
          </button>
        </div>
      </div>

      {/* 4. VEHICLE CARDS (TRIPZO ARCHITECTURE) */}
      <div className="space-y-3">
        {loading ? (
          // Skeleton Cards
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border-2 border-slate-100 rounded-2xl p-5 flex flex-col xl:flex-row gap-5 items-center animate-pulse"
            >
              <div className="w-14 h-14 bg-slate-200 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2 w-full">
                <div className="h-4 bg-slate-200 rounded-md w-48" />
                <div className="h-3 bg-slate-100 rounded-md w-28" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 flex-1 w-full">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-8 bg-slate-100 rounded-lg" />
                ))}
              </div>
              <div className="w-24 h-9 bg-slate-200 rounded-xl shrink-0" />
            </div>
          ))
        ) : filteredVehicles.length > 0 ? (
          filteredVehicles.map((v, index) => {
            const status = getStatus(v);
            const isInsuranceExpired = Boolean(v.insurance && new Date(v.insurance) < new Date());
            const isPollutionExpired = Boolean(v.pollution && new Date(v.pollution) < new Date());
            const isRcExpired = Boolean(v.rcDate && new Date(v.rcDate) < new Date());

            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                key={v.id}
                onClick={() => navigate(`/view-vehicle/${encryptId(v.id)}`)}
                className="group relative bg-white border border-slate-200/80 hover:border-indigo-500 rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/5 cursor-pointer flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6 select-none"
              >
                {/* Left: Vehicle Photo & Identity */}
                <div className="flex items-center gap-4 shrink-0 sm:min-w-[240px]">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-xs shrink-0 flex items-center justify-center bg-slate-50">
                    {v.vehicleImage ? (
                      <img
                        src={`${FILE_BASE_URL}${v.vehicleImage}`}
                        alt={v.vehicleName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to icon on error
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Truck size={24} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate">
                        {v.vehicleName}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono font-bold uppercase tracking-wider mt-0.5">
                      Plate: {v.vehicleNumber}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            status === "Active" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {status}
                      </span>
                      {v.vehicleType && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                          {v.vehicleType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Metrics Grid (Tripzo DataMetric architecture) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 flex-1 gap-3 sm:gap-4 xl:px-6 xl:border-x-2 xl:border-slate-100 py-3 xl:py-0 border-t xl:border-t-0 border-slate-100">
                  <DataMetric
                    label="Insurance"
                    value={v.insurance ? formatDate(v.insurance) : "Not Set"}
                    icon={<ShieldCheck size={13} className="text-slate-400" />}
                    isExpired={isInsuranceExpired}
                  />

                  <DataMetric
                    label="Pollution"
                    value={v.pollution ? formatDate(v.pollution) : "Not Set"}
                    icon={<Calendar size={13} className="text-slate-400" />}
                    isExpired={isPollutionExpired}
                  />

                  <DataMetric
                    label="RC Expiry"
                    value={v.rcDate ? formatDate(v.rcDate) : "Not Set"}
                    icon={<CalendarDays size={13} className="text-slate-400" />}
                    isExpired={isRcExpired}
                  />

                  <DataMetric
                    label="Odometer"
                    value={`${(v.kilometer || 0).toLocaleString("en-IN")} KM`}
                    icon={<Gauge size={13} className="text-indigo-500" />}
                  />

                  <DataMetric
                    label="Total Spend"
                    value={`₹ ${(v.totalCost || 0).toLocaleString("en-IN")}`}
                    icon={<Banknote size={13} className="text-emerald-500" />}
                    valueClass="text-emerald-600 font-bold"
                  />
                </div>

                {/* Right: Tripzo Action Button */}
                <div className="shrink-0 flex items-center justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/view-vehicle/${encryptId(v.id)}`);
                    }}
                    className="h-10 px-4 rounded-xl bg-slate-50 hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 text-slate-700 font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>View Details</span>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          /* Empty State */
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-12 text-center shadow-xs">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-3 border border-indigo-100">
              <Car size={32} />
            </div>
            <h4 className="text-base font-bold text-slate-800 uppercase tracking-tight">
              No Vehicles Found
            </h4>
            <p className="text-xs text-slate-400 font-medium mt-1 max-w-sm mx-auto">
              No fleet vehicles matched your search or status filter. Try clearing your filters or
              register a new vehicle.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      <div className="text-center py-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Showing {filteredVehicles.length} of {vehicles.length} fleet assets
        </span>
      </div>
    </div>
  );
}
