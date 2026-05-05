"use client";

import React from 'react';

export default function TrustIndexWidget({ src }: { src: string }) {
  return (
    <div 
      className="trustindex-wrapper" 
      suppressHydrationWarning 
      dangerouslySetInnerHTML={{
        __html: `<script defer async src="${src}"></script>`
      }} 
    />
  );
}
