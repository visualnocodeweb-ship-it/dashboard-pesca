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

def _filter_by_date_range(df: pd.DataFrame, start_date: str = None, end_date: str = None) -> pd.DataFrame:
    """
    Helper function to filter a DataFrame by a date range.
    Assumes DATE_COLUMN exists and is in a format pandas can convert.
    """
    if df.empty:
        return df

    df_copy = df.copy()
    df_copy[DATE_COLUMN] = pd.to_datetime(df_copy[DATE_COLUMN], errors='coerce', dayfirst=True)
    df_copy = df_copy.dropna(subset=[DATE_COLUMN])

    if start_date:
        start_ts = pd.to_datetime(start_date, dayfirst=True)
        df_copy = df_copy[df_copy[DATE_COLUMN] >= start_ts]
    if end_date:
        end_ts = pd.to_datetime(end_date, dayfirst=True)
        # Include the entire end day
        df_copy = df_copy[df_copy[DATE_COLUMN] <= end_ts + pd.Timedelta(days=1, seconds=-1)]
    
    return df_copy

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
def get_chart_data(start_date: str = None, end_date: str = None):
    """
    Endpoint para obtener y procesar los datos para el gráfico de conteo por día.
    Acepta parámetros opcionales `start_date` y `end_date` para filtrar por rango.
    """
    try:
        df = get_cached_dataframe()
        if df is None or df.empty:
            return []

        df_filtered = df.iloc[PERMIT_START_ROW - 2:].copy()
        
        # Apply date filtering
        df_filtered = _filter_by_date_range(df_filtered, start_date, end_date)

        if df_filtered.empty:
            return []

        df_filtered[DATE_COLUMN] = pd.to_datetime(df_filtered[DATE_COLUMN], errors='coerce', dayfirst=True)
        df_filtered = df_filtered.dropna(subset=[DATE_COLUMN])
        
        daily_counts = df_filtered.groupby(df_filtered[DATE_COLUMN].dt.date).size().reset_index(name='count')
        daily_counts.rename(columns={DATE_COLUMN: 'date'}, inplace=True)
        daily_counts['date'] = daily_counts['date'].astype(str)
        
        return daily_counts.to_dict(orient='records')
    except Exception as e:
        print(f"API ERROR in /api/chart-data: {e}")
        raise HTTPException(status_code=500, detail="Error processing chart data on the server.")


@app.get("/api/permit-count")
def get_permit_count(start_date: str = None, end_date: str = None):
    """
    Endpoint para contar el número de permisos vendidos desde una fila específica,
    opcionalmente filtrado por rango de fechas.
    """
    df = get_cached_dataframe()
    if df is None:
        return {"error": "Could not connect to the worksheet."}

    df_filtered = df.iloc[PERMIT_START_ROW - 2:].copy()
    
    # Apply date filtering
    df_filtered = _filter_by_date_range(df_filtered, start_date, end_date)

    permit_count = len(df_filtered.index)
        
    return {"count": permit_count}

@app.get("/api/total-recaudacion")
def get_total_recaudacion(start_date: str = None, end_date: str = None):
    """
    Endpoint para sumar los ingresos netos desde una fila específica,
    opcionalmente filtrado por rango de fechas.
    """
    df = get_cached_dataframe()
    if df is None:
        return {"error": "Could not connect to the worksheet."}

    df_filtered = df.iloc[PERMIT_START_ROW - 2:].copy()
    
    # Apply date filtering
    df_filtered = _filter_by_date_range(df_filtered, start_date, end_date)

    if df_filtered.empty:
        return {"total": 0}
    
    if RECAUDACION_COLUMN not in df_filtered.columns:
        return {"error": f"Column '{RECAUDACION_COLUMN}' not found."}

    numeric_series = pd.to_numeric(df_filtered[RECAUDACION_COLUMN], errors='coerce')
    total_recaudacion = numeric_series.sum()
    
    return {"total": total_recaudacion}


@app.get("/api/recaudacion-por-dia")
def get_recaudacion_por_dia(start_date: str = None, end_date: str = None):
    """
    Endpoint para obtener la recaudación total por día,
    opcionalmente filtrado por rango de fechas.
    """
    try:
        df = get_cached_dataframe()
        if df is None or df.empty:
            return []

        df_filtered = df.iloc[PERMIT_START_ROW - 2:].copy()
        
        # Apply date filtering
        df_filtered = _filter_by_date_range(df_filtered, start_date, end_date)

        if df_filtered.empty:
            return []
        
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
def get_categoria_pesca(start_date: str = None, end_date: str = None):
    """
    Endpoint para contar la cantidad de cada 'nombre_producto',
    opcionalmente filtrado por rango de fechas.
    """
    PRODUCTO_COLUMN = "nombre_producto"
    try:
        df = get_cached_dataframe()
        if df is None or df.empty:
            return []

        df_filtered = df.iloc[PERMIT_START_ROW - 2:].copy()

        # Apply date filtering
        df_filtered = _filter_by_date_range(df_filtered, start_date, end_date)

        if df_filtered.empty:
            return []

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
def get_regiones_count(start_date: str = None, end_date: str = None):
    """
    Endpoint para contar la ocurrencia de regiones específicas,
    opcionalmente filtrado por rango de fechas.
    """
    REGIONES_COLUMN = "Region/es"
    REGIONES_A_CONTAR = ["Confluencia", "Comarca", "Lagos del Sur", "Pehuén", "Alto Neuquén", "Limay", "Vaca Muerta"]
    
    try:
        df = get_cached_dataframe()
        if df is None or df.empty:
            return []

        df_filtered = df.iloc[PERMIT_START_ROW - 2:].copy()

        # Apply date filtering
        df_filtered = _filter_by_date_range(df_filtered, start_date, end_date)

        if df_filtered.empty:
            return []

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