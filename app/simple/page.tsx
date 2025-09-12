import Link from 'next/link';

export default function SimplePage() {
  return (
    <div className="p-8">
      <div className="mb-4 space-x-2">
        <Link href="/" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 inline-block">
          返回主页
        </Link>
        <Link href="/test" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 inline-block">
          测试页
        </Link>
      </div>
      <h1 className="text-2xl mb-4">Simple Static Page</h1>
      <p>This is a server-rendered page without client-side JavaScript.</p>
      <button className="px-4 py-2 bg-blue-500 text-white rounded">Static Button (no JS)</button>
    </div>
  );
}