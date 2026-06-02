/**
 * seed.ts
 * Однократная миграция: заливает все данные в SQLite.
 * Вызывается один раз при первом запуске приложения.
 *
 * Когда добавляешь новый памятник — просто добавь его сюда.
 * Структура: сначала describe LANGS, потом monumentSeedData и routeSeedData.
 */

import { db, markSeeded } from './database';
import { CITIES } from '../data/cities';

// ─── Типы ────────────────────────────────────────────────────────────────────

type Lang = 'ru' | 'en' | 'ar' | 'zh';

type MonumentTranslations = {
  [lang in Lang]: Record<string, string>;
};

type FieldConfigItem = {
  section: 'details' | 'visitors';
  labelKey: string;         // monument_fields.xxx  (остаётся в i18n JSON)
  fieldKey?: string;        // ключ из translations (например 'height')
  staticValue?: string;     // если значение одинаково на всех языках
};

type MonumentSeed = {
  slug: string;
  citySlug: string;
  lat: number;
  lon: number;
  imageUrl: string;
  sortOrder?: number;
  fields: FieldConfigItem[];
  translations: MonumentTranslations;
};

type RouteSeed = {
  slug: string;
  citySlug: string;
  coverMonumentSlug: string;
  sortOrder?: number;
  monumentSlugs: string[];
  translations: { [lang in Lang]: { name: string; description: string } };
};

// ─── Данные памятников ────────────────────────────────────────────────────────

const monumentSeedData: MonumentSeed[] = [
  {
    slug: 'motherland-calls',
    citySlug: 'volgograd',
    lat: 48.7423,
    lon: 44.5370,
    imageUrl: 'https://avatars.mds.yandex.net/get-altay/2383444/2a00000174ff2ecda3fbaf5c67a8001d5714/L_height',
    sortOrder: 1,
    fields: [
      { section: 'details', labelKey: 'monument_fields.year',      staticValue: '1967' },
      { section: 'details', labelKey: 'monument_fields.height',    fieldKey: 'height' },
      { section: 'details', labelKey: 'monument_fields.architect', fieldKey: 'architect' },
      { section: 'details', labelKey: 'monument_fields.sculptor',  fieldKey: 'sculptor' },
      { section: 'details', labelKey: 'monument_fields.material',  fieldKey: 'material' },
      { section: 'visitors', labelKey: 'monument_fields.visitors', fieldKey: 'visitors' },
      { section: 'visitors', labelKey: 'monument_fields.status',   fieldKey: 'status' },
    ],
    translations: {
      ru: {
        name: 'Родина-мать зовёт!',
        location: 'Волгоград, Россия',
        description: '«Родина-мать зовёт!» — скульптура, расположенная на Мамаевом кургане в Волгограде...',
        height: '85 м',
        architect: 'Николай Никитин',
        sculptor: 'Евгений Вучетич',
        material: 'Железобетон, металл',
        visitors: '~2 млн',
        status: 'Открыт',
      },
      en: {
        name: 'The Motherland Calls',
        location: 'Volgograd, Russia',
        description: 'The Motherland Calls is a statue on Mamayev Kurgan...',
        height: '85 m',
        architect: 'Nikolay Nikitin',
        sculptor: 'Yevgeny Vuchetich',
        material: 'Concrete, Metal',
        visitors: '~2 millions',
        status: 'Open',
      },
      ar: {
        name: 'الوطن الأم ينادي!',
        location: 'فولغوغراد، روسيا',
        description: '«الوطن الأم ينادي!» هو تمثال يقع على تل مامايف في فولغوغراد...',
        height: '85 م',
        architect: 'نيكولاي نيكيتين',
        sculptor: 'يفغيني فوتشيتيتش',
        material: 'خرسانة، معدن',
        visitors: '~2 مليون',
        status: 'مفتوح',
      },
      zh: {
        name: '祖国母亲在召唤！',
        location: '俄罗斯，伏尔加格勒',
        description: '"祖国母亲在召唤！"是位于伏尔加格勒马马耶夫岗的雕塑...',
        height: '85米',
        architect: '尼古拉·尼基京',
        sculptor: '叶夫根尼·武切季奇',
        material: '混凝土、金属',
        visitors: '约200万',
        status: '开放',
      },
    },
  },
  {
    slug: 'lysaya-gora-memorial',
    citySlug: 'volgograd',
    lat: 48.6424,
    lon: 44.3949,
    imageUrl: 'https://avatars.mds.yandex.net/i?id=b862554392b2aa2992b8486daf6a763a_l-10235419-images-thumbs&n=13',
    sortOrder: 2,
    fields: [
      { section: 'details', labelKey: 'monument_fields.year',             staticValue: '1968' },
      { section: 'details', labelKey: 'monument_fields.strategic_height', fieldKey: 'strategic_height' },
      { section: 'details', labelKey: 'monument_fields.obelisk_height',   fieldKey: 'obelisk_height' },
      { section: 'details', labelKey: 'monument_fields.main_elements',    fieldKey: 'main_elements' },
      { section: 'visitors', labelKey: 'monument_fields.visitors',        fieldKey: 'visitors' },
      { section: 'visitors', labelKey: 'monument_fields.status',          fieldKey: 'status' },
      { section: 'visitors', labelKey: 'monument_fields.schedule',        fieldKey: 'schedule' },
    ],
    translations: {
      ru: {
        name: 'Мемориальный комплекс «Лысая гора»',
        location: 'Волгоград, Россия',
        description: 'Мемориальный комплекс на Лысой горе в Волгограде — место ожесточённых боёв...',
        strategic_height: '145,5 м',
        obelisk_height: '20 м',
        main_elements: 'Обелиск, братские могилы, площадка военной техники',
        visitors: '~500 тыс.',
        status: 'Открыт',
        schedule: 'Круглосуточно',
      },
      en: {
        name: 'Memorial Complex "Lysaya Gora" (Bald Hill)',
        location: 'Volgograd, Russia',
        description: 'The memorial complex on Lysaya Gora in Volgograd marks the site of fierce battles...',
        strategic_height: '145.5 m',
        obelisk_height: '20 m',
        main_elements: 'Obelisk, mass graves, military equipment display area',
        visitors: '~500 thousand',
        status: 'Open',
        schedule: '24/7',
      },
      ar: {
        name: 'مجمع تذكاري «الجبل الأصلع»',
        location: 'فولغوغراد، روسيا',
        description: 'المجمع التذكاري على الجبل الأصلع في فولغوغراد هو موقع معارك ضارية...',
        strategic_height: '145.5 م',
        obelisk_height: '20 م',
        main_elements: 'مسلة، مقابر جماعية، منصة معدات عسكرية',
        visitors: '~500 ألف',
        status: 'مفتوح',
        schedule: 'على مدار الساعة',
      },
      zh: {
        name: '"秃山"纪念建筑群',
        location: '俄罗斯，伏尔加格勒',
        description: '伏尔加格勒秃山上的纪念建筑群，是斯大林格勒战役期间激烈战斗的所在地...',
        strategic_height: '145.5米',
        obelisk_height: '20米',
        main_elements: '方尖碑、合葬墓、军事装备展示区',
        visitors: '约50万',
        status: '开放',
        schedule: '全天开放',
      },
    },
  },
  {
    slug: 'military-train',
    citySlug: 'volgograd',
    lat: 48.7161,
    lon: 44.5339,
    imageUrl: 'https://img1.advisor.travel/510x450px-Voinskiy_eshelon_pamyatnik_5.jpg',
    sortOrder: 3,
    fields: [
      { section: 'details', labelKey: 'monument_fields.year',             fieldKey: 'year' },
      { section: 'details', labelKey: 'monument_fields.opening_date',     fieldKey: 'opening_date' },
      { section: 'details', labelKey: 'monument_fields.locomotive_model', fieldKey: 'locomotive_model' },
      { section: 'details', labelKey: 'monument_fields.manufacturer',     fieldKey: 'manufacturer' },
      { section: 'details', labelKey: 'monument_fields.main_elements',    fieldKey: 'main_elements' },
      { section: 'details', labelKey: 'monument_fields.additional_features', fieldKey: 'additional_features' },
      { section: 'visitors', labelKey: 'monument_fields.visitors',        fieldKey: 'visitors' },
      { section: 'visitors', labelKey: 'monument_fields.status',          fieldKey: 'status' },
      { section: 'visitors', labelKey: 'monument_fields.schedule',        fieldKey: 'schedule' },
    ],
    translations: {
      ru: {
        name: 'Воинский эшелон',
        location: 'Волгоград, Россия',
        description: '«Воинский эшелон» — мемориальный комплекс у музея-панорамы «Сталинградская битва»...',
        year: '2009',
        opening_date: '24 июня 2009',
        locomotive_model: 'Паровоз серии Эр 743-64',
        manufacturer: 'Луганский паровозостроительный завод',
        main_elements: 'Паровоз, теплушка, цистерна, санитарный вагон',
        additional_features: 'Семафор 1938 года, водонапорная колонка',
        visitors: '~400 тыс.',
        status: 'Открыт',
        schedule: '9:00–18:00, выходной: понедельник',
      },
      en: {
        name: 'Military Train Memorial',
        location: 'Volgograd, Russia',
        description: 'The "Military Train" is a memorial complex near the "Stalingrad Battle" Panorama Museum...',
        year: '2009',
        opening_date: 'June 24, 2009',
        locomotive_model: 'Er 743‑64 steam locomotive',
        manufacturer: 'Luhansk Locomotive Works',
        main_elements: 'Steam locomotive, teplushka, oil tanker, ambulance wagon',
        additional_features: '1938 semaphore, water-filling column',
        visitors: '~400 thousand',
        status: 'Open',
        schedule: '9:00–18:00, closed on Mondays',
      },
      ar: {
        name: 'قطار الجند',
        location: 'فولغوغراد، روسيا',
        description: '«قطار الجند» هو مجمع تذكاري بجوار متحف بانوراما «معركة ستالينغراد»...',
        year: '2009',
        opening_date: '24 يونيو 2009',
        locomotive_model: 'قاطرة بخارية سلسلة Er 743-64',
        manufacturer: 'مصنع لوغانسك للقاطرات البخارية',
        main_elements: 'قاطرة بخارية، عربة تدفئة، صهريج، عربة إسعاف',
        additional_features: 'إشارة سيمافور من عام 1938، عمود تزويد القاطرة بالمياه',
        visitors: '~400 ألف',
        status: 'مفتوح',
        schedule: 'من 9:00 إلى 18:00، يوم العطلة: الاثنين',
      },
      zh: {
        name: '军运专列',
        location: '俄罗斯，伏尔加格勒',
        description: '"军运专列"是位于伏尔加格勒"斯大林格勒战役"全景博物馆附近的纪念建筑群...',
        year: '2009',
        opening_date: '2009年6月24日',
        locomotive_model: 'Er 743-64系列蒸汽机车',
        manufacturer: '卢甘斯克蒸汽机车制造厂',
        main_elements: '蒸汽机车、棚车、油罐车、医务车厢',
        additional_features: '1938年制造的臂板信号机、给蒸汽机车加水的立柱',
        visitors: '约40万',
        status: '开放',
        schedule: '9:00至18:00，周一闭馆',
      },
    },
  },
  {
    slug: 'first-tram-monument',
    citySlug: 'volgograd',
    lat: 48.7081,
    lon: 44.5085,
    imageUrl: 'https://cs4.pikabu.ru/post_img/big/2015/11/18/11/1447876452_721034799.jpg',
    sortOrder: 4,
    fields: [
      { section: 'details', labelKey: 'monument_fields.tram_model',       fieldKey: 'tram_model' },
      { section: 'details', labelKey: 'monument_fields.operation_period', fieldKey: 'operation_period' },
      { section: 'details', labelKey: 'monument_fields.base_wagon',       fieldKey: 'base_wagon' },
      { section: 'visitors', labelKey: 'monument_fields.visitors',        fieldKey: 'visitors' },
      { section: 'visitors', labelKey: 'monument_fields.status',          fieldKey: 'status' },
      { section: 'visitors', labelKey: 'monument_fields.schedule',        fieldKey: 'schedule' },
    ],
    translations: {
      ru: {
        name: 'Памятник первому трамваю',
        location: 'Волгоград, Россия',
        description: 'Памятник первому трамваю — восстановленный вагон серии Х в Комсомольском саду...',
        tram_model: 'Серия Х (воссозданный)',
        operation_period: '1929–1967',
        base_wagon: 'Вагон МС-4',
        visitors: '~250 тыс.',
        status: 'Открыт',
        schedule: 'Круглосуточно',
      },
      en: {
        name: 'Tram Monument',
        location: 'Volgograd, Russia',
        description: 'The Tram Monument is a reconstructed tram car of the Series X, installed in Komsomolsky Garden...',
        tram_model: 'Series X (reconstructed)',
        operation_period: '1929–1967',
        base_wagon: 'MS‑4 wagon',
        visitors: '~250 thousand',
        status: 'Open',
        schedule: '24/7',
      },
      ar: {
        name: 'نصب الترام',
        location: 'فولغوغراد، روسيا',
        description: 'نصب أول ترام هو عربة ترام معاد إنشاؤها من السلسلة X...',
        tram_model: 'السلسلة X (معاد إنشاؤها)',
        operation_period: '1929–1967',
        base_wagon: 'عربة МС-4',
        visitors: '~250 ألف',
        status: 'مفتوح',
        schedule: 'على مدار الساعة',
      },
      zh: {
        name: '有轨电车纪念碑',
        location: '俄罗斯，伏尔加格勒',
        description: '第一辆有轨电车纪念碑是复原的X系列有轨电车车厢，位于共青团公园...',
        tram_model: 'X系列（复原）',
        operation_period: '1929–1967年',
        base_wagon: 'MS-4型车厢',
        visitors: '约25万',
        status: '开放',
        schedule: '全天开放',
      },
    },
  },
  {
    slug: 'volgograd-amphitheatre',
    citySlug: 'volgograd',
    lat: 48.7084,
    lon: 44.5296,
    imageUrl: 'https://avatars.mds.yandex.net/get-altay/10350441/2a0000018de391d38f20465c063c682fd687/orig',
    sortOrder: 5,
    fields: [
      { section: 'details', labelKey: 'monument_fields.year',             fieldKey: 'year' },
      { section: 'details', labelKey: 'monument_fields.total_area',       fieldKey: 'total_area' },
      { section: 'details', labelKey: 'monument_fields.stage_area',       fieldKey: 'stage_area' },
      { section: 'details', labelKey: 'monument_fields.capacity',         fieldKey: 'capacity' },
      { section: 'details', labelKey: 'monument_fields.number_of_columns',fieldKey: 'number_of_columns' },
      { section: 'details', labelKey: 'monument_fields.column_material',  fieldKey: 'column_material' },
      { section: 'details', labelKey: 'monument_fields.special_features', fieldKey: 'special_features' },
      { section: 'visitors', labelKey: 'monument_fields.visitors',        fieldKey: 'visitors' },
      { section: 'visitors', labelKey: 'monument_fields.status',          fieldKey: 'status' },
      { section: 'visitors', labelKey: 'monument_fields.schedule',        fieldKey: 'schedule' },
    ],
    translations: {
      ru: {
        name: 'Амфитеатр Волгограда',
        location: 'Волгоград, Россия',
        description: 'Амфитеатр Волгограда — современная многофункциональная площадка на берегу Волги...',
        year: '2022',
        total_area: '3 600 м²',
        stage_area: 'более 500 м²',
        capacity: '2 300 человек',
        number_of_columns: '52',
        column_material: 'Дагестанский камень',
        special_features: 'Открытые пространства, творческие лаборатории',
        visitors: '~500 тыс.',
        status: 'Открыт',
        schedule: 'Круглосуточно (мероприятия по расписанию)',
      },
      en: {
        name: 'Volgograd Amphitheatre',
        location: 'Volgograd, Russia',
        description: 'The Volgograd Amphitheatre is a modern multifunctional venue on the banks of the Volga River...',
        year: '2022',
        total_area: '3 600 sq. m',
        stage_area: 'over 500 sq. m',
        capacity: '2 300 people',
        number_of_columns: '52',
        column_material: 'Dagestan stone',
        special_features: 'open spaces, creative labs',
        visitors: '~500 thousand',
        status: 'Open',
        schedule: '24/7 (events according to schedule)',
      },
      ar: {
        name: 'مدرج فولغوغراد',
        location: 'فولغوغراد، روسيا',
        description: 'مدرج فولغوغراد هو منصة حديثة متعددة الوظائف على ضفاف نهر الفولغا...',
        year: '2022',
        total_area: '3600 م²',
        stage_area: 'أكثر من 500 م²',
        capacity: '2300 شخص',
        number_of_columns: '52',
        column_material: 'حجر داغستان',
        special_features: 'مساحات مفتوحة، مختبرات إبداعية',
        visitors: '~500 ألف',
        status: 'مفتوح',
        schedule: 'على مدار الساعة (الفعاليات حسب الجدول)',
      },
      zh: {
        name: '伏尔加格勒露天剧场',
        location: '俄罗斯，伏尔加格勒',
        description: '伏尔加格勒露天剧场是位于伏尔加河畔的一座现代化多功能场地...',
        year: '2022',
        total_area: '3600平方米',
        stage_area: '超过500平方米',
        capacity: '2300人',
        number_of_columns: '52',
        column_material: '达吉斯坦石',
        special_features: '开放式空间、创意实验室',
        visitors: '约50万',
        status: '开放',
        schedule: '全天开放（活动按日程安排）',
      },
    },
  },
  {
    slug: 'russia-my-history-park',
    citySlug: 'volgograd',
    lat: 48.7002,
    lon: 44.5123,
    imageUrl: 'https://avatars.mds.yandex.net/i?id=98d87d72c358282d04d91f8924e82821_l-5234655-images-thumbs&n=13',
    sortOrder: 6,
    fields: [
      { section: 'details', labelKey: 'monument_fields.year',              fieldKey: 'year' },
      { section: 'details', labelKey: 'monument_fields.total_area',        fieldKey: 'total_area' },
      { section: 'details', labelKey: 'monument_fields.exhibition_count',  fieldKey: 'exhibition_count' },
      { section: 'details', labelKey: 'monument_fields.main_exhibitions',  fieldKey: 'main_exhibitions' },
      { section: 'details', labelKey: 'monument_fields.technologies',      fieldKey: 'technologies' },
      { section: 'visitors', labelKey: 'monument_fields.visitors',         fieldKey: 'visitors' },
      { section: 'visitors', labelKey: 'monument_fields.status',           fieldKey: 'status' },
      { section: 'visitors', labelKey: 'monument_fields.schedule',         fieldKey: 'schedule' },
      { section: 'visitors', labelKey: 'monument_fields.ticket_prices',    fieldKey: 'ticket_prices' },
      { section: 'visitors', labelKey: 'monument_fields.guided_tours',     fieldKey: 'guided_tours' },
    ],
    translations: {
      ru: {
        name: 'Исторический парк «Россия — Моя история»',
        location: 'Волгоград, Россия',
        description: 'Исторический парк «Россия — Моя история» в Волгограде — интерактивный музей...',
        year: '2017',
        total_area: 'более 7 000 м²',
        exhibition_count: '4',
        main_exhibitions: '«Рюриковичи», «Романовы», «От великих потрясений к Великой Победе», «Россия — Моя история. 1945–2016»',
        technologies: 'Сенсорные столы и экраны, интерактивные панорамы, 3D-модели, видеопроекции',
        visitors: '~300 тыс.',
        status: 'Открыт',
        schedule: 'Вт–Пт: 10:00–18:00; Сб–Вс: 12:00–20:00; Пн — выходной',
        ticket_prices: 'Взрослый — 200 руб.; Льготный — 100 руб.; Дети до 7 лет, военные, инвалиды I и II группы — бесплатно',
        guided_tours: 'Групповые, индивидуальные',
      },
      en: {
        name: 'Historical Park Russia — My History',
        location: 'Volgograd, Russia',
        description: 'The Historical Park "Russia — My History" in Volgograd is an interactive museum opened in 2017...',
        year: '2017',
        total_area: 'more than 7,000 sq. m',
        exhibition_count: '4',
        main_exhibitions: 'Rurikids, Romanovs, From Great Upheavals to Great Victory, Russia - My History. 1945–2016',
        technologies: 'touch screens, interactive tables, 3D models, video projections, animation, digital reconstructions',
        visitors: '~300 thousand',
        status: 'Open',
        schedule: 'Tue–Fri: 10:00–18:00; Sat–Sun: 12:00–20:00; Mon is a day off',
        ticket_prices: 'Adults: 200 RUB; Concessions: 100 RUB; Children under 7, military, disabled groups I and II: free',
        guided_tours: 'Group tours, individual tours',
      },
      ar: {
        name: 'المنتزه التاريخي «روسيا - تاريخي»',
        location: 'فولغوغراد، روسيا',
        description: 'المنتزه التاريخي «روسيا - تاريخي» في فولغوغراد هو متحف تفاعلي افتتح عام 2017...',
        year: '2017',
        total_area: 'أكثر من 7000 م²',
        exhibition_count: '4',
        main_exhibitions: '«روريكوفيتش»، «رومانوف»، «من الاضطرابات الكبرى إلى النصر العظيم»، «روسيا - تاريخي. 1945–2016»',
        technologies: 'شاشات لمس، طاولات تفاعلية، نماذج ثلاثية الأبعاد، إسقاطات فيديو',
        visitors: '~300 ألف',
        status: 'مفتوح',
        schedule: 'الثلاثاء–الجمعة: 10:00–18:00؛ السبت–الأحد: 12:00–20:00؛ الاثنين مغلق',
        ticket_prices: 'الكبار – 200 روبل؛ مخفض – 100 روبل؛ الأطفال حتى 7 سنوات، العسكريون، المعاقون – مجاناً',
        guided_tours: 'جماعية، فردية',
      },
      zh: {
        name: '"俄罗斯——我的历史"历史公园',
        location: '俄罗斯，伏尔加格勒',
        description: '伏尔加格勒的"俄罗斯——我的历史"历史公园是一座互动式博物馆，于2017年开放...',
        year: '2017',
        total_area: '超过7000平方米',
        exhibition_count: '4',
        main_exhibitions: '"留里克王朝"、"罗曼诺夫王朝"、"从大动荡到大胜利"、"俄罗斯——我的历史。1945–2016"',
        technologies: '触摸屏、互动桌、3D模型、视频投影、动画、数字复原',
        visitors: '约30万',
        status: '开放',
        schedule: '周二至周五：10:00–18:00；周六至周日：12:00–20:00；周一闭馆',
        ticket_prices: '成人票——200卢布；优惠票——100卢布；7岁以下儿童、军人、残疾人士免费',
        guided_tours: '团体、个人',
      },
    },
  },
];

// ─── Данные маршрутов ─────────────────────────────────────────────────────────

const routeSeedData: RouteSeed[] = [
  {
    slug: 'center',
    citySlug: 'volgograd',
    coverMonumentSlug: 'motherland-calls',
    sortOrder: 1,
    monumentSlugs: ['motherland-calls', 'volgograd-amphitheatre', 'russia-my-history-park'],
    translations: {
      ru: { name: 'Символы Волгограда', description: 'Маршрут по главным символам города: от Родины-матери на Мамаевом кургане до набережного амфитеатра и исторического парка.' },
      en: { name: 'Symbols of Volgograd', description: 'A route through the city\'s landmarks: from Motherland Calls on Mamayev Kurgan to the riverside amphitheater and the interactive history park.' },
      ar: { name: 'رموز فولغوغراد', description: 'مسار يمر بأهم معالم المدينة: من تمثال الأم وطن على تل ماماي إلى المسرح الروماني على الضفة والحديقة التاريخية التفاعلية.' },
      zh: { name: '伏尔加格勒地标', description: '从马马耶夫岗的"祖国母亲在召唤"雕像，到河滨露天剧场与互动历史公园，一天内了解城市建筑与文化。' },
    },
  },
  {
    slug: 'history',
    citySlug: 'volgograd',
    coverMonumentSlug: 'lysaya-gora-memorial',
    sortOrder: 2,
    monumentSlugs: ['lysaya-gora-memorial', 'military-train', 'first-tram-monument'],
    translations: {
      ru: { name: 'Дорога памяти', description: 'Маршрут по мемориалам Сталинградской битвы: Лысая гора, Воинский эшелон у панорамы и памятник первому трамваю.' },
      en: { name: 'Road of Memory', description: 'A path through memorials of the Battle of Stalingrad: Lysaya Gora, the Military Echelon near the panorama, and the first tram monument.' },
      ar: { name: 'طريق الذاكرة', description: 'مسار عبر نصب معركة ستالينجراد: تل ليسايا غورا، القطار العسكري بجانب البانوراما، ونصب أول ترام.' },
      zh: { name: '记忆之路', description: '途经斯大林格勒战役相关纪念地：秃山、全景博物馆旁的"军事列车"与首辆有轨电车纪念碑。' },
    },
  },
  {
    slug: 'poetic',
    citySlug: 'volgograd',
    coverMonumentSlug: 'volgograd-amphitheatre',
    sortOrder: 3,
    monumentSlugs: ['lysaya-gora-memorial', 'volgograd-amphitheatre', 'military-train'],
    translations: {
      ru: { name: 'Поэтический Волгоград', description: 'Лысая гора, амфитеатр на Волге и Воинский эшелон: память о войне, набережная архитектура и железнодорожное наследие.' },
      en: { name: 'Poetic Volgograd', description: 'Lysaya Gora, the Volga amphitheater, and the Military Echelon: war memory, embankment architecture, and railway heritage in one route.' },
      ar: { name: 'فولغوغراد الشاعرية', description: 'ليسايا غورا، المسرح الروماني على الفولغا، والقطار العسكري: ذكرى الحرب وعمارة الشاطئ وإرث السكك الحديدية.' },
      zh: { name: '诗意伏尔加格勒', description: '秃山、伏尔加河露天剧场与"军事列车"：战争记忆、滨河建筑与铁路传奇。' },
    },
  },
];

// ─── Функция заливки ──────────────────────────────────────────────────────────

export function seedDatabase(): void {
  db.withTransactionSync(() => {
    for (const city of CITIES) {
      db.runSync(`INSERT OR IGNORE INTO cities (slug) VALUES (?)`, [city.id]);
    }

    const cityIdBySlug = new Map<string, number>();
    for (const city of db.getAllSync<{ id: number; slug: string }>(`SELECT id, slug FROM cities`)) {
      cityIdBySlug.set(city.slug, city.id);
    }

    const monumentIdBySlug = new Map<string, number>();
    for (const m of monumentSeedData) {
      const cityId = cityIdBySlug.get(m.citySlug);
      if (!cityId) continue;

      db.runSync(
        `INSERT OR IGNORE INTO monuments (city_id, slug, lat, lon, image_url, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cityId, m.slug, m.lat, m.lon, m.imageUrl, m.sortOrder ?? 0]
      );

      const monumentId = db.getFirstSync<{ id: number }>(
        `SELECT id FROM monuments WHERE city_id = ? AND slug = ?`,
        [cityId, m.slug],
      )?.id;
      if (!monumentId) continue;
      monumentIdBySlug.set(m.slug, monumentId);

      for (const [lang, fields] of Object.entries(m.translations)) {
        for (const [fieldKey, fieldValue] of Object.entries(fields)) {
          db.runSync(
            `INSERT OR IGNORE INTO monument_translations (monument_id, lang, field_key, field_value)
             VALUES (?, ?, ?, ?)`,
            [monumentId, lang, fieldKey, fieldValue]
          );
        }
      }

      m.fields.forEach((f, i) => {
        db.runSync(
          `INSERT OR IGNORE INTO monument_field_config
             (monument_id, section, order_index, label_key, field_key, static_value)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [monumentId, f.section, i, f.labelKey, f.fieldKey ?? null, f.staticValue ?? null]
        );
      });
    }

    const routeIdByKey = new Map<string, number>();
    for (const r of routeSeedData) {
      const cityId = cityIdBySlug.get(r.citySlug);
      const coverMonumentId = monumentIdBySlug.get(r.coverMonumentSlug) ?? null;
      if (!cityId) continue;

      db.runSync(
        `INSERT OR IGNORE INTO routes (city_id, slug, cover_monument_id, sort_order, difficulty, duration_min, distance_km)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [cityId, r.slug, coverMonumentId, r.sortOrder ?? 0, null, null, null]
      );

      const routeId = db.getFirstSync<{ id: number }>(
        `SELECT id FROM routes WHERE city_id = ? AND slug = ?`,
        [cityId, r.slug],
      )?.id;
      if (!routeId) continue;
      routeIdByKey.set(`${r.citySlug}:${r.slug}`, routeId);

      for (const [lang, tr] of Object.entries(r.translations)) {
        db.runSync(
          `INSERT OR IGNORE INTO route_translations (route_id, lang, name, short_description, description)
           VALUES (?, ?, ?, ?, ?)`,
          [routeId, lang, tr.name, tr.description, tr.description]
        );
      }

      r.monumentSlugs.forEach((monumentSlug, i) => {
        const monumentId = monumentIdBySlug.get(monumentSlug);
        if (!monumentId) return;
        db.runSync(
          `INSERT OR IGNORE INTO route_stops (route_id, monument_id, order_index)
           VALUES (?, ?, ?)`,
          [routeId, monumentId, i]
        );
      });
    }
  });

  markSeeded();
}

export function syncCitiesAndMonumentCityIds(): void {
  db.withTransactionSync(() => {
    for (const city of CITIES) {
      db.runSync(`INSERT OR IGNORE INTO cities (slug) VALUES (?)`, [city.id]);
    }
    const cityIdBySlug = new Map<string, number>();
    for (const city of db.getAllSync<{ id: number; slug: string }>(`SELECT id, slug FROM cities`)) {
      cityIdBySlug.set(city.slug, city.id);
    }
    for (const monument of monumentSeedData) {
      const cityId = cityIdBySlug.get(monument.citySlug);
      if (!cityId) continue;
      db.runSync(`UPDATE monuments SET city_id = ? WHERE slug = ?`, [cityId, monument.slug]);
    }
  });
}
