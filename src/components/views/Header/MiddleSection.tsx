"use client";

import { Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/actions/home.action";
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
import type { Category } from "@/types/model.types";

export default function MiddleSection() {
  const t = useTranslations("Header");
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories", "with-subcategories"],
    queryFn: getCategories,
  });
  const parentCategories = categories?.filter((category) => category.parentCategoryId == null) ?? [];

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
                    {category.subCategories?.length ? category.subCategories.map((subCategory) => (
                      <DropdownMenuItem key={subCategory.id}>{subCategory.categoryName}</DropdownMenuItem>
                    )) : <DropdownMenuItem disabled>{category.categoryName}</DropdownMenuItem>}
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
            {!parentCategories.length && <DropdownMenuItem disabled>...</DropdownMenuItem>}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="relative w-full max-w-2xl">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" placeholder={t("searchPlaceholder")} className="h-9 w-full rounded-full pl-9 text-sm" />
      </div>
    </div>
  );
}
