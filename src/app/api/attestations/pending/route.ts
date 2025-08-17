import { NextRequest, NextResponse } from 'next/server';
import { getVendorAttestations, updateAttestationStatus, AttestationRecord } from '@/lib/supabase';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorAddress = searchParams.get('vendorAddress');
    const status = searchParams.get('status'); // Allow all statuses if not specified
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('📋 Fetching pending attestations for vendor dashboard:', {
      vendorAddress,
      status,
      limit,
      offset
    });

    if (!vendorAddress) {
      return NextResponse.json(
        { success: false, error: 'vendorAddress query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch attestations from Supabase
    const { attestations, total } = await getVendorAttestations(
      vendorAddress,
      status || undefined,
      limit,
      offset
    );

    // Convert database format to API format
    const formattedAttestations = attestations.map((att: AttestationRecord) => ({
      id: att.id,
      paymentIntentId: att.payment_intent_id,
      attestation: att.attestation,
      messageHash: att.message_hash,
      originalMessage: att.original_message,
      amount: att.amount,
      sourceChain: att.source_chain,
      destinationChain: att.destination_chain,
      vendorAddress: att.vendor_address,
      recipientAddress: att.recipient_address,
      customerAddress: att.customer_address,
      burnTxHash: att.burn_tx_hash,
      burnTimestamp: att.burn_timestamp,
      mintTxHash: att.mint_tx_hash,
      mintTimestamp: att.mint_timestamp,
      createdAt: att.created_at,
      updatedAt: att.updated_at,
      status: att.status
    }));

    // Get all attestations for status summary (without pagination)
    const { attestations: allAttestations } = await getVendorAttestations(
      vendorAddress,
      undefined, // no status filter
      1000, // large limit for summary
      0
    );

    console.log('✅ Vendor attestations fetched from Supabase:', {
      vendorAddress,
      totalCount: total,
      returnedCount: formattedAttestations.length,
      statuses: formattedAttestations.map(att => att.status)
    });

    return NextResponse.json({
      success: true,
      attestations: formattedAttestations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      summary: {
        pending_mint: allAttestations.filter(att => att.status === 'pending_mint').length,
        minting: allAttestations.filter(att => att.status === 'minting').length,
        minted: allAttestations.filter(att => att.status === 'minted').length,
        failed: allAttestations.filter(att => att.status === 'failed').length
      }
    });

  } catch (error) {
    console.error('Failed to fetch pending attestations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch pending attestations'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { attestationId, status, mintTxHash, vendorAddress } = await request.json();

    console.log('🔄 Updating attestation status:', {
      attestationId,
      status,
      mintTxHash: mintTxHash ? `${mintTxHash.slice(0, 10)}...` : null,
      vendorAddress
    });

    if (!attestationId || !status) {
      return NextResponse.json(
        { success: false, error: 'attestationId and status are required' },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ['pending_mint', 'minting', 'minted', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update attestation status in Supabase
    await updateAttestationStatus(attestationId, status, mintTxHash);

    const updateData = {
      attestationId,
      status,
      mintTxHash: mintTxHash || null,
      mintTimestamp: status === 'minted' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    };

    console.log('✅ Attestation status updated in Supabase:', updateData);

    return NextResponse.json({
      success: true,
      message: `Attestation status updated to ${status}`,
      data: updateData
    });

  } catch (error) {
    console.error('Failed to update attestation status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update attestation status'
      },
      { status: 500 }
    );
  }
}