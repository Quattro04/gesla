import useResizeHandler from "@/hooks/use-resize-handler";
import { Badge, Button, Card, Group, Text, createStyles } from "@mantine/core";

const useStyles = createStyles((theme) => ({
    card: {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
    },

    headingRed: {
        borderBottom: `1px solid ${
          theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
        }`,
        background: theme.colors.red,
        paddingLeft: theme.spacing.md,
        paddingRight: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        paddingTop: theme.spacing.md,
    },

    headingBlue: {
        borderBottom: `1px solid ${
          theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
        }`,
        background: theme.colors.blue,
        paddingLeft: theme.spacing.md,
        paddingRight: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        paddingTop: theme.spacing.md,
    },

    heading: {
        borderBottom: `1px solid ${
          theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
        }`,
        paddingLeft: theme.spacing.md,
        paddingRight: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        paddingTop: theme.spacing.md,
    },
  
    section: {
        borderBottom: `1px solid ${
            theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
        }`,
        paddingLeft: theme.spacing.md,
        paddingRight: theme.spacing.md,
        paddingBottom: theme.spacing.md,
    },

    badge: {
        maxWidth: '100px'
    },

    freeBadge: {
        color: 'white',
        background: theme.colors.green
    },
    redBadge: {
        color: 'white',
        background: theme.colors.red
    },
    blueBadge: {
        color: 'white',
        background: theme.colors.blue
    },

    become: {
        marginTop: theme.spacing.md
    }
}));

interface TeamCardProps {
    team: "red" | "blue";
    op?: string;
    spy?: string;
    user?: string;
    changeRole?: (role: string) => void;
    cardsLeft?: number
}

export default function TeamCard({team, op, spy, user, changeRole, cardsLeft}: TeamCardProps) {

    const { classes } = useStyles();

    const { screenSize } = useResizeHandler()

    const getBadgeClass = (role: string) => {
        if (role === 'op') {
            if (!op) return classes.freeBadge
            if (team === 'red') return classes.redBadge
            return classes.blueBadge
        } else {
            if (!spy) return classes.freeBadge
            if (team === 'red') return classes.redBadge
            return classes.blueBadge
        }
    }

    return (
        <Card withBorder radius="md">
            <Card.Section className={classes[team === 'red' ? 'headingRed' : 'headingBlue']} mt="md">
                <Group position="apart">
                    <Text size={screenSize === 'desktop' ? 'lg' : 'sm'} weight={500}>
                        {team === 'blue' ? 'Modra ekipa' : 'Rdeča ekipa'}
                    </Text>
                    {cardsLeft !== undefined && (
                        <Badge size={screenSize === 'desktop' ? 'lg' : 'sm'}>
                            {cardsLeft}
                        </Badge>
                    )}
                </Group>
            </Card.Section>
            <Card.Section className={classes.section} mt="md">
                <Group position="apart">
                    <Text size={screenSize === 'desktop' ? 'lg' : 'sm'} weight={500}>
                        Vohun
                    </Text>
                    <Badge className={`${classes.badge} ${getBadgeClass('op')}`} size={screenSize === 'desktop' ? 'lg' : 'sm'}>
                        {op ? op : 'Prosto'}
                    </Badge>
                </Group>
                {!!changeRole &&
                    <>
                        {op === user &&
                            <Button className={classes.become} color="red" onClick={() => changeRole('')}>
                                Prekliči
                            </Button>
                        }
                        {op !== user &&
                            <Button className={classes.become} color="gray" onClick={() => changeRole(`${team}Op`)} disabled={!!op}>
                                Bodi Vohun
                            </Button>
                        }
                    </>
                }
            </Card.Section>
            <Card.Section className={classes.section} mt="md">
                <Group position="apart">
                    <Text size={screenSize === 'desktop' ? 'lg' : 'sm'} weight={500}>
                        Vodja
                    </Text>
                    <Badge className={`${classes.badge} ${getBadgeClass('spy')}`} size={screenSize === 'desktop' ? 'lg' : 'sm'}>
                        {spy ? spy : 'Prosto'}
                    </Badge>
                </Group>
                {!!changeRole &&
                    <>
                        {spy === user &&
                            <Button className={classes.become} color="red" onClick={() => changeRole('')}>
                                Prekliči
                            </Button>
                        }
                        {spy !== user &&
                            <Button className={classes.become} color="gray" onClick={() => changeRole(`${team}Spy`)} disabled={!!spy}>
                                Bodi Vodja
                            </Button>
                        }
                    </>
                    
                }
            </Card.Section>
        </Card>
    )
}