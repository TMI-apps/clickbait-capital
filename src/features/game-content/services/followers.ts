import type { FollowerPersona } from "@/features/game-content/types/contentPresentation.types";

/**
 * The recurring followers who comment under feed posts (follower-chat D2, feed-comments D1): six invented kids-world
 * characters who react after every post and event choice. Lines are short Dutch at about
 * age 11; no real people, brands, games or platforms (game-content tone). Two are critical
 * (grandma and the fact-checker): they complain when reputation drops and leave when it is
 * very low, so the comments show the echo chamber that is left over.
 */
export const FOLLOWERS: readonly FollowerPersona[] = [
  {
    id: "gamer",
    name: "Gamer_Gijs",
    face: "🎮",
    tone: "primary",
    critical: false,
    lines: {
      officialViral: ["beste update ooit 🔥", "eindelijk!!"],
      officialAd: ["alweer iets wat geld kost 😩", "moet ik nu betalen of zo?"],
      officialNews: ["oké… best netjes van jullie", "huh, een update die normaal is"],
      viral: ["W post 🔥", "dit is echt next level", "GG, iedereen kijkt dit", "nog een keer!! 🔁"],
      ad: ["skip skip skip ⏭️", "bro, alweer reclame?", "ik wil gewoon filmpjes 😩"],
      news: ["oké dit is best interessant", "saai… maar wel waar", "huh, wist ik niet 🤔"],
      hype: [
        "de reacties gaan los 🚀",
        "zoveel nieuwe kijkers!!",
        "dit is een banger 🔥🔥",
        "iedereen op school heeft dit gezien",
      ],
      toxic: ["L + ratio 💀", "jij snapt er niks van 🤡", "wie dit niet snapt is een noob"],
      adFatigue: ["nog één reclame en ik ben weg", "meer reclame dan filmpjes 😤"],
      echoChamber: ["wacht, dit zag ik net ook al", "zelfde filmpje, andere dag 😴"],
    },
  },
  {
    id: "fatbike",
    name: "FatbikeFem",
    face: "🚲",
    tone: "viral",
    critical: false,
    lines: {
      officialViral: ["omg ik ga nóóit meer slapen 😂", "yesss, nog meer!!"],
      officialAd: ["wacht, moet ik nu betalen?", "is dit nou een update of reclame?"],
      officialNews: ["fijn, dit voelt veiliger", "oké, dit is wel chill"],
      viral: ["BROEMMM 🚲💨", "dit doen we morgen na op het plein", "haha iedereen moet dit zien"],
      ad: ["is die korting echt?", "kan ik er een nieuw zadel van kopen?", "meh, reclame 🥱"],
      news: ["ow, dat is wel heftig", "goed dat iemand dit zegt", "oké ik lees het even"],
      hype: [
        "we gaan viraal!! 📈",
        "mijn hele klas kijkt mee",
        "zelfs mijn broertje deelt dit",
        "1 miljoen views, let maar op 🚀",
      ],
      toxic: ["haha laat ze maar huilen 😂", "wie dit niet durft is een baby"],
      echoChamber: ["alweer zo'n challenge? 🙄", "dit is precies hetzelfde als net"],
    },
  },
  {
    id: "memes",
    name: "MemeKoning",
    face: "😂",
    tone: "warning",
    critical: false,
    lines: {
      officialViral: ["dit wordt een meme, let op", "update van het jaar 💀"],
      officialAd: ["deze app wil gewoon je geld 💸", "kassa! 🤡"],
      officialNews: ["saai maar oké 👍", "geen meme hierover, sorry"],
      viral: ["💀💀💀", "dit wordt een meme, let maar op", "ik kan niet meer 😂😂"],
      ad: ["reclame-moment 🤡", "*scrollt snel door*", "wie koopt dit nou 😂"],
      news: ["wie zet hier nou nieuws 😂", "nieuws? hier?? 😳", "oké respect, eerlijk 🫡"],
      hype: [
        "de reacties ontploffen 💥",
        "ik was hier al vóór het hip was 😎",
        "dit gaat de hele groepsapp rond",
        "meme van het jaar 🏆",
      ],
      toxic: ["ratio + niemand vroeg erom 💀", "huil maar 😭😂", "ruzie in de reacties 🍿"],
      echoChamber: ["dezelfde meme voor de 5e keer 😴", "copy-paste-feed 📋"],
    },
  },
  {
    id: "grandma",
    name: "Oma Riet",
    face: "👵",
    tone: "news",
    critical: true,
    lines: {
      officialViral: [
        "Ook om twee uur 's nachts? Dat meen je niet.",
        "Wie houdt hier nog op met kijken?",
      ],
      officialAd: ["Wie heeft dit bedacht?", "Het gaat jullie alleen om geld."],
      officialNews: ["Eindelijk iemand met verstand.", "Dat werd tijd, jongens."],
      viral: [
        "Wat is een challenge eigenlijk? 🤔",
        "Pas wel op, jongens!",
        "Ik snap het niet, maar leuk 😊",
      ],
      ad: [
        "Is dat niet te duur, lieverd?",
        "Nou nou, wéér iets kopen 🙄",
        "Lees wel de kleine lettertjes!",
      ],
      news: [
        "Wat goed uitgelegd! 👏",
        "Dit stuur ik door naar de buurvrouw",
        "Fijn, eindelijk iets dat klopt",
      ],
      toxic: ["Wat een gescheld hier… 😟", "Zo praat je toch niet tegen elkaar?"],
      complain: ["Ik vertrouw deze app niet meer zo", "Wat is hier aan de hand? 😕"],
      adFatigue: ["Alleen nog maar reclame, hè"],
    },
  },
  {
    id: "factchecker",
    name: "Nina_Checkt",
    face: "🧐",
    tone: "success",
    critical: true,
    lines: {
      officialViral: [
        "Dit is gemaakt om je vast te houden. Let op.",
        "Lees eerst wat dit echt doet.",
      ],
      officialAd: [
        "Lees de kleine letters, mensen.",
        "Gratis bestaat niet. Jij betaalt met je gegevens.",
      ],
      officialNews: [
        "Goed besluit. Ik check het wel even 😉",
        "Dit is een goede stap. Nu nog doen.",
      ],
      viral: [
        "Is dit wel echt? Bron?",
        "Klinkt als nep, ik check het even 🔍",
        "Leuk, maar klopt het ook?",
      ],
      ad: [
        "Dit is gewoon reclame, hè 👀",
        "Let op: ze willen je zakgeld",
        "Gesponsord, maar dat staat er klein",
      ],
      news: ["Eindelijk echte info ✅", "Bron gecheckt: klopt ✅", "Hierom volg ik je"],
      toxic: ["Al die haat hier… niet oké", "Melden, dit is pesten 🚩"],
      complain: ["Je feed klopt steeds minder 📉", "Waar zijn je bronnen?"],
      echoChamber: ["Iedereen zegt hetzelfde. Bubbel-alarm 🫧"],
    },
  },
  {
    id: "dealhunter",
    name: "KortingKevin",
    face: "🤑",
    tone: "ad",
    critical: false,
    lines: {
      officialViral: ["meer kijken = meer deals 🤑", "nog meer filmpjes, nog meer deals"],
      officialAd: ["ik wil die deal!!", "is er korting op? 👀"],
      officialNews: ["geen korting hierop? 😢", "oké, maar waar zijn de deals"],
      viral: ["lol, maar waar is de korting?", "leuk filmpje, nu een deal pls", "haha nice 👍"],
      ad: ["KORTING?! 🤑", "ik heb al besteld 🛒", "hier, pak mijn zakgeld 💸"],
      news: ["geen deals vandaag? 😢", "hm, oké, goed om te weten", "nieuws levert niks op, toch?"],
      hype: [
        "zoveel volgers, nu kassa 💰",
        "zoveel kijkers = zoveel reclame 🤑",
        "kun je mij ook beroemd maken?",
      ],
      adFatigue: ["zelfs ík heb nu genoeg reclame gezien"],
    },
  },
];
