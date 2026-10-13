import { useEffect, useState } from "react";

type TypewriterProps = {
  phrases: string[];
  typingSpeed?: number; // ms per character when typing
  deletingSpeed?: number; // ms per character when deleting
  pauseAfterTyping?: number; // ms to pause after finishing a phrase
  pauseAfterDeleting?: number; // ms to pause before typing next phrase
  className?: string;
};

export const Typewriter = ({
  phrases,
  typingSpeed = 60,
  deletingSpeed = 40,
  pauseAfterTyping = 1200,
  pauseAfterDeleting = 400,
  className,
}: TypewriterProps) => {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!phrases.length) return;

    const current = phrases[phraseIndex % phrases.length];
    let timeout = typingSpeed;

    // Typing characters
    if (!isDeleting && text.length < current.length) {
      timeout = typingSpeed;
      const id = window.setTimeout(() => {
        setText(current.slice(0, text.length + 1));
      }, timeout);
      return () => window.clearTimeout(id);
    }

    // Pause at full phrase, then start deleting
    if (!isDeleting && text.length === current.length) {
      const id = window.setTimeout(() => setIsDeleting(true), pauseAfterTyping);
      return () => window.clearTimeout(id);
    }

    // Deleting characters
    if (isDeleting && text.length > 0) {
      timeout = deletingSpeed;
      const id = window.setTimeout(() => {
        setText(current.slice(0, text.length - 1));
      }, timeout);
      return () => window.clearTimeout(id);
    }

    // When fully deleted, move to next phrase and start typing again
    if (isDeleting && text.length === 0) {
      const id = window.setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((i) => (i + 1) % phrases.length);
      }, pauseAfterDeleting);
      return () => window.clearTimeout(id);
    }
  }, [phrases, phraseIndex, text, isDeleting, typingSpeed, deletingSpeed, pauseAfterTyping, pauseAfterDeleting]);

  return (
    <span aria-live="polite" className={className}>
      {text}
      <span className="inline-block w-px h-[1em] bg-foreground ml-0.5 align-[-0.1em] animate-pulse" aria-hidden="true" />
    </span>
  );
};
