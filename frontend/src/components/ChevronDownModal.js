import React from 'react'
import "../css/ChevronDownModal.css"

export default function ChevronDownModal({tokens, selectToken, activeItem, direction}) {
    const onselectToken = (e, token) => {
        e.preventDefault();
        selectToken(token, direction);
    }
  return (
    <div className="modal-dialog" style={{width:"400px", margin:"80px auto 0"}}>
        <div className="modal-content">
            <div className="modal-header ChevronDownModal-header">
                <h6 className="modal-title" id="ChevronDownModalLabel">Select a token</h6>
                <button type="button"  className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div className="modal-body">
                <div className="input-group" style={{marginBottom:"4px"}}>
                    <span className="input-group-text" id="basic-addon1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="24" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                        </svg>
                    </span>
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="paster address" 
                        aria-describedby="basic-addon1"
                    />
                </div>

                <div>
                    {["ETH", "DAI", "USDC", "USDT", "WBTC", "WETH"].map((item, index) => {
                        return(
                            <button tabIndex="0" key={index} type="button" className='ChevronDownModal-tokenLable'>
                                <img alt={`${item} logo`} src={[require(`../images/token/${item}.png`)]}  style={{marginRight: "8px", width: "20px"}} />
                                <span className="ChevronDownModal-CommonToken">{item}</span>
                            </button>
                        );
                    })}
                </div>

                <hr className='ChevronDownModal-line'/>

                <div data-bs-spy="scroll" className="scrollspy-example" tabIndex="0" style={{minHeight:"240px", marginTop:"-14px"}}>
                    <div className="d-grid gap-1">
                        {tokens.map((token, index) => {
                            return(
                                <button 
                                    key={index} 
                                    className={`btn ${token.name === activeItem.name ? 'disabled' : null}`} 
                                    type="button"
                                    data-bs-dismiss="modal"
                                    style={{textAlign:"left", height:"48px", border:"none"}}
                                    onClick={e => onselectToken(e, token)}>
                                    <img alt={`${token.name} logo`} src={[require(`../images/token/${token.name}.png`)]}  style={{width: "24px"}} />
                                    <span style={{margin: "0 8px", fontSize: "16px"}}>{token.name}</span>
                                </button> 
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
}
