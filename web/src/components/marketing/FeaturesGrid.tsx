const FEATURES = [
  {
    icon: '👥',
    title: 'Klijenti',
    desc: 'Baza klijenata sa kontaktima, adresama i istorijom svih ponuda. Brza pretraga i evidencija kontakata.',
  },
  {
    icon: '📊',
    title: 'Cenovnik',
    desc: 'Sačuvaj usluge i materijale sa cenama. Grupiši po kategorijama: rad, materijal, ostalo. Koristiš ih u svakoj ponudi.',
  },
  {
    icon: '📋',
    title: 'Ponude',
    desc: 'Trostepeni kreator ponude: izaberi klijenta, dodaj stavke, pregled i slanje. Automatski broj ponude.',
  },
  {
    icon: '🔗',
    title: 'Javni link za klijenta',
    desc: 'Klijent dobija personalizovani link na kome vidi ponudu, može da je prihvati ili odbije i potpise digitalno.',
  },
  {
    icon: '💰',
    title: 'Fakture',
    desc: 'Prihvaćena ponuda postaje faktura jednim klikom. Prati status plaćanja i generiši PDF fakture.',
  },
  {
    icon: '📈',
    title: 'Dashboard',
    desc: 'Pregled broja klijenata, ponuda ovog meseca, neplaćenih faktura i ukupnog iznosa koji čeka naplatu.',
  },
  {
    icon: '📄',
    title: 'PDF export',
    desc: 'Svaka ponuda i faktura može se preuzeti kao profesionalni PDF sa logom firme, stavkama i totalom.',
  },
  {
    icon: '📱',
    title: 'Mobilno',
    desc: 'Sve funkcionise sa telefona. Kreiras ponudu sa terena, iz komija ili sa klijentove lokacije.',
  },
]

export default function FeaturesGrid() {
  return (
    <section id="funkcionalnosti" className="py-16 md:py-24 bg-slate-50 px-4 scroll-mt-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sve što ti treba, ništa što ne trebaš
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Praktičan alat bez nepotrebnih komplikacija.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
