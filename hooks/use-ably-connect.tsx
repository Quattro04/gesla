import { useCallback, useEffect, useState } from "react";
import { configureAbly, useChannel } from "@ably-labs/react-hooks";
import * as Ably from 'ably/promises'
import Logger, { LogEntry } from '../components/logger'


type Message = {
    timestamp: number,
    data: {
        text: string,
    }
}

interface AblyConnectProps {
    username: string | undefined;
}

interface AblyConnectReturn {
    connectionState: string;
    message: Ably.Types.Message | undefined;
    onlineUsers: string[];
    publishMessage: (name: string, data: string) => void;
}

export default function useAblyConnect({username}: AblyConnectProps): AblyConnectReturn {

    // const [channel, ably] = useChannel("gesla", (message) => {
    //     console.log(message);
    // });

    const [channel, setChannel] = useState<Ably.Types.RealtimeChannelPromise>()

    // const [logs, setLogs] = useState<Array<LogEntry>>([])
    // const [historicalLogs, setHistoricalLogs] = useState<Array<LogEntry>>([])

    const [connectionState, setConnectionState] = useState<string>('unknown')
    const [message, setMessage] = useState<Ably.Types.Message>()
    const [onlineUsers, setOnlineUsers] = useState<string[]>([])


    const handleConnectionStateChange = (stateChange: Ably.Types.ConnectionStateChange) => {
        // setLogs(prev => [...prev, new LogEntry(`Connection state change: ${stateChange.previous} -> ${stateChange.current}`)])

        console.log(`Connection state change: ${stateChange.previous} -> ${stateChange.current}`)

        setConnectionState(stateChange.current)
    }

    const handlePresenceMessage = (message: Ably.Types.PresenceMessage) => {
        // console.log('handlePresenceMessage', message.action, message.clientId, new Date());
    
        if (message.action === 'enter' || message.action === 'present') {
            setOnlineUsers(prev => {
                if (prev.includes(message.clientId) === false) {
                    return [...prev, message.clientId]
                }
                else {
                    return prev
                }
            })
        } else {
            setOnlineUsers(prev => prev.filter(username => {
                const keep: boolean = username !== message.clientId
                return keep
            }))
        }
    }

    const publishMessage = (name: string, data: string) => {
        if (channel !== undefined) {
            console.log('publishing ', name, data)
            channel.publish(name, data)
        }
    }

    // const getHistory = async() => {
    //     if (channel === undefined) return

    //     let history: Ably.Types.PaginatedResult<Message> = await channel.history()
    //     do {
    //         history.items.forEach(message => {
    //             const msg = message as Ably.Types.Message
    //             if (msg.name === 'game-board') {
    //                 setMessage(msg)
    //             }
    //         })
    //         history = await history.next()
    //     }
    //     while(history)
    // }

    // const publishHandler: MouseEventHandler = (_event: MouseEvent<HTMLButtonElement>) => {
    //     if (channel === null) return
    
    //     channel.publish('update-from-client', {text: `yolo swag @ ${new Date().toISOString()}`})
    // }

    const connectToChannel = () => {
        console.log('connecting')
        const ably: Ably.Types.RealtimePromise = configureAbly({
            authUrl: '/api/authentication/token-auth',
            authMethod: 'POST',
            clientId: username,
        })
    
        ably.connection.on(handleConnectionStateChange)
        ably.connection.connect()
    
        if (channel === undefined) {
            const _channel: Ably.Types.RealtimeChannelPromise = ably.channels.get('room')
            setChannel(_channel)
    
            // Note: the 'present' event doesn't always seem to fire
            // so we use presence.get() later to get the initial list of users
            // _channel.presence.subscribe(['present', 'enter', 'leave'], handlePresenceMessage)
            _channel.presence.subscribe(['enter', 'leave'], handlePresenceMessage)
    
            const getExistingMembers = async () => {
                const messages = await _channel.presence.get()
                messages.forEach(handlePresenceMessage)
            }
            getExistingMembers()
            _channel.presence.enter()
            _channel.subscribe(m => setMessage(m));
        }
    }

    useEffect(() => {
        if (!!username) {
            connectToChannel()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username])

    // useEffect(() => {
    //     if (connectionState === 'connected') {
    //         getHistory()
    //     }
    // // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [connectionState])

    return {
        connectionState,
        message,
        onlineUsers,
        publishMessage
    }
}
