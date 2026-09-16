import React from "react";

export function AppleLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 170 170"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.94-12.04-14.58-6.19-9.43-11.13-20.17-14.82-32.22-3.69-12.05-5.54-23.51-5.54-34.38 0-14.28 3.63-26.06 10.89-35.34 7.26-9.28 16.48-14.07 27.66-14.37 4.23 0 9.07 1.21 14.51 3.64 5.44 2.43 9.17 3.71 11.19 3.85 2.6-.26 6.54-1.61 11.83-4.06 5.28-2.45 10.02-3.56 14.2-3.32 10.37.51 18.84 4.3 25.42 11.37 6.58 7.07 10.74 15.42 12.48 25.04-10.96 6.64-16.32 15.71-16.07 27.21.25 9.02 3.76 16.63 10.53 22.84 6.77 6.21 14.88 9.77 24.33 10.68-2.28 6.94-5.07 14.05-8.38 21.32zm-30.83-108.57c0 7.37-2.73 14.24-8.19 20.61-5.46 6.37-12.19 10.22-20.19 11.55-.89-2.02-1.34-4.23-1.34-6.63 0-7.14 2.87-14.15 8.6-21.03 5.74-6.88 12.44-10.83 20.11-11.84.67 2.45 1.01 4.9 1.01 7.34z" />
    </svg>
  );
}

export function FinderAppIcon({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-b from-white/15 to-white/5 shadow-md backdrop-blur-md ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    </div>
  );
}

export function PhotosAppIcon({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-b from-white/20 to-white/5 shadow-md backdrop-blur-md ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    </div>
  );
}

export function GroupsAppIcon({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-b from-white/15 to-white/5 shadow-md backdrop-blur-md ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </div>
  );
}

export function UploadAppIcon({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-b from-white/20 to-white/5 shadow-md backdrop-blur-md ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    </div>
  );
}

export function AdminAppIcon({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-b from-white/15 to-white/5 shadow-md backdrop-blur-md ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </div>
  );
}

export function KeychainAppIcon({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-b from-white/15 to-white/5 shadow-md backdrop-blur-md ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
        <path d="M21 2l-2 2m-1.5 1.5L14 9a5 5 0 1 0 3 3l3.5-3.5 2-2z" />
        <circle cx="7.5" cy="16.5" r="1.5" />
      </svg>
    </div>
  );
}
