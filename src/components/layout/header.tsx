"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/lib/i18n/routing";
import { LogOut, ChevronDown, Heart, Menu, Search, User2 } from "lucide-react";
import CartSheet from "@/components/shop/cart-sheet";
import LanguageSwitcher from "./language-switcher";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HeaderProps = {
  locale: string;
  categoryList: HeaderCategory[];
  labels: HeaderLabels;
  sessionUser: HeaderSessionUser | null;
  signOutAction: () => Promise<void>;
};

type HeaderCategory = {
  id: string;
  slug: string;
  name: string;
};

type HeaderLabels = {
  home: string;
  about: string;
  profile: string;
  admin: string;
  logout: string;
  login: string;
};

type HeaderSessionUser = {
  name?: string | null;
  role?: string | null;
};

function findCategoryHref(categoryList: HeaderCategory[], searchTerms: string[], fallbackSlug: string) {
  const match = categoryList.find((category) => {
    const localized = category.name.toLowerCase();
    const slug = category.slug.toLowerCase();

    return searchTerms.some((term) => localized.includes(term) || slug.includes(term));
  });

  return `/category/${match?.slug || fallbackSlug}`;
}

export default function Header({ locale, categoryList, labels, sessionUser, signOutAction }: Readonly<HeaderProps>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const primaryLinks = [
    { label: labels.home, href: "/" },
    {
      label: "Living Room",
      href: findCategoryHref(categoryList, ["living", "sofa", "lounge", "salon"], "living-room"),
    },
    {
      label: "Bedroom",
      href: findCategoryHref(categoryList, ["bedroom", "bed", "sleep"], "bedroom"),
    },
    {
      label: "Dining",
      href: findCategoryHref(categoryList, ["dining", "table", "yemek"], "dining"),
    },
    { label: labels.about, href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur-md supports-backdrop-filter:bg-[#fffaf3]/72">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 md:gap-5 lg:w-[280px]">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full border border-[#eadfce] bg-white/70 text-[#6f4e37] shadow-sm hover:bg-[#fff8ee] md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[88vw] border-r border-[#eadfce] bg-[#fffaf3] p-0 sm:max-w-sm">
              <SheetHeader className="border-b border-[#eadfce] px-6 py-6">
                <SheetTitle className="text-lg font-semibold tracking-[0.18em] text-[#6f4e37] uppercase">
                  Intense Design
                </SheetTitle>
                <SheetDescription className="text-sm text-[#8b6a52]">
                  Curated living spaces in warm, refined tones.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-8 px-6 py-8">
                <nav className="space-y-2">
                  {primaryLinks.map((item) => (
                    <I18nLink
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium tracking-wide text-[#4e3629] transition-colors hover:bg-white/80 hover:text-[#9a5f2f]"
                    >
                      <span>{item.label}</span>
                      <ChevronDown className="size-4 -rotate-90 text-[#b88a63]" />
                    </I18nLink>
                  ))}
                </nav>

                <div className="space-y-3 border-t border-[#eadfce] pt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a27a5a]">
                    Collections
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categoryList.map((cat) => (
                      <I18nLink
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="rounded-full border border-[#eadfce] bg-white/80 px-3 py-2 text-xs font-medium text-[#6f4e37] transition-colors hover:border-[#d1b191] hover:text-[#9a5f2f]"
                      >
                        {cat.name}
                      </I18nLink>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t border-[#eadfce] pt-6">
                  {sessionUser ? (
                    <>
                      <I18nLink href="/account" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-medium text-[#4e3629]">
                        <User2 className="size-4 text-[#b88a63]" />
                        {labels.profile}
                      </I18nLink>
                      {sessionUser.role === "admin" && (
                        <I18nLink href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-medium text-[#9a5f2f]">
                          <User2 className="size-4" />
                          {labels.admin}
                        </I18nLink>
                      )}
                      <form action={signOutAction}>
                        <button type="submit" className="flex items-center gap-3 text-sm font-medium text-red-700">
                          <LogOut className="size-4" />
                          {labels.logout}
                        </button>
                      </form>
                    </>
                  ) : (
                    <I18nLink href="/login" onClick={() => setIsMobileMenuOpen(false)} className="inline-flex rounded-full bg-[#6f4e37] px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5d412e]">
                      {labels.login}
                    </I18nLink>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <I18nLink href="/" className="inline-flex items-center">
            <Image
              src="/intensedesign.svg"
              alt="Intense Design"
              width={190}
              height={40}
              className="h-8 w-auto md:h-9 lg:h-10"
              priority
            />
          </I18nLink>
        </div>

        <nav className="hidden md:flex items-center justify-center gap-8 px-8">
          {primaryLinks.map((item) => (
            <I18nLink
              key={item.label}
              href={item.href}
              className="text-sm font-medium tracking-[0.18em] text-[#5c4330] transition-colors hover:text-[#9a5f2f]"
            >
              {item.label}
            </I18nLink>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-1 sm:gap-2 lg:w-[280px]">
          <LanguageSwitcher />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-[#6f4e37] hover:bg-[#fff4e8] hover:text-[#9a5f2f]"
            aria-label="Search"
          >
            <Search className="size-4.5" />
          </Button>

          <I18nLink href="/account" className="inline-flex">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-[#6f4e37] hover:bg-[#fff4e8] hover:text-[#9a5f2f]"
              aria-label="Favorites"
            >
              <Heart className="size-4.5" />
            </Button>
          </I18nLink>

          <CartSheet />

          {sessionUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden rounded-full md:inline-flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#c8996d] via-[#b37a4c] to-[#6f4e37] text-xs font-semibold text-white shadow-md">
                    {sessionUser.name?.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-[#eadfce] bg-white/95 p-2 shadow-xl">
                <DropdownMenuLabel>{labels.profile}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <I18nLink href="/account"><DropdownMenuItem className="cursor-pointer rounded-xl">{labels.profile}</DropdownMenuItem></I18nLink>
                {sessionUser.role === "admin" && (
                  <I18nLink href="/admin"><DropdownMenuItem className="cursor-pointer rounded-xl font-semibold text-[#9a5f2f]">{labels.admin}</DropdownMenuItem></I18nLink>
                )}
                <DropdownMenuSeparator />
                <form action={signOutAction}>
                  <button type="submit" className="w-full text-left">
                    <DropdownMenuItem className="cursor-pointer rounded-xl text-red-600">
                      <LogOut className="mr-2 h-4 w-4" /> {labels.logout}
                    </DropdownMenuItem>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <I18nLink href="/login" className="hidden md:inline-flex">
              <Button className="rounded-full bg-[#6f4e37] px-5 text-white shadow-sm hover:bg-[#5d412e]">{labels.login}</Button>
            </I18nLink>
          )}
        </div>
      </div>
    </header>
  );
}