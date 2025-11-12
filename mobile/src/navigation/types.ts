// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  HomeTabs: undefined;
  EventDetails: { eventId: string };
  Cart: undefined;
  Checkout: undefined;
};

export type HomeTabsParamList = {
  Home: undefined;
  MyTickets: undefined;
  Orders: undefined;
  Profile: undefined;
};
