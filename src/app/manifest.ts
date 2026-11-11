import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cashup — Le cashback du Bénin, en FCFA",
    short_name: "Cashup",
    description:
      "Gagnez du cashback à chaque achat chez les commerces partenaires du Bénin. Retrait MTN MoMo, Moov Money ou Celtiis Cash.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f8fd",
    theme_color: "#4348d8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
