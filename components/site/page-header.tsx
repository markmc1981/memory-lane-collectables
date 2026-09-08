import { Container } from "@/components/ui/container";

/** Standard heading block for editorial / content pages. */
export function PageHeader({
  kicker,
  title,
  lede,
}: {
  kicker?: string;
  title: string;
  lede?: string;
}) {
  return (
    <Container width="default">
      <header className="border-b border-line py-14 sm:py-20">
        {kicker && <p className="overline mb-3">{kicker}</p>}
        <h1 className="font-display text-4xl text-ink sm:text-5xl">{title}</h1>
        {lede && <p className="prose-warm mt-5 text-lg">{lede}</p>}
      </header>
    </Container>
  );
}
