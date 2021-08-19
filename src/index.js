import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@gnosis.pm/safe-react-components';
import reportWebVitals from './reportWebVitals';
import GlobalStyles from './global';
import { Web3ReactProvider } from "@web3-react/core"
import { Web3Provider } from "@ethersproject/providers";
import App from './App';

function getLibrary(provider) {
    const library = new Web3Provider(provider)
    library.pollingInterval = 12000

    return library
}


ReactDOM.render(
  <React.StrictMode>
      <GlobalStyles />
      <ThemeProvider theme={theme}>
          <Web3ReactProvider getLibrary={getLibrary}>
            <App />
          </Web3ReactProvider>
      </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
