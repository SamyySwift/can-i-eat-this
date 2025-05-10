import { ReactNode } from "react";

interface PatternBackgroundProps {
  children: ReactNode;
}

export default function PatternBackground({ children }: PatternBackgroundProps) {
  return (
    <div className="pattern-bg min-h-screen">
      {children}
    </div>
  );
}
