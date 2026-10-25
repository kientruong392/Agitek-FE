"use client";

import Image from "next/image";
import Form from "next/form";
import { LoaderCircle, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/actions/home.action";
import { semanticSearchProducts } from "@/actions/product.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category, Product } from "@/types/model.types";

const FALLBACK_IMAGE = "/images/no-image.png";

function getProductImage(product: Product) {
  const primaryImage = product.images?.find((image) => image.isPrimary) ?? product.images?.[0];
  return primaryImage?.imageUrl || FALLBACK_IMAGE;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export default function MiddleSection() {
  const t = useTranslations("Header");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories", "with-subcategories"],
    queryFn: getCategories,
  });
  const parentCategories = categories?.filter((category) => category.parentCategoryId == null) ?? [];

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) return;

    let isCurrentRequest = true;
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchFailed(false);

      const response = await semanticSearchProducts(normalizedQuery);
      if (!isCurrentRequest) return;

      setResults(response.success ? response.data ?? [] : []);
      setSearchFailed(!response.success);
      setIsSearching(false);
    }, 350);

    return () => {
      isCurrentRequest = false;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearchFailed(false);
    setIsSearchOpen(false);
    setIsSearching(false);
  };

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setResults([]);
    setSearchFailed(false);
    setIsSearching(value.trim().length >= 2);
  };

  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" className="gap-1.5 rounded-full">
              <Menu />
              <span className="hidden sm:inline">{t("categories")}</span>
            </Button>
          }
        />
        <DropdownMenuContent className="min-w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("categories")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {parentCategories.map((category) => (
              <DropdownMenuSub key={category.id}>
                <DropdownMenuSubTrigger>{category.categoryName}</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuGroup>
                    <DropdownMenuItem nativeButton={false} render={<Link href={`/category/${category.slug}`} />}>
                      {category.categoryName}
                    </DropdownMenuItem>
                    {category.subCategories?.map((subCategory) => (
                      <DropdownMenuItem key={subCategory.id} nativeButton={false} render={<Link href={`/category/${subCategory.slug}`} />}>
                        {subCategory.categoryName}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
            {!parentCategories.length && <DropdownMenuItem disabled>...</DropdownMenuItem>}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Form
        action="/search"
        role="search"
        className="relative w-full max-w-2xl"
        onSubmit={(event) => {
          if (query.trim().length < 2) {
            event.preventDefault();
            return;
          }
          setIsSearchOpen(false);
        }}
      >
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full text-muted-foreground"
          aria-label={t("search")}
        >
          <Search className="size-4" />
        </Button>
        <Input
          type="search"
          name="q"
          value={query}
          required
          minLength={2}
          maxLength={500}
          aria-label={t("search")}
          placeholder={t("searchPlaceholder")}
          className="h-9 w-full rounded-full pl-9 pr-9 text-sm"
          onChange={(event) => handleSearchChange(event.target.value)}
          onFocus={() => setIsSearchOpen(true)}
          onBlur={() => window.setTimeout(() => setIsSearchOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.key === "Escape") clearSearch();
          }}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearSearch}
            aria-label={t("clearSearch")}
          >
            <X className="size-4" />
          </Button>
        )}
        {isSearchOpen && query.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg">
            <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">{t("searchResults")}</div>
            {isSearching ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                {t("searching")}
              </div>
            ) : searchFailed ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t("searchError")}</p>
            ) : results.length ? (
              <ul className="max-h-[min(60vh,28rem)] overflow-y-auto py-1" role="listbox">
                {results.map((product) => {
                  const price = product.discountPrice ?? product.originalPrice;
                  return (
                    <li key={product.id}>
                      <Link
                        href={`/product/${product.slug}`}
                        className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
                        onClick={clearSearch}
                      >
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image src={getProductImage(product)} alt={product.productName} fill className="object-contain p-1" unoptimized />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{product.productName}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{product.sku}</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-primary">{formatPrice(price)}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t("noSearchResults")}</p>
            )}
          </div>
        )}
      </Form>
    </div>
  );
}

