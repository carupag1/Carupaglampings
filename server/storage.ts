import { users, bookings, type User, type InsertUser, type Booking, type InsertBooking } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  getCampings(): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private bookings: Map<string, Booking>;
  private campings: any[];

  constructor() {
    this.users = new Map();
    this.bookings = new Map();
    this.campings = [
      {
        id: 1,
        typeId: 1,
        name: "Aura 1",
        images: ["/assets/WhatsApp_Image_2026-01-04_at_1.03.01_PM_1767632673643.jpeg"],
        image: "/assets/WhatsApp_Image_2026-01-04_at_1.03.01_PM_1767632673643.jpeg",
        description: "Unidad Aura 1: Privacidad total con jacuzzi privado y vista al cañón.",
        features: ["Jacuzzi VIP", "Cine Privado", "Cena Especial", "Vista Premium", "Malla Catamarán", "Zona BBQ"],
        rating: 5.0
      }
      // Add more as needed or import from a shared data file
    ];
  }

  async getCampings(): Promise<any[]> {
    return this.campings;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createBooking(insertBooking: any): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = { ...insertBooking, id };
    this.bookings.set(id, booking);
    return booking;
  }
}

export const storage = new MemStorage();
