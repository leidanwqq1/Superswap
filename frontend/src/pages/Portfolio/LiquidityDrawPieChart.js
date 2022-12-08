import React from "react";
import { PieChart, Pie, Cell, LabelList } from "recharts";

const COLORS = ['#FFBB28', '#FF8042', '#8800FE', '#0088FE', '#00C49F',  '#9F040C', '#FB2FB8', '#318042', '#F06000'];

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
    <PieChart width={400} height={220} style={{margin:"10px auto"}}>
      <Pie
        data={liquidity}
        outerRadius={80}
        dataKey="value"
        labelLine={true}
        label
        style={{fontSize:"10px", fontWeight:"200"}}
      >
        <LabelList dataKey="name" fill="black" style={{ fontSize:"10", fontWeight:"100",fill:"black"}}/>
        {liquidity && liquidity.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  );
}
