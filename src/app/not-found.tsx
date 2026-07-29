import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f5f0e8]">
      <div className="text-center max-w-md">
        <Image
          src="/tc-logo.png"
          alt="Thrift Collision"
          width={64}
          height={64}
          className="object-contain mx-auto mb-6"
        />
        <h1 className="text-6xl font-bold text-[#1a6b2f] mb-3">404</h1>
        <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">Page not found</h2>
        <p className="text-gray-500 text-sm mb-8">
          Looks like this piece has already been thrifted. Or maybe the page never existed — either way, there&apos;s nothing here.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="btn-tc-primary px-6 py-3 rounded-full text-sm inline-block"
          >
            Back to Home
          </Link>
          <Link
            href="/shop"
            className="btn-tc-outline px-6 py-3 rounded-full text-sm inline-block"
          >
            Shop the Drop
          </Link>
        </div>
      </div>
    </div>
  );
}
