import { useEffect, useState } from 'react';
import axios from 'axios';
// import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { format } from 'date-fns';

// Interface for the daily chart data
interface DailyData {
  date: string;
  count: number;
}

const FIXED_START_DATE = '15/10/2025'; // October 15, 2025

function PermisosDashboard() {
  // Function to get the current date formatted for API calls (DD/MM/YYYY)
  const getCurrentFormattedDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // State for the total permit counter
  const [permitCount, setPermitCount] = useState<number>(0);
  const [countLoading, setCountLoading] = useState(true);
  const [countError, setCountError] = useState<string | null>(null);

  // State for the daily bar chart
  const [chartData, setChartData] = useState<DailyData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  // Effect for fetching total permit count
  useEffect(() => {
    const fetchCount = () => {
      const params = {
        start_date: FIXED_START_DATE,
        end_date: getCurrentFormattedDate(),
      };
      console.log('Fetching permit count with params:', params);
      axios.get('/api/app/permit-count', { params })
        .then(response => {
          setPermitCount(response.data.count);
          setCountLoading(false);
        })
        .catch(error => {
          console.error("Error fetching count:", error);
          setCountError("No se pudo obtener el conteo.");
          setCountLoading(false);
        });
    };
    fetchCount();
    const countInterval = setInterval(fetchCount, 5000); // Poll every 5 seconds
    return () => clearInterval(countInterval);
  }, []); // Empty dependency array means this runs once on mount and then intervals

  // Effect for fetching daily chart data
  useEffect(() => {
    const fetchChartData = () => {
      const params = {
        start_date: FIXED_START_DATE,
        end_date: getCurrentFormattedDate(),
      };
      console.log('Fetching chart data with params:', params);
      axios.get('/api/app/chart-data', { params })
        .then(response => {
          if (Array.isArray(response.data)) {
            setChartData(response.data);
          } else {
            console.error("Received non-array response for chart data:", response.data);
            setChartError("El formato de los datos del gráfico es incorrecto.");
          }
          setChartLoading(false);
        })
        .catch(error => {
          console.error("Error fetching chart data:", error);
          setChartError("No se pudieron cargar los datos del gráfico.");
          setChartLoading(false);
        });
    };
    fetchChartData();
    const chartInterval = setInterval(fetchChartData, 10000); // Poll every 10 seconds
    return () => clearInterval(chartInterval);
  }, []); // Empty dependency array means this runs once on mount and then intervals

  return (
    <div className="dashboard-grid">
      <div className="counter-container">
        <h2>Cantidad Total de Permisos</h2>
        {countLoading ? <p>Cargando...</p> : countError ? <p className="error">{countError}</p> :
          <div className="counter-value">
            {/* Removed Intl.NumberFormat for extreme compatibility */}
            {permitCount} {/* Display raw count */}
          </div>
        }
      </div>

      <div className="chart-container">
        <h2>Permisos por Día</h2>
        {chartLoading ? <p>Cargando gráfico...</p> : chartError ? <p className="error">{chartError}</p> :
          <div>
            <p>Datos del gráfico cargados: {chartData.length} elementos.</p>
            {/* Removed all Recharts components */}
          </div>
        }
      </div>
    </div>
  );
}

export default PermisosDashboard;
