import { NextRequest, NextResponse } from 'next/server';

// This would normally be imported from a shared module
let mockClients = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+27 11 123 4567',
    company: 'Smith Construction',
    address: '123 Main Street, Johannesburg, 2001',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@techsolutions.co.za',
    phone: '+27 21 987 6543',
    company: 'Tech Solutions',
    address: '456 Business Ave, Cape Town, 8001',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'Mike Wilson',
    email: 'mike.wilson@gmail.com',
    phone: '+27 31 555 0123',
    company: 'Wilson Consulting',
    address: '789 Office Park, Durban, 4001',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    const clientIndex = mockClients.findIndex(client => client.id === clientId);

    if (clientIndex === -1) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Remove client from mock storage
    mockClients.splice(clientIndex, 1);

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}