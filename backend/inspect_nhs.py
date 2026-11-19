
import pandas as pd

file_path = "data/Monthly-AE-Time-Series-August-2026-YG43sd.xls"

columns = [
    "Period",
    "Type_1_Attendances",
    "Type_2_Attendances",
    "Type_3_Attendances",
    "Total_Attendances",
    "Admissions_Type_1",
    "Admissions_Type_2",
    "Admissions_Type_3_4",
    "Total_Admissions_via_AE",
    "Other_Emergency_Admissions",
    "Total_Emergency_Admissions",
    "Patients_Over_4_Hours",
    "Patients_Over_12_Hours",
    "Unused_Column",
    "Operational_Standard"
]

df = pd.read_excel(
    file_path,
    sheet_name="Activity",
    header=13,
    usecols="B:P"
)

df.columns = columns

# Remove the unused column
df = df.drop(columns=["Unused_Column"])

# Clean date and numeric fields
df["Period"] = pd.to_datetime(df["Period"], errors="coerce")

for col in df.columns:
    if col != "Period":
        df[col] = pd.to_numeric(df[col], errors="coerce")

# Remove invalid dates
df = df.dropna(subset=["Period"])

# Sort chronologically
df = df.sort_values("Period")

# Export cleaned data
df.to_csv("data/nhs_cleaned.csv", index=False)

print("NHS DATA CLEANED SUCCESSFULLY")
print("Dataset shape:", df.shape)
print("\nColumns:")
print(df.columns.tolist())
print("\nFirst five records:")
print(df.head())
print("\nMissing values:")
print(df.isnull().sum())
