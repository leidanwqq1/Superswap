import React from "react";
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend} from "recharts";

export default function WalletBalanceBarChart({walletBalance}) {
    let tokens = [];
    walletBalance.map((item) => {
        tokens = [...tokens, {
            name: item.name, 
            amount:parseFloat(item.amount), 
            value: parseFloat(item.value)
        }];
    });
    console.log("walletBalance")
    console.log(tokens)
  return (
    <BarChart
      width={400}
      height={220}
      data={tokens}
      style={{margin:"10px auto", fontSize:"10px", fontWeight:"200"}}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
      <Tooltip />
      <Legend />
      <Bar yAxisId="left" dataKey="amount" fill="#8884d8" />
      <Bar yAxisId="right" dataKey="value" fill="#82ca9d" />
    </BarChart>
  );
}
