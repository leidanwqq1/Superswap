import React from 'react';
import "../css/HeaderConnectWallet.css";

export default function HeaderConnectWallet({isConnected, signerAddr, getSigner, provider}) {
    const displayAddr = `${signerAddr?.substring(0, 10)}...`;
    return (
        <span style={{textAlign:"right"}}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots" viewBox="0 0 16 16">
            <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
          </svg>

          <img alt={`ETH logo`} src={[require(`../images/token/ETH.png`)]}  style={{margin: "0 4px 0 20px", width: "20px"}} />
          <span style={{margin: "0 20px 0 0", fontSize: "16px"}}>Ethereum</span>

          {isConnected() ? (
            <span className="HeaderConnectWallet-signer">{displayAddr}</span>
          ) : (
            <button type="button" 
              className="HeaderConnectWallet-signer" 
              onClick={() => getSigner(provider)}>
                Connect Wallet
            </button>
          )}
          
        </span>
    );
}
