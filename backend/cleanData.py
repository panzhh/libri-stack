import pandas as pd
import json
import re
import numpy as np


def to_camel_case(text):
    # Remove special characters and split by non-alphanumeric
    words = re.sub(r"[^a-zA-Z0-9]", " ", text).split()
    if not words:
        return ""
    # Lowercase first word, capitalize others
    camel = words[0].lower() + "".join(word.capitalize() for word in words[1:])
    return camel


# Load the file
df = pd.read_csv("../src/data/book_list_cleaned.csv")

# Create mapping for camelCase columns
new_columns = {col: to_camel_case(col) for col in df.columns}

# Rename columns
df_camel = df.rename(columns=new_columns)

# Replace NaN with None for valid JSON nulls
df_final = df_camel.astype(object).replace({np.nan: None})

# Convert to list of dicts
books_list = df_final.to_dict(orient="records")

# Save to books.json
with open("../src/data/books.json", "w", encoding="utf-8") as f:
    json.dump(books_list, f, indent=2, ensure_ascii=False)

# Print a few examples of the mapping for the user
print("Mapping examples:")
for old_col in list(df.columns)[:15]:
    print(f"  {old_col} -> {to_camel_case(old_col)}")
