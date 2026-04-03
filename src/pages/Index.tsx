import Hero from "@/components/Hero";
import IntroSection from "@/components/IntroSection";
import TopicCard from "@/components/TopicCard";
import LiveStats from "@/components/LiveStats";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import { topics } from "@/data/topics";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Floating theme toggle on landing page */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Hero />
      <IntroSection />

      <section className="py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          {topics.map((t, i) => (
            <TopicCard
              key={t.topic}
              topic={t.topic}
              tagType={t.tagType}
              leftView={t.leftView}
              rightView={t.rightView}
              mitteView={t.mitteView}
              index={i}
            />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
