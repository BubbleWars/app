import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import '../../core/world.ts';
import { WagmiConfig, createConfig, configureChains, mainnet } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { URL_QUERY_GRAPHQL } from './consts/index.ts';
import { currentChain } from './contracts.ts';

//Configure Apollo
const client = new ApolloClient({
  uri: URL_QUERY_GRAPHQL,
  cache: new InMemoryCache(),
});

//Configure Wagmi
export const { publicClient, webSocketPublicClient } = configureChains(
  [currentChain],
  [publicProvider()],
)
const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ApolloProvider client={client}>
    <WagmiConfig config={config}>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </WagmiConfig>
  </ApolloProvider>,
)
