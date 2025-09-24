import { DataAPIClient } from "@datastax/astra-db-ts";
import { GoogleGenAI } from "@google/genai";
import { Document } from "@langchain/core/documents";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_API_APPLICATION_TOKEN,
    GEMINI_API_KEY
} = process.env;

if (!GEMINI_API_KEY || !ASTRA_DB_API_ENDPOINT || !ASTRA_DB_API_APPLICATION_TOKEN) {
    throw new Error("Variáveis de ambiente essenciais não foram definidas.");
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const client = new DataAPIClient(ASTRA_DB_API_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const ifbotData = [
    'https://portal.ifba.edu.br/noticias/2024/ingresso-2025-ifba-oferta-mais-de-5-mil-vagas-para-ingresso-em-cursos-tecnicos-em-22-campi',
];

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
});

const createCollection = async (similarityMetric: SimilarityMetric = "cosine") => {
    try {
        const res = await db.createCollection(ASTRA_DB_COLLECTION, {
            vector: {
                dimension: 768,
                metric: similarityMetric,
            },
        });
        console.log("Coleção criada (ou já existente):", res);
    } catch (e) {
        console.warn("A coleção provavelmente já existe. Continuando...");
    }
};

const loadSampleData = async () => {
    console.log("Carregando dados...");
    const collection = await db.collection(ASTRA_DB_COLLECTION);
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for await (const source of ifbotData) {
        const content = await scrapePage(source);
        if (!content) continue;

        const chunks = await splitter.splitText(content);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            const response = await ai.models.embedContent({
                model: "models/embedding-001",
                contents: chunk,
            });

            const vector = response.embeddings.values;

            const res = await collection.insertOne({
                $vector: vector,
                text: chunk
            });

            if ((i + 1) % 5 === 0 && i + 1 < chunks.length) {
                await sleep(1000);
            }
        }
    }
    console.log("Carregamento de dados concluído.");
};

const scrapePage = async (url: string): Promise<string | null> => {
    try {
        const loader = new PuppeteerWebBaseLoader(url, {
            launchOptions: {
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            },
        });
        const docs: Document[] = await loader.load();
        return docs.map(doc => doc.pageContent).join('\n\n');
    } catch (error) {
        console.error(`Falha ao processar a URL ${url}:`, error);
        return null;
    }
};
const main = async () => {
    await createCollection();
    await loadSampleData();
};

main().catch(console.error);