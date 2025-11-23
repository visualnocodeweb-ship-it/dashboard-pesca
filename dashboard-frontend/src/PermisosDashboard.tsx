import { useEffect, useState } from 'react';
import axios from 'axios';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Interface for the daily chart data
interface DailyData {
  date: string;
  count: number;
}

function PermisosDashboard() {
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
      axios.get('/api/permit-count')
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
  }, []);

  // Effect for fetching daily chart data
  useEffect(() => {
    const fetchChartData = () => {
      axios.get('/api/chart-data')
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
  }, []);

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
