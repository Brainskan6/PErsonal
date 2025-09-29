import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, boolean, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Reusable schema building blocks
const personalInfoSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

const financialInfoSchema = z.object({
  annualIncome: z.number().min(0, "Income must be positive").optional().default(0),
  monthlyExpenses: z.number().min(0, "Expenses must be positive").optional().default(0),
});

const debtInfoSchema = z.object({
  hasDebts: z.boolean(),
  debtType: z.enum(["car-loan", "mortgage", "heloc", "personal-loan"]).optional(),
  debtInterestRate: z.number().min(0, "Interest rate must be positive").optional(),
  debtTermRemaining: z.number().min(0, "Term remaining must be positive").optional(),
  debtPayment: z.number().min(0, "Payment must be positive").optional(),
  debtPaymentFrequency: z.enum(["weekly", "bi-weekly", "monthly", "quarterly"]).optional(),
});

const propertyInfoSchema = z.object({
  hasProperties: z.boolean(),
  propertyType: z.enum(["principal-residence", "secondary-residence", "rental-property"]).optional(),
  propertyMarketValue: z.number().min(0, "Market value must be positive").optional(),
  propertyCostBasis: z.number().min(0, "Cost basis must be positive").optional(),
});

// Client Data Schema
export const clientDataSchema = z.object({
  // Personal Information
  ...personalInfoSchema.shape,

  // Second Client Information
  hasSecondClient: z.boolean().default(false),
  secondClientFirstName: z.string().optional(),
  secondClientLastName: z.string().optional(),
  secondClientDateOfBirth: z.string().optional(),

  // Second Client Financial Situation
  secondClientAnnualIncome: z.number().min(0, "Income must be positive").optional(),
  secondClientMonthlyExpenses: z.number().min(0, "Expenses must be positive").optional(),

  // Second Client Debt Information
  secondClientHasDebts: z.boolean().optional(),
  secondClientDebtType: z.enum(["car-loan", "mortgage", "heloc", "personal-loan"]).optional(),
  secondClientDebtInterestRate: z.number().min(0, "Interest rate must be positive").optional(),
  secondClientDebtTermRemaining: z.number().min(0, "Term remaining must be positive").optional(),
  secondClientDebtPayment: z.number().min(0, "Payment must be positive").optional(),
  secondClientDebtPaymentFrequency: z.enum(["weekly", "bi-weekly", "monthly", "quarterly"]).optional(),

  // Second Client Properties
  secondClientHasProperties: z.boolean().optional(),
  secondClientPropertyType: z.enum(["principal-residence", "secondary-residence", "rental-property"]).optional(),
  secondClientPropertyMarketValue: z.number().min(0, "Market value must be positive").optional(),
  secondClientPropertyCostBasis: z.number().min(0, "Cost basis must be positive").optional(),

  // Second Client Retirement Planning
  secondClientDesiredRetirementAge: z.number().min(50, "Retirement age must be at least 50").max(75, "Retirement age must be at most 75").optional(),
  secondClientRetirementSpendingGoal: z.number().min(0, "Retirement spending goal must be positive").optional(),

  // Second Client Government Benefits
  secondClientQppCurrentlyReceiving: z.boolean().optional(),
  secondClientQppCurrentAmount: z.number().min(0, "QPP amount must be positive").optional(),
  secondClientQppExpectedAmount: z.number().min(0, "QPP expected amount must be positive").optional(),
  secondClientOasCurrentlyReceiving: z.boolean().optional(),
  secondClientOasCurrentAmount: z.number().min(0, "OAS amount must be positive").optional(),
  secondClientOasExpectedAmount: z.number().min(0, "OAS expected amount must be positive").optional(),

  // Second Client Insurance Information
  secondClientHasInsurance: z.boolean().optional(),
  secondClientInsuranceDeathBenefit: z.number().min(0, "Death benefit must be positive").optional(),
  secondClientInsuranceType: z.enum(["term", "permanent"]).optional(),
  secondClientInsuranceTermYearsRemaining: z.number().min(0, "Years remaining must be positive").optional(),
  secondClientInsuranceAnnualPremiums: z.number().min(0, "Annual premiums must be positive").optional(),
  secondClientInsuranceWithEmployer: z.boolean().optional(),

  // Second Client Legal Documents
  secondClientHasWill: z.boolean().optional(),
  secondClientWillLastUpdated: z.string().optional(),

  // Second Client Other Financial Institutions
  secondClientHasAssetsOFI: z.boolean().optional(),
  secondClientAssetsOFIDetails: z.string().optional(),

  // Second Client TFSA Information
  secondClientTfsaMaximizedYearly: z.boolean().optional(),

  // Second Client Goals and Preferences
  secondClientFinancialGoals: z.string().optional(),
  secondClientRiskTolerance: z.enum(["conservative", "conservative-income", "balanced-income", "balanced", "balanced-growth", "growth"]).optional(),
  secondClientAdditionalComments: z.string().optional(),

  // Investment Advisory Fee
  investmentAdviceFee: z.number().min(0, "Investment advice fee must be non-negative").max(10, "Investment advice fee cannot exceed 10%"),

  // Client 1 fields
  annualIncome: z.number().min(0, "Income must be positive").optional().default(0),
  monthlyExpenses: z.number().min(0, "Expenses must be positive").optional().default(0),

  // Debt Information
  hasDebts: z.boolean(),
  debtType: z.enum(["car-loan", "mortgage", "heloc", "personal-loan"]).optional(),
  debtInterestRate: z.number().min(0, "Interest rate must be positive").optional(),
  debtTermRemaining: z.number().min(0, "Term remaining must be positive").optional(),
  debtPayment: z.number().min(0, "Payment must be positive").optional(),
  debtPaymentFrequency: z.enum(["weekly", "bi-weekly", "monthly", "quarterly"]).optional(),

  // Properties
  hasProperties: z.boolean(),
  propertyType: z.enum(["principal-residence", "secondary-residence", "rental-property"]).optional(),
  propertyMarketValue: z.number().min(0, "Market value must be positive").optional(),
  propertyCostBasis: z.number().min(0, "Cost basis must be positive").optional(),

  // Goals and Comments
  financialGoals: z.string().optional(),
  riskTolerance: z.enum(["conservative", "conservative-income", "balanced-income", "balanced", "balanced-growth", "growth"]).default("balanced"),

  // Retirement Planning
  desiredRetirementAge: z.number().min(50, "Retirement age must be at least 50").max(75, "Retirement age must be at most 75").optional().default(65),
  retirementSpendingGoal: z.number().min(0, "Retirement spending goal must be positive").optional().default(0),

  // Government Benefits
  qppCurrentlyReceiving: z.boolean().default(false),
  qppCurrentAmount: z.number().min(0, "QPP amount must be positive").optional(),
  qppExpectedAmount: z.number().min(0, "QPP expected amount must be positive").optional(),
  oasCurrentlyReceiving: z.boolean().default(false),
  oasCurrentAmount: z.number().min(0, "OAS amount must be positive").optional(),
  oasExpectedAmount: z.number().min(0, "OAS expected amount must be positive").optional(),

  // Insurance Information
  hasInsurance: z.boolean().default(false),
  insuranceDeathBenefit: z.number().min(0, "Death benefit must be positive").optional(),
  insuranceType: z.enum(["term", "permanent"]).optional(),
  insuranceTermYearsRemaining: z.number().min(0, "Years remaining must be positive").optional(),
  insuranceAnnualPremiums: z.number().min(0, "Annual premiums must be positive").optional(),
  insuranceWithEmployer: z.boolean().optional(),

  // Legal Documents
  hasWill: z.boolean().default(false),
  willLastUpdated: z.string().optional(),

  // Other Financial Institutions
  hasAssetsOFI: z.boolean().default(false),
  assetsOFIDetails: z.string().optional(),

  // TFSA Information
  tfsaMaximizedYearly: z.boolean().default(false),

  // Relationship Status
  inRelationship: z.boolean().default(false),
  relationshipType: z.enum(["married", "common-law"]).optional(),
  hasCohabitationAgreement: z.boolean().optional(),

  additionalComments: z.string().optional(),
});

// Strategy Input Field Schema
export const strategyInputFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["text", "number", "select", "textarea", "date", "toggle"]),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // For select fields
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  conditionalText: z.object({
    whenTrue: z.string().optional(),
    whenFalse: z.string().optional(),
  }).optional(), // For toggle fields
});

// Enhanced Strategy Schema
export const strategySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  section: z.string(), // Which report section this strategy belongs to
  content: z.string(), // Template content with placeholders like {{amount}}
  inputFields: z.array(strategyInputFieldSchema).default([]),
  isCustom: z.boolean().default(false), // For future manually added strategies
});

// Client Strategy Configuration Schema
export const clientStrategyConfigSchema = z.object({
  strategyId: z.string(),
  isEnabled: z.boolean(),
  inputValues: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});

// Report Schema
export const reportSchema = z.object({
  id: z.string(),
  clientData: clientDataSchema,
  strategyConfigurations: z.array(clientStrategyConfigSchema),
  generatedReport: z.string(),
  createdAt: z.date().default(() => new Date()),
});

// Partial client data schema for auto-save functionality
export const partialClientDataSchema = clientDataSchema.partial();

export type ClientData = z.infer<typeof clientDataSchema>;
export type PartialClientData = z.infer<typeof partialClientDataSchema>;
export type Strategy = z.infer<typeof strategySchema>;
export type StrategyInputField = z.infer<typeof strategyInputFieldSchema>;
export type ClientStrategyConfig = z.infer<typeof clientStrategyConfigSchema>;
export type Report = z.infer<typeof reportSchema>;
export type InsertClientData = z.infer<typeof clientDataSchema>;
export type InsertReport = Omit<z.infer<typeof reportSchema>, 'id' | 'createdAt'>;

// Custom Strategy Schema for manually added strategies
export const customStrategySchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  section: z.string().optional(),
  isSelected: z.boolean().default(false),
});

export type CustomStrategy = z.infer<typeof customStrategySchema>;

// Session storage table for Replit Auth
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Legacy insert user schema for backward compatibility
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;