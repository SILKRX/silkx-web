import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";
import { REQUISITES, req } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Реквизиты",
  description: "Реквизиты владельца сервиса SILKX.",
};

export default function RequisitesPage() {
  const rows: Array<[string, string]> = [
    ["Наименование", req(REQUISITES.companyName)],
    ["ИНН (СТИР)", req(REQUISITES.inn)],
    ["ОКЭД", req(REQUISITES.oked)],
    ["Юридический адрес", req(REQUISITES.legalAddress)],
    ["Почтовый адрес", req(REQUISITES.postalAddress || REQUISITES.legalAddress)],
    ["Руководитель", req(REQUISITES.director)],
    ["Банк", req(REQUISITES.bankName)],
    ["МФО", req(REQUISITES.mfo)],
    ["Расчётный счёт", req(REQUISITES.account)],
    ["Телефон", req(REQUISITES.phone)],
    ["E-mail", req(REQUISITES.email)],
    ["E-mail по персональным данным", req(REQUISITES.privacyEmail || REQUISITES.email)],
    ["Регистрация базы персональных данных", req(REQUISITES.pdRegistryNumber)],
  ];
  return (
    <LegalPage title="Реквизиты" path="/requisites">
      <div className="table-wrap">
        <table>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}>
                <th className="w-1/3">{k}</th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LegalPage>
  );
}
