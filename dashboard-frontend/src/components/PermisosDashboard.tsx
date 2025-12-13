import { useEffect, useState } from 'react';
import apiClient from '../api/axios';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

// Interface for the daily chart data
interface DailyData {
  date: string;
  count: number;
}

const FIXED_START_DATE = '15/10/2025'; // October 15, 2025

function PermisosDashboard() {
  // Function to get the current date formatted for API calls (DD/MM/YYYY)
  const getCurrentFormattedDate = () => {
    return format(new Date(), 'dd/MM/yyyy');
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
      apiClient.get('/api/permit-count', { params })
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
      apiClient.get('/api/chart-data', { params })
        .then(response => {
          setChartData(response.data);
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
            {new Intl.NumberFormat('es-ES').format(permitCount)}
          </div>
        }
      </div>

      <div className="chart-container">
        <h2>Permisos por Día</h2>
        {chartLoading ? <p>Cargando gráfico...</p> : chartError ? <p className="error">{chartError}</p> :
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={false} axisLine={false} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#2C3E50" fillOpacity={0.95} name="Permisos" />
              <Line type="monotone" dataKey="count" stroke="#d9006c" strokeOpacity={0.8} name="Línea" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        }
      </div>
    </div>
  );
}

export default PermisosDashboard;
