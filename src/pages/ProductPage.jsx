import { Zap, ShieldCheck, Eye, ScanFace, LayoutDashboard, ArrowRight, CloudRain, Thermometer, Wind, WifiOff, Radar, Compass } from "lucide-react";
import { selectLabel } from "../utils/i18n";
import { useSiteLanguage } from "../utils/siteLanguage";
import {
  MarketingPageShell,
  MarketingSection,
  SurfaceCard,
} from "@/components/ui/marketing-page-shell";

const situations = [
  { icon: <CloudRain className="w-6 h-6" />, trigger: { en: "Heavy Rain", hi: "तेज़ बारिश" }, issue: { en: "Orders drop and riders lose active earning hours", hi: "ऑर्डर कम हो जाते हैं और राइडर्स काम के घंटे खो देते हैं" }, response: { en: "GigShield detects the rain trigger and releases payout automatically.", hi: "GigShield बारिश को डिटेक्ट करता है और अपने आप भुगतान कर देता है।" } },
  { icon: <Thermometer className="w-6 h-6" />, trigger: { en: "Heatwave", hi: "लू / तेज़ गर्मी" }, issue: { en: "Unsafe working conditions reduce delivery efficiency", hi: "असुरक्षित काम करने की स्थिति डिलीवरी की क्षमता कम करती है" }, response: { en: "Riders receive support payout so income loss is reduced.", hi: "राइडर्स को सहायता भुगतान मिलता है जिससे आय का नुकसान कम होता है।" } },
  { icon: <Wind className="w-6 h-6" />, trigger: { en: "AQI Spike", hi: "खतरनाक AQI" }, issue: { en: "Pollution risk forces shorter shifts or slow movement", hi: "प्रदूषण का जोखिम कम शिफ्ट या धीमी गति को मजबूर करता है" }, response: { en: "Trigger payout protects daily earning consistency.", hi: "ट्रिगर भुगतान दैनिक कमाई की स्थिरता को बचाता है।" } },
  { icon: <WifiOff className="w-6 h-6" />, trigger: { en: "Platform Outage", hi: "प्लेटफ़ॉर्म डाउन" }, issue: { en: "Order flow stops even when riders are ready to work", hi: "राइडर्स तैयार होने पर भी ऑर्डर आना बंद हो जाता है" }, response: { en: "Outage trigger starts payout without claim paperwork.", hi: "आउटेज होने पर बिना कागजी कार्रवाई के भुगतान शुरू हो जाता है।" } },
];

const features = [
  { icon: <Zap className="w-5 h-5" />, title: { en: "Automatic Trigger Payouts", hi: "स्वचालित ट्रिगर भुगतान" }, detail: { en: "No manual claim process. If trigger conditions match, payout is calculated instantly.", hi: "कोई मैन्युअल क्लेम प्रक्रिया नहीं।" } },
  { icon: <ShieldCheck className="w-5 h-5" />, title: { en: "Weekly Protection Plans", hi: "साप्ताहिक सुरक्षा योजनाएं" }, detail: { en: "Basic, Standard, and Pro plans define weekly price, payout amount, coverage window, and daily cap.", hi: "बेसिक, स्टैंडर्ड, और प्रो योजनाएं साप्ताहिक कीमत, भुगतान और कवरेज तय करती हैं।" } },
  { icon: <Eye className="w-5 h-5" />, title: { en: "Fraud Guard Layer", hi: "धोखाधड़ी सुरक्षा परत" }, detail: { en: "Risk scoring detects suspicious behavior and can require verification before payout.", hi: "जोखिम स्कोरिंग संदिग्ध व्यवहार का पता लगाता है।" } },
  { icon: <ScanFace className="w-5 h-5" />, title: { en: "Selfie Verification Gate", hi: "सेल्फी सत्यापन द्वार" }, detail: { en: "High-risk sessions are verified through a random selfie gesture challenge.", hi: "उच्च-जोखिम सत्रों के लिए सेल्फी सत्यापन।" } },
  { icon: <LayoutDashboard className="w-5 h-5" />, title: { en: "Transparent Dashboard", hi: "पारदर्शी डैशबोर्ड" }, detail: { en: "Workers can see payouts, active plan, risk state, and premium history in one place.", hi: "सभी जानकारी एक ही जगह।" } },
  { icon: <Radar className="w-5 h-5" />, title: { en: "Income Radar + Shift Advisor", hi: "इनकम रडार + शिफ्ट एडवाइजर" }, detail: { en: "A hyperlocal AI layer predicts safer earning windows, dangerous zones, and when payout-ready protection matters most.", hi: "हाइपरलोकल AI सुरक्षित कमाई समय, जोखिम वाले ज़ोन और सही सुरक्षा समय बताता है।" } },
  { icon: <ArrowRight className="w-5 h-5" />, title: { en: "Income-Only Scope", hi: "केवल आय सुरक्षा" }, detail: { en: "Coverage is limited to loss of gig income from disruptions, not health, life, accidents, or vehicle repairs.", hi: "कवरेज केवल आय हानि के लिए है, स्वास्थ्य, जीवन, दुर्घटना या वाहन मरम्मत के लिए नहीं।" } },
];

const steps = [
  { en: "Choose your weekly plan", hi: "अपनी साप्ताहिक योजना चुनें", desc: { en: "Select Basic, Standard, or Pro based on your work hours and disruption risk.", hi: "काम के घंटों और व्यवधान जोखिम के आधार पर चुनें।" } },
  { en: "Keep weekly coverage active", hi: "साप्ताहिक कवरेज सक्रिय रखें", desc: { en: "When your weekly cover is active, trigger events are evaluated for payout eligibility.", hi: "साप्ताहिक कवरेज सक्रिय रहने पर ट्रिगर इवेंट मूल्यांकित होते हैं।" } },
  { en: "Trigger event occurs", hi: "ट्रिगर इवेंट होता है", desc: { en: "Rain, heat, AQI, or outage triggers are checked against your plan and daily cap.", hi: "बारिश, गर्मी, AQI या आउटेज की जाँच की जाती है।" } },
  { en: "Receive payout", hi: "भुगतान प्राप्त करें", desc: { en: "If rules match, payout is applied instantly. High-risk sessions may need selfie check.", hi: "नियम मिलते ही भुगतान तुरंत होता है।" } },
];

const solutionChecklist = [
  { title: "Optimized onboarding", detail: "Persona-based rider onboarding with city, work pattern, platform, rider proof, selected triggers, and weekly plan setup." },
  { title: "AI risk profiling", detail: "Dynamic disruption risk score based on rider persona, city conditions, trigger mix, and platform dependency." },
  { title: "Weekly policy creation", detail: "Basic, Standard, and Pro protection plans are priced weekly to match gig worker earning cycles." },
  { title: "Parametric claim automation", detail: "Weather, AQI, social disruption, and platform-outage signals trigger automatic loss-of-income payouts." },
  { title: "Fraud detection", detail: "Anomaly checks, activity validation, location checks, selfie verification, and duplicate-claim prevention guard payouts." },
  { title: "Analytics dashboard", detail: "Weekly support left, trigger confidence, payout history, predictive alerts, and trust metrics are shown in one workspace." },
];

function ProductPage() {
  const { languageMode } = useSiteLanguage();

  return (
    <MarketingPageShell
      eyebrow={selectLabel(languageMode, "Product Overview", "उत्पाद अवलोकन")}
      title={selectLabel(languageMode, "How GigShield works", "GigShield कैसे काम करता है")}
      highlight={selectLabel(languageMode, "for delivery workers.", "डिलीवरी वर्कर्स के लिए।")}
      description={selectLabel(languageMode, "GigShield protects gig worker earnings when real-world events interrupt delivery flow. It watches verified triggers, scores risk, and releases weekly-priced support payouts fast.", "GigShield गिग वर्कर्स की कमाई की सुरक्षा करता है, जोखिम स्कोर करता है और साप्ताहिक सुरक्षा भुगतान जारी करता है।")}
      primaryAction={{ to: "/get-protected", label: selectLabel(languageMode, "Get Protected", "सुरक्षा शुरू करें") }}
      secondaryAction={{ to: "/pricing", label: selectLabel(languageMode, "View Pricing", "कीमत देखें") }}
      stats={[
        { label: "Scope", value: "Income Loss", detail: "Only external-disruption income loss is covered." },
        { label: "Pricing", value: "Weekly", detail: "Designed for gig workers' earning and withdrawal rhythm." },
        { label: "Claims", value: "Zero-touch", detail: "Parametric triggers replace manual claim paperwork." },
        { label: "Trust", value: "AI + fraud guard", detail: "Risk scoring and verification keep payouts clean." },
      ]}
    >
      <MarketingSection title={selectLabel(languageMode, "Coverage boundary and deliverables", "कवरेज सीमा और डिलिवरेबल्स")} caption="Product clarity">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <SurfaceCard className="border-amber-300/20 bg-amber-300/10">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-200">Income-only scope</p>
            <p className="mt-4 text-base leading-7 text-amber-50/90">
              {selectLabel(languageMode, "GigShield only covers loss of delivery income from verified external disruptions. It does not cover health, life, accidents, or vehicle repair costs.", "GigShield केवल बाहरी व्यवधानों से हुई डिलीवरी आय हानि को कवर करता है। यह स्वास्थ्य, जीवन, दुर्घटना या वाहन मरम्मत लागत को कवर नहीं करता।")}
            </p>
          </SurfaceCard>
          <div className="grid gap-4 md:grid-cols-2">
            {solutionChecklist.map((item) => (
              <SurfaceCard key={item.title}>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-300">{item.detail}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "The standout intelligence layer", "सबसे अलग इंटेलिजेंस लेयर")} caption="Income Radar">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <SurfaceCard className="border-cyan-300/20 bg-cyan-300/10">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                <Radar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-200">Income Radar</p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  {selectLabel(languageMode, "GigShield predicts where the rider should work next.", "GigShield बताता है कि राइडर को अगली शिफ्ट कहां काम करना चाहिए।")}
                </h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-cyan-50/90">
              {selectLabel(languageMode, "Instead of acting like a normal insurance app, GigShield analyzes city micro-zones, predicted disruptions, and likely earning windows. It tells workers where to shift, when to leave risky pockets, and where payout-ready protection is most likely to matter.", "सिर्फ सामान्य इंश्योरेंस ऐप की तरह काम करने के बजाय, GigShield शहर के माइक्रो-ज़ोन, संभावित व्यवधान और कमाई के विंडो का विश्लेषण करता है। यह वर्कर को बताता है कि कहां शिफ्ट करनी है, कब जोखिम वाले क्षेत्र से निकलना है और कहां सुरक्षा सबसे उपयोगी होगी।")}
            </p>
          </SurfaceCard>

          <div className="grid gap-4">
            {[
              {
                icon: <Compass className="h-5 w-5" />,
                title: "Zone switching",
                detail: "Suggests safer micro-zones with stronger earning continuity.",
              },
              {
                icon: <CloudRain className="h-5 w-5" />,
                title: "Risk windows",
                detail: "Shows when rain, AQI, or outage risk is likely to drag income down.",
              },
              {
                icon: <ShieldCheck className="h-5 w-5" />,
                title: "Protection timing",
                detail: "Recommends when payout-ready coverage matters most for the next shift.",
              },
            ].map((item) => (
              <SurfaceCard key={item.title}>
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/8 text-cyan-300">{item.icon}</div>
                <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-300">{item.detail}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "How the worker journey flows", "वर्कर जर्नी कैसे चलती है")} caption="Flow">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((s, i) => (
            <SurfaceCard key={i}>
              <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-300 text-sm font-bold text-zinc-950">{i + 1}</div>
              <h3 className="mt-4 text-lg font-bold text-white">{selectLabel(languageMode, s.en, s.hi)}</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{selectLabel(languageMode, s.desc.en, s.desc.hi)}</p>
            </SurfaceCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Protection in real situations", "वास्तविक स्थितियों में सुरक्षा")} caption="Trigger examples">
        <div className="grid gap-4 md:grid-cols-2">
          {situations.map((s, i) => (
            <SurfaceCard key={i}>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-white/8 text-cyan-300">{s.icon}</div>
                <h3 className="text-lg font-bold text-white">{selectLabel(languageMode, s.trigger.en, s.trigger.hi)}</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-zinc-400">{selectLabel(languageMode, s.issue.en, s.issue.hi)}</p>
              <p className="mt-3 text-sm leading-7 text-zinc-200">{selectLabel(languageMode, s.response.en, s.response.hi)}</p>
            </SurfaceCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title={selectLabel(languageMode, "Key platform capabilities", "मुख्य क्षमताएं")} caption="Features">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((f, i) => (
            <SurfaceCard key={i}>
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/8 text-cyan-300">{f.icon}</div>
              <h3 className="mt-4 text-lg font-bold text-white">{selectLabel(languageMode, f.title.en, f.title.hi)}</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{selectLabel(languageMode, f.detail.en, f.detail.hi)}</p>
            </SurfaceCard>
          ))}
        </div>
      </MarketingSection>
    </MarketingPageShell>
  );
}

export default ProductPage;
