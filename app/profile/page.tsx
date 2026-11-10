import type { Metadata } from "next";

import { MyListings } from "@/components/profile/MyListings";
import { SellerProfileForm } from "@/components/profile/SellerProfileForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Профиль и мои объекты",
  description: "Профиль собственника или риелтора на SILKX: контакты, данные агентства и карточка продавца для ваших объявлений.",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <>
      <SiteHeader />
      <main className="container pb-10 pt-8 sm:pt-12">
        <div className="mx-auto mb-8 max-w-5xl">
          <p className="text-xs font-medium uppercase tracking-wider text-gold">Для продавцов</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">Профиль продавца</h1>
          <p className="mt-3 max-w-2xl text-base">
            Заполните один раз — контакты подставятся в каждое новое объявление. Риелторы и агентства могут добавить данные компании.
          </p>
        </div>
        <SellerProfileForm />
        <MyListings />
      </main>
      <SiteFooter />
    </>
  );
}
