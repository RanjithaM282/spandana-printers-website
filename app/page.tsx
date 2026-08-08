"use client";

import Link from "next/link";
import { useTheme } from "next-themes";

const services = [
  { slug: "brochures", title: "Brochures", description: "Tri-fold, bi-fold, Z-fold brochures with folding & UV." },
  { slug: "mono-carton-boxes", title: "Mono Carton Boxes", description: "Retail mono cartons with multicolour + lamination." },
  { slug: "hospital-files", title: "Hospital Files", description: "Clip files, envelopes, customized medical stationery." },
  { slug: "envelopes", title: "Envelopes", description: "9×4, 9×6, 10×12 and bespoke envelopes with branding." },
  { slug: "visiting-cards", title: "Visiting Cards", description: "Premium cards with matte/gloss, UV, rounded corners." },
  { slug: "bill-books", title: "Bill Books", description: "Carbonless billing books with perforation and numbering." },
  { slug: "calendars", title: "Calendars", description: "Wall & desk calendars with spiral binding." },
  { slug: "spiral-binding", title: "Spiral Binding", description: "Binding for manuals, textbooks, diaries and reports." },
  { slug: "corrugated-boxes", title: "Corrugated Boxes", description: "3-ply & 5-ply corrugated cartons with branding." },
  { slug: "textbooks", title: "Textbooks", description: "Academic textbooks with perfect binding & lamination." },
  { slug: "pizza-boxes", title: "Pizza Boxes", description: "Food-grade pizza boxes with grease resistant coating." },
  { slug: "menu-cards", title: "Menu Cards", description: "Restaurant menus with lamination/UV in custom sizes." },
  { slug: "custom-printing", title: "Custom Printing", description: "Signage, posters, specialty packaging & bespoke jobs." },
];

const uspItems = [
  {
    title: "Real-time chat",
    description: "Talk to our production team on every service page.",
  },
  {
    title: "Secure PhonePe payments",
    description: "UPI intent, QR, cards, netbanking, wallets supported.",
  },
  {
    title: "Design to delivery",
    description: "Upload files, track orders, manage delivery & proofs.",
  },
];

const testimonials = [
  {
    quote: "Spandana Printers handled our FMCG mono cartons with zero errors and lightning turnaround.",
    author: "Shreya V., Brand Manager",
  },
  {
    quote: "Hospital files with clip + pouch ready within 4 days, complete with live chat updates.",
    author: "Dr. Naveen, Sunrise Hospitals",
  },
];

export default function HomePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white">
      <section
        className="hero relative h-[75vh] bg-cover bg-center"
        style={{ backgroundImage: "url('/images/press-hero.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-xs uppercase tracking-[0.8em] font-bold text-white">Your vision, our ink</p>
          <h1 className="text-5xl font-bold text-white lg:text-7xl animate-pulse">
            Spandana Printers
          </h1>
          <p className="mt-6 text-xl font-bold text-white animate-fade-in">
            Professional printing solutions for businesses of all sizes
          </p>
          <p className="max-w-3xl text-lg font-bold text-white">
            Order brochures, packaging, stationery, corrugated boxes, calendars, pizza boxes and more. Upload artwork, chat in real time, pay via PhonePe, and track delivery from one dashboard.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link href="/services" className="rounded-2xl bg-slate-800 px-8 py-4 font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl hover:bg-slate-900 animate-bounce">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <h2 className="text-center text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">What we print for you</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          Choose from proven categories or request a custom job with guided pricing, uploads, and live chat.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.slug}
              className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:bg-card/90"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-primary">Category</p>
                <h3 className="mt-2 text-xl font-bold text-foreground">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
              <div className="mt-auto flex items-center justify-between text-sm font-semibold">
                <Link href={`/services/${service.slug}`} className="text-indigo-600 transition hover:text-indigo-500">
                  Start order →
                </Link>
                <button className="rounded-full border border-border px-3 py-1 text-xs text-primary font-medium transition hover:border-primary hover:bg-muted">
                  Chat
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="mx-auto grid max-w-5xl gap-6 rounded-3xl border border-border bg-card p-8 shadow-2xl backdrop-blur-sm">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.5em] text-primary">Why Spandana</p>
            <h2 className="mt-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Modern print-tech with human support</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {uspItems.map((usp) => (
              <div key={usp.title} className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-foreground">{usp.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{usp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <blockquote key={t.author} className="rounded-3xl border border-border bg-card/90 p-6 shadow-lg backdrop-blur-sm">
              <p className="text-lg font-medium text-foreground italic">"{t.quote}"</p>
              <p className="mt-3 text-sm font-semibold text-primary">{t.author}</p>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-3xl bg-gradient-to-r from-primary to-accent p-8 text-primary-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-primary-foreground/70">Ready to print?</p>
            <h3 className="text-2xl font-semibold">Share your artwork or request a quote in minutes.</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/services" className="rounded-full bg-background px-5 py-2 text-sm font-semibold text-primary">
              Start Order
            </Link>
            <a
              href="https://wa.me/918904467535"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white px-5 py-2 text-sm font-semibold text-white"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}