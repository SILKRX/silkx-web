import type { Metadata } from "next";
import Link from "next/link";

import { ClearDeviceDataButton, CookieSettingsButton } from "@/components/legal/LocalDataButtons";
import { LegalPage } from "@/components/legal/LegalPage";
import { BROWSER_STORAGE, THIRD_PARTIES } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Политика cookies",
  description: "Какие данные SILKX сохраняет в браузере, какие сторонние сервисы подключаются и как изменить выбор.",
};

const CATEGORY: Record<(typeof BROWSER_STORAGE)[number]["category"], string> = {
  necessary: "Необходимые",
  functional: "Функциональные (необходимые)",
  maps: "Карты Яндекса — только с согласия",
};

export default function CookiesPage() {
  const browserServices = THIRD_PARTIES.filter((t) => t.side === "browser");
  return (
    <LegalPage
      title="Политика cookies"
      path="/cookies"
      lead={<>SILKX не использует рекламные, аналитические и трекинговые cookies. Мы не отслеживаем вас на других сайтах.</>}
    >
      <h2>1. Что сохраняется в браузере</h2>
      <p>
        Сайт сам не устанавливает cookies — небольшие настройки хранятся в локальном хранилище браузера (localStorage) и не
        передаются на сервер. Без них сайт не запомнит тему, язык и черновик формы.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Назначение</th>
              <th>Категория</th>
              <th>Срок</th>
            </tr>
          </thead>
          <tbody>
            {BROWSER_STORAGE.map((s) => (
              <tr key={s.key}>
                <td>
                  <code>{s.key}</code>
                </td>
                <td>{s.purpose}</td>
                <td>{CATEGORY[s.category]}</td>
                <td>{s.lifetime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>2. Сторонние сервисы в браузере</h2>
      <p>Эти сервисы загружаются напрямую в ваш браузер и получают ваш IP-адрес:</p>
      <ul>
        {browserServices.map((t) => (
          <li key={t.name}>
            <strong>{t.name}</strong> ({t.country}) — {t.purpose.toLowerCase()}. {t.whenUsed}.{" "}
            {t.cookies ? "Ставит cookies." : "Cookies не ставит."}
          </li>
        ))}
      </ul>
      <p>
        Карты Яндекса включаются только если вы выбрали «Принять все» или отметили их в настройках. Иначе показывается карта
        OpenStreetMap без cookies.
      </p>

      <h2>3. Как изменить выбор или удалить данные</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        <CookieSettingsButton />
        <ClearDeviceDataButton />
      </div>
      <p>
        Также можно очистить данные сайта в настройках браузера. Данные, переданные с заявками, удаляются по{" "}
        <Link href="/data-request">запросу</Link>.
      </p>
    </LegalPage>
  );
}
