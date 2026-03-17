type FooterPageShellProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
}>;

export function FooterPageShell({ eyebrow, title, description }: FooterPageShellProps) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <section className="border-b border-stone-200 bg-stone-50 py-24 text-center">
        <div className="mx-auto max-w-4xl px-6 sm:px-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em] text-stone-500">
            {eyebrow}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>
        </div>
      </section>

      <section className="container mx-auto min-h-[40vh] px-6 py-16 text-center text-stone-500 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-stone-200/80 bg-white/70 px-8 py-14 shadow-[0_24px_60px_-42px_rgba(68,64,60,0.45)] backdrop-blur-sm">
          <p className="text-base leading-8 sm:text-lg">
            {description}
          </p>
        </div>
      </section>
    </div>
  );
}