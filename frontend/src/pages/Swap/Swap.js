import { useState, useEffect } from "react";
import SwapGearFillModal from "../../components/SwapGearFillModal.js";
import ChevronDownModal from "../../components/ChevronDownModal.js";
import {getBalance, getAmountsIn, getAmountsOut, swapTokenWithContract, getItemPrice} from "../../components/Ethereum.js";
import '../../css/Swap.css';

export default function Swap({tokens, isConnected, signerAddr, signer, getSigner, provider}) {
  const [slippageAmount, setSlippageAmount] = useState(0.10);
  const [deadlineMinutes, setDeadlineMinutes] = useState(30);

  const [activeItemIn, setActiveItemIn] = useState({name:"ETH", address:undefined, balance: 0});
  const [activeItemOut, setActiveItemOut] = useState({name:undefined, address:undefined, balance:0});

  const [itemPrice, setItemPrice] = useState(undefined);

  const updateBalance = async () => {
    if(isConnected()) {
      if(activeItemIn.name !== undefined){
        const token = {name: activeItemIn.name, address:activeItemIn.address};
        const balance = await getBalance(token, signerAddr, signer);
        setActiveItemIn({...activeItemIn, balance: balance});
      }
      if(activeItemOut.name !== undefined){
        const token = {name: activeItemOut.name, address:activeItemOut.address};
        const balance = await getBalance(token, signerAddr, signer);
        setActiveItemOut({...activeItemOut, balance: balance});
      }
    }
  }

  const selectToken = (token, direction) => {
    if(direction === "In"){
      if(token.name === activeItemOut.name){
        setActiveItemIn(activeItemOut);
        setActiveItemOut(activeItemIn);
      }else{
        setActiveItemIn({name: token.name, address: token.address, balance: 0});
      }
    }else{
      if(token.name === activeItemIn.name){
        setActiveItemIn(activeItemOut);
        setActiveItemOut(activeItemIn);
      }else{
        setActiveItemOut({name: token.name, address: token.address, balance: 0});
      }
    }
  }

  useEffect(() => {
    const init = async () => {
      await updateBalance();
    }
    init();
  }, [isConnected, activeItemIn.name, activeItemOut.name]);


  const [amountIn, setAmountIn] = useState(0);
  const [amountOut, setAmountOut] = useState(0);
  const [getAmountsMode, setGetAmountsMode] = useState("AmountIn");
  
  const updateAmount = (value, mode) => {
    if(mode === "AmountIn"){
      setGetAmountsMode("AmountIn");
      setAmountIn(value);
    }else if(mode === "AmountOut"){
      setGetAmountsMode("AmountOut");
      setAmountOut(value);
    }
  }

  useEffect(() => {
    const updateAmountValue = async () => {
      // update amount.
      if(getAmountsMode === "AmountIn"){
        const amount = await getAmountsOut(provider, activeItemIn, activeItemOut, amountIn);
        setAmountOut(amount);
      }else if(getAmountsMode === "AmountOut"){
        const amount = await getAmountsIn(provider, activeItemIn, activeItemOut, amountOut);
        setAmountIn(amount);
      }

      // update price
      const price = await getItemPrice(provider, activeItemIn, activeItemOut, true);
      setItemPrice(price);
    }
    updateAmountValue(); 
  }, [activeItemIn.name, activeItemOut.name, amountIn, amountOut]);

  const swapToken = async (e) => {
    e.preventDefault();
    await swapTokenWithContract(signer, signerAddr, getAmountsMode, activeItemIn, activeItemOut, amountIn, amountOut, slippageAmount, deadlineMinutes);
    await updateBalance();
    setAmountIn(0);
    setAmountOut(0);

  }

  const onSwitchItem = (e) => {
    e.preventDefault();
    setActiveItemIn(activeItemOut);
    setActiveItemOut(activeItemIn);
  }

  const renderDrawLineChart = () => {

    return (
      <div>
        
      </div>
    );
  }

  const renderSwap = () => {
    return(
      <div className='card SwapBox'>
        <div className="card-body">
          
          <h6 className="card-title SwapBox-header">
            <span style={{color:"black"}}>Swap</span>
            <SwapGearFillModal 
              slippageAmount={slippageAmount}
              setSlippageAmount={setSlippageAmount} 
              deadlineMinutes={deadlineMinutes} 
              setDeadlineMinutes={setDeadlineMinutes} />
          </h6>

          <div className="SwapBox-field">
            <div className="row">
              <div className="col-md-6">
                <input 
                    type="text" 
                    className="form-control" 
                    inputMode="decimal" 
                    placeholder="0.0"
                    value={amountIn}
                    aria-describedby="inputAmount" 
                    onChange={e => updateAmount(e.target.value, "AmountIn")}
                />
              </div>
              <div className="col-md-6" id="inputAmount">
                <button type="button" className="float-end SwapBox-dialogButton" data-bs-toggle="modal" data-bs-target="#inputChevronDownModal" data-bs-whatever="@getbootstrap">
                  {activeItemIn.name === undefined ? (
                    <span className="SwapBox-SelectToken">Select token</span>
                  ) : (
                    <span>
                      <img alt={`${activeItemIn.name} logo`} src={[require(`../../images/token/${activeItemIn.name}.png`)]}  style={{margin: "0 8px", width: "20px"}} />
                      <span style={{fontSize: "16px", fontWeight: "bold", marginRight:"4px"}}>{activeItemIn.name}</span>
                    </span>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 20 16">
                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </button>
                <div className="modal fade " id="inputChevronDownModal" tabIndex="-1" aria-labelledby="ChevronDownModalLabel" aria-hidden="true">
                  <ChevronDownModal 
                      tokens={tokens} 
                      selectToken={selectToken} 
                      activeItem={activeItemIn} 
                      direction="In" />
                </div>
              </div>
            </div>
            <div className="SwapBox-balance">Balance: {activeItemIn.balance}</div>
          </div>

          <div className="SwapBox-ArrowFiled">
            <button type="button" className="SwapBox-Arrow" onClick={e => onSwitchItem(e)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-down" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
              </svg>
            </button>
          </div>

          <div className="SwapBox-field">
            <div className="row">
              <div className="col-md-6">
                <input 
                    type="text" 
                    className="form-control" 
                    inputMode="decimal" 
                    placeholder="0.0" 
                    value={amountOut}
                    aria-describedby="outputAmount" 
                    onChange={e => updateAmount(e.target.value, "AmountOut")}
                />
              </div>
              <div className="col-md-6" id="outputAmount">
                <button type="button" className="float-end SwapBox-dialogButton" data-bs-toggle="modal" data-bs-target="#outputChevronDownModal" data-bs-whatever="@getbootstrap">
                  {activeItemOut.name === undefined ? (
                    <span className="SwapBox-SelectToken">Select token</span>
                  ) : (
                    <span>
                      <img alt={`${activeItemOut.name} logo`} src={[require(`../../images/token/${activeItemOut.name}.png`)]}  style={{margin: "0 8px", width: "20px"}} />
                      <span style={{fontSize: "16px", fontWeight: "bold", marginRight:"4px"}}>{activeItemOut.name}</span>
                    </span>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 20 16">
                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </button>
                <div className="modal fade" id="outputChevronDownModal" tabIndex="-1" aria-labelledby="ChevronDownModalLabel" aria-hidden="true">
                  <ChevronDownModal
                      tokens={tokens} 
                      selectToken={selectToken} 
                      activeItem={activeItemOut} 
                      direction="Out" />
                </div>
              </div>
            </div>
            <div className="SwapBox-balance">Balance: {activeItemOut.balance}</div>
          </div>

          {(activeItemIn.name !== undefined && activeItemOut.name !== undefined) ? (
            <div className="SwapBox-Price">
                <span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                  </svg>
                  <span style={{marginLeft:"8px"}}>1 {activeItemIn.name} = {itemPrice} {activeItemOut.name}</span>
                </span>
            </div>) : null}

          <div className="d-grid gap-2">
            {!isConnected() ? (
              <button 
                  className="btn btn-secondary" 
                  type="button"
                  onClick={() => getSigner(provider)}>Connect Wallet</button>
            ) : (
              (activeItemIn.name === undefined || activeItemOut.name === undefined) ? (
                  <button className="btn btn-secondary" type="button" disabled>Select token</button>
              ) : (
                (parseFloat(activeItemIn.balance) < parseFloat(amountIn)) ? (
                  <button className="btn btn-secondary" type="button" disabled>Insufficient Amount</button>
                ) :(
                  <button className="btn btn-primary" type="button" onClick={async (e) => { await swapToken(e)}}>Swap</button>
            )))}
          </div>

        </div>
      </div>
    );
  }
  return (
    <div className="container">
      <div className="row ">
        <div style={{width: "440px", margin: "auto"}}>
          {renderSwap()}
        </div>
      </div>
    </div>  
  )
}
