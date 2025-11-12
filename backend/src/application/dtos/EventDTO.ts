export interface CreateEventDTO {
  name: string;
  description: string;
  date: Date;
  endDate?: Date;
  location: string;
  address: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  category: string;
  organizerId: string;
}

export interface UpdateEventDTO {
  name?: string;
  description?: string;
  date?: Date;
  endDate?: Date;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  category?: string;
}
