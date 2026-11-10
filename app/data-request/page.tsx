import type { Metadata } from "next";
import Link from "next/link";

import { DataRequestForm } from "@/components/legal/DataRequestForm";
import { LegalPage } from "@/components/legal/LegalPage";
import { ClearDeviceDataButton, CookieSettingsButton } from "@/components/legal/LocalDataButtons";
import { DATA_REQUEST_RESPONSE_DAYS } from "@/lib/data-request";

export const metadata: Metadata = {
  title: "Мои данные: удалить, изменить, отписаться",
  description: "Удалите свои персональные данные на SILKX, получите копию, исправьте их или отпишитесь от сообщений.",
};

export default function DataRequestPage() {
  return (
    <LegalPage title="Мои данные" path="/data-request" lead={<>Удалить, получить копию, исправить данные, отозвать согласие или отписаться — бесплатно.</>}>
      <h2>Данные на этом устройстве</h2>
      <p>
        Тема, язык, черновик объявления, профиль продавца и выбор cookies хранятся только в вашем браузере. Удалите их одним
        нажатием — без запроса к нам.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <ClearDeviceDataButton />
        <CookieSettingsButton />
      </div>

      <h2>Данные, отправленные с заявками</h2>
      <p>
        Заявки на бронирование, объявления и запросы хранятся у нас. Чтобы удалить, получить, исправить их или отозвать согласие,
        отправьте запрос — ответим в течение {DATA_REQUEST_RESPONSE_DAYS} рабочих дней. Мы можем попросить подтвердить, что
        данные ваши (например, звонком на указанный номер). Подробнее — в <Link href="/privacy#rights">Политике конфиденциальности</Link>.
      </p>
      <DataRequestForm />
    </LegalPage>
  );
}
