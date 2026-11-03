import * as React from "react";
import { appConfig } from "@config";
import { cn } from "@/lib/utils";

/**
 * Which relief to use.
 *
 * The mark is moulded out of the surface -- it is light and shade only, with
 * the letter face left transparent so the ground shows through. That is what
 * makes it read as the surface deforming rather than a sticker on it, and it
 * is also why there are two files: a highlight that works on #E9EBF0 is
 * invisible on #1C1E22, and the shade that works on dark would be soot on
 * light.
 */
function useReliefSrc(): string | null {
  const base = appConfig.logoUrl;
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    const read = () =>
      setDark(document.documentElement.getAttribute("data-theme") === "dark");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  if (!base) return null;
  return dark ? base.replace(/\.png$/, "-dark.png") : base;
}

/**
 * The brand mark.
 *
 * Sized by HEIGHT, with the width left to the image. A wordmark is wide --
 * Chintamani's is roughly 5.5:1 -- so the old square `size` prop squashed it.
 *
 * The Chintamani mark is a RELIEF: light and shade only, with the letter
 * face transparent so the ground shows through. That is what makes it read
 * as the surface being moulded rather than an object placed on it -- a
 * coloured logo cannot be neumorphic, because neumorphism needs the shape to
 * be the same material as its background.
 *
 * Kept subtle on purpose: a logo carries the brand's own colour, and heavy
 * embossing muddies it.
 */
export function Logo({
  height = 28,
  emboss = true,
  className,
}: {
  height?: number;
  emboss?: boolean;
  className?: string;
}) {
  /* Offsets scale with the mark.
   *
   * Fixed pixel offsets look right on a 44px lockup and vanish on a 19px
   * one: the shade lands outside strokes that are only two or three pixels
   * wide, so the emboss reads as a faint blur instead of relief. Tying them
   * to the height keeps the same apparent depth at any size. */
  /* No CSS shadow at all.
   *
   * The asset is pure relief -- the four rims a moulded letterform shows,
   * plus its ambient occlusion, with the face transparent. A drop-shadow on
   * top would cast a second shadow from a shape that is already only
   * shadow, which reads as a blur rather than more depth. `emboss` is kept
   * so a caller can still opt out on a busy background. */
  void emboss;

  const src = useReliefSrc();

  // No asset configured: fall back to the initial on a raised plinth, so an
  // unbranded clone still looks deliberate rather than broken.
  if (!src) {
    return (
      <div
        className={cn(
          "rounded-md bg-card text-primary font-bold flex items-center justify-center shrink-0",
          emboss && "shadow-lift-sm",
          className,
        )}
        style={{ width: height, height, fontSize: height / 2 }}
        aria-label={appConfig.appName}
      >
        {appConfig.appName.charAt(0)}
      </div>
    );
  }

  /* The wrapper is load-bearing.
   *
   * A flex column defaults to align-items: stretch, so an <img> dropped
   * straight into one has its width stretched to the container and
   * `width: auto` resolves to that -- the mark renders 327px wide at 30px
   * tall instead of 165, visibly squashed. `w-fit` on the wrapper stops the
   * stretch while still honouring a parent that centres its children. */
  return (
    <span className={cn("block w-fit shrink-0", className)}>
      <img
        src={src}
        alt={appConfig.appName}
        style={{ height, width: "auto" }}
        className="block select-none max-w-full"
        draggable={false}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    </span>
  );
}
