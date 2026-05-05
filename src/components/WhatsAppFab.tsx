"use client";
import React from 'react';
import styles from './WhatsAppFab.module.css';

export default function WhatsAppFab() {
  return (
    <a
      href="https://api.whatsapp.com/send?phone=+393440513634&text=Ciao!%20Vorrei%20informazioni%20sul%20noleggio%20auto."
      target="_blank"
      rel="noopener noreferrer"
      className={styles.fab}
      title="Contattaci su WhatsApp"
      aria-label="Chat WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="28" height="28" fill="white">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.742 3.052 9.376L1.056 31.2l6.064-1.952C9.628 30.94 12.712 32 16.004 32 24.828 32 32 24.824 32 16S24.828 0 16.004 0zm9.38 22.62c-.392 1.1-1.932 2.016-3.152 2.284-.836.18-1.928.324-5.604-1.204-4.7-1.956-7.72-6.728-7.952-7.04-.224-.312-1.856-2.472-1.856-4.716 0-2.244 1.176-3.348 1.592-3.804.416-.456.908-.572 1.212-.572.304 0 .608.004.872.016.28.012.656-.108.024 1.828-.296.908-2.58 6.296-2.772 6.752-.192.456-.32.988-.064 1.5.264.52 1.18 1.916 2.54 3.104 1.752 1.532 3.224 2.008 3.684 2.232.46.224.728.188 1.004-.116.276-.304 1.184-1.38 1.5-1.856.316-.476.632-.396 1.064-.236.432.16 2.756 1.3 3.228 1.536.472.236.788.356.904.552.116.196.116 1.14-.276 2.24z"/>
      </svg>
    </a>
  );
}
