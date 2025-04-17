"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "./ProfileMenu";
import { History } from "lucide-react";
import SearchBar from "./SearchBar";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              JTI Inventory Management
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/alle-items"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/inventory" || pathname === "/alle-items" ? "text-foreground" : "text-foreground/60"
              )}
            >
              Inventory
            </Link>
            <Link
              href="/transactions"
              className={cn(
                "transition-colors hover:text-foreground/80 flex items-center",
                pathname === "/transactions" ? "text-foreground" : "text-foreground/60"
              )}
            >
              <History className="mr-1 h-4 w-4" />
              Transaktionen
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full max-w-md mr-4">
            <SearchBar />
          </div>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

