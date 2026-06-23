/* Food experience imagery — owner-provided dishes mapped to IVY destinations.
   Used by the Food experience card/page and the estimator's Food theme. */
export interface FoodShot { dest: string; name: string; dish: string; src: string; alt: string }
export const FOOD_SHOTS: FoodShot[] = [
  { dest: 'varanasi', name: 'Varanasi', dish: 'Kachori Sabzi', src: '/assets/food/varanasi-kachori-sabzi.webp', alt: 'Banarasi kachori sabzi, a classic morning street breakfast in Varanasi' },
  { dest: 'amritsar', name: 'Amritsar', dish: 'Amritsari Kulcha', src: '/assets/food/amritsar-kulcha.jpeg', alt: 'Amritsari kulcha with chole, a Punjabi old-city staple' },
  { dest: 'jaipur',   name: 'Jaipur',   dish: 'Dal Baati Churma', src: '/assets/food/jaipur-dal-baati-churma.jpeg', alt: 'Rajasthani dal baati churma served with ghee and chutney' },
  { dest: 'jodhpur',  name: 'Jodhpur',  dish: 'Makhaniya Lassi', src: '/assets/food/jodhpur-makhaniya-lassi.jpg', alt: 'Makhaniya lassi in clay kulhads, a Jodhpur speciality' },
  { dest: 'agra',     name: 'Agra',     dish: 'Agra Petha', src: '/assets/food/agra-petha.jpeg', alt: 'Translucent Agra petha, the city’s signature sweet' },
  { dest: 'udaipur',  name: 'Udaipur',  dish: 'Dal Baati Churma', src: '/assets/food/udaipur-dal-baati-churma.jpeg', alt: 'Mewari dal baati churma on a brass thali' },
];
