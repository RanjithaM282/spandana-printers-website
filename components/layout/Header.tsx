"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, ShoppingCart, MessageCircle, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useCart } from "@/store/useCart";
import { useChat } from "@/store/useChat";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/track-order", label: "Track Order" },
  { href: "/admin", label: "Admin" },
];

export default function Header() {
  const pathname = usePathname();
  const { items, isOpen: cartOpen, open: openCart, close: closeCart, removeItem, updateQuantity, clear } = useCart();
  const { isOpen: chatOpen, open: openChat, close: closeChat, messages, addMessage } = useChat();

  const activeSlug = useMemo(() => {
    if (!pathname) return "/";
    if (pathname.startsWith("/services")) return "/services";
    if (pathname.startsWith("/track-order")) return "/track-order";
    if (pathname.startsWith("/admin")) return "/admin";
    return "/";
  }, [pathname]);

  const CartDrawer = () => {
    if (!cartOpen) return null;

    const total = items.reduce((sum, item) => sum + item.total, 0);

    const handleQuantityChange = (id: string, newQuantity: number) => {
      if (newQuantity < 1) return;
      updateQuantity(id, newQuantity);
    };

    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black/50" onClick={closeCart} />
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Shopping Cart ({items.length})
              </h2>
              <button
                onClick={closeCart}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-slate-500">Your cart is empty</p>
                  <button
                    onClick={closeCart}
                    className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">
                            {item.serviceTitle}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.size} • {item.gsm} GSM • {item.quantity} pcs
                          </p>
                          {item.addOns?.length > 0 && (
                            <p className="mt-1 text-xs text-slate-400">
                              Add-ons: {item.addOns.join(", ")}
                            </p>
                          )}
                          {item.notes && (
                            <p className="mt-1 text-xs text-slate-400">Note: {item.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-2 rounded-lg p-1 text-red-500 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                          >
                            <Moon className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center text-sm font-medium text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                          >
                            <Sun className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="font-semibold text-slate-900">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(item.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-slate-200 p-4">
                <div className="flex justify-between text-lg font-semibold text-slate-900">
                  <span>Total</span>
                  <span>
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(total)}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={closeCart}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700"
                  >
                    Proceed to Checkout
                  </button>
                  <button
                    onClick={() => {
                      clear();
                      closeCart();
                    }}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-700 hover:bg-slate-50"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ChatWidget = () => {
    const [input, setInput] = useState("");

    const handleSend = () => {
      if (!input.trim()) return;
      
      addMessage({
        id: Date.now().toString(),
        sender: "customer",
        text: input,
        timestamp: Date.now(),
      });
      
      setInput("");
      
      setTimeout(() => {
        addMessage({
          id: (Date.now() + 1).toString(),
          sender: "admin",
          text: "Thank you for your message! Our team will respond shortly.",
          timestamp: Date.now(),
        });
      }, 1000);
    };

    if (!chatOpen) return null;

    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
        <div className="rounded-2xl bg-gradient-to-br from-white to-blue-50 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between rounded-t-2xl bg-indigo-600 p-4 text-white">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
              <h3 className="font-semibold">Live Chat</h3>
            </div>
            <button
              onClick={closeChat}
              className="rounded-lg p-1 hover:bg-indigo-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="h-96 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-slate-500">Start a conversation with us</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "customer" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                        msg.sender === "customer"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              />
              <button
                onClick={handleSend}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg shadow-lg animate-fade-in border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">SP</span>
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Spandana Printers</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition ${
                  activeSlug === item.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={openCart}
              className="relative rounded-full p-2 text-muted-foreground hover:bg-muted"
            >
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {items.length}
                </span>
              )}
            </button>

            <a
              href="https://wa.me/918904467535"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 md:inline-flex"
            >
              WhatsApp
            </a>

            <Link href="/services" className="rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:from-green-700 hover:to-emerald-700 hover:scale-105 animate-pulse">
              Start Order
            </Link>
          </div>
        </div>
      </header>

      <CartDrawer />
      <ChatWidget />

      <button
        onClick={openChat}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-primary p-4 text-primary-foreground shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-background"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </>
  );
}