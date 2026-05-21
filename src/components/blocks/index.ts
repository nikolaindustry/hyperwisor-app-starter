/**
 * Design-system blocks for generated device screens.
 *
 * The AI agent composes these into bespoke product UIs. They are
 * theme-aware (driven by app.config.ts) and mobile-first, so anything
 * built from them looks consistent and professional by construction.
 *
 * See CLAUDE.md for usage rules.
 */
export { Section } from "./Section";
export { StatusHeader } from "./StatusHeader";
export { MetricTile, MetricGrid } from "./MetricTile";
export { ToggleTile } from "./ToggleTile";
export { HoldButton } from "./HoldButton";
export { StepperControl } from "./StepperControl";

// Re-export the lower-level primitives so a screen needs one import.
export { Button } from "../ui/Button";
export { Card } from "../ui/Card";
export { Input } from "../ui/Input";
export { TelemetryChart } from "../TelemetryChart";
