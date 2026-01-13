import Link from "next/link";

interface HeaderProps {
  restaurantName?: string;
}

export function Header({ restaurantName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between h-14 px-4">
        <Link href="/dashboard" className="font-semibold text-lg">
          {restaurantName || "Carte du Jour"}
        </Link>
      </div>
    </header>
  );
}
