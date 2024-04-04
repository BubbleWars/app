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
import { PrivyProvider } from "@privy-io/react-auth";

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

ReactDOM.createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <ApolloProvider client={client}>
            <WagmiConfig config={config}>
                <React.StrictMode>
                    <PrivyProvider
                        appId="cltnxig1e024xevlx99u3d12d"
                        config={{
                            // Display email and wallet as login methods
                            loginMethods: [
                                "email",
                                "wallet",
                                "twitter",
                                "discord",
                                "farcaster",
                            ],
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
                        <App />
                    </PrivyProvider>
                </React.StrictMode>
            </WagmiConfig>
        </ApolloProvider>
    </Provider>,
);
