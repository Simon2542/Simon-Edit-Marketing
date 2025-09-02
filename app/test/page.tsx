"use client"

import React, { useState } from 'react';

export default function TestPage() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log('Button clicked!');
    alert('Button clicked!');
    setCount(count + 1);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Test Page</h1>
      <p>Count: {count}</p>
      <button 
        onClick={handleClick}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Click Me
      </button>
    </div>
  );
}