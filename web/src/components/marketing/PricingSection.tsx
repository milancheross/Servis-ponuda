import Link from 'next/link'

const PLANS = [
  {
    name: 'Starter',
    price: 'Besplatno',
    period: 'zauvek',
    desc: 'Za solo majstore koji počinju.',
    highlight: false,
    features: [
      'Do 10 klijenata',
      'Do 20 ponuda mesečno',
      'Cenovnik (do 30 stavki)',
      'Javni link za klijenta',
      'PDF export',
      'Osnovna statistika',
    ],
    cta: 'Počni besplatno',
    ctaHref: '/register',
  },
  {
    name: 'Pro',
    price: '990 RSD',
    period: 'mesečno',
    desc: 'Za aktivne majstore i servisne firme.',
    highlight: true,
    features: [
      'Neograničen broj klijenata',
      'Neograničen broj ponuda',
      'Neograničen cenovnik',
      'Fakture iz ponuda',
      'PDF export (ponude i fakture)',
      'Dashboard i statistike',
      'Prioritetna podrška',
    ],
    cta: 'Isprobaj 14 dana besplatno',
    ctaHref: '/register',
  },
]

export default function PricingSection() {
  return (
    <section id="cene" className="py-16 md:py-24 bg-slate-50 px-4 scroll-mt-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Jednostavne cene</h2>
          <p className="text-gray-600 text-lg">
            Bez skrivenih troškova, bez ugovora, bez iznenađenja.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 flex flex-col ${
                plan.highlight
                  ? 'bg-[#1e3a8a] text-white shadow-xl'
                  : 'bg-white border-2 border-gray-200 text-gray-900'
              }`}
            >
              {plan.highlight && (
                <div className="inline-block bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 self-start">
                  Najpopularniji
                </div>
              )}
              <div className="mb-1 font-bold text-xl">{plan.name}</div>
              <div className={`mb-1 ${ plan.highlight ? 'text-blue-200' : 'text-gray-500'} text-sm`}>{plan.desc}</div>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={`text-sm ml-1 ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>/ {plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <span className={plan.highlight ? 'text-blue-300' : 'text-green-500'}>✓</span>
                    <span className={plan.highlight ? 'text-blue-100' : 'text-gray-700'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.ctaHref}
                className={`block text-center py-3.5 rounded-xl font-bold text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-white text-[#1e3a8a] hover:bg-blue-50'
                    : 'bg-[#1e3a8a] text-white hover:bg-blue-900'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Cene su u srpskim dinarima i bez PDV-a. Otkaži u bilo kom trenutku.
        </p>
      </div>
    </section>
  )
}
