// privacy.js
import { escapeHtml } from "./helpers.js";

const SECTIONS = [
  {
    title: "1. Information Collection",
    content:
      "We collect information you provide directly to us when you enroll in a course, create an account, or communicate with our support team. This includes your name, email address, and transaction history.",
  },
  {
    title: "2. Usage of Data",
    content:
      "Your data is used solely to provide educational services, process enrollments, and improve the DEMO e-Learning experience. We do not sell your personal data to third-party marketing firms.",
  },
  {
    title: "3. Blockchain Transparency",
    content:
      "While we do not store your private keys, any public wallet addresses shared for educational purposes or verification are subject to public blockchain transparency. We advise students never to share seed phrases.",
  },
  {
    title: "4. Cookies & Tracking",
    content:
      "We use essential cookies to maintain your login session and progress tracking. Analytics cookies help us understand which modules are most effective for students.",
  },
  {
    title: "5. Security Measures",
    content:
      "Encryption is used for all data transmission. Our storage layers are protected to ensure your learning history and identity remain private.",
  },
];

const renderPrivacy = () => {
  return `
  <div class="bg-white min-h-screen py-20">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="mb-12 flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <a href="#/" class="hover:text-yellow-600 transition-colors">Home</a>
        <span>/</span>
        <span class="text-slate-900">Privacy Policy</span>
      </nav>

      <header class="mb-20">
        <h1 class="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter">Privacy Policy</h1>
        <p class="text-slate-500 text-xl font-medium">
          Last updated: May 2024. This policy outlines how DEMO e-Learning protects your digital identity.
        </p>
      </header>

      <div class="space-y-16">
        ${SECTIONS.map(
          (s) => `
          <section class="border-t border-slate-100 pt-10">
            <h2 class="text-2xl font-black text-slate-900 mb-6">${escapeHtml(s.title)}</h2>
            <p class="text-slate-600 leading-relaxed text-lg whitespace-pre-line">${escapeHtml(s.content)}</p>
          </section>
        `
        ).join("")}
      </div>

      <div class="mt-24 p-12 bg-slate-50 rounded-[3rem] border border-slate-100 text-center">
        <h3 class="text-xl font-black text-slate-900 mb-4">Questions regarding your data?</h3>
        <p class="text-slate-500 mb-8">Contact our compliance team for data export or deletion requests.</p>
        <a href="mailto:privacy@demo-elearning.com"
           class="inline-block px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all">
          Contact Compliance
        </a>
      </div>
    </div>
  </div>
  `;
};

export default renderPrivacy;