export const queryKeys = {
  guests: {
    all: () => ['guests'] as const,
    allergiesMap: (guestIdsCsv: string) => ['guestAllergiesMap', guestIdsCsv] as const,
  },
  dishes: {
    all: () => ['dishes'] as const,
    allergensMap: (dishIdsCsv: string) => ['dishAllergensMap', dishIdsCsv] as const,
  },
  meals: {
    all: () => ['meals'] as const,
    guests: (mealId: string) => ['mealGuests', mealId] as const,
    menu: (mealId: string, includeUnsafe: boolean) => ['mealMenu', mealId, includeUnsafe] as const,
  },
  guestRank: {
    byToken: (rankToken: string) => ['guestRank', rankToken] as const,
  },
};
