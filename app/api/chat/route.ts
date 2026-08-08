import { NextRequest, NextResponse } from 'next/server';
import connectToMySQL from '@/lib/mysql';
import { chatMessageSchema } from '@/lib/validations';

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'admin';
  text: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input using Zod
    const validationResult = chatMessageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { sessionId, message, sender } = validationResult.data;

    const mysql = await connectToMySQL();
    
    // Add new message to database
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender,
      text: message,
      timestamp: Date.now(),
    };

    await mysql.execute(
      `INSERT INTO chat_messages (id, session_id, sender, text, timestamp)
       VALUES (?, ?, ?, ?, ?)`,
      [newMessage.id, sessionId, sender, message, newMessage.timestamp]
    );

    // Auto-reply from admin if customer sends a message (demo)
    if (sender === 'customer') {
      setTimeout(async () => {
        try {
          const adminReply: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sender: 'admin',
            text: 'Thank you for your message! Our team will get back to you shortly.',
            timestamp: Date.now(),
          };
          await mysql.execute(
            `INSERT INTO chat_messages (id, session_id, sender, text, timestamp)
             VALUES (?, ?, ?, ?, ?)`,
            [adminReply.id, sessionId, adminReply.sender, adminReply.text, adminReply.timestamp]
          );
        } catch (error) {
          console.error('Error sending auto-reply:', error);
        }
      }, 1000);
    }

    // Fetch all messages for this session
    const [rows] = await mysql.execute(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC',
      [sessionId]
    ) as any;

    const messages = rows.map((row: any) => ({
      id: row.id,
      sender: row.sender,
      text: row.text,
      timestamp: row.timestamp,
    }));

    return NextResponse.json({
      success: true,
      message: newMessage,
      allMessages: messages,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }

    const mysql = await connectToMySQL();
    const [rows] = await mysql.execute(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC',
      [sessionId]
    ) as any;

    const messages = rows.map((row: any) => ({
      id: row.id,
      sender: row.sender,
      text: row.text,
      timestamp: row.timestamp,
    }));

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }

    const mysql = await connectToMySQL();
    await mysql.execute(
      'DELETE FROM chat_messages WHERE session_id = ?',
      [sessionId]
    );

    return NextResponse.json({
      success: true,
      message: 'Chat session deleted',
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete chat session' },
      { status: 500 }
    );
  }
}
