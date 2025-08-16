// import OpenAI from "openai";

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY
// }); 

// export async function POST(request){
//     try{
//         const {message} = await request.json()
//         const completion = await openai.chat.completions.create({
//             model: "gpt-3.5-turbo",
//             messages: [{role: "user", content: message}] 
//         })
//         return Response.json({
//             response: completion.choices[0].message.content, 
//         });
//     }
//     catch (error) {
//         return Response.json(
//             {
//                 error: "failed to process request"
//             },
//             {
//                 status: 500
//             }
//         )
//     }
// }

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // Verify API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return Response.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const { message } = await request.json();
    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Invalid or missing message in request body' },
        { status: 400 }
      );
    }

    // Make OpenAI API call
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
    });

    return Response.json({
      response: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('Error in /api/chat:', error.message, error.stack);
    return Response.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}