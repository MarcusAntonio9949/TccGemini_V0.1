
import "./global.css"

export const metadata = {
    title: "IfBot",
    description: "Socorro"
}

const RootLayout = ({ children }) => {
    return (
        <html>
        <body>{children}</body>
        </html>
    )
}

export default RootLayout