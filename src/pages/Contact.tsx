import { useEffect, useRef, useState } from "react";
import { Linkedin } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// The Worker in worker/contact verifies Turnstile and saves the message to Airtable.
const CONTACT_ENDPOINT = "https://hawthorn-contact.jon-799.workers.dev";
// Turnstile site keys are public. In local dev, use Cloudflare's always-pass test key.
const TURNSTILE_SITE_KEY = import.meta.env.DEV
  ? "1x00000000000000000000AA"
  : "0x4AAAAAAFisbMxghzDKhUkc";
const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileLoader: Promise<TurnstileApi> | null = null;
const loadTurnstile = () => {
  turnstileLoader ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile missing")));
    script.onerror = () => {
      turnstileLoader = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return turnstileLoader;
};

type Status = "idle" | "sending" | "sent" | "error";

const Contact = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const widgetEl = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef("");
  const tokenWaiters = useRef<((t: string) => void)[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !widgetEl.current) return;
        widgetId.current = turnstile.render(widgetEl.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "dark",
          appearance: "interaction-only",
          callback: (t: string) => {
            token.current = t;
            tokenWaiters.current.splice(0).forEach((resolve) => resolve(t));
          },
          "expired-callback": () => {
            token.current = "";
          },
          "error-callback": () => {
            token.current = "";
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          setError("The spam check didn't load. Please refresh the page and try again.");
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  // The check usually finishes before anyone hits Send. If not, wait briefly for it.
  const getToken = () =>
    token.current
      ? Promise.resolve(token.current)
      : new Promise<string>((resolve) => {
          tokenWaiters.current.push(resolve);
          setTimeout(() => resolve(token.current), 15000);
        });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setStatus("sending");
    setError("");

    try {
      const t = await getToken();
      if (!t) throw new Error("We couldn't confirm you're human. Please try again.");
      const res = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token: t }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) throw new Error(body.error || "Something went wrong sending your message.");
      form.reset();
      setStatus("sent");
    } catch (err) {
      // fetch() throws a TypeError when the network fails; its wording varies by browser.
      const message = err instanceof Error && !(err instanceof TypeError)
        ? err.message
        : "Something went wrong sending your message.";
      setError(`${message} You can also reach Jon on LinkedIn.`);
      setStatus("error");
      // Each Turnstile token works once, so get a fresh one for the retry.
      token.current = "";
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    }
  };

  return (
    <>
      <SEO
        title="Contact | Hawthorn Education Strategies"
        description="Get in touch with Hawthorn Education Strategies about AI strategy, product, and growth for education organizations."
        path="/contact"
      />
      <main className="container py-12">
        <article className="mx-auto max-w-2xl">
          <header className="mb-8">
            <h1 className="font-playfair text-3xl md:text-4xl font-semibold">Get in touch</h1>
            <p className="mt-3 text-muted-foreground">
              Tell us a bit about what you're working on and we'll get back to you.
            </p>
          </header>

          {status === "sent" ? (
            <section role="status" className="rounded-md border p-6">
              <h2 className="font-playfair text-2xl font-semibold">Thank you</h2>
              <p className="mt-2 text-muted-foreground">Your message is on its way. We'll be in touch soon.</p>
            </section>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" autoComplete="name" required maxLength={200} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">
                  Organization <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="organization" name="organization" autoComplete="organization" maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" required maxLength={5000} rows={6} className="text-base md:text-sm" />
              </div>

              {/* Honeypot: hidden from people and screen readers, tempting to bots. */}
              <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
                <label htmlFor="website">Website</label>
                <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <div ref={widgetEl} />

              {status === "error" && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <Button type="submit" disabled={status === "sending"}>
                  {status === "sending" ? "Sending..." : "Send message"}
                </Button>
                <a
                  href="https://www.linkedin.com/in/jhanover/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Linkedin size={16} aria-hidden="true" />
                  Or connect on LinkedIn
                </a>
              </div>
            </form>
          )}
        </article>
      </main>
    </>
  );
};
export default Contact;
