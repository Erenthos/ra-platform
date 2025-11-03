import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-lg font-bold">Reverse Auction</div>
        <div className="space-x-4">
          <Link href="/" className="hover:text-blue-300 transition">Home</Link>
          <Link href="/buyer" className="hover:text-blue-300 transition">Buyer</Link>
          <Link href="/supplier" className="hover:text-blue-300 transition">Supplier</Link>
        </div>
      </div>
    </nav>
  );
}
