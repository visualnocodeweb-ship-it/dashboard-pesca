import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
import os
import json
import base64
import tempfile # For creating a temporary file if needed

def get_data_from_sheet(sheet_name, worksheet_name):
    print(f"get_data_from_sheet: Intentando obtener datos para sheet_name='{sheet_name}', worksheet_name='{worksheet_name}'")
    try:
        # Define the scope
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']

        # --- Load credentials securely ---
        print("get_data_from_sheet: Cargando credenciales...")
        credentials_json = None
        if 'GOOGLE_APPLICATION_CREDENTIALS_BASE64' in os.environ:
            print("get_data_from_sheet: Usando GOOGLE_APPLICATION_CREDENTIALS_BASE64 desde variable de entorno.")
            encoded_credentials = os.environ['GOOGLE_APPLICATION_CREDENTIALS_BASE64']
            decoded_credentials = base64.b64decode(encoded_credentials).decode('utf-8')
            credentials_json = json.loads(decoded_credentials)
            creds = ServiceAccountCredentials.from_json_keyfile_dict(credentials_json, scope)
        elif os.path.exists('credentials.json'):
            print("get_data_from_sheet: Usando credentials.json desde archivo local.")
            try:
                creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', scope)
                print("get_data_from_sheet: Credenciales desde archivo local cargadas con éxito.")
            except Exception as e:
                print(f"Error: Fallo al cargar credenciales desde credentials.json: {e}")
                return None, None
        else:
            print("Error: No Google Sheet credentials found. Neither environment variable nor credentials.json file.")
            return None, None
        
        if credentials_json and credentials_json.get('client_email'):
            print(f"get_data_from_sheet: Client Email de credenciales: {credentials_json.get('client_email')}")
        elif os.path.exists('credentials.json'):
            try:
                with open('credentials.json', 'r') as f:
                    creds_data = json.load(f)
                    print(f"get_data_from_sheet: Client Email de credentials.json: {creds_data.get('client_email')}")
            except Exception as e_creds_read:
                print(f"get_data_from_sheet: Error al leer client_email de credentials.json: {e_creds_read}")

        print("get_data_from_sheet: Credenciales cargadas. Autorizando gspread...")
        # --- End credential loading ---

        # Authorize the clientsheet
        client = gspread.authorize(creds)
        print("get_data_from_sheet: gspread autorizado. Abriendo hoja de cálculo...")

        # Get the instance of the spreadsheet using its key (ID)
        sheet = client.open_by_key(sheet_name)
        print(f"get_data_from_sheet: Hoja de cálculo '{sheet_name}' abierta. Accediendo a pestaña '{worksheet_name}'...")

        # Get the specific worksheet
        worksheet = sheet.worksheet(worksheet_name)
        print(f"get_data_from_sheet: Pestaña '{worksheet_name}' accedida. Obteniendo todos los registros...")

        # Get all the records of the data
        data = worksheet.get_all_records()
        print(f"get_data_from_sheet: Registros obtenidos. {len(data)} filas.")

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
        print(f"An unexpected error occurred in get_data_from_sheet: {e}")
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