'use client';

import { Bot, CheckCircle, Code2, Zap } from 'lucide-react';

export function LandingFeatures() {
  const features = [
    {
      icon: <Bot className="w-5 h-5 text-cyan-500" />,
      title: "No More Single-AI Bias",
      desc: "Get multiple perspectives instead of one limited opinion. Let AI models debate to refine the final answer."
    },
    {
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      title: "Super Convenient",
      desc: "No need to jump between ChatGPT, Claude, Gemini, etc. Connect them all in a single interface."
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-cyan-500" />,
      title: "Ready-To-Use Reports",
      desc: "No messy chat history. Everything is automatically organized into professional, structured reports."
    },
    {
      icon: <Code2 className="w-5 h-5 text-purple-500" />,
      title: "Empowering Your Decisions",
      desc: "Perfect for making better work decisions, solving daily dilemmas, and exploring topics deeply."
    }
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-cyan-50/20 to-white border-t border-gray-100">
      
      {/* Subtle Grid and Gradient Nodes overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M60 0L0 0 0 60\' stroke=\'%23000\' stroke-width=\'1\' fill=\'none\'/%3E%3C/svg%3E")', backgroundSize: '60px 60px' }}>
      </div>

      {/* Decorative gradient corner flashes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20 relative">
          <div className="absolute left-1/2 -top-6 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full opacity-60"></div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Why LLM Conclave?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
            A radical upgrade to your interaction workflow, engineered specifically for rigorous problem-solving.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, i) => (
            <div 
              key={i} 
              className="relative p-8 rounded-2xl bg-white border border-gray-100 hover:border-cyan-200 transition-all duration-500 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(34,211,238,0.1)] flex flex-col group overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-50 to-purple-50 border border-cyan-100/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-md shadow-cyan-100 transition-all duration-300">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-600 group-hover:to-purple-600 transition-all">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
