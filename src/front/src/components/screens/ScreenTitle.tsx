import { RoundedBox, ScreenSpace, Text } from "@react-three/drei";
import { useThree } from '@react-three/fiber';
import React, { useRef, useEffect, useState } from 'react';
import { Button } from "../Button";
import { useAccount, useConnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { truncateAddress } from "../../../../core/funcs/utils";

export const ScreenTitle = () => {
    const { viewport } = useThree();
    const buttonWidth = 2; // Width of the button background
    const buttonHeight = 0.5; // Height of the button background

    // Calculate positions based on viewport to help position elements
    // This is an approximation; you might need to adjust these values
    const playPositionY = -20; // Adjust based on actual positioning needs


    const [ buttonText, setButtonText ] = React.useState('Connect')
    const { address, isConnected, isConnecting } = useAccount()
    const { connect } = useConnect({connector: new InjectedConnector()})

    useEffect(() => {
        if (isConnected) {
            setButtonText('Connected to ' + truncateAddress(address))
        } else if (isConnecting) {
            setButtonText('Connecting...')
        } else {
            setButtonText('Connect')
        }
    }, [isConnected, isConnecting, address])


    return (
        <ScreenSpace depth={1}>
            <Text
                color="white"
                fontSize={10}
                // outlineColor={'black'}
                // outlineWidth={0.5}
                font="fonts/PressStart2P-Regular.ttf"
                position={[0, 0.5, 0]} // Adjusted to make room for the button
            >
                Bubblewars.io
            </Text>
            {/* <group 
                position={[0, playPositionY, 0]}
            >
            <RoundedBox
            args={[25, 10, 10]} // Width, height, depth. Default is [1, 1, 1]
            radius={0.5} // Radius of the rounded corners. Default is 0.05
            smoothness={4} // The number of curve segments. Default is 4
            bevelSegments={4} // The number of bevel segments. Default is 4, setting it to 0 removes the bevel, as a result the texture is applied to the whole geometry.
            creaseAngle={0.4} // Smooth normals everywhere except faces that meet at an angle greater than the crease angle
            position={[0, 0, -10]} // Adjusted to make room for the button
            >
            <meshPhongMaterial color="white" />
            </RoundedBox>
           
            <Text
                color="white"
                fontSize={5}
                font="fonts/PressStart2P-Regular.ttf"
                position={[0, 0, 0.1]} // Adjusted to make room for the button
            >
                Play
            </Text>
            </group> */}
            <Button
                label={buttonText}
                position={[0, playPositionY, 0]}
                fontSize={5}
                onClick={() => connect()}
            />
            
        </ScreenSpace>
    );
}
