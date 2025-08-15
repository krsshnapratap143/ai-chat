import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
}); 

export async function POST(request){
    try{
        const {message} = await request.json()
        
    }
    catch (error) {
        
    }
}