// Moroccan / French / Darija-inflected fake review content.
// Names and comments are chosen independently at random so combinations
// never repeat across products without being mechanically predictable.

export const SEED_NAMES = [
  // Male
  'Mohammed El Amrani',
  'Youssef Benali',
  'Karim Tazi',
  'Ahmed El Idrissi',
  'Omar Chraibi',
  'Amine Bensalah',
  'Rachid Alaoui',
  'Khalid El Fassi',
  'Hamza Hajji',
  'Mehdi El Mansouri',
  'Saad Benkirane',
  'Bilal Bakkali',
  'Soufiane Berrada',
  'Nabil Cherkaoui',
  'Tarik El Ouali',
  'Ayoub Bensouda',
  'Zakaria Lahlou',
  'Reda Naciri',
  'Hicham Filali',
  'Othmane Slimani',
  'Badr El Khatib',
  'Ismail Rahmani',
  'Adil Benomar',
  'Younes El Arabi',
  'Walid Senhaji',
  // Female
  'Fatima Zahra Alaoui',
  'Khadija Benali',
  'Zineb El Fassi',
  'Hafsa Tazi',
  'Salma Chraibi',
  'Loubna Berrada',
  'Nadia El Idrissi',
  'Sara Hajji',
  'Mariam Bensalah',
  'Amina El Mansouri',
  'Houda Benkirane',
  'Yasmine Cherkaoui',
  'Ghita Lahlou',
  'Sanaa Filali',
  'Imane Bensouda',
]

export const SEED_COMMENTS = [
  // Pure French
  'Très belle montre, je suis très satisfait de mon achat. La qualité est vraiment au rendez-vous !',
  'Livraison rapide et montre conforme à la description. Je recommande vivement à tous !',
  'Superbe finition, exactement comme sur les photos. Très satisfait de cet achat.',
  'J\'ai commandé pour mon mari comme cadeau d\'anniversaire, il est ravi. La montre est magnifique !',
  'Le rapport qualité-prix est excellent. Une belle montre élégante à prix accessible.',
  'Je suis très satisfait, la montre est élégante et bien finie. Je reviendrai sûrement commander.',
  'Livraison en 48h seulement, montre très bien emballée. Service impeccable !',
  'Exactement ce que je cherchais. Très belle qualité pour ce prix, je ne regrette pas du tout.',
  'Mon fils est ravi de son cadeau d\'Aïd. La montre est magnifique et très robuste.',
  'Je commande régulièrement chez Maison du Prestige, toujours aussi satisfait. La constance est là.',
  'Troisième commande ici, toujours la même qualité irréprochable. Je recommande les yeux fermés.',
  'Emballage très soigné, montre splendide. Un excellent cadeau pour les hommes.',
  'Je cherchais une montre élégante pour le bureau, je suis tombé sur la perle rare ici.',
  'Très belle montre reçue en parfait état. Le service client est réactif et sérieux.',
  'La qualité des matériaux est impressionnante pour ce prix. On voit que c\'est du travail sérieux.',
  'Commande faite le soir, livrée le lendemain. Montre superbe. Que demander de plus ?',
  'J\'ai acheté cette montre comme cadeau de mariage, tout le monde a adoré. Merci beaucoup !',
  'Belle montre, bracelet très confortable au quotidien, cadran élégant. Je suis comblé.',
  'Très bon service, la montre est identique aux photos, voire encore plus belle en réalité.',
  'Montre reçue bien emballée, livraison soignée. Un achat sans regret, je suis très satisfait.',
  'Superbe montre, mon mari est très content. Livraison rapide et emballage cadeau parfait.',
  'Prix tout à fait correct pour une montre de cette qualité. Livraison en 24h. Parfait !',
  'Belle finition, bracelet confortable. Ma femme adore aussi ! Je recommande à 100%.',
  'Service client très sympa et à l\'écoute. Montre de qualité. 5 étoiles sans hésitation.',
  'Vraiment satisfait de mon achat, la montre est solide et très élégante. Merci Maison du Prestige.',
  // French + Darija touches
  'Wach hadi montre 3jebetni bzzaf ! Merci pour la livraison aussi rapide.',
  'Tbarkellah, qualité premium et livraison super rapide. Je recommande chaudement !',
  'La montre est mazyan bzzaf, très belle finition. Les 5 étoiles sont bien méritées !',
  '3jebetni had l\'emballage, très soigné et professionnel. La montre est magnifique !',
  'Commande reçue f 48h, montre conforme à la description. Merci Maison du Prestige, continuez !',
  'Hada article mzyan bzzaf, je l\'ai offert à mon père pour l\'Aïd. Tout le monde est content !',
  'La montre est belle wach, livraison rapide. Je reviendrai commander inchallah !',
  'Superbe montre, mon ami m\'a conseillé ce site. Ghir mazyan, je comprends pourquoi maintenant !',
  'Ma femme est contente bzzaf du cadeau. La montre est encore plus belle en vrai qu\'en photo.',
  'Saha, qualité top et prix abordable. Je reviendrai commander bientôt inchallah !',
  'Hamdoullah, commande bien reçue. La montre est vraiment belle et très solide.',
  'Merci pour votre sérieux, la montre est conforme. Barak Allahou fikoum, continuez comme ça !',
  'La montre est encore plus belle en vrai qu\'en photo. Très satisfait, les 5 étoiles sont méritées !',
  'J\'ai commandé pour mon anniversaire, c\'est le meilleur cadeau que je me sois offert cette année !',
  'Excellent service et montre de grande qualité. Livraison en 24h, je suis bluffé. Bravo l\'équipe !',
]

/** Fisher-Yates shuffle on a copy — does not mutate the original. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface SeedReview {
  name:    string
  comment: string
}

/**
 * Pick `count` unique (name, comment) pairs from the pools.
 * Count is clamped to the smaller pool size to guarantee uniqueness.
 */
export function pickSeedReviews(count: number): SeedReview[] {
  const max     = Math.min(count, SEED_NAMES.length, SEED_COMMENTS.length)
  const names   = shuffle(SEED_NAMES).slice(0, max)
  const comments = shuffle(SEED_COMMENTS).slice(0, max)
  return names.map((name, i) => ({ name, comment: comments[i] }))
}
