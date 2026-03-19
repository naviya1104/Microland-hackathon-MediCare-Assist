const medicineDataset = [
  {
    name: "Amlodipine",
    use: "Treats high blood pressure (hypertension) and chest pain (angina). Belongs to calcium channel blocker class.",
    side_effects: ["Swelling of ankles/feet", "Dizziness", "Flushing", "Headache", "Fatigue"],
    warning: "Do not stop suddenly. Avoid grapefruit juice. Monitor blood pressure regularly."
  },
  {
    name: "Metformin",
    use: "First-line medication for type 2 diabetes. Lowers blood sugar by reducing glucose production in the liver.",
    side_effects: ["Nausea", "Diarrhea", "Stomach upset", "Metallic taste", "Loss of appetite"],
    warning: "Take with food to reduce stomach upset. Stay well-hydrated. Avoid alcohol. Risk of lactic acidosis if kidney function is poor."
  },
  {
    name: "Paracetamol",
    use: "Common pain reliever and fever reducer (analgesic/antipyretic). Used for mild to moderate pain.",
    side_effects: ["Rare at therapeutic doses", "Liver damage with overdose", "Allergic skin reactions in rare cases"],
    warning: "Do not exceed 4g per day (2g in elderly). Avoid alcohol. Dangerous in overdose — do not combine with other paracetamol-containing products."
  },
  {
    name: "Atorvastatin",
    use: "Lowers bad cholesterol (LDL) and triglycerides to reduce risk of heart attack and stroke. A statin medication.",
    side_effects: ["Muscle aches or weakness", "Liver enzyme changes", "Headache", "Nausea", "Joint pain"],
    warning: "Report unexplained muscle pain or weakness immediately. Take at the same time each day (evening preferred). Avoid large amounts of grapefruit juice."
  },
  {
    name: "Losartan",
    use: "Treats high blood pressure and protects the kidneys in diabetic patients. An angiotensin receptor blocker (ARB).",
    side_effects: ["Dizziness on standing", "High potassium levels", "Back pain", "Fatigue", "Nasal congestion"],
    warning: "Avoid potassium supplements or salt substitutes containing potassium. Monitor kidney function. Stay hydrated. Do not use in pregnancy."
  }
];

// Normalize lookup by name (case-insensitive)
function lookupMedicine(name) {
  const normalized = name.toLowerCase().trim();
  return medicineDataset.find(
    (m) => m.name.toLowerCase() === normalized
  ) || null;
}

module.exports = { medicineDataset, lookupMedicine };
