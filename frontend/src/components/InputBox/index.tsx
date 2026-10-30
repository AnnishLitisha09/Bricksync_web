import React, { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  className,
  id,
  name,
  ...props
}) => {
  const inputId = id || name;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5"
        >
          {label}
        </label>
      )}
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          name={name}
          {...props}
          className={`w-full ${
            icon ? "pl-10 pr-4" : "px-4"
          } py-3 bg-slate-50/60 hover:bg-white focus:bg-white border rounded-xl font-semibold text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-normal shadow-2xs outline-none transition-all duration-150 ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
              : "border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
          } ${className || ""}`}
        />
      </div>
      {error ? (
        <span className="text-[11px] font-bold text-red-500 ml-1">{error}</span>
      ) : helperText ? (
        <span className="text-[11px] font-medium text-slate-400 ml-1">
          {helperText}
        </span>
      ) : null}
    </div>
  );
};

export default Input;
