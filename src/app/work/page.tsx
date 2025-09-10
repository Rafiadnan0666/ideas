'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { IPost } from '@/types/main.db';
import { FiArrowRight, FiExternalLink, FiGithub, FiSearch } from 'react-icons/fi';
import Head from 'next/head';

export default function WorksPage() {
  const [works, setWorks] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWorks, setFilteredWorks] = useState<IPost[]>([]);
  const [activeWork, setActiveWork] = useState<IPost | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('type', 'work')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setWorks(data || []);
        setFilteredWorks(data || []);
      } catch (error) {
        console.error('Error fetching works:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorks();
  }, [supabase]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredWorks(works);
      return;
    }

    const results = works.filter(work =>
      work.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      work.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredWorks(results);
  }, [searchQuery, works]);

  const getPreviewImage = (work: IPost) => {
    if (work.attachment) return work.attachment;
    if (work.link) return `https://image.thum.io/get/width/600/crop/600/allowJPG/wait/20/noanimate/${work.link}`;
    return `https://source.boringavatars.com/marble/300/${work.title}?colors=10b981,059669,047857,065f46,064e3b`;
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Our Works | kacangpanjang.id</title>
        <meta name="description" content="Explore our collection of innovative projects and creative solutions" />
        <meta property="og:title" content="Our Works | kacangpanjang.id" />
        <meta property="og:description" content="Explore our collection of innovative projects and creative solutions" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://kacangpanjang.id/works" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-80 h-80 bg-emerald-500/10 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full filter blur-3xl animate-blob"></div>
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

        <header  className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-12 py-3 md:py-4 border-b border-gray-800 text-sm backdrop-blur-lg bg-transparent"
  style={{ background: "rgba(16,16,16,0.7)" }}>
          <div className="flex items-center space-x-2">
            <img src="/favicon.ico" alt="Logo" className="h-6 w-6" />
            <h1 className="font-bold tracking-widest text-lg hover:text-emerald-400 transition-colors">
              <a href="/">kacangpanjang.id</a>
            </h1>
          </div>
          <nav className="hidden md:flex space-x-8 items-center">
            <a href="#about" className="hover:text-emerald-400 transition group">
              About
              <span className="block h-0.5 bg-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </a>
            <a href="/work" className="hover:text-emerald-400 transition group">
              Work
              <span className="block h-0.5 bg-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </a>
            <a href="#services" className="hover:text-emerald-400 transition group">
              Services
              <span className="block h-0.5 bg-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </a>
            <a href="#contact" className="hover:text-emerald-400 transition group">
              Contact
              <span className="block h-0.5 bg-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </a>
            <a 
              href="/affiliate" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md hover:scale-105 transition transform flex items-center"
            >
              Join Us <FiArrowRight className="ml-2" />
            </a>
          </nav>
          <button className="md:hidden px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md hover:scale-105 transition transform">
            Menu
          </button>
        </header>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                Our Works
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                Explore our collection of innovative projects and creative solutions
              </p>
            </div>

            {/* Search with gradient border */}
            <div className="flex justify-center w-full mb-12">
              <div className="relative w-full max-w-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 p-[1px] rounded-xl">
                <div className="relative w-full bg-[#0f0f0f] rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search works..."
                    className="block w-full pl-10 pr-3 py-3 bg-transparent border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Works Grid */}
            {filteredWorks.length === 0 ? (
              <div className="text-center py-16 relative z-10">
                <p className="text-gray-400 text-lg">
                  {searchQuery ? 'No matching works found' : 'No works added yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {filteredWorks.map((work) => (
                  <div 
                    key={work.id} 
                    className="group relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border border-gray-800 hover:border-transparent transition-all overflow-hidden cursor-pointer shadow-xl hover:shadow-emerald-500/20"
                    onClick={() => setActiveWork(work)}
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                    
                    {/* Work image */}
                    <div className="h-64 relative overflow-hidden">
                      <img 
                        src={getPreviewImage(work)} 
                        alt={work.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 relative z-20">
                      <h3 className="text-xl font-medium mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-400 group-hover:to-teal-400 transition-all">
                        {work.title}
                      </h3>
                      <p className="text-gray-300 mb-4 line-clamp-2">{work.content}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">
                          {new Date(work.created_at).toLocaleDateString()}
                        </span>
                        {work.link && (
                          <span className="text-xs bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-gray-300 px-2 py-1 rounded-full border border-gray-700">
                            {getDomainFromUrl(work.link)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Work Detail Modal */}
        {activeWork && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md"
            onClick={() => setActiveWork(null)}
          >
            <div 
              className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-emerald-500/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/80 transition z-50"
                onClick={() => setActiveWork(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Work image */}
              <div className="relative h-64 md:h-80">
                <img 
                  src={getPreviewImage(activeWork)} 
                  alt={activeWork.title}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              
              {/* Content */}
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                  <h3 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                    {activeWork.title}
                  </h3>
                  {activeWork.link && (
                    <a 
                      href={activeWork.link} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:opacity-90 transition font-medium flex items-center shadow-lg shadow-emerald-500/20"
                    >
                      Visit Site <FiExternalLink className="ml-2" />
                    </a>
                  )}
                </div>
                
                {/* Metadata grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] rounded-lg border border-gray-800">
                    <h5 className="text-sm text-gray-400 mb-1">Visibility</h5>
                    <p className="font-medium capitalize">{activeWork.visibility}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] rounded-lg border border-gray-800">
                    <h5 className="text-sm text-gray-400 mb-1">Created</h5>
                    <p className="font-medium">
                      {new Date(activeWork.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {activeWork.link && (
                    <div className="p-4 bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] rounded-lg border border-gray-800">
                      <h5 className="text-sm text-gray-400 mb-1">Domain</h5>
                      <a 
                        href={activeWork.link} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 hover:underline"
                      >
                        {getDomainFromUrl(activeWork.link)}
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Description */}
                <div className="mb-8">
                  <h5 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                    Description
                  </h5>
                  <p className="text-gray-300 whitespace-pre-line">
                    {activeWork.content}
                  </p>
                </div>
                
                {/* Close button */}
                <div className="flex justify-end">
                  <button 
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:opacity-90 transition font-medium shadow-lg shadow-emerald-500/20"
                    onClick={() => setActiveWork(null)}
                  >
                    Close Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add animation styles */}
        <style jsx global>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
        `}</style>
      </main>
    </>
  );
}