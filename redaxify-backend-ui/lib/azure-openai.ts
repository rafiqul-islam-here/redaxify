import axios from "axios";
import { MOCK_EXTERNAL_SERVICES } from "@/lib/mock";

export const generateSummaryFromDialogue = async (dialogue: string): Promise<string> => {
    if (MOCK_EXTERNAL_SERVICES) {
        return "This is a mock summary generated in offline mode (MOCK_EXTERNAL_SERVICES=true). No call was made to Azure OpenAI.";
    }

    const endpoint = process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT!;
    const apiKey = process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY!;
    const deploymentName = process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME!;
    const apiVersion = process.env.NEXT_PUBLIC_OPENAI_API_VERSION!;

    const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    const response = await axios.post(
        url,
        {
            messages: [
                {
                    role: "system",
                    content: "You summarize texts into 5-8 concise sentences, capturing key points without omissions.",
                },
                {
                    role: "user",
                    content: `Summarize the following paragraph in 5–8 sentences:\n\n${dialogue}`,
                },
            ],
            temperature: 0.4,
            max_tokens: 300,
        },
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey,
            },
        }
    );

    return response.data.choices[0].message.content.trim();
};
