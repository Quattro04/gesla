import { useEffect, useState } from "react";
import styles from '@/styles/Game.module.css'
import TeamCard from "@/components/teamCard";
import GameCard, { GameCardProps, GameCardType } from "@/components/gameCard";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Game() {

    const { data, error } = useSWR('/api/staticdata', fetcher);

    const [roles, setRoles] = useState<Record<string, string>>({})
    const [gameCards, setGameCards] = useState<GameCardProps[]>([])

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
        setGameCards(shuffle(newGameCards))
    }

    const handleClick = (index: number) => {
        const newGameCards = JSON.parse(JSON.stringify(gameCards))
        newGameCards[index].opened = true
        setGameCards(newGameCards)
    }

    useEffect(() => {
        const rl = localStorage.getItem('roles')
        if (rl) setRoles(JSON.parse(rl))
    }, [])

    useEffect(() => {
        if (error) console.log('ERROR! ', error)
        if (data) {
            console.log('Generating card array ...')
            generateCards()
        }
    }, [data, error])

    return (
        <div className={styles.container}>
            <TeamCard team="blue" op={roles.blueOp} spy={roles.blueSpy} />
            <div className={styles.board}>
                {gameCards.map((card, i) => (
                    <div key={card.text} className={styles.gameCardOuterWrapper} onClick={() => handleClick(i)}>
                        <GameCard text={card.text} type={card.type} opened={card.opened} />
                    </div>
                ))}
            </div>
            <TeamCard team="red" op={roles.redOp} spy={roles.redSpy} />
        </div>
    )
}