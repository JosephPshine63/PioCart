import { Suspense } from "react";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { Search, User as UserIcon } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { CartIconButton, CartSheet } from "@/components/cart/cart-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { getCategories } from "@/lib/api/catalog";
import { getCart, getCurrentUser } from "@/lib/session";

export async function SiteHeader() {
  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight">
          <Image src="/brand/logo-mark.png" alt="" width={37} height={22} preload />
          PioCart
        </Link>

        <nav className="hidden items-center gap-4 text-sm md:flex">
          <Link href="/products" className="text-muted-foreground hover:text-foreground">
            Catalogo
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${encodeURIComponent(category.name)}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        <Form action="/products" className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" type="search" placeholder="Cerca prodotti…" aria-label="Cerca prodotti" className="pl-8" />
        </Form>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Suspense fallback={<CartIconButton count={0} href="/cart" />}>
            <CartLink />
          </Suspense>
          <Suspense fallback={<AccountButton />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function CartLink() {
  const cart = await getCart();
  if (cart) return <CartSheet cart={cart} />;
  // Signed out: /cart is protected, so this goes through the login and back.
  return <CartIconButton count={0} href="/cart" />;
}

function AccountButton() {
  return (
    <Button variant="ghost" size="icon-lg" asChild>
      <Link href="/login" aria-label="Accedi">
        <UserIcon className="size-5" />
      </Link>
    </Button>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return <AccountButton />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" aria-label="Menu account">
          <UserIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span>
            {user.firstName} {user.lastName}
          </span>
          <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">Il mio account</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/orders">I miei ordini</Link>
        </DropdownMenuItem>
        {user.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">Amministrazione</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              Esci
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
