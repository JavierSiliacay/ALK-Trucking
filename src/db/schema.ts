import { pgTable, text, timestamp, varchar, decimal, uuid, index, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  seqNo: varchar("seq_no", { length: 255 }).notNull(),
  dateOfTravel: timestamp("date_of_travel").notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  owner: varchar("owner", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 255 }).notNull(),
  plateNo: varchar("plate_no", { length: 255 }).notNull(),
  driver: varchar("driver", { length: 255 }).notNull(),
  helper1: varchar("helper1", { length: 255 }),
  helper2: varchar("helper2", { length: 255 }),
  origin: varchar("origin", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  distance: varchar("distance", { length: 255 }),
  gatePassNo: varchar("gate_pass_no", { length: 255 }),
  gatePassDate: timestamp("gate_pass_date"),
  rate: decimal("rate", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  dateIdx: index("date_idx").on(table.dateOfTravel),
  statusIdx: index("status_idx").on(table.status),
  createdIdx: index("created_idx").on(table.createdAt),
}));

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 255 }).notNull(),
  dateRequest: timestamp("date_request"),
  rsNo: varchar("rs_no", { length: 255 }),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  remarks: text("remarks"),
});

export const tripsRelations = relations(trips, ({ many }) => ({
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  trip: one(trips, {
    fields: [expenses.tripId],
    references: [trips.id],
  }),
}));

export const drivers = pgTable("drivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const helpers = pgTable("helpers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trucks = pgTable("trucks", {
  id: uuid("id").primaryKey().defaultRandom(),
  unit: varchar("unit", { length: 255 }).notNull(),
  plateNo: varchar("plate_no", { length: 255 }).notNull().unique(),
  owner: varchar("owner", { length: 255 }).notNull().default("ALK Trucking"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("ADMIN"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
