import React from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string;
  onBack?: () => void;
  isBack?: boolean;
  children?: React.ReactNode;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  isBack = false,
  children,
  badge,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0 gap-4 w-full mb-6">
      <div className="flex items-center gap-3.5 min-w-0">
        {isBack && (
          <button
            onClick={handleBack}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all shadow-xs cursor-pointer"
            aria-label="Go Back"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <div className="flex flex-col min-w-0 justify-center">
          {subtitle && (
            <p className="text-indigo-600 text-[10px] uppercase tracking-widest font-black truncate mb-0.5">
              {subtitle}
            </p>
          )}
          <div className="flex items-center gap-2.5 flex-wrap">
            {typeof title === "string" ? (
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {title}
              </h1>
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {title}
              </div>
            )}
            {badge && <div>{badge}</div>}
          </div>
        </div>
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto sm:justify-end shrink-0">
          {children}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
