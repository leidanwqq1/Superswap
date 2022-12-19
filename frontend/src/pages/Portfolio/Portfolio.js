import React, { useEffect, useState } from 'react';
import {getBalance, getAllLiquidityBalance, getWalletItemValue} from "../../components/Ethereum.js";
import LiquidityDrawPieChart from "./LiquidityDrawPieChart.js";
import WalletBalanceBarChart from "./WalletBalanceBarChart.js";
import "../../css/Portfolio.css"

export default function Portfolio({tokens, isConnected, signerAddr, signer, getSigner, provider}) {
  const [walletBalance, setWalletBalance] = useState([]);
  const [liquidityBalance, setLiquidityBalance] = useState([]);

  const updateWalletBalance = async () => {
    let balance = [];
    for(let item of tokens){
      const token = {name:item.name, address:item.address};
      const amount = await getBalance(token, signerAddr, signer);
      if(amount > 0){
        const tokenIn = {name:item.name, address:item.address};
        const value = await getWalletItemValue(provider, tokenIn, amount);
        balance = [...balance, {name: token.name, amount:amount, value:value}];
      }
    }
    setWalletBalance(balance);
  }

  const updateLiquidityBalance = async () => {
    const balance = await getAllLiquidityBalance(provider, signerAddr);
    setLiquidityBalance(balance);
  }

  useEffect(() => {
    const init = async () => {
       await updateWalletBalance();
       await updateLiquidityBalance();
    }
    init();
  }, [tokens, isConnected]);

  const formatNum = (num) => {
    const str = parseFloat(num).toFixed(3).toString();
    const reg = str.indexOf(".") > -1 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(?:\d{3})+$)/g;
    return str.replace(reg,"$1,");
  }

  const renderWalletBalance = () => {
    return(
      <div className="card PortfolioBox">
        <div className="card-body">
          <h6 className="card-title PortfolioBox-header">
            <span style={{color:"black"}}>Wallet Balances</span>
          </h6>
          
          <div style={{padding:"0 50px"}}>
          <WalletBalanceBarChart walletBalance={walletBalance} />
          </div>

          <table className="table">
            <thead>
              <tr>
                <th scope="col" style={{fontWeight:"500"}}>Asset</th>
                <th scope="col" style={{fontWeight:"500"}}>Amount</th>
                <th scope="col" style={{fontWeight:"500"}}>value($)</th>
              </tr>
            </thead>
            <tbody>
            {walletBalance.map((token, index) => {
                return(
                  <tr key={index}>
                    <td>
                      <span>
                        <img alt={`${token.name} logo`} src={[require(`../../images/token/${token.name}.png`)]}  style={{margin: "0 0px", width: "20px"}} />
                        <span style={{fontSize: "16px", marginLeft:"4px"}}>{token.name}</span>
                      </span>
                    </td>
                    <td>{formatNum(token.amount)}</td>
                    <td>{formatNum(token.value)}</td>
                  </tr>
                );
            })}
              
              
            </tbody>
          </table>

        </div>
      </div>
    );
  }

  const renderLiquidityBalance = () => {
    return(
      <div className="card PortfolioBox">
        <div className="card-body">
          <h6 className="card-title PortfolioBox-header">
            <span style={{color:"black"}}>My Liquidity</span>
          </h6>

          <LiquidityDrawPieChart liquidityBalance={liquidityBalance}/>


          <table className="table">
            <thead>
              <tr>
                <th scope="col" style={{fontWeight:"500"}}>liquidity</th>
                <th scope="col" style={{fontWeight:"500"}}>Tokens</th>
                <th scope="col" style={{fontWeight:"500"}}>Amount</th>
              </tr>
            </thead>
            <tbody>
            {liquidityBalance && liquidityBalance.map((token, index) => {
                return(
                  <tr key={index}>
                    <td>
                      <span>
                          <img alt={`${token.token1} logo`} src={[require(`../../images/token/${token.token1}.png`)]}  style={{margin: "0 0px", width: "20px"}} />
                          <img alt={`${token.token0} logo`} src={[require(`../../images/token/${token.token0}.png`)]}  style={{margin: "0 0px", width: "20px"}} />
                      </span>
                    </td>
                    <td>
                      <span>
                          <span style={{fontSize: "16px", marginLeft:"4px"}}>{token.token1}</span>-
                          <span style={{fontSize: "16px", marginLeft:"4px"}}>{token.token0}</span>
                      </span>
                    </td>
                    <td>{formatNum(token.balance)}</td>
                  </tr>
                );
            })}
              
              
            </tbody>
          </table>

        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-6"> 
          
          {renderWalletBalance()}
        </div>
        <div className="col-md-6"> 
          {renderLiquidityBalance()}
        </div>
      </div>
    </div>  
  )
}
