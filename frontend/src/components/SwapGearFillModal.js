import React from 'react'

export default function SwapGearFillModal({slippageAmount, setSlippageAmount, deadlineMinutes, setDeadlineMinutes}) {
    const onchangeSlippageAmount = (value) => {
        if(value > 100){
            value = 100;
        } else if(value < 0){
            value = 0;
        }
        setSlippageAmount(value);
    }
  return (
    <span>

        <button type="button" className="float-end" style={{border: "none"}} data-bs-toggle="modal" data-bs-target="#gearfillModal" data-bs-whatever="@getbootstrap">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-gear-fill" viewBox="0 0 16 16">
                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
            </svg>
        </button>
        <div className="modal fade" id="gearfillModal" tabIndex="-1" aria-labelledby="gearfillModalLabel" aria-hidden="true">
            <div className="modal-dialog" style={{width:"240px", margin:"180px auto 0"}}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h6 className="modal-title" style={{fontSize:"14px", color:"black"}} id="gearfillModalLabel">Settings</h6>
                    </div>
                    <div className="modal-body"> 
                        <div className="row">
                            <label className="form-label" style={{fontSize:"14px"}}>Slippage tolerance</label>
                        </div>
                        <div className="input-group">
                            <input 
                            className="form-control" 
                            value={slippageAmount}
                            placeholder="0.10%"
                            aria-describedby="slippageAmount"
                            onChange={e => onchangeSlippageAmount(e.target.value)} />                         
                            <span className="input-group-text" id="slippageAmount" style={{fontSize:"14px"}}>%</span>
                        </div>

                        <div className="row">
                            <label className="form-label" style={{fontSize:"14px"}}>Transaction deadline</label>
                        </div>
                        <div className="input-group"> 
                            <input 
                            className="form-control" 
                            value={deadlineMinutes}
                            placeholder="30"
                            aria-describedby="deadlineMinutes"
                            onChange={e => setDeadlineMinutes(e.target.value)} />
                            <span className="input-group-text" id="deadlineMinutes" style={{fontSize:"14px"}}>minutes</span>  
                        </div>

                    </div>
                </div>
            </div>
        </div>

    </span>
  )
}
