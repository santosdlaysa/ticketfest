import type { ValidationResult } from '../stores/validationStore';

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

export type MainStackParamList = {
  HomeTabs: undefined;
};

export type HomeTabsParamList = {
  Home: undefined;
  MyTickets: undefined;
  Validation: undefined;
  Lists: undefined;
  Profile: undefined;
};

// Stack de Validacao
export type ValidationStackParamList = {
  EventSelection: undefined;
  TicketScanner: undefined;
  ValidationResult: { result: ValidationResult };
  ManualValidation: undefined;
  ValidationHistory: undefined;
};

// Stack dentro da tab Home
export type HomeStackParamList = {
  HomeMain: undefined;
  EventDetails: { eventId: string };
  Cart: undefined;
  Checkout: undefined;
  Payment: undefined;
  OrderDetails: { orderId: string };
  Orders: undefined;
};

// Stack dentro da tab Ingressos
export type TicketsStackParamList = {
  MyTicketsMain: undefined;
  TicketDetails: {
    ticket: {
      id: string;
      ticketName: string;
      eventName: string;
      eventDate: string;
      eventLocation: string;
      qrCode: string;
      qrCodeData: string;
      checkedIn: boolean;
      checkedInAt?: string;
      orderId: string;
      orderDate: string;
      orderTotal: number;
      paymentStatus: string;
      paymentMethod: string;
      ticketPrice: number;
    };
  };
};

// Stack dentro da tab Listas
export type ListsStackParamList = {
  ListsMain: undefined;
  PromoterList: { listId: string };
};

// Stack dentro da tab Perfil
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  PaymentMethods: undefined;
  LocationSettings: undefined;
  HelpCenter: undefined;
  About: undefined;
  Favorites: undefined;
  ApiLogs: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};
