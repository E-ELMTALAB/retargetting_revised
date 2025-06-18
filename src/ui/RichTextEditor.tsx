import React, { useRef } from 'react';

interface Props {
  html: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ html, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const handleInput = () => {
    onChange(ref.current?.innerHTML || '');
  };

  return (
    <div
      ref={ref}
      contentEditable
      onInput={handleInput}
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ border: '1px solid #ccc', padding: '8px', minHeight: '80px' }}
    />
  );
}
