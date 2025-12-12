import { useEffect, useState } from 'react';
import axios from 'axios';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Interface for the daily revenue chart data
interface DailyRevenueData {
  date: string;
  recaudacion: number;
}

function RecaudacionDashboard() {
  // State for the total counter
  const [total, setTotal] = useState<number>(0);
  const [totalLoading, setTotalLoading] = useState(true);
  const [totalError, setTotalError] = useState<string | null>(null);

  // State for the daily chart
  const [chartData, setChartData] = useState<DailyRevenueData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  // State for visibility of total recaudacion
  const [showTotal, setShowTotal] = useState<boolean>(false);

  // Effect for fetching the total
  useEffect(() => {
    const fetchTotal = () => {
      axios.get('/api/app/total-recaudacion')
        .then(response => {
          setTotal(response.data.total);
          setTotalLoading(false);
        })
        .catch(error => {
          console.error("Error fetching total recaudacion:", error);
          setTotalError("No se pudo obtener la recaudación total.");
          setTotalLoading(false);
        });
    };
    fetchTotal();
    const intervalId = setInterval(fetchTotal, 10000); // Poll every 10 seconds
    return () => clearInterval(intervalId);
  }, []);

  // Effect for fetching the daily chart data
  useEffect(() => {
    const fetchChartData = () => {
      axios.get('/api/app/recaudacion-por-dia')
        .then(response => {
          if (Array.isArray(response.data)) {
            setChartData(response.data);
          } else {
            // If the backend returns an error object instead of an array
            console.error("Received non-array response for chart data:", response.data);
            setChartError("El formato de los datos recibidos es incorrecto.");
          }
          setChartLoading(false);
        })
        .catch(error => {
          console.error("Error fetching daily recaudacion:", error);
          setChartError("No se pudieron cargar los datos del gráfico.");
          setChartLoading(false);
        });
    };
    fetchChartData();
    const intervalId = setInterval(fetchChartData, 10000); // Poll every 10 seconds
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="dashboard-grid">
      <div className="counter-container">
        <h2>Total Recaudación</h2>
        {totalLoading ? <p>Cargando...</p> : totalError ? <p className="error">{totalError}</p> :
          <div className="counter-value-wrapper">
            <button
              onClick={() => setShowTotal(!showTotal)}
              className="toggle-visibility-button"
            >
              {showTotal ? 'Ocultar' : 'Mostrar'}
            </button>
            {showTotal && (
              <div className="counter-value">
                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total)}
              </div>
            )}
          </div>
        }
      </div>

      <div className="chart-container">
        <h2>Recaudación por Día</h2>
        {chartLoading ? <p>Cargando gráfico...</p> : chartError ? <p className="error">{chartError}</p> :
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={false} axisLine={false} />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('es-AR', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
              <Tooltip formatter={(value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)} />
              <Legend />
              <Bar dataKey="recaudacion" fill="#2C3E50" fillOpacity={0.95} name="Recaudación Diaria" />
              <Line type="monotone" dataKey="recaudacion" stroke="#d9006c" strokeOpacity={0.8} name="Línea" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        }
      </div>
    </div>
  );
}

export default RecaudacionDashboard;
