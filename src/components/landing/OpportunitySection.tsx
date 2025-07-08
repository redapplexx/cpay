import { StatCard } from "./StatCard";

export function OpportunitySection() {
  return (
    <section className="container mx-auto py-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <StatCard metric="$40B+" label="Philippine Domestic Remittance Market" />
        <StatCard metric="70%" label="Digitally Adopting Population" />
        <StatCard metric="$2.5B" label="Asia-PH Remittance Corridor" />
      </div>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-serif font-bold mb-4">The Archipelago, Digitized.</h2>
        <p className="text-lg text-slate-400">
          The Philippine financial landscape is at an inflection point. A massive, digitally-native population demands a platform that operates at the speed of their lives. CPay is built not just to serve this demand, but to architect its future.
        </p>
      </div>
    </section>
  );
} 