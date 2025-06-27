import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import App from '../../../src/ui/App';

describe('App', () => {
  it('renders login form initially', () => {
    const { getAllByText } = render(<App />);
    expect(getAllByText('Login').length).toBeGreaterThan(0);
  });
});
