import { useState, useEffect } from "react";
import SwapGearFillModal from "../../components/SwapGearFillModal.js";
import ChevronDownModal from "../../components/ChevronDownModal.js";
import {getBalance, getItemPrice, getLiquidityBalance, addLiquidityWithContract, RemoveLiquidityWithContract} from "../../components/Ethereum.js";

import '../../css/Pool.css';


export default function Pool({tokens, isConnected, signerAddr, signer, getSigner, provider}) {
  const [slippageAmount, setSlippageAmount] = useState(0.10);
  const [deadlineMinutes, setDeadlineMinutes] = useState(30);
  const [poolDirection, setPoolDirection] = useState("AddLiquidity");

  const [activeItemIn0, setActiveItemIn0] = useState({name:"ETH", address:undefined, balance: 0});
  const [activeItemIn1, setActiveItemIn1] = useState({name:undefined, address:undefined, balance:0});

  const [getAmountsMode, setGetAmountsMode] = useState("AmountIn");

  // add liquidity.
  const [amountIn0, setAmountIn0] = useState(0);
  const [amountIn1, setAmountIn1] = useState(0);


  // remove liquidity.
  const [liquidityAmount, setLiquidityAmount] = useState(0);
  const [liquidityBalance, setLiquidityBalance] = useState(0);


  const updateTokenBalance = async () => {
    if(isConnected()) {
      if(activeItemIn0.name !== undefined){
        const token = {name: activeItemIn0.name, address:activeItemIn0.address};
        const balance = await getBalance(token, signerAddr, signer);
        setActiveItemIn0({...activeItemIn0, balance: balance});
      }
      if(activeItemIn1.name !== undefined){
        const token = {name: activeItemIn1.name, address:activeItemIn1.address};
        const balance = await getBalance(token, signerAddr, signer);
        setActiveItemIn1({...activeItemIn1, balance: balance});
      }
    }
  }

  const updateLiquidityBalance = async () => {
    if(isConnected()) {
      const balance = await getLiquidityBalance(activeItemIn0, activeItemIn1, provider, signerAddr);
      setLiquidityBalance(balance);
    }
  }

  const selectToken = (token, direction) => {
    if(direction === "In"){
      if(token.name === activeItemIn1.name){
        setActiveItemIn0(activeItemIn1);
        setActiveItemIn1(activeItemIn0);
      }else{
        setActiveItemIn0({name: token.name, address: token.address, balance: 0});
      }
    }else{
      if(token.name === activeItemIn0.name){
        setActiveItemIn0(activeItemIn1);
        setActiveItemIn1(activeItemIn0);
      }else{
        setActiveItemIn1({name: token.name, address: token.address, balance: 0});
      }
    }
  }

  useEffect(() => {
    const init = async () => {
      await updateTokenBalance();
      await updateLiquidityBalance();
    }
    init();
  }, [isConnected, activeItemIn0.name, activeItemIn1.name]);


  const updateAmount = (value, mode) => {
    if(mode === "AmountIn"){
      setGetAmountsMode("AmountIn");
      setAmountIn0(value);
    }else if(mode === "AmountOut"){
      setGetAmountsMode("AmountOut");
      setAmountIn1(value);
    }
  }

  useEffect(() => {
    const updateAmountValue = async () => {
      const price = await getItemPrice(provider, activeItemIn0, activeItemIn1, 0);
      if(price > 0){
        // update amount.
        if(getAmountsMode === "AmountIn"){
          const amount = parseFloat(price * amountIn0).toFixed(6);
          setAmountIn1(amount);
        }else if(getAmountsMode === "AmountOut"){
          const amount = (parseFloat(1) / parseFloat(price)  * amountIn1).toFixed(6);
          setAmountIn0(amount);
        }
      }
    }
    updateAmountValue(); 
  }, [activeItemIn0.name, activeItemIn1.name, amountIn0, amountIn1]);

  const formatNum = (num) => {
    const str = num.toString();
    const reg = str.indexOf(".") > -1 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(?:\d{3})+$)/g;
    return str.replace(reg,"$1,");
  }

  const addLiquidity = async (e) => {
    e.preventDefault();
    await addLiquidityWithContract(signer, signerAddr, activeItemIn0, activeItemIn1, amountIn0, amountIn1, slippageAmount, deadlineMinutes);
    // await updateTokenBalance();
    setAmountIn0(0);
    setAmountIn1(0);
  }

  const renderAddLiquidity = () => {
    return(
      <div>
        <h6 className="PoolBox-font-pair-amounts">Deposit Amounts</h6>
        <div className="PoolBox-AmountFiled">
          <div className="row">
            <div className="col-md-8">
              <input 
                  type="text" 
                  className="form-control PoolBox-AmountFiled-input" 
                  inputMode="decimal" 
                  placeholder="0.0"
                  value={amountIn0}
                  aria-describedby="inputAmount" 
                  onChange={e => updateAmount(e.target.value, "AmountIn")}
              />
            </div>
            <div className="col-md-4" id="inputAmount">
              <span  className="float-end PoolBox-AmountFiled-button">
                {activeItemIn0.name === undefined ? (
                  <span className="PoolBox-SelectToken">Select</span>
                ) : (
                  <span>
                    <img alt={`${activeItemIn0.name} logo`} src={[require(`../../images/token/${activeItemIn0.name}.png`)]}  style={{margin: "0 8px", width: "20px"}} />
                    <span style={{fontSize: "16px", fontWeight: "bold", marginRight:"4px"}}>{activeItemIn0.name}</span>
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="row PoolBox-AmountFiled-balance">Balance: {formatNum(activeItemIn0.balance)}</div>
        </div>

        <div className="PoolBox-AmountFiled">
          <div className="row">
            <div className="col-md-8">
              <input 
                  type="text" 
                  className="form-control PoolBox-AmountFiled-input" 
                  inputMode="decimal" 
                  placeholder="0.0" 
                  value={amountIn1}
                  aria-describedby="outputAmount" 
                  onChange={e => updateAmount(e.target.value, "AmountOut")}
              />
            </div>
            <div className="col-md-4" id="outputAmount">
              <span type="button" className="float-end PoolBox-AmountFiled-button">
                {activeItemIn1.name === undefined ? (
                  <span className="PoolBox-SelectToken">Select</span>
                ) : (
                  <span>
                    <img alt={`${activeItemIn1.name} logo`} src={[require(`../../images/token/${activeItemIn1.name}.png`)]}  style={{margin: "0 8px", width: "20px"}} />
                    <span style={{fontSize: "16px", fontWeight: "bold", marginRight:"4px"}}>{activeItemIn1.name}</span>
                  </span>
                )}
              </span>
            </div>
            <div className="row PoolBox-AmountFiled-balance">Balance: {formatNum(activeItemIn1.balance)}</div>
          </div>
        </div>

        <div className="d-grid gap-2">
          {!isConnected() ? (
            <button 
                className="btn btn-secondary" 
                type="button"
                onClick={() => getSigner(provider)}>Connect Wallet</button>
          ) : (
            (activeItemIn0.name === undefined || activeItemIn1.name === undefined) ? (
                <button className="btn btn-secondary" type="button" disabled>Select a token</button>
            ) : (
              (parseFloat(activeItemIn0.balance) < parseFloat(amountIn0) && parseFloat(activeItemIn1.balance) < parseFloat(amountIn1)) ? (
                <button className="btn btn-secondary" type="button" disabled>Insufficient Amount</button>
              ) :(
                ((activeItemIn0.name === "ETH" && activeItemIn1.name === "WETH") || (activeItemIn0.name === "WETH" && activeItemIn1.name === "ETH")) ? (
                  <button className="btn btn-secondary" type="button" disabled>Invalid Pair</button>
                ) : (
                <button className="btn btn-primary" type="button" onClick={async (e) => { await addLiquidity(e)}}>Add Liquidity</button>
          ))))}
        </div>
      </div>
    );
    
  }

  const RemoveLiquidity = async (e) => {
    e.preventDefault();
    await RemoveLiquidityWithContract(signer, signerAddr, activeItemIn0, activeItemIn1, liquidityAmount, slippageAmount, deadlineMinutes);
    await updateTokenBalance();
    setLiquidityAmount(0);
  }

  const renderRemoveLiquidity = () => {
    return(
      <div>
        <h6 className="PoolBox-font-pair-amounts">Withdraw Amounts</h6>
        <div className="PoolBox-AmountFiled">
          <div className="row">
            <div className="col-md-8">
              <input 
                  type="text" 
                  className="form-control PoolBox-AmountFiled-input" 
                  inputMode="decimal" 
                  placeholder="0.0"
                  value={liquidityAmount}
                  aria-describedby="liquidityAmount" 
                  onChange={e => setLiquidityAmount(e.target.value)}
              />
            </div>
            <div className="col-md-4" id="liquidityAmount">
              <span  className="float-end PoolBox-AmountFiled-button">
                {(activeItemIn0.name === undefined || activeItemIn1.name === undefined) ? (
                  <span className="PoolBox-SelectToken">Select</span>
                ) : (
                  <span>
                    <img alt={`${activeItemIn0.name} logo`} src={[require(`../../images/token/${activeItemIn0.name}.png`)]}  style={{margin: "0 8px", width: "20px"}} />
                    <span style={{fontSize: "16px", fontWeight: "bold"}}>&</span>
                    <img alt={`${activeItemIn1.name} logo`} src={[require(`../../images/token/${activeItemIn1.name}.png`)]}  style={{margin: "0 8px", width: "20px"}} />
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="row PoolBox-AmountFiled-balance">Balance: {formatNum(liquidityBalance)}</div>
        </div>

        <div className="d-grid gap-2">
          {!isConnected() ? (
            <button 
                className="btn btn-secondary" 
                type="button"
                onClick={() => getSigner(provider)}>Connect Wallet</button>
          ) : (
            (activeItemIn0.name === undefined || activeItemIn1.name === undefined) ? (
                <button className="btn btn-secondary" type="button" disabled>Select a token</button>
            ) : (
              (parseFloat(liquidityBalance) < parseFloat(liquidityAmount)) ? (
                <button className="btn btn-secondary" type="button" disabled>Insufficient Amount</button>
              ) :(
                ((activeItemIn0.name === "ETH" && activeItemIn1.name === "WETH") || (activeItemIn0.name === "WETH" && activeItemIn1.name === "ETH")) ? (
                  <button className="btn btn-secondary" type="button" disabled>Invalid Pair</button>
                ) : (
                <button className="btn btn-primary" type="button" onClick={async (e) => { await RemoveLiquidity(e)}}>Remove Liquidity</button>
          ))))}
        </div>
      </div>
    );
    
  }
  const renderPool = () => {
    return (
      <div className="card PoolBox">

        <div className="card-header">
          <div className="row">
            <div className="col-md-10">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button 
                      className={`nav-link ${poolDirection === "AddLiquidity" ? "active text-dark fw-bold" : "text-secondary"}`}
                      onClick={() => setPoolDirection("AddLiquidity")}>Add Liquidity</button>
                </li>
                <li className="nav-item">
                  <button 
                      className={`nav-link ${poolDirection === "Withdraw" ? "active text-dark fw-bold" : "text-secondary"}`}
                      onClick={() => setPoolDirection("Withdraw")}>Withdraw</button>
                </li>
              </ul>
            </div>
            <div className="col-md-2">
              <SwapGearFillModal 
                slippageAmount={slippageAmount}
                setSlippageAmount={setSlippageAmount} 
                deadlineMinutes={deadlineMinutes} 
                setDeadlineMinutes={setDeadlineMinutes} 
              />
            </div>
          </div>
        </div>

        <div className="card-body">
          <h6 className="PoolBox-font-pair-amounts">Select Pair</h6>
          <div className="row" style={{marginBottom:"12px"}}>
              <div className="col-md-6 PoolBox-SelectPairField">
                <button type="button" className="PoolBox-dialogButton" data-bs-toggle="modal" data-bs-target="#inputChevronDownModal" data-bs-whatever="@getbootstrap">
                  {activeItemIn0.name === undefined ? (
                    <span className="PoolBox-SelectToken">Select token</span>
                  ) : (
                    <span>
                      <img alt={`${activeItemIn0.name} logo`} src={[require(`../../images/token/${activeItemIn0.name}.png`)]}  style={{margin: "0 8px", width: "20px"}} />
                      <span style={{fontSize: "16px", fontWeight: "bold", marginRight:"4px"}}>{activeItemIn0.name}</span>
                    </span>
                  )}
                  <span className="float-end">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 20 16">
                      <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </span>
                </button>
                <div className="modal fade " id="inputChevronDownModal" tabIndex="-1" aria-labelledby="ChevronDownModalLabel" aria-hidden="true">
                  <ChevronDownModal 
                      tokens={tokens}
                      selectToken={selectToken} 
                      activeItem={activeItemIn0} 
                      direction="In"
                      provider={provider} />
                </div>
              </div>

              <div className="col-md-6 PoolBox-SelectPairField">
                <button type="button" className="PoolBox-dialogButton" data-bs-toggle="modal" data-bs-target="#outputChevronDownModal" data-bs-whatever="@getbootstrap">
                  {activeItemIn1.name === undefined ? (
                    <span className="PoolBox-SelectToken">Select a token</span>
                  ) : (
                    <span>
                      <img alt={`${activeItemIn1.name} logo`} src={[require(`../../images/token/${activeItemIn1.name}.png`)]}  style={{margin: "0 8px", width: "20px"}} />
                      <span style={{fontSize: "16px", fontWeight: "bold", marginRight:"4px"}}>{activeItemIn1.name}</span>
                    </span>
                  )}
                  <span className="float-end">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 20 16">
                      <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </span>
                </button>
                <div className="modal fade" id="outputChevronDownModal" tabIndex="-1" aria-labelledby="ChevronDownModalLabel" aria-hidden="true">
                  <ChevronDownModal
                      tokens={tokens} 
                      selectToken={selectToken} 
                      activeItem={activeItemIn1} 
                      direction="Out"
                      provider={provider} />
                </div>
              </div>
          </div>

          <div>
            {(poolDirection === "AddLiquidity") ? renderAddLiquidity() : renderRemoveLiquidity() }
          </div>
          

        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row">
        <div style={{width: "440px", margin: "auto"}}>
          {renderPool()}
        </div>
      </div>
    </div>  
  )
}
