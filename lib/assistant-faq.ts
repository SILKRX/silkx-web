import type { AssistantLang } from "@/lib/property-details";
import { SITE } from "@/lib/site-config";

/**
 * Готовые ответы SILKX AI на частые вопросы о сайте — мгновенно, без запроса к Claude API (0 токенов).
 * Для каждой темы — варианты того, как клиент может написать вопрос на 6 языках (с ошибками и сленгом).
 * Вопросы о конкретных квартирах, ценах, ипотеке и т. п. сюда НЕ попадают — их решает ИИ по каталогу.
 *
 * Как добавить тему: новый объект в FAQ — id, patterns (регулярки по НОРМАЛИЗОВАННОМУ тексту:
 * нижний регистр, «ё» → «е», без знаков препинания), answer на всех 6 языках, при желании links.
 */

export interface FaqLink {
  title: Record<AssistantLang, string>;
  href: string;
}

interface FaqEntry {
  id: string;
  /** true — сообщение должно целиком состоять из фразы (приветствие, «спасибо»), а не просто содержать её. */
  whole?: boolean;
  patterns: RegExp[];
  answer: Record<AssistantLang, string>;
  links?: FaqLink[];
}

const TG = SITE.socials.telegram ? "Telegram" : "";

const L = {
  hotels: { href: "/hotels", title: { ru: "Отели Ташкента", uz: "Toshkent mehmonxonalari", en: "Hotels in Tashkent", zh: "塔什干酒店", ko: "타슈켄트 호텔", tr: "Taşkent otelleri" } },
  add: { href: "/add", title: { ru: "Разместить объект", uz: "E'lon joylash", en: "List a property", zh: "发布房源", ko: "매물 등록", tr: "İlan ver" } },
  catalog: { href: "/catalog", title: { ru: "Новостройки", uz: "Yangi uylar", en: "New developments", zh: "新楼盘", ko: "신축 단지", tr: "Yeni projeler" } },
  rent: { href: "/catalog?type=rent", title: { ru: "Аренда", uz: "Ijara", en: "Rentals", zh: "租房", ko: "임대", tr: "Kiralık" } },
} satisfies Record<string, FaqLink>;

export const FAQ: readonly FaqEntry[] = [
  {
    id: "greeting",
    whole: true,
    patterns: [
      /^(привет\p{L}*|здравствуй\p{L}*|здрасте|добрый (день|вечер)|доброе утро|салам|салом|ассалому? алейкум|assalomu? alaykum|salom|hello|hi|hey|good (morning|afternoon|evening)|你好|您好|嗨|안녕\p{L}*|merhaba|selam|iyi günler)( \p{L}+)?$/u,
    ],
    answer: {
      ru: "Здравствуйте! Я SILKX AI. Помогу подобрать новостройку, аренду или отель в Ташкенте, расскажу про ипотеку и 3D-туры. Что ищете?",
      uz: "Assalomu alaykum! Men SILKX AI. Toshkentda yangi uy, ijara yoki mehmonxona tanlashga, ipoteka va 3D-turlar haqida yordam beraman. Nima qidiryapsiz?",
      en: "Hello! I'm SILKX AI. I can help you find a new-build apartment, a rental or a hotel in Tashkent, and explain mortgages and 3D tours. What are you looking for?",
      zh: "您好！我是 SILKX AI。可以帮您在塔什干挑选新房、租房或酒店，也能介绍贷款和3D看房。您在找什么样的房子？",
      ko: "안녕하세요! SILKX AI입니다. 타슈켄트의 신축 아파트, 임대, 호텔을 찾아 드리고 대출과 3D 투어도 안내해 드려요. 무엇을 찾으세요?",
      tr: "Merhaba! Ben SILKX AI. Taşkent'te yeni konut, kiralık ev veya otel bulmanıza, kredi ve 3D turlar hakkında bilgi vermeye yardımcı olurum. Ne arıyorsunuz?",
    },
  },
  {
    id: "thanks",
    whole: true,
    patterns: [/^(спасибо|спс|благодарю|рахмат|raxmat|rahmat|katta rahmat|thanks?( you)?|thx|ty|谢谢|多谢|감사합니다|고마워요?|teşekkürler|teşekkür ederim|sağ ol)( \p{L}+)?$/u],
    answer: {
      ru: "Пожалуйста! Если появятся вопросы о квартирах, отелях или ипотеке — пишите, я на связи круглосуточно.",
      uz: "Arzimaydi! Kvartira, mehmonxona yoki ipoteka bo'yicha savollar bo'lsa — yozing, men 24/7 aloqadaman.",
      en: "You're welcome! If you have more questions about apartments, hotels or mortgages, just ask — I'm here 24/7.",
      zh: "不客气！如果还有关于房源、酒店或贷款的问题，随时问我，我全天候在线。",
      ko: "천만에요! 아파트, 호텔, 대출에 대해 더 궁금한 점이 있으면 언제든 물어보세요. 24시간 대기 중이에요.",
      tr: "Rica ederim! Daire, otel veya kredi hakkında başka sorunuz olursa yazın, 7/24 buradayım.",
    },
  },
  {
    id: "about-bot",
    patterns: [
      /(ты кто|кто ты|что ты (умеешь|можешь)|чем (ты )?(можешь )?помочь|ты (бот|робот|человек)|sen kimsan|nima qila olasan|who are you|what can you do|are you (a )?(bot|human|real)|你是谁|你能做什么|누구(세요|야)|뭘 할 수|sen kimsin|ne yapabilirsin)/u,
    ],
    answer: {
      ru: "Я SILKX AI — ассистент по недвижимости Ташкента. Подбираю новостройки, аренду и отели по вашим условиям, объясняю ипотеку и рассрочку, отвечаю голосом и на шести языках. С живым менеджером свяжу через Telegram.",
      uz: "Men SILKX AI — Toshkent ko'chmas mulk yordamchisiman. Shartlaringiz bo'yicha yangi uy, ijara va mehmonxona tanlayman, ipoteka va nasiyani tushuntiraman, ovozda va olti tilda javob beraman.",
      en: "I'm SILKX AI, a Tashkent real estate assistant. I match new builds, rentals and hotels to your needs, explain mortgages and installment plans, and answer by voice in six languages. A human manager is available on Telegram.",
      zh: "我是 SILKX AI，塔什干房产助手。根据您的需求推荐新房、租房和酒店，讲解贷款和分期，支持语音和六种语言。也可以通过 Telegram 联系人工经理。",
      ko: "저는 타슈켄트 부동산 도우미 SILKX AI입니다. 조건에 맞는 신축, 임대, 호텔을 추천하고 대출과 할부를 설명하며 6개 언어로 음성 답변도 해요. 담당 매니저는 텔레그램으로 연결해 드려요.",
      tr: "Ben SILKX AI, Taşkent emlak asistanıyım. İhtiyacınıza göre yeni konut, kiralık ve otel öneririm, kredi ve taksitleri anlatırım, altı dilde sesli yanıt veririm. Canlı yöneticiye Telegram'dan ulaşabilirsiniz.",
    },
  },
  {
    id: "contacts",
    patterns: [
      /(контакт|телефон (менеджер|офис|компан)|номер (менеджер|телефон)|как (с вами )?связаться|позвонить (вам|менеджер)|менеджер|оператор|живой человек|где (вы )?находитесь|адрес офиса|aloqa|bog'lan|telefon raqam|menejer|contact|phone number|call (you|a manager)|talk to (a )?(human|manager|person)|manager|联系|电话|经理|人工|연락처|전화번호|매니저|상담원|iletişim|telefon numara|yetkili|temsilci)/u,
    ],
    answer: {
      ru: `Связаться с менеджером SILKX проще всего в ${TG || "форме на сайте"} — отвечаем в рабочее время. Напишите, какой объект интересует, и мы пришлём планировки и условия.`,
      uz: `SILKX menejeri bilan eng oson ${TG || "saytdagi forma"} orqali bog'lanish mumkin — ish vaqtida javob beramiz. Qaysi obyekt qiziqtirayotganini yozing.`,
      en: `The easiest way to reach a SILKX manager is ${TG || "the form on the site"} — we reply during working hours. Tell us which property you like and we'll send floor plans and terms.`,
      zh: `联系 SILKX 经理最方便的方式是 ${TG || "网站表单"}，工作时间内回复。告诉我们您感兴趣的房源，我们会发送户型和条件。`,
      ko: `SILKX 매니저와는 ${TG || "사이트 문의 양식"}으로 가장 쉽게 연락하실 수 있어요. 업무 시간에 답변드립니다. 관심 있는 매물을 알려 주세요.`,
      tr: `SILKX yöneticisine en kolay ${TG || "sitedeki form"} üzerinden ulaşabilirsiniz; mesai saatlerinde yanıt veriyoruz. İlgilendiğiniz ilanı yazın, planları ve koşulları gönderelim.`,
    },
  },
  {
    id: "tour-3d",
    patterns: [
      /(3d|3 д|3д|360|виртуальн\p{L}* (тур|осмотр|просмотр)|как (работает|смотреть|посмотреть) (тур|3d)|панорам|virtual tour|panorama|how (does|do) (the )?(3d|tour)|全景|3d看房|vr看房|가상 투어|파노라마|sanal tur)/u,
    ],
    answer: {
      ru: "3D-тур — это панорама 360° каждой комнаты. Нажмите «3D-тур 360°» на странице объекта или номера отеля, тяните картинку пальцем или мышью, щипком приближайте, а комнаты переключайте внизу. Работает на телефоне без приложений.",
      uz: "3D-tur — har bir xonaning 360° panoramasi. Obyekt yoki mehmonxona xonasi sahifasida «3D-tur 360°» tugmasini bosing, rasmni barmoq yoki sichqoncha bilan suring, xonalarni pastda almashtiring. Telefonda ilovasiz ishlaydi.",
      en: "A 3D tour is a 360° panorama of every room. Tap \"3D tour 360°\" on a property or hotel room page, drag the image with your finger or mouse, pinch to zoom and switch rooms at the bottom. It works on a phone with no app.",
      zh: "3D看房是每个房间的360°全景。在房源或酒店房间页面点击“3D-тур 360°”，用手指或鼠标拖动画面，双指缩放，在下方切换房间。手机即可使用，无需安装应用。",
      ko: "3D 투어는 각 방의 360° 파노라마예요. 매물이나 호텔 객실 페이지에서 “3D-тур 360°”를 누르고 손가락이나 마우스로 화면을 끌어 보세요. 아래에서 방을 바꿀 수 있고 앱 없이 휴대폰에서 작동해요.",
      tr: "3D tur, her odanın 360° panoramasıdır. İlan veya otel odası sayfasında \"3D-тур 360°\" düğmesine basın, görüntüyü parmağınızla veya fareyle sürükleyin, odaları alttan değiştirin. Uygulama gerekmez.",
    },
  },
  {
    id: "hotel-booking",
    patterns: [
      /(отел\p{L}*|гостиниц\p{L}*|хостел|забронировать|бронирован\p{L}*|бронь|номер в отеле|посуточн\p{L}*|переночевать|mehmonxona|bron qil|otel|hotel|book(ing)? (a )?room|stay overnight|酒店|宾馆|订房|预订|호텔|숙소|예약|rezervasyon|oda ayırt)/u,
    ],
    answer: {
      ru: "Отели собраны в разделе «Отели»: у каждого — фото, адрес на карте, телефон ресепшена и 3D-тур номеров. Чтобы забронировать, выберите номер, даты и число гостей и нажмите «Забронировать» — предоплата не нужна, отель подтвердит бронь по телефону.",
      uz: "Mehmonxonalar «Mehmonxonalar» bo'limida: rasm, xaritadagi manzil, qabulxona telefoni va xonalarning 3D-turi bor. Bron qilish uchun xona, sana va mehmonlar sonini tanlab «Bron qilish» tugmasini bosing — oldindan to'lov shart emas.",
      en: "Hotels are in the Hotels section: each has photos, a map location, the reception phone and 3D tours of the rooms. To book, choose a room, dates and number of guests and press \"Book\" — no prepayment, the hotel confirms by phone.",
      zh: "酒店都在“酒店”栏目：每家都有照片、地图位置、前台电话和客房3D看房。选择房型、日期和人数后点击“预订”即可，无需预付，酒店会电话确认。",
      ko: "호텔은 ‘호텔’ 메뉴에 있어요. 사진, 지도 위치, 프런트 전화번호, 객실 3D 투어가 있어요. 객실, 날짜, 인원을 고르고 ‘예약’을 누르면 되고 선결제는 없으며 호텔이 전화로 확정해요.",
      tr: "Oteller \"Oteller\" bölümünde: fotoğraflar, harita konumu, resepsiyon telefonu ve odaların 3D turu var. Oda, tarih ve kişi sayısını seçip \"Rezervasyon\"a basın; ön ödeme yok, otel telefonla onaylar.",
    },
    links: [L.hotels, L.rent],
  },
  {
    id: "list-property",
    patterns: [
      /(разместить|подать (объявлен|заявк)|добавить (объект|объявлен|квартир)|продать (свою |мою )?квартир|сдать (свою |мою )?квартир|хочу (продать|сдать)|e'lon (ber|joyla)|sotmoqchiman|ijaraga bermoqchiman|list (my|a) (property|apartment|flat)|sell my (apartment|flat|house)|rent out|发布房源|出租我的|卖我的房|매물 등록|집을 (팔|내놓)|ilan ver|evimi (satmak|kiralamak))/u,
    ],
    answer: {
      ru: "Разместить объект бесплатно: нажмите «Разместить объект», укажите точку на карте, цену и контакты, добавьте фото и, если есть, 360°-панорамы для 3D-тура. Модерация занимает до 24 часов, после проверки объявление появится в каталоге.",
      uz: "Obyektni bepul joylash: «E'lon joylash» tugmasini bosing, xaritada nuqta, narx va kontaktlarni ko'rsating, rasm va 360° panoramalarni qo'shing. Moderatsiya 24 soatgacha davom etadi.",
      en: "Listing is free: press \"List a property\", set the map point, price and contacts, add photos and, if you have them, 360° panoramas for a 3D tour. Moderation takes up to 24 hours, then the listing appears in the catalog.",
      zh: "免费发布房源：点击“发布房源”，在地图上标注位置，填写价格和联系方式，上传照片，如有360°全景可制作3D看房。审核最多24小时，通过后会出现在目录中。",
      ko: "매물 등록은 무료예요. ‘매물 등록’을 누르고 지도 위치, 가격, 연락처를 입력한 뒤 사진과 360° 파노라마를 추가하세요. 검수는 최대 24시간이 걸려요.",
      tr: "İlan vermek ücretsiz: \"İlan ver\"e basın, haritada konumu, fiyatı ve iletişim bilgilerini girin, fotoğraf ve varsa 360° panorama ekleyin. Onay en fazla 24 saat sürer.",
    },
    links: [L.add],
  },
  {
    id: "verified",
    patterns: [/(провер\p{L}* (объект|silkx)|что значит провер|мошенник|обман|kafolat|tekshirilgan|verified|is it safe|scam|fraud|认证|靠谱|骗|검증|사기|doğrulanmış|güvenilir mi|dolandırıcı)/u],
    answer: {
      ru: "Значок «Проверено SILKX» ставим только после проверки документов на право собственности, отсутствия обременений и репутации застройщика или собственника. Объявления от частных лиц проходят модерацию до публикации. Предоплату до осмотра и договора не переводите.",
      uz: "«SILKX tekshirgan» belgisi faqat mulk hujjatlari, taqiqlar yo'qligi va quruvchi yoki egasi obro'si tekshirilgandan keyin qo'yiladi. Ko'rib chiqish va shartnomadan oldin oldindan to'lov qilmang.",
      en: "The \"Verified by SILKX\" badge is given only after we check ownership documents, the absence of encumbrances and the developer's or owner's reputation. Private listings are moderated before publishing. Never prepay before a viewing and a contract.",
      zh: "只有在核实产权文件、无抵押查封以及开发商或房东信誉后，才会标注“SILKX已认证”。个人房源发布前均经过审核。看房和签合同前请勿预付款项。",
      ko: "‘SILKX 검증’ 배지는 소유권 서류, 담보·압류 여부, 개발사나 집주인의 평판을 확인한 뒤에만 붙여요. 개인 매물도 게시 전에 검수해요. 방문과 계약 전에는 선입금하지 마세요.",
      tr: "\"SILKX doğruladı\" rozeti yalnızca tapu belgeleri, ipotek/haciz olmadığı ve geliştiricinin ya da sahibinin itibarı kontrol edildikten sonra verilir. Görmeden ve sözleşmeden önce ön ödeme yapmayın.",
    },
    links: [L.catalog],
  },
  {
    id: "fees",
    patterns: [/(комисси\p{L}*|сколько (стоит|берете) (размещ|ваши услуг|услуг)|бесплатно ли|это платно|komissiya|pullikmi|bepulmi|commission|fee(s)?|is it free|do you charge|佣金|中介费|收费|免费吗|수수료|무료(인가요)?|komisyon|ücretli mi|ücretsiz mi)/u],
    answer: {
      ru: "Поиск, 3D-туры и консультации SILKX AI для покупателей и арендаторов бесплатны, размещение объектов для собственников — тоже. Цены новостроек — напрямую от застройщиков, без наценки. Условия по конкретной сделке уточнит менеджер.",
      uz: "Xaridorlar va ijarachilar uchun qidiruv, 3D-turlar va SILKX AI maslahatlari bepul, egalari uchun e'lon joylash ham bepul. Yangi uylar narxi — to'g'ridan-to'g'ri quruvchidan.",
      en: "Search, 3D tours and SILKX AI consultations are free for buyers and renters, and listing is free for owners. New-build prices come directly from developers with no markup. A manager will confirm the terms of a specific deal.",
      zh: "对买家和租客来说，搜索、3D看房和 SILKX AI 咨询都是免费的，房东发布房源也免费。新房价格直接来自开发商，没有加价。具体交易条件请咨询经理。",
      ko: "구매자와 임차인에게 검색, 3D 투어, SILKX AI 상담은 무료이고 집주인의 매물 등록도 무료예요. 신축 가격은 개발사 직거래가예요. 개별 거래 조건은 매니저가 안내해요.",
      tr: "Alıcılar ve kiracılar için arama, 3D turlar ve SILKX AI danışmanlığı ücretsizdir; ev sahipleri için ilan vermek de ücretsizdir. Yeni konut fiyatları doğrudan geliştiriciden gelir.",
    },
  },
  {
    id: "languages",
    patterns: [/(на каком языке|какие языки|говоришь (по|на)|qaysi tilda|qanday tillar|what languages|do you speak|你会说|支持什么语言|中文可以吗|어떤 언어|한국어 (돼|되나요)|hangi dil|türkçe biliyor)/u],
    answer: {
      ru: "Я отвечаю на русском, узбекском, английском, китайском, корейском и турецком — язык переключается вверху чата. Можно говорить голосом: нажмите на микрофон.",
      uz: "Men rus, o'zbek, ingliz, xitoy, koreys va turk tillarida javob beraman — til chat tepasida almashtiriladi. Ovozda ham gapirish mumkin: mikrofonni bosing.",
      en: "I answer in Russian, Uzbek, English, Chinese, Korean and Turkish — switch the language at the top of the chat. You can also talk by voice: tap the microphone.",
      zh: "我可以用俄语、乌兹别克语、英语、中文、韩语和土耳其语回答，在聊天顶部切换语言。也可以点击麦克风语音提问。",
      ko: "러시아어, 우즈베크어, 영어, 중국어, 한국어, 터키어로 답변해요. 채팅 상단에서 언어를 바꾸고, 마이크를 누르면 음성으로도 대화할 수 있어요.",
      tr: "Rusça, Özbekçe, İngilizce, Çince, Korece ve Türkçe yanıt veriyorum; dili sohbetin üstünden değiştirebilirsiniz. Mikrofona basarak sesli de konuşabilirsiniz.",
    },
  },
];

/** Нормализация для сопоставления: регистр, «ё», пунктуация, повторные пробелы. Буквы любых алфавитов сохраняются. */
export function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[‘’ʻʼ`]/g, "'")
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Длинные сообщения — почти всегда конкретный запрос; их отдаём ИИ, даже если в них есть «отель» или «3D». */
const MAX_FAQ_LENGTH = 90;

export interface FaqReply {
  id: string;
  reply: string;
  links: Array<{ title: string; href: string }>;
}

export function faqReply(text: string, lang: AssistantLang): FaqReply | null {
  const q = normalizeQuestion(text);
  if (!q || q.length > MAX_FAQ_LENGTH) return null;
  const entry = FAQ.find((e) => e.patterns.some((re) => re.test(q)) && (!e.whole || q.split(" ").length <= 4));
  if (!entry) return null;
  return {
    id: entry.id,
    reply: entry.answer[lang],
    links: (entry.links ?? []).map((l) => ({ title: l.title[lang], href: l.href })),
  };
}
