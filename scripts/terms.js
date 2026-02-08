// terms.js
import { escapeHtml } from "./helpers.js";

const CLAUSES = [
  {
    title: "1. Educational Use Only",
    content:
      "All content provided by DEMO e-Learning is for educational purposes only. We do not provide financial, investment, or legal advice. Trading cryptocurrencies involves significant risk of loss.",
  },
  {
    title: "2. Digital Content Rights",
    content:
      "Upon purchase, you are granted a non-exclusive, non-transferable license to access the course materials for personal use. Redistribution, recording, or sharing of credentials will result in immediate termination of access without refund.",
  },
  {
    title: "3. No Refund Policy",
    content:
      "Due to the digital nature of our educational products (videos, ebooks, and workbooks) and the immediate delivery of intellectual property, all sales are final and non-refundable.",
  },
  {
    title: "4. Account Integrity",
    content:
      "Students are responsible for maintaining the confidentiality of their access codes. DEMO e-Learning may monitor abnormal access patterns to prevent account sharing.",
  },
  {
    title: "5. Risk Disclosure",
    content:
      "Past performance of any trading strategy discussed does not guarantee future results. DEMO e-Learning is not responsible for any financial losses incurred while applying techniques taught in our courses.",
  },
];

const renderTerms = () => {
  return `
  <div class="bg-white min-h-screen py-20">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="mb-12 flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <a href="#/" class="hover:text-yellow-600 transition-colors">Home</a>
        <span>/</span>
        <span class="text-slate-900">Terms &amp; Conditions</span>
      </nav>

      <header class="mb-20">
        <h1 class="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter">Terms &amp; Conditions</h1>
        <p class="text-slate-500 text-xl font-medium">
          Please review these terms carefully before enrolling in our learning tracks.
        </p>
      </header>

      <div class="space-y-16">
        ${CLAUSES.map(
          (c) => `
          <section class="border-t border-slate-100 pt-10">
            <h2 class="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">${escapeHtml(
              c.title
            )}</h2>
            <p class="text-slate-600 leading-relaxed text-lg">${escapeHtml(c.content)}</p>
          </section>
        `
        ).join("")}
      </div>

      <div class="mt-24 p-12 bg-slate-900 rounded-[3rem] text-white">
        <div class="max-w-xl">
          <h3 class="text-2xl font-black mb-4">Acceptance of Terms</h3>
          <p class="text-slate-300 mb-8 font-medium">
            By enrolling in any DEMO e-Learning course, you acknowledge that you have read, understood, and agreed to be bound by these terms.
          </p>
          <a href="#/" class="inline-block px-8 py-4 bg-yellow-500 text-slate-950 font-black rounded-2xl hover:bg-yellow-400 transition-all">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  </div>
  `;
};

export default renderTerms;