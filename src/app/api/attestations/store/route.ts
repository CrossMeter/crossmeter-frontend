import { NextRequest, NextResponse } from 'next/server';
import { insertAttestation } from '@/lib/supabase';

interface StoreAttestationRequest {
  paymentIntentId: string;
  attestation: string;
  messageHash: string;
  originalMessage: string;
  amount: number;
  sourceChain: string;
  destinationChain: string;
  vendorAddress: string;
  recipientAddress: string;
  burnTxHash: string;
  customerAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: StoreAttestationRequest = await request.json();

    // Validate required fields
    const requiredFields = [
      'paymentIntentId', 'attestation', 'messageHash', 'originalMessage',
      'amount', 'sourceChain', 'destinationChain', 'vendorAddress', 'burnTxHash', 'customerAddress'
    ];

    for (const field of requiredFields) {
      if (!data[field as keyof StoreAttestationRequest]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Prepare attestation data for Supabase
    const attestationData = {
      payment_intent_id: data.paymentIntentId,
      attestation: data.attestation,
      message_hash: data.messageHash,
      original_message: data.originalMessage,
      amount: data.amount,
      source_chain: data.sourceChain,
      destination_chain: data.destinationChain,
      vendor_address: data.vendorAddress.toLowerCase(),
      recipient_address: data.recipientAddress.toLowerCase(),
      customer_address: data.customerAddress.toLowerCase(),
      burn_tx_hash: data.burnTxHash,
      burn_timestamp: new Date().toISOString(),
      status: 'pending_mint' as const
    };

    console.log('💾 Storing Circle payment attestation in Supabase:', {
      paymentIntentId: attestationData.payment_intent_id,
      attestationLength: attestationData.attestation.length,
      messageHash: attestationData.message_hash,
      amount: attestationData.amount,
      sourceChain: attestationData.source_chain,
      destinationChain: attestationData.destination_chain,
      vendorAddress: attestationData.vendor_address,
      customerAddress: attestationData.customer_address,
      burnTxHash: attestationData.burn_tx_hash,
      status: attestationData.status
    });

    // Insert into Supabase
    const attestationId = await insertAttestation(attestationData);
    
    console.log('✅ Circle payment attestation stored successfully in Supabase:', {
      attestationId,
      paymentIntentId: data.paymentIntentId,
      vendorAddress: data.vendorAddress,
      amount: data.amount,
      status: 'pending_mint'
    });

    return NextResponse.json({
      success: true,
      attestationId,
      status: 'stored',
      message: 'Circle payment attestation stored successfully. Vendor can now mint on destination chain.',
      data: {
        paymentIntentId: data.paymentIntentId,
        amount: data.amount,
        sourceChain: data.sourceChain,
        destinationChain: data.destinationChain,
        vendorAddress: data.vendorAddress,
        burnTxHash: data.burnTxHash,
        status: 'pending_mint'
      }
    });

  } catch (error) {
    console.error('Failed to store attestation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to store attestation'
      },
      { status: 500 }
    );
  }
}