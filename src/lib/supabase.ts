import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types for attestations table
export interface AttestationRecord {
  id: string;
  payment_intent_id: string;
  attestation: string;
  message_hash: string;
  original_message: string;
  amount: number;
  source_chain: string;
  destination_chain: string;
  vendor_address: string;
  recipient_address: string;
  customer_address: string;
  burn_tx_hash: string;
  burn_timestamp: string;
  mint_tx_hash?: string;
  mint_timestamp?: string;
  status: 'pending_mint' | 'minting' | 'minted' | 'failed';
  created_at: string;
  updated_at: string;
}

// Insert new attestation
export async function insertAttestation(data: Omit<AttestationRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const { data: result, error } = await supabase
    .from('attestations')
    .insert([{
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select('id')
    .single();

  if (error) {
    console.error('❌ Supabase insert error:', error);
    throw new Error(`Failed to insert attestation: ${error.message}`);
  }

  console.log('✅ Attestation inserted successfully:', result.id);
  return result.id;
}

// Get attestations for vendor
export async function getVendorAttestations(
  vendorAddress: string,
  status?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ attestations: AttestationRecord[]; total: number }> {
  let query = supabase
    .from('attestations')
    .select('*', { count: 'exact' })
    .eq('vendor_address', vendorAddress.toLowerCase())
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ Supabase query error:', error);
    throw new Error(`Failed to fetch attestations: ${error.message}`);
  }

  return {
    attestations: data || [],
    total: count || 0
  };
}

// Update attestation status
export async function updateAttestationStatus(
  attestationId: string,
  status: AttestationRecord['status'],
  mintTxHash?: string
): Promise<void> {
  const updateData: Partial<AttestationRecord> = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'minted' && mintTxHash) {
    updateData.mint_tx_hash = mintTxHash;
    updateData.mint_timestamp = new Date().toISOString();
  }

  const { error } = await supabase
    .from('attestations')
    .update(updateData)
    .eq('id', attestationId);

  if (error) {
    console.error('❌ Supabase update error:', error);
    throw new Error(`Failed to update attestation: ${error.message}`);
  }

  console.log('✅ Attestation status updated successfully:', attestationId);
}

// Get attestation by ID
export async function getAttestationById(attestationId: string): Promise<AttestationRecord | null> {
  const { data, error } = await supabase
    .from('attestations')
    .select('*')
    .eq('id', attestationId)
    .single();

  if (error) {
    console.error('❌ Supabase query error:', error);
    return null;
  }

  return data;
}