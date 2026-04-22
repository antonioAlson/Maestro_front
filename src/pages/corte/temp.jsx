import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../config/apiService";

import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ================= CONFIG =================
const TOTAL_COLOR = "#111827";

const LAYER_COLORS = [
  "#034D7E",
  "#1D4ED8",
  "#0891B2",
  "#38BDF8",
  "#1A3A6B",
  "#0EA5E9",
  "#06B6D4",
  "#3B82F6",
  "#7DD3FC",
];

// ================= HELPERS =================
const getMonthKey = (dateStr) => {
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${year}`; // 🔥 formato BR
};

const formatMonth = (value) => value;

// ================= LABEL CUSTOM =================
const CustomDot = ({ cx, cy, value, stroke }) => {
  if (!value) return null;

  return (
    <g>
      <circle cx={cx} cy={cy} r={3} fill={stroke} />
      <text
        x={cx}
        y={cy - 10}
        fontSize={10}
        textAnchor="middle"
        fill={stroke}
      >
        {value}
      </text>
    </g>
  );
};

// ================= COMPONENT =================
export function DashboardPage() {

  const [workorders, setWorkorders] = useState([]);
  const [loading, setLoading] = useState(true);

  const chartRef = useRef();

  // ================= FETCH =================
  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const res = await api.get("/workorder");
        setWorkorders(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, []);

  // ================= DATA PROCESS =================
  const { data, layers } = useMemo(() => {
    const map = {};
    const allLayers = new Set();

    workorders.forEach(wo => {
      const date = wo.enfestoDate || wo.creationDate;
      if (!date) return;

      const monthKey = getMonthKey(date);

      if (!map[monthKey]) {
        map[monthKey] = {
          month: monthKey,
          total: 0
        };
      }

      (wo.plates || []).forEach(plate => {
        const layer = plate.layers ?? 0;
        const key = `layer_${layer}`;

        allLayers.add(key);

        map[monthKey][key] = (map[monthKey][key] || 0) + 1;
        map[monthKey].total += 1;
      });
    });

    // garantir estrutura completa
    Object.values(map).forEach(row => {
      allLayers.forEach(layer => {
        if (!row[layer]) row[layer] = 0;
      });
    });

    return {
      data: Object.values(map).sort((a, b) => {
        const [ma, ya] = a.month.split("/");
        const [mb, yb] = b.month.split("/");

        return new Date(`${ya}-${ma}`) - new Date(`${yb}-${mb}`);
      }),
      layers: Array.from(allLayers).sort((a, b) => {
        const la = Number(a.replace("layer_", ""));
        const lb = Number(b.replace("layer_", ""));
        return la - lb;
      })
    };

  }, [workorders]);

  // ================= EXPORT PDF =================
  const exportPDF = async () => {
    const element = chartRef.current;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("landscape");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 10, width, height);
    pdf.save("producao-mensal.pdf");
  };

  // ================= LOADING =================
  if (loading) {
    return <div className="p-10">Carregando...</div>;
  }

  // ================= UI =================
  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-4">

      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Produção Mensal por Camada</h1>

        <button
          onClick={exportPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow"
        >
          Exportar PDF
        </button>
      </div>

      <div
        ref={chartRef}
        className="bg-white p-4 rounded-xl shadow"
      >
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
            />

            <YAxis />

            <Tooltip labelFormatter={formatMonth} />

            <Legend />

            {/* TOTAL */}
            <Line
              type="monotone"
              dataKey="total"
              stroke={TOTAL_COLOR}
              strokeWidth={4}
              dot={<CustomDot />}
              name="Total"
            />

            {/* CAMADAS */}
            {layers.map((layer, i) => (
              <Line
                key={layer}
                type="monotone"
                dataKey={layer}
                stroke={LAYER_COLORS[i % LAYER_COLORS.length]}
                strokeWidth={2}
                dot={<CustomDot />}
                name={layer.replace("layer_", "Camada ")}
              />
            ))}

          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}