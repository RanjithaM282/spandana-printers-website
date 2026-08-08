const pricingHeaders = ["GSM", "A5", "A4", "A3"];
const pricingRows = [
  { gsm: 90, a5: 2, a4: 4, a3: 6 },
  { gsm: 130, a5: 2.5, a4: 4.5, a3: 6.5 },
  { gsm: 170, a5: 3, a4: 5, a3: 7 },
  { gsm: 220, a5: 3.5, a4: 5.5, a3: 7.5 },
  { gsm: 300, a5: 4, a4: 6, a3: 8 },
];

export default function BrochureMatrix() {
  return (
    <div className="rounded-3xl border border-white/50 bg-gradient-to-br from-white to-blue-50 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-500">Pricing</p>
          <h3 className="text-lg font-bold text-slate-900">Brochure Price Per Piece</h3>
          <p className="text-xs text-slate-500">Minimum 1000 units | Folding extra ₹3 per piece</p>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500">
              {pricingHeaders.map((header) => (
                <th key={header} className="px-3 py-2 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pricingRows.map((row) => (
              <tr key={row.gsm} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold text-slate-900">{row.gsm}</td>
                <td className="px-3 py-2">₹{row.a5.toFixed(2)}</td>
                <td className="px-3 py-2">₹{row.a4.toFixed(2)}</td>
                <td className="px-3 py-2">₹{row.a3.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        2k+ qty: 5% discount · 5k+ qty: 10% discount. Ask us for custom folding or UV enhancements.
      </p>
    </div>
  );
}
