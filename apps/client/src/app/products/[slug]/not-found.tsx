import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Product Not Found</h1>
        <p className="text-gray-500 mb-6">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/products"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}
