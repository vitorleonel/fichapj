import Link from "next/link";

const LINKS = [
  { href: "/api", label: "API" },
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
  { href: "/termos-de-uso", label: "Termos de Uso" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-zinc-200/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-6 py-6 text-sm text-zinc-500 sm:flex-row sm:justify-between sm:px-10">
        <p>© {new Date().getFullYear()} Ficha PJ</p>

        <nav className="flex items-center gap-5">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md transition outline-hidden hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/25"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
