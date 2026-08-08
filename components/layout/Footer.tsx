export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="text-lg font-bold text-foreground">Spandana Printers</p>
          <p>No. 11/1, Magadi Road, Police Quarters Layout, Bengaluru - 560023</p>
          <p>Email: <a href="mailto:spandanaonlinejobs@gmail.com" className="text-primary hover:text-primary/80 transition-colors">spandanaonlinejobs@gmail.com</a></p>
          <p>Phone: 90367 25551 / 90367 95552 / 95919 37779</p>
        </div>

        <div className="flex flex-1 flex-wrap gap-12 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-slate-900">Quick Links</p>
            <ul className="mt-3 space-y-2">
              <li><a href="/services" className="hover:text-indigo-600">Services</a></li>
              <li><a href="/track-order" className="hover:text-indigo-600">Track Order</a></li>
              <li><a href="/admin" className="hover:text-indigo-600">Admin Panel</a></li>
              <li><a href="/privacy" className="hover:text-indigo-600">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Support</p>
            <ul className="mt-3 space-y-2">
              <li>Business hours: 9 AM – 8 PM IST</li>
              <li><a href="https://wa.me/918904467535" target="_blank" className="hover:text-indigo-600">WhatsApp Support</a></li>
              <li>Live chat embedded on each service page</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Payments</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-muted border border-border px-3 py-1 text-muted-foreground font-medium">PhonePe</span>
              <span className="rounded-full bg-muted border border-border px-3 py-1 text-muted-foreground font-medium">UPI QR</span>
              <span className="rounded-full bg-muted border border-border px-3 py-1 text-muted-foreground font-medium">Cards</span>
              <span className="rounded-full bg-muted border border-border px-3 py-1 text-muted-foreground font-medium">NetBanking</span>
              <span className="rounded-full bg-muted border border-border px-3 py-1 text-muted-foreground font-medium">Wallets</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground bg-background">
        © {new Date().getFullYear()} Spandana Printers. All rights reserved.
      </div>
    </footer>
  );
}
