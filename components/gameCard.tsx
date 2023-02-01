import useResizeHandler from '@/hooks/use-resize-handler';
import styles from '@/styles/GameCard.module.css'
import { IconFlare, IconNumber0, IconBrandSketch, IconSkull, IconSpy } from '@tabler/icons';

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
    forRole?: string;
}

export default function TeamCard({text, type, opened, forRole}: GameCardProps) {

    const { screenSize } = useResizeHandler()

    return (
        <div className={`${styles.gameCardWrapper} ${opened ? styles.gameCardWrapperOpened : ''} ${forRole === 'spy' ? styles[type] : ''}`}>
            <div className={styles.gameCard}>
                <div className={styles.upper}>
                    <div className={styles.line}></div>
                    <IconSpy size={screenSize === 'desktop' ? 40 : (screenSize === 'xs' ? 20 : 30)} />
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
                        <IconNumber0 size={80}/>
                    }
                    {type === GameCardType.DEATH &&
                        <IconSkull size={80}/>
                    }
                </div>
            </div>
        </div>
    )
}