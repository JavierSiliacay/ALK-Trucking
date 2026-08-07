import { pgTable, text, timestamp, varchar, decimal, uuid, index, boolean, jsonb } from "drizzle-orm/pg-core";
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

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  unit: varchar("unit", { length: 50 }).notNull(),
  currentStock: decimal("current_stock", { precision: 12, scale: 2 }).notNull().default("0"),
  averageUnitCost: decimal("average_unit_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inventoryTransactions = pgTable("inventory_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // "STOCK-IN" or "STOCK-OUT"
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  truckId: uuid("truck_id").references(() => trucks.id, { onDelete: "set null" }),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  transactions: many(inventoryTransactions),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryTransactions.itemId],
    references: [inventoryItems.id],
  }),
  truck: one(trucks, {
    fields: [inventoryTransactions.truckId],
    references: [trucks.id],
  }),
}));

export const maintenanceRecords = pgTable("maintenance_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  truckId: uuid("truck_id").references(() => trucks.id, { onDelete: "set null" }), // Optional for general ALK expenses
  autoworxJobId: varchar("autoworx_job_id", { length: 255 }).unique(), // Can be null if manual ALK record
  category: varchar("category", { length: 255 }),
  description: text("description").notNull(),
  autoworxVehicleDetails: varchar("autoworx_vehicle_details", { length: 255 }),
  repairBreakdown: jsonb("repair_breakdown"), // Detailed breakdown from Autoworx costing
  cost: decimal("cost", { precision: 12, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 50 }).notNull().default("Pending"), // "Pending", "Approved", "Completed"
  dateIncurred: timestamp("date_incurred").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const maintenanceRecordsRelations = relations(maintenanceRecords, ({ one }) => ({
  truck: one(trucks, {
    fields: [maintenanceRecords.truckId],
    references: [trucks.id],
  }),
}));

export const trucksRelations = relations(trucks, ({ many }) => ({
  maintenance: many(maintenanceRecords),
}));
