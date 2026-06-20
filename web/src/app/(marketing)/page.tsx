import type { Metadata } from 'next'
import Navbar from '@/components/marketing/Navbar'
import Hero from '@/components/marketing/Hero'
import AudienceSection from '@/components/marketing/AudienceSection'
import ProblemSolution from '@/components/marketing/ProblemSolution'
import HowItWorks from '@/components/marketing/HowItWorks'
import FeaturesGrid from '@/components/marketing/FeaturesGrid'
import MobileSection from '@/components/marketing/MobileSection'
import ComparisonSection from '@/components/marketing/ComparisonSection'
import PricingSection from '@/components/marketing/PricingSection'
import FAQSection from '@/components/marketing/FAQSection'
import FinalCTA from '@/components/marketing/FinalCTA'
import Footer from '@/components/marketing/Footer'

export const metadata: Metadata = {
  title: 'Servis Ponuda — Ponude i fakture za majstore i servisne firme',
  description:
    'Napravi profesionalnu ponudu za 2 minuta. Pošalji klijentu linkom, prati status, pretvori u fakturu. Alat za električare, vodoinstalateri, klima servise i sve majstore.',
  openGraph: {
    title: 'Servis Ponuda — Ponude i fakture za majstore',
    description: 'Profesionalne ponude i fakture za servisere i zanatlije. Radi sa telefona.',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <div className="bg-white">
      <Navbar />
      <Hero />
      <AudienceSection />
      <ProblemSolution />
      <HowItWorks />
      <FeaturesGrid />
      <MobileSection />
      <ComparisonSection />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  )
}
