import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'
import { useRouter } from 'next/router'

import Logger, { LogEntry } from '../components/logger'

import * as Ably from 'ably/promises'
import { configureAbly } from '@ably-labs/react-hooks'

import { FormEvent, MouseEvent, MouseEventHandler, useCallback, useRef, useState } from 'react'
import { Button, Card, Group, Input, Text, Badge, createStyles } from '@mantine/core';
import TeamCard from '@/components/teamCard'


const presenceActionIcon = new Map<string, string>([
    ['enter', '🟢'],
    ['leave', '🔴']
])

const inter = Inter({ subsets: ['latin'] })

type Message = {
    timestamp: number,
    data: {
        text: string,
    }
}

const useStyles = createStyles((theme) => ({
    heading: {
        borderBottom: `1px solid ${
          theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
        }`,
        paddingLeft: theme.spacing.md,
        paddingRight: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        paddingTop: theme.spacing.md,
    },
}))

export default function Home() {

    const [pageState, setPageState] = useState<string>('init')

    const [logs, setLogs] = useState<Array<LogEntry>>([])
    const [connectionState, setConnectionState] = useState('unknown')
  
    const [onlineUsers, setOnlineUsers] = useState<string[]>([])
    const [channel, setChannel] = useState<Ably.Types.RealtimeChannelPromise | null>(null)
    const [username, setUsername] = useState<string>('')
    const [usernameError, setUsernameError] = useState<string>('')
    const [startGameError, setStartGameError] = useState<string>('')

    const [historicalLogs, setHistoricalLogs] = useState<Array<LogEntry>>([])

    const [roles, _setRoles] = useState<Record<string, string>>({})

    const { classes } = useStyles();

    const router = useRouter()

    const rolesStateRef = useRef(roles);
    const setRoles = (data: Record<string, string>) => {
        rolesStateRef.current = data;
        _setRoles(data);
    };

    const handleConnectionStateChange = (stateChange: Ably.Types.ConnectionStateChange) => {
        setLogs(prev => [...prev, new LogEntry(`Connection state change: ${stateChange.previous} -> ${stateChange.current}`)])

        setConnectionState(stateChange.current)
    }

    const handlePresenceMessage = useCallback((message: Ably.Types.PresenceMessage) => {
        console.log('handlePresenceMessage', message.action, message.clientId, new Date());
    
        if (message.action === 'enter' || message.action === 'present') {
            setOnlineUsers(prev => {
                if (prev.includes(message.clientId) === false) {
                    return [...prev, message.clientId]
                }
                else {
                    return prev
                }
            })
        } else { // user has left
            setOnlineUsers(prev => prev.filter(username => {
                const keep: boolean = username !== message.clientId
                return keep
            }))
        }
    
        setLogs(prev => [...prev, new LogEntry(`action: ${message.action} clientId: ${message.clientId}`)])
    }, [])

    const handleChannelMessage = (message: Ably.Types.Message) => {

        // console.log(JSON.parse(JSON.stringify(roles)))
        // if (message.name === 'change-role') {
        //     setRoles({...roles, [message.data]: message.clientId})
        // }

        switch(message.name) {
            case 'change-role':
                let oldRoles = JSON.parse(JSON.stringify(rolesStateRef.current))
                const userOldRole = Object.keys(rolesStateRef.current).find(r => rolesStateRef.current[r] === message.clientId)
                if (userOldRole) delete oldRoles[userOldRole]
                oldRoles[message.data] = message.clientId
                setRoles(oldRoles)
                break
            default:
                console.error('Unknown channel message name: ' + message.name)
                break
        }
    }

    const getHistory = async (ch: any) => {
        if (ch === null) return

        let history: Ably.Types.PaginatedResult<Message> = await ch.history()

        do {
            history.items.forEach(message => {
                handleChannelMessage(message as Ably.Types.Message)
            })
            history = await history.next()
        }
        while(history)
    }

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

    const publishHandler: MouseEventHandler = (_event: MouseEvent<HTMLButtonElement>) => {
        if (channel === null) return
    
        channel.publish('update-from-client', {text: `yolo swag @ ${new Date().toISOString()}`})
    }

    const validateUsername = () => {
        return username.trim().length > 2
    }

    const handleSubmit = (e: FormEvent): void => {
        e.preventDefault()
        if (validateUsername()) {
            setUsernameError('')
            connectToChannel()
        } else {
            setUsernameError('Ime mora imeti vsaj 3 znake')
        }
    }

    const changeRole = (role: string) => {
        if (channel === null) return
    
        channel.publish('change-role', role)
    }

    const startGame = () => {
        if (!rolesStateRef.current.blueOp ||
            !rolesStateRef.current.blueSpy ||
            !rolesStateRef.current.redOp ||
            !rolesStateRef.current.redSpy)
        {
            setStartGameError('Vse vloge morajo biti zasedene! Potrebujete vsaj 4 igralce.')
            return
        }

        localStorage.setItem('roles', JSON.stringify(rolesStateRef.current));

        router.push({pathname: '/game'})
    }

    return (
        <main className={styles.main}>
            <h1 className={styles.title}>GESLA</h1>
            {pageState === 'init' &&
                <div className={styles.container}>
                    <h2 className={styles.subtitle}>Igra za 4 igralce, v kateri lahko uživajo vsi.<br />Narejena po znani namizni igri Codenames.</h2>
                    <form className={styles.actions} onSubmit={handleSubmit}>
                        <label id="neki" className={styles.label}>neki</label>
                        <Input className={styles.input} placeholder="Ime" value={username} onChange={(e) => setUsername(e.target.value)} aria-label="neki" />
                        <Button className={styles.button} type="submit">Začni</Button>
                        <span className={styles.error}>{usernameError}</span>
                    </form>
                </div>
            }
            {pageState === 'lobby' &&
                <div className={styles.lobby}>
                    <div className={styles.cards}>
                        <TeamCard
                            team="blue"
                            op={rolesStateRef.current.blueOp}
                            spy={rolesStateRef.current.blueSpy}
                            changeRole={changeRole}
                        />
                        <span className={styles.versus}>VS</span>
                        <TeamCard
                            team="red"
                            op={rolesStateRef.current.redOp}
                            spy={rolesStateRef.current.redSpy}
                            changeRole={changeRole}
                        />
                    </div>
                    <Button className={styles.startGame} color="green" size="md" onClick={() => startGame()}>
                        Začni igro
                    </Button>
                    <span className={styles.error}>{startGameError}</span>
                    <div className={styles.users}>
                        <Card withBorder radius="md">
                            <Card.Section className={classes.heading}>
                                <Text size="lg" weight={500}>
                                    Uporabniki
                                </Text>
                            </Card.Section>
                            <Card.Section className={classes.heading}>
                                {onlineUsers.map((username: string) => {
                                    return <Text size="md" key={username}>
                                        {presenceActionIcon.get('enter')} {username}
                                    </Text>
                                })}
                            </Card.Section>
                        </Card>
                    </div>
                </div>
            }
        </main>
    )
}
