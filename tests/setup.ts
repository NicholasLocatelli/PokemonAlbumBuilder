import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Clean up after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup();
});