import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";
import { LICENSES } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Лицензии",
  description: "Шрифты, изображения, панорамы и библиотеки, используемые на SILKX, и их лицензии.",
};

export default function LicensesPage() {
  return (
    <LegalPage title="Лицензии" path="/licenses" lead={<>Шрифты, изображения и программные компоненты, использованные на сайте, и условия их использования.</>}>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Компонент</th>
              <th>Где используется</th>
              <th>Лицензия</th>
              <th>Примечание</th>
            </tr>
          </thead>
          <tbody>
            {LICENSES.map((l) => (
              <tr key={l.name}>
                <td>
                  <a href={l.url} target={l.url.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                    {l.name}
                  </a>
                </td>
                <td>{l.usage}</td>
                <td>{l.license}</td>
                <td>{l.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Картографические данные © участники OpenStreetMap, © CARTO. Панорамы интерьеров — Poly Haven (CC0). Демо-фото —
        Unsplash.
      </p>
    </LegalPage>
  );
}
