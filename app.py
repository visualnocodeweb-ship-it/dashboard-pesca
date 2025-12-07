from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import pandas as pd
from google_sheets_client import get_data_from_sheet
import time
import os
from collections import Counter

# --- CONFIGURATION ---
SHEET_NAME = "1NZZoMBH4tU4l-uTNW4P1zHtpenRLvNDLLLLKlx8YCyk"
WORKSHEET_NAME = "Listado General"
DATE_COLUMN = "fecha_creacion"
PERMIT_START_ROW = 11136
RECAUDACION_COLUMN = "Ingresosnetos(conformato)"
PRODUCTO_COLUMN = "nombre_producto"
CACHE_DURATION_SECONDS = 60
# -------------------

app = Flask(__name__, static_folder='dashboard-frontend/dist', static_url_path='/')
CORS(app)  # This will enable CORS for all routes

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
    df_copy[DATE_COLUMN] = pd.to_datetime(df_copy[DATE_COLUMN], errors='coerce', infer_datetime_format=True)
    df_copy = df_copy.dropna(subset=[DATE_COLUMN])

    if start_date:
        start_ts = pd.to_datetime(start_date, dayfirst=True)
        df_copy = df_copy[df_copy[DATE_COLUMN] >= start_ts]
    if end_date:
        end_ts = pd.to_datetime(end_date, dayfirst=True)
        df_copy = df_copy[df_copy[DATE_COLUMN] <= end_ts + pd.Timedelta(days=1, seconds=-1)]
    
    return df_copy

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route("/api/chart-data")
def get_chart_data():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    try:
        df = get_cached_dataframe()
        if df is None or df.empty:
            return jsonify([])

        df_filtered = df.iloc[PERMIT_START_ROW - 2:].copy()
        df_filtered = _filter_by_date_range(df_filtered, start_date, end_date)

        if df_filtered.empty:
            return jsonify([])

        df_filtered[DATE_COLUMN] = pd.to_datetime(df_filtered[DATE_COLUMN], errors='coerce', dayfirst=True)
        df_filtered = df_filtered.dropna(subset=[DATE_COLUMN])
        
        daily_counts = df_filtered.groupby(df_filtered[DATE_COLUMN].dt.date).size().reset_index(name='count')
        daily_counts.rename(columns={DATE_COLUMN: 'date'}, inplace=True)
        daily_counts['date'] = daily_counts['date'].astype(str)
        
        return jsonify(daily_counts.to_dict(orient='records'))
    except Exception as e:
        print(f"API ERROR in /api/chart-data: {e}")
        return jsonify({"error": "Error processing chart data on the server."}), 500

@app.route("/api/permit-count")
def get_permit_count():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    df = get_cached_dataframe()
    if df is None:
        return jsonify({"error": "Could not connect to the worksheet."}), 500

    df_filtered = df.iloc[PERMIT_START_ROW - 2:].copy()
    df_filtered = _filter_by_date_range(df_filtered, start_date, end_date)

    permit_count = len(df_filtered.index)
        
    return jsonify({"count": permit_count})

@app.route("/api/total-recaudacion")
def get_total_recaudacion():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    df = get_cached_dataframe()
    if df is None:
        return jsonify({"error": "Could not connect to the worksheet."}), 500

    df_filtered = df.iloc[PERMIT_START_ROW - 2:].copy()
    df_filtered = _filter_by_date_range(df_filtered, start_date, end_date)

    if df_filtered.empty:
        return jsonify({"total": 0})
    
    if RECAUDACION_COLUMN not in df_filtered.columns:
        return jsonify({"error": f"Column '{RECAUDACION_COLUMN}' not found."}), 400

    numeric_series = pd.to_numeric(df_filtered[RECAUDACION_COLUMN], errors='coerce')
    total_recaudacion = numeric_series.sum()
    
    return jsonify({"total": total_recaudacion})

@app.route("/api/recaudacion-por-dia")
def get_recaudacion_por_dia():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    try:
        df = get_cached_dataframe()
        if df is None or df.empty:
            return jsonify([])

        df_filtered = df.iloc[PERMIT_START_ROW - 2:].copy()
        df_filtered = _filter_by_date_range(df_filtered, start_date, end_date)

        if df_filtered.empty:
            return jsonify([])
        
        if DATE_COLUMN not in df_filtered.columns or RECAUDACION_COLUMN not in df_filtered.columns:
            return jsonify({"error": "Required columns not found."}), 400

        df_filtered[DATE_COLUMN] = pd.to_datetime(df_filtered[DATE_COLUMN], errors='coerce', dayfirst=True)
        df_filtered = df_filtered.dropna(subset=[DATE_COLUMN])
        df_filtered[RECAUDACION_COLUMN] = pd.to_numeric(df_filtered[RECAUDACION_COLUMN], errors='coerce').fillna(0)

        daily_sums = df_filtered.groupby(df_filtered[DATE_COLUMN].dt.date)[RECAUDACION_COLUMN].sum().reset_index()
        daily_sums.rename(columns={DATE_COLUMN: 'date', RECAUDACION_COLUMN: 'recaudacion'}, inplace=True)
        daily_sums['date'] = daily_sums['date'].astype(str)
        
        return jsonify(daily_sums.to_dict(orient='records'))
    except Exception as e:
        print(f"API ERROR in /api/recaudacion-por-dia: {e}")
        return jsonify({"error": "Error processing daily revenue data."}), 500

@app.route("/api/categoria-pesca")
def get_categoria_pesca():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    try:
        df = get_cached_dataframe()
        if df is None or df.empty:
            return jsonify([])

        df_filtered = df.iloc[PERMIT_START_ROW - 2:].copy()
        df_filtered = _filter_by_date_range(df_filtered, start_date, end_date)

        if df_filtered.empty:
            return jsonify([])

        if PRODUCTO_COLUMN not in df_filtered.columns:
            return jsonify({"error": f"Column '{PRODUCTO_COLUMN}' not found."}), 400

        counts = df_filtered[PRODUCTO_COLUMN].value_counts().reset_index()
        counts.columns = ['name', 'count']
        
        return jsonify(counts.to_dict(orient='records'))
    except Exception as e:
        print(f"API ERROR in /api/categoria-pesca: {e}")
        return jsonify({"error": "Error processing product category data."}), 500

@app.route("/api/regiones-count")
def get_regiones_count():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    REGIONES_COLUMN = "Region/es"
    REGIONES_A_CONTAR = ["Confluencia", "Comarca", "Lagos del Sur", "Pehuén", "Alto Neuquén", "Limay", "Vaca Muerta"]
    
    try:
        df = get_cached_dataframe()
        if df is None or df.empty:
            return jsonify([])

        df_filtered = df.iloc[PERMIT_START_ROW - 2:].copy()
        df_filtered = _filter_by_date_range(df_filtered, start_date, end_date)

        if df_filtered.empty:
            return jsonify([])

        if REGIONES_COLUMN not in df_filtered.columns:
            return jsonify({"error": f"Column '{REGIONES_COLUMN}' not found."}), 400

        region_counts = Counter()
        for item in df_filtered[REGIONES_COLUMN].dropna():
            regions_in_cell = [region.strip() for region in str(item).split(',')]
            for region in regions_in_cell:
                if region in REGIONES_A_CONTAR:
                    region_counts[region] += 1
        
        chart_data = [{"name": name, "count": count} for name, count in region_counts.items()]
        
        return jsonify(chart_data)
    except Exception as e:
        print(f"API ERROR in /api/regiones-count: {e}")
        return jsonify({"error": "Error processing regions data."}), 500

@app.route("/api/latest-records")
def get_latest_records():
    try:
        df = get_cached_dataframe()
        if df is None or df.empty:
            return jsonify([])

        required_indices = [0, 1, 4, 5, 16] # A, B, E, F, Q
        if max(required_indices) >= len(df.columns):
            return jsonify({"error": "Not enough columns in the sheet to retrieve specified data (A, B, E, F, Q)."}), 400

        col_A_name = df.columns[0]
        col_B_name = df.columns[1]
        col_E_name = df.columns[4]
        col_F_name = df.columns[5]
        col_Q_name = df.columns[16]
        
        columns_to_select = [col_A_name, col_B_name, col_E_name, col_F_name, col_Q_name]
        latest_records_df = df[columns_to_select].tail(10)
        
        return jsonify(latest_records_df.to_dict(orient='records'))
    except Exception as e:
        print(f"API ERROR in /api/latest-records: {e}")
        return jsonify({"error": "Error retrieving latest records."}), 500

@app.route("/api/debug-data")
def debug_data_endpoint():
    try:
        df = get_cached_dataframe()
        if df is None:
            return jsonify({"error": "Could not connect to the worksheet or fetch data."}), 500
        
        # Apply the PERMIT_START_ROW filter
        df_filtered = df.iloc[PERMIT_START_ROW - 2:].copy()

        # Select relevant columns and add index
        if DATE_COLUMN in df_filtered.columns:
            debug_df = df_filtered[[DATE_COLUMN]].copy()
            debug_df['original_index'] = df_filtered.index
        else:
            debug_df = pd.DataFrame({'original_index': df_filtered.index, 'message': 'DATE_COLUMN not found'})

        # Return head and tail
        return jsonify({
            "dataframe_head": debug_df.head(10).to_dict(orient='records'),
            "dataframe_tail": debug_df.tail(10).to_dict(orient='records'),
            "total_rows_after_permit_filter": len(df_filtered)
        })
    except Exception as e:
        print(f"API ERROR in /api/debug-data: {e}")
        return jsonify({"error": "Error in debug data endpoint."}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)