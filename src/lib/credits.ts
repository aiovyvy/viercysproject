/**
 * Every photograph on the site, with its creator, licence and source. The
 * /credits page renders this list; keep it in step with public/images.
 */
export type Credit = {
  file: string;
  subject: string;
  creator: string;
  license: string;
  source: string;
};

const commons = (name: string) =>
  `https://commons.wikimedia.org/wiki/File:${name}`;

export const CREDITS: Credit[] = [
  {
    file: "santorini.jpg",
    subject: "Blue domes above the caldera, Oia",
    creator: "Unsplash contributor",
    license: "Unsplash License",
    source: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e",
  },
  {
    file: "architecture.jpg",
    subject: "Stairway to the sea, Oia",
    creator: "Unsplash contributor",
    license: "Unsplash License",
    source: "https://images.unsplash.com/photo-1533105079780-92b9be482077",
  },
  {
    file: "santorini/oia-sunset.jpg",
    subject: "Sunset over Oia",
    creator: "kuhnmi",
    license: "CC BY 2.0",
    source: commons("Sunset_in_Oia1.jpg"),
  },
  {
    file: "santorini/oia-evening.jpg",
    subject: "The last light over the Aegean",
    creator: "kuhnmi",
    license: "CC BY 2.0",
    source: commons("Sunset_in_Santorini1.jpg"),
  },
  {
    file: "santorini/blue-hour.jpg",
    subject: "Oia at blue hour",
    creator: "kuhnmi",
    license: "CC BY 2.0",
    source: commons("Blue_Hour_in_Santorini_-_Flickr_-_kuhnmi.jpg"),
  },
  {
    file: "santorini/white-stair.jpg",
    subject: "Whitewashed steps toward the caldera",
    creator: "Klearchos Kapoutsis",
    license: "CC BY 2.0",
    source: commons("Is_it_waiting_us%3F_(2790256647).jpg"),
  },
  {
    file: "santorini/parasols.jpg",
    subject: "Terrace parasols",
    creator: "Klearchos Kapoutsis",
    license: "CC BY 2.0",
    source: commons("Parasols_(2784723537).jpg"),
  },
  {
    file: "santorini/stone-door.jpg",
    subject: "Volcanic stone doorway",
    creator: "Klearchos Kapoutsis",
    license: "CC BY 2.0",
    source: commons("Old_Door_(4346766078).jpg"),
  },
  {
    file: "santorini/caldera-table.jpg",
    subject: "A table above the caldera",
    creator: "Klearchos Kapoutsis",
    license: "CC BY 2.0",
    source: commons("A_table,_two_chairs_and_an_umbrella..._(2260966802).jpg"),
  },
  {
    file: "santorini/courtyard-door.jpg",
    subject: "Courtyard in Firostefani (cropped)",
    creator: "Winniepix",
    license: "CC BY 2.0",
    source: commons(
      "Traditional_houses_beneath_the_churches_in_Firostefani,_Santorini,_Greece_(34473665406).jpg",
    ),
  },
  {
    file: "santorini/caldera-dusk.jpg",
    subject: "The caldera at dusk from Imerovigli",
    creator: "Sgroey",
    license: "CC BY 4.0",
    source: commons("View_of_Caldera_at_Sunset_from_Imerovigli,_Santorini.jpg"),
  },
  {
    file: "santorini/fira-sunset.jpg",
    subject: "Sunset from Fira",
    creator: "Alexandros",
    license: "CC BY 3.0",
    source: commons("Sunset_-_Fira.JPG"),
  },
  {
    file: "santorini/sea-terrace.jpg",
    subject: "Caldera-facing terrace",
    creator: "rawpixel",
    license: "CC0",
    source: "https://www.rawpixel.com/image/5924623",
  },
  {
    file: "santorini/caldera-pool.jpg",
    subject: "Caldera edge at Imerovigli",
    creator: "rawpixel",
    license: "CC0",
    source: "https://www.rawpixel.com/image/5963329",
  },
  {
    file: "santorini/cliff-pools.jpg",
    subject: "Cliff-edge terraces",
    creator: "rawpixel",
    license: "CC0",
    source: "https://www.rawpixel.com/image/6054528",
  },
  {
    file: "santorini/chapel-arch.jpg",
    subject: "Island chapel",
    creator: "rawpixel",
    license: "CC0",
    source: "https://www.rawpixel.com/image/6036805",
  },
  {
    file: "santorini/sailing.jpg",
    subject: "Yacht in the caldera",
    creator: "rawpixel",
    license: "CC0",
    source: "https://www.rawpixel.com/ (Openverse: “Yacht sailing sea”)",
  },
  {
    file: "santorini/olive-wood.jpg",
    subject: "Olive wood grain",
    creator: "rawpixel",
    license: "CC0",
    source: "https://www.rawpixel.com/image/6054692",
  },
  {
    file: "destinations/boracay.jpg",
    subject: "White Beach, Boracay",
    creator: "Angelo Juan Ramos",
    license: "CC BY 2.0",
    source: commons("Boracay_White_Beach_in_day_(985286231).jpg"),
  },
  {
    file: "destinations/amalfi.jpg",
    subject: "Positano at dusk",
    creator: "JeCCo",
    license: "CC BY 4.0",
    source: commons("Positano_Sunset.JPG"),
  },
  {
    file: "destinations/bali.jpg",
    subject: "Rice terraces near Ubud",
    creator: "Vyacheslav Argenberg",
    license: "CC BY 4.0",
    source: commons("Rice_terraces,_Ubud,_Bali.jpg"),
  },
];
