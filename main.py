from google_sheets_client import get_data_from_sheet
from chart_generator import create_bar_chart
import pandas as pd

# --- CONFIGURATION ---
# 1. The name/ID of your Google Sheet file.
SHEET_NAME = "1NZZoMBH4tU4l-uTNW4P1zHtpenRLvNDLLLLKlx8YCyk"

# 2. The name of the specific worksheet (tab) within your sheet.
WORKSHEET_NAME = "Listado General"

# 3. The date column to group by and count.
DATE_COLUMN = "fecha_creacion"
# -------------------


def main():
    """
    Main function to run the data fetching, aggregation, and chart generation.
    """
    print("--- Google Sheet Chart Generator ---")

    # 1. Fetch data from Google Sheets
    print(f"\n[1/3] Fetching data from '{SHEET_NAME}' -> '{WORKSHEET_NAME}'...")
    df = get_data_from_sheet(SHEET_NAME, WORKSHEET_NAME)

    # 2. Process data if loaded
    if df is not None and not df.empty:
        print("\n[2/3] Processing and aggregating data by month...")

        # Check if the date column exists
        if DATE_COLUMN not in df.columns:
            print(f"Error: Column '{DATE_COLUMN}' not found in the sheet.")
            print(f"Available columns: {list(df.columns)}")
            return

        # Convert date column to datetime objects, coercing errors
        df[DATE_COLUMN] = pd.to_datetime(df[DATE_COLUMN], errors='coerce')

        # Drop rows where date conversion failed
        df.dropna(subset=[DATE_COLUMN], inplace=True)

        # Group by month and count the occurrences
        monthly_counts = df.groupby(df[DATE_COLUMN].dt.to_period('M')).size().reset_index(name='count')
        
        # Convert period to string for plotting
        monthly_counts[DATE_COLUMN] = monthly_counts[DATE_COLUMN].astype(str)

        print(f"Data aggregated into {len(monthly_counts)} months.")

        # 3. Generate chart
        print("\n[3/3] Generating bar chart...")
        create_bar_chart(
            df=monthly_counts,
            x_column=DATE_COLUMN,
            y_column='count',
            title=f"Count of Rows by Month ({DATE_COLUMN})"
        )
        print("\n--- Process Complete ---")
    elif df is not None and df.empty:
        print("\n[!] The worksheet was loaded but appears to be empty.")
    else:
        print("\n[!] Could not generate chart due to an error during data fetching.")


if __name__ == "__main__":
    main()
