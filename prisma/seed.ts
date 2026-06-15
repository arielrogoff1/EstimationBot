import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultSettings = [
  // Foam R-Values
  { key: "open_cell_r_per_inch", value: "3.7", label: "Open Cell R-Value per Inch", category: "foam" },
  { key: "closed_cell_r_per_inch", value: "6.5", label: "Closed Cell R-Value per Inch", category: "foam" },

  // Pricing
  { key: "open_cell_cost_per_bf", value: "0.44", label: "Open Cell Cost per Board Foot ($)", category: "pricing" },
  { key: "closed_cell_cost_per_bf", value: "1.00", label: "Closed Cell Cost per Board Foot ($)", category: "pricing" },
  { key: "labor_rate_per_hour", value: "85", label: "Labor Rate per Hour ($)", category: "pricing" },
  { key: "overhead_percent", value: "15", label: "Overhead Percentage (%)", category: "pricing" },
  { key: "profit_percent", value: "20", label: "Profit Percentage (%)", category: "pricing" },

  // Material Assumptions
  { key: "waste_factor_percent", value: "10", label: "Waste Factor (%)", category: "material" },
  { key: "yield_loss_percent", value: "5", label: "Yield Loss (%)", category: "material" },
  { key: "open_cell_set_yield_bf", value: "5500", label: "Open Cell Set Yield (board feet)", category: "material" },
  { key: "closed_cell_set_yield_bf", value: "2200", label: "Closed Cell Set Yield (board feet)", category: "material" },

  // Labor
  { key: "sq_ft_per_hour_open_cell", value: "400", label: "Sq Ft per Hour (Open Cell)", category: "labor" },
  { key: "sq_ft_per_hour_closed_cell", value: "250", label: "Sq Ft per Hour (Closed Cell)", category: "labor" },

  // R-Value Defaults by Area Type
  { key: "default_r_exterior_wall", value: "21", label: "Default R-Value: Exterior Wall", category: "defaults" },
  { key: "default_r_roof", value: "38", label: "Default R-Value: Roof", category: "defaults" },
  { key: "default_r_attic_floor", value: "49", label: "Default R-Value: Attic Floor", category: "defaults" },
  { key: "default_r_crawl_space", value: "21", label: "Default R-Value: Crawl Space", category: "defaults" },
  { key: "default_r_rim_joist", value: "13", label: "Default R-Value: Rim Joist", category: "defaults" },
  { key: "default_r_foundation_wall", value: "21", label: "Default R-Value: Foundation Wall", category: "defaults" },
];

async function main() {
  console.log("Seeding default settings...");
  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: { label: setting.label, value: setting.value, category: setting.category },
      create: setting,
    });
  }
  console.log("Seeding complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
