"use client"
import  Image from "next/image"
import IFLogo from "./assets/iFLogo.png"
import { useChat } from "ai/react"
import { Message } from "ai"
import Bubbles from "./components/Bubble"
import LoadingBubble from "./components/LoadingBubble"
import PromptSuggestionsRow from "./components/PromptSuggestionsRow";
import Bubble from "./components/Bubble";
import {handlePagesErrorRoute} from "next/dist/server/dev/turbopack-utils";

const Home = () => {
    const { append, isLoading, messages, input, handleInputChange, handleSubmit } = useChat()
    const noMessages = !messages || messages.length === 0

    const handlePrompt = ( promptText ) => {
            const msg: Message = {
                id: crypto.randomUUID(),
                content: promptText,
                role:"user"
        }
        append(msg)
    }

    return (
        <main>
            <Image src={IFLogo} width="250" height="250" alt="logo" />
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            Bem Vindo a inteligencia artifical criada por um ifbano para outros ifbanos
                        </p>
                        <br/>
                        <PromptSuggestionsRow onPromptCLick={handlePrompt}/>
                    </>
                ) : (
                        <>
                            {messages.map ((message, index) => <Bubble key={`message-${index}`} message={message}/>)}
                        {isLoading && <LoadingBubble/>}
    </>
                )}
            </section>
            <form onSubmit= {handleSubmit}>
                <input className="question-box" onChange={handleInputChange} value={input} placeholder="Take our artificial intelligence for a test drive" />
                <input type="submit" />
            </form>
        </main>
    )
}

export default Home