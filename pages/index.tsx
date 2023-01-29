import styles from '@/styles/Home.module.css'

import { FormEvent, useState } from 'react'
import { Button, Input } from '@mantine/core';
import { useRouter } from 'next/router';

export default function Home() {

    const [username, setUsername] = useState<string>('')
    const [usernameError, setUsernameError] = useState<string>('')
    const router = useRouter()

    const validateUsername = () => {
        return username.trim().length > 2
    }

    const handleSubmit = (e: FormEvent): void => {
        e.preventDefault()
        if (validateUsername()) {
            setUsernameError('')
            console.log('setting to localstorage, ', username)
            localStorage.setItem('username', username)
            router.push({pathname: '/game'})
        } else {
            setUsernameError('Ime mora imeti vsaj 3 znake')
        }
    }

    return (
        <main className={styles.main}>
            <h1 className={styles.title}>GESLA</h1>
            <div className={styles.container}>
                <h2 className={styles.subtitle}>Igra za 4 igralce, v kateri lahko uživajo vsi.<br />Narejena po znani namizni igri Codenames.</h2>
                <form className={styles.actions} onSubmit={handleSubmit}>
                    <label id="neki" className={styles.label}>neki</label>
                    <Input className={styles.input} placeholder="Ime" value={username} onChange={(e) => setUsername(e.target.value)} aria-label="neki" />
                    <Button className={styles.button} type="submit">Začni</Button>
                    <span className={styles.error}>{usernameError}</span>
                </form>
            </div>
        </main>
    )
}
