import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import App from '../../../src/ui/App';

describe('App', () => {
  it('renders main header', () => {
    const { getByText } = render(<App />);
    expect(getByText('Telegram Retargeting Platform')).toBeTruthy();
  });
});
