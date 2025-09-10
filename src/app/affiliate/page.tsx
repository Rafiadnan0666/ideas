'use client';
import React from 'react';
import Head from 'next/head';
import { FiArrowRight, FiCheck, FiMessageSquare, FiUsers, FiDollarSign } from 'react-icons/fi';
import Image from 'next/image';

export default function AffiliatePage() {
  return (
    <>
      <Head>
        <title>Affiliate Program | kacangpanjang.id</title>
        <meta name="description" content="Join our affiliate program and earn commissions by referring clients to our digital studio services." />
        <meta property="og:title" content="Affiliate Program | kacangpanjang.id" />
        <meta property="og:description" content="Earn commission on every referral. Join our affiliate program today!" />
        <meta property="og:image" content="https://kacangpanjang.id/social-affiliate.jpg" />
        <meta property="og:url" content="https://kacangpanjang.id/affiliate" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="bg-[#0a0a0a] text-white font-sans min-h-screen overflow-x-hidden relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute top-2/3 right-1/3 w-96 h-96 bg-teal-500/10 rounded-full filter blur-3xl animate-float-delay"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-500/10 rounded-full filter blur-3xl animate-float"></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={{
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            ></div>
          ))}
        </div>

        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-12 py-3 md:py-4 border-b border-gray-800 text-sm backdrop-blur-lg bg-[#101010]/70">
          <div className="flex items-center">
            <Image 
              src="/favicon.ico" 
              alt="kacangpanjang.id logo"
              width={32}
              height={32}
              className="mr-3"
            />
            <h1 className="font-bold tracking-widest text-lg hover:text-emerald-400 transition-colors">
              <a href="/">kacangpanjang.id</a>
            </h1>
          </div>
          
          <nav className="hidden md:flex space-x-8 items-center">
            <a href="/#about" className="hover:text-emerald-400 transition group">
              About
              <span className="block h-0.5 bg-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </a>
            <a href="/work" className="hover:text-emerald-400 transition group">
              Work
              <span className="block h-0.5 bg-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </a>
            <a href="/#services" className="hover:text-emerald-400 transition group">
              Services
              <span className="block h-0.5 bg-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </a>
            <a 
              href="https://chat.whatsapp.com/BlWf7L8Qe7QEgirkB8pNCr" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md hover:scale-105 transition transform flex items-center"
            >
              Join Group <FiArrowRight className="ml-2" />
            </a>
          </nav>
          
          <a 
            href="https://chat.whatsapp.com/BlWf7L8Qe7QEgirkB8pNCr" 
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md hover:scale-105 transition transform"
          >
            Join
          </a>
        </header>

        <section className="relative pt-32 pb-20 px-6 z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Affiliate Program</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                Earn commissions by referring clients to our digital studio services
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href="https://chat.whatsapp.com/BlWf7L8Qe7QEgirkB8pNCr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md hover:scale-105 transition transform font-medium flex items-center justify-center"
                >
                  <FiMessageSquare className="mr-2" /> Join WhatsApp Group
                </a>
                <a
                  href="#how-it-works"
                  className="px-6 py-3 border border-gray-700 rounded-md hover:bg-gray-800/50 transition font-medium flex items-center justify-center"
                >
                  Learn How It Works
                </a>
              </div>
            </div>

            {/* Stats */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
              <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-emerald-500 transition hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-emerald-500/10 rounded-full mr-4">
                    <FiDollarSign className="text-emerald-400 text-xl" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">20%</p>
                    <p className="text-gray-400">Commission</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-emerald-500 transition hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-emerald-500/10 rounded-full mr-4">
                    <FiUsers className="text-emerald-400 text-xl" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">150+</p>
                    <p className="text-gray-400">Active Affiliates</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-emerald-500 transition hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-emerald-500/10 rounded-full mr-4">
                    <FiCheck className="text-emerald-400 text-xl" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">Instant</p>
                    <p className="text-gray-400">Payouts</p>
                  </div>
                </div>
              </div>
            </div> */}

            {/* How it works */}
            <section id="how-it-works" className=" justify-center mb-20">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">How Our Affiliate Program Works</h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-emerald-500 transition hover:-translate-y-1">
                  <div className="text-emerald-400 text-3xl mb-4">1</div>
                  <h3 className="text-xl font-medium mb-3">Sign Up</h3>
                  <p className="text-gray-400">
                    Join our affiliate program by registering through our WhatsApp group. Its completely free to join.
                  </p>
                </div>
                {/* <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-emerald-500 transition hover:-translate-y-1">
                  <div className="text-emerald-400 text-3xl mb-4">2</div>
                  <h3 className="text-xl font-medium mb-3">Share Your Link</h3>
                  <p className="text-gray-400">
                    Use your unique referral link to promote our services to your network.
                  </p>
                </div> */}
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-emerald-500 transition hover:-translate-y-1">
                  <div className="text-emerald-400 text-3xl mb-4">2</div>
                  <h3 className="text-xl font-medium mb-3">Earn Commissions</h3>
                  <p className="text-gray-400">
                    Getcommission for every successful referral that signs up for our services.
                  </p>
                </div>
              </div>
            </section>

            {/* Why join */}
            <section className="mb-20">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Why Join Our Affiliate Program?</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-emerald-500 transition hover:-translate-y-1">
                  <h3 className="text-xl font-medium mb-4 flex items-center">
                    <span className="bg-emerald-500/10 p-2 rounded-full mr-3">
                      <FiDollarSign className="text-emerald-400" />
                    </span>
                    High Commission Rates
                  </h3>
                  <p className="text-gray-400">
                    Earn 20% commission on every project you refer to us. For large projects, this can mean significant earnings.
                  </p>
                </div>
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-emerald-500 transition hover:-translate-y-1">
                  <h3 className="text-xl font-medium mb-4 flex items-center">
                    <span className="bg-emerald-500/10 p-2 rounded-full mr-3">
                      <FiCheck className="text-emerald-400" />
                    </span>
                    No Experience Needed
                  </h3>
                  <p className="text-gray-400">
                    You dont need to be a developer or designer to participate. Just share our services with potential clients.
                  </p>
                </div>
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-emerald-500 transition hover:-translate-y-1">
                  <h3 className="text-xl font-medium mb-4 flex items-center">
                    <span className="bg-emerald-500/10 p-2 rounded-full mr-3">
                      <FiUsers className="text-emerald-400" />
                    </span>
                    Supportive Community
                  </h3>
                  <p className="text-gray-400">
                    Join our exclusive WhatsApp group where we share marketing materials, tips, and answer your questions.
                  </p>
                </div>
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-emerald-500 transition hover:-translate-y-1">
                  <h3 className="text-xl font-medium mb-4 flex items-center">
                    <span className="bg-emerald-500/10 p-2 rounded-full mr-3">
                      <FiArrowRight className="text-emerald-400" />
                    </span>
                    Flexible Promotion
                  </h3>
                  <p className="text-gray-400">
                    Promote us through your website, social media, or personal network - whatever works best for you.
                  </p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-8 md:p-12 rounded-xl border border-emerald-500/20 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Earning?</h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Join our affiliate program today and start earning commissions by referring clients to our premium digital services.
              </p>
              <a
                href="https://chat.whatsapp.com/BlWf7L8Qe7QEgirkB8pNCr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md hover:opacity-90 transition font-medium"
              >
                Join WhatsApp Group Now
              </a>
            </section>

            {/* FAQ */}
            <section className="mt-20">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
              
              <div className="space-y-4 max-w-3xl mx-auto">
                {[
                  {
                    question: "How much can I earn as an affiliate?",
                    answer: "You earn 20% of the total project value for every client you refer who signs up for our services. For a $5,000 project, that's $1,000 in commission."
                  },
                  {
                    question: "How do I get paid?",
                    answer: "We pay commissions via bank transfer or digital wallets (OVO/Gopay) within 7 days after the client's payment is confirmed."
                  },
                  {
                    question: "Is there a cost to join?",
                    answer: "No, joining our affiliate program is completely free. We only ask that you actively promote our services to qualified leads."
                  },
                  {
                    question: "What services can I refer clients for?",
                    answer: "You can refer clients for any of our services including web development, mobile apps, UI/UX design, and digital marketing."
                  },
                  {
                    question: "How do I track my referrals?",
                    answer: "We provide you with a unique referral link and dashboard to track all your referrals and commissions."
                  }
                ].map((faq, index) => (
                  <div key={index} className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
                    <h3 className="text-lg font-medium mb-2 text-emerald-400">{faq.question}</h3>
                    <p className="text-gray-400">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <footer className="relative z-10 px-6 py-12 border-t border-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="flex items-center mb-4">
                  <Image 
                    src="/favicon.ico" 
                    alt="kacangpanjang.id logo"
                    width={24}
                    height={24}
                    className="mr-2"
                  />
                  <h4 className="text-lg font-medium">kacangpanjang.id</h4>
                </div>
                <p className="text-gray-400">
                  A digital studio specializing in web development, mobile apps, and digital solutions.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="/" className="hover:text-emerald-400 transition">Home</a></li>
                  <li><a href="/work" className="hover:text-emerald-400 transition">Our Work</a></li>
                  <li><a href="/#services" className="hover:text-emerald-400 transition">Services</a></li>
                  <li><a href="/#contact" className="hover:text-emerald-400 transition">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-4">Connect</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <a href="https://chat.whatsapp.com/BlWf7L8Qe7QEgirkB8pNCr" className="hover:text-emerald-400 transition">
                      WhatsApp Group
                    </a>
                  </li>
                  <li>
                    <a href="mailto:kacangpanjangstudio@gmail.com" className="hover:text-emerald-400 transition">
                      kacangpanjangstudio@gmail.com
                    </a>
                  </li>
                  <li>0822 9780 9530</li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">© 2025 kacangpanjang.id. All rights reserved.</p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-emerald-400 transition">Terms</a>
                <a href="#" className="text-gray-400 hover:text-emerald-400 transition">Privacy</a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float 6s ease-in-out 2s infinite;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        ::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #34d399;
        }
      `}</style>
    </>
  );
}