import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "../../core/world.ts";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { RPC_URL, URL_QUERY_GRAPHQL } from "./consts/index.ts";
import { currentChain } from "./contracts.ts";
import { Provider } from "react-redux";
import store from "./store/index.ts";
import { cEvent } from "./types/events.ts";
import { PrivyProvider } from "@privy-io/react-auth";
import { GraphQLProvider } from "./hooks/urql.tsx";

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
                    <PrivyProvider
                        appId="clurbdmha00319vwnhsejx6pj"
                        config={{
                            // Display email and wallet as login methods
                            loginMethods: [
                                "twitter",
                            ],
                            supportedChains: [currentChain],
                            defaultChain: currentChain,
                            // Customize Privy's appearance in your app
                            appearance: {
                                theme: "light",
                                accentColor: "#676FFF",
                                logo: "https://your-logo-url",
                            },
                            // Create embedded wallets for users who don't have a wallet
                            embeddedWallets: {
                                createOnLogin: "users-without-wallets",
                            },
                        }}
                    >
                        <GraphQLProvider>
                            <App />
                        </GraphQLProvider>
                    </PrivyProvider>
                </React.StrictMode>
            </WagmiConfig>
        </ApolloProvider>
    </Provider>,
);
