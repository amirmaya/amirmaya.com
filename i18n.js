// All site copy, EN + TR. Keys map to data-i18n attributes; arrays feed the dynamic sections.
window.I18N = {
  en: {
    nav: { about: "Overview", timeline: "Timeline", projects: "Projects", stack: "Toolbelt", contact: "Contact" },
    status: "Account health: Healthy",
    hero_kicker: "Marketplace consultant · builder",
    hero_title_1: "I grow sellers,",
    hero_title_2: "then build the tools that do it at scale.",
    hero_sub: "Amir Maya — Strategic Account Services at Amazon Turkey. From sneaker bots and a Discord notification startup, to co-founding a marketplace, to managing 8 of the top 10 Softlines sellers and shipping an AI analytics platform used by 117 account managers.",
    cta_projects: "See the work",
    cta_cv: "Resume (PDF)",
    kpis: [
      { v: 13.1, suffix: "M", prefix: "$", label: "Portfolio sales YTD 2026", sub: "+88% YoY · 15 strategic accounts" },
      { v: 12000, suffix: "", prefix: "", label: "Sellers covered by Oculus", sub: "117 account managers, every category" },
      { v: 3.1, suffix: "M", prefix: "$", label: "Hype-Merch GMV", sub: "0 → 2,000+ active sellers" },
      { v: 147, suffix: "K+", prefix: "", label: "Competitor sellers scraped", sub: "30+ attributes each, adopted by 2 analytics teams" }
    ],
    timeline_kicker: "01 · Timeline",
    timeline_title: "Order history",
    timeline_sub: "Every step changed what I build. Scroll to replay.",
    timeline: [
      { y: "2014", t: "Hisar School", d: "Istanbul. Turkish–Mathematics track.", tag: "Education" },
      { y: "2014–2019", t: "Bilgi University — B.A. Economics (English)", d: "50% ÖSYM scholarship. Internships during university. [details to add]", tag: "Education" },
      { y: "2019–2020", t: "Deloitte — Audit Assistant", d: "Audit procedures across telecom, retail, manufacturing, packaging and automotive clients: financial statements, journal entries, internal controls.", tag: "Corporate" },
      { y: "2019–2020", t: "Self-taught coding", d: "Python (University of Michigan ×4), Git & GitHub (Google), MongoDB. Learned at night, applied the next morning.", tag: "Pivot" },
      { y: "2020", t: "TRNotify — founder", d: "Sneaker botting and real-time restock notifications on Discord: scrapers, monitors and alert bots for the Turkish sneaker market. [members / scale to add]", tag: "Startup" },
      { y: "2020–2024", t: "Hype-Merch — Co-founder, Product Owner", d: "Built an e-commerce marketplace from 0 to $3.1M GMV and 2,000+ active sellers. Owned roadmap, listing management, seller dashboards, payouts, shipping ops, API integrations. Mobile app held Top 100–200 in App Store Shopping through 2023–24.", tag: "Startup" },
      { y: "2024–", t: "Amazon Turkey — 3P Marketplace, Softlines", d: "Direct Seller Recruitment (2024) → Existing Seller Management, 70+ sellers (2025) → Strategic Account Services, 15 sellers (2026). Today 8 of the top 10 Softlines sellers. Portfolio $13.1M YTD, +88% YoY, strongest growth among 17 AMs; ad spend tripled, Amazon-fulfilled share 52% → 77%.", tag: "Now" }
    ],
    projects_kicker: "02 · Projects",
    projects_title: "Listings",
    projects_sub: "Things I built because the job needed them. Hover to inspect.",
    projects: [
      { n: "Oculus", k: "AI seller analytics platform", d: "Internal account-management platform for Amazon Turkey: serverless AWS pipelines over 20+ daily data sources, a React dashboard, a rules engine that turns metrics into prioritised seller actions, and a Bedrock assistant that explains why a seller's numbers moved. Scaled to 12K managed sellers and 117 AMs across every category.", tags: ["AWS", "Python", "React", "Bedrock", "Athena"], badge: "Live · internal" },
      { n: "Parity TR", k: "Selection parity engine", d: "Weekly crawler + dashboard measuring how much of a seller's Trendyol / Hepsiburada catalogue is live on Amazon. Facet-based counting without product-page hits, 4,900-seller roster, Slack alerts to account managers and category heads.", tags: ["Python", "EC2", "Lambda", "Cloudscape", "Slack"], badge: "Live · internal" },
      { n: "Marketplace Sweep", k: "Competitor seller intelligence", d: "Scrapers that map an entire competitor marketplace: 147K+ sellers with 30+ attributes each (company, tax ID, catalogue size, brands, ratings). Shipped as one-file Windows/macOS apps; the method became the standard of two internal analytics teams in a VP-tracked program.", tags: ["Python", "curl_cffi", "Playwright", "PyInstaller"], badge: "Shipped" },
      { n: "Incomplete Listings Deleter", k: "Seller Central automation", d: "Desktop tool that bulk-deletes a seller's incomplete drafts through Seller Central's own GraphQL layer: throttle-aware, retry-after aware, with propagation polling and an HTML run report. Cleared 12,008 drafts in one run, zero errors.", tags: ["PyQt6", "Selenium", "GraphQL"], badge: "Shipped" },
      { n: "Second Brain", k: "Personal memory engine", d: "Local SQLite index over mail, calendar, Slack, git and notes with an LLM distillation layer that extracts decisions and actions. Powers a desktop assistant (Jarvis) and gives every working session full context.", tags: ["Python", "SQLite", "LLM", "macOS"], badge: "Personal" },
      { n: "Hype-Merch", k: "Marketplace, 0 → $3.1M GMV", d: "Co-founded and product-owned a sneaker & streetwear marketplace: web + iOS/Android, seller onboarding, payout distribution, shipping operations. Top 100–200 in App Store Shopping for over a year.", tags: ["Product", "Marketplace", "Mobile"], badge: "2020–2024" },
      { n: "TRNotify", k: "Sneaker restock notifications", d: "Discord-based monitors and scrapers alerting a community to restocks and raffles in real time; the project that turned coding courses into a business. [members / scale to add]", tags: ["Python", "Discord", "Scraping"], badge: "2020" }
    ],
    stack_kicker: "03 · Toolbelt",
    stack_title: "What I work with",
    stack_groups: [
      { h: "Data & cloud", items: ["Python", "SQL (Redshift, Athena)", "AWS Lambda / Step Functions / Fargate", "DynamoDB · S3", "Amazon Bedrock"] },
      { h: "Product & front-end", items: ["React · TypeScript", "Cloudscape", "PyQt6", "Figma-level specs", "Roadmaps & PRDs"] },
      { h: "Marketplace craft", items: ["Selection & pricing", "Advertising (SP/SB/SD)", "FBA / Seller Flex", "Deals & promotions", "Seller recruitment"] },
      { h: "Languages", items: ["Turkish — native", "English — native", "Hebrew — intermediate", "Spanish — beginner"] }
    ],
    contact_kicker: "04 · Contact",
    contact_title: "Open 24/7.",
    contact_sub: "Everything on this page is on the resume; everything on the resume has proof behind it.",
    contact_email: "Email",
    contact_linkedin: "LinkedIn",
    contact_cv: "Download resume",
    footer: "Built by hand — HTML, CSS, JS, no frameworks. Istanbul.",
    receipt: { title: "AMIR MAYA", line1: "ISTANBUL · 3P SOFTLINES", line2: "STRATEGIC ACCOUNT SERVICES", total: "TOTAL", total_v: "1 builder, ready", thanks: "THANK YOU FOR VISITING" }
  },
  tr: {
    nav: { about: "Özet", timeline: "Zaman çizelgesi", projects: "Projeler", stack: "Araç çantası", contact: "İletişim" },
    status: "Hesap sağlığı: Sağlıklı",
    hero_kicker: "Marketplace danışmanı · builder",
    hero_title_1: "Satıcıları büyütürüm,",
    hero_title_2: "sonra bunu ölçekte yapan araçları kurarım.",
    hero_sub: "Amir Maya — Amazon Türkiye, Strategic Account Services. Sneaker botlarından ve Discord bildirim girişiminden, bir marketplace kurmaya; oradan Softlines'ın en büyük 10 satıcısının 8'ini yönetmeye ve 117 hesap yöneticisinin kullandığı bir yapay zekâ analitik platformu çıkarmaya.",
    cta_projects: "İşlere bak",
    cta_cv: "Özgeçmiş (PDF)",
    kpis: [
      { v: 13.1, suffix: "M", prefix: "$", label: "Portföy satışı, 2026 YTD", sub: "+%88 YoY · 15 stratejik hesap" },
      { v: 12000, suffix: "", prefix: "", label: "Oculus'un kapsadığı satıcı", sub: "117 hesap yöneticisi, tüm kategoriler" },
      { v: 3.1, suffix: "M", prefix: "$", label: "Hype-Merch GMV", sub: "0 → 2.000+ aktif satıcı" },
      { v: 147, suffix: "K+", prefix: "", label: "Taranan rakip satıcı", sub: "30+ nitelik, 2 analitik ekibin standardı" }
    ],
    timeline_kicker: "01 · Zaman çizelgesi",
    timeline_title: "Sipariş geçmişi",
    timeline_sub: "Her adım ne kurduğumu değiştirdi. Kaydırarak tekrar oynat.",
    timeline: [
      { y: "2014", t: "Hisar Okulları", d: "İstanbul. Türkçe–Matematik.", tag: "Eğitim" },
      { y: "2014–2019", t: "Bilgi Üniversitesi — Ekonomi (İngilizce)", d: "%50 ÖSYM bursu. Üniversite döneminde stajlar. [detay eklenecek]", tag: "Eğitim" },
      { y: "2019–2020", t: "Deloitte — Denetim Asistanı", d: "Telekom, perakende, üretim, ambalaj ve otomotiv müşterilerinde denetim: mali tablolar, yevmiye kayıtları, iç kontroller.", tag: "Kurumsal" },
      { y: "2019–2020", t: "Kendi kendine kod", d: "Python (Michigan Üniversitesi ×4), Git & GitHub (Google), MongoDB. Gece öğrenildi, sabah uygulandı.", tag: "Dönüş" },
      { y: "2020", t: "TRNotify — kurucu", d: "Sneaker botting ve Discord üzerinden gerçek zamanlı stok bildirimleri: Türkiye sneaker pazarı için scraper'lar, monitörler ve uyarı botları. [üye / ölçek eklenecek]", tag: "Girişim" },
      { y: "2020–2024", t: "Hype-Merch — Kurucu ortak, Product Owner", d: "E-ticaret marketplace'ini 0'dan 3,1 M$ GMV ve 2.000+ aktif satıcıya taşıdım. Yol haritası, listeleme yönetimi, satıcı panelleri, ödeme dağıtımı, kargo operasyonu, API entegrasyonları. Mobil uygulama 2023–24 boyunca App Store Alışveriş'te Top 100–200.", tag: "Girişim" },
      { y: "2024–", t: "Amazon Türkiye — 3P Marketplace, Softlines", d: "Direct Seller Recruitment (2024) → Existing Seller Management, 70+ satıcı (2025) → Strategic Account Services, 15 satıcı (2026). Bugün Softlines'ın en büyük 10 satıcısının 8'i. Portföy 13,1 M$ YTD, +%88 YoY, 17 AM arasında en yüksek büyüme; reklam harcaması 3 katına, Amazon-fulfilled payı %52 → %77.", tag: "Şimdi" }
    ],
    projects_kicker: "02 · Projeler",
    projects_title: "Listelemeler",
    projects_sub: "İş gerektirdiği için kurduğum şeyler. İncelemek için üzerine gel.",
    projects: [
      { n: "Oculus", k: "Yapay zekâ destekli satıcı analitiği", d: "Amazon Türkiye için dahili hesap yönetimi platformu: 20+ günlük veri kaynağı üzerinde sunucusuz AWS hatları, React panel, metrikleri öncelikli satıcı aksiyonlarına çeviren kural motoru ve bir satıcının rakamlarının neden hareket ettiğini açıklayan Bedrock asistanı. 12K yönetilen satıcı ve 117 AM'e, tüm kategorilere yayıldı.", tags: ["AWS", "Python", "React", "Bedrock", "Athena"], badge: "Canlı · dahili" },
      { n: "Parity TR", k: "Seçki paritesi motoru", d: "Bir satıcının Trendyol / Hepsiburada kataloğunun ne kadarının Amazon'da canlı olduğunu ölçen haftalık crawler + panel. Ürün sayfası açmadan facet tabanlı sayım, 4.900 satıcılık roster, hesap yöneticilerine ve kategori liderlerine Slack uyarıları.", tags: ["Python", "EC2", "Lambda", "Cloudscape", "Slack"], badge: "Canlı · dahili" },
      { n: "Marketplace Sweep", k: "Rakip satıcı istihbaratı", d: "Bir rakip pazaryerinin tamamını haritalayan scraper'lar: 147K+ satıcı, her biri 30+ nitelikle (şirket, vergi no, katalog büyüklüğü, markalar, puanlar). Tek dosyalık Windows/macOS uygulamaları olarak teslim edildi; yöntem VP takipli bir programda iki dahili analitik ekibinin standardı oldu.", tags: ["Python", "curl_cffi", "Playwright", "PyInstaller"], badge: "Teslim edildi" },
      { n: "Incomplete Listings Deleter", k: "Seller Central otomasyonu", d: "Bir satıcının eksik taslaklarını Seller Central'ın kendi GraphQL katmanı üzerinden toplu silen masaüstü aracı: throttle ve Retry-After farkında, yansıma kontrolü ve HTML koşu raporu. Tek koşuda 12.008 taslak, sıfır hata.", tags: ["PyQt6", "Selenium", "GraphQL"], badge: "Teslim edildi" },
      { n: "Second Brain", k: "Kişisel hafıza motoru", d: "Mail, takvim, Slack, git ve notlar üzerinde yerel SQLite indeksi; karar ve aksiyonları çıkaran LLM damıtma katmanı. Masaüstü asistanı (Jarvis) buna dayanır, her çalışma oturumuna tam bağlam verir.", tags: ["Python", "SQLite", "LLM", "macOS"], badge: "Kişisel" },
      { n: "Hype-Merch", k: "Marketplace, 0 → 3,1 M$ GMV", d: "Sneaker & streetwear marketplace'inin kurucu ortağı ve product owner'ı: web + iOS/Android, satıcı onboarding'i, ödeme dağıtımı, kargo operasyonu. Bir yılı aşkın süre App Store Alışveriş'te Top 100–200.", tags: ["Ürün", "Marketplace", "Mobil"], badge: "2020–2024" },
      { n: "TRNotify", k: "Sneaker stok bildirimleri", d: "Bir topluluğu stok yenilemeleri ve çekilişler konusunda gerçek zamanlı uyaran Discord tabanlı monitörler ve scraper'lar; kod kurslarını işe dönüştüren proje. [üye / ölçek eklenecek]", tags: ["Python", "Discord", "Scraping"], badge: "2020" }
    ],
    stack_kicker: "03 · Araç çantası",
    stack_title: "Neyle çalışırım",
    stack_groups: [
      { h: "Veri & bulut", items: ["Python", "SQL (Redshift, Athena)", "AWS Lambda / Step Functions / Fargate", "DynamoDB · S3", "Amazon Bedrock"] },
      { h: "Ürün & ön yüz", items: ["React · TypeScript", "Cloudscape", "PyQt6", "Tasarım spesifikasyonu", "Yol haritası & PRD"] },
      { h: "Marketplace zanaatı", items: ["Seçki & fiyatlama", "Reklam (SP/SB/SD)", "FBA / Seller Flex", "Kampanya & promosyon", "Satıcı kazanımı"] },
      { h: "Diller", items: ["Türkçe — ana dil", "İngilizce — ana dil", "İbranice — orta", "İspanyolca — başlangıç"] }
    ],
    contact_kicker: "04 · İletişim",
    contact_title: "7/24 açık.",
    contact_sub: "Bu sayfadaki her şey özgeçmişte; özgeçmişteki her şeyin arkasında kanıt var.",
    contact_email: "E-posta",
    contact_linkedin: "LinkedIn",
    contact_cv: "Özgeçmişi indir",
    footer: "Elle yapıldı — HTML, CSS, JS, framework yok. İstanbul.",
    receipt: { title: "AMIR MAYA", line1: "İSTANBUL · 3P SOFTLINES", line2: "STRATEGIC ACCOUNT SERVICES", total: "TOPLAM", total_v: "1 builder, hazır", thanks: "ZİYARETİNİZ İÇİN TEŞEKKÜRLER" }
  }
};
