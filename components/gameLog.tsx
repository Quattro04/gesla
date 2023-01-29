import React, { FormEvent, ReactNode, useState } from "react";
import { Badge, TextInput, Card, Text, createStyles } from "@mantine/core";
import styles from '@/styles/GameLog.module.css'
import useResizeHandler from "@/hooks/use-resize-handler";

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
        "z-index": 1
    },
    section: {
        borderBottom: `1px solid ${
            theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
        }`,
    },
    sectionBigger: {
        flex: '1 1 0'
    },
    redBadge: {
        color: 'white',
        background: theme.colors.red
    },
    blueBadge: {
        color: 'white',
        background: theme.colors.blue
    },
    grayBadge: {
        color: 'white',
        background: '#666666'
    },
    blackBadge: {
        color: 'white',
        background: '#000000'
    },
}))

interface GameLogProps {
    title: string;
    userRole: string | undefined;
    gameLog: GameLogType[];
    children?: ReactNode
    style?: any;
    onClue: (clue: string) => void;
}

export interface GameLogType {
    id: string;
    user: {
        name: string;
        team: string;
    }
    text: string;
    item: {
        name: string;
        color: string;
    }
}

export default function GameLog({ title, userRole, children, style = {}, gameLog, onClue }: GameLogProps) {

    const { classes } = useStyles();
    const [clue, setClue] = useState<string>('')
    const [clueError, setClueError] = useState<string>('')
    const { screenSize } = useResizeHandler()

    const getBadgeClass = (color: string) => {
        if (color === 'red') return classes.redBadge
        if (color === 'blue') return classes.blueBadge
        if (color === 'neutral') return classes.grayBadge
        if (color === 'death') return classes.blackBadge
    }

    const handleSubmit = (e: FormEvent): void => {
        e.preventDefault()
        if (validateClue()) {
            setClueError('')
            setClue('')
            onClue(clue)
        } else {
            setClueError('Namig mora biti v formatu: <beseda> <število>')
        }
    }

    const validateClue = (): boolean => {
        const spl = clue.split(' ')
        return spl.length === 2 && spl[1].length === 1 && !!Number(spl[1])
    }

    return (
        <Card withBorder radius="md" style={style}>
            <Card.Section className={classes.heading} mt="md">
                <Text size={screenSize === 'desktop' ? 'lg' : 'sm'} weight={500}>
                    {title}
                </Text>
            </Card.Section>
            <Card.Section className={`${classes.section} ${classes.sectionBigger}`} mt="md">
                <div className={styles.logContainerOuter}>
                    <div className={styles.logContainerinner}>
                        {gameLog.map(log => (
                            <Text key={log.id} size="sm" bg={log.user.team === 'blue' ? "#183550" : "#501818"} py={3} px={10}>
                                <Badge className={getBadgeClass(log.user.team)} size="sm">
                                    {log.user.name}
                                </Badge>
                                <span className={styles.middleText}>{log.text}</span>
                                <Badge className={getBadgeClass(log.item.color)} size="sm">
                                    {log.item.name}
                                </Badge>
                            </Text>
                        ))}
                    </div>
                </div>
            </Card.Section>
            {userRole === 'spy' && (
                <Card.Section className={classes.section} mt="md">
                    <form onSubmit={handleSubmit}>
                        <TextInput
                            placeholder="Daj namig"
                            label={clueError}
                            value={clue}
                            onChange={(e) => setClue(e.target.value)}
                        />
                    </form>
                </Card.Section>
            )}
        </Card>
    )
}