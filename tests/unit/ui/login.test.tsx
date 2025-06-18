import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import LoginForm from '../../../src/ui/LoginForm';
import { StateProvider } from '../../../src/ui/Store';

describe('LoginForm', () => {
  it('updates fields', () => {
    const { getByPlaceholderText } = render(
      <StateProvider>
        <LoginForm onSuccess={() => {}} />
      </StateProvider>
    );
    const email = getByPlaceholderText('Email') as HTMLInputElement;
    fireEvent.change(email, { target: { value: 'test' } });
    expect(email.value).toBe('test');
  });
});
