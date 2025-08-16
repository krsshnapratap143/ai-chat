import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,   
})

export async function POST(request){
    try {
        const { message } = await request.json();
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", 
            messages: [{role: "user", content: message}],
            stream: true
        });
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
            async start(controller){
                for await (const chunk of stream){
                    const content = chunk.choices[0]?.delta?.content || ""
                    if(content){
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({content})}`))
                    }
                }
                controller.close()
            }
        })
        return new Response(readable, {
            headers: {
                'Content-Type' : "text/event-stream"
            }
        })

    } catch (error) {
        
    }
}