import React from "react";
import { PieChart, Pie, Cell, LabelList, ResponsiveContainer } from "recharts";

const COLORS = ['#FFBB28', '#FF8042', '#8800FE', '#0088FE', '#00C49F',  '#9F040C', '#FB2FB8', '#318042', '#F06000'];
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
}) => {
  const radius = outerRadius * 1.05;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="gray"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{fontSize:"12px"}}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export default function LiquidityDrawPieChart({liquidityBalance}) {
  let liquidity = [];
  liquidityBalance.map((item) => {
    const name = item.token0 + "-" + item.token1;
    liquidity = [...liquidity, {
      name: name,
      value: parseFloat(item.balance)
    }];
  });
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart style={{margin:"10px auto"}}>
        <Pie
          data={liquidity}
          outerRadius={80}
          dataKey="value"
          labelLine={false}
          label={renderCustomizedLabel}
          style={{fontSize:"10px", fontWeight:"200"}}
        >
          <LabelList dataKey="name" fill="black" style={{ fontSize:"10", fontWeight:"100",fill:"black"}}/>
          {liquidity && liquidity.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
