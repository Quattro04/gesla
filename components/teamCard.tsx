import { Badge, Button, Card, Group, Text, createStyles } from "@mantine/core";

const useStyles = createStyles((theme) => ({
    card: {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
    },

    headingRed: {
        minWidth: '250px',
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
        minWidth: '250px',
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
        background: theme.colors.green
    },

    become: {
        marginTop: theme.spacing.md
    }
}));

interface TeamCardProps {
    team: "red" | "blue";
    op?: string;
    spy?: string;
    changeRole?: (role: string) => void;
}

interface Team {}

export default function TeamCard({team, op, spy, changeRole}: TeamCardProps) {

    const { classes } = useStyles();

    return (
        <Card withBorder radius="md">
            <Card.Section className={classes[team === 'red' ? 'headingRed' : 'headingBlue']} mt="md">
                <Text size="lg" weight={500}>
                    {team === 'blue' ? 'Modra ekipa' : 'Rdeča ekipa'}
                </Text>
            </Card.Section>
            <Card.Section className={classes.section} mt="md">
                <Group position="apart">
                    <Text size="lg" weight={500}>
                        Vohun
                    </Text>
                    <Badge className={`${classes.badge} ${!op ? classes.freeBadge : ''}`} size="lg">
                        {op ? op : 'Prosto'}
                    </Badge>
                </Group>
                {!!changeRole &&
                    <Button className={classes.become} variant="default" color="gray" onClick={() => changeRole(`${team}Op`)} disabled={!!op}>
                        Bodi Vohun
                    </Button>
                }
            </Card.Section>
            <Card.Section className={classes.section} mt="md">
                <Group position="apart">
                    <Text size="lg" weight={500}>
                        Vodja
                    </Text>
                    <Badge className={`${classes.badge} ${!spy ? classes.freeBadge : ''}`} size="lg">
                        {spy ? spy : 'Prosto'}
                    </Badge>
                </Group>
                {!!changeRole &&
                    <Button className={classes.become} variant="default" color="gray" onClick={() => changeRole(`${team}Spy`)} disabled={!!spy}>
                        Bodi Vodja
                    </Button>
                }
            </Card.Section>
        </Card>
    )
}