import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">That route is not part of this demonstration.</p>
      <Link href="/" className="mt-4 inline-block text-sm text-accent">Go to the marketing site</Link>
    </main>
  );
}
