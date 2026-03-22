"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface SignatureEmbedProps {
  embeddedSigningUrl: string;
  onCompleted?: () => void;
  onDeclined?: () => void;
  onError?: (error: string) => void;
}

/**
 * SignatureEmbed
 *
 * Renders the SignWell embedded signing experience in an inline iframe.
 * Loads the SignWell embed script from CDN and opens the signing modal.
 *
 * CSP: frame-src https://www.signwell.com and script-src https://cdn.signwell.com
 * must be configured in next.config.ts for this component to work.
 */
export function SignatureEmbed({
  embeddedSigningUrl,
  onCompleted,
  onDeclined,
  onError,
}: SignatureEmbedProps) {
  const embedRef = useRef<{ close?: () => void } | null>(null);
  const scriptLoadedRef = useRef(false);

  function openEmbed() {
    if (typeof window === "undefined") return;
    const SignWellEmbed = (window as Window & { SignWellEmbed?: new (opts: unknown) => { open: () => void; close?: () => void } }).SignWellEmbed;
    if (!SignWellEmbed) return;

    const embed = new SignWellEmbed({
      url: embeddedSigningUrl,
      events: {
        completed: onCompleted,
        declined: onDeclined,
        error: onError,
      },
    });

    embed.open();
    embedRef.current = embed;
  }

  useEffect(() => {
    // If script was already loaded before mount, open immediately
    if (scriptLoadedRef.current) {
      openEmbed();
    }

    return () => {
      if (embedRef.current?.close) {
        embedRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embeddedSigningUrl]);

  function handleScriptLoad() {
    scriptLoadedRef.current = true;
    openEmbed();
  }

  return (
    <div style={{ minHeight: "600px" }}>
      <Script
        src="https://cdn.signwell.com/assets/embedded.js"
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
      />
    </div>
  );
}
