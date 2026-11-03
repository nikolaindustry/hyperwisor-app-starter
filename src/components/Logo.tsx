import { appConfig } from "@config";
import { cn } from "@/lib/utils";

/**
 * The brand mark.
 *
 * Sized by HEIGHT, with the width left to the image. A wordmark is wide --
 * Chintamani's is roughly 5.5:1 -- so the old square `size` prop squashed it.
 *
 * `emboss` gives the mark the same depth as the rest of the soft UI. It is a
 * pair of drop-shadows rather than a box: drop-shadow follows the image's
 * alpha, so light and shade land on the letterforms themselves instead of on
 * a rectangle around them. The direction matches every other raised surface
 * -- light above-left, shade below-right -- because one element lit from
 * elsewhere is what makes a page stop reading as physical.
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
  const u = height / 30;
  const shadow = emboss
    ? {
        filter:
          `drop-shadow(${-0.9 * u}px ${-0.9 * u}px ${0.6 * u}px var(--logo-light)) ` +
          `drop-shadow(${1.3 * u}px ${1.7 * u}px ${2.2 * u}px var(--logo-shade))`,
      }
    : undefined;

  // No asset configured: fall back to the initial on a raised plinth, so an
  // unbranded clone still looks deliberate rather than broken.
  if (!appConfig.logoUrl) {
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
        src={appConfig.logoUrl}
        alt={appConfig.appName}
        style={{ height, width: "auto", ...shadow }}
        className="block select-none max-w-full"
        draggable={false}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    </span>
  );
}
