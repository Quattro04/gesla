import { useCallback, useEffect, useState } from "react";
import styles from '@/styles/Game.module.css'
import TeamCard from "@/components/teamCard";
import GameCard, { GameCardProps, GameCardType } from "@/components/gameCard";
import useSWR from 'swr';
import useAblyConnect from "@/hooks/use-ably-connect";
import * as Ably from 'ably/promises'
import GameLog, { GameLogType } from '@/components/gameLog';
import uuid4 from "uuid4";
import { Card, Text, Divider, createStyles, Group, Badge, Button } from "@mantine/core";
import useResizeHandler from "@/hooks/use-resize-handler";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const useStyles = createStyles((theme) => ({
    heading: {
        borderBottom: `1px solid ${
          theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
        }`,
        paddingLeft: theme.spacing.md,
        paddingRight: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        paddingTop: theme.spacing.md,
        background: theme.colors.gray,
    },
    section: {
        borderBottom: `1px solid ${
            theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
        }`,
        paddingLeft: theme.spacing.md,
        paddingRight: theme.spacing.md,
        paddingBottom: theme.spacing.md,
    },
}))

const presenceActionIcon = new Map<string, string>([
    ['enter', '🟢'],
    ['leave', '🔴']
])

export default function Game() {

    const [pageState, setPageState] = useState<string>('lobby')

    const [username, setUsername] = useState<string>()
    const { data, error } = useSWR('/api/staticdata', fetcher);

    // const [roles, setRoles] = useState<Record<string, string>>({})
    const [gameCards, setGameCards] = useState<GameCardProps[]>([])

    const [myRole, setMyRole] = useState<string>('')
    const [myTeam, setMyTeam] = useState<string>('')
    const [blueSpy, setblueSpy] = useState<string>('')
    const [blueOp, setblueOp] = useState<string>('')
    const [redSpy, setredSpy] = useState<string>('')
    const [redOp, setredOp] = useState<string>('')

    const [startGameError, setStartGameError] = useState<string>('')

    const [redTeamCardsLeft, setRedTeamCardsLeft] = useState<number>(8)
    const [blueTeamCardsLeft, setBlueTeamCardsLeft] = useState<number>(8)

    const [gameLog, setGameLog] = useState<GameLogType[]>([])

    const [turn, setTurn] = useState<number>(0)
    const [myTurn, setMyTurn] = useState<boolean>(false)

    const { classes } = useStyles();

    const { connectionState, message, onlineUsers, publishMessage } = useAblyConnect({ username })
    const { screenSize } = useResizeHandler()

    const notifyNewRound = () => {
        if (calculateWhosTurn().team === 'red') {
            toast.error(`Runda ${turn}: ${calculateWhosTurn().user} mora ${calculateWhosTurn().role === 'op' ? 'odkriti kartice' : 'dati namig'}`)
        } else {
            toast.info(`Runda ${turn}: ${calculateWhosTurn().user} mora ${calculateWhosTurn().role === 'op' ? 'odkriti kartice' : 'dati namig'}`)
        }
    };
    const notifyGameEnd = (team: string) => {
        if (team === 'red') {
            toast.error(`Zmagala je rdeča ekipa!`, {autoClose: false});
        } else {
            toast.info(`Zmagala je modra ekipa!`, {autoClose: false});
        }
    }

    const shuffle = (array: Array<any>) => {
        let currentIndex = array.length,  randomIndex;
      
        // While there remain elements to shuffle.
        while (currentIndex != 0) {
      
            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
        
            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
      
        return array;
    }

    const generateCards = () => {
        const words = data.split('\r\n')
        const typeArray = [
            GameCardType.RED,GameCardType.RED,GameCardType.RED,GameCardType.RED,GameCardType.RED,GameCardType.RED,GameCardType.RED,GameCardType.RED,
            GameCardType.BLUE,GameCardType.BLUE,GameCardType.BLUE,GameCardType.BLUE,GameCardType.BLUE,GameCardType.BLUE,GameCardType.BLUE,GameCardType.BLUE,
            GameCardType.NEUTRAL,GameCardType.NEUTRAL,GameCardType.NEUTRAL,GameCardType.NEUTRAL,GameCardType.NEUTRAL,GameCardType.NEUTRAL,GameCardType.NEUTRAL,GameCardType.NEUTRAL,
            GameCardType.DEATH
        ]

        // Make 25 gameCards with random words
        const newGameCards: GameCardProps[] = []
        for (let i = 0; i < 25; i++) {
            const wordIdx = Math.floor(Math.random()*words.length)
            newGameCards.push({
                text: words[wordIdx],
                type: typeArray[i],
                opened: false
            })
            words.splice(wordIdx, 1)
        }

        // Shuffle array
        const shuffledCards = shuffle(newGameCards)
        publishMessage('game-board', JSON.stringify(shuffledCards))
        publishMessage('next-turn', JSON.stringify({ turn: `${turn+1}` }))
    }

    const openCard = (index: number) => {
        const newGameCards = JSON.parse(JSON.stringify(gameCards))
        newGameCards[index].opened = true
        setGameCards(newGameCards)
        if (newGameCards[index].type === GameCardType.RED) {
            setRedTeamCardsLeft(redTeamCardsLeft-1)
            if (redTeamCardsLeft-1 === 0) {
                endGame('red')
            }
        } else if (newGameCards[index].type === GameCardType.BLUE) {
            setBlueTeamCardsLeft(blueTeamCardsLeft-1)
            if (blueTeamCardsLeft-1 === 0) {
                endGame('blue')
            }
        }
    }

    const calculateIfMyTurn = (t: number) => {
        if (myTeam === 'blue') {
            if (myRole === 'op') {
                return t % 4 === 2
            } else {
                return t % 4 === 1
            }
        } else {
            if (myRole === 'op') {
                return t % 4 === 0
            } else {
                return t % 4 === 3
            }
        }
    }

    const calculateWhosTurn = (): { user: string, team: string, role: string } => {
        const turnRemainder = turn % 4
        switch (turnRemainder) {
            case 1:
                return { user: blueSpy, team: 'blue', role: 'spy' }
            case 2:
                return { user: blueOp, team: 'blue', role: 'op' }
            case 3:
                return { user: redSpy, team: 'red', role: 'spy' }
            case 0:
                return { user: redOp, team: 'red', role: 'op' }
        }
        return { user: '', team: '', role: '' }
    }

    const endGame = (winner: string) => {
        notifyGameEnd(winner)
        setTurn(-1)
        setMyTurn(false)
    }

    const changeRole = (role: string) => {
        publishMessage('change-role', JSON.stringify({ role }))
    }

    const startGame = () => {
        if (!blueOp ||
            !blueSpy ||
            !redOp ||
            !redSpy)
        {
            setStartGameError('Vse vloge morajo biti zasedene! Potrebujete vsaj 4 igralce.')
            return
        }

        publishMessage('start-game', JSON.stringify({ pageState: 'game' }))
    }

    const handleClick = (index: number, cardText: string, cardColor: string) => {
        if (myRole !== 'op' || !myTurn) return
        publishMessage('open-card', JSON.stringify(
            {
                id: uuid4(),
                cardIndex: index,
                user: {
                    name: username,
                    team: myTeam
                },
                text: 'je odprl',
                item: {
                    name: cardText,
                    color: cardColor
                }
            }
        ))
        if (myTeam !== cardColor) {
            publishMessage('next-turn', JSON.stringify({ turn: `${turn+1}` }))
        }
    }

    const handleClue = (clue: string) => {
        if (myRole !== 'spy' || !myTurn) return
        publishMessage('give-clue', JSON.stringify(
            {
                id: uuid4(),
                user: {
                    name: username,
                    team: myTeam
                },
                text: 'je dal namig',
                item: {
                    name: clue,
                    color: 'neutral'
                }
            }
        ))
        publishMessage('next-turn', JSON.stringify({ turn: `${turn+1}` }))
    }

    const handleChannelMessage = (message: Ably.Types.Message) => {
        console.log('channel message: ', message)
        const data = JSON.parse(message.data)
        switch(message.name) {
            case 'change-role':
                if (blueOp === message.clientId) setblueOp('')
                if (blueSpy === message.clientId) setblueSpy('')
                if (redOp === message.clientId) setredOp('')
                if (redSpy === message.clientId) setredSpy('')
                eval(`set${data.role}(message.clientId)`)
                if (message.clientId === username) {
                    setMyRole(data.role.includes('Op') ? 'op' : 'spy')
                    setMyTeam(data.role.includes('blue') ? 'blue' : 'red')
                }
                break
            case 'start-game':
                setPageState('game')
                break
            case 'game-board':
                setGameCards(data)
                break
            case 'open-card':
                openCard(Number(data.cardIndex))
                setGameLog(
                    [
                        ...gameLog,
                        {
                            id: data.id,
                            user: data.user,
                            text: data.text,
                            item: data.item
                        }
                    ]
                )
                if (gameCards[Number(data.cardIndex)].type === GameCardType.DEATH) {
                    endGame(data.user.team === 'red' ? 'blue' : 'red')
                }
                break
            case 'give-clue':
                setGameLog(
                    [
                        ...gameLog,
                        {
                            id: data.id,
                            user: data.user,
                            text: data.text,
                            item: data.item
                        }
                    ]
                )
                break
            case 'next-turn':
                setTurn(Number(data.turn))
                setMyTurn(calculateIfMyTurn(data.turn))
                break
            default:
                console.error('Unknown channel message name: ' + message.name)
                break
        }
    }

    useEffect(() => {
        // const rl = localStorage.getItem('roles')
        // if (rl) {
        //     setRoles(JSON.parse(rl))
        // }
        const un = localStorage.getItem('username')
        if (un) setUsername(un)

        // if (rl && un) {
        //     const i = Object.values(JSON.parse(rl)).findIndex(name => name === un)
        //     if (Object.keys(JSON.parse(rl))[i] === 'blueOp' || Object.keys(JSON.parse(rl))[i] === 'redOp') {
        //         setMyRole('op')
        //         if (Object.keys(JSON.parse(rl))[i] === 'blueOp') {
        //             setMyTeam('blue')
        //         } else {
        //             setMyTeam('red')
        //         }
        //     } else {
        //         setMyRole('spy')
        //         if (Object.keys(JSON.parse(rl))[i] === 'blueSpy') {
        //             setMyTeam('blue')
        //         } else {
        //             setMyTeam('red')
        //         }
        //     }
        // }
    }, [])

    useEffect(() => {
        if (gameCards.length > 0) return
        if (error) console.log('ERROR LOADING DATA FOR CARDS! ', error)
        // console.log(connectionState, myRole, myTeam)
        if (data && pageState === 'game' && myRole === 'spy' && myTeam === 'blue') {
            console.log('Generating card array ...')
            generateCards()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, error, pageState])

    useEffect(() => {
        if (!!message) {
            handleChannelMessage(message as Ably.Types.Message)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [message])

    useEffect(() => {
        if (turn > 0) {
            notifyNewRound()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turn])

    return (
        <div className={styles.main}>
            <ToastContainer position="top-center" theme="colored" />
            {pageState === 'lobby' && (
                <div className={styles.container}>
                    <h1 className={styles.title}>GESLA</h1>
                    <div className={styles.lobby}>
                        <div className={styles.cards}>
                            <TeamCard
                                team="blue"
                                op={blueOp}
                                spy={blueSpy}
                                changeRole={changeRole}
                            />
                            <span className={styles.versus}>VS</span>
                            <TeamCard
                                team="red"
                                op={redOp}
                                spy={redSpy}
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
                </div>
            )}
            {pageState === 'game' && (
                <div className={styles.gameContainer}>
                    <div className={styles.sideContainer}>
                        <TeamCard team="blue" op={blueOp} spy={blueSpy} cardsLeft={blueTeamCardsLeft} />
                        <br />
                        <Divider />
                        <br />
                        <Card withBorder radius="md">
                            <Card.Section className={classes.heading} mt="md">
                                <Text size={screenSize === 'desktop' ? 'lg' : 'sm'} weight={500}>
                                    Runda {turn}
                                </Text>
                            </Card.Section>
                            <Card.Section className={classes.section} mt="md">
                                <Group position="apart">
                                    <Text size={screenSize === 'desktop' ? 'lg' : 'sm'} weight={500}>
                                        Na potezi
                                    </Text>
                                    <Badge size={screenSize === 'desktop' ? 'lg' : 'sm'} style={{background: calculateWhosTurn().team === 'blue' ? '#1864ab' : '#c92a2a'}}>
                                        {calculateWhosTurn().user} ({calculateWhosTurn().role === 'op' ? 'Vohun' : 'Vodja'})
                                    </Badge>
                                </Group>
                            </Card.Section>
                        </Card>
                    </div>
                    <div className={styles.board}>
                        {gameCards.map((card, i) => (
                            <div key={card.text} className={styles.gameCardOuterWrapper} onClick={() => handleClick(i, card.text, card.type)}>
                                <GameCard text={card.text} type={card.type} opened={card.opened} forRole={myRole} />
                            </div>
                        ))}
                    </div>
                    <div className={styles.sideContainer}>
                        <TeamCard team="red" op={redOp} spy={redSpy} cardsLeft={redTeamCardsLeft} />
                        <br />
                        <Divider />
                        <br />
                        <GameLog
                            title="Potek igre"
                            userRole={myRole}
                            gameLog={gameLog}
                            style={{display: 'flex', flexDirection: 'column', flex: '1 1 0'}}
                            onClue={handleClue}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}