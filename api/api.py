from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from google_sheets_client import get_data_from_sheet
import time

# --- CONFIGURATION ---
SHEET_NAME = "1NZZoMBH4tU4l-uTNW4P1zHtpenRLvNDLLLLKlx8YCyk"
WORKSHEET_NAME = "Listado General"
DATE_COLUMN = "fecha_creacion"
PERMIT_START_ROW = 11136
RECAUDACION_COLUMN = "Ingresosnetos(conformato)"
PRODUCTO_COLUMN = "nombre_producto"
CACHE_DURATION_SECONDS = 60
# -------------------

app = FastAPI()

# --- Caching Mechanism ---
class DataCache:
    def __init__(self):
        self.df = None
        self.last_fetched_time = 0

cache = DataCache()

def get_cached_dataframe():
    """
    Returns a cached pandas DataFrame, fetching a new one if the cache is stale.
    """
    current_time = time.time()
    if cache.df is None or (current_time - cache.last_fetched_time) > CACHE_DURATION_SECONDS:
        print("--- CACHE STALE: Fetching new data from Google Sheets... ---")
        # We only need the dataframe for all calculations
        df, _ = get_data_from_sheet(SHEET_NAME, WORKSHEET_NAME)
        cache.df = df
        cache.last_fetched_time = current_time
        print("--- CACHE UPDATED ---")
    else:
        print("--- Using CACHED data ---")
    return cache.df
# -------------------------

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/chart-data")
def get_chart_data():
    """
    Endpoint para obtener y procesar los datos para el gráfico de conteo por día.
    """
    try:
        df = get_cached_dataframe()
        if df is None or df.empty:
            # Return empty list as the frontend expects an array for the chart
            return []

        start_index = PERMIT_START_ROW - 2
        if len(df.index) <= start_index:
            return []
        
        df_filtered = df.iloc[start_index:].copy()
        
        df_filtered[DATE_COLUMN] = pd.to_datetime(df_filtered[DATE_COLUMN], errors='coerce', dayfirst=True)
        
        # Safer alternative to inplace=True
        df_filtered = df_filtered.dropna(subset=[DATE_COLUMN])
        
        daily_counts = df_filtered.groupby(df_filtered[DATE_COLUMN].dt.date).size().reset_index(name='count')
        daily_counts.rename(columns={DATE_COLUMN: 'date'}, inplace=True)
        daily_counts['date'] = daily_counts['date'].astype(str)
        
        return daily_counts.to_dict(orient='records')
    except Exception as e:
        print(f"API ERROR in /api/chart-data: {e}")
        # Raising HTTPException will send a proper error response to the frontend
        raise HTTPException(status_code=500, detail="Error processing chart data on the server.")


@app.get("/api/permit-count")
def get_permit_count():
    """
    Endpoint para contar el número de permisos vendidos desde una fila específica.
    """
    df = get_cached_dataframe()
    if df is None:
        return {"error": "Could not connect to the worksheet."}

    total_data_rows = len(df.index)
    start_index = PERMIT_START_ROW - 2
    
    permit_count = 0
    if total_data_rows > start_index:
        permit_count = total_data_rows - start_index
        
    return {"count": permit_count}

@app.get("/api/total-recaudacion")
def get_total_recaudacion():
    """
    Endpoint para sumar los ingresos netos desde una fila específica.
    """
    df = get_cached_dataframe()
    if df is None:
        return {"error": "Could not connect to the worksheet."}

    start_index = PERMIT_START_ROW - 2
    if len(df.index) <= start_index:
        return {"total": 0}

    df_filtered = df.iloc[start_index:]
    
    if RECAUDACION_COLUMN not in df_filtered.columns:
        return {"error": f"Column '{RECAUDACION_COLUMN}' not found."}

    numeric_series = pd.to_numeric(df_filtered[RECAUDACION_COLUMN], errors='coerce')
    total_recaudacion = numeric_series.sum()
    
    return {"total": total_recaudacion}


@app.get("/api/recaudacion-por-dia")
def get_recaudacion_por_dia():
    """
    Endpoint para obtener la recaudación total por día.
    """
    try:
        df = get_cached_dataframe()
        if df is None or df.empty:
            return []

        start_index = PERMIT_START_ROW - 2
        if len(df.index) <= start_index:
            return []
        
        df_filtered = df.iloc[start_index:].copy()
        
        # Ensure required columns exist
        if DATE_COLUMN not in df_filtered.columns or RECAUDACION_COLUMN not in df_filtered.columns:
            raise HTTPException(status_code=400, detail=f"Required columns not found.")

        # Prepare date column
        df_filtered[DATE_COLUMN] = pd.to_datetime(df_filtered[DATE_COLUMN], errors='coerce', dayfirst=True)
        df_filtered = df_filtered.dropna(subset=[DATE_COLUMN])

        # Prepare revenue column
        df_filtered[RECAUDACION_COLUMN] = pd.to_numeric(df_filtered[RECAUDACION_COLUMN], errors='coerce').fillna(0)

        # Group by date and sum the revenue
        daily_sums = df_filtered.groupby(df_filtered[DATE_COLUMN].dt.date)[RECAUDACION_COLUMN].sum().reset_index()
        daily_sums.rename(columns={DATE_COLUMN: 'date', RECAUDACION_COLUMN: 'recaudacion'}, inplace=True)
        
        daily_sums['date'] = daily_sums['date'].astype(str)
        
        return daily_sums.to_dict(orient='records')
    except Exception as e:
        print(f"API ERROR in /api/recaudacion-por-dia: {e}")
        raise HTTPException(status_code=500, detail="Error processing daily revenue data.")


@app.get("/api/categoria-pesca")
def get_categoria_pesca():
    """
    Endpoint para contar la cantidad de cada 'nombre_producto'.
    """
    PRODUCTO_COLUMN = "nombre_producto"
    try:
        df = get_cached_dataframe()
        if df is None or df.empty:
            return []

        start_index = PERMIT_START_ROW - 2
        if len(df.index) <= start_index:
            return []
        
        df_filtered = df.iloc[start_index:]

        if PRODUCTO_COLUMN not in df_filtered.columns:
            raise HTTPException(status_code=400, detail=f"Column '{PRODUCTO_COLUMN}' not found.")

        # Get the counts of each unique value in the column
        counts = df_filtered[PRODUCTO_COLUMN].value_counts().reset_index()
        counts.columns = ['name', 'count']
        
        return counts.to_dict(orient='records')
    except Exception as e:
        print(f"API ERROR in /api/categoria-pesca: {e}")
        raise HTTPException(status_code=500, detail="Error processing product category data.")


@app.get("/api/regiones-count")
def get_regiones_count():
    """
    Endpoint para contar la ocurrencia de regiones específicas.
    """
    REGIONES_COLUMN = "Region/es"
    REGIONES_A_CONTAR = ["Confluencia", "Comarca", "Lagos del Sur", "Pehuén", "Alto Neuquén", "Limay", "Vaca Muerta"]
    
    try:
        df = get_cached_dataframe()
        if df is None or df.empty:
            return []

        start_index = PERMIT_START_ROW - 2
        if len(df.index) <= start_index:
            return []
        
        df_filtered = df.iloc[start_index:]

        if REGIONES_COLUMN not in df_filtered.columns:
            raise HTTPException(status_code=400, detail=f"Column '{REGIONES_COLUMN}' not found.")

        # Use collections.Counter for efficient counting
        from collections import Counter
        region_counts = Counter()

        # Iterate over the series, handle NaNs, split by comma, and count
        for item in df_filtered[REGIONES_COLUMN].dropna():
            regions_in_cell = [region.strip() for region in str(item).split(',')]
            for region in regions_in_cell:
                if region in REGIONES_A_CONTAR:
                    region_counts[region] += 1
        
        # Format for recharts: [{"name": "Region A", "count": 123}, ...]
        chart_data = [{"name": name, "count": count} for name, count in region_counts.items()]
        
        return chart_data
    except Exception as e:
        print(f"API ERROR in /api/regiones-count: {e}")
        raise HTTPException(status_code=500, detail="Error processing regions data.")


@app.get("/")
def read_root():
    return {"message": "API para el Dashboard de Pesca"}

@app.get("/api/latest-records")
def get_latest_records():
    """
    Endpoint para obtener los últimos 10 registros de la hoja de cálculo,
    filtrando por las columnas especificadas (A, B, E, F, Q).
    """
    try:
        df = get_cached_dataframe()
        if df is None or df.empty:
            return []

        # Get the actual column names from the DataFrame using their index
        # Assuming the DataFrame columns are in the order A, B, C, ...
        # This is a critical assumption. If the sheet has empty columns or
        # the order is not strictly alphabetical, these indices will be wrong.
        # User might need to adjust these to actual column names.
        
        # Check if DataFrame has enough columns
        required_indices = [0, 1, 4, 5, 16] # A, B, E, F, Q
        if max(required_indices) >= len(df.columns):
            raise HTTPException(status_code=400, detail="Not enough columns in the sheet to retrieve specified data (A, B, E, F, Q).")

        col_A_name = df.columns[0]
        col_B_name = df.columns[1]
        col_E_name = df.columns[4]
        col_F_name = df.columns[5]
        col_Q_name = df.columns[16]
        
        columns_to_select = [col_A_name, col_B_name, col_E_name, col_F_name, col_Q_name]

        # Get the last 10 records
        latest_records_df = df[columns_to_select].tail(10)
        
        # Convert to list of dictionaries for JSON response
        return latest_records_df.to_dict(orient='records')
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"API ERROR in /api/latest-records: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving latest records.")