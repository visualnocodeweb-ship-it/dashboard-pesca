import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
import os
import json
import base64
import tempfile # For creating a temporary file if needed

def get_data_from_sheet(sheet_name, worksheet_name):
    """
    Connects to a Google Sheet and returns a worksheet's data as a pandas DataFrame
    and the worksheet object itself.

    :param sheet_name: The ID of the Google Sheet.
    :param worksheet_name: The name of the worksheet within the sheet.
    :return: A tuple containing (pandas.DataFrame, gspread.Worksheet) or (None, None) on error.
    """
    try:
        # Define the scope
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']

        # --- Load credentials securely ---
        credentials_json = None
        if 'GOOGLE_APPLICATION_CREDENTIALS_BASE64' in os.environ:
            encoded_credentials = os.environ['GOOGLE_APPLICATION_CREDENTIALS_BASE64']
            decoded_credentials = base64.b64decode(encoded_credentials).decode('utf-8')
            credentials_json = json.loads(decoded_credentials)
            creds = ServiceAccountCredentials.from_json_keyfile_dict(credentials_json, scope)
        elif os.path.exists('credentials.json'):
            creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', scope)
        else:
            print("Error: No Google Sheet credentials found. Neither environment variable nor credentials.json file.")
            return None, None
        # --- End credential loading ---

        # Authorize the clientsheet
        client = gspread.authorize(creds)

        # Get the instance of the spreadsheet using its key (ID)
        sheet = client.open_by_key(sheet_name)

        # Get the specific worksheet
        worksheet = sheet.worksheet(worksheet_name)

        # Get all the records of the data
        data = worksheet.get_all_records()

        # Convert to a DataFrame
        df = pd.DataFrame(data)

        print("Successfully loaded data from Google Sheet.")
        return df, worksheet

    except gspread.exceptions.SpreadsheetNotFound:
        print(f"Error: Spreadsheet '{sheet_name}' not found.")
        print("Please make sure you have shared the sheet with the client email:")
        if credentials_json:
            print(credentials_json.get('client_email'))
        elif os.path.exists('credentials.json'):
            with open('credentials.json', 'r') as f:
                creds_data = json.load(f)
                print(creds_data.get('client_email'))
        return None, None
    except gspread.exceptions.WorksheetNotFound:
        print(f"Error: Worksheet '{worksheet_name}' not found in spreadsheet '{sheet_name}'.")
        return None, None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None, None

if __name__ == '__main__':
    # This is an example of how to use the function.
    # IMPORTANT: Replace with your actual sheet and worksheet names.
    # You also need to share your Google Sheet with the client_email from your credentials.json file.
    
    # FILL THESE IN
    SHEET_NAME = "YOUR_SHEET_NAME" 
    WORKSHEET_NAME = "YOUR_WORKSHEET_NAME"

    if SHEET_NAME == "YOUR_SHEET_NAME" or WORKSHEET_NAME == "YOUR_WORKSHEET_NAME":
        print("Please update the SHEET_NAME and WORKSHEET_NAME variables in google_sheets_client.py")
    else:
        # For local testing, ensure credentials.json is present or GOOGLE_APPLICATION_CREDENTIALS_BASE64 is set
        dataframe, _ = get_data_from_sheet(SHEET_NAME, WORKSHEET_NAME)
        if dataframe is not None:
            print("First 5 rows of the dataframe:")
            print(dataframe.head())