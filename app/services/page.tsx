import Image from "next/image";

const services = [
  { slug: "brochures", title: "Brochures", description: "A5–A3 brochures with optional folding and premium finishes." },
  { slug: "mono-carton-boxes", title: "Mono Carton Boxes", description: "Custom mono cartons with multicolour, gloss/matte, and spot UV." },
  { slug: "hospital-files", title: "Hospital Files", description: "Clip files, envelopes, and medical stationery in any GSM." },
  { slug: "envelopes", title: "Envelopes", description: "9×4, 9×6, 10×12 and bespoke envelopes with branding." },
  { slug: "visiting-cards", title: "Visiting Cards", description: "Premium visiting cards with lamination, UV, rounded corners." },
  { slug: "bill-books", title: "Bill Books", description: "Carbonless bill books with sequential numbering." },
  { slug: "calendars", title: "Calendars", description: "Wall & desk calendars with spiral binding and custom art." },
  { slug: "spiral-binding", title: "Spiral Binding", description: "Binding for manuals, diaries, notebooks, catalogs." },
  { slug: "corrugated-boxes", title: "Corrugated Boxes", description: "Heavy-duty corrugated packaging with branding." },
  { slug: "textbooks", title: "Textbooks", description: "Large-volume textbook printing with binding options." },
  { slug: "pizza-boxes", title: "Pizza Boxes", description: "Food-grade pizza boxes with full-color art." },
  { slug: "menu-cards", title: "Menu Cards", description: "Restaurant menu printing with lamination/UV." },
  { slug: "custom-printing", title: "Custom Printing", description: "Bespoke large-format, signage, and specialty packs." },
];

const priceSheets = [
  {
    title: "Hospital Files & Digital Price List",
    description:
      "310×440 mm & 330×480 mm hospital files, clip/inside pouch extras, plus digital print slab rates.",
    src: "/images/hospital-files-pricing.jpg",
  },
  {
    title: "Visiting Cards, Envelopes & Specialty Jobs",
    description:
      "Visiting card laminations, A3 cut jobs, excel-bond stationery, wedding cards and envelope covers.",
    src: "/images/visiting-cards-pricing.jpg",
  },
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <section className="mx-auto max-w-5xl text-center">
        <p className="text-xs uppercase tracking-[0.6em] text-indigo-600">Services</p>
        <h1 className="mt-3 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
          Explore every print service
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Spandana Printers delivers brochures, packaging, stationery, and specialty products with instant chat support, file uploads, and dynamic pricing.
        </p>
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <article
            key={service.slug}
            className="group flex h-full flex-col justify-between rounded-3xl border border-white/50 bg-gradient-to-br from-white/90 to-blue-50/50 p-6 shadow-xl backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-indigo-500/60 hover:bg-white hover:shadow-2xl"
          >
            <div>
              <div className="inline-flex rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-1 text-xs font-bold text-indigo-700">
                Service
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">{service.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{service.description}</p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <a href={`/services/${service.slug}`} className="text-sm font-semibold text-indigo-600 transition group-hover:text-indigo-500">
                Start order →
              </a>
              <button className="rounded-full border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-600 transition hover:border-indigo-500 hover:bg-indigo-50">
                Chat
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-12 max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.5em] text-indigo-600">Pricing decks</p>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Ready reckoner downloads</h2>
          <p className="text-slate-600">
            Use these curated price cards for hospital files, visiting cards, envelopes, digital jobs and finishing services. Perfect for sharing with procurement teams.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {priceSheets.map((sheet) => (
            <article
              key={sheet.title}
              className="overflow-hidden rounded-3xl border border-white/50 bg-gradient-to-br from-white to-blue-50 shadow-2xl shadow-indigo-500/10 backdrop-blur-sm"
            >
              <div className="relative h-64 w-full">
                <Image src={sheet.src} alt={sheet.title} fill className="object-cover" priority />
              </div>
              <div className="space-y-2 p-6">
                <h3 className="text-xl font-bold text-slate-900">{sheet.title}</h3>
                <p className="text-sm text-slate-600">{sheet.description}</p>
                <div className="flex flex-wrap gap-3 text-xs font-semibold">
                  <span className="rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-1 text-indigo-700 font-bold">
                    Download PDF
                  </span>
                  <span className="rounded-full bg-gradient-to-r from-slate-100 to-gray-100 px-3 py-1 text-slate-600 font-medium">
                    Share on WhatsApp
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}