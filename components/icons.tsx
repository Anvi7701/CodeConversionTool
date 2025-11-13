import React from 'react';

export const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M8 4a1 1 0 011-1h6a1 1 0 110 2H9a1 1 0 01-1-1zM5 8a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zm-1 5a1 1 0 100 2h14a1 1 0 100-2H4zm8 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z" />
  </svg>
);

export const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const SummaryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
  </svg>
);

export const TreeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

export const GraphIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 100-2.186m0 2.186c-.18.324-.283.696-.283 1.093s.103.77.283 1.093m0-2.186l-9.566-5.314" />
  </svg>
);

export const ZoomInIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
    </svg>
);

export const ZoomOutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
    </svg>
);

export const FitToScreenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25 5.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
    </svg>
);

export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const SaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
);

export const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const CodeBracketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
);

export const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
    </svg>
);

export const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

export const WandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.5 1.591L5.25 14.25M9.75 3.104a2.25 2.25 0 00-1.226-1.719L6.12 0l-2.65 5.103a2.25 2.25 0 001.226 1.719L9.75 3.104z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 3.104v5.714a2.25 2.25 0 01-1.07 1.932l-1.388.925L12 14.25M15 3.104a2.25 2.25 0 011.226-1.719L18.63 0l2.65 5.103a2.25 2.25 0 01-1.226 1.719L15 3.104z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25v5.25a2.25 2.25 0 01-2.25 2.25H10.5a2.25 2.25 0 01-2.25-2.25v-5.25M12 14.25h.01M16.5 18.75h.01M21 14.25h.01M4.5 18.75h.01M3 14.25h.01" />
    </svg>
);

export const ErrorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

export const JavascriptIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 24a12 12 0 1 1 12-12 12.013 12.013 0 0 1-12 12zM9.539 17.111h1.651l1.107-1.834 1.093 1.834h1.623l-1.91-3.213 1.791-2.915h-1.623l-.995 1.691-.981-1.691H8.634l1.791 2.957-1.886 3.171zm5.084-.1h1.833V13.82h-1.833v3.191zm0-4.383h1.833v-3.19H14.623v3.19z" />
    </svg>
);

export const TypeScriptIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="12" fill="#3178C6"/>
        <path d="M8.176 16.24V7.76H11.664V9.2H9.664V11.536H11.536V12.928H9.664V16.24H8.176ZM16.326 13.912C16.638 13.712 16.89 13.448 17.082 13.12C17.274 12.792 17.37 12.416 17.37 11.992C17.37 11.4 17.194 10.9 16.842 10.492C16.49 10.084 15.998 9.88 15.366 9.88C14.934 9.88 14.546 9.972 14.202 10.156C13.858 10.34 13.578 10.608 13.362 10.96L14.354 11.692C14.418 11.584 14.514 11.488 14.642 11.404C14.77 11.32 14.942 11.28 15.158 11.28C15.414 11.28 15.618 11.352 15.77 11.496C15.922 11.64 16 11.82 16 12.036C16 12.28 15.934 12.484 15.802 12.648C15.67 12.812 15.478 12.944 15.226 13.044L14.33 13.38V14.16H16.326V13.912Z" fill="white"/>
    </svg>
);

export const PythonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path fill="#3776AB" d="M14.998 2.384c-1.12 0-2.613.43-3.64 1.258-.87.71-1.39 1.76-1.39 3.16v4.717h3.003V6.82c0-.87.49-1.36 1.01-1.36.63 0 1.05.52 1.05 1.39v4.06h3.01V8.79c0-3.31-1.78-6.406-6.043-6.406zM9.002 21.616c1.12 0 2.613-.43 3.64-1.258.87-.71 1.39-1.76 1.39-3.16v-4.717H10.99v4.697c0 .87-.49 1.36-1.01 1.36-.63 0-1.05-.52-1.05-1.39v-4.03H6v4.14c0 3.31 1.78 6.406 6.043 6.406h-3.04z"/>
      <path fill="#FFD43B" d="M9.002 2.384c-3.31 0-6.406 1.78-6.406 6.043v4.14H6V8.89c0-.87.42-1.39 1.05-1.39.52 0 1.01.49 1.01 1.36v4.697h3.033v-4.717c0-1.4.52-2.45 1.39-3.16 1.027-.828 2.52-1.258 3.64-1.258v3.043c-1.13 0-1.8.6-1.8 1.55v4.06H18v-3.01c0-3.31-1.78-6.043-6.043-6.043H9.002zM14.998 21.616c3.31 0 6.406-1.78 6.406-6.043v-4.14H18v4.03c0 .87-.42 1.39-1.05-1.39-.52 0-1.01-.49-1.01-1.36v-4.697h-3.033v4.717c0 1.4-.52 2.45-1.39 3.16-1.027-.828-2.52 1.258-3.64 1.258v-3.043c1.13 0 1.8-.6 1.8-1.55v-4.06H6v3.01c0 3.31 1.78 6.406 6.043 6.043h2.955z"/>
    </svg>
);

export const JavaIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.5V19.5H10.5V16.5M13.5 16.5C15.5 16.5 16.5 14.5 16.5 12.5C16.5 10.5 15.5 8.5 13.5 8.5H10.5C8.5 8.5 7.5 10.5 7.5 12.5C7.5 14.5 8.5 16.5 10.5 16.5H13.5zM16.5 12.5H18C19.1046 12.5 20 11.6046 20 10.5C20 9.39543 19.1046 8.5 18 8.5H16.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5.5S9.5 4 10.5 4S12 5.5 12 5.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.5S12.5 4 13.5 4S15 5.5 15 5.5" />
    </svg>
);

export const CSharpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1.5 6h3m-1.5 0v10m-3-5h3m-1.5 0v-4m6 9h3m-1.5 0v-4" />
    </svg>
);

export const CIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#555555" d="M14.52,14.054c-1.15,1.21-2.88,1.93-4.9,1.93c-3.13,0-5.7-2.3-5.7-5.98s2.57-5.98,5.7-5.98c-2.02,0-3.75,0.72-4.9,1.93l-1.42,1.42c-0.78-0.88-1.92-1.43-3.48-1.43c-2.11,0-3.83,1.58-3.83,4.06s1.72,4.06,3.83,4.06c1.56,0,2.7-0.55,3.48-1.43L14.52,14.054z"/>
  </svg>
);

export const CppIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#00599C" d="M14.52,14.054c-1.15,1.21-2.88,1.93-4.9,1.93c-3.13,0-5.7-2.3-5.7-5.98s2.57-5.98,5.7-5.98c2.02,0,3.75,0.72,4.9,1.93l-1.42,1.42c-0.78-0.88-1.92-1.43-3.48-1.43c-2.11,0-3.83,1.58-3.83,4.06s1.72,4.06,3.83,4.06c1.56,0,2.7-0.55,3.48-1.43L14.52,14.054z"/>
    <path fill="#659AD2" d="M21,11h-2V9h-2v2h-2v2h2v2h2v-2h2V11z M17,7h-2V5h-2v2h-2v2h2v2h2V9h2V7z"/>
  </svg>
);

export const GoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 16h6v2H9zM9 12h9v2H9zM3 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4h-5.5a2.5 2.5 0 0 0-5 0H3V4z" />
    </svg>
);

export const HtmlIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 7.5h9m-9-3.75h9M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0Z" />
    </svg>
);

export const XmlIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5L3.75 12l4.5 4.5m7.5-9L19.5 12l-4.5 4.5m-3-12-3 15" />
    </svg>
);

export const CsvIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125V5.625c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125m-17.25 0h17.25m-17.25 0V4.5m17.25 15V4.5m0 15h-4.125m-13.125 0h4.125m13.125 0V10.5m-17.25 9V10.5" />
    </svg>
);

{/* Fix: Add missing CssIcon to resolve import errors. */}
export const CssIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502" />
    </svg>
);

export const YamlIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4v16h16" />
    <path d="m4 12 4-4 4 4" />
    <path d="M12 8v8" />
  </svg>
);

export const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

export const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
);

export const DesktopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
    </svg>
);

export const DocumentTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export const TerminalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

export const LightBulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-11.25H10.5a6.01 6.01 0 001.5 11.25v.375m-3.75 3.375c.375-.375.75-.825 1.125-1.25m9 0c.375.375.75.825 1.125 1.25m-11.25 0c.375-.375.75-.825 1.125-1.25m9 0c.375.375.75.825 1.125 1.25M12 21v-1.5m0 0a1.5 1.5 0 01-1.5-1.5v-1.5a1.5 1.5 0 013 0v1.5a1.5 1.5 0 01-1.5 1.5m-3.75-6.375c.375-.375.75-.825 1.125-1.25m9 0c.375.375.75.825 1.125 1.25" />
    </svg>
);

export const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

export const FileCodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.25 9.75L17.25 12l-1.5-2.25m-4.5 4.5L7.5 12l1.5-2.25m2.25-3l-3 4.5m3-4.5l3 4.5M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export const CubeStackIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
);

export const SwiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.36,10.32c-1.39-4.59-5.5-6.8-5.5-6.8s-3.79,1.7-5.08,5.43c-1.15,3.32-1.39,5.29-0.29,6.72c1.02,1.33,3.39,1.13,3.39,1.13s-1.89-1.39-1.1-3.6c0.88-2.45,4.6-2.4,4.6-2.4s-3.48,0.4-4.22,2.49c-0.67,1.89,1.01,3.48,1.01,3.48s-3.08-0.05-4.32-1.89c-1.28-1.89-1.07-4.96,0-7.32c1.17-2.59,4.2-5.12,4.2-5.12S11.66,1.4,9,2.28C4.51,3.68,2.78,8.26,3.64,12.7c0.88,4.51,4.21,6.54,4.21,6.54s-2.09-1.38-2.6-3.83c-0.49-2.39,1.49-3.99,1.49-3.99s-2.7,1.2-2.1,4.09c0.5,2.4,3.2,3.48,3.2,3.48s2.89,0.9,5.79-1.1c2.81-1.92,3.89-5.32,3.89-5.32S21.65,14.59,20.36,10.32z" fill="#F05138"/>
    </svg>
);

export const RubyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.89,10.34,12.28,2.1a0.3,0.3,0,0,0-.56,0L5.11,10.34a0.3,0.3,0,0,0,.28.46h2.23l4.38,8.86a0.3,0.3,0,0,0,.52,0l4.38-8.86h2.23A0.3,0.3,0,0,0,18.89,10.34Z" fill="#CC342D"/>
        <path d="M12,21.9a0.3,0.3,0,0,0,.26-0.16L19.9,11.38,15.1,11H8.9l-4.8,0.4L11.74,21.74A0.3,0.3,0,0,0,12,21.9Z" fill="#820C05"/>
        <path d="M16.59,10.8,12,19.75,7.41,10.8H5.39L12,21.8,18.61,10.8Z" fill="#FFFFFF"/>
    </svg>
);

export const DartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="m22.999 11.247-6.685 6.685-6.685-6.685 6.685-6.685 6.685 6.685zm-8.84-8.84-1.1 1.1 13.085 13.085-1.1 1.1 2.155-2.155-13.04-13.04zm-4.3 4.3L3.174 13.43l6.685 6.685 1.1-1.1-6.685-6.685 2.12-2.12z" fill="#0083FB"/>
        <path d="m9.859 15.707-6.685-6.685 8.84-8.84 6.685 6.685-8.84 8.84z" fill="#40C4FF"/>
        <path d="m9.859 15.707 6.685-6.685 2.155-2.155-8.84 8.84z" fill="#00569E"/>
    </svg>
);

export const FormatIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
    </svg>
);

export const GraphQLIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="#E10098" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zM3.56 10.65l4.8-4.8L12 9.5l3.64-3.64 4.8 4.8L16.8 14.3l-4.8-4.8-4.8 4.8L3.56 10.65zm15.14-3.32l-1.07 1.06-1.06-1.06 1.06-1.06 1.07 1.06zM5.29 7.33l-1.06 1.06-1.06-1.06 1.06-1.06 1.06 1.06zm9.59 14.1l-1.07-1.06-1.06 1.06 1.06 1.06 1.07-1.06zm-7.01-1.77L6.8 18.6l-1.06-1.06 1.06-1.06 1.07 1.06zm10.58 0l1.06-1.06 1.06 1.06-1.06 1.06-1.06-1.06zM9.5 12l2.5 2.5 2.5-2.5-2.5-2.5L9.5 12z" />
    </svg>
);
  
export const AngularIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="#DD0031" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0L0 4l2 14 10 6 10-6 2-14L12 0zm5 16.5l-5 3-5-3-1.5-10h13L17 16.5z"/>
        <path fill="#C3002F" d="M12 3.5l-7.5 13h3l1.5-3h6l1.5 3h3l-7.5-13zm-1.5 7l1.5-3 1.5 3h-3z"/>
    </svg>
);

export const VueIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="#4FC08D" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 1.6L12 22 0 1.6h4.8L12 14.8 19.2 1.6z"/>
        <path fill="#41B883" d="M19.2 1.6L12 14.8 4.8 1.6H0L12 22 24 1.6z"/>
        <path fill="#35495E" d="M4.8 1.6L12 14.8 19.2 1.6h-4.2L12 6.4 8.9 1.6z"/>
    </svg>
);

export const LightningIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);
