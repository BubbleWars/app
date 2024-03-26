import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "../../core/world.ts";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { URL_QUERY_GRAPHQL } from "./consts/index.ts";
import { currentChain } from "./contracts.ts";
import { Provider } from "react-redux";
import store from "./store/index.ts";
import { cEvent } from "./types/events.ts";

//Configure Apollo
const client = new ApolloClient({
    uri: URL_QUERY_GRAPHQL,
    cache: new InMemoryCache(),
});

//Configure Wagmi
export const { publicClient, webSocketPublicClient } = configureChains(
    [currentChain],
    [publicProvider()],
);
const config = createConfig({
    autoConnect: true,
    publicClient,
    webSocketPublicClient,
});

//Configure Event System Class
export const Event = new cEvent();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <ApolloProvider client={client}>
            <WagmiConfig config={config}>
                <React.StrictMode>
                    <App />
                </React.StrictMode>
            </WagmiConfig>
        </ApolloProvider>
    </Provider>,
);
