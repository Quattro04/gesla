import { useCallback, useEffect, useState } from "react";
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

const words = ["Akne","Dodatek","Oglašujte","Letalo","Prehod","Aligator","Abeceda","Amerika","Gleženj","Depresija","Aplavz","Jabolčna omaka","Aplikacija","Arheolog","Aristokrat","Roka","Armada","Spati","Astronavt","Športnik","Atlantis","Teta","Avokado","Varuška","Hrbtenica","Torba","Bagueta","Plešast","Balon","Banana","Ograja","Golf","Podstavki","Košarka","Netopir","Baterija","Plaža","Fižolovo steblo","Posteljna stenica","Pivo","Beethoven","Pas","Oprsnica","Velik","Kolo","Oglasna deska","Ptica","Rojstni dan","Ugriz","Kovač","Odeja","Belilo","Brisalec","Cveteti","Načrt","Top","Zameglitev","Boja","Čoln","Bob","Telo","Bomba","Pokrov motorja","Knjiga","Metuljček","Škatla","Fant","Znamka","Pogumno","Nevesta","Most","Brokoli","Zlomljena","Metla","Modrica","Rjavolaska","Mehurček","Kolega","Bivol","Žarnica","Zajček","Avtobus","Nakup","Kabina","Kavarna","Torta","Kalkulator","Kamp","Lahek","Kanada","Sveča","Sladkarije","Kapa","Kapitalizem","Avto","Karton","Kartografija","Mačka","Cd","Strop","Celica","Stoletje","Stol","Kreda","Prvak","Polnilec","Navijačica","Kuhar","Šah","Žvečiti","Piščanec","Zvonec","Kitajska","Čokolada","Cerkev","Cirkus","Glina","Pečina","Plašč","Urni mehanizem","Klovn","Namig","Trener","Premog","Podstavek za kozarce","Zobnik","Hladno","Fakulteta","Udobje","Računalnik","Stožec","Pogovor","Kuhanje","Vrvica","Otroška posteljica","Kašelj","Krava","Kavboj","Barvica","Krema","Hrustljavo","Kritizirati","Vrana","Križarjenje","Drobtina","Skorja","Manšeta","Zavesa","Obnohtna kožica","Car","Oče","Pikado","Zora","Dan","Globoko","Napaka","Zob","Zobozdravnik","Pisalna miza","Slovar","Jamica","Umazan","Razstaviti","Jarek","Potapljač","Zdravnik","Pes","Pasja uta","Lutka","Domine","Vrata","Pika","Odtok","Risanje","Sanje","Obleka","Pitje","Kapljanje","Bobni","Sušilnik","Raca","Prah","Uho","Jesti","Komolec","Elektrika","Slon","Dvigalo","Pritlikavec","Breza","Motor","Anglija","Ergonomičen","Tekoče stopnice","Evropa","Evolucija","Razširitev","Obrv","Ventilator","Hitro","Pojedina","Ograja","Fevdalizem","Pigment","Prst","Ogenj","Najprej","Ribolov","Popravi","Drog","Flanela","Svetilka","Jata","Cvet","Gripa","Prati","Trepetanje","Megla","Folija","Nogomet","Čelo","Vedno","Štirinajst dni","Francija","Pega","Tovorni promet","Resice","Žaba","Namrščiti se","Galop","Igra","Smeti","Vrt","Bencin","Dragulj","Ingver","Medenjak","Punca","Očala","Škrat","Zlato","Adijo","Dedek","Grozdje","Trava","Hvaležnost","Siva","Zelena","Kitara","Guma","Lasje","Polovica","Ročaj","Rokopis","Obesiti","Srečno","Klobuk","Loputa","Glavobol","Srce","Živa meja","Helikopter","Rob","Skriti se","Hrib","Hokej","Domača naloga","Poskočnica","Konj","Cev","Vroče","Hiša","Objem","Vlažilec","Lačen","Ovira","Poškodba","Koča","Led","Implodirati","Gostilna","Inkvizicija","Pripravnik","Internet","Vabilo","Ironično","Slonokoščena obala","Japonska","Kavbojke","Žele","Jeti","Dnevnik","Skok","Ključ","Morilec","Kilogram","Kralj","Kuhinja","Zmaj","Koleno","Poklekniti","Nož","Vitez","Koala","Čipka","Lestev","Pikapolonica","Zamik","Odlagališče","Krog","Smejati se","Pralnica","Zakon","Travnik","Puščati","Noga","Pismo","Raven","Življenjski slog","Svetloba","Svetlobni meč","Apnenec","Lev","Kuščar","Dnevnik","Kriminalec","Lizika","Ljubezen","Zvestoba","Kosilo","Besedilo","Stroj","Močan","Poštni nabiralnik","Mamut","Mars","Maskota","Jambor","Vžigalica","Vzmetnica","Nered","Mehika","Bližnji vzhod","Mina","Napaka","Moderen","Plesen","Mama","Ponedeljek","Denar","Zaslon","Pošast","Luna","Krpa","Molj","Motorno kolo","Gora","Miška","Kosilnica","Blato","Glasba","Utihniti","Narava","Pogajati se","Sosed","Gnezdo","Nevtron","Nečak","Noč","Nočna mora","Nos","Veslo","Razgled","Pisarna","Olje","Star","Olimpijec","Prozoren","Odpirač","Orbita","Orgle","Organizirati","Zunanji","Zunaj","Vedro","Barva","Pižama","Palača","Hlače","Papir","Parkirati","Parodija","Zabava","Geslo","Pecivo","Figura","Hruška","Pero","Svinčnik","Nihalo","Penis","Kovanec","Poper","Oseba","Filozof","Fotografija","Klavir","Piknik","Mesar","Blazina","Pilot","Ščepec","Vetrnica","Pirat","Karirast","Načrtovati","Deska","Plošča","Igrišče","Plug","Vodovodar","Žep","Točka","Palica","Pumpa","Namizni tenis","Bazen","Prebivalstvo","Pozitiven","Objaviti","Princesa","Odlašati","Protestant","Psiholog","Založnik","Frajer","Kužek","Potisniti","Sestavljanka","Karantena","Kraljica","Živi pesek","Tih","Dirka","Radio","Splav","Drag","Mavrica","Deževnica","Naključen","Žarek","Reciklirati","Rdeča","Obžalovati","Povračilo stroškov","Maščevanje","Rebro","Uganka","Platišča","Drsališče","Valjček","Soba","Roža","Okroglo","Krožišče","Prečka","Žalosten","Varen","Losos","Sol","Peskovnik","Grad iz peska","Sendvič","Satelit","Brazgotina","Prestrašen","Šola","Podlež","Vmešati","Školjka","Sezona","Stavek","Bleščice","Sedež","Gred","Plitek","Šampon","Morski pes","Ovca","Rjuha","Šerif","Brodolomec","Majica","Vezalke","Kratek","Tuš","Skrčiti","Bolan","Počitek","Silhueta","Pevka","Požirek","Skate","Drsanje","Smučanje","Spanje","Počasi","Padec","Kihati","Sneg","Stisniti se","Pesem","Vesolje","Rezervni","Zvočnik","Pajek","Pljuvati","Goba","Spol","Žlica","Pomlad","Škropilnik","Vohun","Kvadrat","Škiljenje","Stopnice","Stati","Zvezda","Država","Delničar","Zavorna luč","Štedilnik","Slepi potnik","Slama","Tok","Racionalizirati","Črta","Študent","Sonce","Sončna opeklina","Suši","Močvirje","Roj","Pulover","Plavanje","Gugalnica","Barometer","Pogovarjati se","Taksi","Učiteljica","Čajnik","Najstnik","Telefon","Deset","Tenis","Tat","Pomisliti","Prestol","Luknja","Grmenje","Plima","Tiger","Čas","Dozirati","Utrujen","Tkivo","Toast","Stranišče","Orodje","Zobna ščetka","Tornado","Turnir","Traktor","Vlak","Zaklad","Drevo","Trikotnik","Izlet","Tovornjak","Kad","Tuba","Prevajalec","Televizija","Vejica","Vrsta","Brezposeln","Nadgradnja","Telovnik","Vizija","Voda","Lubenica","Vosek","Poroka","Varilec","Karkoli","Invalidski voziček","Stepanje","Piščalka","Bela","Lasulja","Volja","Mlin na veter","Zima","Želja","Volk","Volna","Svet","Črv","Ročna ura","Merilo","Mir","Nič","Zadrga","Cona","Živalski vrt"]

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
            case 'game-board':
                setPageState('game')
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