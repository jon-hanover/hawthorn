import { SEO } from "@/components/seo/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Linkedin } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
const About = () => {
  const [imgLoaded, setImgLoaded] = useState(false);
  return <>
      <SEO title="About | Hawthorn Education Strategies" description="Experience and services across ed-tech, foundations, and non-profits." path="/about" />
      <main className="container py-12">
        <article className="mx-auto max-w-4xl">
          <header className="mb-8">
            <h1 className="font-playfair text-3xl md:text-4xl font-semibold">About</h1>
            <p className="mt-3 text-muted-foreground max-w-none">In Celtic tradition the hawthorn tree was a liminal space between the real world and the magical.  Hawthorn Education Strategies helps you safely navigate the liminal spaces we find ourselves in today: between the deeply human-centered world of education and the magic of AI, between the ground you're standing on and your vision for the future. Let us help you reimagine education in the age of AI and scale innovations that make learning more human-centered than ever before.</p>
          </header>
          <div className="h-px bg-border my-6 md:my-8" aria-hidden="true" />

          <section className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 md:gap-10 items-start">
            <figure className="relative w-40 h-40 md:w-48 md:h-48 rounded-md overflow-hidden bg-background" aria-busy={!imgLoaded}>
              {!imgLoaded && <div className="absolute inset-0">
                  <Skeleton className="w-full h-full" />
                </div>}
              <picture>
                <source type="image/webp" srcSet="/lovable-uploads/ca8b4868-3043-42cf-a00a-6a84b9dbf63d-black.webp" />
                <img src="/lovable-uploads/ca8b4868-3043-42cf-a00a-6a84b9dbf63d-black.png" alt="Headshot of Jon Hanover, Managing Partner at Hawthorn Education Strategies" className="object-cover w-full h-full" loading="eager" decoding="async" fetchPriority="high" width={192} height={192} onLoad={() => setImgLoaded(true)} />
              </picture>
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/95 to-background/0 z-10 pointer-events-none" aria-hidden="true" />
              <figcaption className="absolute inset-x-0 bottom-0 z-20 px-3 pb-2">
                <p className="text-sm font-medium leading-tight">Jon Hanover</p>
                <p className="text-xs text-muted-foreground leading-tight">Managing Partner</p>
              </figcaption>
            </figure>
            <div className="space-y-4">
              <h2 className="font-playfair text-2xl md:text-3xl font-semibold">Jon Hanover</h2>
              <p className="leading-relaxed">Seasoned entrepreneur, educator, consultant and ed-tech executive with two decades of experience pushing the boundaries of what's possible in education</p>
              <p className="leading-relaxed text-muted-foreground">ex-Harvard, MIT, Bain, Charter School Growth Fund, Teach for America, HopSkipDrive</p>
              <div className="pt-1">
                <a href="https://linkedin.com/in/jhanover" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile" className="inline-flex items-center text-primary transition-opacity hover:opacity-90">
                  <Linkedin size={20} aria-hidden="true" />
                  <span className="sr-only">LinkedIn</span>
                </a>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="sr-only">Work focus areas</h2>
            <Tabs defaultValue="edtech">
              <TabsList>
                <TabsTrigger value="edtech">Ed‑Tech Companies</TabsTrigger>
                <TabsTrigger value="foundations">Foundations & Non‑Profits</TabsTrigger>
              </TabsList>
              <TabsContent value="edtech" className="pt-4">
                <div className="prose prose-invert max-w-none">
                  <p>Jon was a senior executive at HopSkipDrive from $3M to $200M+ ARR leading sales, marketing, operations, strategy and product teams, incl. being tapped as "intrepreneur" on the company's first AI product.  His ed-tech experience is supplemented by a deep understanding of the broader education ecosystem as a former teacher, funder, and school founder/executive.  Jon started his career as a strategy consultant at Bain & Company.  Ways he can help:</p>
                  <ul className="list-disc pl-6 mt-3 space-y-2">
                    <li>Growth/GTM strategy</li>
                    <li>Product Strategy</li>
                    <li>Fractional Chief Growth Officer</li>
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="foundations" className="pt-4">
                <div className="prose prose-invert max-w-none">
                  <p>Jon's education experience spans diverse corners of the ecosystem, first as funder (Charter School Growth Fund), then an educator (Teach for America), a charter school founder/leader (Roots), and most recently an ed-tech Executive (HopSkipDrive), where among other things, he was the "intrepreneur" leading the development of the company's first AI product.  He started his career as a strategy consultant at Bain & Company.  Ways he can help:</p>
                  <ul className="list-disc pl-6 mt-3 space-y-2">
                    <li>Strategic Planning</li>
                    <li>AI Transformation</li>
                    <li>High-Impact Projects</li>
                    <li>In-House Advisor for Grantees</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </article>
      </main>
    </>;
};
export default About;