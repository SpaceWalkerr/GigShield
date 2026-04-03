import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Zap, ShieldCheck, Wallet, CloudRain, Wind, WifiOff, MapPinOff, Activity, ScanFace, Lock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";

export default function LandingPage() {
  const navigate = useNavigate();
  const { languageMode } = useSiteLanguage();
  const container = useRef();

  useEffect(() => {
    if (!container.current) return;
    
    let ctx = gsap.context(() => {
      // Ensure elements exist before animating
      const heroElements = document.querySelectorAll(".hero-text");
      const infoCards = document.querySelectorAll(".info-card");
      
      if (heroElements.length > 0) {
        gsap.from(".hero-text", { y: 50, opacity: 0, duration: 1, stagger: 0.2, ease: "power3.out", delay: 0.2 });
      }
      
      gsap.to(".floating-icon", { y: -8, yoyo: true, repeat: -1, duration: 2, ease: "sine.inOut" });
      
      if (document.querySelectorAll(".feature-text").length > 0) {
        gsap.from(".feature-text", { y: 30, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power2.out", delay: 0.8 });
      }
      
      if (infoCards.length > 0 && document.querySelector(".cards-container")) {
        gsap.from(".info-card", {
          scrollTrigger: { trigger: ".cards-container", start: "top 90%" },
          y: 50, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power2.out"
        });
      }
    }, container);
    return () => ctx.revert();
  }, []);


  return (
    <div ref={container} className="min-h-screen bg-[#f4f5f7] font-sans flex flex-col">
      {/* Hero section */}
      <div className="relative flex-1 flex flex-col min-h-[calc(100vh-36px)]">
        <img
          src="/rider.png"
          alt="Delivery Rider Minimal 3D"
          className="absolute inset-0 h-full w-full object-cover opacity-30 z-0 mix-blend-multiply blur-sm"
        />

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-1 flex-col">
          {/* Main Content Area */}
          <div className="pointer-events-none flex flex-1 flex-col items-center justify-center py-12 px-4 md:py-20 flex-shrink-0">
            <div className="pointer-events-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
              <span className="mb-6 flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-gray-800 shadow-sm backdrop-blur-md">
                <Zap size={14} className="text-gray-400" />
                {selectLabel(languageMode, "Parametric Income Insurance", "पैरामेट्रिक आय बीमा")}
                <Zap size={14} className="text-gray-400" />
              </span>
              <div className="flex flex-col items-center space-y-2 md:space-y-0 relative">
                <div className="absolute -left-16 top-[-20px] md:-left-28 md:-top-10 hidden sm:block hero-text">
                  <img src="/shield.png" alt="" className="floating-icon h-16 w-16 md:h-32 md:w-32 object-contain mix-blend-multiply opacity-70" />
                </div>
                <h1 className="hero-text text-5xl font-medium leading-none tracking-tight text-gray-800 md:text-7xl lg:text-[5.5rem] drop-shadow-md">
                   {selectLabel(languageMode, "Protect income.", "आय सुरक्षित रखें।")}
                </h1>
                <h1 className="hero-text text-5xl font-extrabold leading-none tracking-tight text-[#1a2229] md:text-7xl lg:text-[5.5rem] drop-shadow-md">
                   {selectLabel(languageMode, "Ride through every disruption.", "हर व्यवधान के बीच।")}
                </h1>
                <div className="absolute -right-16 bottom-[0px] md:-right-24 md:bottom-2 hidden sm:block hero-text">
                  <img src="/lightning.png" alt="" className="floating-icon h-12 w-12 md:h-24 md:w-24 object-contain mix-blend-multiply opacity-70" />
                </div>
              </div>
              <p className="hero-text mb-8 mt-8 max-w-3xl text-sm md:text-xl text-gray-900 bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/40 font-medium leading-relaxed">
                {selectLabel(
                  languageMode,
                  "GigShield protects delivery workers across Zomato and Swiggy with automatic payouts triggered by environmental and platform events.",
                  "GigShield Zomato और Swiggy जैसे प्लेटफॉर्म पर काम करने वाले डिलीवरी वर्कर्स की सुरक्षा करता है और पर्यावरण/प्लेटफॉर्म इवेंट पर स्वतः भुगतान देता है।"
                )}
              </p>
              
              <div className="hero-text flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/get-protected")}
                  className="rounded-full bg-[#1a2229] px-8 py-3.5 text-lg font-semibold text-white shadow-xl transition-all hover:bg-gray-800 hover:-translate-y-1"
                >
                  {selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें")}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/signin")}
                  className="rounded-full bg-white/90 px-8 py-3.5 text-lg font-semibold text-gray-900 shadow-xl transition-all hover:bg-white hover:-translate-y-1 border border-gray-200 backdrop-blur-md"
                >
                  {selectLabel(languageMode, "Sign In", "साइन इन")}
                </button>
              </div>

              {/* About Section - Integrated Triggers & Fraud Guard */}
              <div id="about-section" className="mt-32 w-full max-w-7xl mx-auto space-y-32 pointer-events-auto">
                {/* Section Header */}
                <div className="text-center space-y-6 max-w-3xl mx-auto mb-20 bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-lg">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
                    {selectLabel(languageMode, "How it Works", "यह कैसे काम करता है")}
                  </span>
                  <h2 className="hero-text text-5xl md:text-6xl font-black text-gray-900 leading-[1.1] tracking-tightest">
                    {selectLabel(languageMode, "Built for transparency.", "पारदर्शिता के लिए निर्मित।")}<br />
                    <span className="text-gray-400 italic font-medium">{selectLabel(languageMode, "Backed by tech.", "तकनीक द्वारा समर्थित।")}</span>
                  </h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-20 items-stretch text-left">
                  {/* Left Column: Triggers */}
                  <div className="flex flex-col h-full space-y-12 bg-white/60 backdrop-blur-xl rounded-[3rem] p-10 border border-white/60 shadow-xl">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                        <Zap className="w-8 h-8" />
                      </div>
                      <h3 className="text-3xl font-black text-gray-900">{selectLabel(languageMode, "The Trigger Engine", "ट्रिगर इंजन")}</h3>
                      <p className="text-gray-500 font-medium leading-relaxed">
                        {selectLabel(
                          languageMode,
                          "Our system monitors environmental and platform signals in real-time. Payouts are issued automatically when verified conditions are met—no manual claims needed.",
                          "हमारा सिस्टम रियल-टाइम में पर्यावरण और प्लेटफ़ॉर्म संकेतों की निगरानी करता है। शर्तें पूरी होने पर भुगतान स्वतः किया जाता है।"
                        )}
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      {[
                        { icon: <CloudRain className="w-5 h-5" />, title: selectLabel(languageMode, "Weather Data", "मौसम डेटा"), desc: selectLabel(languageMode, "Heavy rain and heatwave alerts.", "भारी बारिश और लू के अलर्ट।") },
                        { icon: <Wind className="w-5 h-5" />, title: selectLabel(languageMode, "AQI Monitoring", "AQI निगरानी"), desc: selectLabel(languageMode, "Safe work limits for air quality.", "वायु गुणवत्ता के लिए सुरक्षित सीमा।") },
                        { icon: <WifiOff className="w-5 h-5" />, title: selectLabel(languageMode, "Platform Outages", "प्लेटफ़ॉर्म आउटेज"), desc: selectLabel(languageMode, "Zero earnings during app downtime.", "ऐप डाउनटाइम के दौरान सुरक्षा।") },
                        { icon: <MapPinOff className="w-5 h-5" />, title: selectLabel(languageMode, "Zone Closures", "ज़ोन बंदी"), desc: selectLabel(languageMode, "Pickups blocked by local strikes.", "स्थानीय हड़ताल या बंदी।") },
                      ].map((item, i) => (
                        <div key={i} className="p-6 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:translate-y-[-4px] transition-all group">
                          <div className="w-10 h-10 bg-[#f4f5f7] rounded-xl flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors mb-4">
                            {item.icon}
                          </div>
                          <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                          <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Fraud Guard */}
                  <div className="flex flex-col h-full space-y-12 bg-gray-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]" />
                    
                    <div className="space-y-4 relative z-10">
                      <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white border border-white/10 shadow-xl">
                        <Lock className="w-8 h-8" />
                      </div>
                      <h3 className="text-3xl font-black text-white">{selectLabel(languageMode, "Fraud Guard Protection", "फ्रॉड गार्ड सुरक्षा")}</h3>
                      <p className="text-gray-400 font-medium leading-relaxed">
                        {selectLabel(
                          languageMode,
                          "GigShield establishes trust using risk scoring and verification gates. This ensures that only genuine delivery workers receive payouts during verified disruptions.",
                          "GigShield जोखिम स्कोरिंग और सत्यापन गेट का उपयोग करके भरोसा बनाता है। यह सुनिश्चित करता है कि केवल असली वर्कर्स को ही भुगतान मिले।"
                        )}
                      </p>
                    </div>

                    <div className="space-y-4 relative z-10">
                      {[
                        { icon: <Activity className="w-5 h-5" />, text: selectLabel(languageMode, "Continuous behavior risk scoring", "लगातार व्यवहार जोखिम स्कोरिंग") },
                        { icon: <ScanFace className="w-5 h-5" />, text: selectLabel(languageMode, "Selfie-based identity verification gates", "सेल्फी-आधारित पहचान सत्यापन गेट") },
                        { icon: <CheckCircle2 className="w-5 h-5" />, text: selectLabel(languageMode, "Transparent payout decision history", "पारदर्शी भुगतान निर्णय इतिहास") },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 shadow-sm hover:bg-white/10 transition-colors cursor-default">
                          <div className="text-blue-400">{item.icon}</div>
                          <p className="text-sm font-bold text-gray-200">{item.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 text-gray-900 relative z-10">
                      <h4 className="text-xl font-black mb-2">{selectLabel(languageMode, "Unmatched Trust", "अतुलनीय भरोसा")}</h4>
                      <p className="text-gray-500 text-xs font-bold leading-relaxed">
                        {selectLabel(
                          languageMode,
                          "Our multi-layer verification process reduces fraud by 98% while ensuring 100% payout speed for honest riders.",
                          "हमारी बहु-स्तरीय सत्यापन प्रक्रिया धोखाधड़ी को 98% तक कम करती है और असली राइडर्स को तेज़ भुगतान सुनिश्चित करती है।"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional GigShield Info Section */}
              <div className="mt-16 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left pointer-events-auto bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-lg">
                 <div className="feature-text">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0 shadow-sm border border-gray-100">
                      <Zap className="h-5 w-5 text-gray-700" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg md:text-xl tracking-tight">
                       {selectLabel(languageMode, "Zero Paperwork", "शून्य कागजी कार्रवाई")}
                    </h3>
                    <p className="text-gray-700 mt-2 text-sm leading-relaxed font-medium">
                       {selectLabel(languageMode, "No claims to file. Once weather or platform metrics hit the limit, money goes straight to your wallet.", "कोइ क्लेम दर्ज करने की जरूरत नहीं। मानक पूरे होते ही पैसा सीधे आपके वॉलेट में।")}
                    </p>
                 </div>
                 <div className="feature-text">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0 shadow-sm border border-gray-100">
                      <ShieldCheck className="h-5 w-5 text-gray-700" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg md:text-xl tracking-tight">
                       {selectLabel(languageMode, "Full Coverage", "पूर्ण कवरेज")}
                    </h3>
                    <p className="text-gray-700 mt-2 text-sm leading-relaxed font-medium">
                       {selectLabel(languageMode, "Protect your daily goals against App Outages, unrideable AQI, floods, and severe heatwaves.", "ऐप आउटेज, खराब AQI, बाढ़ और भयंकर लू के दौरान अपने दैनिक लक्ष्यों को सुरक्षित रखें।")}
                    </p>
                 </div>
                 <div className="feature-text">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0 shadow-sm border border-gray-100">
                      <Wallet className="h-5 w-5 text-gray-700" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg md:text-xl tracking-tight">
                       {selectLabel(languageMode, "Guaranteed Income", "सुरक्षित आय")}
                    </h3>
                    <p className="text-gray-700 mt-2 text-sm leading-relaxed font-medium">
                       {selectLabel(languageMode, "Maintain financial stability and ride with peace of mind knowing GigShield has your back every day.", "वित्तीय स्थिरता बनाए रखें और निर्बाध रूप से राइड करें, GigShield हमेशा आपके साथ है।")}
                    </p>
                 </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Info Cards */}
          <div className="w-full bg-gradient-to-t from-[#f4f5f7]/95 via-[#f4f5f7]/80 to-transparent pt-24 pb-12 z-10 px-4 md:px-8 mt-auto pointer-events-auto flex-none">
             <div className="cards-container mx-auto max-w-7xl">
                <div className="grid gap-4 sm:gap-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <article className="info-card rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/90">
                    <img src="/lightning.png" alt="" className="floating-icon h-10 w-10 md:h-14 md:w-14 object-contain mb-4 drop-shadow-sm mix-blend-multiply" />
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">{selectLabel(languageMode, "Trigger Engine", "ट्रिगर इंजन")}</p>
                    <p className="mt-3 font-semibold text-gray-900 text-sm md:text-base leading-snug">
                       {selectLabel(languageMode, "Heavy Rain, Heatwave, AQI Spike, Outage", "तेज बारिश, लू, AQI बढ़ना, आउटेज")}
                    </p>
                  </article>
                  <article className="info-card rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/90">
                    <img src="/ai.png" alt="" className="floating-icon h-10 w-10 md:h-14 md:w-14 object-contain mb-4 drop-shadow-sm mix-blend-multiply" />
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">{selectLabel(languageMode, "Decisioning", "निर्णय प्रणाली")}</p>
                    <p className="mt-3 font-semibold text-gray-900 text-sm md:text-base leading-snug">
                       {selectLabel(languageMode, "AI signal fusion & payout thresholds", "AI संकेत संयोजन और भुगतान सीमा")}
                    </p>
                  </article>
                  <article className="info-card rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/90">
                    <img src="/lock.png" alt="" className="floating-icon h-10 w-10 md:h-14 md:w-14 object-contain mb-4 drop-shadow-sm mix-blend-multiply" />
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">{selectLabel(languageMode, "Fraud Control", "फ्रॉड नियंत्रण")}</p>
                    <p className="mt-3 font-semibold text-gray-900 text-sm md:text-base leading-snug">
                       {selectLabel(languageMode, "Risk scoring with verification gates", "सत्यापन गेट के साथ जोखिम स्कोरिंग")}
                    </p>
                  </article>
                  <article className="info-card rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/90">
                    <img src="/shield.png" alt="" className="floating-icon h-10 w-10 md:h-14 md:w-14 object-contain mb-4 drop-shadow-sm mix-blend-multiply" />
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">{selectLabel(languageMode, "Demo Promise", "डेमो वादा")}</p>
                    <p className="mt-3 font-semibold text-gray-900 text-sm md:text-base leading-snug">
                       {selectLabel(languageMode, "End-to-end flow in under 2 minutes", "2 मिनट से कम में पूरा एंड-टू-एंड फ्लो")}
                    </p>
                  </article>
                </div>
             </div>
          </div>

          <div className="w-full pb-8 flex justify-center z-10 pointer-events-auto">
             <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors bg-white/50 backdrop-blur-sm px-6 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md"
             >
                <ArrowUp className="w-4 h-4" />
                {selectLabel(languageMode, "Back to Top", "शीर्ष पर वापस जाएं")}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
