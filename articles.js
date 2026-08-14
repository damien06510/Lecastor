// ============================================
// LE CASTOR — Articles de blog
// Pour ajouter un nouvel article : copie un bloc { ... } ci-dessous,
// change le slug (utilisé dans l'URL, sans espace ni accent), le titre,
// la date, l'extrait, et le contenu (liste de paragraphes/titres).
// Le plus récent doit être en premier dans le tableau.
// ============================================

export const ARTICLES = [
  {
    slug: "combien-euros-jetes-chantier",
    title: "Combien d'euros un artisan jette-t-il vraiment sur un chantier ?",
    date: "2026-08-14",
    excerpt: "Ciment entamé, chutes de placo, bobines de câble à moitié vides... Derrière ces petits restes qui finissent en benne se cache une vraie somme d'argent, chiffres officiels à l'appui.",
    content: [
      { type: "p", text: "Un sac de ciment entamé, des chutes de placo, une bobine de câble à moitié vide, des tuiles ou du carrelage en trop après un ajustement... Sur un chantier, ces petits restes semblent anodins pris un par un. Mais mis bout à bout, sur l'année, ils représentent une vraie somme d'argent — et pas seulement en matériaux perdus." },
      { type: "h2", text: "Ce que disent les chiffres officiels" },
      { type: "p", text: "Selon la Fédération Française du Bâtiment (FFB), le seul coût d'élimination des déchets de chantier (hors transport et location de benne) représente environ 3,5 % du chiffre d'affaires du secteur du bâtiment, soit près de 2,54 milliards d'euros par an à l'échelle nationale." },
      { type: "p", text: "L'ADEME va plus loin dans le détail : une gestion des déchets \"réglementaire\" mais non optimisée peut représenter jusqu'à 4 % du coût total d'un chantier. À l'inverse, une gestion optimisée — tri, valorisation, réemploi des matériaux encore utilisables — permettrait de ramener ce ratio à environ 1,5 %." },
      { type: "p", text: "Concrètement, l'écart entre les deux (environ 2,5 % du coût d'un chantier) correspond à de l'argent qui part littéralement à la benne, alors qu'il pourrait rester dans la poche de l'artisan ou de l'entreprise." },
      { type: "h2", text: "Ce que ça représente concrètement" },
      { type: "p", text: "Prenons un exemple simple, à titre illustratif. Sur un chantier de rénovation facturé 20 000 €, une gestion non optimisée des déchets peut représenter jusqu'à 800 € (4 %) de surcoût lié à l'élimination — évacuation, location de benne, temps passé à trier ou à tout jeter en vrac. Avec une meilleure gestion, ce montant peut redescendre autour de 300 € (1,5 %). La différence, environ 500 € par chantier de cette taille, correspond en grande partie à des matériaux qui auraient pu être réemployés ou revendus plutôt que jetés." },
      { type: "p", text: "Sur une année, pour un artisan qui enchaîne plusieurs chantiers, ce type d'écart peut vite représenter plusieurs milliers d'euros — sans compter le temps et l'énergie perdus à gérer des bennes pleines de matériaux encore en bon état." },
      { type: "h2", text: "Pourquoi ça continue malgré tout" },
      { type: "p", text: "Ce n'est pas de la négligence : c'est souvent une question de temps et d'absence de solution pratique. Entre deux chantiers, personne n'a le temps de démarcher pour revendre trois plaques de placo ou un reste de gaine électrique. Résultat, tout part à la benne par défaut, même quand le matériau est encore parfaitement utilisable." },
      { type: "h2", text: "Une solution simple : déposer une annonce plutôt que jeter" },
      { type: "p", text: "C'est exactement le problème que Le Castor essaie de résoudre : donner un endroit rapide et dédié pour déposer ce qui reste d'un chantier — chutes, surplus, invendus — plutôt que de le voir partir en déchetterie. Une photo, une quantité, un prix, une localisation, et l'annonce est en ligne en quelques minutes. Pas besoin de démarcher, l'annonce reste visible le temps qu'il faut." },
      { type: "p", text: "Ne jetez plus. Ne stockez plus. Vendez avec Le Castor." },
    ],
  },
  {
    slug: "chutes-de-chantier-5-idees",
    title: "Chutes de chantier : 5 idées pour ne plus les jeter (et gagner un peu d'argent au passage)",
    date: "2026-08-14",
    excerpt: "Un fond de sac de ciment, trois plaques de placo en trop, une bobine de câble entamée une seule fois... Voici 5 idées concrètes pour arrêter de jeter vos surplus de chantier.",
    content: [
      { type: "p", text: "Un fond de sac de ciment, trois plaques de placo en trop, une bobine de câble électrique entamée une seule fois... Sur presque tous les chantiers, qu'il s'agisse d'une rénovation entre particuliers ou d'un chantier professionnel, il reste des matériaux en bon état qui finissent trop souvent à la benne. Pourtant, ces surplus ont encore de la valeur — pour vous, comme pour quelqu'un d'autre." },
      { type: "p", text: "Voici 5 idées concrètes pour arrêter de jeter (ou de stocker indéfiniment) vos chutes de chantier." },
      { type: "h2", text: "1. Faites l'inventaire avant de commander plus" },
      { type: "p", text: "Avant de repartir acheter du neuf pour un prochain chantier, jetez un œil à ce qui traîne déjà dans le garage ou l'atelier. Combien de fois rachète-t-on une boîte entière de vis, un pot de peinture ou un rouleau d'isolant alors qu'il en reste déjà chez soi, oublié depuis le dernier chantier ? Un petit inventaire régulier évite les doublons et les dépenses inutiles." },
      { type: "h2", text: "2. Donnez une seconde vie aux surplus plutôt que de les stocker" },
      { type: "p", text: "Le réflexe le plus courant, c'est de tout garder \"au cas où\". Le problème, c'est que ces réserves prennent de la place, s'abîment avec le temps (humidité, poussière, UV) et finissent souvent par être jetées de toute façon, des années plus tard, lorsqu'on manque de place. Mieux vaut s'en séparer rapidement, pendant que le matériau est encore en parfait état." },
      { type: "h2", text: "3. Vendez ou donnez plutôt que de payer pour jeter" },
      { type: "p", text: "Ce qu'on oublie souvent, c'est que jeter a un coût : évacuation en déchetterie, benne à louer, temps perdu. À l'inverse, revendre — même à petit prix — permet de récupérer une partie de la valeur du matériau, et d'éviter ces frais. Une plaque de placo, un rouleau de gaine électrique ou un lot de carrelage peuvent facilement retrouver preneur auprès d'un bricoleur du coin ou d'un petit artisan qui n'a pas besoin d'acheter un lot complet neuf pour une petite surface." },
      { type: "h2", text: "4. Pensez local" },
      { type: "p", text: "Transporter des matériaux de construction n'est pas toujours pratique : c'est lourd, encombrant, parfois fragile. Privilégier une remise en main propre à proximité évite les complications de livraison et permet souvent de conclure l'échange plus vite. C'est aussi plus écologique : pas de transport inutile sur de longues distances pour un simple surplus de chantier." },
      { type: "h2", text: "5. Utilisez une plateforme dédiée au BTP plutôt qu'un site généraliste" },
      { type: "p", text: "Les sites de petites annonces généralistes ne sont pas toujours adaptés : les catégories ne correspondent pas vraiment aux matériaux de construction, et les annonces se perdent au milieu de meubles ou d'électroménager. Une plateforme spécialisée dans les matériaux et le matériel de chantier facilite la recherche pour l'acheteur, comme pour le vendeur — tout le monde y est déjà pour la bonne raison." },
      { type: "h2", text: "C'est exactement pour ça qu'on a créé Le Castor" },
      { type: "p", text: "Le Castor est une plateforme pensée spécifiquement pour donner une seconde vie aux surplus, chutes et invendus de matériaux et matériel de BTP — gros œuvre, second œuvre, plomberie, électricité, extérieur, outillage. Que vous soyez un particulier qui vient de finir sa rénovation ou un artisan avec un reste de chantier, déposer une annonce est gratuit et rapide : une photo, une quantité, un prix, une localisation." },
      { type: "p", text: "Ne jetez plus. Ne stockez plus. Vendez avec Le Castor." },
    ],
  },
];
