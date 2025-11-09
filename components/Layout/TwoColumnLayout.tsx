import React from "react";

interface ColumnProps {
  header?: React.ReactNode;
  content: React.ReactNode;
  scrollable?: boolean;
  minHeight?: string;
}

interface TwoColumnLayoutProps {
  left: ColumnProps;
  right: ColumnProps;
}

export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ left, right }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* Left Column */}
      <div
        className={`flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4 ${
          left.scrollable ? "overflow-y-auto" : ""
        }`}
        style={{ minHeight: left.minHeight || "auto" }}
      >
        {left.header && <div className="mb-4">{left.header}</div>}
        <div className="flex-grow">{left.content}</div>
      </div>

      {/* Right Column */}
      <div
        className={`flex flex-col bg-light-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden p-6 gap-4 ${
          right.scrollable ? "overflow-y-auto" : ""
        }`}
        style={{ minHeight: right.minHeight || "auto" }}
      >
        {right.header && <div className="mb-4">{right.header}</div>}
        <div className="flex-grow">{right.content}</div>
      </div>
    </div>
  );
};