"use client"

import React, { useState } from 'react';
import Link from 'next/link';

export default function TestPage() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log('Button clicked!');
    alert('Button clicked!');
    setCount(count + 1);
  };

  return (
    <div className="p-8">
      <div className="mb-4 space-x-2">
        <Link href="/" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 inline-block">
          返回主页
        </Link>
        <Link href="/simple" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 inline-block">
          简单页
        </Link>
      </div>
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