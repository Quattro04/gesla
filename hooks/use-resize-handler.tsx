import { useEffect, useState } from "react";

interface UseResizeHandlerReturn {
    screenSize: string;
}

export default function useResizeHandler(): UseResizeHandlerReturn {

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
        }

        window.addEventListener('resize', resizeHandler)
        resizeHandler();

        return () => window.removeEventListener("resize", resizeHandler);
    }, [])


    return { screenSize }
}