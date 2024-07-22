// Copyright 2022 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the license at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

import React, { useMemo } from "react";
import { Client, createClient, Provider } from "urql";

import configFile from "../config.json";
import { currentChain } from "@/contracts";
import { useWallets } from "@privy-io/react-auth";

const config: any = configFile;

const useGraphQL = () => {
    const { wallets, ready } = useWallets();
    const connectedChain = useMemo(()=>{
        const id = wallets[0]?.chainId ? wallets[0].chainId.split(':')[1] : currentChain.id;
        return id;
    }, [wallets, ready]);
    return useMemo<Client | null>(() => {
        if (!connectedChain) {
            return null;
        }
        let url = "";

        if(config[connectedChain]?.graphqlAPIURL) {
            url = `${config[connectedChain].graphqlAPIURL}/graphql`;
        } else {
            console.error(`No GraphQL interface defined for chain ${connectedChain}`);
            return null;
        }

        if (!url) {
            return null;
        }

        return createClient({ url });
    }, [connectedChain]);
};

export const GraphQLProvider: any = (props: any) => {
    const client = useGraphQL();
    if (!client) {
        return <div />;
    }
    
    return <Provider value={client}>{props.children}</Provider>;
};

