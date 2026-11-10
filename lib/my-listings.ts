import type { Currency, DealType, DistrictSlug } from "@/lib/types";

/**
 * «Мои объекты» — объявления, отправленные с этого устройства. Пока нет входа в аккаунт, список хранится
 * в браузере (localStorage) и показывается в профиле продавца. Статус меняет модератор; до подключения
 * личного кабинета здесь всегда «На модерации».
 */
export const MY_LISTINGS_KEY = "silkx:my-listings:v1";
export const MY_LISTINGS_EVENT = "silkx:my-listings-change";
const MAX_ITEMS = 50;

export interface MyListing {
  id: string;
  title: string;
  dealType: DealType;
  price: number;
  currency: Currency;
  district: DistrictSlug | "";
  createdAt: string;
  /** true — БД не подключена, объявление не сохранено на сервере (демо-режим) */
  demo: boolean;
}

export function loadMyListings(): MyListing[] {
  try {
    const raw = localStorage.getItem(MY_LISTINGS_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? (list.filter((x) => x && typeof x.id === "string" && typeof x.title === "string") as MyListing[]) : [];
  } catch {
    return [];
  }
}

function save(list: MyListing[]): void {
  try {
    localStorage.setItem(MY_LISTINGS_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
    window.dispatchEvent(new Event(MY_LISTINGS_EVENT));
  } catch {
    /* квота / приватный режим */
  }
}

export function addMyListing(item: MyListing): void {
  save([item, ...loadMyListings().filter((x) => x.id !== item.id)]);
}

export function removeMyListing(id: string): void {
  save(loadMyListings().filter((x) => x.id !== id));
}
