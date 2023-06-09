import Head from 'next/head'
import styles from '@/styles/Home.module.css'

import { useWeb3React } from "@web3-react/core";
import { useEffect } from "react";
import { Web3Provider } from '@ethersproject/providers'

import { createStyles, Divider, Flex, getStylesRef, Group, Header, rem, Text, Title } from "@mantine/core";
import { useDispatch, useSelector } from 'react-redux'
import { HasMetaMask, setHasMetamask } from '@/redux/slices/metaMaskSlice'
import ConnectToWallet from '@/components/ConnectToWallet/ConnectToWallet'
import { HeaderMegaMenu } from '@/components/HeaderMegaMenu/HeaderMegaMenu'
import { FooterSimple } from '@/components/FooterSimple/FooterSimple';
import ConnectedCard from '@/components/ConnectedCard/ConnectedCard';
import ToggleLockCard from '@/components/ToogleLockCard/ToogleLockCard';

import appsettings from '@/appsettings.json'
import abi from '@/abis/DoorLockAbi.json'
import { ethers } from 'ethers';
import { DoorStates, setDoorState } from '@/redux/slices/doorLockSlice';
import { current } from '@reduxjs/toolkit';

const useStyles = createStyles((theme) => ({
    wrapper: {
        width: rem(600),
        maxWidth: '90%',
        display: 'flex',
        paddingTop: rem(20),
        alignItems: 'center',
        marginLeft: 'auto',
        marginRight: 'auto',
        [`@media (max-width: ${theme.breakpoints.sm})`]: {
            [`& .${getStylesRef('child')}`]: {
                fontSize: theme.fontSizes.xs,
            },
        },
    },
}))

export default function Home() {
    const dispatch = useDispatch();
    const hasMetaMask = useSelector((state: any) => state.metaMask.hasMetaMask)

    useEffect(() => {
        if (typeof (window as any).ethereum !== "undefined") {
            if (hasMetaMask != HasMetaMask.Yes) {
                dispatch(setHasMetamask(HasMetaMask.Yes));
            }
        }
        else {
            dispatch(setHasMetamask(HasMetaMask.No));
        }
    });

    const { active, library } = useWeb3React<Web3Provider>()
    const { classes } = useStyles();

    const signer: any = library?.getSigner();
    const contractAddress = appsettings.contractAddress;

    useEffect(() => {
        if (active) {
            const contract = new ethers.Contract(contractAddress, abi, signer);
            
            const getCurrentState = async () => {
                const currentState = await contract.DoorState()
                console.log("currentState", currentState)
                return currentState ? DoorStates.Open : DoorStates.Closed;
            }

            getCurrentState().then(val => dispatch(setDoorState(val)));


            contract.on("DoorStateChanged", (newState : boolean) => {
                console.log(newState);
                dispatch(setDoorState(newState ? DoorStates.Open : DoorStates.Closed));
            });
        }
    }, [active]);

    return (
        <>
            <Head>
                <title>HomePortal</title>
                <meta name="description" content="Ethereum based smart contract to change door state" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className={styles.main}>
                <HeaderMegaMenu />

                <Flex direction="column" justify="space-between" h="100%">
                    <div className={classes.wrapper}>
                        {hasMetaMask === HasMetaMask.Yes && !active ? <ConnectToWallet></ConnectToWallet> : <></>}
                        {hasMetaMask === HasMetaMask.No && !active ? <Text>Please install MetaMask</Text> : <></>}
                        {active ?
                            <Group>
                                <Title>My Home</Title>
                                <Divider w="100%" />
                                <ConnectedCard />
                                <ToggleLockCard />
                            </Group>

                            : <></>}
                    </div>
                    <FooterSimple />
                </Flex>

            </main>
        </>
    )
}
