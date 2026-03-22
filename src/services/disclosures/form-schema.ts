// PLACEHOLDER — all schemas require attorney review before activation.
// Do NOT activate any schema (active: false) until attorney review is complete.

export interface FieldSchema {
  id: string;
  label: string;
  type: "text" | "textarea" | "boolean" | "select";
  section: string;
  required: boolean;
  helpText?: string;
  options?: string[];
}

export interface DisclosureFormSchemaTemplate {
  state: string;
  formName: string;
  version: string;
  required: boolean; // true = legally required; false = optional (GA)
  fields: string; // JSON-encoded FieldSchema[]
}

// ─── CA: Transfer Disclosure Statement (TDS) ─────────────────────────────────
const CA_FIELDS: FieldSchema[] = [
  {
    id: "property_condition",
    label: "Overall Property Condition",
    type: "select",
    section: "Property Condition",
    required: true,
    helpText: "General condition of the property.",
    options: ["Excellent", "Good", "Fair", "Poor"],
  },
  {
    id: "structural_issues",
    label: "Known Structural Issues",
    type: "boolean",
    section: "Property Condition",
    required: true,
    helpText: "Check if any known structural issues exist.",
  },
  {
    id: "roof_age",
    label: "Approximate Roof Age (years)",
    type: "text",
    section: "Property Condition",
    required: true,
    helpText: "Estimate the age of the roof in years.",
  },
  {
    id: "plumbing_issues",
    label: "Known Plumbing Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "electrical_issues",
    label: "Known Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "lead_paint",
    label: "Pre-1978 Construction with Known Lead Paint",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "Required federal disclosure for pre-1978 properties.",
  },
  {
    id: "natural_hazards",
    label: "Known Natural Hazard Zone (flood, fire, earthquake)",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Contamination",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "neighborhood_noise",
    label: "Known Neighborhood Noise Sources",
    type: "textarea",
    section: "Neighborhood",
    required: false,
    helpText: "Describe any known noise sources (traffic, airports, etc.).",
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── TX: TREC Seller's Disclosure Notice (OP-H) ───────────────────────────────
const TX_FIELDS: FieldSchema[] = [
  {
    id: "foundation",
    label: "Foundation Issues",
    type: "boolean",
    section: "Structure",
    required: true,
    helpText: "Known cracks, settling, or repairs to the foundation.",
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  {
    id: "walls_ceilings",
    label: "Wall or Ceiling Damage",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "plumbing",
    label: "Plumbing Issues (leaks, pipes)",
    type: "boolean",
    section: "Plumbing",
    required: true,
  },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Electrical",
    required: true,
  },
  {
    id: "hvac",
    label: "HVAC Equipment Condition",
    type: "select",
    section: "Equipment",
    required: true,
    options: ["Working", "Needs repair", "Not present", "Unknown"],
  },
  {
    id: "flooding_history",
    label: "Property Has Flooded",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "Has the property flooded within the last 5 years?",
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
];

// ─── FL: Florida Seller's Disclosure ─────────────────────────────────────────
const FL_FIELDS: FieldSchema[] = [
  {
    id: "known_defects",
    label: "Known Material Defects",
    type: "textarea",
    section: "Property Condition",
    required: true,
    helpText: "Describe any known material defects affecting the property.",
  },
  {
    id: "radon",
    label: "Radon Gas — Test Results or Remediation",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "Florida has elevated radon levels in many areas.",
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
  {
    id: "coastal_erosion",
    label: "Coastal Erosion Risk",
    type: "boolean",
    section: "Environmental",
    required: false,
  },
  {
    id: "sinkholes",
    label: "Sinkhole Risk or Known Sinkhole Activity",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "Florida requires disclosure of known sinkhole activity.",
  },
  {
    id: "flood_zone",
    label: "Property in FEMA Flood Zone",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
];

// ─── NY: Property Condition Disclosure Act ───────────────────────────────────
const NY_FIELDS: FieldSchema[] = [
  {
    id: "opt_out_with_credit",
    label: "Seller elects to provide $500 credit in lieu of completing this form",
    type: "boolean",
    section: "Disclosure Option",
    required: false,
    helpText:
      "If checked, seller provides $500 credit to buyer instead of completing the disclosure form.",
  },
  {
    id: "structural_issues",
    label: "Known Structural Issues",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "lead_paint",
    label: "Pre-1978 Construction with Known Lead Paint",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
];

// ─── GA: Seller's Property Disclosure (Optional) ─────────────────────────────
const GA_FIELDS: FieldSchema[] = [
  {
    id: "property_condition",
    label: "Overall Property Condition",
    type: "select",
    section: "Property Condition",
    required: false,
    options: ["Excellent", "Good", "Fair", "Poor"],
  },
  {
    id: "structural_issues",
    label: "Known Structural Issues",
    type: "boolean",
    section: "Structure",
    required: false,
  },
  {
    id: "systems_condition",
    label: "HVAC, Plumbing, Electrical Condition",
    type: "textarea",
    section: "Systems",
    required: false,
  },
];

// ─── NC: Property Disclosure Statement ───────────────────────────────────────
// NC law allows "No Representation" as valid response for each field
const NC_NO_REP_OPTIONS = ["Yes", "No", "No Representation"];

const NC_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "select",
    section: "Structure",
    required: true,
    options: NC_NO_REP_OPTIONS,
  },
  {
    id: "roof_condition",
    label: "Roof Condition Issues",
    type: "select",
    section: "Structure",
    required: true,
    options: NC_NO_REP_OPTIONS,
  },
  {
    id: "plumbing",
    label: "Plumbing Defects",
    type: "select",
    section: "Systems",
    required: true,
    options: NC_NO_REP_OPTIONS,
  },
  {
    id: "electrical",
    label: "Electrical Defects",
    type: "select",
    section: "Systems",
    required: true,
    options: NC_NO_REP_OPTIONS,
  },
  {
    id: "environmental_issues",
    label: "Environmental Hazards",
    type: "select",
    section: "Environmental",
    required: true,
    options: NC_NO_REP_OPTIONS,
  },
  {
    id: "flooding_history",
    label: "Property Has Flooded",
    type: "select",
    section: "Environmental",
    required: true,
    options: NC_NO_REP_OPTIONS,
  },
];

// ─── AZ: Seller's Property Disclosure Statement (SPDS) ───────────────────────
const AZ_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "utilities",
    label: "Utilities Available (water, sewer, gas, electric)",
    type: "textarea",
    section: "Utilities",
    required: true,
    helpText: "Describe utility connections.",
  },
  {
    id: "solar",
    label: "Solar System Present",
    type: "boolean",
    section: "Systems",
    required: true,
    helpText: "If yes, specify owned or leased.",
  },
];

// ─── OH: Ohio Residential Property Disclosure (ORC 5302.30) ──────────────────
const OH_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "water_intrusion",
    label: "Water Intrusion or Flooding",
    type: "boolean",
    section: "Water",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition (leaks, damage)",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "plumbing",
    label: "Plumbing System Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "electrical",
    label: "Electrical System Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Environmental Hazards (lead, asbestos, radon)",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── PA: Real Estate Seller Disclosure Law (Act 114) ─────────────────────────
const PA_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "flood_zone",
    label: "Property in FEMA Flood Zone",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "hoa",
    label: "Property Subject to HOA or Other Fees",
    type: "boolean",
    section: "HOA",
    required: true,
  },
];

// ─── IL: Residential Real Property Disclosure Act (765 ILCS 77) ──────────────
const IL_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "basement_flooding",
    label: "Basement/Crawlspace Flooding or Water Seepage",
    type: "boolean",
    section: "Water",
    required: true,
  },
  {
    id: "plumbing",
    label: "Plumbing System Problems",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "electrical",
    label: "Electrical System Problems",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "hvac",
    label: "HVAC System Problems",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Environmental Hazards (lead, asbestos, radon, mold)",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "flooding_history",
    label: "Property Has Flooded",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "underground_storage",
    label: "Underground Storage Tanks",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "hoa",
    label: "Property Subject to HOA or Assessments",
    type: "boolean",
    section: "HOA",
    required: true,
  },
];

// ─── AL: Alabama Seller's Disclosure ─────────────────────────────────────────
const AL_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "termite_damage",
    label: "Known Termite or Wood-Destroying Insect Damage",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "Termites are prevalent in Alabama.",
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── AK: Alaska Seller's Disclosure ──────────────────────────────────────────
const AK_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "permafrost",
    label: "Permafrost or Frost Heave Issues",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "Permafrost can cause foundation instability in Alaska.",
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "well_septic",
    label: "Well and Septic System Status",
    type: "textarea",
    section: "Utilities",
    required: true,
  },
];

// ─── AR: Arkansas Residential Property Disclosure ────────────────────────────
const AR_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "termite_damage",
    label: "Known Termite or Wood-Destroying Insect Damage",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── CO: Colorado Seller's Property Disclosure ────────────────────────────────
const CO_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "radon",
    label: "Radon Gas — Test Results or Remediation",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "Colorado has elevated radon levels, especially in mountain regions.",
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── CT: Connecticut Property Condition Disclosure Report ────────────────────
const CT_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "lead_paint",
    label: "Pre-1978 Construction with Known Lead Paint",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── DE: Delaware Seller's Disclosure of Real Property Condition ──────────────
const DE_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "lead_paint",
    label: "Pre-1978 Construction with Known Lead Paint",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── HI: Hawaii Seller's Real Property Disclosure Statement ──────────────────
const HI_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "leasehold",
    label: "Property is Leasehold (not Fee Simple)",
    type: "boolean",
    section: "Ownership",
    required: true,
    helpText: "Many Hawaii properties are leasehold — buyer does not own the land.",
  },
  {
    id: "lava_zone",
    label: "Property Located in Volcanic Lava Zone",
    type: "select",
    section: "Environmental",
    required: true,
    options: [
      "Zone 1 (highest risk)",
      "Zone 2",
      "Zone 3",
      "Zone 4-9 (lower risk)",
      "Not applicable",
    ],
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── ID: Idaho Seller's Property Condition Disclosure Form ───────────────────
const ID_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "well_septic",
    label: "Well and Septic System Status",
    type: "textarea",
    section: "Utilities",
    required: false,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── IN: Indiana Residential Real Estate Sales Disclosure ────────────────────
const IN_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: false,
    helpText: "Indiana seller disclosure is limited in scope.",
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── IA: Iowa Residential Property Seller Disclosure ─────────────────────────
const IA_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "radon",
    label: "Radon Gas — Test Results",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── KS: Kansas Seller's Disclosure ──────────────────────────────────────────
const KS_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "flood_zone",
    label: "Property in FEMA Flood Zone",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── KY: Kentucky Seller's Disclosure of Property Condition ──────────────────
const KY_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "radon",
    label: "Radon Gas — Test Results",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── LA: Louisiana Property Disclosure ───────────────────────────────────────
const LA_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "flood_history",
    label: "Property Has Flooded",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "Louisiana requires disclosure of any flooding within the past 5 years.",
  },
  {
    id: "termite_damage",
    label: "Known Termite or Wood-Destroying Insect Damage",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
];

// ─── ME: Maine Property Disclosure Statement ──────────────────────────────────
const ME_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "lead_paint",
    label: "Pre-1978 Construction with Known Lead Paint",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "well_septic",
    label: "Well and Septic System Status",
    type: "textarea",
    section: "Utilities",
    required: false,
  },
];

// ─── MD: Maryland Residential Property Disclosure and Disclaimer Statement ───
const MD_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "lead_paint",
    label: "Pre-1978 Construction with Known Lead Paint",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── MA: Massachusetts Seller's Disclosure ────────────────────────────────────
const MA_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "lead_paint",
    label: "Pre-1978 Construction with Known Lead Paint",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "Massachusetts has strict lead paint laws for pre-1978 homes.",
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "hoa",
    label: "Property Subject to HOA or Condo Fees",
    type: "boolean",
    section: "HOA",
    required: true,
  },
];

// ─── MI: Michigan Sellers Disclosure Statement ───────────────────────────────
const MI_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "well_septic",
    label: "Well and Septic System Status",
    type: "textarea",
    section: "Utilities",
    required: false,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── MN: Minnesota Seller's Property Disclosure ───────────────────────────────
const MN_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "well_septic",
    label: "Well and Septic System Status",
    type: "textarea",
    section: "Utilities",
    required: false,
    helpText: "Required disclosure if property has private well or septic.",
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── MS: Mississippi Seller's Disclosure Statement ───────────────────────────
const MS_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "termite_damage",
    label: "Known Termite or Wood-Destroying Insect Damage",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── MO: Missouri Seller's Disclosure Statement ───────────────────────────────
const MO_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "flood_zone",
    label: "Property in FEMA Flood Zone",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── MT: Montana Seller's Property Disclosure ─────────────────────────────────
const MT_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "radon",
    label: "Radon Gas — Test Results",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "Montana has elevated radon levels.",
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "well_septic",
    label: "Well and Septic System Status",
    type: "textarea",
    section: "Utilities",
    required: false,
  },
];

// ─── NE: Nebraska Seller's Property Condition Disclosure ─────────────────────
const NE_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── NV: Nevada Seller's Real Property Disclosure ─────────────────────────────
const NV_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "nuisance_disclosure",
    label: "Known Nuisances (noise, odors, agricultural operations)",
    type: "textarea",
    section: "Neighborhood",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── NH: New Hampshire Property Disclosure Form ────────────────────────────────
const NH_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "radon",
    label: "Radon Gas — Test Results",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "New Hampshire has elevated radon levels in many areas.",
  },
  {
    id: "lead_paint",
    label: "Pre-1978 Construction with Known Lead Paint",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "well_septic",
    label: "Well and Septic System Status",
    type: "textarea",
    section: "Utilities",
    required: false,
  },
];

// ─── NJ: New Jersey Seller's Property Condition Disclosure Statement ──────────
const NJ_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "lead_paint",
    label: "Pre-1978 Construction with Known Lead Paint",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── NM: New Mexico Seller's Property Disclosure Statement ────────────────────
const NM_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "water_rights",
    label: "Water Rights — Acequia or Irrigation Rights",
    type: "boolean",
    section: "Utilities",
    required: true,
    helpText: "New Mexico water rights are legally complex and must be disclosed.",
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── ND: North Dakota Seller's Property Disclosure ────────────────────────────
const ND_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "radon",
    label: "Radon Gas — Test Results",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "North Dakota has elevated radon levels.",
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── OK: Oklahoma Residential Property Condition Disclosure Statement ─────────
const OK_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "termite_damage",
    label: "Known Termite or Wood-Destroying Insect Damage",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── OR: Oregon Seller's Property Disclosure Statement ────────────────────────
const OR_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "earthquake_risk",
    label: "Property in Seismic Hazard Zone",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "Oregon requires earthquake risk disclosure for certain geographic areas.",
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── RI: Rhode Island Residential Property Disclosure Form ────────────────────
const RI_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "lead_paint",
    label: "Pre-1978 Construction with Known Lead Paint",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "Rhode Island strictly enforces lead paint disclosure laws.",
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── SC: South Carolina Residential Property Condition Disclosure Statement ───
const SC_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "termite_damage",
    label: "Known Termite or Wood-Destroying Insect Damage",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── SD: South Dakota Seller's Condition Disclosure ───────────────────────────
const SD_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "radon",
    label: "Radon Gas — Test Results",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── TN: Tennessee Residential Property Condition Disclosure ──────────────────
const TN_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "termite_damage",
    label: "Known Termite or Wood-Destroying Insect Damage",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── UT: Utah Seller's Property Condition Disclosure ──────────────────────────
const UT_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "radon",
    label: "Radon Gas — Test Results",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "Utah, especially the Wasatch Front, has elevated radon levels.",
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── VT: Vermont Seller's Property Information Report ─────────────────────────
const VT_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "lead_paint",
    label: "Pre-1978 Construction with Known Lead Paint",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "well_septic",
    label: "Well and Septic System Status",
    type: "textarea",
    section: "Utilities",
    required: false,
  },
];

// ─── VA: Virginia Residential Property Disclosure Statement ───────────────────
const VA_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
  {
    id: "hoa_pending_fees",
    label: "Pending HOA Special Assessments",
    type: "boolean",
    section: "HOA",
    required: true,
  },
];

// ─── WA: Washington Seller Disclosure Statement ────────────────────────────────
const WA_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "earthquake_risk",
    label: "Property in Seismic Hazard Zone",
    type: "boolean",
    section: "Environmental",
    required: true,
    helpText: "Washington requires earthquake risk disclosure.",
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── WV: West Virginia Residential Property Disclosure ────────────────────────
const WV_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "mineral_rights",
    label: "Mineral Rights — Severance or Active Extraction",
    type: "boolean",
    section: "Ownership",
    required: true,
    helpText: "West Virginia mineral rights may be separated from surface rights.",
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── WI: Wisconsin Seller's Real Estate Condition Report ─────────────────────
const WI_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "well_septic",
    label: "Well and Septic System Status",
    type: "textarea",
    section: "Utilities",
    required: false,
    helpText: "Required disclosure if property has private well or septic.",
  },
  { id: "hoa", label: "Property Subject to HOA", type: "boolean", section: "HOA", required: true },
];

// ─── WY: Wyoming Seller's Property Disclosure ─────────────────────────────────
const WY_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "mineral_rights",
    label: "Mineral Rights — Severance from Surface Rights",
    type: "boolean",
    section: "Ownership",
    required: true,
    helpText: "Wyoming mineral rights are commonly separated from surface rights.",
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "well_septic",
    label: "Well and Septic System Status",
    type: "textarea",
    section: "Utilities",
    required: false,
  },
];

// ─── DC: DC Seller's Disclosure of Real Property Condition ───────────────────
const DC_FIELDS: FieldSchema[] = [
  {
    id: "structural_issues",
    label: "Known Structural Defects",
    type: "boolean",
    section: "Structure",
    required: true,
  },
  {
    id: "roof_condition",
    label: "Roof Condition",
    type: "select",
    section: "Structure",
    required: true,
    options: ["No known issues", "Repaired", "Needs repair", "Unknown"],
  },
  { id: "plumbing", label: "Plumbing Issues", type: "boolean", section: "Systems", required: true },
  {
    id: "electrical",
    label: "Electrical Issues",
    type: "boolean",
    section: "Systems",
    required: true,
  },
  {
    id: "lead_paint",
    label: "Pre-1978 Construction with Known Lead Paint",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "environmental_issues",
    label: "Known Environmental Hazards",
    type: "boolean",
    section: "Environmental",
    required: true,
  },
  {
    id: "topa_notice",
    label: "Tenant Opportunity to Purchase Act (TOPA) Notice Issued",
    type: "boolean",
    section: "Legal",
    required: true,
    helpText: "DC law requires TOPA notice to tenants before sale in some cases.",
  },
  {
    id: "hoa",
    label: "Property Subject to HOA or Condo Fees",
    type: "boolean",
    section: "HOA",
    required: true,
  },
];

// ─── Schema Registry ──────────────────────────────────────────────────────────

export const LAUNCH_STATE_SCHEMAS: Record<string, DisclosureFormSchemaTemplate> = {
  // Original 10 launch states
  CA: {
    state: "CA",
    formName: "California Transfer Disclosure Statement (TDS)",
    version: "1.0",
    required: true,
    fields: JSON.stringify(CA_FIELDS),
  },
  TX: {
    state: "TX",
    formName: "TREC Seller's Disclosure Notice (OP-H)",
    version: "1.0",
    required: true,
    fields: JSON.stringify(TX_FIELDS),
  },
  FL: {
    state: "FL",
    formName: "Florida Seller's Real Property Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(FL_FIELDS),
  },
  NY: {
    state: "NY",
    formName: "New York Property Condition Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(NY_FIELDS),
  },
  GA: {
    state: "GA",
    formName: "Georgia Seller's Property Disclosure",
    version: "1.0",
    required: false, // Disclosure is optional in Georgia
    fields: JSON.stringify(GA_FIELDS),
  },
  NC: {
    state: "NC",
    formName: "North Carolina Residential Property Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(NC_FIELDS),
  },
  AZ: {
    state: "AZ",
    formName: "Arizona Seller's Property Disclosure Statement (SPDS)",
    version: "1.0",
    required: true,
    fields: JSON.stringify(AZ_FIELDS),
  },
  OH: {
    state: "OH",
    formName: "Ohio Residential Property Disclosure (ORC 5302.30)",
    version: "1.0",
    required: true,
    fields: JSON.stringify(OH_FIELDS),
  },
  PA: {
    state: "PA",
    formName: "Pennsylvania Seller's Property Disclosure (Act 114)",
    version: "1.0",
    required: true,
    fields: JSON.stringify(PA_FIELDS),
  },
  IL: {
    state: "IL",
    formName: "Illinois Residential Real Property Disclosure (765 ILCS 77)",
    version: "1.0",
    required: true,
    fields: JSON.stringify(IL_FIELDS),
  },
  // 41 new states + DC
  AL: {
    state: "AL",
    formName: "Alabama Seller's Property Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(AL_FIELDS),
  },
  AK: {
    state: "AK",
    formName: "Alaska Seller's Property Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(AK_FIELDS),
  },
  AR: {
    state: "AR",
    formName: "Arkansas Residential Property Disclosure Form",
    version: "1.0",
    required: true,
    fields: JSON.stringify(AR_FIELDS),
  },
  CO: {
    state: "CO",
    formName: "Colorado Seller's Property Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(CO_FIELDS),
  },
  CT: {
    state: "CT",
    formName: "Connecticut Property Condition Disclosure Report",
    version: "1.0",
    required: true,
    fields: JSON.stringify(CT_FIELDS),
  },
  DE: {
    state: "DE",
    formName: "Delaware Seller's Disclosure of Real Property Condition",
    version: "1.0",
    required: true,
    fields: JSON.stringify(DE_FIELDS),
  },
  HI: {
    state: "HI",
    formName: "Hawaii Seller's Real Property Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(HI_FIELDS),
  },
  ID: {
    state: "ID",
    formName: "Idaho Seller's Property Condition Disclosure Form",
    version: "1.0",
    required: true,
    fields: JSON.stringify(ID_FIELDS),
  },
  IN: {
    state: "IN",
    formName: "Indiana Residential Real Estate Sales Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(IN_FIELDS),
  },
  IA: {
    state: "IA",
    formName: "Iowa Residential Property Seller Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(IA_FIELDS),
  },
  KS: {
    state: "KS",
    formName: "Kansas Seller's Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(KS_FIELDS),
  },
  KY: {
    state: "KY",
    formName: "Kentucky Seller's Disclosure of Property Condition",
    version: "1.0",
    required: true,
    fields: JSON.stringify(KY_FIELDS),
  },
  LA: {
    state: "LA",
    formName: "Louisiana Property Disclosure Document",
    version: "1.0",
    required: true,
    fields: JSON.stringify(LA_FIELDS),
  },
  ME: {
    state: "ME",
    formName: "Maine Property Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(ME_FIELDS),
  },
  MD: {
    state: "MD",
    formName: "Maryland Residential Property Disclosure and Disclaimer Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(MD_FIELDS),
  },
  MA: {
    state: "MA",
    formName: "Massachusetts Seller's Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(MA_FIELDS),
  },
  MI: {
    state: "MI",
    formName: "Michigan Sellers Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(MI_FIELDS),
  },
  MN: {
    state: "MN",
    formName: "Minnesota Seller's Property Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(MN_FIELDS),
  },
  MS: {
    state: "MS",
    formName: "Mississippi Seller's Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(MS_FIELDS),
  },
  MO: {
    state: "MO",
    formName: "Missouri Seller's Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(MO_FIELDS),
  },
  MT: {
    state: "MT",
    formName: "Montana Seller's Property Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(MT_FIELDS),
  },
  NE: {
    state: "NE",
    formName: "Nebraska Seller's Property Condition Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(NE_FIELDS),
  },
  NV: {
    state: "NV",
    formName: "Nevada Seller's Real Property Disclosure Form",
    version: "1.0",
    required: true,
    fields: JSON.stringify(NV_FIELDS),
  },
  NH: {
    state: "NH",
    formName: "New Hampshire Property Disclosure Form",
    version: "1.0",
    required: true,
    fields: JSON.stringify(NH_FIELDS),
  },
  NJ: {
    state: "NJ",
    formName: "New Jersey Seller's Property Condition Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(NJ_FIELDS),
  },
  NM: {
    state: "NM",
    formName: "New Mexico Seller's Property Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(NM_FIELDS),
  },
  ND: {
    state: "ND",
    formName: "North Dakota Seller's Property Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(ND_FIELDS),
  },
  OK: {
    state: "OK",
    formName: "Oklahoma Residential Property Condition Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(OK_FIELDS),
  },
  OR: {
    state: "OR",
    formName: "Oregon Seller's Property Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(OR_FIELDS),
  },
  RI: {
    state: "RI",
    formName: "Rhode Island Residential Property Disclosure Form",
    version: "1.0",
    required: true,
    fields: JSON.stringify(RI_FIELDS),
  },
  SC: {
    state: "SC",
    formName: "South Carolina Residential Property Condition Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(SC_FIELDS),
  },
  SD: {
    state: "SD",
    formName: "South Dakota Seller's Condition Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(SD_FIELDS),
  },
  TN: {
    state: "TN",
    formName: "Tennessee Residential Property Condition Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(TN_FIELDS),
  },
  UT: {
    state: "UT",
    formName: "Utah Seller's Property Condition Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(UT_FIELDS),
  },
  VT: {
    state: "VT",
    formName: "Vermont Seller's Property Information Report",
    version: "1.0",
    required: true,
    fields: JSON.stringify(VT_FIELDS),
  },
  VA: {
    state: "VA",
    formName: "Virginia Residential Property Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(VA_FIELDS),
  },
  WA: {
    state: "WA",
    formName: "Washington Seller Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify(WA_FIELDS),
  },
  WV: {
    state: "WV",
    formName: "West Virginia Residential Property Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(WV_FIELDS),
  },
  WI: {
    state: "WI",
    formName: "Wisconsin Seller's Real Estate Condition Report",
    version: "1.0",
    required: true,
    fields: JSON.stringify(WI_FIELDS),
  },
  WY: {
    state: "WY",
    formName: "Wyoming Seller's Property Disclosure",
    version: "1.0",
    required: true,
    fields: JSON.stringify(WY_FIELDS),
  },
  DC: {
    state: "DC",
    formName: "DC Seller's Disclosure of Real Property Condition",
    version: "1.0",
    required: true,
    fields: JSON.stringify(DC_FIELDS),
  },
};

/**
 * Returns the disclosure form schema template for the given state,
 * or null if the state is not found.
 */
export function getFormSchemaForState(state: string): DisclosureFormSchemaTemplate | null {
  return LAUNCH_STATE_SCHEMAS[state] ?? null;
}

/**
 * Returns all 51 state schema templates (50 states + DC).
 */
export function getAvailableFormSchemas(): DisclosureFormSchemaTemplate[] {
  return Object.values(LAUNCH_STATE_SCHEMAS);
}
