import React from "react";

export function Card({ children, className }) {
  return (
    <div
      className={`rounded-2xl shadow-md border p-4 bg-white ${className || ""}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={`mb-2 font-semibold text-lg ${className || ""}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h2 className={`text-xl font-bold ${className || ""}`}>
      {children}
    </h2>
  );
}

export function CardContent({ children, className }) {
  return <div className={`${className || ""}`}>{children}</div>;
}
