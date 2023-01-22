import styles from '@/styles/GameCard.module.css'
import { IconFlare, IconMoodSad2, IconBrandSketch, IconSkull, IconSpy } from '@tabler/icons';

export enum GameCardType {
    RED = 'red',
    BLUE = 'blue',
    NEUTRAL = 'neutral',
    DEATH = 'death'
}

export interface GameCardProps {
    text: string;
    type: GameCardType;
    opened: boolean;
}

export default function TeamCard({text, type, opened}: GameCardProps) {
    return (
        <div className={`${styles.gameCardWrapper} ${opened ? styles.gameCardWrapperOpened : ''}`}>
            <div className={styles.gameCard}>
                <div className={styles.upper}>
                    <div className={styles.line}></div>
                    <IconSpy size={40} />
                </div>
                <span className={styles.text}>{text}</span>
            </div>
            <div className={`${styles.overlay} ${opened ? `${styles[type]} ${styles.overlayOpened}` : ''}`}>
                <div className={styles.overlayInner}>
                    {type === GameCardType.RED &&
                        <IconFlare size={80}/>
                    }
                    {type === GameCardType.BLUE &&
                        <IconBrandSketch size={80}/>
                    }
                    {type === GameCardType.NEUTRAL &&
                        <IconMoodSad2 size={80}/>
                    }
                    {type === GameCardType.DEATH &&
                        <IconSkull size={80}/>
                    }
                </div>
            </div>
        </div>
    )
}