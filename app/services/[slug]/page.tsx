"use client";

import React, { useMemo, useState, type ChangeEvent, use } from "react";
import { notFound } from "next/navigation";
import BrochureMatrix from "@/components/pricing/BrochureMatrix";
import { addOns } from "@/lib/config/addOns";
import { useCart } from "@/store/useCart";
import { useChat } from "@/store/useChat";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

type ServiceConfig = {
  title: string;
  description: string;
  sizes: string[];
  gsm: number[];
  minQty: number;
  baseRate?: number;
};

const brochureMatrix: Record<number, Record<string, number>> = {
  90: { A5: 2, A4: 4, A3: 6 },
  130: { A5: 2.5, A4: 4.5, A3: 6.5 },
  170: { A5: 3, A4: 5, A3: 7 },
  220: { A5: 3.5, A4: 5.5, A3: 7.5 },
  300: { A5: 4, A4: 6, A3: 8 },
};

const services: Record<string, ServiceConfig> = {
  brochures: {
    title: "Brochures",
    description:
      "Tri-fold / bi-fold brochures with optional gloss, matte or UV finishing. Upload your print-ready artwork or use our design support.",
    sizes: ["A5", "A4", "A3"],
    gsm: [90, 130, 170, 220, 300],
    minQty: 1000,
  },
  "mono-carton-boxes": {
    title: "Mono Carton Boxes",
    description:
      "Retail & FMCG mono cartons with multicolour printing, lamination, spot UV and die-cut finishing.",
    sizes: ["Small", "Medium", "Large"],
    gsm: [230, 270, 300, 350],
    minQty: 500,
    baseRate: 18,
  },
  "hospital-files": {
    title: "Hospital Files",
    description: "Clip files, envelopes and folders customised for hospitals and clinics.",
    sizes: ["A4", "Legal"],
    gsm: [120, 170, 220],
    minQty: 300,
    baseRate: 20,
  },
  envelopes: {
    title: "Envelopes",
    description: "9×4, 9×6, 10×12 envelopes with brand printing and variable GSM.",
    sizes: ["9x4", "9x6", "10x12"],
    gsm: [100, 120, 150],
    minQty: 500,
    baseRate: 5,
  },
  "visiting-cards": {
    title: "Visiting Cards",
    description: "Matte/gloss cards, UV spot, rounded corners and textured stocks.",
    sizes: ["3.5x2in", "Square"],
    gsm: [300, 350, 400],
    minQty: 500,
    baseRate: 4,
  },
  "bill-books": {
    title: "Bill Books",
    description: "Carbonless bill books with numbering, perforation and custom branding.",
    sizes: ["A5", "A4"],
    gsm: [70, 90, 120],
    minQty: 250,
    baseRate: 12,
  },
  calendars: {
    title: "Calendars",
    description: "Wall/desk calendars, spiral binding, spot UV, metallic inks.",
    sizes: ["Desk", "Wall A3", "Wall A2"],
    gsm: [170, 220, 300],
    minQty: 200,
    baseRate: 45,
  },
  "spiral-binding": {
    title: "Spiral Binding",
    description: "Binding for manuals, diaries, presentations and reports.",
    sizes: ["A5", "A4", "A3"],
    gsm: [80, 100, 120],
    minQty: 50,
    baseRate: 8,
  },
  "corrugated-boxes": {
    title: "Corrugated Boxes",
    description: "3-ply / 5-ply corrugated cartons with branding and logistics markings.",
    sizes: ["Small", "Medium", "Large"],
    gsm: [150, 200, 250],
    minQty: 200,
    baseRate: 35,
  },
  textbooks: {
    title: "Textbooks",
    description: "Educational textbooks with perfect binding / sewing and lamination.",
    sizes: ["A5", "A4"],
    gsm: [70, 80, 100],
    minQty: 500,
    baseRate: 22,
  },
  "pizza-boxes": {
    title: "Pizza Boxes",
    description: "Food-grade pizza boxes, grease resistant coating, quick lead times.",
    sizes: ["7\"", "9\"", "12\"", "14\""],
    gsm: [230, 270, 300],
    minQty: 300,
    baseRate: 25,
  },
  "menu-cards": {
    title: "Menu Cards",
    description: "Flat or folded menus with matte/gloss lamination, UV spot, custom shapes.",
    sizes: ["A5", "A4", "11x17"],
    gsm: [170, 220, 300],
    minQty: 300,
    baseRate: 18,
  },
  "custom-printing": {
    title: "Custom Printing",
    description: "Bespoke work—posters, signage, merchandising, packaging, large-format.",
    sizes: ["Custom"],
    gsm: [90, 120, 170, 220, 300],
    minQty: 1,
    baseRate: 30,
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default function ServiceDetailPage({ params }: Props) {
  const resolvedParams = React.use(params);
  const service = services[resolvedParams.slug];

  if (!service) {
    notFound();
  }

  const [size, setSize] = useState("A4");
  const [gsm, setGsm] = useState(service.gsm[0]);
  const [quantity, setQuantity] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [deliveryPin, setDeliveryPin] = useState("");
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  
  // Plate printing state
  const [plateSize, setPlateSize] = useState("18×25");
  const [plateGsm, setPlateGsm] = useState(90);
  const [plateQuantity, setPlateQuantity] = useState(1000);
  const [plateFirstImpression, setPlateFirstImpression] = useState(1);
  const [plateSecondImpression, setPlateSecondImpression] = useState(0);
  const [files, setFiles] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("8904467535");
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { addItem: addCartItem } = useCart();
  const { open: openChat } = useChat();

  const addOnTotal = useMemo(() => {
    if (!quantity) return 0;
    return selectedAddOns.reduce((sum, addonId) => {
      const addon = addOns.find((a) => a.id === addonId);
      if (!addon) return sum;
      // folding is per piece as per spec, others per piece too (simplified)
      return sum + addon.price * Number(quantity);
    }, 0);
  }, [selectedAddOns, quantity]);

  const basePrice = useMemo(() => {
    if (!quantity) return 0;
    if (resolvedParams.slug === "brochures") {
      const perPiece = brochureMatrix[gsm]?.[size] ?? 0;
      let subtotal = perPiece * Number(quantity);
      if (Number(quantity) >= 5000) {
        subtotal *= 0.9;
      } else if (Number(quantity) >= 2000) {
        subtotal *= 0.95;
      }
      return subtotal;
    }

    const base = service.baseRate ?? 10;
    const gsmFactor = 1 + (gsm - service.gsm[0]) * 0.01;
    const standardSizes = ["A5", "A4", "A3"];
    const sizeFactor = 1 + standardSizes.indexOf(size) * 0.08;
    const subtotal = base * gsmFactor * sizeFactor * Number(quantity);
    return subtotal;
  }, [resolvedParams.slug, service, size, gsm, quantity]);

  const total = basePrice + addOnTotal;

  const toggleAddon = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const estimateDelivery = () => {
    if (deliveryPin.length < 6) {
      setDeliveryFee(null);
      return;
    }
    // mock:  ₹4 per km factor based on first digit
    const zoneFactor = Number(deliveryPin[0]);
    const fee = Math.max(150, zoneFactor * 40);
    setDeliveryFee(fee);
  };

  const savingsLabel =
    quantity && Number(quantity) >= 5000
      ? "Bulk saver: 10% discount already applied."
      : quantity && Number(quantity) >= 2000
      ? "Smart saver: 5% discount applied."
      : `Enter quantity to calculate price and unlock savings.`;

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const uploadedFiles: string[] = [];
    
    for (const file of selectedFiles) {
      try {
        // Upload file to server
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/orders', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          uploadedFiles.push(result.fileUrl);
          console.log('✅ File uploaded successfully:', result.fileUrl);
          console.log('📋 File details:', {
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            type: file.type
          });
        } else {
          console.error('❌ Upload failed:', result.error);
          alert(`Failed to upload ${file.name}: ${result.error}`);
        }
      } catch (error) {
        console.error('❌ Upload error:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }
    
    setFiles(uploadedFiles);
    
    // Show success feedback
    if (uploadedFiles.length > 0) {
      const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
      console.log(`✅ ${uploadedFiles.length} file(s) uploaded successfully (${(totalSize / 1024 / 1024).toFixed(2)} MB total)`);
    }
  };

  const handlePlaceOrder = async () => {
    if (!customerName || !customerEmail || !quantity) {
      alert('Please fill in all customer details and quantity');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      alert('Please enter a valid email address (e.g., user@example.com)');
      return;
    }

    // Validate delivery address if home delivery is selected
    if (deliveryOption === 'delivery') {
      if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.pincode) {
        alert('Please fill in all delivery address details for home delivery');
        return;
      }
      if (deliveryAddress.pincode.length !== 6) {
        alert('Please enter a valid 6-digit pincode');
        return;
      }
    }

    // Calculate minimum advance (30% of total)
    const minimumAdvance = Math.ceil(total * 0.3);
    
    // Create pending order data
    const orderData = {
      id: `order-${Date.now()}`,
      serviceSlug: resolvedParams.slug,
      serviceTitle: service.title,
      size,
      gsm: gsm.toString(),
      quantity: Number(quantity),
      addOns: selectedAddOns,
      notes,
      total,
      customerEmail,
      customerName,
      customerPhone: '8904467535', // Default phone number
      orderDate: new Date().toISOString(),
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      advancePaid: 0,
      remainingAmount: total,
      paymentHistory: [],
      files,
      deliveryOption,
      deliveryAddress: deliveryOption === 'delivery' ? deliveryAddress : undefined
    };
    
    // Store pending order and show payment
    setPendingOrder(orderData);
    setShowOrderForm(false);
    setShowPayment(true);
  };

  const handleAddToCart = () => {
    addCartItem({
      id: `${resolvedParams.slug}-${Date.now()}`,
      serviceSlug: resolvedParams.slug,
      serviceTitle: service.title,
      size,
      gsm: gsm.toString(),
      quantity: Number(quantity) || 0,
      addOns: selectedAddOns,
      notes,
      total,
    });
  };

  const summaryChips = [
    `Size ${size}`,
    `${gsm} GSM`,
    quantity ? `${Number(quantity).toLocaleString()} qty` : "No quantity",
    selectedAddOns.length ? `${selectedAddOns.length} add-on(s)` : "No add-ons",
  ];

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[2fr_1fr]">
        {/* Left column */}
        <section className="space-y-8 rounded-3xl bg-gradient-to-br from-white to-blue-50 p-6 shadow-2xl backdrop-blur-sm animate-fade-in hover-lift">
          <header>
            <p className="text-sm uppercase tracking-[0.4em] text-indigo-500">Service</p>
            <h1 className="mt-2 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              {service.title}
            </h1>
            <p className="mt-3 text-slate-600">{service.description}</p>
            <div className="mt-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 text-sm text-slate-600">
              Upload PDF / JPG / PNG up to 200 MB. We run a pre-flight check and share proof before print.
            </div>
          </header>

          {/* Product options */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="A3">A3</option>
                <option value="A4">A4</option>
                <option value="A5">A5</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">GSM</label>
              <select
                value={gsm}
                onChange={(e) => setGsm(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value={90}>90 GSM</option>
                <option value={130}>130 GSM</option>
                <option value={170}>170 GSM</option>
                <option value={220}>220 GSM</option>
                <option value={300}>300 GSM</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Enter quantity"
              />
              <p className="mt-1 text-xs text-emerald-600">{savingsLabel}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                File upload
              </label>
              <label className="mt-2 flex h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 text-center text-sm text-slate-500 transition hover:border-indigo-500">
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" hidden multiple onChange={handleFiles} />
                <span className="font-medium text-indigo-600">Drop files</span> or browse
                <span className="text-xs text-slate-400">PDF, JPG, PNG up to 200MB</span>
              </label>
              {files.length > 0 && (
                <ul className="mt-2 space-y-1 rounded-xl border border-slate-100 p-3 text-xs text-slate-500">
                  {files.map((file) => (
                    <li key={file}>• {file}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Comprehensive Printing Price Chart */}
          <div className="rounded-3xl bg-gradient-to-br from-white via-blue-50 to-white p-8 shadow-2xl animate-slide-up border border-white/50 backdrop-blur-sm">
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Complete Printing Price List
              </h2>
              <p className="text-lg text-slate-600">
                Professional printing services with transparent pricing
              </p>
            </div>
            
            <div className="space-y-8">
              {/* Visiting Cards Section */}
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border border-blue-200 backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
                  <span className="w-4 h-4 bg-blue-500 rounded-full mr-3"></span>
                  Visiting Cards – 1000 Qty (87 × 52 mm)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="px-4 py-3 text-left font-semibold">Product</th>
                        <th className="px-4 py-3 text-center font-semibold">Single Side</th>
                        <th className="px-4 py-3 text-center font-semibold">Double Side</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-200">
                      <tr className="bg-white hover:bg-blue-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Glossy Lamination</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹300</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹400</td>
                      </tr>
                      <tr className="bg-white hover:bg-blue-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Matt Lamination</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹400</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹450</td>
                      </tr>
                      <tr className="bg-white hover:bg-blue-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Non Tearable (PVC)</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹420</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹500</td>
                      </tr>
                      <tr className="bg-white hover:bg-blue-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Die Cut Cards Matt</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹1150</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹1250</td>
                      </tr>
                      <tr className="bg-white hover:bg-blue-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Spot UV Cards</td>
                        <td className="px-4 py-3 text-center text-slate-500">NA</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹2500</td>
                      </tr>
                      <tr className="bg-white hover:bg-blue-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Gold Foiling Cards</td>
                        <td className="px-4 py-3 text-center text-slate-500">NA</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹3700</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* A3 Size Cut Jobs Section */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 p-6 border border-emerald-200 backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-emerald-900 mb-6 flex items-center">
                  <span className="w-4 h-4 bg-emerald-500 rounded-full mr-3"></span>
                  <span className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></span>
                  A3 Size Cut Jobs
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-emerald-600 text-white">
                        <th className="px-4 py-3 text-left font-semibold">Paper Type</th>
                        <th className="px-4 py-3 text-center font-semibold">Single Side</th>
                        <th className="px-4 py-3 text-center font-semibold">Double Side</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-200">
                      <tr className="bg-white hover:bg-emerald-50">
                        <td className="px-4 py-3 font-medium text-slate-900">90 gsm Art Paper</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹3100</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹3400</td>
                      </tr>
                      <tr className="bg-white hover:bg-emerald-50">
                        <td className="px-4 py-3 font-medium text-slate-900">130 gsm Art Paper</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹3700</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹3900</td>
                      </tr>
                      <tr className="bg-white hover:bg-emerald-50">
                        <td className="px-4 py-3 font-medium text-slate-900">170 gsm Art Paper</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹4250</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹4400</td>
                      </tr>
                      <tr className="bg-white hover:bg-emerald-50">
                        <td className="px-4 py-3 font-medium text-slate-900">220 gsm Art Paper</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹5000</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹5400</td>
                      </tr>
                      <tr className="bg-white hover:bg-emerald-50">
                        <td className="px-4 py-3 font-medium text-slate-900">330 gsm Art Paper</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹6900</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹7300</td>
                      </tr>
                      <tr className="bg-white hover:bg-emerald-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Sticker</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹8760</td>
                        <td className="px-4 py-3 text-center text-slate-500">NA</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Excel-Bond Section */}
              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 border border-purple-200 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                  Excel-Bond 100 gsm – 1000 Qty
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-purple-600 text-white">
                        <th className="px-4 py-3 text-left font-semibold">Product</th>
                        <th className="px-4 py-3 text-center font-semibold">Single Side</th>
                        <th className="px-4 py-3 text-center font-semibold">Double Side</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-200">
                      <tr className="bg-white hover:bg-purple-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Letter Heads A4</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹1500</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹2300</td>
                      </tr>
                      <tr className="bg-white hover:bg-purple-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Envelopes 9.5" × 4"</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹1900</td>
                        <td className="px-4 py-3 text-center text-slate-500">NA</td>
                      </tr>
                      <tr className="bg-white hover:bg-purple-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Envelopes 9.5" × 4.5"</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹3200</td>
                        <td className="px-4 py-3 text-center text-slate-500">NA</td>
                      </tr>
                      <tr className="bg-white hover:bg-purple-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Envelopes 10.5" × 4.5"</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹3300</td>
                        <td className="px-4 py-3 text-center text-slate-500">NA</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Multicolor Cut Jobs Section */}
              <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 p-6 border border-orange-200 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-orange-500 rounded-full mr-3"></span>
                  Multicolor Cut Jobs (Size 215 × 285 mm)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-orange-600 text-white">
                        <th className="px-4 py-3 text-left font-semibold">Product</th>
                        <th className="px-4 py-3 text-center font-semibold">Single Side</th>
                        <th className="px-4 py-3 text-center font-semibold">Double Side</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-200">
                      <tr className="bg-white hover:bg-orange-50">
                        <td className="px-4 py-3 font-medium text-slate-900">90 GSM</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹1600</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹1800</td>
                      </tr>
                      <tr className="bg-white hover:bg-orange-50">
                        <td className="px-4 py-3 font-medium text-slate-900">130 GSM</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹1800</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹2000</td>
                      </tr>
                      <tr className="bg-white hover:bg-orange-50">
                        <td className="px-4 py-3 font-medium text-slate-900">170 GSM</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹3100</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹3200</td>
                      </tr>
                      <tr className="bg-white hover:bg-orange-50">
                        <td className="px-4 py-3 font-medium text-slate-900">220 GSM</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹3800</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹3900</td>
                      </tr>
                      <tr className="bg-white hover:bg-orange-50">
                        <td className="px-4 py-3 font-medium text-slate-900">300 GSM</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹4800</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹4900</td>
                      </tr>
                      <tr className="bg-white hover:bg-orange-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Sticker</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹5400</td>
                        <td className="px-4 py-3 text-center text-slate-500">NA</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Wedding Cards Section */}
              <div className="rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 p-6 border border-pink-200 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-pink-900 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-pink-500 rounded-full mr-3"></span>
                  Wedding Cards – 9 × 6 Folding
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-pink-600 text-white">
                        <th className="px-4 py-3 text-left font-semibold">Lamination</th>
                        <th className="px-4 py-3 text-center font-semibold">500 Qty</th>
                        <th className="px-4 py-3 text-center font-semibold">1000 Qty</th>
                        <th className="px-4 py-3 text-center font-semibold">1500 Qty</th>
                        <th className="px-4 py-3 text-center font-semibold">2000 Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pink-200">
                      <tr className="bg-white hover:bg-pink-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Glossy</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹4100</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹5500</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹7400</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹8900</td>
                      </tr>
                      <tr className="bg-white hover:bg-pink-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Matt</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹4500</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹6300</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹8200</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹9900</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Envelope Covers Section */}
              <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 p-6 border border-cyan-200 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-cyan-900 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-cyan-500 rounded-full mr-3"></span>
                  Envelope Covers – 9 × 6 inches
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-cyan-600 text-white">
                        <th className="px-4 py-3 text-left font-semibold">Art Paper</th>
                        <th className="px-4 py-3 text-center font-semibold">500 Qty</th>
                        <th className="px-4 py-3 text-center font-semibold">1000 Qty</th>
                        <th className="px-4 py-3 text-center font-semibold">1500 Qty</th>
                        <th className="px-4 py-3 text-center font-semibold">2000 Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-200">
                      <tr className="bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/20">
                        <td className="px-4 py-3 font-medium text-slate-900">90 gsm</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹3000</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹3800</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹5700</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹6100</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/20">
                        <td className="px-4 py-3 font-medium text-slate-900">130 gsm</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹3400</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹4700</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹6800</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹7600</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hospital Files Section */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 p-6 border border-indigo-200 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></span>
                  Hospital Files – Size 310 × 440 mm (300 GSM Art Board)
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-indigo-800 mb-3">Single Side (500 | 1000 | 2000)</h4>
                    <div className="bg-white rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-700">Glossy:</span>
                          <span className="text-slate-900 font-semibold">₹5500 / ₹7300 / ₹13500</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-700">Matt:</span>
                          <span className="text-slate-900 font-semibold">₹1.20 / ₹1.50 / ₹1.20</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-indigo-800 mb-3">Double Side (500 | 1000 | 2000)</h4>
                    <div className="bg-white rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-700">Glossy:</span>
                          <span className="text-slate-900 font-semibold">₹5700 / ₹8000 / ₹14500</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-700">Matt:</span>
                          <span className="text-slate-900 font-semibold">₹2 / ₹2 / ₹2.50</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hospital Files 330x480 Section */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 p-6 border border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-slate-500 rounded-full mr-3"></span>
                  Hospital Files – Size 330 × 480 mm
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Single Side (500 | 1000 | 2000)</h4>
                    <div className="bg-white rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-700">Glossy:</span>
                          <span className="text-slate-900 font-semibold">₹5900 / ₹9750 / ₹17900</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-700">Matt:</span>
                          <span className="text-slate-900 font-semibold">₹1.60 / ₹2.50 / ₹1.60</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Double Side (500 | 1000 | 2000)</h4>
                    <div className="bg-white rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-700">Glossy:</span>
                          <span className="text-slate-900 font-semibold">₹7700 / ₹11600 / ₹20150</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-700">Matt:</span>
                          <span className="text-slate-900 font-semibold">₹3.10 / ₹4.80 / ₹4.80</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Price List Section */}
              <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 border border-green-200 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                  Digital Price List (GST 18% Extra)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-green-600 text-white">
                        <th className="px-4 py-3 text-left font-semibold">Product</th>
                        <th className="px-4 py-3 text-center font-semibold">SS</th>
                        <th className="px-4 py-3 text-center font-semibold">DS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-200">
                      <tr className="bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <td className="px-4 py-3 font-medium text-slate-900">130 gsm</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹9</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹13</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <td className="px-4 py-3 font-medium text-slate-900">170 gsm</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹10</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹14</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <td className="px-4 py-3 font-medium text-slate-900">220 gsm</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹11</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹16</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <td className="px-4 py-3 font-medium text-slate-900">300 gsm</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹11</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹16</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <td className="px-4 py-3 font-medium text-slate-900">Bond</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹9</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹13</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <td className="px-4 py-3 font-medium text-slate-900">Sticker</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹12</td>
                        <td className="px-4 py-3 text-center text-slate-500">-</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <td className="px-4 py-3 font-medium text-slate-900">Texture</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹21</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹27</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <td className="px-4 py-3 font-medium text-slate-900">Metallic</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹24</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹29</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <td className="px-4 py-3 font-medium text-slate-900">NT Sheets 125 mic</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹24</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹29</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <td className="px-4 py-3 font-medium text-slate-900">NT Sheets 220 mic</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹30</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹35</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <td className="px-4 py-3 font-medium text-slate-900">Clear Sticker</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹25</td>
                        <td className="px-4 py-3 text-center text-slate-500">-</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <td className="px-4 py-3 font-medium text-slate-900">Badge Sticker</td>
                        <td className="px-4 py-3 text-center text-slate-700">₹15</td>
                        <td className="px-4 py-3 text-center text-slate-500">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Plate & Printing Rate Section */}
              <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-6 border border-yellow-200 dark:border-yellow-800">
                <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-100 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
                  Plate & Printing Rate
                </h3>
                
                {/* Interactive Input Form */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Size</label>
                    <input
                      type="text"
                      value={plateSize}
                      onChange={(e) => setPlateSize(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                      placeholder="e.g., 18×25, 20×30, 25×36"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">GSM</label>
                    <select
                      value={plateGsm}
                      onChange={(e) => setPlateGsm(Number(e.target.value))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value={90}>90 GSM</option>
                      <option value={130}>130 GSM</option>
                      <option value={170}>170 GSM</option>
                      <option value={220}>220 GSM</option>
                      <option value={300}>300 GSM</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Quantity</label>
                    <input
                      type="number"
                      value={plateQuantity}
                      onChange={(e) => setPlateQuantity(Number(e.target.value))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                      placeholder="Enter quantity"
                    />
                  </div>
                </div>
                
                {/* Impressions */}
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <div>
                    <label className="text-sm font-medium text-slate-700">1st Impression</label>
                    <input
                      type="number"
                      value={plateFirstImpression}
                      onChange={(e) => setPlateFirstImpression(Number(e.target.value))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                      placeholder="Number of 1st impressions"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">2nd Impression</label>
                    <input
                      type="number"
                      value={plateSecondImpression}
                      onChange={(e) => setPlateSecondImpression(Number(e.target.value))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                      placeholder="Number of 2nd impressions"
                    />
                  </div>
                </div>
                
                {/* Reference Price Table */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Reference Prices:</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-yellow-600 text-white">
                          <th className="px-4 py-3 text-left font-semibold">Size</th>
                          <th className="px-4 py-3 text-center font-semibold">1st Impression</th>
                          <th className="px-4 py-3 text-center font-semibold">2nd Impression</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-yellow-200 dark:divide-yellow-800">
                        <tr className="bg-white dark:bg-slate-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                          <td className="px-4 py-3 font-medium text-slate-900">18"×25"</td>
                          <td className="px-4 py-3 text-center text-slate-700">₹1800</td>
                          <td className="px-4 py-3 text-center text-slate-700">₹500</td>
                        </tr>
                        <tr className="bg-white dark:bg-slate-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                          <td className="px-4 py-3 font-medium text-slate-900">20"×30"</td>
                          <td className="px-4 py-3 text-center text-slate-700">₹3000</td>
                          <td className="px-4 py-3 text-center text-slate-700">₹800</td>
                        </tr>
                        <tr className="bg-white dark:bg-slate-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                          <td className="px-4 py-3 font-medium text-slate-900">25"×36"</td>
                          <td className="px-4 py-3 text-center text-slate-700">₹5000</td>
                          <td className="px-4 py-3 text-center text-slate-700">₹1500</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Contact Info Section */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="w-3 h-3 bg-white rounded-full mr-3"></span>
                  Contact Info
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-lg mb-2">Spandana Printers</h4>
                    <p className="text-indigo-100 mb-4">Magadi Road, Bengaluru</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Phones:</h4>
                    <div className="space-y-1 text-indigo-100">
                      <p>9036725551</p>
                      <p>9036795552</p>
                      <p>9036777569</p>
                      <p>9591937779</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Brochure pricing */}
          {resolvedParams.slug === "brochures" && <BrochureMatrix />}

          {/* Add-ons */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add-ons</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {addOns.map((addon) => (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => toggleAddon(addon.id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selectedAddOns.includes(addon.id)
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="font-semibold">{addon.label}</span>
                  <span className="block text-xs text-slate-500">
                    +{INR.format(addon.price)} per piece
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="rounded-3xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900">FAQ</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                <strong>Turnaround?</strong> Standard 4–6 business days. Express options available.
              </li>
              <li>
                <strong>Proofing?</strong> We share digital proof + call confirmation before printing.
              </li>
              <li>
                <strong>Design help?</strong> Upload your file or request design assistance via chat.
              </li>
            </ul>
          </div>
        </section>

        {/* Right column */}
        <aside className="space-y-6 rounded-3xl bg-gradient-to-br from-white to-slate-50 p-6 shadow-2xl animate-slide-up hover-lift">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-indigo-500">Quote</p>
            <h2 className="mt-2 text-4xl font-semibold text-slate-900">
              {INR.format(total)}
            </h2>
            <p className="text-sm text-slate-500">Includes add-ons & automatic bulk discounts.</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {summaryChips.map((chip) => (
              <span key={chip} className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
                {chip}
              </span>
            ))}
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 text-sm font-semibold transition hover:from-indigo-700 hover:to-purple-700"
          >
            Add to Cart
          </button>
          <button
            onClick={() => setShowOrderForm(!showOrderForm)}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 text-sm font-semibold transition hover:from-emerald-700 hover:to-green-700"
          >
            📦 Place Order
          </button>
          <button
            onClick={() => openChat()}
            className="w-full rounded-2xl border border-slate-300 bg-white text-slate-700 px-6 py-3 text-sm font-semibold transition hover:bg-slate-50"
          >
            💬 Chat with us
          </button>

          {/* Customer Order Form */}
          {showOrderForm && (
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 p-6 border border-emerald-200">
              <h3 className="text-lg font-semibold text-emerald-900 mb-4">Customer Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Email *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Delivery Option *</label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryOption"
                        value="pickup"
                        checked={deliveryOption === 'pickup'}
                        onChange={(e) => setDeliveryOption(e.target.value as 'pickup' | 'delivery')}
                        className="text-emerald-600"
                      />
                      <span className="text-sm text-slate-700">Store Pickup</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryOption"
                        value="delivery"
                        checked={deliveryOption === 'delivery'}
                        onChange={(e) => setDeliveryOption(e.target.value as 'pickup' | 'delivery')}
                        className="text-emerald-600"
                      />
                      <span className="text-sm text-slate-700">Home Delivery</span>
                    </label>
                  </div>
                </div>
                {deliveryOption === 'delivery' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                    <label className="text-sm font-medium text-slate-700 block mb-3">Delivery Address *</label>
                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={deliveryAddress.street}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                          className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                          placeholder="Street Address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={deliveryAddress.city}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                          className="rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          value={deliveryAddress.state}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                          className="rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                          placeholder="State"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={deliveryAddress.pincode}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value})}
                          className="rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                          placeholder="Pincode (6 digits)"
                          maxLength={6}
                        />
                        <input
                          type="text"
                          value={deliveryAddress.landmark}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, landmark: e.target.value})}
                          className="rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                          placeholder="Landmark (Optional)"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={handlePlaceOrder}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 text-sm font-semibold transition hover:from-emerald-700 hover:to-green-700"
                >
                  Submit Order
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-900">
            Need help finalising specs? Open chat below for instant assistance.
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Enter pincode"
                value={deliveryPin}
                onChange={(e) => setDeliveryPin(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <button
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={estimateDelivery}
              >
                Check
              </button>
            </div>
            {deliveryFee !== null && (
              <p className="mt-2 text-sm text-slate-600">
                Estimated delivery fee: {INR.format(deliveryFee)} | ETA 3-5 business days.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <label className="text-sm font-semibold text-slate-900">
              Notes for production
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Anything we should know? e.g., folding direction, packing preference."
            />
          </div>

          {/* Chat placeholder */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="text-base font-semibold text-slate-900">Live chat</h3>
            <p className="mt-2 text-sm text-slate-600">
              We typically reply in &lt; 2 minutes. Attach artwork, ask for pricing tweaks or design help.
            </p>
            <button
              className="mt-3 w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-500 hover:text-indigo-500"
              onClick={openChat}
            >
              Open chat window
            </button>
          </div>
        </aside>
      </div>

      {/* Payment Modal */}
      {showPayment && pendingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Complete Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Order ID</label>
                <p className="text-slate-900 font-medium">{pendingOrder.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Service</label>
                <p className="text-slate-900">{pendingOrder.serviceTitle}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Total Amount</label>
                <p className="text-2xl font-bold text-green-600">₹{pendingOrder.total.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Advance (30%)</label>
                <p className="text-lg font-semibold text-orange-600">₹{Math.ceil(pendingOrder.total * 0.3).toLocaleString()}</p>
              </div>
              
              {!isProcessingPayment ? (
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      setIsProcessingPayment(true);
                      try {
                        // Initiate Razorpay payment
                        const paymentPayload = {
                          orderId: pendingOrder.id,
                          amount: Math.ceil(pendingOrder.total * 0.3) * 100, // Convert to paise
                          customerEmail: pendingOrder.customerEmail,
                          customerName: pendingOrder.customerName,
                          customerPhone: pendingOrder.customerPhone,
                        };
                        
                        console.log('Sending payment request:', paymentPayload);
                        
                        const paymentResponse = await fetch('/api/payments/razorpay', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(paymentPayload),
                        });
                        
                        const paymentResult = await paymentResponse.json();
                        console.log('Payment API Response:', paymentResult);
                        
                        if (paymentResult.success) {
                          // Open Razorpay checkout
                          const options = {
                            ...paymentResult.data,
                            handler: async function (response: any) {
                              console.log('Payment successful:', response);
                              // Payment successful - save order to database
                              const updatedOrderData = {
                                ...pendingOrder,
                                paymentStatus: 'partially_paid',
                                advancePaid: Math.ceil(pendingOrder.total * 0.3),
                                remainingAmount: pendingOrder.total - Math.ceil(pendingOrder.total * 0.3),
                                paymentHistory: [{
                                  id: `payment-${Date.now()}`,
                                  orderId: pendingOrder.id,
                                  amount: Math.ceil(pendingOrder.total * 0.3),
                                  paymentType: 'advance' as const,
                                  transactionId: response.razorpay_payment_id,
                                  paymentDate: new Date().toISOString(),
                                  status: 'completed' as const,
                                  paymentMethod: 'razorpay'
                                }],
                                files: pendingOrder.files
                              };
                              
                              try {
                                const saveResponse = await fetch('/api/orders', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(updatedOrderData)
                                });
                                
                                const saveResult = await saveResponse.json();
                                
                                if (saveResult.success) {
                                  alert(`Payment successful! Order placed successfully.\n\nOrder ID: ${pendingOrder.id}\n\nPlease save this Order ID for future reference.`);
                                  setShowPayment(false);
                                  setIsProcessingPayment(false);
                                  // Reset form fields
                                  setCustomerName('');
                                  setCustomerEmail('');
                                  setCustomerPhone('8904467535');
                                  setNotes('');
                                  setFiles([]);
                                  setShowOrderForm(false);
                                } else {
                                  console.error('Failed to save order:', saveResult);
                                  alert('Payment successful but failed to save order details. Please contact support.');
                                  setIsProcessingPayment(false);
                                }
                              } catch (error) {
                                console.error('Error saving order:', error);
                                alert('Payment successful but failed to save order details. Please contact support.');
                                setIsProcessingPayment(false);
                              }
                            },
                            modal: {
                              ondismiss: function() {
                                console.log('Checkout form closed');
                                setIsProcessingPayment(false);
                              }
                            }
                          };
                          
                          // Load Razorpay script dynamically
                          const script = document.createElement('script');
                          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                          script.async = true;
                          script.onload = () => {
                            const razorpay = new (window as any).Razorpay(options);
                            
                            razorpay.on('payment.failed', function (response: any) {
                              console.error('Payment failed:', response);
                              alert('Payment failed. Please try again.');
                              setIsProcessingPayment(false);
                            });
                            
                            razorpay.open();
                          };
                          document.body.appendChild(script);
                        } else {
                          console.error('Payment failed:', paymentResult);
                          alert(`Payment initiation failed: ${paymentResult.error || 'Unknown error'}`);
                          setIsProcessingPayment(false);
                        }
                      } catch (error) {
                        console.error('Payment error:', error);
                        alert('Payment processing failed. Please try again.');
                        setIsProcessingPayment(false);
                      }
                    }}
                    className="w-full bg-blue-600 text-white py-3 rounded-2xl hover:bg-blue-700 transition font-semibold"
                  >
                    Pay with Razorpay
                  </button>
                  <button
                    onClick={() => {
                      setShowPayment(false);
                      setPendingOrder(null);
                      setIsProcessingPayment(false);
                    }}
                    className="w-full bg-slate-600 text-white py-3 rounded-2xl hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Processing payment...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}