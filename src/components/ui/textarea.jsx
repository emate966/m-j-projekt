import React from "react";

export function Textarea({ placeholder = "", value, onChange, className }) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${className || ""}`}
      rows={4}
    />
  );
}
