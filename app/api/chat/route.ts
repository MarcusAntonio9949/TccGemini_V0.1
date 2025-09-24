import { GoogleGenAI } from "@google/genai"
import { OpenAIStream, StreamingTextResponse} from "ai";
import { DataAPIClient } from "@datastax/astra-db-ts";


const { ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_API_APPLICATION_TOKEN,
    GEMINI_API_KEY} = process.env

const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
})

const client = new DataAPIClient(ASTRA_DB_API_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE })

export async function POST(req: Request) {
    try {
        const {messages} = await req.json()
        const latestMassage = messages[messages.length - 1]?.content

        let docContext = ""

        const response = await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: latestMassage,
            taskType: 'RETRIEVAL_QUERY'
        })

        try {
            const collection = await db.collection(ASTRA_DB_COLLECTION)
            const cursor = collection.find(null, {
                sort: {
                    $vector: embedding.data[0].embedding,
                },  
                limit: 10
            })

            const documents = await cursor.toArray()

            const docsMap = documents?.map(doc => doc.text)

            docContext = JSON.stringify(docsMap)
        } catch (err) {
            console.log("error quering db...")
            docContext = ""
        }

        const template = {
            role:"system",
            content:`
            
            -----------------
            START CONTEXT
            ${docContext}
            END CONTEXT 
            -----------------
            QUESTION: ${latestMassage}
            -----------------
            `,
        }

        const response = await ai.chat.completions.create({
            model: "gpt-4",
            stream: true,
            messages: [template, ...messages]
        })

        const stream = OpenAIStream(response)
        return new StreamingTextResponse(stream)
    }catch(err) {
        throw err
    }
}