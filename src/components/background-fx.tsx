export default function BackgroundFx() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="grid-bg absolute inset-0" />
      <div className="absolute -top-40 right-[15%] h-[480px] w-[480px] rounded-full bg-cyan-500/[0.13] blur-[130px] animate-pulse-slow" />
      <div className="absolute top-[35%] -left-40 h-[420px] w-[420px] rounded-full bg-violet-600/[0.12] blur-[130px] animate-pulse-slow [animation-delay:1.5s]" />
      <div className="absolute bottom-[-180px] right-[45%] h-[380px] w-[380px] rounded-full bg-fuchsia-500/[0.08] blur-[130px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_30%,#09090f_85%)]" />
    </div>
  );
}
