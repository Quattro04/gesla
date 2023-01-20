import { useEffect, useState } from "react";
import styles from '@/styles/Game.module.css'
import TeamCard from "@/components/teamCard";

export default function Game() {

    const [roles, setRoles] = useState<Record<string, string>>({})

    useEffect(() => {
        const rl = localStorage.getItem('roles')
        if (rl) setRoles(JSON.parse(rl))
    }, [])

    return (
        <div className={styles.container}>
            <TeamCard team="blue" op={roles.blueOp} spy={roles.blueSpy} />
            <div className={styles.board}>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
                <div className={styles.tile}></div>
            </div>
            <TeamCard team="red" op={roles.redOp} spy={roles.redSpy} />
        </div>
    )
}