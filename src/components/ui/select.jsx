import React from "react";

export function Select({ children, className }) {
  return <div className={`relative ${className || ""}`}>{children}</div>;
}

export function SelectTrigger({ children, onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2 border rounded-lg text-left ${className || ""}`}
    >
      {children}
    </button>
  );
}

export function SelectValue({ children, className }) {
  return <span className={`${className || ""}`}>{children}</span>;
}

export function SelectContent({ children, className }) {
  return (
    <div
      className={`absolute mt-1 w-full bg-white border rounded-lg shadow-lg z-10 ${className || ""}`}
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, children, onClick, className }) {
  return (
    <div
      onClick={() => onClick && onClick(value)}
      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${className || ""}`}
    >
      {children}
    </div>
  );
}
