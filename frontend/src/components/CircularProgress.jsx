import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Trash2, TrendingUp, Award, Calendar, Plus, Save, LogOut, Menu, X } from 'lucide-react';


const CircularProgress = ({ percentage, size = 160, primaryColor = '#194d2a' }) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (pct) => {
    if (pct >= 90) return primaryColor;
    if (pct >= 75) return '#52a85f';
    if (pct >= 50) return '#f39c12';
    return '#e74c3c';
  };

  const color = getColor(percentage);

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '16px auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e8f0e3"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ 
            transition: 'stroke-dashoffset 0.5s ease',
            filter: 'drop-shadow(0 2px 4px rgba(25, 77, 42, 0.2))'
          }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '42px', 
          fontWeight: '700', 
          color,
          lineHeight: 1,
          marginBottom: '8px'
        }}>
          {percentage.toFixed(1)}%
        </div>
        <div style={{ 
          fontSize: '13px', 
          color: '#5a6c57', 
          fontWeight: '600',
          letterSpacing: '0.5px'
        }}>
          DIVERSION RATE
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;