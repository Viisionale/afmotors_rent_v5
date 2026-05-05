import React, { Suspense } from 'react';
import SuccessContent from './SuccessContent';

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: '80px 24px', textAlign: 'center' }}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
