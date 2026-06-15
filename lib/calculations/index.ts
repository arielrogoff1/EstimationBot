export interface FoamSettings {
  openCellRPerInch: number;   // default 3.7
  closedCellRPerInch: number; // default 6.5
  openCellCostPerBF: number;  // default 0.44
  closedCellCostPerBF: number; // default 1.00
  laborRatePerHour: number;   // default 85
  overheadPercent: number;    // default 15
  profitPercent: number;      // default 20
  wasteFactor: number;        // default 0.10
  yieldLoss: number;          // default 0.05
  sqFtPerHourOpenCell: number;  // default 400
  sqFtPerHourClosedCell: number; // default 250
}

export interface WallInput {
  length: number;
  height: number;
  windowArea?: number;
  doorArea?: number;
}

export interface MeasurementCalc {
  grossArea: number;
  netArea: number;
  requiredThickness: number;
  boardFeet: number;
  boardFeetWithWaste: number;
}

export interface ProjectTotals {
  totalWallArea: number;
  totalRoofArea: number;
  totalFloorArea: number;
  volume: number;
  totalBoardFeet: number;
  openCellBoardFeet: number;
  closedCellBoardFeet: number;
  openCellSets: number;
  closedCellSets: number;
  materialCost: number;
  laborHours: number;
  laborCost: number;
  subtotal: number;
  overhead: number;
  totalCost: number;
  sellPrice: number;
}

export function calcNetWallArea(input: WallInput): number {
  const gross = input.length * input.height;
  const deductions = (input.windowArea ?? 0) + (input.doorArea ?? 0);
  return Math.max(0, gross - deductions);
}

export function calcRequiredThickness(desiredRValue: number, rPerInch: number): number {
  if (rPerInch <= 0) return 0;
  return desiredRValue / rPerInch;
}

export function calcBoardFeet(areaSqFt: number, thicknessInches: number): number {
  return areaSqFt * thicknessInches;
}

export function calcBoardFeetWithWaste(boardFeet: number, wasteFactor: number): number {
  return boardFeet * (1 + wasteFactor + (wasteFactor * 0.5));
}

export function calcMeasurement(
  netArea: number,
  desiredRValue: number,
  foamType: "OPEN_CELL" | "CLOSED_CELL",
  settings: FoamSettings
): MeasurementCalc {
  const rPerInch =
    foamType === "OPEN_CELL"
      ? settings.openCellRPerInch
      : settings.closedCellRPerInch;

  const requiredThickness = calcRequiredThickness(desiredRValue, rPerInch);
  const boardFeet = calcBoardFeet(netArea, requiredThickness);
  const boardFeetWithWaste = boardFeet * (1 + settings.wasteFactor + settings.yieldLoss);

  return {
    grossArea: netArea,
    netArea,
    requiredThickness,
    boardFeet,
    boardFeetWithWaste,
  };
}

export function calcProjectTotals(
  measurements: Array<{
    areaType: string;
    netArea: number | null;
    grossArea: number | null;
    foamType: "OPEN_CELL" | "CLOSED_CELL";
    boardFeet: number | null;
  }>,
  settings: FoamSettings,
  buildingDimensions?: { length?: number; width?: number; height?: number }
): ProjectTotals {
  const wallTypes = ["EXTERIOR_WALL", "INTERIOR_WALL", "FOUNDATION_WALL", "GARAGE_WALL"];
  const roofTypes = ["ROOF", "CATHEDRAL_CEILING", "ATTIC_FLOOR"];
  const floorTypes = ["FLOOR_ASSEMBLY", "CRAWL_SPACE", "RIM_JOIST"];

  let totalWallArea = 0;
  let totalRoofArea = 0;
  let totalFloorArea = 0;
  let openCellBF = 0;
  let closedCellBF = 0;

  for (const m of measurements) {
    const area = m.netArea ?? m.grossArea ?? 0;
    const bf = m.boardFeet ?? 0;

    if (wallTypes.includes(m.areaType)) totalWallArea += area;
    else if (roofTypes.includes(m.areaType)) totalRoofArea += area;
    else if (floorTypes.includes(m.areaType)) totalFloorArea += area;

    if (m.foamType === "OPEN_CELL") openCellBF += bf;
    else closedCellBF += bf;
  }

  const volume = buildingDimensions
    ? (buildingDimensions.length ?? 0) *
      (buildingDimensions.width ?? 0) *
      (buildingDimensions.height ?? 0)
    : 0;

  const totalBoardFeet = openCellBF + closedCellBF;

  // Sets needed
  const openCellSets = Math.ceil(openCellBF / 5500);
  const closedCellSets = Math.ceil(closedCellBF / 2200);

  // Material costs
  const materialCost =
    openCellBF * settings.openCellCostPerBF +
    closedCellBF * settings.closedCellCostPerBF;

  // Labor
  const openCellHours = (totalWallArea + totalFloorArea) > 0
    ? openCellBF / (settings.sqFtPerHourOpenCell * 3)
    : 0;
  const closedCellHours = closedCellBF / (settings.sqFtPerHourClosedCell * 3);
  const laborHours = openCellHours + closedCellHours;
  const laborCost = laborHours * settings.laborRatePerHour;

  const subtotal = materialCost + laborCost;
  const overhead = subtotal * (settings.overheadPercent / 100);
  const totalCost = subtotal + overhead;
  const sellPrice = totalCost * (1 + settings.profitPercent / 100);

  return {
    totalWallArea: Math.round(totalWallArea),
    totalRoofArea: Math.round(totalRoofArea),
    totalFloorArea: Math.round(totalFloorArea),
    volume: Math.round(volume),
    totalBoardFeet: Math.round(totalBoardFeet),
    openCellBoardFeet: Math.round(openCellBF),
    closedCellBoardFeet: Math.round(closedCellBF),
    openCellSets,
    closedCellSets,
    materialCost: Math.round(materialCost),
    laborHours: Math.round(laborHours * 10) / 10,
    laborCost: Math.round(laborCost),
    subtotal: Math.round(subtotal),
    overhead: Math.round(overhead),
    totalCost: Math.round(totalCost),
    sellPrice: Math.round(sellPrice),
  };
}

export function settingsToFoamSettings(s: Record<string, string>): FoamSettings {
  const get = (key: string, fallback: number) =>
    parseFloat(s[key] ?? String(fallback)) || fallback;
  return {
    openCellRPerInch: get("open_cell_r_per_inch", 3.7),
    closedCellRPerInch: get("closed_cell_r_per_inch", 6.5),
    openCellCostPerBF: get("open_cell_cost_per_bf", 0.44),
    closedCellCostPerBF: get("closed_cell_cost_per_bf", 1.0),
    laborRatePerHour: get("labor_rate_per_hour", 85),
    overheadPercent: get("overhead_percent", 15),
    profitPercent: get("profit_percent", 20),
    wasteFactor: get("waste_factor_percent", 10) / 100,
    yieldLoss: get("yield_loss_percent", 5) / 100,
    sqFtPerHourOpenCell: get("sq_ft_per_hour_open_cell", 400),
    sqFtPerHourClosedCell: get("sq_ft_per_hour_closed_cell", 250),
  };
}
