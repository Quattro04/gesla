import { useEffect, useState } from "react";
import styles from '@/styles/Game.module.css'
import TeamCard from "@/components/teamCard";
import GameCard, { GameCardProps, GameCardType } from "@/components/gameCard";
import useAblyConnect from "@/hooks/use-ably-connect";
import * as Ably from 'ably/promises'
import GameLog, { GameLogType } from '@/components/gameLog';
import uuid4 from "uuid4";
import { Card, Text, Divider, createStyles, Group, Badge, Button } from "@mantine/core";
import useResizeHandler from "@/hooks/use-resize-handler";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { words } from "@/utils/words";


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
    const [blueTeamCardsLeft, setBlueTeamCardsLeft] = useState<number>(9)

    const [gameLog, setGameLog] = useState<GameLogType[]>([])

    const [turn, setTurn] = useState<number>(0)
    const [myTurn, setMyTurn] = useState<boolean>(false)

    const { classes } = useStyles();

    const { connectionState, message, onlineUsers, publishMessage } = useAblyConnect({ username })
    const { screenSize, height } = useResizeHandler()

    const [devModeCount, setDevModeCount] = useState<number>(0)

    const notifyNewRound = (user: {name: string; team: string;}, clue?: string) => {
        const usr = calculateWhosTurn(turn+1)
        if (turn === 0) {
            toast.info(`Začetek igre! ${usr.user} mora dati namig.`)
            return
        }
        if (usr.team === 'red') {
            toast.error((clue ? `Namig: ${clue}! ` : `Konec runde! `) + `${usr.user} mora ${clue ? 'odkriti kartice' : 'dati namig.'}`)
        } else {
            toast.info((clue ? `Namig: ${clue}! ` : `Konec runde! `) + `${usr.user} mora ${clue ? 'odkriti kartice' : 'dati namig.'}`)
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
        const typeArray = [
            GameCardType.RED,GameCardType.RED,GameCardType.RED,GameCardType.RED,GameCardType.RED,GameCardType.RED,GameCardType.RED,GameCardType.RED,
            GameCardType.BLUE,GameCardType.BLUE,GameCardType.BLUE,GameCardType.BLUE,GameCardType.BLUE,GameCardType.BLUE,GameCardType.BLUE,GameCardType.BLUE,GameCardType.BLUE,
            GameCardType.NEUTRAL,GameCardType.NEUTRAL,GameCardType.NEUTRAL,GameCardType.NEUTRAL,GameCardType.NEUTRAL,GameCardType.NEUTRAL,GameCardType.NEUTRAL,
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
    }

    const openCard = (index: number, user: {name: string; team: string;}) => {
        const newGameCards = JSON.parse(JSON.stringify(gameCards))
        newGameCards[index].opened = true
        setGameCards(newGameCards)
        if (newGameCards[index].type === GameCardType.RED) {
            setRedTeamCardsLeft(redTeamCardsLeft-1)
            if (redTeamCardsLeft-1 === 0) {
                endGame('red')
            }
            if (user.team !== 'red') {
                nextTurn(user)
            }
        } else if (newGameCards[index].type === GameCardType.BLUE) {
            setBlueTeamCardsLeft(blueTeamCardsLeft-1)
            if (blueTeamCardsLeft-1 === 0) {
                endGame('blue')
            }
            if (user.team !== 'blue') {
                nextTurn(user)
            }
        } else if (newGameCards[index].type === GameCardType.NEUTRAL) {
            nextTurn(user)
        } else if (newGameCards[index].type === GameCardType.DEATH) {
            endGame(user.team === 'red' ? 'blue' : 'red')
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

    const calculateWhosTurn = (trn: number = turn): { user: string, team: string, role: string } => {
        const turnRemainder = trn % 4
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
        if (onlineUsers.length < 4) {
            setStartGameError('Počakajte na vse 4 igralce pred dodeljevanjem vlog')
            return
        }
        setStartGameError('')
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
        console.log('setting to game')
        setPageState('game')
    }

    const nextTurn = (user: {name: string; team: string;}, clue?: string) => {
        const newTurn = turn + 1
        setTurn(Number(newTurn))
        setMyTurn(calculateIfMyTurn(newTurn))
        notifyNewRound(user, clue)
    }

    const titleClick = () => {
        console.log(devModeCount)
        if (devModeCount === 3) {
            setPageState('game')
            generateCards()
        }
        setDevModeCount(prev => prev + 1)
    }

    const endTurn = () => {
        publishMessage('end-turn', JSON.stringify(
            {
                id: uuid4(),
                user: {
                    name: username,
                    team: myTeam
                }
            }
        ))
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
                item: {
                    name: cardText,
                    color: cardColor
                }
            }
        ))
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

                if (data.role === '') return

                eval(`set${data.role}(message.clientId)`)
                if (message.clientId === username) {
                    setMyRole(data.role.includes('Op') ? 'op' : 'spy')
                    setMyTeam(data.role.includes('blue') ? 'blue' : 'red')
                }
                break
            case 'game-board':
                setPageState('game')
                setGameCards(data)
                nextTurn({name: blueSpy, team: 'blue'})
                break
            case 'open-card':
                if (gameCards[Number(data.cardIndex)].opened) return
                openCard(Number(data.cardIndex), data.user)
                setGameLog(
                    [
                        ...gameLog,
                        {
                            id: data.id,
                            user: data.user,
                            text: 'je odprl',
                            item: data.item
                        }
                    ]
                )
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
                nextTurn(data.user, data.item.name)
                break
            case 'end-turn':
                nextTurn(data.user)
                setGameLog(
                    [
                        ...gameLog,
                        {
                            id: data.id,
                            user: data.user,
                            text: 'je končal rundo'
                        }
                    ]
                )
            default:
                console.error('Unknown channel message name: ' + message.name)
                break
        }
    }

    useEffect(() => {
        const un = localStorage.getItem('username')
        if (un) setUsername(un)
    }, [])

    useEffect(() => {
        if (gameCards.length > 0) return
        console.log(pageState, myRole, myTeam)
        if (pageState === 'game' && myRole === 'spy' && myTeam === 'blue') {
            console.log('Generating card array ...')
            generateCards()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageState])

    useEffect(() => {
        if (!!message) {
            handleChannelMessage(message as Ably.Types.Message)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [message])

    return (
        <div className={styles.main} style={{ height }}>
            <ToastContainer position="bottom-left" theme="colored" />
            {pageState === 'lobby' && (
                <div className={styles.container}>
                    <h1 className={styles.title} onClick={() => titleClick()}>GESLA</h1>
                    <div className={styles.users}>
                        {onlineUsers.map((username: string) => {
                            return (
                                <span key={username}>
                                    {presenceActionIcon.get('enter')} {username}
                                </span>
                            )
                        })}
                    </div>
                    <div className={styles.lobby}>
                        <div className={styles.cards}>
                            <TeamCard
                                team="blue"
                                op={blueOp}
                                spy={blueSpy}
                                user={username}
                                changeRole={changeRole}
                            />
                            {(screenSize === 'desktop' || screenSize === 'tablet') && <span className={styles.versus}>VS</span>}
                            <TeamCard
                                team="red"
                                op={redOp}
                                spy={redSpy}
                                user={username}
                                changeRole={changeRole}
                            />
                        </div>
                        <Button className={styles.startGame} color="green" size="md" onClick={() => startGame()} disabled={myRole !== 'spy' || myTeam !== 'blue'}>
                            Začni igro
                        </Button>
                        <span className={styles.error}>{startGameError}</span>
                    </div>
                </div>
            )}
            {pageState === 'game' && (
                <div className={styles.gameContainer}>
                    {(screenSize === 'desktop' || screenSize === 'tablet') &&
                        <div className={styles.sideContainer}>
                            <TeamCard team="blue" op={blueOp} spy={blueSpy} cardsLeft={blueTeamCardsLeft} />
                            <br />
                            <Divider />
                            <br />
                            <Card withBorder radius="md">
                                <Card.Section className={classes.heading} mt="md">
                                    <Group position="apart">
                                        <Text size="lg" weight={500}>
                                            Runda {turn}
                                        </Text>
                                    </Group>
                                </Card.Section>
                                <Card.Section className={classes.section} mt="md">
                                    <Group position="apart">
                                        <Text size="lg" weight={500}>
                                            Na potezi
                                        </Text>
                                        <Badge size="lg" style={{background: calculateWhosTurn().team === 'blue' ? '#1864ab' : '#c92a2a'}}>
                                            {calculateWhosTurn().user} ({calculateWhosTurn().role === 'op' ? 'Vohun' : 'Vodja'})
                                        </Badge>
                                    </Group>
                                </Card.Section>
                                {myRole === 'op' && myTurn &&
                                    <Card.Section className={classes.section} mt="md">
                                        <Button size="sm" color="gray" onClick={endTurn}>
                                            Končaj rundo
                                        </Button>
                                    </Card.Section>
                                }
                            </Card>
                        </div>
                    }
                    <div className={styles.boardWrapper}>
                        <div className={styles.board}>
                            {gameCards.map((card, i) => (
                                <div key={card.text} className={styles.gameCardOuterWrapper} onClick={() => handleClick(i, card.text, card.type)}>
                                    <GameCard text={card.text} type={card.type} opened={card.opened} forRole={myRole} />
                                </div>
                            ))}
                        </div>
                        {(screenSize === 'mobile' || screenSize === 'xs') &&
                            <>
                            <div className={styles.sidesMobile}>
                                <Card className={styles.sideCardWrapper} withBorder radius="md">
                                    <Card.Section className={classes.heading} mt="md">
                                        <Group position="apart">
                                            <Text size="sm" weight={500}>
                                                Runda {turn}
                                            </Text>
                                            <Text>
                                                <Badge size="md" style={{ background: '#1864ab', margin: '0 5px 0 0' }}>
                                                    {blueTeamCardsLeft}
                                                </Badge>
                                                <Badge size="md" style={{ background: '#c92a2a' }}>
                                                    {redTeamCardsLeft}
                                                </Badge>
                                            </Text>
                                        </Group>
                                    </Card.Section>
                                    <Card.Section className={classes.section} mt="md">
                                        <Group>
                                            <Text size="sm" weight={500}>
                                                Na potezi
                                            </Text>
                                            <Badge size="sm" style={{background: calculateWhosTurn().team === 'blue' ? '#1864ab' : '#c92a2a'}}>
                                                {calculateWhosTurn().user} ({calculateWhosTurn().role === 'op' ? 'Vohun' : 'Vodja'})
                                            </Badge>
                                        </Group>
                                    </Card.Section>
                                    {myRole === 'op' && myTurn &&
                                        <Card.Section className={classes.section} mt="md">
                                            <Button size="sm" color="gray" onClick={endTurn}>
                                                Končaj rundo
                                            </Button>
                                        </Card.Section>
                                    }
                                </Card>
                                <div className={styles.gameLogWrapper}>
                                    <GameLog
                                        title="Potek igre"
                                        userRole={myRole}
                                        gameLog={gameLog}
                                        style={{display: 'flex', flexDirection: 'column', flex: '1 1 0'}}
                                        onClue={handleClue}
                                    />
                                </div>
                            </div>
                            {/* <div className={styles.spacer} /> */}
                            </>
                        }
                    </div>
                    {(screenSize === 'desktop' || screenSize === 'tablet') &&
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
                    }
                </div>
            )}
        </div>
    )
}