'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'Da li klijent mora da ima nalog?',
    a: 'Ne. Klijentu šalješ link, on otvara ponudu u browseru bez registracije i može da je prihvati ili odbije.',
  },
  {
    q: 'Da li mogu da koristim aplikaciju sa telefona?',
    a: 'Da, u potpunosti. Servis Ponuda je dizajnirana da radi na mobilnom uređaju — kreiranje ponuda, pregled klijenata, slanje, sve.',
  },
  {
    q: 'Mogu li da napravim fakturu iz ponude?',
    a: 'Da. Čim klijent prihvati ponudu, jednim klikom kreiras fakturu sa svim istim stavkama. Nema ponovnog unošenja.',
  },
  {
    q: 'Mogu li da sačuvam cenovnik sa uslugama?',
    a: 'Da. Svaki korisnik ima sopstveni cenovnik gde čuvaš usluge i materijale sa cenama, grupisane po kategorijama.',
  },
  {
    q: 'Da li svaki korisnik vidi samo svoje podatke?',
    a: 'Da. Svi podaci su vezani za tvoj nalog. Niko drugi nema pristup tvojim klijentima, ponudama ni fakturama.',
  },
  {
    q: 'Da li klijent može da prihvati ili odbije ponudu online?',
    a: 'Da. Klijent dobija personalizovani link, vidi ponudu, i može da je prihvati sa digitalnim potpisom ili odbije — sve bez papira.',
  },
  {
    q: 'Mogu li da exportujem ponudu ili fakturu kao PDF?',
    a: 'Da. Svaka ponuda i faktura može se preuzeti kao profesionalni PDF dokument sa svim podacima.',
  },
  {
    q: 'Šta ako prestane da mi treba aplikacija?',
    a: 'Otkaži u bilo kom trenutku, bez ugovora i bez penala. Starter plan je besplatno zauvek.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-semibold text-gray-900">{q}</span>
        <span className={`text-[#1e3a8a] text-xl shrink-0 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <p className="text-gray-600 pb-5 leading-relaxed">{a}</p>
      )}
    </div>
  )
}

export default function FAQSection() {
  return (
    <section id="faq" className="py-16 md:py-24 bg-white px-4 scroll-mt-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Česta pitanja</h2>
          <p className="text-gray-600 text-lg">Sve što možda nisi siguran pre nego što počneš.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 px-6 divide-y divide-gray-100">
          {FAQS.map(faq => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  )
}
