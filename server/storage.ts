import { type ClientData, type InsertClientData, type Strategy, type Report, type InsertReport, type ClientStrategyConfig, type User, type UpsertUser, type CustomStrategy, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface for financial planning application
export interface IStorage {
  // User operations - REQUIRED for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Client data methods
  saveClientData(userId: string, data: InsertClientData): Promise<ClientData>;
  savePartialClientData(userId: string, data: Partial<ClientData>): Promise<Partial<ClientData>>;
  getClientData(userId: string): Promise<ClientData | undefined>;

  // Strategy methods
  getStrategies(): Promise<Strategy[]>;
  getStrategy(id: string): Promise<Strategy | undefined>;
  addStrategy(strategy: Omit<Strategy, 'id'>): Promise<Strategy>;

  // Custom Strategy methods
  getCustomStrategies(): Promise<CustomStrategy[]>;
  addCustomStrategy(strategy: { title: string; content: string; section?: string; subsection?: string }): Promise<CustomStrategy>;
  removeCustomStrategy(id: string): Promise<boolean>;
  updateCustomStrategy(id: string, updates: { title: string; content: string; section: string; subsection?: string }): Promise<any>;

  // Client Strategy Configuration methods
  saveClientStrategyConfigs(userId: string, configs: ClientStrategyConfig[]): Promise<ClientStrategyConfig[]>;
  getClientStrategyConfigs(userId: string): Promise<ClientStrategyConfig[]>;

  // Report methods
  saveReport(report: InsertReport): Promise<Report>;
  getReport(id: string): Promise<Report | undefined>;
  getReports(): Promise<Report[]>;
}


export class MemStorage implements IStorage {
  private clientData: Map<string, ClientData>;
  private strategies: Map<string, Strategy>;
  private reports: Map<string, Report>;
  private clientStrategyConfigs: Map<string, ClientStrategyConfig[]>;
  private customStrategies: Map<string, CustomStrategy>;
  private users: Map<string, User>;

  // Cache for frequently accessed data
  private strategiesByCategory: Map<string, Strategy[]> = new Map();
  private strategiesBySection: Map<string, Strategy[]> = new Map();
  private strategiesBySubsection: Map<string, Strategy[]> = new Map(); // Added cache for subsections
  private cacheInvalidated: boolean = true;

  constructor() {
    this.clientData = new Map();
    this.strategies = new Map();
    this.reports = new Map();
    this.clientStrategyConfigs = new Map();
    this.customStrategies = new Map();
    this.users = new Map();

    // Initialize default strategies
    this.initializeDefaultStrategies();
  }

  // User operations - REQUIRED for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);

    if (existingUser) {
      // Update existing user
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      } as User;
      this.users.set(userData.id!, updatedUser);
      return updatedUser;
    } else {
      // Create new user
      const newUser: User = {
        id: userData.id || randomUUID(),
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(newUser.id, newUser);
      return newUser;
    }
  }

  // Legacy methods for backward compatibility
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const newUser: User = {
      id: randomUUID(),
      email: insertUser.email || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  // Client data methods
  async saveClientData(userId: string, data: InsertClientData): Promise<ClientData> {
    const clientData: ClientData = { ...data, userId }; // Ensure userId is part of the stored data if needed by other methods
    this.clientData.set(userId, clientData);
    console.log('Client data saved for user:', userId);
    console.log('Saved data keys:', Object.keys(clientData));
    return clientData;
  }

  async savePartialClientData(userId: string, data: Partial<ClientData>): Promise<Partial<ClientData>> {
    const existingData = this.clientData.get(userId) || {};
    // Merge new data with existing data
    const mergedData = { ...existingData, ...data, userId }; // Ensure userId is part of the stored data if needed by other methods

    this.clientData.set(userId, mergedData as ClientData);
    console.log('Partial client data saved for user:', userId);
    console.log('Merged data keys:', Object.keys(mergedData));
    return mergedData;
  }

  async getClientData(userId: string): Promise<ClientData | undefined> {
    return this.clientData.get(userId);
  }

  // Added methods to satisfy the interface and provided changes, adapted for Map
  async getCurrentClientData(userId: string): Promise<ClientData | undefined> {
    return this.clientData.get(userId);
  }

  async getAllClientData(userId: string): Promise<ClientData[]> {
    const data = this.clientData.get(userId);
    return data ? [data] : [];
  }

  async deleteClientData(userId: string): Promise<boolean> {
    return this.clientData.delete(userId);
  }

  // Strategy methods
  async getStrategies(): Promise<Strategy[]> {
    return Array.from(this.strategies.values());
  }

  async getStrategy(id: string): Promise<Strategy | undefined> {
    return this.strategies.get(id);
  }

  // Report methods
  async saveReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      ...insertReport,
      id,
      createdAt: new Date()
    };
    this.reports.set(id, report);
    return report;
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  // Client Strategy Configuration methods
  async saveClientStrategyConfigs(userId: string, configs: ClientStrategyConfig[]): Promise<ClientStrategyConfig[]> {
    this.clientStrategyConfigs.set(userId, configs);
    return configs;
  }

  async getClientStrategyConfigs(userId: string): Promise<ClientStrategyConfig[]> {
    return this.clientStrategyConfigs.get(userId) || [];
  }

  async getCurrentClientStrategyConfigs(userId: string): Promise<ClientStrategyConfig[]> {
    return this.getClientStrategyConfigs(userId);
  }

  async addStrategy(strategy: Omit<Strategy, 'id'>): Promise<Strategy> {
    const id = `custom-${Date.now()}-${strategy.title.toLowerCase().replace(/\s+/g, '-')}`;
    const newStrategy = { ...strategy, id };
    this.strategies.set(id, newStrategy);
    this.cacheInvalidated = true;
    console.log(`Added new strategy: ${newStrategy.title} (ID: ${id})`);
    return newStrategy;
  }

  async updateStrategy(id: string, updates: Partial<Strategy>): Promise<Strategy | null> {
    const existingStrategy = this.strategies.get(id);
    if (!existingStrategy) {
      return null;
    }

    const updatedStrategy = { ...existingStrategy, ...updates, id };
    this.strategies.set(id, updatedStrategy);
    this.cacheInvalidated = true;
    console.log(`Updated strategy: ${updatedStrategy.title} (ID: ${id})`);
    return updatedStrategy;
  }

  async deleteStrategy(id: string): Promise<boolean> {
    const deleted = this.strategies.delete(id);
    if (deleted) {
      this.cacheInvalidated = true;
      console.log(`Deleted strategy with ID: ${id}`);
      // Also remove from any client configurations
      for (const [clientId, configs] of this.clientStrategyConfigs.entries()) {
        const filteredConfigs = configs.filter(config => config.strategyId !== id);
        if (filteredConfigs.length !== configs.length) {
          this.clientStrategyConfigs.set(clientId, filteredConfigs);
        }
      }
    }
    return deleted;
  }

  private rebuildCache(): void {
    if (!this.cacheInvalidated) return;

    this.strategiesByCategory.clear();
    this.strategiesBySection.clear();
    this.strategiesBySubsection.clear(); // Clear subsection cache

    const allStrategies = Array.from(this.strategies.values());

    // Build category cache
    allStrategies.forEach(strategy => {
      if (!this.strategiesByCategory.has(strategy.category)) {
        this.strategiesByCategory.set(strategy.category, []);
      }
      this.strategiesByCategory.get(strategy.category)!.push(strategy);
    });

    // Build section cache
    allStrategies.forEach(strategy => {
      if (strategy.section) {
        if (!this.strategiesBySection.has(strategy.section)) {
          this.strategiesBySection.set(strategy.section, []);
        }
        this.strategiesBySection.get(strategy.section)!.push(strategy);
      }
    });

    // Build subsection cache
    allStrategies.forEach(strategy => {
      if (strategy.subsection) {
        if (!this.strategiesBySubsection.has(strategy.subsection)) {
          this.strategiesBySubsection.set(strategy.subsection, []);
        }
        this.strategiesBySubsection.get(strategy.subsection)!.push(strategy);
      }
    });


    this.cacheInvalidated = false;
  }

  async getStrategiesByCategory(category: string): Promise<Strategy[]> {
    this.rebuildCache();
    return this.strategiesByCategory.get(category) || [];
  }

  async getStrategiesBySection(section: string): Promise<Strategy[]> {
    this.rebuildCache();
    return this.strategiesBySection.get(section) || [];
  }

  async getStrategiesBySubsection(subsection: string): Promise<Strategy[]> {
    this.rebuildCache();
    return this.strategiesBySubsection.get(subsection) || [];
  }

  async exportStrategies(): Promise<Strategy[]> {
    return Array.from(this.strategies.values()).filter(s => s.isCustom);
  }

  async importStrategies(strategies: Strategy[]): Promise<Strategy[]> {
    const importedStrategies: Strategy[] = [];

    for (const strategy of strategies) {
      const newId = `imported-${Date.now()}-${strategy.title.toLowerCase().replace(/\s+/g, '-')}`;
      const importedStrategy = { ...strategy, id: newId, isCustom: true };
      this.strategies.set(newId, importedStrategy);
      importedStrategies.push(importedStrategy);
    }

    console.log(`Imported ${importedStrategies.length} strategies`);
    return importedStrategies;
  }

  // Custom Strategy methods
  async getCustomStrategies(): Promise<CustomStrategy[]> {
    // Assuming customStrategies map stores all custom strategies, regardless of userId for now.
    // If user-specific custom strategies are needed, a different storage mechanism or keying strategy would be required.
    return Array.from(this.customStrategies.values());
  }

  async addCustomStrategy(strategy: { title: string; content: string; section?: string; subsection?: string }): Promise<CustomStrategy> {
    const id = `custom-${Date.now()}-${strategy.title.toLowerCase().replace(/\s+/g, '-')}`;
    const customStrategy: CustomStrategy = {
      id,
      title: strategy.title,
      content: strategy.content,
      section: strategy.section,
      subsection: strategy.subsection,
      isSelected: false
    };
    this.customStrategies.set(id, customStrategy);
    // Add to strategies map as well to ensure it's cached and sortable
    this.strategies.set(id, { ...customStrategy, category: 'Custom', description: '', isCustom: true });
    this.cacheInvalidated = true;
    return customStrategy;
  }

  async updateCustomStrategy(id: string, updates: { title: string; content: string; section: string; subsection?: string }): Promise<any> {
    const strategy = this.customStrategies.get(id);
    if (!strategy) {
      return null;
    }

    strategy.title = updates.title;
    strategy.content = updates.content;
    strategy.section = updates.section;
    if (updates.subsection !== undefined) {
      strategy.subsection = updates.subsection;
    }

    // Update in the main strategies map as well
    const existingStrategyInMainMap = this.strategies.get(id);
    if (existingStrategyInMainMap) {
      this.strategies.set(id, {
        ...existingStrategyInMainMap,
        title: updates.title,
        content: updates.content,
        section: updates.section,
        subsection: updates.subsection
      });
      this.cacheInvalidated = true;
    }

    await this.save(); // Assuming save persists changes, though MemStorage doesn't need it.
    return strategy;
  }

  async removeCustomStrategy(id: string): Promise<boolean> {
    // Remove from both customStrategies and strategies maps
    const deletedFromCustom = this.customStrategies.delete(id);
    const deletedFromStrategies = this.strategies.delete(id);
    if (deletedFromCustom || deletedFromStrategies) {
      this.cacheInvalidated = true;
    }
    return deletedFromCustom;
  }

  private initializeDefaultStrategies() {
    // Add some default strategies if none exist
    if (this.strategies.size === 0) { // Changed from .length === 0 to .size === 0 for Map
      const defaultStrategies: Strategy[] = [
        // RECOMMENDATIONS SECTION
        {
          id: "rec-automatic-savings-rrsp-tfsa",
          title: "Implement Automatic Savings Program",
          description: "Set up automated contributions to RRSP and TFSA accounts",
          category: "Recommendations",
          section: "recommendations",
          content: "Once the transfer of your assets to TD Wealth and the recommended portfolio changes are complete, we can implement an automatic savings program to (EACH OF) your RRSPs and your TFSA(S).",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-portfolio-changes-savings",
          title: "Portfolio Changes and Automated Savings",
          description: "Implement portfolio changes with automatic contribution plan",
          category: "Recommendations",
          section: "recommendations",
          content: "With your approval we will make the recommended portfolio changes and we can implement an automatic savings program to (EACH OF) your RRSPs and your TFSA(S).",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-resp-documents",
          title: "RESP Account Documentation",
          description: "Provide required documents to open RESP account",
          category: "Recommendations",
          section: "recommendations",
          content: "Provide birth certificate and SIN of children to open RESP account.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-monthly-contribution-plan",
          title: "Monthly Contribution Plan Setup",
          description: "Establish regular contribution and investment plan",
          category: "Recommendations",
          section: "recommendations",
          content: "Set-up monthly contribution plan and systematic investment plan.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-business-structure-consultation",
          title: "Business Structure Consultation",
          description: "Review optimal business structure with advisors",
          category: "Recommendations",
          section: "recommendations",
          content: "I suggest that you consult with your tax and legal advisors to discuss what form of business structure is most appropriate for you.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-business-succession-advisor",
          title: "Business Succession Planning",
          description: "Meet with succession advisor for business strategies",
          category: "Recommendations",
          section: "recommendations",
          content: "I would like to introduce you to a TD Wealth Business Succession Advisor to discuss possible strategies specific to your circumstances.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-major-purchase-savings",
          title: "Major Purchase Savings Plan",
          description: "Implement savings plan for large purchase",
          category: "Recommendations",
          section: "recommendations",
          content: "Implement savings plan towards major purchase goal.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-meet-specialist",
          title: "Meet with Specialist",
          description: "Consultation with financial specialist",
          category: "Recommendations",
          section: "recommendations",
          content: "Meet with (NAME, BUSINESS). They will be able to review your needs and provide solutions for you.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-tax-planning-review",
          title: "Tax Planning Strategy Review",
          description: "Discuss tax planning with specialist",
          category: "Recommendations",
          section: "recommendations",
          content: "I would like to introduce you to (NAME, BUSINESS), so that you can review and discuss your tax planning strategies further.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-asset-consolidation",
          title: "Asset Consolidation",
          description: "Consolidate assets for better control and efficiency",
          category: "Recommendations",
          section: "recommendations",
          content: "I recommend that you consider consolidating your assets to achieve greater control and flexibility to ensure more effective diversification and tax efficiency.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-charitable-donation",
          title: "Complete Charitable Donation",
          description: "Process donation of securities to charity",
          category: "Recommendations",
          section: "recommendations",
          content: "Complete process to donate selected (SHARES/UNITS) to the charitable organization of your choice.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-insurance-review",
          title: "Insurance Options Review",
          description: "Review insurance coverage needs",
          category: "Recommendations",
          section: "recommendations",
          content: "Meet with (NAME, BUSINESS) to review your insurance options.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-will-poa-review",
          title: "Will and Power of Attorney Review",
          description: "Update estate planning documents",
          category: "Recommendations",
          section: "recommendations",
          content: "We recommend that you both schedule a meeting with your lawyer to ensure that your respective Will(s) and respective Power(s) of Attorney for Property and Personal Care are drafted and are a clear reflection of your current intentions.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-charitable-giving-follow-up",
          title: "Charitable Giving Follow-up",
          description: "Schedule meeting to discuss charitable goals",
          category: "Recommendations",
          section: "recommendations",
          content: "Once you have had an opportunity to review this information, we can schedule a follow-up meeting to discuss your charitable giving goals.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-estate-documentation-review",
          title: "Periodic Estate Documentation Review",
          description: "Regular review of estate documents",
          category: "Recommendations",
          section: "recommendations",
          content: "Review your estate documentation periodically to ensure that your wishes appropriately reflect your current circumstances.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-td-liquidator",
          title: "Corporate Liquidator Consideration",
          description: "Consider TD Canada Trust as estate liquidator",
          category: "Recommendations",
          section: "recommendations",
          content: "We recommend considering appointing TD Canada Trust as liquidator or co-liquidator to guide you through the complex and lengthy process of Estate settlement. We can schedule a brief meeting with one of our specialists to explore your options.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-cross-border-specialist",
          title: "Cross-Border Tax and Estate Specialist",
          description: "Consult specialist for cross-border matters",
          category: "Recommendations",
          section: "recommendations",
          content: "Consider meeting a cross-border tax and estate specialist to discuss the particulars of your situation.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-plan-assumptions",
          title: "Plan Assumptions Modification",
          description: "Review modified assumptions in financial plan",
          category: "Recommendations",
          section: "recommendations",
          content: "Within your plan (insert plan name if a What If), we have modified the (insert field name) from the default assumptions as follows; (detail assumption used within plan and supporting information)",
          inputFields: [],
          isCustom: false
        },

        // BUILDING NET WORTH SECTION
        {
          id: "bnw-investment-profile",
          title: "Investment Profile Selection",
          description: "Determine appropriate investment product and profile",
          category: "Objectives",
          section: "buildNetWorth",
          content: "In our discussions we have discussed your investment profile(s) and have determined that we will invest your (insert account) in a (insert profile) investment product. (repeat as needed based on client's overall portfolio if different risk profiles are used)",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-return-projections",
          title: "Projection Rate of Return",
          description: "Conservative rate assumptions for long-term goals",
          category: "Objectives",
          section: "buildNetWorth",
          content: "In our analysis we have used a (%) rate of return to create the projections towards your (insert goal ie: Planning for retirement) This rate may be more conservative than your stated investor profile as it represents a long-term projection. Please note this rate does not represent actual investment performance and is not guaranteed. (repeat as needed for each goal.)",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-retirement-goals",
          title: "Retirement Income Goals",
          description: "Define retirement timeline and income targets",
          category: "Objectives",
          section: "buildNetWorth",
          content: "Client would like to retire soon this year and Client2, in 3 years, with an initial after-tax income goal of $90,000 per year in today's dollars. You are both Canadian citizens and residents of Quebec for income tax and estate purposes.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-qpp-planning",
          title: "Quebec Pension Plan (QPP) Strategy",
          description: "Optimize QPP benefit timing and amounts",
          category: "Objectives",
          section: "buildNetWorth",
          content: "The Canada Pension Plan (QPP) is a contributory pension plan, and therefore the amount of QPP benefit you receive in retirement is based entirely on the amount you have contributed to the QPP during your working years. Deciding when to begin receiving your QPP retirement pension is a very common consideration for most Quebec residents approaching retirement. When deciding when to take your QPP retirement pension, it's important to consider life expectancy, other sources of income and your overall level of taxation, both now and in future years. With regards to your entitlements, we have used the data available from your most recent statement for an amount of $$$ per month. For a more accurate projection, we recommend contacting Retraite Quebec to obtain your individual QPP Statement of Participation.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-qpp-current-benefits",
          title: "Current QPP Entitlements",
          description: "Track current QPP benefits received",
          category: "Objectives",
          section: "buildNetWorth",
          content: "You are currently receiving your Quebec Pension Plan (QPP) entitlements. These amount to $XXX a year.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-oas-planning",
          title: "Old Age Security (OAS) Strategy",
          description: "Maximize OAS benefits and minimize clawback",
          category: "Objectives",
          section: "buildNetWorth",
          content: "Old Age Security (OAS) is a retirement pension program available to most Canadian residents who are age 65 and older. The OAS program is income tested, meaning that when your income reaches a certain level, you will begin to lose access to OAS benefits. Your OAS retirement benefits are gradually reduced as your overall income increases beyond a specific threshold. This gradual reduction is called OAS claw back. The threshold for OAS claw back for the 2024 tax year is $90,997, although this number increases each year with inflation. When your net income is above this amount, your OAS benefits will be clawed back by 15 cents for every $1 of income above the threshold. We have included a maximum benefit of 100 % Old Age Security (OAS) entitlement for each of you starting at age 65. The plan will automatically calculate and reflect any year where the OAS claw back is triggered.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-rregop-pension",
          title: "RREGOP Pension Benefits",
          description: "Track employer pension with cost-of-living adjustments",
          category: "Objectives",
          section: "buildNetWorth",
          content: "XXX, you have a RREGOP Pension with benefits of $2,310 per month. Your cost-of-living adjustment has been estimated at 1.5%, in line with current expectations.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-retirement-scenarios",
          title: "Additional Retirement Scenarios",
          description: "Multiple scenario planning for retirement",
          category: "Objectives",
          section: "buildNetWorth",
          content: "In addition to the \"Base Plan\", we have prepared three additional scenarios entitled \"Max retirement spending\", \"Market crash and max spending\", and \"Retire early\", respectively.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-sequence-risk",
          title: "Sequence of Returns Risk Mitigation",
          description: "Manage early retirement market downturn risk",
          category: "Objectives",
          section: "buildNetWorth",
          content: "Considering that your investments provide a significant portion of your retirement income, a major market downturn in the early years of your retirement - often referred to as \"sequence of returns risk\" - could make recovery more difficult, as withdrawals during a downturn can permanently erode your capital. To help mitigate this risk, one effective strategy is to consider delaying retirement. Retiring later allows you to continue contributing to your investments and reduce the number of years your savings need to support you.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-real-estate-cushion",
          title: "Real Estate Equity as Financial Cushion",
          description: "Leverage property equity for retirement security",
          category: "Objectives",
          section: "buildNetWorth",
          content: "According to our projections you are currently on track to meet your retirement goal, assuming expected returns and spending patterns remain within a reasonable range. In the event of adverse market conditions that significantly affect the performance of your investment portfolio. You have an important financial cushion: the equity of your real estate holdings. This equity could be accessed, if needed, through options such as downsizing, refinancing, or using a reverse mortgage - providing you with additional flexibility and security to support your retirement income without compromising your long-term financial stability. Considering that your investments provide a significant portion of your retirement income, a major market downturn in the early years of your retirement - often referred to as \"sequence of returns risk\" - could make recovery more difficult, as withdrawals during a downturn can permanently erode your capital. To help mitigate this risk, one effective strategy is to consider delaying retirement. Retiring later allows you to continue contributing to your investments and reduce the number of years your savings need to support you.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-scenario-modeling",
          title: "Retirement Scenario Modeling",
          description: "Prepare for various retirement outcomes",
          category: "Objectives",
          section: "buildNetWorth",
          content: "To help you prepare for a range of possible outcomes in retirement, we've modeled three scenarios that reflect varying market conditions and spending patterns: The base scenario which includes all of our recommendations. What happens in the event of a Market Crash? What is the maximum amount of money you can afford to spend each year?",
          inputFields: [],
          isCustom: false
        },

        // PLANNING FOR RETIREMENT (Subsection of Building Net Worth)
        {
          id: "ret-qpp-timing",
          title: "QPP Collection Timing Strategy",
          description: "Optimize when to start collecting QPP benefits",
          category: "Retirement Planning",
          section: "buildNetWorth",
          subsection: "Planning for Retirement",
          content: "Since you will be drawing down your registered accounts (RRSP/LRSP) first, instead of starting to collect your QPP pensions immediately upon retirement, consider starting to collect your QPP at 65, or delay it until age 72 to maximize the pension amounts",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-tfsa-contributions",
          title: "TFSA Maximization Strategy",
          description: "Maximize tax-free savings account contributions",
          category: "Retirement Planning",
          section: "buildNetWorth",
          subsection: "Planning for Retirement",
          content: "(CLIENT 1, CLIENT 2), we recommend that you (CONTINUE/START) to maximize your annual contributions of $6,500 to (EACH OF) your TFSA(S) until you retire. Maximizing your TFSA savings allows you to take advantage of tax-free growth since income or capital gains earned on investments in your TFSA are non-taxable. Withdrawals can be made on a tax-free basis should you need to access these funds.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-rrsp-contributions",
          title: "RRSP Contribution Strategy",
          description: "Maximize retirement savings through RRSP",
          category: "Retirement Planning",
          section: "buildNetWorth",
          subsection: "Planning for Retirement",
          content: "We recommend that you (BOTH) continue to contribute (THE MAXIMUM/$ AMOUNT) to your RRSP each year until you retire.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-conservative-approach",
          title: "Conservative Retirement Investment Strategy",
          description: "Adjust investment profile for retirement stage",
          category: "Retirement Planning",
          section: "buildNetWorth",
          subsection: "Planning for Retirement",
          content: "During your retirement it may be appropriate to take a slightly more conservative approach in your investment strategy. Therefore, we recommend a (NAME OF PORTFOLIO) investor profile during your retirement stage and we have reduced the projected rate of return in retirement accordingly.",
          inputFields: [],
          isCustom: false
        },

        // PAYING DOWN DEBT (Subsection of Building Net Worth)
        {
          id: "debt-no-outstanding",
          title: "No Outstanding Property Debt",
          description: "Current debt-free status on properties",
          category: "Debt Management",
          section: "buildNetWorth",
          subsection: "Paying Down Debt",
          content: "You don't have any debts outstanding on your properties. If you find yourself needing additional liquidity to cover potential shortfalls in retirement, one option to consider is a reverse mortgage, which allows you to make use of your home equity without having to sell your property.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "debt-consolidation",
          title: "Debt Consolidation Strategy",
          description: "Reduce borrowing costs through consolidation",
          category: "Debt Management",
          section: "buildNetWorth",
          subsection: "Paying Down Debt",
          content: "Based on our discussions we recommend that you consolidate your outstanding debts to reduce the overall cost of borrowing as well as your monthly payments.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "debt-mortgage-acceleration",
          title: "Mortgage Payment Acceleration",
          description: "Increase payments to clear mortgage before retirement",
          category: "Debt Management",
          section: "buildNetWorth",
          subsection: "Paying Down Debt",
          content: "We recommend that you increase your mortgage payments by (x) in order to ensure the mortgage is paid in full before you begin your retirement.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "debt-liability-consolidation-detailed",
          title: "Detailed Liability Consolidation",
          description: "Lower interest rates and redirect savings",
          category: "Debt Management",
          section: "buildNetWorth",
          subsection: "Paying Down Debt",
          content: "As discussed, after reviewing your current liabilities, I recommend you consider consolidating these liabilities with an aim to lower your overall interest rate which can help you pay off the debt more rapidly. If you choose to implement any recommendations in regard to your liabilities, we will update your plan to help maintain accurate long-term projections. If the consolidation reduces your monthly payments, we recommend that the difference be added to your monthly savings, to increase the rate of saving towards your future objectives.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "debt-automated-savings",
          title: "Automated Monthly Contribution Plan",
          description: "Increase savings through systematic contributions",
          category: "Debt Management",
          section: "buildNetWorth",
          subsection: "Paying Down Debt",
          content: "In order to increase your overall savings, we recommend a monthly contribution plan. It will automate savings, typically lead to more money being saved, and is easier for you to manage. These funds can also be invested systematically, which can result in dollar-cost averaging savings. Should you need to make changes, we are able to change the frequency as well as the amount, and if needed, can halt or pause contributions.",
          inputFields: [],
          isCustom: false
        },

        // PLANNING FOR EDUCATION (Subsection of Building Net Worth)
        {
          id: "edu-resp-setup",
          title: "RESP Account Setup and Strategy",
          description: "Government-assisted education savings plan",
          category: "Education Planning",
          section: "buildNetWorth",
          subsection: "Planning for Education",
          content: "We recommend that you open a Registered Education Savings Plan (RESP), this is a government assisted savings plan which allows for tax-deferred growth on contributions. The federal government and some provincial governments match a portion of your contributions. As you already have a Registered Education Savings Plan (RESP), we recommend that you set-up an automated savings plan and systematic investment plan. This will help you to reach your goal and is a simple way to manage savings.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "edu-resp-grandparents",
          title: "Grandparent RESP Considerations",
          description: "Important factors for grandparent-opened RESPs",
          category: "Education Planning",
          section: "buildNetWorth",
          subsection: "Planning for Education",
          content: "An RESP may be opened by the grandparents, however it is important to note that should the children not attend a post-secondary institution and the grandparents are over the age of 71, the grandparents may not be able to transfer the funds to their RRSP accounts. As a result, it may be desirable for the RESP to be opened by the parents, and for the grandparents to provide funds for the RESP or look at other savings options.",
          inputFields: [],
          isCustom: false
        },

        // PLANNING FOR BUSINESS OWNERS (Subsection of Building Net Worth)
        {
          id: "bus-estate-freeze",
          title: "Business Estate Freeze Strategy",
          description: "Freeze business value for estate purposes",
          category: "Business Planning",
          section: "buildNetWorth",
          subsection: "Planning for Business Owners",
          content: "One option that you may want to consider is implementing an estate freeze on your business interests. It would allow other family members to become shareholders, directly or indirectly through a Family Trust, and any future growth in the value of the business would be reflected in the new shares. Your business interest would, for estate purposes, remain \"frozen\" at its current value.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bus-succession-plan",
          title: "Business Succession Planning",
          description: "Develop comprehensive succession strategy",
          category: "Business Planning",
          section: "buildNetWorth",
          subsection: "Planning for Business Owners",
          content: "A business succession plan should be considered. You could decide whether to engage a consultant or facilitator to help you, as the business owner, communicate your plan with family members and determine its feasibility from their perspective. The consultant/facilitator could also work with the family to professionalize the business and prepare for future management and ownership transitions.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bus-shareholders-agreement",
          title: "Shareholders' Agreement",
          description: "Define duties and obligations of shareholders",
          category: "Business Planning",
          section: "buildNetWorth",
          subsection: "Planning for Business Owners",
          content: "A shareholders' agreement is an important document that defines the duties and obligations of each shareholder of a private corporation. This agreement may be thought of as a set of ground rules which govern shareholders' behavior and generally contains provisions which deal with specific circumstances that may arise. As (INSERT NAME OF COMPANY) does not currently have a shareholders' agreement in place, we recommend that you meet with your corporate lawyer/Quebec notary to draft a shareholders' agreement.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bus-shareholders-review",
          title: "Shareholders' Agreement Review",
          description: "Review buy-sell provisions in agreement",
          category: "Business Planning",
          section: "buildNetWorth",
          subsection: "Planning for Business Owners",
          content: "A review of your shareholders' agreement will allow you to determine if there is a mechanism to transfer your shares to other shareholders. This is usually referred to as a 'Buy-Sell Provision.'",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bus-valuation",
          title: "Business Valuation and Sale Structure",
          description: "Determine business value and transition plan",
          category: "Business Planning",
          section: "buildNetWorth",
          subsection: "Planning for Business Owners",
          content: "To determine the value of your business and if feasible, map out how you would structure its eventual sale/transition, please seek guidance from your accountant or a business valuator.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bus-corporate-lawyer",
          title: "Corporate Legal Assistance",
          description: "Legal support for business documents and transfers",
          category: "Business Planning",
          section: "buildNetWorth",
          subsection: "Planning for Business Owners",
          content: "A corporate lawyer may also assist in areas such as drafting and updating corporate documents, revising the company's organizational documents, setting up new companies to effect tax planning strategies, or drafting and reviewing agreements and documents relating to the ownership transfer of the business assets or shares.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bus-intermediary",
          title: "Business Intermediary Services",
          description: "Prepare business for sale and maximize value",
          category: "Business Planning",
          section: "buildNetWorth",
          subsection: "Planning for Business Owners",
          content: "A business intermediary could suggest next steps to prepare your business for sale and to help you maximize the value of proceeds you will receive from the transfer of ownership.",
          inputFields: [],
          isCustom: false
        },

        // PLANNING FOR LARGE PURCHASE/EVENT (Subsection of Building Net Worth)
        {
          id: "purchase-savings-plan",
          title: "Large Purchase Savings Strategy",
          description: "Systematic savings toward major purchase goal",
          category: "Major Purchase",
          section: "buildNetWorth",
          subsection: "Planning for Large Purchase or Event",
          content: "We recommend that you save (X$) per month towards your goal and that the savings be directed to your (ACCOUNT TYPE) account.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "purchase-financing",
          title: "Purchase Financing Options",
          description: "Explore borrowing options for major purchase",
          category: "Major Purchase",
          section: "buildNetWorth",
          subsection: "Planning for Large Purchase or Event",
          content: "As you may need a (LOAN/MORTGAGE) to complete the purchase we recommend that you meet with our colleague (NAME, BUSINESS) to discuss your borrowing options.",
          inputFields: [],
          isCustom: false
        },

        // IMPLEMENTING TAX-EFFICIENT STRATEGIES - OBJECTIVES
        {
          id: "tax-liability-review",
          title: "Liability Interest Rate Review",
          description: "Assess debt reduction and payment strategies",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "As discussed, you would like to review your current liabilities to determine if interest can be reduced and/or payments increased to conclude debt payments in a shorter timeframe.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-comprehensive-approach",
          title: "Comprehensive Tax Planning Approach",
          description: "Multi-strategy tax burden reduction",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "As part of our overall approach to tax planning, we are working to identify and implement a range of strategies aimed at reducing your tax burden. This includes, but not limited to, building a tax-efficient portfolio, optimizing contributions to registered accounts, structuring the different incomes sources, income-splitting opportunities, prescribed loans, pension sharing and the potential use of trusts.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-additional-savings",
          title: "Additional Savings Direction",
          description: "Optimize allocation of increased savings",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "You have mentioned that you are comfortable increasing your current savings and would like to identify the best ways to direct the additional savings.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-efficient-portfolio",
          title: "Tax-Efficient Portfolio Building",
          description: "Explore tax-saving opportunities",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "You have expressed an interest in building a tax-efficient portfolio and would like to explore strategies for reducing your tax liability and discuss potential tax-saving opportunities.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-account-growth",
          title: "Tax Consequences of Account Growth",
          description: "Best-in-class tax efficient portfolio",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "As you accounts grows, it will become especially important to be mindful of the tax consequences. Marc will assist you in building a best-in-class tax efficient portfolio.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-non-reg-tfsa",
          title: "Non-Registered to TFSA Opportunity",
          description: "Transfer strategy for tax optimization",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "You currently have significant assets invested in your non-registered investment account; however, you have not yet maximized the amount in your TFSA.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-family-liability",
          title: "Family Tax Liability Reduction",
          description: "Strategies to reduce overall family tax",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "You have indicated that you would like to explore strategies to help reduce the overall tax liability for your family.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-charitable-donations-annual",
          title: "Annual Charitable Donations",
          description: "Track and optimize charitable giving",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "During our discussions you indicated that you donate approximately $XXX annually to various organizations.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-charitable-cash-donations",
          title: "Regular Cash Charitable Donations",
          description: "Cash donation tracking",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "During our discussions you indicated that you make regular cash donations to various charitable organizations.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-tfsa-gaps",
          title: "TFSA Contribution Room Gaps",
          description: "Identify TFSA optimization opportunities",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "You do not own any TFSA and have not yet maximized your contributions to them. Contribution room cannot be rolled over to the spouse.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-asset-consolidation-clarity",
          title: "Asset Consolidation for Clarity",
          description: "Improve wealth management through consolidation",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "Consolidating your assets into fewer institutions can significantly improve the clarity and efficiency of your overall wealth management. It simplifies tracking, reduces administrative complexity, and makes it easier to implement cohesive strategies around retirement income, tax optimization, and estate planning. A more unified view of your portfolio also helps your advisors coordinate better, ensuring that nothing is overlooked and that your goals remain aligned over time.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-spousal-coordination",
          title: "Spousal Financial Coordination",
          description: "Integrated planning for both spouses",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "When only one spouse's financial picture is visible, it limits the ability to deliver fully integrated retirement, tax, and estate planning strategies. Consolidating and coordinating assets across both spouses not only simplifies financial management but also allows for more precise planning — from income splitting to minimizing estate taxes and ensuring efficient retirement withdrawals. A shared view enhances long-term planning and helps protect both partners' financial well-being",
          inputFields: [],
          isCustom: false
        },

        // OPTIMIZE CASH FLOW (Subsection of Implementing Tax-Efficient Strategies)
        {
          id: "cashflow-private-banking",
          title: "TD Wealth Private Banking Services",
          description: "Sophisticated banking for complex needs",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "I recommend that you speak with a TD Wealth Private Banker. TD Wealth Private Banking is accustomed to providing clients – executives, business owners, professionals and their families – with a level of service that is attuned to their sophisticated banking needs. They offer integrated banking services that include access to your own personal Private Banker. Their focus is to provide personalized services and advice to help make your credit needs as economical, flexible and convenient as possible.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "cashflow-spousal-coordination",
          title: "Spousal Income Strategy Coordination",
          description: "Enhanced retirement income through coordination",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "Although this financial plan is prepared for you individually, it is worth noting that several retirement income strategies can be enhance when coordinated with the a spouse. Approaches such as income splitting, pension sharing, and optimizing the timing of withdrawals can meaningfully improve after-tax income for couples. While these strategies are not included in this plan given its individual focus, they remain important considerations for your broader retirement planning.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "cashflow-income-splitting",
          title: "Income Splitting Strategies",
          description: "Multiple methods to split income with family",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "Splitting income with family members who earn less income, and are therefore in a lower marginal tax bracket, is one way to reduce your family's overall tax burden. In your situation, I suggest that you consider the following: (Advisor to select the option(s) that apply and delete the others)\n\n- Contribute to a Spousal RRSP – since you are currently taxed at a higher marginal tax rate than your spouse, (SPOUSE NAME), an easy way to split income is for you to contribute to a spousal RRSP for (SPOUSE NAME). You will be able to claim the deduction for the contribution to the spousal RRSP (assuming you have sufficient RRSP contribution room) and (SPOUSE NAME) will be taxed on any future RRSP withdrawals, presumably at a lower tax rate. You should be aware of the attribution rule associated with spousal RRSPs. If (SPOUSE NAME) withdraws funds from the spousal RRSP in the same calendar year that you make a contribution or in either of the two following calendar years, the RRSP income will be attributed back to you.\n\n- Elect for pension income splitting – the advantage of pension income splitting is that part of your eligible pension income can be shifted to your spouse, who would be taxed at a lower marginal tax rate. If the recipient is under age 65, they may only elect to split certain types of pension income, such as lifetime annuity payments from a registered pension plan; however, amounts distributed from a registered retirement income fund (RRIF) cannot be split.\n\n- Use an income on income strategy – In general, when the higher income spouse gives money to the lower income earning spouse and the funds are used for investment purposes, the income generated attributes back to the higher income earning spouse. However, if the income is re-invested, subsequent income generated (\"second generation income\") does not attribute back to the higher income spouse. It is recommended that the income that is re-invested be invested in a separate account so that the second generation income is easily trackable.\n\n- Consider a prescribed rate loan strategy - This strategy is particularly useful when there is a low interest rate environment. The rate of interest that is prescribed by the regulations in the Income Tax Act (Canada) is currently 2%. Loans made at this rate of interest between related persons are not subject to the attribution rules; therefore, where an investment is expected to produce a return that is in excess of this rate, it may be worthwhile for the higher income spouse to loan money to the lower income spouse (and charge the 2% rate of interest on the loan every year to avoid the application of the attribution rules). The yield from the money invested (over the amount of interest charged) will then be included in the lower income spouse's income and taxed to him or her without triggering the attribution rules.\n\n- Pension share with your spouse – The CPP/QPP program allows married or common-law couples to share CPP/QPP credits earned during their contributory period based on the number of years they lived together. This allows the couple to balance CPP payments if there is a difference in their individual pensions and may result in tax savings.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "cashflow-company-withdrawals",
          title: "Tax-Efficient Corporate Withdrawals",
          description: "Salary vs dividends optimization",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "It is important to consider the most tax-efficient way of withdrawing funds from your company(ies). As earned income, your salary will be included in the amount determining RRSP contribution room and future CPP benefits. However, while your salary is a deductible expense for your company, you will be subject to tax on your salary at your marginal tax rate. Dividends, on the other hand, do not create RRSP contribution room nor CPP benefits and are not a deductible expense for your company. However, you are generally subject to tax on Canadian dividends at a lower tax rate.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "cashflow-corporate-accounts",
          title: "Corporate Account Optimization",
          description: "CDA and RDTOH utilization",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "You should consult with your accountant for advice on the specific application of the information presented to your personal situation. In addition, you may wish to meet with your accountant to determine how best to utilize the benefits of the Capital Dividend Account (CDA) and Refundable Dividend Tax on Hand (RDTOH) balances of your corporate shareholdings.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "cashflow-in-kind-donations",
          title: "In-Kind Securities Donations",
          description: "Eliminate capital gains tax on charitable gifts",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "Instead of making cash donations you may consider making in-kind donations as there is no tax on capital gains when you donate publicly traded shares/mutual funds or segregated funds in-kind to a charity.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "cashflow-securities-charity",
          title: "Donate Appreciated Securities to Charity",
          description: "Zero capital gains inclusion on charitable donations",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "Since you own publicly traded securities in your non-registered account that have increased significantly in value, you may owe capital gains tax when you sell them. If you donate the securities to charity, you can meet your charitable giving goals as the capital gain inclusion rate is reduced to zero. In addition, you will receive a charitable receipt for this donation, which can be used to reduce your income tax liability.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "cashflow-non-reg-tax-efficiency",
          title: "Non-Registered Account Tax Structuring",
          description: "Structure investments for tax efficiency",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "Since a portion of your investments is held in a Non-Registered account, it becomes especially important to manage the portfolio with tax efficiency in mind. Danny can help you structure the investments in a way that reduces unnecessary taxation and support your long-term goals.",
          inputFields: [],
          isCustom: false
        },

        // RETIREMENT INCOME PLANNING (Subsection of Implementing Tax-Efficient Strategies)
        {
          id: "ret-income-conversion",
          title: "Retirement Product Conversion",
          description: "Convert savings to income products",
          category: "Retirement Income",
          section: "implementingTaxStrategies",
          subsection: "Retirement Income Planning",
          content: "Based on our analysis we recommend that you convert your retirement savings products into retirement income products at age (X) and begin to draw the minimum withdrawal.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-income-younger-spouse",
          title: "Use Younger Spouse Age for RRIF",
          description: "Reduce minimum payments using spouse's age",
          category: "Retirement Income",
          section: "implementingTaxStrategies",
          subsection: "Retirement Income Planning",
          content: "We recommend that you use the birthdate of your younger spouse when converting to a retirement income product as this will reduce the annual minimum payment, as you have indicated you may not need these funds to meet your lifestyle needs.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-income-rrif-to-tfsa",
          title: "RRIF to TFSA Transfer Strategy",
          description: "Optimize RRIF withdrawals to TFSA",
          category: "Retirement Income",
          section: "implementingTaxStrategies",
          subsection: "Retirement Income Planning",
          content: "We recommend transferring money from XXX RRIF to his TFSA. Contributing to your TFSA allows you to take advantage of tax-free growth since income or capital gains earned on investments in your TFSA are non-taxable. Withdrawals can be made on a tax-free basis should you need to access these funds.\n\nXXX, based on our projections, you can withdraw $XXXX on top of your minimum payment from your RRIF and contribute those to the TFSA. We elected this number based on your projected income and the Federal and Provincial tax brackets however we recommend meeting with you accountant for the exact amount you can withdraw without impacting your overall taxes too much.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-income-insurance-proceeds",
          title: "Life Insurance Proceeds Allocation",
          description: "Optimal allocation of insurance benefits",
          category: "Retirement Income",
          section: "implementingTaxStrategies",
          subsection: "Retirement Income Planning",
          content: "We recommend contributing the proceeds of life insurance to XXX' TFSA and allocate the remainder to a non-registered account.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-income-rrif-rollover",
          title: "RRIF Rollover and Tax Management",
          description: "Manage RRIF estate taxation",
          category: "Retirement Income",
          section: "implementingTaxStrategies",
          subsection: "Retirement Income Planning",
          content: "XXX RRIF will eventually be rolled-over to YYY on a tax-free basis. RRIFs in the Estate are fully taxable. To avoid paying too many taxes, we recommend transferring XXX in addition to your minimum payment to your non-registered account.\n\nNon-Registered account have preferential tax treatment.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-income-withdrawal-procedure",
          title: "Tax-Efficient Withdrawal Procedure",
          description: "Three-step withdrawal strategy",
          category: "Retirement Income",
          section: "implementingTaxStrategies",
          subsection: "Retirement Income Planning",
          content: "Cash management can be an important element when you move to a new stage of your life. You will find below the procedure to follow to make withdrawals in the most tax-efficient way.\n\nStep 1 The first step is to determine the after-tax income that comes from recurring sources, such as:\nRetirement income (from your employer-sponsored retirement savings plan)\nGovernment benefits, such as CPP and OAS (if applicable);\nMandatory withdrawals from your registered retirement savings plans (RRSP, RRIF), if applicable;\nIncome from non-registered investment accounts;\nOther sources of income (e.g., rental income).\n\nStep 2 Over the course of a year, if you expect your current expenses to exceed the revenue sources mentioned above, you may need to withdraw funds from your investment accounts to cover the difference.\n\nGenerally, it is best to draw first from the lowest tax-paying investment accounts:\nThe capital from non-registered accounts, starting with investments that have accumulated the least capital gains;\nWithdrawals from your tax-free savings account. In your case, it would be more advantageous to not touch this account at all due to its tax-free nature to the estate as well.\n\nStep 3 If the above placements are exhausted, you may need to turn to some investment accounts whose withdrawals are less advantageous from a tax point of view or entirely taxable, such as lump-sum withdrawals from an RRSP or a RRIF/LIF.\n\nRecommendations: Convert your RRSP/LIRA to a RRIF/LIF at age 71 and start make the minimum payments. This coupled with your other sources of income (pensions and governmental) are more than enough to fill your needs. Contact your tax advisor to see if the strategies outlined above should be tailored to your situation.",
          inputFields: [],
          isCustom: false
        },

        // PROTECTING WHAT MATTERS - OBJECTIVES
        {
          id: "protect-insurance-foundation",
          title: "Insurance as Financial Foundation",
          description: "Essential protection for family security",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "Insurance is a foundational component of a well-rounded financial plan, as it helps protect against unforeseen events that could impact your family's financial security. Life, critical illness, and disability coverage can provide essential support in times of need, ensuring your goals stay on track even in the face of adversity. While this report does not include a detailed insurance analysis, we encourage you to explore this area further. We can connect you with appropriate TD insurance Specialists within our team to ensure your coverage continues to support your objectives and risk profile.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-life-insurance-benefits",
          title: "Life Insurance Benefits Overview",
          description: "Key advantages of life insurance protection",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "We recommend that you consider the advantages of life insurance as part of your overall plan to accumulate and transfer investment assets to your beneficiaries more tax-efficiently. Life insurance provides the following advantages:\n- Income replacement in the event of premature death.\n- Creates liquidity in your estate to fund a significant tax liability.\n- Is a tax-efficient strategy to transfer assets to your beneficiaries.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-estate-erosion",
          title: "Estate Value Erosion Factors",
          description: "Understanding estate costs and taxes",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "Upon death your estate value will be eroded as a result of numerous factors, including:\n- Income taxes that become payable on death. A person is deemed to have disposed of all of his/her assets on death. The taxes will be payable on unrealized capital gains on investments and on the value of RRSP and RRIF balances if these assets are not transferred to a qualifying beneficiary, such as a surviving spouse/partner.\n- Legal fees to help settle the estate of the deceased.\n- Repayment of any debts.\n- Funeral costs.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-estate-erosion-coverage",
          title: "Estate Erosion Coverage Strategy",
          description: "Liquidation vs life insurance for estate costs",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "This estate erosion can be covered by the liquidation of assets in the estate or through the use of life insurance.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-insurance-in-place",
          title: "Current Insurance Coverage Review",
          description: "Existing coverage and beneficiaries reviewed",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "Based on our conversation, your insurance coverage is already in place and all beneficiary designations have been reviewed.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-insurance-needs-review",
          title: "Insurance Needs Assessment",
          description: "Determine adequate coverage for objectives",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "In our discussions you mentioned that you would like to review your current insurance policies to determine if they are adequate to cover your needs. At this time your main objective is to (REPLACE INCOME/PLAN FOR ESTATE/TAX SHELTER FUNDS).",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-emergency-funds-adequate",
          title: "Adequate Emergency Funds",
          description: "Prepared for unexpected situations",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "You have indicated that you feel you have adequate funds available should an unexpected situation arise that may impact other sources of income or your ability to earn income for a short period of time.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-emergency-funds-concern",
          title: "Emergency Fund Gap",
          description: "Need for short-term emergency coverage",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "Based on our conversations you do not have a source of emergency funds at this time and are concerned about the impact a short-term event may have on your cash flow needs.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-disability-review",
          title: "Disability Insurance Review",
          description: "Assess coverage for work disability",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "You mentioned that you would like to review your current insurance policies to determine if they are adequate to cover your needs should there be a disability that would impact your ability to work in the short or long-term.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-critical-illness",
          title: "Critical Illness Insurance Information",
          description: "Explore critical illness coverage options",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "You mentioned that you do not currently have Critical Illness insurance and that you wish to obtain more information on the benefits and options available.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-insurance-declined",
          title: "Insurance Analysis Declined",
          description: "No current insurance review requested",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "You have declined an insurance needs analysis at this time. You are comfortable with your current situation and understand that a review is available to you should you wish to re-visit this discussion at another time.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-life-insurance-epa",
          title: "Life Insurance Needs with EPA",
          description: "Detailed life insurance review",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "You mentioned that you would like to review your life insurance needs in detail with EPA. At this time your main objective is for income replacement (or estate planning).",
          inputFields: [],
          isCustom: false
        },

        // PLANNING FOR UNCERTAINTY (Subsection of Protecting What Matters)
        {
          id: "uncertainty-emergency-fund",
          title: "Emergency Fund Requirements",
          description: "3-6 months household income accessibility",
          category: "Risk Management",
          section: "protectingWhatMatters",
          subsection: "Planning for Uncertainty",
          content: "It is recommended to have funds that are easily accessible in the event of an emergency or unexpected cost, typically this amount should represent 3-6 months of your household income. We recommend that this be a cash or bank account, but it can also be the unused portion of a line of credit. If a line of credit is used then it is important to consider the cost of interest in the event funds are borrowed, a line of credit that is secured by a home or investment property will provide a lower borrowing rate.",
          inputFields: [],
          isCustom: false
        },

        // INSURANCE (Subsection of Protecting What Matters)
        {
          id: "insurance-needs-analysis",
          title: "Life Insurance Needs Analysis",
          description: "Specialist consultation for coverage",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Our current analysis indicates that you may have a need for life insurance and we recommend that you speak with a specialist from the EPA for further details.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-employer-term",
          title: "Employer Term Life Insurance",
          description: "Coverage through employment",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Client 1 currently has term life insurance through his employer of 1 times his/her salary, which will expire upon retirement.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-permanent-and-term",
          title: "Permanent and Term Life Insurance Mix",
          description: "Combined insurance coverage",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Client 1 currently has permanent life insurance policies with combined death benefits totaling approximately $100,000, and personal term life insurance policies with combined death benefits totaling approximately $200,000.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-no-coverage",
          title: "No Current Life Insurance",
          description: "Client without coverage",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Client 2 currently does not have any life insurance.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-personal-term",
          title: "Personal Term Life Insurance",
          description: "Individual term coverage",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Client 2 currently has a personal term life insurance policy with a $XX death benefit.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-employer-and-personal",
          title: "Employer and Personal Term Coverage",
          description: "Combined employer and personal insurance",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Client 2 currently has term life insurance through his/her employer of approximately 2 times salary. In addition, he/he also has a personal term life insurance policy with a $XX Million death benefit.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-joint-second-to-die",
          title: "Joint Second-to-Die Participating Policy",
          description: "Permanent joint insurance coverage",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Client 1 & 2 also have a joint second-to-die participating life insurance policy. The estimated death benefit of this policy is $3 Million, assuming the current dividend scale less 1%.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-sufficient-coverage",
          title: "Sufficient Insurance Coverage",
          description: "Adequate coverage for identified needs",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Based on the information provided, our current analysis indicates that you may have sufficient insurance to cover the needs you have identified.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-policy-reviews",
          title: "Regular Policy Review Schedule",
          description: "Periodic insurance review guidelines",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "We recommend that whole life or universal policies be reviewed on an annual basis and term policies be reviewed every 3 years or after significant life events.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-employer-policy-review",
          title: "Employer Policy Review",
          description: "Understand employer coverage details",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "We recommend that you review any policies held through an employer to understand eligibility, waiting provisions and fiscal treatment of benefits, and determine if this meets your needs.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-critical-illness",
          title: "Critical Illness Insurance",
          description: "Lump-sum tax-free payment for critical illness",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Critical Illness insurance can provide a lump-sum, tax-free payment 30 days after the insured person is diagnosed with a critical illness. This can assist with household bills, debts or medical costs as the individual deals with the impact of the critical illness. This amount is payable based on the diagnosis and during the insured person's life, should the individual pass away after receiving the funds there is no need to repay. We recommend that you meet with our insurance specialist to determine if your current coverage will meet the needs of you and your family.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-permanent-never-money",
          title: "Permanent Insurance for Never Money",
          description: "Tax-efficient wealth transfer strategy",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Where individuals have \"never\" money – money they are never going to spend, one strategy for an efficient continuity plan to the next generation is the use of permanent insurance. Permanent life insurance may provide a tax-free investment environment to certain maximums, not dissimilar to a Tax-Free Savings Account (TFSA), allowing an investor to move funds from taxable to tax-free pool. With this strategy, some of your capital is used to fund a permanent life insurance policy. Some of these funds are invested tax‐sheltered inside the policy. Upon the death, the benefit is paid tax‐free and probate‐free to the beneficiaries of the policy. Given the unique tax structure of tax‐exempt life insurance, it can be a powerful tool as a \"unique asset class\" to build a pool of tax‐advantaged capital.",
          inputFields: [],
          isCustom: false
        },

        // LEAVING A LEGACY - OBJECTIVES
        {
          id: "legacy-estate-documentation",
          title: "Estate Documentation Status",
          description: "Review of will and power of attorney completion",
          category: "Estate Planning Objectives",
          section: "leavingALegacy",
          content: "In our discussion you mentioned that it was important to you to make things clear for your loved ones on your passing. You told us that you (HAVE/HAVE NOT) completed your Estate documentation (Wills, Powers of Attorney) (AND YOU FEEL THAT THESE DOCUMENTS REFLECT YOUR CURRENT WISHES/, BUT THAT THEY WERE DRAFTED SOME TIME AGO).",
          inputFields: [],
          isCustom: false
        },
        {
          id: "legacy-net-estate-value",
          title: "Net Estate Value Projection",
          description: "Future estate value and tax liability",
          category: "Estate Planning Objectives",
          section: "leavingALegacy",
          content: "Your net estate is expected to be valued at approximately $XXXX in future dollars. Please refer to the Estate Summary report for additional details on the projected values and tax liability at death. Please note that the Estate Summary report does not include probate tax, if applicable in your province.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "legacy-minor-children-concern",
          title: "Managing Inheritance for Young Children",
          description: "Concerns about children inheriting young",
          category: "Estate Planning Objectives",
          section: "leavingALegacy",
          content: "Based on our discussions you expressed concern about how funds may be managed if your children inherited money when they are still young.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "legacy-beneficiary-outdated",
          title: "Outdated Beneficiary Designations",
          description: "Update required for insurance and accounts",
          category: "Estate Planning Objectives",
          section: "leavingALegacy",
          content: "You have indicated that your beneficiary designations on Life Insurance (or RRSP/RRIF/TFSA) may not be up to date.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "legacy-charitable-giving-interest",
          title: "Charitable Giving at Scale",
          description: "Larger charitable giving consideration",
          category: "Estate Planning Objectives",
          section: "leavingALegacy",
          content: "You have indicated that you would now like to consider charitable giving on a larger scale or through your estate.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "legacy-specific-charity-support",
          title: "Specific Charity Support",
          description: "Continued support through estate",
          category: "Estate Planning Objectives",
          section: "leavingALegacy",
          content: "You mentioned that you love to support (insert charity) and would like to understand how you may continue to support them through your will, estate or life insurance policies.",
          inputFields: [],
          isCustom: false
        },

        // DONATING TO CHARITY (Subsection of Leaving a Legacy)
        {
          id: "charity-insurance-beneficiary",
          title: "Update Insurance Beneficiaries for Charity",
          description: "Designate charity as life insurance beneficiary",
          category: "Charitable Giving",
          section: "leavingALegacy",
          subsection: "Donating to Charity",
          content: "Based on our discussions we recommend that you update the beneficiaries on your life insurance policies to reflect the (insert charity).",
          inputFields: [],
          isCustom: false
        },
        {
          id: "charity-securities-donation",
          title: "Donate Securities to Eliminate Capital Gains",
          description: "Tax-efficient charitable giving through securities",
          category: "Charitable Giving",
          section: "leavingALegacy",
          subsection: "Donating to Charity",
          content: "We recommend that you donate (insert security) to (insert charity) as this will eliminate the unrealized capital gain and provide you with a charitable tax credit in exchange, as well as support the charity that is close to your heart.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "charity-estate-planning",
          title: "Charitable Giving in Estate Plan",
          description: "Legacy giving during lifetime or through estate",
          category: "Charitable Giving",
          section: "leavingALegacy",
          subsection: "Donating to Charity",
          content: "One aspect worth considering in your estate plan is charitable giving. Even if it hasn't been part of your past planning, donating to charity—during your lifetime or through your estate—can be a powerful way to leave a meaningful legacy while also reducing your tax burden. Gifts made through your will or via a donor-advised fund, like the Private Giving Foundation, can support causes you care about and generate significant tax credits for your estate. It's a way to align your wealth with your values, maximize impact, and ease the administrative burden on your heirs.",
          inputFields: [],
          isCustom: false
        },

        // PASSING ON WEALTH (Subsection of Leaving a Legacy)
        {
          id: "wealth-will-poa-update",
          title: "Will and Power of Attorney Update",
          description: "Ensure documents reflect current objectives",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "We recommend you speak with your legal representative to ensure that you have your Wills updated to reflect your current estate objectives. You may wish to discuss your Powers of Attorney for Property and Personal Care to ensure that you have made provisions in the event of incapacity. It is important to review these documents periodically or after any major life event. You can to speak with your legal representative to discuss your Powers of Attorney for Property and Personal Care to ensure that you have made provisions in the event of incapacity. It is important to review these documents periodically or after any major life event. You may want to consider setting up a testamentary trust upon your passing. Testamentary trusts are created in Wills and become effective upon an individual's death. Testamentary Trusts - In general, a trust is a legal arrangement by which you place property with an individual or trust company (i.e., trustee) to be held for the benefit of your beneficiaries (i.e., nieces / nephews, their children...). The trustee owns and manages the trust property for beneficiaries. Beneficiaries will receive payments of income at any frequency you choose following your death. The trust can also reserve the capital for specific purposes and direct how it is to be used.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-estate-doc-completed",
          title: "Estate Documentation Review Points",
          description: "Considerations for future updates",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "XXX , you have indicated that you completed your Estate documentation (Wills, Powers of Attorney). Some additional points to consider for the future updating process are:",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-estate-revision-considerations",
          title: "Estate Document Revision Considerations",
          description: "Key questions for liquidator selection",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "Here are some important considerations during the revision of your Estate documentation\n- Who should be liquidator or co-liquidators?\n- Are they Canadian resident, local, younger, financially savvy and trustworthy?\n- Do they have legal and financial expertise, as well as the time and willingness to fulfill the duties? Should you name a third party, e.g., trust company?",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-corporate-liquidator",
          title: "Corporate Liquidator Benefits",
          description: "Professional estate administration services",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "A corporate liquidator can provide a high level of expertise, and will facilitate the estate settlement process for your beneficiaries. If The Canada Trust Company is appointed in this capacity, there are no fees payable until The Canada Trust Company begins to administer your estate. Furthermore, a corporate liquidator will endeavor to provide the requisite impartiality, accountability and responsibility in so acting. The Canada Trust Company has a history of acting as corporate liquidator and is able to draw on its extensive expertise to help assure your beneficiaries of a timely and professional administration of your estate. If The Canada Trust Company is named as the liquidator of your estate, it can be called upon to do all the \"heavy-lifting\" of the estate administration that your friends and family cannot do, will not do, or do not have the expertise to do.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-asset-inventory",
          title: "Personal Asset Inventory",
          description: "Document personal items and joint assets",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "It may be helpful to create an inventory listing of personal items and discuss how these items will be dealt with. Assets held in a joint account will pass directly to the surviving account holder. Assets with named beneficiaries will flow outside of the estate and will pass directly to the named individual(s).",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-testamentary-trust-reasons",
          title: "Testamentary Trust Benefits",
          description: "Control and protection through trusts",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "There are many reasons why a testamentary trust may be a valuable estate planning tool. For example, a testamentary trust may be used to maintain control over inheritances, such as in cases where there are beneficiaries who need help with managing their finances. Placing assets into a trust could give you peace of mind, since the funds may not be accessible to your beneficiary's creditors or spouses. It is important to ensure that any trustee who will administer the trust is qualified, competent and willing to perform the many tasks required to carry out your wishes and discharge their fiduciary duties.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-td-corporate-executor",
          title: "TD Private Trust as Corporate Executor",
          description: "Unburden family with professional executor",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "We can also consider engaging TD Private Trust to become a corporate executor of your estate. A corporate executor can provide expertise and will simplify and facilitate the estate settlement process for your family should you want to unburden your brother Brian.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-private-trust-management",
          title: "TD Wealth Private Trust Management",
          description: "Professional trust administration",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "For individuals seeking a trouble-free management of a trust, TD Wealth Private Trust can provide expertise and advice that ensures that a trust is both managed according to the testator's wishes and to the needs of the trust's beneficiaries.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-estate-planning-specialist",
          title: "Estate Planning Specialist Consultation",
          description: "Corporate executor and testamentary trust options",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "We recommend that you meet with our Estate Planning colleague to discuss your estate planning options, which may include a corporate executor. A corporate executor can provide expertise and will simplify and facilitate the estate settlement process for your family. (AND/OR) Testamentary trusts are created in Wills and become effective upon an individual's death. Rather than giving all of your assets directly to a surviving spouse and/or children, you may wish to consider setting up testamentary spousal trusts in your Will for your spouse and/or children.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-beneficiary-review",
          title: "Periodic Beneficiary Designation Review",
          description: "Avoid probate with proper designations",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "It is recommended to review beneficiary designations periodically to ensure that they meet your current estate wishes. On accounts/products that allow beneficiary designations the process will be faster and easier for the beneficiary to receive the funds, and may avoid probate costs if applicable in your province.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-emergency-funds-estate",
          title: "Estate Emergency Funds",
          description: "Liquidity for surviving spouse during settlement",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "It is important to ensure that there are some 'emergency funds' available should one spouse pass away. The estate administration process may be lengthy, so an emergency fund would help the surviving spouse have the ability to meet day-to-day financial needs until the estate is settled.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-us-citizen-estate",
          title: "US Citizen Estate Tax Planning",
          description: "Cross-border tax and estate considerations",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "As a U.S. citizen living in Canada, your spouse may be subject to both the Canadian and U.S. tax regimes upon their death. As a Canadian resident, they are subject to Canadian income tax at death. For Canadian income tax purposes, they will be deemed to dispose of their capital assets upon death for an amount equal to their fair market value at the date of death. As a U.S. citizen, they will also be subject to U.S. estate tax on the fair market value of their worldwide estate at the time of their death. Their worldwide estate includes all property owned at death, regardless of where the property is located. It is recommended that they review their Estate Plan with a Tax and Estate planning specialist who has US/Canada cross border expertise.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-private-giving-foundation",
          title: "Private Giving Foundation Account",
          description: "Philanthropic goals through foundation",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "You may consider fulfilling your philanthropic goals by establishing a Private Giving Foundation account. I have attached a brochure, which highlights the benefits of giving through the Private Giving Foundation. I recommend that you speak with your lawyer to ensure that your will reflects your desire to provide funds to a charitable organization at your death. You may also wish to speak with a tax advisor to determine if donating specific securities, rather than a $ amount, will help to offset other costs to the estate.",
          inputFields: [],
          isCustom: false
        }
      ];

      defaultStrategies.forEach(strategy => {
        this.strategies.set(strategy.id, strategy);
      });
    }
  }

  // Mock save method to satisfy the interface, as MemStorage uses direct Map manipulation
  private async save(): Promise<void> {
    // In-memory storage doesn't need a complex save operation.
    // If this were a real implementation (e.g., file system or database),
    // this is where the data would be persisted.
    console.log("Data saved (in-memory).");
  }
}

export const storage = new MemStorage();