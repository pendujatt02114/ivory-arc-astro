/*
  Canonical IVY parity layer — GENERATED from the IVY pricing engine data
  (PRICING_DATA.json + THEME_MAP.json) by build_pricing_data.py / the parity
  generator. DO NOT hand-edit destination keys: they are IVY catalogue keys so
  warm-transfer legs price correctly. Regenerate when the pricing data changes.

  The website uses these FIVE themes only — identical to IVY's engine fallback
  order ["heritage","spirituality","wildlife","mountains","food"]. The site never
  prices anything; it collects intent and hands a structured brief to IVY.
*/
export type ThemeKey = 'heritage' | 'spirituality' | 'wildlife' | 'mountains' | 'food';

export interface ThemeDest { key: string; name: string; nights: number }
export interface SiteTheme { key: ThemeKey; label: string; primary: ThemeDest[]; all: ThemeDest[] }
export interface ExperiencePref {
  id: string; label: string; themes?: ThemeKey[]; buckets?: string[]; tags?: string[];
  excursionOptIn?: boolean;
}

export const THEME_ORDER: ThemeKey[] = ['heritage', 'spirituality', 'wildlife', 'mountains', 'food'];

export const THEMES: Record<ThemeKey, SiteTheme> = {
  "heritage": {
    "key": "heritage",
    "label": "Heritage",
    "primary": [
      {
        "key": "agra",
        "name": "Agra",
        "nights": 1
      },
      {
        "key": "jaipur",
        "name": "Jaipur",
        "nights": 1
      },
      {
        "key": "jodhpur",
        "name": "Jodhpur",
        "nights": 2
      },
      {
        "key": "udaipur",
        "name": "Udaipur",
        "nights": 2
      },
      {
        "key": "bikaner",
        "name": "Bikaner",
        "nights": 1
      },
      {
        "key": "chittorgarh",
        "name": "Chittorgarh",
        "nights": 2
      },
      {
        "key": "amritsar",
        "name": "Amritsar",
        "nights": 1
      },
      {
        "key": "prayagraj",
        "name": "Prayagraj",
        "nights": 2
      }
    ],
    "all": [
      {
        "key": "agra",
        "name": "Agra",
        "nights": 1
      },
      {
        "key": "jaipur",
        "name": "Jaipur",
        "nights": 1
      },
      {
        "key": "jodhpur",
        "name": "Jodhpur",
        "nights": 2
      },
      {
        "key": "udaipur",
        "name": "Udaipur",
        "nights": 2
      },
      {
        "key": "chittorgarh",
        "name": "Chittorgarh",
        "nights": 2
      },
      {
        "key": "kumbhalgarh",
        "name": "Kumbhalgarh",
        "nights": 2
      },
      {
        "key": "ranakpur",
        "name": "Ranakpur",
        "nights": 2
      },
      {
        "key": "bikaner",
        "name": "Bikaner",
        "nights": 1
      },
      {
        "key": "mount_abu",
        "name": "Mount Abu",
        "nights": 3
      },
      {
        "key": "amritsar",
        "name": "Amritsar",
        "nights": 1
      },
      {
        "key": "patiala",
        "name": "Patiala",
        "nights": 1
      },
      {
        "key": "chandigarh",
        "name": "Chandigarh",
        "nights": 1
      },
      {
        "key": "prayagraj",
        "name": "Prayagraj",
        "nights": 2
      },
      {
        "key": "ajmer",
        "name": "Ajmer",
        "nights": 1
      }
    ]
  },
  "spirituality": {
    "key": "spirituality",
    "label": "Spirituality",
    "primary": [
      {
        "key": "varanasi",
        "name": "Varanasi",
        "nights": 3
      },
      {
        "key": "rishikesh",
        "name": "Rishikesh",
        "nights": 1
      },
      {
        "key": "haridwar",
        "name": "Haridwar",
        "nights": 1
      },
      {
        "key": "amritsar",
        "name": "Amritsar",
        "nights": 1
      },
      {
        "key": "pushkar",
        "name": "Pushkar",
        "nights": 1
      },
      {
        "key": "mathura",
        "name": "Mathura",
        "nights": 1
      },
      {
        "key": "ayodhya",
        "name": "Ayodhya",
        "nights": 2
      },
      {
        "key": "vaishno_devi_katra",
        "name": "Vaishno Devi (Katra)",
        "nights": 3
      }
    ],
    "all": [
      {
        "key": "varanasi",
        "name": "Varanasi",
        "nights": 3
      },
      {
        "key": "sarnath",
        "name": "Sarnath",
        "nights": 3
      },
      {
        "key": "ayodhya",
        "name": "Ayodhya",
        "nights": 2
      },
      {
        "key": "mathura",
        "name": "Mathura",
        "nights": 1
      },
      {
        "key": "vrindavan",
        "name": "Vrindavan",
        "nights": 1
      },
      {
        "key": "prayagraj",
        "name": "Prayagraj",
        "nights": 2
      },
      {
        "key": "pushkar",
        "name": "Pushkar",
        "nights": 1
      },
      {
        "key": "ajmer",
        "name": "Ajmer",
        "nights": 1
      },
      {
        "key": "haridwar",
        "name": "Haridwar",
        "nights": 1
      },
      {
        "key": "rishikesh",
        "name": "Rishikesh",
        "nights": 1
      },
      {
        "key": "kainchi_dham",
        "name": "Kainchi Dham",
        "nights": 1
      },
      {
        "key": "amritsar",
        "name": "Amritsar",
        "nights": 1
      },
      {
        "key": "anandpur_sahib",
        "name": "Anandpur Sahib",
        "nights": 1
      },
      {
        "key": "jwala_ji",
        "name": "Jwala Ji",
        "nights": 2
      },
      {
        "key": "chintpurni",
        "name": "Chintpurni",
        "nights": 2
      },
      {
        "key": "vaishno_devi_katra",
        "name": "Vaishno Devi (Katra)",
        "nights": 3
      },
      {
        "key": "mcleodganj",
        "name": "McLeodganj",
        "nights": 2
      },
      {
        "key": "dharamshala",
        "name": "Dharamshala",
        "nights": 2
      }
    ]
  },
  "wildlife": {
    "key": "wildlife",
    "label": "Wildlife",
    "primary": [
      {
        "key": "ranthambore",
        "name": "Ranthambore",
        "nights": 1
      },
      {
        "key": "jim_corbett",
        "name": "Jim Corbett",
        "nights": 1
      },
      {
        "key": "sattal",
        "name": "Sattal",
        "nights": 1
      },
      {
        "key": "bhimtal",
        "name": "Bhimtal",
        "nights": 1
      }
    ],
    "all": [
      {
        "key": "ranthambore",
        "name": "Ranthambore",
        "nights": 1
      },
      {
        "key": "jim_corbett",
        "name": "Jim Corbett",
        "nights": 1
      },
      {
        "key": "sattal",
        "name": "Sattal",
        "nights": 1
      },
      {
        "key": "bhimtal",
        "name": "Bhimtal",
        "nights": 1
      }
    ]
  },
  "mountains": {
    "key": "mountains",
    "label": "Mountains",
    "primary": [
      {
        "key": "shimla",
        "name": "Shimla",
        "nights": 1
      },
      {
        "key": "manali",
        "name": "Manali",
        "nights": 2
      },
      {
        "key": "mussoorie",
        "name": "Mussoorie",
        "nights": 1
      },
      {
        "key": "nainital",
        "name": "Nainital",
        "nights": 1
      },
      {
        "key": "dharamshala",
        "name": "Dharamshala",
        "nights": 2
      },
      {
        "key": "dalhousie",
        "name": "Dalhousie",
        "nights": 2
      },
      {
        "key": "kasol",
        "name": "Kasol",
        "nights": 2
      },
      {
        "key": "almora",
        "name": "Almora",
        "nights": 1
      }
    ],
    "all": [
      {
        "key": "mussoorie",
        "name": "Mussoorie",
        "nights": 1
      },
      {
        "key": "landour",
        "name": "Landour",
        "nights": 1
      },
      {
        "key": "dhanaulti",
        "name": "Dhanaulti",
        "nights": 1
      },
      {
        "key": "nainital",
        "name": "Nainital",
        "nights": 1
      },
      {
        "key": "bhimtal",
        "name": "Bhimtal",
        "nights": 1
      },
      {
        "key": "sattal",
        "name": "Sattal",
        "nights": 1
      },
      {
        "key": "mukteshwar",
        "name": "Mukteshwar",
        "nights": 1
      },
      {
        "key": "almora",
        "name": "Almora",
        "nights": 1
      },
      {
        "key": "ranikhet",
        "name": "Ranikhet",
        "nights": 1
      },
      {
        "key": "kausani",
        "name": "Kausani",
        "nights": 1
      },
      {
        "key": "dharamshala",
        "name": "Dharamshala",
        "nights": 2
      },
      {
        "key": "mcleodganj",
        "name": "McLeodganj",
        "nights": 2
      },
      {
        "key": "palampur",
        "name": "Palampur",
        "nights": 2
      },
      {
        "key": "dalhousie",
        "name": "Dalhousie",
        "nights": 2
      },
      {
        "key": "khajjiar",
        "name": "Khajjiar",
        "nights": 2
      },
      {
        "key": "shimla",
        "name": "Shimla",
        "nights": 1
      },
      {
        "key": "manali",
        "name": "Manali",
        "nights": 2
      },
      {
        "key": "kufri",
        "name": "Kufri",
        "nights": 1
      },
      {
        "key": "chail",
        "name": "Chail",
        "nights": 1
      },
      {
        "key": "solang_valley",
        "name": "Solang Valley",
        "nights": 2
      },
      {
        "key": "kullu",
        "name": "Kullu",
        "nights": 2
      },
      {
        "key": "kasol",
        "name": "Kasol",
        "nights": 2
      },
      {
        "key": "tirthan_valley",
        "name": "Tirthan Valley",
        "nights": 2
      },
      {
        "key": "bir_billing",
        "name": "Bir Billing",
        "nights": 2
      }
    ]
  },
  "food": {
    "key": "food",
    "label": "Food",
    "primary": [
      {
        "key": "amritsar",
        "name": "Amritsar",
        "nights": 1
      },
      {
        "key": "varanasi",
        "name": "Varanasi",
        "nights": 3
      },
      {
        "key": "jaipur",
        "name": "Jaipur",
        "nights": 1
      },
      {
        "key": "jodhpur",
        "name": "Jodhpur",
        "nights": 2
      },
      {
        "key": "udaipur",
        "name": "Udaipur",
        "nights": 2
      },
      {
        "key": "agra",
        "name": "Agra",
        "nights": 1
      }
    ],
    "all": [
      {
        "key": "varanasi",
        "name": "Varanasi",
        "nights": 3
      },
      {
        "key": "amritsar",
        "name": "Amritsar",
        "nights": 1
      },
      {
        "key": "jaipur",
        "name": "Jaipur",
        "nights": 1
      },
      {
        "key": "agra",
        "name": "Agra",
        "nights": 1
      },
      {
        "key": "jodhpur",
        "name": "Jodhpur",
        "nights": 2
      },
      {
        "key": "udaipur",
        "name": "Udaipur",
        "nights": 2
      },
      {
        "key": "mathura",
        "name": "Mathura",
        "nights": 1
      },
      {
        "key": "vrindavan",
        "name": "Vrindavan",
        "nights": 1
      },
      {
        "key": "pushkar",
        "name": "Pushkar",
        "nights": 1
      },
      {
        "key": "ludhiana",
        "name": "Ludhiana",
        "nights": 1
      },
      {
        "key": "jalandhar",
        "name": "Jalandhar",
        "nights": 1
      }
    ]
  }
} as const;

export const EXPERIENCE_PREFS: ExperiencePref[] = [
  {
    "id": "forts_palaces_architecture",
    "label": "Forts, palaces & architecture",
    "themes": [
      "heritage"
    ],
    "buckets": [
      "Heritage Visits"
    ],
    "tags": [
      "forts",
      "palaces",
      "architecture"
    ]
  },
  {
    "id": "museums_history",
    "label": "Museums & history",
    "themes": [
      "heritage"
    ],
    "buckets": [
      "Museum / Culture"
    ],
    "tags": [
      "museums",
      "history",
      "culture"
    ]
  },
  {
    "id": "old_city_walks",
    "label": "Old-city walks & local culture",
    "themes": [
      "heritage",
      "food"
    ],
    "buckets": [
      "Culture / Crafts / Local Life",
      "Local Experience"
    ],
    "tags": [
      "old city",
      "walk",
      "local life"
    ]
  },
  {
    "id": "temples_rituals",
    "label": "Temples, rituals & sacred sites",
    "themes": [
      "spirituality"
    ],
    "buckets": [
      "Spiritual / Ritual"
    ],
    "tags": [
      "temple",
      "ritual",
      "sacred"
    ]
  },
  {
    "id": "aarti_darshan",
    "label": "Aarti / darshan / devotional",
    "themes": [
      "spirituality"
    ],
    "buckets": [
      "Spiritual / Ritual"
    ],
    "tags": [
      "aarti",
      "darshan",
      "ghat"
    ]
  },
  {
    "id": "pilgrimage_circuits",
    "label": "Pilgrimage circuits / sacred rivers",
    "themes": [
      "spirituality"
    ],
    "buckets": [
      "Spiritual / Ritual"
    ],
    "tags": [
      "pilgrimage",
      "yatra",
      "river"
    ]
  },
  {
    "id": "scenic_photography",
    "label": "Scenic viewpoints & photography",
    "themes": [
      "mountains"
    ],
    "buckets": [
      "Scenic / Nature"
    ],
    "tags": [
      "viewpoint",
      "scenic",
      "photography"
    ]
  },
  {
    "id": "nature_walks_treks",
    "label": "Nature walks / treks",
    "themes": [
      "mountains"
    ],
    "buckets": [
      "Trekking / Trails"
    ],
    "tags": [
      "trek",
      "trail",
      "nature walk"
    ]
  },
  {
    "id": "boating_lakes",
    "label": "Boating / lakes / gentle outdoors",
    "themes": [
      "mountains"
    ],
    "buckets": [
      "Boating / Water Experiences"
    ],
    "tags": [
      "boating",
      "lake"
    ]
  },
  {
    "id": "adventure_snow",
    "label": "Adventure / snow / active",
    "themes": [
      "mountains"
    ],
    "buckets": [
      "Adventure / Snow"
    ],
    "tags": [
      "adventure",
      "snow",
      "rafting"
    ]
  },
  {
    "id": "wildlife_safari_birding",
    "label": "Wildlife / safari / birding",
    "themes": [
      "wildlife"
    ],
    "buckets": [
      "Wildlife / Safari"
    ],
    "tags": [
      "safari",
      "wildlife",
      "birding"
    ]
  },
  {
    "id": "food_local_cuisine",
    "label": "Food walks & local cuisine",
    "themes": [
      "food"
    ],
    "buckets": [
      "Local Experience",
      "Culture / Crafts / Local Life"
    ],
    "tags": [
      "food",
      "cuisine",
      "street food"
    ]
  },
  {
    "id": "crafts_village_life",
    "label": "Crafts / village / local life",
    "themes": [
      "food"
    ],
    "buckets": [
      "Culture / Crafts / Local Life"
    ],
    "tags": [
      "crafts",
      "village",
      "local life"
    ]
  }
];

export const EXCURSION_PREF: ExperiencePref = {"id": "nearby_excursions", "label": "Open to nearby excursions / day trips", "excursionOptIn": true};


// Delhi is the journey ORIGIN (start city), not a priced leg — it has no
// destination fare in the pricing sheet. It is offered as the default start city
// and its food/heritage experiences are start-city add-ons, never a leg.
export const ORIGIN_CITY = { key: 'delhi', name: 'Delhi' } as const;
