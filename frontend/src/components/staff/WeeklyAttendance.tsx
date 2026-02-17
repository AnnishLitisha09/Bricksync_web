import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL, getAuthHeader } from "../../api/base";

interface AttendanceRecord {
  day: string;
  date: string;
  fn: boolean;
  an: boolean;
}

interface WeeklyAttendanceProps {
  userId: string;
}

const WeeklyAttendance: React.FC<WeeklyAttendanceProps> = ({ userId }) => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [saving, setSaving] = useState<boolean>(false);

  // Helper to get start of week (Monday)
  const getStartOfWeek = useCallback((offset: number) => {
    const date = new Date();
    const day = date.getDay();
    // Adjust to Monday: Monday is 1, Sunday is 0. 
    // If Sunday(0), we want to go back 6 days to Monday.
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) + (offset * 7);
    return new Date(date.setDate(diff));
  }, []);

  const formatDateForAPI = (date: Date) => date.toISOString().split('T')[0];

  // Logic to display the date range (e.g., "16 Feb - 22 Feb")
  const weekDisplayRange = useMemo(() => {
    const start = getStartOfWeek(currentWeekOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('en-GB', options)} - ${end.toLocaleDateString('en-GB', options)}`;
  }, [currentWeekOffset, getStartOfWeek]);

  const fetchWeeklyAttendance = useCallback(async () => {
    const start = getStartOfWeek(currentWeekOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    try {
      const res = await fetch(
        `${BASE_URL}/attendance/weekly?userid=${userId}&start=${formatDateForAPI(start)}&end=${formatDateForAPI(end)}`,
        { headers: getAuthHeader() }
      );
      const remoteData = await res.json();
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      
      const weeklyRecords = days.map((dayName, idx) => {
        const d = new Date(start);
        d.setDate(d.getDate() + idx);
        const dateStr = formatDateForAPI(d);
        const record = remoteData.find((r: any) => r.date.split('T')[0] === dateStr);
        return { 
          day: dayName, date: dateStr, 
          fn: record ? record.forenoon : false, 
          an: record ? record.afternoon : false 
        };
      });
      setAttendance(weeklyRecords);
    } catch (error) {
      console.error("Attendance fetch error:", error);
      toast.error("Could not load attendance data");
    }
  }, [userId, currentWeekOffset, getStartOfWeek]);

  useEffect(() => {
    fetchWeeklyAttendance();
  }, [fetchWeeklyAttendance]);

  const toggleAttendance = (index: number, shift: "fn" | "an") => {
    const updated = [...attendance];
    updated[index][shift] = !updated[index][shift];
    setAttendance(updated);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    const loadingToast = toast.loading("Syncing attendance...");
    try {
      const res = await fetch(`${BASE_URL}/attendance/save`, {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userid: Number(userId), 
          records: attendance.map(rec => ({ date: rec.date, forenoon: rec.fn, afternoon: rec.an })) 
        })
      });
      if (res.ok) toast.success("Attendance updated!", { id: loadingToast });
      else throw new Error();
    } catch {
      toast.error("Failed to save", { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm h-full flex flex-col">
      {/* Header with Date Range Display */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <CalendarDays size={20} className="text-indigo-600"/>
          </div>
          Weekly Attendance
        </h3>
        
        {/* Navigation with Date Range */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setCurrentWeekOffset(o => o - 1)} 
            className="p-2 hover:bg-white hover:text-indigo-600 rounded-xl transition-all border border-transparent hover:border-slate-200"
          >
            <ChevronLeft size={18}/>
          </button>
          
          <span className="text-[11px] font-black text-slate-600 uppercase px-3 min-w-[120px] text-center tracking-tighter">
            {weekDisplayRange}
          </span>
          
          <button 
            onClick={() => setCurrentWeekOffset(o => o + 1)} 
            className="p-2 hover:bg-white hover:text-indigo-600 rounded-xl transition-all border border-transparent hover:border-slate-200"
          >
            <ChevronRight size={18}/>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-grow">
        <table className="w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-[10px] font-black text-slate-400 uppercase text-left tracking-widest">
              <th className="px-6 py-2">Day & Date</th>
              <th className="px-6 py-2 text-center">Forenoon</th>
              <th className="px-6 py-2 text-center">Afternoon</th>
              <th className="px-6 py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((row, index) => (
              <tr key={row.date} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 rounded-l-2xl border-l border-y border-transparent group-hover:border-slate-100 font-bold text-slate-700">
                  <div className="flex flex-col">
                    <span className="text-sm">{row.day}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </td>
                <td className="border-y border-transparent group-hover:border-slate-100">
                  <AttendanceCheckbox checked={row.fn} onChange={() => toggleAttendance(index, "fn")} />
                </td>
                <td className="border-y border-transparent group-hover:border-slate-100">
                  <AttendanceCheckbox checked={row.an} onChange={() => toggleAttendance(index, "an")} />
                </td>
                <td className="px-6 py-4 rounded-r-2xl border-r border-y border-transparent group-hover:border-slate-100 text-right">
                  <StatusBadge fn={row.fn} an={row.an} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <button 
        onClick={handleSaveAttendance} 
        disabled={saving} 
        className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 disabled:bg-slate-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
      >
        {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} 
        Update Records
      </button>
    </div>
  );
};

/* Internal Helpers */
const AttendanceCheckbox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <div 
    onClick={onChange} 
    className={`mx-auto w-6 h-6 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center ${
      checked ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100" : "border-slate-200 bg-white hover:border-indigo-300"
    }`}
  >
    {checked && <div className="w-1.5 h-1.5 bg-white rounded-full animate-in zoom-in" />}
  </div>
);

const StatusBadge = ({ fn, an }: { fn: boolean; an: boolean }) => {
  if (fn && an) return <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">Full Day</span>;
  if (fn || an) return <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">Half Day</span>;
  return <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 border border-slate-200">Absent</span>;
};

export default WeeklyAttendance;