'use client';

import { useEffect } from 'react';
import { setupGlobalErrorHandler } from '../lib/errorHandler';

export default function GlobalErrorHandler() {
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  return null;
}