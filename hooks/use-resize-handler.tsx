import { useEffect, useState } from "react";

interface UseResizeHandlerReturn {
    screenSize: string;
    height: number;
}

export default function useResizeHandler(): UseResizeHandlerReturn {

    const [height, setHeight] = useState<number>(0)
    const [screenSize, setScreenSize] = useState<string>('desktop')

    useEffect(() => {

        const resizeHandler = () => {
            if (window.innerWidth >= 1600) {
                setScreenSize('desktop')
            }
            if (window.innerWidth >= 1200 && window.innerWidth < 1600) {
                setScreenSize('tablet')
            }
            if (window.innerWidth >= 800 && window.innerWidth < 1200) {
                setScreenSize('mobile')
            }
            if (window.innerWidth < 800) {
                setScreenSize('xs')
            }
            setHeight(window.innerHeight)
        }

        window.addEventListener('resize', resizeHandler)
        resizeHandler();

        return () => window.removeEventListener("resize", resizeHandler);
    }, [])


    return { screenSize, height }
}