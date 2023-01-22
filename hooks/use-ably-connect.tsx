import { useState } from "react";
import * as Ably from 'ably/promises'
import { configureAbly } from '@ably-labs/react-hooks'


interface AblyConnectProps {
    username: string;
}

export default function useAblyConnect({username}: AblyConnectProps) {

    const [channel, setChannel] = useState<Ably.Types.RealtimeChannelPromise | null>(null)


    const connectToChannel = () => {
        const ably: Ably.Types.RealtimePromise = configureAbly({
            authUrl: '/api/authentication/token-auth',
            authMethod: 'POST',
            clientId: username,
        })
    
        ably.connection.on(handleConnectionStateChange)
        ably.connection.connect()
    
        if (channel === null) {
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
            setPageState('lobby')
    
            getHistory(_channel)
    
            _channel.subscribe(handleChannelMessage);
        }
    }
}
