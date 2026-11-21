import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

export interface DryRunRowError {
  rowNumber: number;
  field: string;
  error: string;
  rawValue: any;
}

export interface DryRunResult<T = any> {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  errors: DryRunRowError[];
  validRows: T[];
}

export class ExcelEngine {
  /**
   * Sanitizes values to prevent Excel / CSV Formula Injection (CWE-1236).
   * Prepend a single quote if string begins with '=', '+', '-', or '@'.
   */
  static sanitizeValue(val: any): any {
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (/^[=+\-@]/.test(trimmed)) {
        return `'${trimmed}`;
      }
      return trimmed;
    }
    return val;
  }

  /**
   * Generates a pre-formatted Arabic Excel template with column instructions.
   */
  static async generateProductsTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "نظام مخازن ERP";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("دليل الأصناف", {
      views: [{ rightToLeft: true }],
    });

    sheet.columns = [
      { header: "كود الصنف *", key: "code", width: 18 },
      { header: "اسم الصنف بالعربية *", key: "name_ar", width: 35 },
      { header: "التصنيف *", key: "category", width: 22 },
      { header: "وحدة الأساس (TON/BAG/M3/KG) *", key: "base_unit", width: 28 },
      { header: "سعر البيع الحالي (ج.م) *", key: "price", width: 22 },
      { header: "تكلفة الاستبدال (ج.م)", key: "cost", width: 22 },
      { header: "حد إعادة الطلب", key: "reorder", width: 18 },
      { header: "قطر الحديد (مم)", key: "diameter", width: 18 },
      { header: "وزن الشيكارة (كجم)", key: "bag_weight", width: 18 },
    ];

    // Style Header Row
    const headerRow = sheet.getRow(1);
    headerRow.font = { name: "Cairo", bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE97825" }, // Brand orange
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    // Sample Data Rows
    sheet.addRow({
      code: "PRD-CEM-SWD",
      name_ar: "أسمنت السويدي مقاوم 42.5",
      category: "أسمنت ومواد رابطة",
      base_unit: "BAG",
      price: 145.0,
      cost: 138.0,
      reorder: 200,
      diameter: null,
      bag_weight: 50,
    });

    sheet.addRow({
      code: "PRD-STL-EZZ-10",
      name_ar: "حديد تسليح عز 10 مم",
      category: "حديد تسليح",
      base_unit: "TON",
      price: 42500.0,
      cost: 41200.0,
      reorder: 15,
      diameter: 10,
      bag_weight: null,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Performs a Dry Run simulation on products data without writing to database.
   */
  static validateProductsData(rows: any[]): DryRunResult {
    const errors: DryRunRowError[] = [];
    const validRows: any[] = [];
    const seenCodes = new Set<string>();

    rows.forEach((row, index) => {
      const rowNum = index + 2; // Accounting for header row

      const code = this.sanitizeValue(row["كود الصنف"] || row["code"]);
      const name = this.sanitizeValue(row["اسم الصنف"] || row["name_ar"]);
      const baseUnit = (row["وحدة الأساس"] || row["base_unit"] || "").toString().toUpperCase().trim();
      const price = parseFloat(row["سعر البيع"] || row["price"] || "0");
      const cost = parseFloat(row["تكلفة الاستبدال"] || row["cost"] || "0");

      let hasRowError = false;

      // Validation 1: Code required
      if (!code) {
        errors.push({
          rowNumber: rowNum,
          field: "code",
          error: "كود الصنف مطلوب ولا يمكن أن يكون فارغاً",
          rawValue: code,
        });
        hasRowError = true;
      } else if (seenCodes.has(code.toUpperCase())) {
        errors.push({
          rowNumber: rowNum,
          field: "code",
          error: `كود الصنف مكرر داخل نفس الملف: ${code}`,
          rawValue: code,
        });
        hasRowError = true;
      } else {
        seenCodes.add(code.toUpperCase());
      }

      // Validation 2: Name required
      if (!name || name.length < 2) {
        errors.push({
          rowNumber: rowNum,
          field: "name_ar",
          error: "اسم الصنف بالعربية مطلوب ويجب ألا يقل عن حرفين",
          rawValue: name,
        });
        hasRowError = true;
      }

      // Validation 3: Base Unit validation
      const allowedUnits = ["TON", "BAG", "M3", "KG", "PIECE", "طن", "شيكارة", "متر مكعب", "كجم"];
      if (!baseUnit || !allowedUnits.includes(baseUnit)) {
        errors.push({
          rowNumber: rowNum,
          field: "base_unit",
          error: `وحدة الأساس (${baseUnit}) غير معتمدة. الوحدات المسموحة: TON, BAG, M3, KG, PIECE`,
          rawValue: baseUnit,
        });
        hasRowError = true;
      }

      // Validation 4: Price >= 0
      if (isNaN(price) || price < 0) {
        errors.push({
          rowNumber: rowNum,
          field: "price",
          error: "سعر البيع يجب أن يكون رقماً أكبر من أو يساوي الصفر",
          rawValue: row["price"],
        });
        hasRowError = true;
      }

      if (!hasRowError) {
        validRows.push({
          code,
          name_ar: name,
          base_unit: baseUnit,
          current_sale_price: price,
          replacement_cost: isNaN(cost) ? 0 : cost,
        });
      }
    });

    return {
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: errors.length,
      errors,
      validRows,
    };
  }
}
