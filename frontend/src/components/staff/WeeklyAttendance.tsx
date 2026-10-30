import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, Save, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL, getAuthHeader } from "../../api/base";
import { deobfuscate } from "../../utils/encryption";

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
  const [fetching, setFetching] = useState<boolean>(false);

  const realUserId = useMemo(() => deobfuscate(userId), [userId]);

  // Helper to get start of week (Monday)
  const getStartOfWeek = useCallback((offset: number) => {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) + (offset * 7);
    return new Date(date.setDate(diff));
  }, []);

  const formatDateForAPI = (date: Date) => date.toISOString().split('T')[0];

  const weekDisplayRange = useMemo(() => {
    const start = getStartOfWeek(currentWeekOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('en-GB', options)} - ${end.toLocaleDateString('en-GB', options)}`;
  }, [currentWeekOffset, getStartOfWeek]);

  const fetchWeeklyAttendance = useCallback(async () => {
    setFetching(true);
    const start = getStartOfWeek(currentWeekOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    try {
      const res = await fetch(
        `${BASE_URL}/attendance/weekly?userid=${realUserId}&start=${formatDateForAPI(start)}&end=${formatDateForAPI(end)}`,
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
    } finally {
      setFetching(false);
    }
  }, [userId, currentWeekOffset, getStartOfWeek, realUserId]);

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
    const loadingToast = toast.loading("Syncing attendance roster...");
    try {
      const res = await fetch(`${BASE_URL}/attendance/save`, {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          userid: Number(realUserId),
          records: attendance.map(rec => ({ date: rec.date, forenoon: rec.fn, afternoon: rec.an }))
        })
      });
      if (res.ok) toast.success("Attendance roster updated successfully!", { id: loadingToast });
      else throw new Error();
    } catch {
      toast.error("Failed to save attendance", { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  // Quick weekly total days present
  const totalDaysPresent = useMemo(() => {
    return attendance.reduce((sum, r) => {
      if (r.fn && r.an) return sum + 1;
      if (r.fn || r.an) return sum + 0.5;
      return sum;
    }, 0);
  }, [attendance]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs h-full flex flex-col justify-between">
      <div>
        {/* Header with Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                <CalendarDays size={11} /> Shift Roster
              </span>
              <span className="text-xs font-bold text-slate-400">
                • {totalDaysPresent} Days Logged
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">
              Weekly Attendance Log
            </h3>
          </div>

          {/* Week Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => setCurrentWeekOffset(o => o - 1)}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Previous Week"
            >
              <ChevronLeft size={15} />
            </button>

            <span className="text-[11px] font-bold text-slate-700 px-2 min-w-[110px] text-center tracking-tight">
              {weekDisplayRange}
            </span>

            <button
              onClick={() => setCurrentWeekOffset(o => o + 1)}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Next Week"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {fetching ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600 mb-2" size={24} />
              <p className="text-xs font-semibold text-slate-400">Loading week roster...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Day & Date</th>
                  <th className="py-2.5 px-3 text-center">Morning (FN)</th>
                  <th className="py-2.5 px-3 text-center">Afternoon (AN)</th>
                  <th className="py-2.5 px-3 text-right">Day Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {attendance.map((row, index) => {
                  const isWeekend = row.day === "Sunday";
                  return (
                    <tr key={row.date} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center text-[10px] font-black shrink-0 ${
                            isWeekend ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"
                          }`}>
                            <span>{new Date(row.date).getDate()}</span>
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">{row.day}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(row.date).toLocaleDateString('en-GB', { month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleAttendance(index, "fn")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                            row.fn
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200/80"
                          }`}
                        >
                          {row.fn && <CheckCircle2 size={12} />}
                          <span>FN</span>
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleAttendance(index, "an")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                            row.an
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200/80"
                          }`}
                        >
                          {row.an && <CheckCircle2 size={12} />}
                          <span>AN</span>
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <StatusBadge fn={row.fn} an={row.an} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={handleSaveAttendance}
          disabled={saving}
          className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/25 cursor-pointer disabled:opacity-50 active:scale-98"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          <span>Save Weekly Attendance</span>
        </button>
      </div>
    </div>
  );
};

/* Internal Helpers */
const StatusBadge = ({ fn, an }: { fn: boolean; an: boolean }) => {
  if (fn && an) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 inline-block">
        Full Day (1.0)
      </span>
    );
  }
  if (fn || an) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 inline-block">
        Half Day (0.5)
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 border border-slate-200 inline-block">
      Absent (0)
    </span>
  );
};

export default WeeklyAttendance;
