import { SEO, orgJsonLd } from "@/components/seo/SEO";
import { Particles } from "@/components/particles/Particles";
import { Button } from "@/components/ui/button";
import { Typewriter } from "@/components/Typewriter";
import { Link } from "react-router-dom";
const Index = () => {
  return (
    <>
      <SEO
        title="Hawthorn Education Strategies | AI Education Consulting"
        description="Helping amazing educators and entrepreneurs reimagine education in the age of AI and scale innovations that make learning more human-centered than ever before."
        path="/"
        jsonLd={orgJsonLd}
      />
      <Particles />
      <main className="min-h-[calc(100vh-3.5rem)] grid place-items-center bg-background">
        <section className="text-center px-6">
          <h1 className="mb-4">
            <img
              src="/lovable-uploads/new_hawthorn_logo_full.png"
              alt="Hawthorn Education"
              className="h-20 md:h-28 w-auto mx-auto"
            />
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            <Typewriter
              phrases={[
                "Reimagine learning for the Age of AI.",
                "Scale innovations that help all learners thrive.",
                "Deploy AI to make the future more human than before.",
                "Accelerate growth with deeply integrated GTM and product strategies.",
              ]}
              deletingSpeed={16}
              pauseAfterDeleting={220}
            />
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild>
              <Link to="/contact">Get in touch</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/about" aria-label="Learn more about Hawthorn">
                Learn more
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
};
export default Index;
