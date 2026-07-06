'use client';

import React, { useMemo, useState } from 'react';
import { DONATION_ADDRESSES, SYMBOL_META, SupportedSymbol } from '@/config/donations';
import { Dialog } from '@base-ui-components/react/dialog';
import { Copy, Check, ExternalLink } from 'lucide-react';

type Entry = {
  symbol: SupportedSymbol;
  address: string;
  label: string;
  scheme: string;
};

function buildUri(scheme: string, address: string): string {
  // Best-effort deeplink. Many wallets support bare scheme:address.
  // We keep it simple and avoid adding amount/memo params here.
  return `${scheme}:${address}`;
}

export const DonateDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void }>
  = ({ open, onOpenChange }) => {
    const entries = useMemo<Entry[]>(() => {
      return (Object.keys(DONATION_ADDRESSES) as SupportedSymbol[])
        .map((symbol) => ({
          symbol,
          address: String(DONATION_ADDRESSES[symbol] ?? ''),
          label: SYMBOL_META[symbol].label,
          scheme: SYMBOL_META[symbol].scheme,
        }))
        .filter((e) => !!e.address && e.address.trim().length > 0);
    }, []);

    const [copiedSymbol, setCopiedSymbol] = useState<SupportedSymbol | null>(null);

    const copyToClipboard = async (text: string, symbol: SupportedSymbol) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedSymbol(symbol);
        setTimeout(() => setCopiedSymbol(null), 1500);
      } catch (e) {
        console.error('Clipboard error', e);
      }
    };

    return (
      <Dialog.Root modal open={open} onOpenChange={(o) => onOpenChange(o)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[92vw] rounded-lg border border-white/10 bg-[#0b0e13] p-4 shadow-xl text-sm text-gray-200">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <Dialog.Title className="text-base font-semibold text-white">Thanks for supporting Gestalt</Dialog.Title>
                  <Dialog.Description className="mt-1 text-gray-400">
                    If you&apos;d like to contribute to ongoing development, you can donate using one of the addresses below.
                  </Dialog.Description>
                </div>
                <Dialog.Close className="rounded p-1 text-gray-400 hover:text-white hover:bg-white/10">✕</Dialog.Close>
              </div>

              <div className="mt-3 space-y-2">
                {entries.length === 0 && (
                  <p className="text-gray-400">No donation addresses are configured yet.</p>
                )}
                {entries.map((e) => (
                  <div key={e.symbol} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 p-2">
                    <div className="w-14 shrink-0 text-[11px] font-semibold text-gray-300">{e.symbol}</div>
                    <div className="flex-1 truncate font-mono text-[12px] text-gray-200" title={e.address}>{e.address}</div>
                    <button
                      className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-[11px] hover:bg-white/20"
                      onClick={() => copyToClipboard(e.address, e.symbol)}
                      aria-label={`Copy ${e.symbol} address`}
                    >
                      {copiedSymbol === e.symbol ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedSymbol === e.symbol ? 'Copied' : 'Copy'}
                    </button>
                    <a
                      className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-[11px] hover:bg-white/20"
                      href={buildUri(e.scheme, e.address)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open in wallet
                    </a>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[11px] text-gray-500">
                Only BTC, ETH, SOL, and XRP are supported. Make sure networks match your wallet.
              </div>
      </Dialog.Popup>
    </Dialog.Portal>
      </Dialog.Root>
    );
  };

export default DonateDialog;
