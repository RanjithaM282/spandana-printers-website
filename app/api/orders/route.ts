import { NextRequest, NextResponse } from 'next/server';
import type { Order } from '@/lib/database';
import { saveOrder, getOrders, updateOrder, deleteOrder, sendOrderConfirmationEmail } from '@/lib/database';

// GET all orders or specific order for tracking
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const email = searchParams.get('email');
    
    // If orderId and email are provided, return specific order for tracking
    if (orderId && email) {
      const orders = await getOrders();
      const order = orders.find(o => o.id === orderId && o.customerEmail === email);
      
      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true, data: order });
    }
    
    // Otherwise, return all orders (for admin)
    const orders = await getOrders();
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// DELETE an order
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    const success = await deleteOrder(id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}

// POST new order
export async function POST(request: NextRequest) {
  try {
    // Check if this is a file upload request
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('multipart/form-data')) {
      return handleFileUpload(request);
    }
    
    // Regular order creation
    const orderData: Order = await request.json();
    const order = await saveOrder(orderData);
    
    // Send confirmation email
    const emailResult = await sendOrderConfirmationEmail(order);
    if (!emailResult.success) {
      console.error('Failed to send confirmation email:', emailResult.error);
      // Continue even if email fails
    }
    
    return NextResponse.json({ 
      success: true, 
      data: order,
      message: 'Order created successfully. Confirmation email sent.'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

async function handleFileUpload(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const { writeFile, mkdir } = await import('fs/promises');
    const { join } = await import('path');
    
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    console.log('📁 Creating uploads directory:', uploadsDir);
    try {
      await mkdir(uploadsDir, { recursive: true });
      console.log('✅ Uploads directory created/verified');
    } catch (error: any) {
      console.error('❌ Failed to create uploads directory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { success: false, error: 'Failed to create uploads directory: ' + errorMessage },
        { status: 500 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = join(uploadsDir, filename);

    console.log('📄 Saving file:', {
      originalName: file.name,
      filename,
      filepath,
      size: file.size,
      type: file.type
    });

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    try {
      await writeFile(filepath, buffer);
      console.log('✅ File saved successfully:', filepath);
    } catch (writeError) {
      console.error('❌ Failed to save file:', writeError);
      const writeErrorMessage = writeError instanceof Error ? writeError.message : 'Unknown write error';
      return NextResponse.json(
        { success: false, error: 'Failed to save file: ' + writeErrorMessage },
        { status: 500 }
      );
    }

    // Return the public URL
    const fileUrl = `/uploads/${filename}`;
    console.log('🔗 File URL generated:', fileUrl);
    
    return NextResponse.json({
      success: true,
      fileUrl,
      filename
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// PUT update order
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('PUT request body:', body);
    
    const { id, ...updateData }: Order & { id: string } = body;
    console.log('Updating order with ID:', id);
    console.log('Update data:', updateData);
    
    const order = await updateOrder(id, updateData);
    console.log('Order updated successfully:', order);
    
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('PUT error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update order';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}