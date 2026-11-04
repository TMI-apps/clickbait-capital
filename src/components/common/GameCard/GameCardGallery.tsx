import { useState, type ReactNode } from "react";
import { GameCard, type GameCardProps } from "./GameCard";
import { SAMPLE_CARDS, SAMPLE_IMAGES } from "./gameCardFixtures";

/**
 * Every GameCard state on one screen: types, rarities, image shapes and the selected,
 * disabled and focus states. For tests and screenshots only (no app route uses it).
 */
const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-lg">{title}</h2>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
  </section>
);

const [viral, ad, news, event] = SAMPLE_CARDS;

const IMAGE_VARIANTS: Array<{ label: string; card: GameCardProps }> = [
  {
    label: "Staand",
    card: {
      ...news,
      title: "Staande foto",
      image: { src: SAMPLE_IMAGES.portrait, alt: "Staande foto", focalPoint: { x: 70, y: 30 } },
    },
  },
  {
    label: "Liggend",
    card: {
      ...news,
      title: "Liggende foto",
      image: { src: SAMPLE_IMAGES.landscape, alt: "Liggende foto", focalPoint: { x: 70, y: 30 } },
    },
  },
  {
    label: "Vierkant",
    card: {
      ...news,
      title: "Vierkante foto",
      image: { src: SAMPLE_IMAGES.square, alt: "Vierkante foto" },
    },
  },
  { label: "Geen foto", card: { ...news, title: "Zonder foto", image: undefined } },
  {
    label: "Kapotte foto",
    card: {
      ...viral,
      title: "Foto laadt niet",
      image: { src: "/bestaat-niet.png", alt: "Ontbrekende foto" },
    },
  },
  {
    label: "Lange tekst",
    card: {
      ...ad,
      title: "Een heel lange titel die over meer dan twee regels doorloopt en dan wordt afgekapt",
      flavor:
        "Lange flavortekst die ook netjes wordt afgekapt na drie regels zodat de kaart niet uitrekt, ook niet op een smalle telefoon in portretstand, hoe lang de schrijver ook doorgaat.",
    },
  },
];

export const GameCardGallery = () => {
  const [selected, setSelected] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-8 p-4">
      <Section title="Typen (kies er een)">
        {SAMPLE_CARDS.map((card, i) => (
          <GameCard
            key={card.title}
            {...card}
            selected={selected === i}
            onSelect={() => setSelected(i)}
          />
        ))}
      </Section>
      <Section title="Zeldzaamheid">
        <GameCard {...viral} rarity="common" />
        <GameCard {...viral} rarity="rare" />
        <GameCard {...event} rarity="legendary" />
      </Section>
      <Section title="Staten">
        <GameCard {...ad} selected onSelect={() => undefined} />
        <GameCard {...news} disabled onSelect={() => undefined} />
        <GameCard {...viral} typeLabel="Breaking" onSelect={() => undefined} />
        <GameCard {...event} animation="draw" />
      </Section>
      <Section title="Compact (drie op een rij op een telefoon)">
        <div className="col-span-full grid max-w-[358px] grid-cols-3 gap-2">
          {SAMPLE_CARDS.slice(0, 3).map((card) => (
            <GameCard key={card.title} {...card} size="compact" onSelect={() => undefined} />
          ))}
        </div>
      </Section>
      <Section title="Afbeeldingen">
        {IMAGE_VARIANTS.map(({ label, card }) => (
          <GameCard key={label} {...card} />
        ))}
      </Section>
    </div>
  );
};
