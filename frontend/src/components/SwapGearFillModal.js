import React from 'react';

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

        <button type="button" className="bg-light float-end" style={{border: "none"}} data-bs-toggle="modal" data-bs-target="#gearfillModal" data-bs-whatever="@getbootstrap">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-gear-fill" viewBox="0 0 16 16">
                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
            </svg>
        </button>
        <div className="modal fade" id="gearfillModal" tabIndex="-1" aria-labelledby="gearfillModalLabel" aria-hidden="true">
            <div className="modal-dialog" style={{width:"300px", margin:"200px auto"}}>
                <div className="modal-content" id="gearfillModalLabel">
                    {/* <div className="modal-header">
                        <h6 className="modal-title" style={{fontSize:"14px", color:"black"}} >Settings</h6>
                    </div> */}

                    <div className="modal-body"> 
                        <div className="row">
                            <span style={{fontSize:"14px", margin:"12px 0 0 0", color:"black", fontWeight:"bold"}}>Settings</span>
                        </div>
                        <div className="row">
                            <span style={{fontSize:"14px", margin:"12px 0", color:"gray", fontWeight:"400"}}>Slippage tolerance
                                <span style={{marginLeft:"8px"}}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                                    </svg>
                                </span>
                            </span>
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
                            <span style={{fontSize:"14px", margin:"12px 0", color:"gray", fontWeight:"400"}}>Transaction deadline
                                <span style={{marginLeft:"8px"}}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                                    </svg>
                                </span>
                            </span>
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

                        <div className="row">
                            <span style={{fontSize:"14px", margin:"18px 0 4px 0", color:"black", fontWeight:"bold"}}>Interface Settings</span>
                        </div>
                        <div class="form-check form-switch" style={{fontSize:"14px", margin:"12px 0", color:"gray", fontWeight:"400", padding:"0"}}>
                            <label class="form-check-label" for="autoRouterAPISwitch">Auto Router API</label>
                            <input class="form-check-input float-end" type="checkbox" role="switch" id="autoRouterAPISwitch" checked/>
                        </div>
                        <div class="form-check form-switch" style={{fontSize:"14px", margin:"12px 0", color:"gray", fontWeight:"400", padding:"0"}}>
                            <label class="form-check-label" for="exportModeSwitch">Export Mode</label>
                            <input class="form-check-input float-end" type="checkbox" role="switch" id="exportModeSwitch"/>
                        </div>

                    </div>
                </div>
            </div>
        </div>

    </span>
  )
}
